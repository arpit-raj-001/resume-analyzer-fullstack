"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, AlertTriangle, X } from "lucide-react";

export default function ModelToast() {
  const [show, setShow] = useState(false);
  const [model, setModel] = useState("");

  useEffect(() => {
    const handleFallback = (e: any) => {
      setModel(e.detail.modelUsed || "Groq LLM");
      setShow(true);
      setTimeout(() => setShow(false), 5000); // Auto-hide after 5s
    };

    window.addEventListener("ai-fallback", handleFallback as any);
    return () => window.removeEventListener("ai-fallback", handleFallback as any);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-24 right-6 z-[9999] max-w-sm w-full bg-[#1F2937]/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 shadow-2xl flex gap-4 items-start"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
          </div>
          
          <div className="flex-1">
            <h4 className="text-white text-sm font-bold flex items-center gap-2">
              System Optimization
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest">Active</span>
            </h4>
            <p className="text-muted text-xs mt-1">
              Primary analysis engine at capacity. Shifting processing to secondary neural core for uninterrupted service.
            </p>
          </div>

          <button 
            onClick={() => setShow(false)}
            className="text-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
