"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import UploadSection from "@/components/UploadSection";
import AnalysisResult from "@/components/AnalysisResult";
import JobHuntSection from "@/components/JobHuntSection";
import ResumeBuilderCTA from "@/components/ResumeBuilderCTA";

interface AnalysisData {
  summary: string;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  experience: string[];
  suggestedJobs: string[];
  projects: string[];
  atsScore: number;
  fallbackMessage?: string;
}

// Core landing page. 
// Note to future me: The glassmorphism effect on the cards 
// needs to be subtle enough to not kill the contrast ratio.
// The Hero component is the first thing users see. 
// I'm using Framer Motion for the staggered entrance animations.
// Performance tip: Keep the SVG paths simple to avoid jank on mobile.
export default function Home() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const handleReset = () => {
    setAnalysisData(null);
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="relative min-h-screen bg-[#0D1117] overflow-hidden selection:bg-[#3B82F6]/30 pt-20">
      {/* Global Background Mesh Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(to right, #3B82F6 1px, transparent 1px), linear-gradient(to bottom, #3B82F6 1px, transparent 1px)`, 
          backgroundSize: '60px 60px',
        }}
      />
      <Hero />

      {!analysisData ? (
        <UploadSection onAnalysisComplete={setAnalysisData} />
      ) : (
        <AnalysisResult data={analysisData} onReset={handleReset} />
      )}

      {/* Write your own resume section - Split 5:3 CTA */}
      <section className="texture-bg-3">
        <ResumeBuilderCTA />
      </section>

      {/* Professional Meshed Boundary Transition */}
      <div className="relative h-48 w-full overflow-hidden flex items-center justify-center mt-12 bg-gradient-to-b from-[#0D1117] to-[#0A0D14]">
        {/* Subtle Solid Base Line */}
        <div className="absolute top-1/2 left-0 right-0 border-t border-[#1F2937]/30"></div>
        {/* Glowing Energy Core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-4xl h-px bg-gradient-to-r from-transparent via-[#3B82F6]/50 to-transparent shadow-[0_0_40px_rgba(59,130,246,0.8)]"></div>
        
        {/* CSS Mesh Grid Filter */}
        <div 
          className="absolute inset-0 opacity-[0.06]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #E5E7EB 1px, transparent 1px), linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)`, 
            backgroundSize: '48px 48px', 
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)', 
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)' 
          }}
        />

        {/* Floating Divider Badge */}
        <div className="relative z-10 px-6 py-2 rounded-full border border-[#1F2937]/80 bg-[#0A0D14]/80 backdrop-blur-md text-[#9CA3AF] text-xs font-bold tracking-widest uppercase shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] shadow-[0_0_10px_#3B82F6]"></span>
            Next Steps
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] shadow-[0_0_10px_#3B82F6]"></span>
        </div>
      </div>

      {/* Always visible Job Hunt section for direct visitors */}
      <section id="jobhunt-anchor" className="texture-bg-2">
        <JobHuntSection />
      </section>
    </main>
  );
}
