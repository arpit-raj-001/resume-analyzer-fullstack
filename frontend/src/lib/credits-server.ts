import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Consumed per feature
export const CREDIT_COSTS = {
  ANALYZE: 10,
  SUGGEST_ROLES: 5,
  SEARCH_JOBS: 5,
  DOWNLOAD: 5
};

function getTodayIST(): string {
  const now = new Date();
  // 12 AM IST (GMT+5:30) check
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
}

export async function syncUserCredits(clerkId: string) {
  const today = getTodayIST();
  const key = `user:${clerkId}`;
  
  // Fetch existing profile data
  const data = await redis.hgetall(key) as { credits?: number, lastReset?: string, redeemedTotal?: number } | null;

  if (!data || Object.keys(data).length === 0) {
    // New user initialization: Starting with 25 credits
    const newUser = {
      credits: 25,
      lastReset: today,
      redeemedTotal: 0
    };
    await redis.hset(key, newUser);
    return { ...newUser, clerkId };
  }

  // Daily top-up logic (12 AM IST)
  if (data.lastReset !== today) {
    const currentCredits = Number(data.credits || 0);
    let newCredits = currentCredits;

    // Only top up if balance is below 25. If user has > 25 (purchased), keep it.
    if (currentCredits < 25) {
      newCredits = 25;
    }

    await redis.hset(key, {
      credits: newCredits,
      lastReset: today
    });

    return { 
      credits: newCredits, 
      lastReset: today, 
      redeemedTotal: data.redeemedTotal || 0,
      clerkId 
    };
  }

  return { ...data, clerkId };
}

export async function consumeCredits(clerkId: string, amount: number) {
  const key = `user:${clerkId}`;
  
  // 1. Sync/Reset check
  const user = await syncUserCredits(clerkId);

  if ((Number(user.credits) || 0) < amount) {
    return { success: false, credits: user.credits };
  }

  // 2. Atomic decrement
  const newCredits = await redis.hincrby(key, "credits", -amount);

  return { success: true, credits: newCredits };
}

export async function addCredits(clerkId: string, amount: number) {
  const key = `user:${clerkId}`;
  const newCredits = await redis.hincrby(key, "credits", amount);
  return { success: true, credits: newCredits };
}

export async function redeemAdminCredits(clerkId: string, passwordAttempt: string) {
  if (passwordAttempt !== process.env.ADMIN_PASSWORD) {
    throw new Error("Invalid Master Key");
  }

  const key = `user:${clerkId}`;
  
  // Atomic multi-update isn't strictly needed for redeem, but we'll increment both
  const results = await Promise.all([
    redis.hincrby(key, "credits", 50),
    redis.hincrby(key, "redeemedTotal", 50)
  ]);

  return { success: true, credits: results[0] };
}
