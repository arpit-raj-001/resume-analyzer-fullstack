"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Key, AlertCircle, Loader2, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

interface RefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits?: number;
  currentCredits?: number;
  onSuccess?: () => void;
}

export default function RefillModal({ isOpen, onClose, requiredCredits = 10, currentCredits = 0, onSuccess }: RefillModalProps) {
  const [redeemCode, setRedeemCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", code: redeemCode })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        // Trigger real-time balance refresh in Navbar
        window.dispatchEvent(new Event("credits_updated"));
        
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setSuccess(false);
          setRedeemCode("");
        }, 1500);
      } else {
        setError(data.error || "Invalid Key");
      }
    } catch (err) {
      setError("Redeem failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0D1117] border border-[#1F2937] rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
          >
            {/* Header / Banner */}
            <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-orange-500" />
              </div>

              <h2 className="text-2xl font-black text-center mb-2 tracking-tight">Credits Low</h2>
              <p className="text-[#9CA3AF] text-sm text-center mb-8">
                This feature requires <span className="text-white font-bold">{requiredCredits} credits</span>. 
                You currently have <span className="text-orange-400 font-bold">{currentCredits}</span>.
              </p>

              <div className="space-y-4">
                <Link href="/pricing" onClick={onClose} className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95">
                  <CreditCard className="w-4 h-4" /> Go to Pricing
                </Link>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#1F2937]" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0D1117] px-4 text-[#4B5563] font-bold">or redeem</span></div>
                </div>

                <form onSubmit={handleRedeem} className="space-y-3">
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                    <input 
                      type="password"
                      placeholder="Enter Admin Redeem Code"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1F2937] rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-[#4B5563] focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  {error && <p className="text-red-400 text-[10px] font-bold flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {error}</p>}
                  {success && <p className="text-green-400 text-[10px] font-bold flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> 50 Credits Added Successfully!</p>}
                  <button 
                    type="submit"
                    disabled={loading || !redeemCode}
                    className="w-full py-3.5 rounded-2xl bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] text-[#9CA3AF] hover:text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redeem Key"}
                  </button>
                </form>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                 <p className="text-[10px] text-[#4B5563] font-bold uppercase tracking-[0.2em]">Credits reset daily at 12 AM IST</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
