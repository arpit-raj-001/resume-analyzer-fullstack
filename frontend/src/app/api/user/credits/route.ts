import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { syncUserCredits, redeemAdminCredits, consumeCredits, CREDIT_COSTS } from "@/lib/credits-server";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await syncUserCredits(clerkId);
    return NextResponse.json({ 
      credits: user.credits,
      lastReset: user.lastReset,
      costs: CREDIT_COSTS
    });
  } catch (error) {
    return NextResponse.json({ error: "DB Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, code } = await request.json();

  try {
    if (action === "redeem") {
      const result = await redeemAdminCredits(clerkId, code);
      return NextResponse.json(result);
    }
    
    if (action === "consume_download") {
      const result = await consumeCredits(clerkId, CREDIT_COSTS.DOWNLOAD);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Action failed" }, { status: 400 });
  }
}
