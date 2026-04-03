"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Layout, Eye, ArrowRight } from "lucide-react";
import templatesData from "@/data/templates.json";
import { useAuthCheck } from "@/hooks/useAuthCheck";

export default function TemplateGallery() {
  const { templates } = templatesData;
  const { checkAuth } = useAuthCheck();

  const handleLinkClick = (e: React.MouseEvent) => {
    if (!checkAuth()) {
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-bold uppercase tracking-wider"
            >
              <Layout className="w-3 h-3" />
              Template Library
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-[#3B82F6]">
              Choose your foundation.
            </h1>
            <p className="text-lg text-[#9CA3AF] max-w-2xl">
              Select a professional, ATS-optimized layout crafted by industry experts. All templates are ready for AI-enhancement.
            </p>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative bg-[#111827] border border-[#1F2937] rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all duration-500 shadow-2xl hover:shadow-blue-500/10 flex flex-col"
            >
              {/* Preview Display / Dynamic Layout Rendering */}
              <div className="aspect-[3/4] w-full bg-[#0D1117] relative overflow-hidden flex items-center justify-center p-6 bg-gradient-to-b from-transparent to-[#111827]">
                <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:rotate-1 border border-white/5 bg-white origin-top">
                  {/* Scaled Preview Injection */}
                    <div 
                        className="w-[300%] h-[300%] origin-top-left scale-[0.333]" 
                        style={{ fontFamily: template.style.font, color: template.style.secondaryColor }}
                        dangerouslySetInnerHTML={{ 
                            __html: template.html_template
                                .replace(/{{name}}/g, template.sample_data.name || "")
                                .replace(/{{email}}/g, template.sample_data.email || "candidate@resuai.com")
                                .replace(/{{phone}}/g, template.sample_data.phone || "+1 555-0123")
                                .replace(/{{location}}/g, template.sample_data.location || "Silicon Valley, CA")
                                .replace(/{{summary}}/g, template.sample_data.summary || "Top-tier professional aiming for high-impact roles.")
                        }} 
                    />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-[#0B0F1A]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                   <Link 
                      href={`/create-resume/${template.id}`} 
                      onClick={handleLinkClick}
                      className="w-14 h-14 rounded-full bg-[#3B82F6] flex items-center justify-center text-white shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:scale-110 active:scale-95"
                    >
                     <Plus className="w-8 h-8" />
                   </Link>
                   <span className="text-white text-sm font-bold tracking-widest uppercase bg-[#3B82F6]/20 px-4 py-1 rounded-full border border-[#3B82F6]/30">Use Template</span>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{template.name}</h3>
                  <div className="px-2 py-1 bg-[#3B82F6]/10 rounded text-[10px] font-bold text-[#3B82F6] uppercase border border-[#3B82F6]/20">{template.layout.type.replace('_', ' ')}</div>
                </div>
                
                <p className="text-sm text-[#9CA3AF] leading-relaxed">
                  Precision engineered using <span className="text-[#3B82F6] font-medium">{template.style.font}</span> typography with a specialized <span className="text-white/60">{template.layout.spacing}</span> architecture.
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-[#1F2937]/50">
                  <Link 
                    href={`/create-resume/${template.id}`} 
                    onClick={handleLinkClick}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-[#0D1117] hover:bg-[#E5E7EB] text-sm font-bold transition-all shadow-lg"
                  >
                    Customize Layout <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add More Soon Card */}
          <div className="bg-[#111827]/30 border-4 border-dashed border-[#1F2937] rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default min-h-[500px]">
             <div className="w-20 h-20 rounded-full bg-[#111827] border border-[#1F2937] flex items-center justify-center text-[#3B82F6] mb-4">
                <Layout className="w-10 h-10 animate-pulse" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Phase 2 Loading</h3>
                <p className="text-sm text-[#9CA3AF] max-w-[200px]">Our design lab is finalizing 45 additional elite layouts.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
