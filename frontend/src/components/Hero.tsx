"use client";

import { motion } from "framer-motion";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

// The Hero component is the first thing users see. 
// Using Framer Motion here for that staggered entrance effect.
// Note: Keep SVG paths simple for performance on mobile.
export default function Hero() {
  const customEasing: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const { checkAuth } = useAuthCheck();

  const handleStartAnalysis = (e: React.MouseEvent) => {
    if (!checkAuth()) {
      e.preventDefault();
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden texture-bg-1 px-6">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Left: Text Content */}
        <div className="flex flex-col items-start text-left space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: customEasing }}
            className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md inline-flex items-center gap-2.5 shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] md:text-xs font-bold text-blue-100 uppercase tracking-[0.2em]">
              Next-Gen AI Resume Intelligence
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: customEasing }}
            className="text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter text-white leading-[0.95]"
          >
            Land Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500">
              Dream Role.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: customEasing }}
            className="text-lg md:text-xl text-muted leading-relaxed max-w-xl"
          >
            ResuAI uses advanced neural scanning to decode job descriptions and optimize your resume for maximum ATS compatibility.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: customEasing }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <a
              href="#upload"
              onClick={handleStartAnalysis}
              className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span>Start Free Analysis</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-8 opacity-40 grayscale"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest"><ShieldCheck className="w-4 h-4 text-blue-500" /> Secure</div>
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest"><Zap className="w-4 h-4 text-yellow-500" /> Instant</div>
          </motion.div>
        </div>

        {/* Right: Video & Visual Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: customEasing }}
          className="relative group"
        >
          {/* Decorative rings */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative aspect-[4/3] lg:aspect-square xl:aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-white/10 bg-surface shadow-2xl glass-panel">
            <video
              src="/hero-video.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover scale-105 scale-x-[-1]"
            />
            
            {/* Visual scan effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60" />
          </div>
        </motion.div>

      </div>

      <style jsx>{`
        .scale-x-\[-1\] {
          transform: scaleX(-1);
        }
      `}</style>
    </section>
  );
}
