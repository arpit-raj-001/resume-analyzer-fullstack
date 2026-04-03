import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  const user = await currentUser();
  
  if (!clerkId || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { transactionId, planName, amount, credits } = await request.json();

    if (!transactionId || transactionId.length < 5) {
      return NextResponse.json({ error: "Invalid Transaction ID" }, { status: 400 });
    }

    const timestamp = Date.now();
    const claimKey = `claim:${clerkId}:${timestamp}`;
    const claimData = {
      redisKey: claimKey,
      userId: clerkId,
      email: user.primaryEmailAddress?.emailAddress || "N/A",
      name: user.fullName || "User",
      transactionId,
      planName,
      amount,
      credits,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // 1. Add to Global Admin Pool
    await redis.sadd("pending_claims", claimKey);
    await redis.set(claimKey, JSON.stringify(claimData));

    // 2. Add to User History (for Notification Section)
    const historyKey = `user:history:${clerkId}`;
    await redis.lpush(historyKey, JSON.stringify(claimData));
    await redis.ltrim(historyKey, 0, 19); // Keep last 20 entries

    return NextResponse.json({ success: true, message: "Claim submitted for verification." });
  } catch (error: any) {
    console.error("Payment Claim Error:", error);
    return NextResponse.json({ error: "Failed to submit claim" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json([], { status: 401 });

    try {
        const historyKey = `user:history:${clerkId}`;
        const history: any[] = await redis.lrange(historyKey, 0, -1);
        return NextResponse.json(history || []);
    } catch (e) {
        return NextResponse.json([]);
    }
}
