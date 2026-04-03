"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Lock, CheckCircle, AlertCircle, RefreshCcw, X, ShieldCheck, User, CreditCard, Clock, CheckCircle2, XCircle, Rocket, Sparkles } from "lucide-react";
import { getUsageStats, resetUsageStats, UsageStats } from "@/lib/usage-storage";

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

export default function DevDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"usage" | "payments">("usage");
  
  // Usage Stats
  const [status, setStatus] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRefreshed, setShowRefreshed] = useState(false);

  // Payment Claims
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = async (pass: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dev/status", {
        headers: { "Authorization": `Bearer ${pass}` }
      });
      if (res.ok) {
        setStatus(getUsageStats());
        setIsUnlocked(true);
        fetchClaims(pass);
        setShowRefreshed(true);
        setTimeout(() => setShowRefreshed(false), 2500);
      } else {
        setError("Invalid Master Key");
      }
    } catch (err) {
      setError("Sync Failure");
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async (pass: string) => {
    try {
      const res = await fetch("/api/admin/claims", {
        headers: { "Authorization": `Bearer ${pass}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClaims(data);
      }
    } catch (e) {}
  };

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
          credits: claim.credits,
          transactionId: claim.transactionId
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

  const handleManualRefresh = () => {
    setLoading(true);
    if (activeTab === "usage") {
        setTimeout(() => {
            setStatus(getUsageStats());
            setLoading(false);
            setShowRefreshed(true);
            setTimeout(() => setShowRefreshed(false), 2500);
        }, 600);
    } else {
        fetchClaims(password).finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    const handleUpdate = () => setStatus(getUsageStats());
    if (isUnlocked) {
      handleUpdate();
      window.addEventListener("ai_usage_updated", handleUpdate);
    }
    return () => window.removeEventListener("ai_usage_updated", handleUpdate);
  }, [isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(password);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[80] w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-40 hover:opacity-100 hover:scale-110 active:scale-95 transition-all shadow-2xl backdrop-blur-md"
        title="Developer Control"
      >
        <Settings className="w-5 h-5 text-blue-400/80" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#0D1117] border border-[#1F2937] rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] w-full max-w-2xl flex flex-col max-h-[85vh] relative overflow-hidden"
            >
              <button onClick={() => setIsOpen(false)} className="absolute top-8 right-8 text-[#9CA3AF] hover:text-white transition-colors z-[100] p-1"><X className="w-5 h-5" /></button>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
              {!isUnlocked ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-8">
                    <ShieldCheck className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 tracking-tighter">Terminal</h3>
                  <p className="text-[#9CA3AF] text-sm mb-12 font-medium">Authentication required to access clusters and payments.</p>
                  
                  <form onSubmit={handleUnlock} className="flex flex-col gap-4 max-w-xs mx-auto">
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                      <input 
                        type="password"
                        placeholder="Master Gateway Key"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#111827] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-[#374151] focus:outline-none focus:border-blue-500/30 transition-all font-mono"
                        autoFocus
                      />
                    </div>
                    {error && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{error}</p>}
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(37,99,235,0.3)]">
                      {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Authorize"}
                    </button>
                    <p className="text-[9px] text-[#374151] mt-6 uppercase tracking-[0.4em] font-black italic">Encryption Mode: HIGH</p>
                  </form>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {/* Dashboard Tabs */}
                  <div className="flex items-center gap-4 mb-10 bg-[#111827] p-1.5 rounded-2xl border border-white/5 w-fit">
                    <button 
                        onClick={() => setActiveTab("usage")}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${activeTab === 'usage' ? 'bg-[#1F2937] text-white shadow-lg' : 'text-[#4B5563] hover:text-[#9CA3AF]'}`}
                    >
                        API Usage
                    </button>
                    <button 
                        onClick={() => setActiveTab("payments")}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all relative ${activeTab === 'payments' ? 'bg-[#1F2937] text-white shadow-lg' : 'text-[#4B5563] hover:text-[#9CA3AF]'}`}
                    >
                        Orders
                        {claims.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center font-black animate-pulse">{claims.length}</span>}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">{activeTab === 'usage' ? "System Logic" : "Credit Approvals"}</h3>
                        <p className="text-xs text-[#9CA3AF] mt-1 font-medium">{activeTab === 'usage' ? "Real-time AI key rotation monitoring." : "Verify manual UPI transactions here."}</p>
                    </div>
                    <button onClick={handleManualRefresh} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-blue-400 transition-all"><RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
                  </div>

                  {activeTab === "usage" ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[...Array(8)].map((_, i) => {
                            const keyName = i === 0 ? "GEMINI_API_KEY" : `GEMINI_API_KEY_${i}`;
                            const useCount = status?.counts?.[keyName] || 0;
                            const isExhausted = status?.exhausted?.includes(keyName);
                            return (
                                <div key={keyName} className={`p-5 rounded-3xl border transition-all ${!isExhausted ? "bg-green-500/5 border-green-500/10" : "bg-red-500/5 border-red-500/20"}`}>
                                    <span className="text-[9px] font-black text-[#4B5563] uppercase tracking-widest block mb-4">{keyName}</span>
                                    <div className="flex items-end justify-between">
                                        <span className="text-xl font-black text-white">{useCount}</span>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${!isExhausted ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"}`}>
                                            {!isExhausted ? "Online" : "Limited"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                        {claims.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-[#1F2937] rounded-[2rem]">
                                <Sparkles className="w-10 h-10 text-[#1F2937] mx-auto mb-4" />
                                <p className="text-xs font-bold text-[#4B5563] uppercase tracking-widest">No Pending Orders</p>
                            </div>
                        ) : (
                            claims.map((claim) => (
                                <div key={claim.redisKey} className="p-6 bg-[#111827] border border-white/5 rounded-3xl flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><User className="w-5 h-5 text-blue-400" /></div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{claim.name}</p>
                                                <p className="text-[10px] text-[#4B5563] font-medium">{claim.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-white">₹{claim.amount}</p>
                                            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter">{claim.credits} Cr</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[8px] font-black text-[#374151] uppercase tracking-[0.2em]">Transaction ID</p>
                                            <p className="text-xs font-mono font-bold text-white">{claim.transactionId}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(claim, "deny")} disabled={!!actionLoading} className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all"><XCircle className="w-5 h-5" /></button>
                                            <button onClick={() => handleAction(claim, "approve")} disabled={!!actionLoading} className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-lg transition-all">{actionLoading === claim.redisKey ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                  )}

                  <div className="mt-auto pt-10 flex items-center justify-between border-t border-white/5 mt-10">
                    <p className="text-[9px] text-[#374151] font-black uppercase tracking-[0.2em]">Live Admin Channel v2.4</p>
                    <button onClick={() => setIsUnlocked(false)} className="text-[9px] font-black text-[#4B5563] hover:text-white uppercase tracking-widest transition-colors">Lock Terminal</button>
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
