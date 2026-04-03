"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, User, CreditCard, Clock, CheckCircle2, XCircle, Loader2, Sparkles, AlertCircle, RefreshCcw, Rocket } from "lucide-react";
import Navbar from "@/components/Navbar";

interface PaymentClaim {
  redisKey: string;
  userId: string;
  email: string;
  name: string;
  transactionId: string;
  planName: string;
  amount: number;
  credits: number;
  createdAt: string;
}

export default function DeveloperDashboard() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/claims", {
        headers: { "Authorization": `Bearer ${password}` }
      });
      const data = await res.json();
      if (res.ok) {
        setClaims(data);
        setIsAuthorized(true);
        setError("");
      } else {
        setError(data.error || "Authorization Failed");
        if (res.status === 401) setIsAuthorized(false);
      }
    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [password]);

  const handleAction = async (claim: PaymentClaim, action: "approve" | "deny") => {
    setActionLoading(claim.redisKey);
    try {
      const res = await fetch("/api/admin/claims", {
        method: "PATCH",
        headers: { 
            "Authorization": `Bearer ${password}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          redisKey: claim.redisKey,
          userId: claim.userId,
          credits: claim.credits
        })
      });

      if (res.ok) {
        setClaims(prev => prev.filter(c => c.redisKey !== claim.redisKey));
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md p-10 rounded-3xl bg-[#111827] border border-[#1F2937] shadow-3xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-8">
                <ShieldCheck className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Developer Auth</h1>
            <p className="text-[#9CA3AF] text-sm mb-8 font-medium">Authentication required to access the manual payment dashboard.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); fetchClaims(); }} className="space-y-4">
                <input 
                    type="password" 
                    placeholder="Enter Admin Password" 
                    className="w-full bg-[#0D1117] border border-[#1F2937] rounded-xl py-3.5 px-6 text-sm text-center text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="text-red-400 text-[10px] font-bold flex items-center justify-center gap-1.5"><AlertCircle className="w-3 h-3" /> {error}</p>}
                <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black tracking-tight transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Access System"}
                </button>
            </form>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0D14] text-[#F9FAFB]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest">Admin Control</span>
                    <RefreshCcw className={`w-4 h-4 text-[#4B5563] cursor-pointer hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} onClick={fetchClaims} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                   Payment <span className="text-blue-500">Approvals</span>
                </h1>
                <p className="text-[#9CA3AF] mt-3 font-medium">Verify direct UPI transactions and transfer credits instantly to user accounts.</p>
            </div>
            
            <div className="flex gap-4">
                <div className="px-6 py-3 rounded-2xl bg-[#111827] border border-[#1F2937] flex flex-col">
                    <span className="text-[10px] font-black text-[#4B5563] uppercase tracking-widest">Pending Claims</span>
                    <span className="text-2xl font-black text-white">{claims.length}</span>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {claims.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center rounded-3xl border border-dashed border-[#1F2937] bg-[#111827]/40">
                        <Sparkles className="w-12 h-12 text-[#1F2937] mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-[#E5E7EB] mb-1">Queue Clear</h3>
                        <p className="text-[#6B7280] text-sm">No pending payment claims in the system.</p>
                    </motion.div>
                ) : (
                    claims.map((claim) => (
                        <motion.div 
                            key={claim.redisKey}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#111827] border border-[#1F2937] rounded-3xl overflow-hidden hover:border-[#3B82F6]/50 transition-colors shadow-lg"
                        >
                            <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center gap-8">
                                {/* Left Section: User */}
                                <div className="flex items-center gap-5 lg:w-[25%]">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <User className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate">{claim.name}</h3>
                                        <p className="text-xs text-[#9CA3AF] truncate font-medium">{claim.email}</p>
                                    </div>
                                </div>

                                {/* Middle Section: Plan */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 flex-1">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-[#4B5563] uppercase tracking-widest flex items-center gap-2">
                                            <CreditCard className="w-3 h-3" /> Transaction ID
                                        </span>
                                        <span className="text-sm font-black text-white tracking-tight">{claim.transactionId}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-[#4B5563] uppercase tracking-widest flex items-center gap-2">
                                            <Rocket className="w-3 h-3" /> Plan / Credits
                                        </span>
                                        <span className="text-sm font-black text-white">{claim.planName} • <span className="text-blue-400">{claim.credits} Cr</span></span>
                                    </div>
                                    <div className="hidden lg:flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-[#4B5563] uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Submitted At
                                        </span>
                                        <span className="text-xs font-bold text-[#9CA3AF]">{new Date(claim.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Right Section: Actions */}
                                <div className="flex items-center gap-3 lg:w-[20%] lg:justify-end">
                                    <button 
                                        onClick={() => handleAction(claim, "deny")}
                                        disabled={actionLoading !== null}
                                        className="h-12 px-6 rounded-2xl border border-[#1F2937] hover:bg-black/40 text-[#EF4444] font-black tracking-tight transition-all flex items-center gap-2 text-sm"
                                    >
                                        <XCircle className="w-4 h-4" /> Deny
                                    </button>
                                    <button 
                                        onClick={() => handleAction(claim, "approve")}
                                        disabled={actionLoading !== null}
                                        className="h-12 px-8 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black tracking-tight transition-all flex items-center gap-2 text-sm shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
                                    >
                                        {actionLoading === claim.redisKey ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" /> Approve
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
