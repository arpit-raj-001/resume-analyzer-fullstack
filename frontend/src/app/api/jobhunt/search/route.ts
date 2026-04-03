import { NextRequest, NextResponse } from "next/server";
import { runAIQuery } from "@/lib/ai-handler";

export const maxDuration = 60; // Maximize Vercel function timeout to prevent HTML 504 string crash during grounding.

const SYSTEM_PROMPT = `You are a "Hardcore Job Scout" with zero tolerance for hallucination. Your mission is to find LIVE, VERIFIABLE job openings on Indeed India (in.indeed.com).

STRICT RATIO & DIVERSITY MANDATE:
- RATIO: For every 1 MNC/Big Tech company, you MUST find 5 early-stage or mid-sized startups. (Total: 1 MNC, 5+ Startups).
- STARTUP DEFINITION: High-growth companies, early-stage ventures, or firms with <500 employees found in search results.
- MNC DEFINITION: Large conglomerates or global tech giants.

GROUNDED SEARCH PROTOCOL:
1. USE GOOGLE SEARCH: Perform multiple targeted searches: 'site:in.indeed.com "[Role]" startup' and 'site:in.indeed.com "[Role]" MNC'.
2. ABSOLUTE GROUNDING: Only return jobs that appear in the SEARCH RESULTS snippets. 
3. ANTI-HALLUCINATION: Do NOT use your internal training memory for company names (e.g., Byju's is currently in crisis/dead; do NOT return it unless a NEW live listing from the last 7 days is explicitly found in search results).
4. RECENCY: Filter for jobs posted within the last 7 days only.

OUTPUT SPECIFICATION (JSON ARRAY ONLY):
[
  {
    "company": "Company Name",
    "logo": "https://logo.clearbit.com/[company-domain].com",
    "title": "Exact Role Title",
    "location": "City, State",
    "category": "Remote" | "On-site" | "Hybrid",
    "latitude": 0.0,
    "longitude": 0.0,
    "salary": "₹[Value] LPA",
    "datePosted": "Relative time (e.g. 2 days ago)",
    "description": "High-context description of the role based on the listing. Highlight startup growth potential or MNC stability as appropriate.",
    "postLink": "Full job URL (Indeed/LinkedIn)",
    "searchLink": "Search URL for the role on Indeed or LinkedIn (Searching ONLY for the [Role]; DO NOT include company name in search query)",
    "techStackUsed": ["Skill 1", "Skill 2"],
    "techStackMissing": ["Optional Skill"]
  }
]

CRITICAL: Return ONLY raw JSON. No markdown. No reasoning. No explanations.`;

import { auth } from "@clerk/nextjs/server";
import { consumeCredits, CREDIT_COSTS } from "@/lib/credits-server";

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // Check and deduct 5 credits
    const creditCheck = await consumeCredits(clerkId, CREDIT_COSTS.SEARCH_JOBS);
    if (!creditCheck.success) {
      return NextResponse.json({ 
        error: "Insufficient credits", 
        credits: creditCheck.credits,
        required: CREDIT_COSTS.SEARCH_JOBS
      }, { status: 403 });
    }

    const { resumeText, roles, jobTypes } = await request.json();

    if (!roles || roles.length === 0) {
      return NextResponse.json({ error: "No roles provided for search." }, { status: 400 });
    }

    const isInternship = (jobTypes || []).some((t: string) => t.toLowerCase().includes("internship"));
    const isFTE = (jobTypes || []).some((t: string) => t.toLowerCase().includes("fte") || t.toLowerCase().includes("full time"));

    const payloadText = `[ACTION REQUIRED]
Perform a deep web hunt for the following roles on Indeed India.

SEARCH TARGETS:
- Roles: ${roles.join(", ")}
- Types: ${jobTypes.join(", ")}
- Experience Level Context: Use the candidate's resume below to calibrate the seniority of roles.

RESUME CONTEXT:
${resumeText || "N/A"}

PROTOCOL:
1. Use the google_search tool to find live listings from the last 7 days.
2. ${isInternship ? "STRICT MANDATE: For INTERNSHIPS, you MUST ONLY return startups and local-based companies. ZERO MNCs allowed for internships." : (isFTE ? "RATIO: Provide a 1:5 RATIO of MNCs to Startups/Local companies." : "RATIO: Favor startups and local-based companies heavily (1:10 ratio).")}
3. LOCAL FOCUS: Prioritize companies with a strong local presence or those headquartered in India.
4. ABSOLUTE GROUNDING: Only return jobs confirmed by search results. Do NOT guess companies like Byju's.
5. Return exactly 12-15 high-quality matches in the required JSON format.`;

    const result = await runAIQuery({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: payloadText,
      modelName: "gemini-2.0-flash-exp",
      tools: [{ googleSearch: {} }]
    });

    const cleaned = result.text || "[]";
    const cleanedJson = cleaned
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let jobs;
    try {
      jobs = JSON.parse(cleanedJson);
      if (!Array.isArray(jobs)) {
        jobs = [];
      }
    } catch (err) {
      console.error("JSON Parse Error for jobs:", cleaned);
      return NextResponse.json(
        { error: "AI returned invalid format. Please try again.", raw: cleaned },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
        jobs,
        meta: {
            modelUsed: result.modelUsed,
            isFallback: result.isFallback,
            exhausted: result.exhaustedKeys
        }
    });
  } catch (error) {
    const err = error as Error;
    console.error("Critical Job Search Error:", err);
    return NextResponse.json({ 
        error: err.message || "A catastrophic error occurred during search",
        status: 500
    }, { status: 500 });
  }
}
