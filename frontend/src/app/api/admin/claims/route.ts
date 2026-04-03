import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const adminPassword = process.env.ADMIN_PASSWORD || "Aadz1206@";

  if (authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const claimKeys = await redis.smembers("pending_claims");
    const claims = [];

    for (const key of claimKeys) {
        const data = await redis.get<any>(key);
        if (data) {
            claims.push({ ...data, redisKey: key });
        }
    }

    // Sort by newest first
    claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(claims);
  } catch (error: any) {
    console.error("Admin Fetch Claims Error:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const adminPassword = process.env.ADMIN_PASSWORD || "Aadz1206@";

    if (authHeader !== `Bearer ${adminPassword}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { action, redisKey, userId, credits, transactionId } = await request.json();
        const historyKey = `user:history:${userId}`;

        if (action === "approve") {
            const userKey = `user:${userId}`;
            
            // 1. Increment balance
            await redis.hincrby(userKey, "credits", credits);
            
            // 2. Sync History: Update the specific transaction to 'approved'
            const history: any[] = await redis.lrange(historyKey, 0, -1);
            const updatedHistory = history.map(item => {
                const parsed = typeof item === 'string' ? JSON.parse(item) : item;
                if (parsed.transactionId === transactionId) {
                    return { ...parsed, status: "approved" };
                }
                return parsed;
            });
            
            await redis.del(historyKey);
            for (const item of updatedHistory.reverse()) {
                await redis.lpush(historyKey, JSON.stringify(item));
            }

            // 3. Clear local claim
            await redis.srem("pending_claims", redisKey);
            await redis.del(redisKey);
            
            return NextResponse.json({ success: true, message: "Approved & Synced." });
        }

        if (action === "deny") {
            // Sync History: Update the specific transaction to 'rejected'
            const history: any[] = await redis.lrange(historyKey, 0, -1);
            const updatedHistory = history.map(item => {
                const parsed = typeof item === 'string' ? JSON.parse(item) : item;
                if (parsed.transactionId === transactionId) {
                    return { ...parsed, status: "rejected" };
                }
                return parsed;
            });

            await redis.del(historyKey);
            for (const item of updatedHistory.reverse()) {
                await redis.lpush(historyKey, JSON.stringify(item));
            }

            // Clear local claim
            await redis.srem("pending_claims", redisKey);
            await redis.del(redisKey);
            return NextResponse.json({ success: true, message: "Rejected & Synced." });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Admin Action Error:", error);
        return NextResponse.json({ error: "Action failed" }, { status: 500 });
    }
}
