"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import RefillModal from "./RefillModal";

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

interface UploadSectionProps {
  onAnalysisComplete: (data: AnalysisData) => void;
}

export default function UploadSection({ onAnalysisComplete }: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Uploading resume...");
  const [modelChoice, setModelChoice] = useState<"gemini" | "groq">("gemini");
  
  // Credits Integration
  const [showRefill, setShowRefill] = useState(false);
  const [lastCreditInfo, setLastCreditInfo] = useState({ current: 0, required: 10 });

  const inputRef = useRef<HTMLInputElement>(null);
  const { checkAuth } = useAuthCheck();

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile]
  );

  const removeFile = useCallback(() => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    if (!checkAuth()) return;

    setIsAnalyzing(true);
    setError(null);

    const loadingMessages = [
      "Uploading resume...",
      "Extracting content...",
      `Running high-priority matching algorithms...`,
      "Generating strategic insights...",
    ];

    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = Math.min(msgIndex + 1, loadingMessages.length - 1);
      setLoadingText(loadingMessages[msgIndex]);
    }, 1500);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("model", modelChoice);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.status === 403) {
        // Insufficient Credits!
        setLastCreditInfo({ current: data.credits || 0, required: data.required || 10 });
        setShowRefill(true);
        setIsAnalyzing(false);
        clearInterval(interval);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      clearInterval(interval);
      
      // Update local storage tracking if applicable
      if (data.meta) {
        const { recordAIUsage } = await import("@/lib/usage-storage");
        recordAIUsage(data.meta.modelUsed, data.meta.exhaustedKeys || []);
      }
      
      // Trigger global credits update event
      window.dispatchEvent(new Event("credits_updated"));

      if (data.meta?.isFallback) {
        window.dispatchEvent(new CustomEvent("ai-fallback", { 
          detail: { modelUsed: data.meta.modelUsed } 
        }));
      }

      onAnalysisComplete(data.analysis);
    } catch (err: unknown) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, modelChoice, onAnalysisComplete, checkAuth]);

  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

  return (
    <section
      id="upload"
      className="py-24 md:py-32 px-4 bg-[#0D1117] relative"
    >
      {/* Background ambient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#3B82F6] rounded-full blur-[180px] opacity-[0.06] pointer-events-none" />


      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-12"
        >
          <p className="text-xs font-medium text-[#9CA3AF] tracking-widest uppercase mb-3">
            Step 1
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] tracking-tight">
            Upload Your Resume
          </h2>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
        >
          {/* AI Model Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border border-[#1F2937] bg-[#111827]/60 p-1">
              <button
                onClick={() => setModelChoice("gemini")}
                disabled={isAnalyzing}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  modelChoice === "gemini"
                    ? "bg-[#3B82F6] text-white shadow"
                    : "text-[#9CA3AF] hover:text-[#E5E7EB]"
                }`}
              >
                Deep Scan Engine
              </button>
              <button
                onClick={() => setModelChoice("groq")}
                disabled={isAnalyzing}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  modelChoice === "groq"
                    ? "bg-[#22C55E] text-white shadow"
                    : "text-[#9CA3AF] hover:text-[#E5E7EB]"
                }`}
              >
                Neural Path Core
              </button>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              /* Loading State */
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease }}
                className="rounded-2xl border border-[#1F2937] bg-[#111827]/60 p-12 flex flex-col items-center justify-center min-h-[280px]"
              >
                <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin mb-6" />
                <p className="text-[#E5E7EB] font-medium text-lg mb-2">
                  {loadingText}
                </p>
                <p className="text-[#9CA3AF] text-sm">
                  This may take a few seconds
                </p>
              </motion.div>
            ) : !file ? (
              /* Drop Zone */
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center min-h-[280px] transition-all duration-300 ${
                  isDragging
                    ? "border-[#3B82F6] bg-[#3B82F6]/5"
                    : "border-[#1F2937] bg-[#111827]/40 hover:border-[#3B82F6]/50 hover:bg-[#111827]/60"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${
                    isDragging
                      ? "bg-[#3B82F6]/20"
                      : "bg-[#1F2937]"
                  }`}
                >
                  <Upload
                    className={`w-7 h-7 transition-colors duration-300 ${
                      isDragging ? "text-[#3B82F6]" : "text-[#9CA3AF]"
                    }`}
                  />
                </div>

                <p className="text-[#E5E7EB] font-medium mb-1.5">
                  Drag & drop your resume here
                </p>
                <p className="text-[#9CA3AF] text-sm mb-6">
                  or click to browse — PDF only, up to 10MB
                </p>

                <div className="px-5 py-2.5 rounded-xl border border-[#1F2937] bg-[#0D1117] text-[#E5E7EB] text-sm font-medium hover:border-[#3B82F6]/50 transition-colors">
                  Choose File
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </motion.div>
            ) : (
              /* File Selected */
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease }}
                className="rounded-2xl border border-[#1F2937] bg-[#111827]/60 p-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#3B82F6]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[#E5E7EB] font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-[#9CA3AF] text-sm">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <button
                    onClick={removeFile}
                    className="w-8 h-8 rounded-lg hover:bg-[#1F2937] flex items-center justify-center text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAnalyze}
                  className="w-full py-3.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                >
                  Analyze Resume
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 text-[#EF4444] text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      <RefillModal 
        isOpen={showRefill} 
        onClose={() => setShowRefill(false)} 
        currentCredits={lastCreditInfo.current}
        requiredCredits={lastCreditInfo.required}
      />
    </section>
  );
}
