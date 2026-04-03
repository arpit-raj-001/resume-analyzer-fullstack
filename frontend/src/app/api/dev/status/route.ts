import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const password = process.env.ADMIN_PASSWORD || "resuai_dev_2026";
  
  if (authHeader !== `Bearer ${password}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ 
    success: true,
    env: {
      geminiKeys: 8,
      groqReady: !!process.env.GROQ_API_KEY
    }
  });
}
