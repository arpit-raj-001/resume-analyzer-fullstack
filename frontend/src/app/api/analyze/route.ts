import { NextRequest, NextResponse } from "next/server";
import { runAIQuery } from "@/lib/ai-handler";

// Configuration for analysis
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a professional resume analyzer. Analyze the provided resume file completely synthetically via your vision/PDF understanding layer and return a structured JSON response. Be specific, actionable, and honest.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "summary": "A concise 2-3 sentence professional summary of the candidate",
  "skills": ["skill1", "skill2", "..."],
  "strengths": ["strength1", "strength2", "..."],
  "weaknesses": ["weakness1", "weakness2", "..."],
  "suggestions": ["suggestion1", "suggestion2", "..."],
  "experience": ["experience1", "experience2", "..."],
  "suggestedJobs": ["job1", "job2", "..."],
  "projects": ["project1", "project2", "..."],
  "atsScore": 75
}

Rules:
- "skills" should list all technical and soft skills found
- "strengths" should highlight what the candidate does well (3-5 items)
- "weaknesses" should identify gaps or areas for improvement (3-5 items)
- "suggestions" should give specific, actionable advice to improve the resume (4-6 items)
- "experience" should list key work experiences or roles mentioned
- "suggestedJobs" should recommend 3-5 job titles that fit this candidate
- "projects" should list notable projects mentioned
- "atsScore" should be a number 0-100 estimating how well this resume would pass ATS systems
- Be professional but direct
- Return ONLY the JSON object, nothing else`;

import { auth } from "@clerk/nextjs/server";
import { consumeCredits, CREDIT_COSTS } from "@/lib/credits-server";

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // Check and deduct 10 credits
    const creditCheck = await consumeCredits(clerkId, CREDIT_COSTS.ANALYZE);
    if (!creditCheck.success) {
      return NextResponse.json({ 
        error: "Insufficient credits", 
        credits: creditCheck.credits,
        required: CREDIT_COSTS.ANALYZE
      }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    // Vercel Hobby limit is 4.5MB. Checking here to return JSON instead of Vercel's 413 HTML.
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 4.5MB limit for this environment." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Lazy load pdf-parse only if needed to avoid top-level module load crashes
    let pdfText = "[PDF Text Extraction Skipped]";
    try {
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        pdfText = data.text;
    } catch (e) {
        console.warn("Non-critical: PDF text extraction failed or library not available:", e);
    }

    const result = await runAIQuery({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: "Analyze this specific resume PDF file exactly according to instructions:",
        pdfBuffer: buffer,
        pdfText: pdfText
    });

    if (!result || !result.text) {
        throw new Error("AI provider returned an empty response.");
    }

    // Clean any markdown fences if the model still output them
    const cleaned = result.text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
      if (typeof analysis.atsScore === 'string') {
         analysis.atsScore = parseInt(analysis.atsScore.replace(/[^0-9]/g, '')) || 70;
      }
    } catch (err) {
      console.error("JSON Parse Error. Cleaned text:", cleaned);
      return NextResponse.json(
        { error: "AI returned invalid format. Please try again.", raw: cleaned },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
        analysis, 
        meta: {
            modelUsed: result.modelUsed,
            isFallback: result.isFallback,
            exhausted: result.exhaustedKeys
        }
    });
  } catch (error) {
    const err = error as Error;
    console.error("Critical Analysis Error:", err);
    return NextResponse.json({ 
        error: err.message || "A catastrophic error occurred",
        status: 500
    }, { status: 500 });
  }
}
