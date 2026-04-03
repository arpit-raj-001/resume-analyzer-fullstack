import { NextRequest, NextResponse } from "next/server";
import { runAIQuery } from "@/lib/ai-handler";

export const maxDuration = 60; // Extend serverless limit.

const SYSTEM_PROMPT = `You are an expert career counselor. Analyze the provided resume structure.
Return EXCLUSIVELY a pure JSON object matching this exact structure:
{
  "roles": ["Frontend Developer", "React Engineer"], // 3 to 5 highly relevant job titles
  "parsedText": "Candidate has 3 years of experience in React, Node.js..." // A detailed text extraction summarizing all core skills, metrics, and experience in the PDF.
}

Do NOT output Markdown. Do NOT output a JSON string wrapper. Return ONLY the raw JSON object.`;

import { auth } from "@clerk/nextjs/server";
import { consumeCredits, CREDIT_COSTS } from "@/lib/credits-server";

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // Check and deduct 5 credits
    const creditCheck = await consumeCredits(clerkId, CREDIT_COSTS.SUGGEST_ROLES);
    if (!creditCheck.success) {
      return NextResponse.json({ 
        error: "Insufficient credits", 
        credits: creditCheck.credits,
        required: CREDIT_COSTS.SUGGEST_ROLES
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

    // Checking 4.5MB limit to return JSON instead of Vercel HTML
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (4.5MB limit)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfText = "[Extraction Skipped]";
    try {
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        pdfText = data.text;
    } catch (e) {
        console.warn("Non-critical: PDF text extraction failed:", e);
    }

    const result = await runAIQuery({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: "Here is the candidate's custom PDF file:",
        pdfBuffer: buffer,
        pdfText: pdfText
    });

    if (!result || !result.text) {
        throw new Error("AI provider returned empty response.");
    }

    const rawText = result.text || "{}";
    const cleaned = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let roles: string[] = [];
    let parsedText: string = "";
    try {
      const parsedJSON = JSON.parse(cleaned);
      roles = Array.isArray(parsedJSON.roles) ? parsedJSON.roles : ["Software Engineer", "Product Manager", "Data Analyst"];
      parsedText = parsedJSON.parsedText || "Resume extracted successfully by AI.";
    } catch (err) {
      console.error("JSON Parse Error for roles:", cleaned);
      return NextResponse.json(
        { error: "AI returned invalid format. Please try again.", raw: cleaned },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
        roles, 
        parsedText,
        meta: {
            modelUsed: result.modelUsed,
            isFallback: result.isFallback,
            exhausted: result.exhaustedKeys
        }
    });
  } catch (error) {
    const err = error as Error;
    console.error("Critical Role Suggestion Error:", err);
    return NextResponse.json({ 
        error: err.message || "A catastrophic error occurred",
        status: 500
    }, { status: 500 });
  }
}
