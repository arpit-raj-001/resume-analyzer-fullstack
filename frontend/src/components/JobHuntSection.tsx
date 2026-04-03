"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, Search, FileSignature, ArrowRightCircle, Sparkles, ChevronDown, Check } from "lucide-react";
import JobCard, { Job } from "./JobCard";
import dynamic from "next/dynamic";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import RefillModal from "./RefillModal";

// Dynamically import map to avoid SSR 'window is not defined' Leaflet crash
const JobMapDynamic = dynamic(() => import("./JobMap"), { ssr: false });

type JobHuntStep = "UPLOAD" | "ROLES" | "TYPES" | "RESULTS";

const JOB_TYPES = [
  "Full Time (FTE)",
  "Freelance",
  "Internship (3 months)",
  "Internship (6 months)",
  "Summer Internship (1–2 months)",
];

// Helper: Parse date string into days ago
const parseDays = (dateStr: string) => {
  const s = dateStr.toLowerCase();
  if (s.includes("hour") || s.includes("today") || s.includes("just")) return 0;
  if (s.includes("week")) return parseInt(s) * 7 || 7;
  if (s.includes("month")) return parseInt(s) * 30 || 30;
  const match = s.match(/(\d+)/);
  return match ? parseInt(match[1]) : 99;
};

// Helper: Parse salary string into numeric LPA
const parseSalary = (salaryStr: string) => {
  const num = parseFloat(salaryStr.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
};

// Reusable Custom Glassmorphic Dropdown Component
function CustomDropdown({ label, options, value, onChange }: { label?: string, options: string[], value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {label && <label className="block text-[10px] uppercase font-bold text-[#6B7280] mb-1.5 ml-1 tracking-wider">{label}</label>}
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full min-w-[140px] px-4 py-2.5 bg-[#111827] border border-[#1F2937] hover:border-[#3B82F6]/50 rounded-xl text-sm font-semibold text-[#E5E7EB] transition-all focus:ring-2 focus:ring-[#3B82F6]/30 shadow-sm"
      >
        <span className="truncate mr-2">{value}</span>
        <ChevronDown className={`w-4 h-4 text-[#9CA3AF] transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
           <motion.div 
             initial={{ opacity: 0, y: 10, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             transition={{ duration: 0.15 }}
             className="absolute z-[1000] top-full mt-2 w-full min-w-[200px] left-0 md:right-0 md:left-auto p-1.5 bg-[#111827] border border-[#1F2937] rounded-xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.8)]"
           >
             {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${value === opt ? 'bg-[#3B82F6]/10 text-[#3B82F6] font-bold' : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#E5E7EB] font-medium'}`}
                >
                  <span className="truncate">{opt}</span>
                  {value === opt && <Check className="w-4 h-4 ml-2 flex-shrink-0" />}
                </button>
             ))}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function JobHuntSection() {
  const [step, setStep] = useState<JobHuntStep>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  
  // Credits Integration
  const [showRefill, setShowRefill] = useState(false);
  const [lastCreditInfo, setLastCreditInfo] = useState({ current: 0, required: 5 });

  const [parsedText, setParsedText] = useState("");
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [page, setPage] = useState(1);
  const [filterSalary, setFilterSalary] = useState("Any Salary");
  const [filterDate, setFilterDate] = useState("Any Time");
  const [sortBy, setSortBy] = useState("Recommended");
  const jobsPerPage = 6;

  const inputRef = useRef<HTMLInputElement>(null);
  const { checkAuth } = useAuthCheck();

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File must be under 10MB."); return; }
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleGetRoles = async () => {
    if (!file) return;
    if (!checkAuth()) return;
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/jobhunt/suggest-roles", { method: "POST", body: formData });
      const data = await res.json();

      if (res.status === 403) {
        setLastCreditInfo({ current: data.credits || 0, required: data.required || 5 });
        setShowRefill(true);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed to fetch roles");

      window.dispatchEvent(new Event("credits_updated"));

      if (data.meta) {
        const { recordAIUsage } = await import("@/lib/usage-storage");
        recordAIUsage(data.meta.modelUsed, data.meta.exhaustedKeys || []);
      }

      setSuggestedRoles(data.roles);
      setParsedText(data.parsedText);
      setStep("ROLES");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error analyzing resume");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchJobs = async () => {
    if (selectedRoles.length === 0 || selectedTypes.length === 0) {
      setError("Please select at least one role and one job type.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/jobhunt/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: parsedText, roles: selectedRoles, jobTypes: selectedTypes }),
      });

      const data = await res.json();
      
      if (res.status === 403) {
        setLastCreditInfo({ current: data.credits || 0, required: data.required || 5 });
        setShowRefill(true);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");

      window.dispatchEvent(new Event("credits_updated"));

      if (data.meta) {
        const { recordAIUsage } = await import("@/lib/usage-storage");
        recordAIUsage(data.meta.modelUsed, data.meta.exhaustedKeys || []);
      }

      setJobs(data.jobs || []);
      setPage(1);
      setStep("RESULTS");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error searching jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (filterDate === "Last 24 hours") {
      result = result.filter(j => parseDays(j.datePosted) <= 1);
    } else if (filterDate === "Last 7 days") {
      result = result.filter(j => parseDays(j.datePosted) <= 7);
    }

    if (filterSalary === "₹5LPA - ₹10LPA") {
      result = result.filter(j => {
        const num = parseSalary(j.salary);
        return num && ((num >= 5 && num <= 10) || (num >= 500000 && num <= 1000000));
      });
    } else if (filterSalary === "₹10LPA+") {
      result = result.filter(j => {
        const num = parseSalary(j.salary);
        return num && (num > 10 || num > 1000000);
      });
    }

    if (sortBy === "Highest Salary") {
       result = [...result].sort((a, b) => parseSalary(b.salary) - parseSalary(a.salary));
    } else if (sortBy === "Newest First") {
       result = [...result].sort((a, b) => parseDays(a.datePosted) - parseDays(b.datePosted));
    }

    return result;
  }, [jobs, filterSalary, filterDate, sortBy]);

  const currentJobs = useMemo(() => {
    const start = (page - 1) * jobsPerPage;
    return filteredJobs.slice(start, start + jobsPerPage);
  }, [filteredJobs, page]);

  return (
    <section id="jobhunt" className="py-12 md:py-16 px-4 bg-[#0A0D14] relative border-t border-[#1F2937] min-h-screen flex flex-col justify-center">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3B82F6] rounded-full blur-[200px] opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto mb-8 flex flex-col items-center text-center">
         <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#E5E7EB] tracking-tighter mb-2">
            JOB <span className="text-[#3B82F6]">HUNT</span>
         </h2>
         <p className="text-[#9CA3AF] text-sm md:text-base max-w-2xl font-medium">Skip the noise. Drop in your precise resume to unearth deeply matched opportunities hidden across the professional network.</p>
      </div>

      {step !== "RESULTS" ? (
        <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-6 lg:gap-8 items-stretch">
          {/* Left Column (Video) - Classic Split Layout */}
          <div className="flex flex-col w-full md:w-[40%] sticky top-8 rounded-2xl overflow-hidden border border-[#1F2937]/80 shadow-2xl bg-[#111827]/40 h-[220px] md:h-auto min-h-[220px] max-h-[70vh] 2xl:max-h-[600px] z-20">
            <div className="relative w-full h-full">
              <video 
                src="/section2_jobhunt_assets/Man_searching_for_202604010158.mp4" 
                autoPlay loop muted playsInline 
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/40 to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 text-left">
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/30 mb-2">
                    <Sparkles className="w-3 h-3 text-[#60A5FA]" />
                    <span className="text-[#60A5FA] text-[10px] font-bold uppercase tracking-wider">Powered by AI</span>
                 </div>
                 <h3 className="text-xl md:text-2xl font-bold text-white mb-1 leading-tight">Targeted Career AI</h3>
                 <p className="text-[#9CA3AF] text-xs leading-relaxed hidden sm:block">Upload your parsed DNA to discover perfectly aligned opportunities.</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[60%] flex flex-col justify-center relative z-10">
            <AnimatePresence mode="wait">
              {step === "UPLOAD" && (
                <motion.div key="step-upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col justify-center">
                  {!file ? (
                    <div
                      onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }} onClick={() => inputRef.current?.click()}
                      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-10 flex flex-col items-center justify-center min-h-[220px] md:h-full transition-all duration-300 ${
                        isDragging ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-[#1F2937] bg-[#111827]/40 hover:border-[#3B82F6]/50 hover:bg-[#111827]"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full bg-[#1F2937]/50 flex items-center justify-center mb-4"><Upload className="w-6 h-6 text-[#9CA3AF]" /></div>
                      <h3 className="text-lg md:text-xl text-[#E5E7EB] font-bold mb-1">Land your Dream Job</h3>
                      <p className="text-[#6B7280] text-sm font-medium">Drop your existing PDF resume here.</p>
                      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#1F2937] bg-[#111827]/60 p-8 text-center backdrop-blur-sm shadow-xl">
                      <FileSignature className="w-12 h-12 text-[#4ADE80] mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-[#E5E7EB] mb-1">{file.name}</h3>
                      <button onClick={handleGetRoles} disabled={isLoading} className="mt-8 w-full group relative overflow-hidden py-3 rounded-xl font-bold text-white shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)] disabled:opacity-50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] transition-transform duration-300 group-hover:scale-[1.05]" />
                        <div className="relative flex items-center justify-center gap-3">
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Extract My Targeted Roles <ArrowRightCircle className="w-4 h-4" /></>}
                        </div>
                      </button>
                      <button onClick={() => setFile(null)} className="mt-4 text-[#6B7280] text-sm hover:text-white underline">Pick different file</button>
                    </div>
                  )}
                </motion.div>
              )}

              {step === "ROLES" && (
                <motion.div key="step-roles" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div><h3 className="text-xl font-bold text-[#E5E7EB] mb-2">Analyzed Matches 🎯</h3><p className="text-[#9CA3AF] text-sm">Select paths you prefer.</p></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedRoles.map((role) => {
                      const isSelected = selectedRoles.includes(role);
                      return (
                        <button key={role} onClick={() => setSelectedRoles((prev) => isSelected ? prev.filter((r) => r !== role) : [...prev, role])} style={isSelected ? { boxShadow: "0 0 15px -5px rgba(34,197,94,0.3)" } : {}} className={`text-left p-4 rounded-xl border transition-all duration-300 ${isSelected ? "border-[#22C55E] bg-[#22C55E]/10 font-bold text-[#4ADE80]" : "border-[#1F2937] bg-[#111827]/50 text-[#E5E7EB] hover:bg-[#111827]"}`}>{role}</button>
                      );
                    })}
                  </div>
                  <div className="pt-2 flex justify-end">
                     <button onClick={() => { if (selectedRoles.length === 0) setError("Select a role."); else { setError(null); setStep("TYPES"); } }} className="px-6 py-3 flex items-center gap-2 rounded-xl bg-white text-gray-900 font-bold hover:bg-[#E5E7EB] hover:scale-105 transition-all shadow-xl">Continue <ArrowRightCircle className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              )}

              {step === "TYPES" && (
                <motion.div key="step-types" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div><h3 className="text-xl font-bold text-[#E5E7EB] mb-2">Engagement Type 💼</h3><p className="text-[#9CA3AF] text-sm">What kind of commitment are you actively looking for?</p></div>
                  <div className="flex flex-wrap gap-3">
                    {JOB_TYPES.map((type) => {
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <button key={type} onClick={() => setSelectedTypes((prev) => isSelected ? prev.filter((t) => t !== type) : [...prev, type])} style={isSelected ? { boxShadow: "0 0 15px -5px rgba(59,130,246,0.3)" } : {}} className={`px-5 py-3 rounded-xl border text-sm transition-all duration-300 ${isSelected ? "border-[#3B82F6] bg-[#3B82F6]/10 font-bold text-[#60A5FA]" : "border-[#1F2937] bg-[#111827]/50 font-semibold text-[#9CA3AF] hover:bg-[#111827]"}`}>{type}</button>
                      );
                    })}
                  </div>
                  <div className="pt-4">
                    <button onClick={handleFetchJobs} disabled={isLoading} className="w-full relative py-3.5 rounded-xl font-bold text-white bg-[#3B82F6] hover:bg-[#2563EB] shadow-[0_0_30px_-10px_rgba(59,130,246,0.4)] disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2">
                       {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-4 h-4"/> Fetch Map and Opportunities</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm flex justify-center font-bold">{error}</motion.div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col items-stretch space-y-8">
          <AnimatePresence mode="wait">
            <motion.div key="step-results" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-10">
              
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-auto">
                 <div className="flex flex-col w-full lg:w-[35%] rounded-3xl overflow-hidden border border-[#1F2937]/80 shadow-[0_0_50px_-20px_rgba(59,130,246,0.2)] bg-[#111827]/40 min-h-[400px]">
                   <div className="relative w-full h-full">
                     <video 
                       src="/section2_jobhunt_assets/Man_searching_for_202604010158.mp4" 
                       autoPlay loop muted playsInline 
                       className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/40 to-transparent pointer-events-none" />
                     <div className="absolute bottom-6 left-6 right-6 text-left">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/30 mb-2">
                           <Sparkles className="w-3 h-3 text-[#60A5FA]" />
                           <span className="text-[#60A5FA] text-[10px] font-bold uppercase tracking-wider">Powered by AI</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1 leading-tight">Targeted Career AI</h3>
                        <p className="text-[#9CA3AF] text-xs leading-relaxed hidden sm:block">Upload your parsed DNA to discover perfectly aligned opportunities.</p>
                     </div>
                   </div>
                 </div>

                 <div className="w-full lg:w-[65%]">
                    <JobMapDynamic jobs={currentJobs} />
                 </div>
              </div>

              <div className="w-full p-4 rounded-2xl bg-[#111827]/80 backdrop-blur-xl border border-[#1F2937] flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] relative z-[100]">
                 <div className="flex flex-col items-center md:items-start ml-2">
                   <span className="text-2xl font-black text-white">{filteredJobs.length}</span>
                   <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">Active Matches</span>
                 </div>

                 <div className="w-full md:w-auto h-px md:h-12 md:w-px bg-[#1F2937] opacity-50" />

                 <div className="w-full md:w-auto flex flex-col md:flex-row gap-4 items-end md:items-center justify-center">
                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full sm:w-auto">
                      <CustomDropdown label="Compensation" value={filterSalary} options={["Any Salary", "₹5LPA - ₹10LPA", "₹10LPA+"]} onChange={setFilterSalary} />
                      <CustomDropdown label="Posted Date" value={filterDate} options={["Any Time", "Last 24 hours", "Last 7 days"]} onChange={setFilterDate} />
                      <div className="col-span-2 lg:col-span-1">
                         <CustomDropdown label="Algorithm Sort" value={sortBy} options={["Recommended", "Highest Salary", "Newest First"]} onChange={setSortBy} />
                      </div>
                   </div>
                 </div>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-20 px-6 border border-[#1F2937] bg-[#111827]/40 rounded-3xl">
                   <h3 className="text-2xl font-bold text-[#E5E7EB] mb-2">No direct hits recorded</h3>
                   <p className="text-[#9CA3AF] mb-8">Try expanding your selected domains.</p>
                   <button onClick={() => setStep("TYPES")} className="px-6 py-2.5 rounded-lg border border-[#3B82F6]/50 text-[#3B82F6] font-bold hover:bg-[#3B82F6]/10 transition-colors">Refine Search</button>
                </div>
              ) : (
                <div>
                  <div className="space-y-12">
                    {/* Remote Section */}
                    {currentJobs.filter(j => j.category === "Remote").length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                           <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
                              <span className="text-xl">🏠</span>
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-white tracking-tight">Remote Opportunities</h4>
                              <p className="text-[10px] text-[#3B82F6] font-bold uppercase tracking-[0.2em]">Work from anywhere</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                           {currentJobs.filter(j => j.category === "Remote").map((job, idx) => (
                             <JobCard key={`remote-${idx}`} job={job} />
                           ))}
                        </div>
                      </div>
                    )}

                    {/* On-site Section */}
                    {currentJobs.filter(j => j.category !== "Remote").length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                           <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-sm">
                              <span className="text-xl">🏢</span>
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-white tracking-tight">On-site & Hybrid Hubs</h4>
                              <p className="text-[10px] text-[#A855F7] font-bold uppercase tracking-[0.2em]">Industry Tech Epicenters</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                           {currentJobs.filter(j => j.category !== "Remote").map((job, idx) => (
                             <JobCard key={`other-${idx}`} job={job} />
                           ))}
                        </div>
                      </div>
                    )}

                    {currentJobs.length === 0 && (
                      <div className="py-20 text-center text-[#9CA3AF]">No results match your exact filters. Change your dropdowns!</div>
                    )}
                  </div>

                  {filteredJobs.length > jobsPerPage && (
                    <div className="flex items-center justify-between pt-8 px-4 border-t border-[#1F2937]/50">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-5 py-2.5 rounded-xl bg-[#111827] border border-[#1F2937] text-[#E5E7EB] text-sm font-bold disabled:opacity-30 hover:bg-[#1F2937] hover:border-[#3B82F6]/50 transition-all shadow-md">Prev Page</button>
                      <span className="text-[#9CA3AF] text-sm font-bold tracking-widest uppercase bg-[#111827] px-4 py-1.5 rounded-full border border-[#1F2937]">Page {page} of {Math.ceil(filteredJobs.length / jobsPerPage)}</span>
                      <button onClick={() => setPage((p) => Math.min(Math.ceil(filteredJobs.length / jobsPerPage), p + 1))} disabled={page === Math.ceil(filteredJobs.length / jobsPerPage)} className="px-5 py-2.5 rounded-xl bg-[#111827] border border-[#1F2937] text-[#E5E7EB] text-sm font-bold disabled:opacity-30 hover:bg-[#1F2937] hover:border-[#3B82F6]/50 transition-all shadow-md">Next Page</button>
                    </div>
                  )}
                  
                  <div className="text-center pt-16">
                     <button onClick={() => {setStep("UPLOAD"); setFile(null); setSelectedRoles([]); setSelectedTypes([]);}} className="text-sm font-bold text-[#6B7280] hover:text-[#E5E7EB] transition-colors underline underline-offset-4">Run entirely new iteration</button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {error && (
            <div className="mt-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm flex justify-center font-bold">{error}</div>
          )}
        </div>
      )}

      <RefillModal 
        isOpen={showRefill} 
        onClose={() => setShowRefill(false)} 
        currentCredits={lastCreditInfo.current}
        requiredCredits={lastCreditInfo.required}
      />
    </section>
  );
}
