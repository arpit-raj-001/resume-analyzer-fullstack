"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Rocket, Crown, ArrowRight, ShieldCheck, CreditCard, Sparkles, Loader2, X, AlertCircle, History, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useUser } from "@clerk/nextjs";

const PRICING_PLANS = [
  {
    name: "Starter",
    price: 10,
    credits: 10,
    description: "Perfect for a single detailed check.",
    icon: Zap,
    color: "blue",
    popular: false,
  },
  {
    name: "Basic",
    price: 50,
    credits: 30,
    description: "Best for immediate job seekers.",
    icon: Rocket,
    color: "blue",
    popular: true,
  },
  {
    name: "Growth",
    price: 120,
    credits: 100,
    description: "Serious about role optimization.",
    icon: Crown,
    color: "indigo",
    popular: false,
  },
  {
    name: "Pro",
    price: 300,
    credits: 300,
    description: "Full arsenal for career dominance.",
    icon: Crown,
    color: "purple",
    popular: false,
  }
];

export default function PricingPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof PRICING_PLANS[0] | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  const upiId = "arpit1206477417@okicici";

  const fetchHistory = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/payments/claim");
      const data = await res.json();
      if (res.ok) setOrderHistory(data);
    } catch (e) {}
  }, [isSignedIn]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleBuyNow = (plan: typeof PRICING_PLANS[0]) => {
    if (!isSignedIn) {
        alert("Please sign in to purchase credits.");
        return;
    }
    setSelectedPlan(plan);
    
    // 1. Open UPI Deep Link (for mobile)
    const upiUrl = `upi://pay?pa=${upiId}&pn=ResuAI&am=${plan.price}&cu=INR&tn=Purchase ${plan.credits} Credits`;
    window.location.href = upiUrl;

    // 2. Show Claim Modal (for Transaction ID entry)
    setTimeout(() => setShowClaimModal(true), 1000);
  };

  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId || transactionId.length < 5) {
        setError("Please enter a valid Transaction ID / Ref No.");
        return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/payments/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          planName: selectedPlan?.name,
          amount: selectedPlan?.price,
          credits: selectedPlan?.credits
        })
      });

      if (res.ok) {
        setSuccess(true);
        fetchHistory(); // Refresh history
        setTimeout(() => {
          setShowClaimModal(false);
          setSuccess(false);
          setTransactionId("");
        }, 5000);
      } else {
        const data = await res.json();
        setError(data.error || "Claim failed. Try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0D14] text-[#F9FAFB]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-8">
            <button 
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#9CA3AF] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
            >
                <History className="w-4 h-4" /> My Order Status
            </button>
          </div>

          <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 inline-block">
            One-Time Payment • Instant Verification
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Infinite Insights. <br/><span className="text-[#3B82F6]">Direct Control.</span>
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto mb-16 font-medium">
            Balance topped up to 25 credits daily at 12 AM IST (if below 25). Need a quick boost? Pay via ANY UPI app and get verified within minutes.
          </p>
        </motion.div>

        {/* Order History Section */}
        <AnimatePresence>
          {showHistory && (
             <motion.div 
               initial={{ opacity: 0, height: 0 }} 
               animate={{ opacity: 1, height: "auto" }} 
               exit={{ opacity: 0, height: 0 }}
               className="mb-16 overflow-hidden"
             >
                <div className="max-w-2xl mx-auto bg-[#111827] border border-[#1F2937] rounded-3xl p-6 text-left shadow-2xl">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white/50">
                        <Clock className="w-4 h-4" /> Recent Claims
                    </h3>
                    <div className="space-y-3">
                        {orderHistory.length === 0 ? (
                            <p className="text-[#4B5563] text-xs font-bold py-8 text-center italic">No recent claims submitted.</p>
                        ) : (
                            orderHistory.map((item, idx) => {
                                const parsed = typeof item === 'string' ? JSON.parse(item) : item;
                                return (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-[#0A0D14] rounded-2xl border border-white/5">
                                        <div>
                                            <p className="text-xs font-bold text-white">{parsed.planName} Pack • {parsed.credits} Credits</p>
                                            <p className="text-[10px] text-[#4B5563] mt-1 font-medium italic">Ref: {parsed.transactionId}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            parsed.status === 'approved' ? 'bg-green-500/10 text-green-400' : 
                                            parsed.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                                        }`}>
                                            {parsed.status || 'Under Review'}
                                        </span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative group p-8 rounded-3xl border transition-all duration-500 ${
                plan.popular 
                  ? "bg-[#111827] border-blue-500/50 shadow-[0_20px_50px_rgba(59,130,246,0.1)]" 
                  : "bg-[#111827]/40 border-[#1F2937] hover:border-[#3B82F6]/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black py-1.5 px-4 rounded-full uppercase tracking-tighter shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                <plan.icon className="w-6 h-6 text-blue-400" />
              </div>

              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-[#6B7280] text-sm mb-8 leading-relaxed">{plan.description}</p>

              <div className="flex items-baseline gap-2 mb-8 justify-center">
                <span className="text-3xl font-black">₹{plan.price}</span>
                <span className="text-sm text-[#4B5563] font-bold">/ {plan.credits} Credits</span>
              </div>

              <button
                onClick={() => handleBuyNow(plan)}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  plan.popular 
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]" 
                    : "bg-[#1F2937] hover:bg-[#374151] text-white"
                }`}
              >
                Buy Now <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-8 space-y-4 text-left">
                <div className="flex items-center gap-3 text-xs font-semibold text-[#9CA3AF]">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Manual Link Verify</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-[#9CA3AF]">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Verified History Track</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-32 pt-16 border-t border-[#1F2937] flex flex-col items-center">
          <div className="flex items-center gap-12 flex-wrap justify-center opacity-40">
             <div className="flex items-center gap-2 text-white"><ShieldCheck className="w-5 h-5 text-blue-400" /> <span className="font-bold text-sm uppercase tracking-wide">Manual Verify</span></div>
             <div className="flex items-center gap-2 text-white"><CreditCard className="w-5 h-5 text-blue-400" /> <span className="font-bold text-sm uppercase tracking-wide">Any UPI App</span></div>
             <div className="flex items-center gap-2 text-white"><Clock className="w-5 h-5 text-blue-400" /> <span className="font-bold text-sm uppercase tracking-wide">Minute Fulfillment</span></div>
          </div>
          
          <div className="mt-16 max-w-2xl bg-[#111827]/40 border border-[#1F2937] p-8 rounded-3xl flex items-center gap-6 text-left">
            <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
              <Clock className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg tracking-tight">Smart Top-up System:</h4>
              <p className="text-sm text-[#9CA3AF] mt-1 leading-relaxed">
                1. Pay via ANY UPI app using the QR or ID.<br/>
                2. Enter your **Transaction ID** (Ref No) in the modal.<br/>
                3. **Credits are added within 20-30 minutes**. Note: Every night at 12 AM, we top you up to 25 credits for free (if your balance is lower).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      <AnimatePresence>
        {showClaimModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0D1117] border border-[#1F2937] rounded-3xl w-full max-w-md shadow-3xl relative overflow-hidden"
            >
              <div className="h-2 bg-[#3B82F6]" />
              <button onClick={() => setShowClaimModal(false)} className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white transition-colors p-2"><X className="w-5 h-5" /></button>
              
              <div className="p-8">
                {/* QR Section */}
                <div className="text-center mb-8">
                    <div className="w-40 h-40 bg-white p-3 rounded-2xl mx-auto mb-4 overflow-hidden border border-[#1F2937]/50 shadow-2xl">
                         <img src="/assets/qrcode.jpg" alt="Payment QR Code" className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-1">Scan to pay any UPI App</p>
                    <p className="text-xs font-black text-blue-400 select-all cursor-pointer bg-blue-500/10 px-4 py-1.5 rounded-full inline-block">{upiId}</p>
                </div>

                <div className="w-full h-px bg-white/5 mb-8" />

                <h2 className="text-xl font-black text-center mb-1 tracking-tight">Finalize Verification</h2>
                <p className="text-[#9CA3AF] text-[10px] text-center mb-8 font-bold uppercase tracking-widest">Verify payment for <span className="text-white">{selectedPlan?.credits} Credits</span></p>

                <form onSubmit={submitClaim} className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase font-black text-[#4B5563] tracking-widest ml-1">Enter UPI Transaction ID (Ref No)</label>
                     <input 
                       type="text"
                       required
                       placeholder="e.g. 123456789012"
                       value={transactionId}
                       onChange={(e) => setTransactionId(e.target.value)}
                       className="w-full bg-[#111827] border border-[#1F2937] rounded-2xl py-4 px-6 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                     />
                   </div>

                   {error && <p className="text-red-400 text-[10px] font-bold flex items-center gap-1.5 p-3 bg-red-500/5 border border-red-500/10 rounded-xl"><AlertCircle className="w-3 h-3" /> {error}</p>}
                   
                   <AnimatePresence>
                    {success && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-center space-y-2 mb-4">
                            <Sparkles className="w-6 h-6 text-green-400 mx-auto" />
                            <p className="text-green-400 text-xs font-black uppercase tracking-tight">Payment Claimed!</p>
                            <p className="text-[10px] text-green-300/80 font-medium leading-relaxed">System is verifying your ID. Credits will be added to your profile within **20-30 minutes**.</p>
                        </motion.div>
                    )}
                   </AnimatePresence>

                   <button 
                     type="submit"
                     disabled={submitting || success}
                     className="w-full py-4 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black tracking-tight transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(59,130,246,0.3)]"
                   >
                     {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Claim Credits"}
                   </button>
                </form>
                
                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                   <p className="text-[9px] text-[#4B5563] font-bold uppercase tracking-[0.25em]">credits arrive in 20-30m avg</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
