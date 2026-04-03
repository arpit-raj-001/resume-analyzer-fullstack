"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MapPin, Calendar, ExternalLink, ChevronDown } from "lucide-react";

export interface Job {
  company: string;
  logo: string;
  title: string;
  location: string;
  category?: "Remote" | "On-site" | "Hybrid";
  latitude?: number;
  longitude?: number;
  salary: string;
  datePosted: string;
  description: string;
  postLink?: string;
  searchLink?: string;
  techStackUsed?: string[];
  techStackMissing?: string[];
}

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Helper for category icons
  const CategoryIcon = () => {
    if (job.category === "Remote") return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">🏠 Remote</span>;
    if (job.category === "On-site") return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase tracking-wider">🏢 On-site</span>;
    if (job.category === "Hybrid") return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold uppercase tracking-wider">🏢 Hybrid</span>;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border border-[#1F2937] hover:border-[#3B82F6]/50 bg-[#111827]/60 rounded-xl overflow-hidden transition-all duration-300 relative group"
    >
      <div 
        className="p-5 cursor-pointer flex flex-col sm:flex-row gap-4 justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 space-y-2.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[#E5E7EB] font-bold text-lg group-hover:text-[#3B82F6] transition-colors break-words text-wrap">{job.title}</h3>
            <div className="flex items-center gap-2">
               {job.salary && job.salary !== "N/A" && (
                 <span className="bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
                    {job.salary}
                 </span>
               )}
               <CategoryIcon />
            </div>
          </div>
          <div className="flex items-center gap-3">
             {job.logo && job.logo !== "N/A" && (
               <img src={job.logo} alt={job.company} className="w-6 h-6 rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
             )}
             <span className="text-[#9CA3AF] text-sm font-medium">{job.company}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280]">
            {job.location && job.location !== "N/A" && (
              <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {job.location}</div>
            )}
            {job.datePosted && job.datePosted !== "N/A" && (
              <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {job.datePosted}</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center sm:items-start justify-end shrink-0 text-[#4B5563] group-hover:text-[#E5E7EB] transition-colors">
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
             <ChevronDown className="w-5 h-5"/>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#1F2937]/50"
          >
             <div className="p-5 bg-[#0D1117]/50 space-y-5">
               {/* Tech Match UI */}
               {(job.techStackUsed?.length || job.techStackMissing?.length) ? (
                 <div className="flex flex-col md:flex-row gap-4 mb-2">
                   {job.techStackUsed && job.techStackUsed.length > 0 && (
                     <div className="flex-1 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-lg p-3.5">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#22C55E] mb-2 px-1">✅ Matched Skills</h4>
                       <div className="flex flex-wrap gap-1.5">
                         {job.techStackUsed.map(t => (
                           <span key={t} className="px-2 py-0.5 bg-[#22C55E]/10 text-[#4ADE80] text-[11px] font-semibold rounded">{t}</span>
                         ))}
                       </div>
                     </div>
                   )}
                   {job.techStackMissing && job.techStackMissing.length > 0 && (
                     <div className="flex-1 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg p-3.5">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#EF4444] mb-2 px-1">❌ Missing Skills</h4>
                       <div className="flex flex-wrap gap-1.5">
                         {job.techStackMissing.map(t => (
                           <span key={t} className="px-2 py-0.5 bg-[#EF4444]/10 text-[#F87171] text-[11px] font-semibold rounded">{t}</span>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               ) : null}

               {job.description && job.description !== "N/A" && (
                 <div className="relative group/desc">
                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-[#3B82F6]/20 rounded-full group-hover/desc:bg-[#3B82F6]/50 transition-colors" />
                    <p className="text-sm text-[#9CA3AF] whitespace-pre-wrap font-medium leading-relaxed italic">
                      "{job.description}"
                    </p>
                 </div>
               )}
               <div className="pt-2 flex flex-col sm:flex-row gap-3">
                 {job.postLink && job.postLink !== "N/A" && (
                   <a 
                     href={job.postLink} target="_blank" rel="noopener noreferrer"
                     className="flex-1 inline-flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold transition-colors shadow-lg"
                   >
                     Original Post <ExternalLink className="w-4 h-4"/>
                   </a>
                 )}
                 {job.searchLink && job.searchLink !== "N/A" && (
                   <a 
                     href={job.searchLink} target="_blank" rel="noopener noreferrer"
                     className="flex-1 inline-flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg border border-[#3B82F6]/50 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#60A5FA] text-sm font-bold transition-colors"
                   >
                     Search Similar Roles
                   </a>
                 )}
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
