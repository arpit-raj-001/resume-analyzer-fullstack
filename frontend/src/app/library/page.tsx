"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Bookmark, Edit, Trash2, Clock, Plus, Layout } from "lucide-react";

export default function ResumeLibrary() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("resuai_library") || "[]");
    setResumes(list.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    setIsLoading(false);
  }, []);

  const deleteResume = (draftId: string) => {
    if (!confirm("Are you sure you want to delete this draft? This cannot be undone.")) return;
    
    // Remove individual draft
    localStorage.removeItem(`resume_draft_${draftId}`);
    
    // Remove from index
    const updated = resumes.filter(r => r.draftId !== draftId);
    setResumes(updated);
    localStorage.setItem("resuai_library", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/5 text-green-400 text-xs font-bold uppercase tracking-wider"
            >
              <Bookmark className="w-3 h-3" />
              Your Personal Vault
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-green-400 uppercase tracking-tighter">
              Saved Resumes
            </h1>
            <p className="text-lg text-[#9CA3AF] max-w-2xl">
              All your drafted resumes are stored locally on your device. Manage, edit, or export them into high-fidelity PDFs.
            </p>
          </div>
          
          <Link href="/create-resume" className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95">
             <Plus className="w-5 h-5" />
             Create New
          </Link>
        </div>

        {isLoading ? (
           <div className="flex items-center justify-center py-40 text-[#9CA3AF]">
              <span className="animate-pulse">Accessing local storage...</span>
           </div>
        ) : resumes.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="flex flex-col items-center justify-center p-20 rounded-[40px] border-2 border-dashed border-[#1F2937] text-center space-y-6"
           >
              <div className="w-20 h-20 rounded-full bg-[#111827] flex items-center justify-center text-[#9CA3AF]">
                 <Bookmark className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl font-bold text-white">Your library is empty.</h2>
                 <p className="text-[#9CA3AF]">Head over to the Template Gallery to start your first professional resume.</p>
              </div>
              <Link href="/create-resume" className="px-6 py-2.5 rounded-xl border border-[#3B82F6]/50 bg-[#3B82F6]/10 text-[#60A5FA] font-bold text-sm hover:bg-[#3B82F6]/20 transition-all">
                 Browse Templates
              </Link>
           </motion.div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {resumes.map((resume, idx) => (
                   <motion.div
                     key={resume.draftId}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     transition={{ delay: idx * 0.05 }}
                     className="group bg-[#111827] border border-[#1F2937] rounded-3xl p-6 hover:border-green-500/40 transition-all duration-300"
                   >
                      <div className="flex flex-col h-full space-y-6">
                         <div className="flex items-start justify-between">
                            <div className="space-y-1">
                               <div className="flex items-center gap-2 text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">
                                  <Layout className="w-3 h-3" />
                                  {resume.templateName || "Unknown Template"}
                               </div>
                               <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors uppercase tracking-tight line-clamp-1">
                                  {resume.name}
                               </h3>
                            </div>
                            <button 
                              onClick={() => deleteResume(resume.draftId)}
                              className="w-10 h-10 rounded-xl bg-red-500/5 hover:bg-red-500/20 text-red-500/50 hover:text-red-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            >
                               <Trash2 className="w-5 h-5" />
                            </button>
                         </div>

                         <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                            <Clock className="w-4 h-4" />
                            Updated {new Date(resume.updatedAt).toLocaleDateString()}
                         </div>

                         <div className="pt-6 border-t border-[#1F2937] flex gap-3">
                            <Link href={`/create-resume/${resume.draftId}`} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all border border-white/5">
                               <Edit className="w-4 h-4" />
                               Modify
                            </Link>
                         </div>
                      </div>
                   </motion.div>
                ))}
              </AnimatePresence>
           </div>
        )}
      </div>
    </div>
  );
}
