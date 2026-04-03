export interface UsageStats {
  counts: Record<string, number>;
  exhausted: string[];
  lastReset: string; // YYYY-MM-DD
}

const STORAGE_KEY = "resuai_usage_stats";

function getTodayString(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
}

export function getUsageStats(): UsageStats {
  if (typeof window === "undefined") return { counts: {}, exhausted: [], lastReset: getTodayString() };
  
  const saved = localStorage.getItem(STORAGE_KEY);
  const today = getTodayString();
  
  if (saved) {
    const parsed = JSON.parse(saved) as UsageStats;
    // Daily reset check
    if (parsed.lastReset !== today) {
      const reset = { counts: {}, exhausted: [], lastReset: today };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
      return reset;
    }
    return parsed;
  }
  
  const initial = { counts: {}, exhausted: [], lastReset: today };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function recordAIUsage(modelUsed: string, exhaustedKeys: string[]) {
  if (typeof window === "undefined") return;
  
  const stats = getUsageStats();
  stats.counts[modelUsed] = (stats.counts[modelUsed] || 0) + 1;
  stats.exhausted = Array.from(new Set([...stats.exhausted, ...exhaustedKeys]));
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  
  // Dispatch custom event for UI updates
  window.dispatchEvent(new Event("ai_usage_updated"));
}

export function resetUsageStats() {
  if (typeof window === "undefined") return;
  const today = getTodayString();
  const reset = { counts: {}, exhausted: [], lastReset: today };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
  window.dispatchEvent(new Event("ai_usage_updated"));
}
