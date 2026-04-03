"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function CreditsPill() {
  const { isSignedIn, isLoaded } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/credits");
      const data = await res.json();
      if (res.ok) {
        setCredits(data.credits);
      }
    } catch (err) {
      console.error("Failed to load credits");
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isSignedIn) {
      fetchCredits();
      
      // Listen for local updates or resets
      window.addEventListener("credits_updated", fetchCredits);
      return () => window.removeEventListener("credits_updated", fetchCredits);
    }
  }, [isSignedIn, fetchCredits]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="relative flex items-center gap-2 group">
      <AnimatePresence>
        {credits !== null && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-full border transition-all duration-300 cursor-pointer ${
              credits < 10 
                ? "bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                : "bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20"
            }`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {loading ? (
                <Loader2 className="w-3 md:w-3.5 h-3 md:h-3.5 animate-spin" />
            ) : (
                <Zap className={`w-3 md:w-3.5 h-3 md:h-3.5 ${credits < 10 ? 'animate-pulse' : ''}`} />
            )}
            <span className="text-[9px] md:text-[11px] font-black tracking-widest uppercase">
              {credits} Cr
            </span>
            <Link 
              href="/pricing"
              className="ml-0.5 md:ml-1 w-4 md:w-5 h-4 md:h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 group-hover:border-white/20"
            >
               <Plus className="w-2 md:w-2.5 h-2 md:h-2.5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-3 right-0 w-64 p-4 bg-[#111827] border border-[#1F2937] rounded-2xl shadow-3xl z-[1000] pointer-events-none"
          >
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Balance Info</span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                Your credits top up to <span className="text-white">25</span> every day at <span className="text-white">12:00 AM IST</span> (if below 25). Choose a pricing pack for more power.
            </p>
            <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-[#6B7280] uppercase">Analysis</span>
                    <span className="text-white">10 Credits</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-[#6B7280] uppercase">Job Hunt Search</span>
                    <span className="text-white">5 Credits</span>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
