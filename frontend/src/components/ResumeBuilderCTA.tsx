"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Layout } from "lucide-react";
import { useAuthCheck } from "@/hooks/useAuthCheck";

export default function ResumeBuilderCTA() {
  const { checkAuth } = useAuthCheck();

  return (
    <section className="py-24 px-6 bg-[#0D1117]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-8 items-stretch rounded-[2.5rem] border border-[#1F2937] bg-[#111827]/40 overflow-hidden shadow-2xl">
          
          {/* Left Side: Content (5/8) */}
          <div className="lg:col-span-5 p-8 md:p-16 flex flex-col justify-center gap-8 border-b lg:border-b-0 lg:border-r border-[#1F2937]">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-bold uppercase tracking-wider"
              >
                <Layout className="w-3 h-3" />
                Resume Builder Gallery
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]"
              >
                Write your own <br /> 
                <span className="text-[#3B82F6]">Resume with AI.</span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-[#9CA3AF] text-lg max-w-xl leading-relaxed"
              >
                Ready to stand out? Browse our wide variety of ATS-friendly resumes, ready to be edited and used for your personal use. Each template is meticulously crafted to bypass filters and grab attention.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href="/create-resume"
                onClick={(e) => {
                  if (!checkAuth()) {
                    e.preventDefault();
                  }
                }}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white hover:bg-[#E5E7EB] text-[#0D1117] font-bold text-lg transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.1)] group"
              >
                Browse Templates
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Right Side: Visual (3/8) */}
          <div className="lg:col-span-3 relative min-h-[300px] lg:min-h-full overflow-hidden">
            <video
              src="/section3_assets/Author_writing_paper_202604012155.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-[#111827] via-transparent to-transparent opacity-60" />
            
            {/* Visual Badge */}
            <div className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none">Craft Mode</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
