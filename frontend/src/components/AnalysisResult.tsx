"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Zap,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Briefcase,
  FolderGit2,
  Target,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";

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

interface AnalysisResultProps {
  data: AnalysisData;
  onReset: () => void;
}

export default function AnalysisResult({ data, onReset }: AnalysisResultProps) {
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

  const scoreColor =
    data.atsScore >= 80
      ? "#22C55E"
      : data.atsScore >= 60
        ? "#F59E0B"
        : "#EF4444";

  const scoreLabel =
    data.atsScore >= 80
      ? "Excellent"
      : data.atsScore >= 60
        ? "Good"
        : "Needs Work";

  return (
    <section className="py-24 md:py-32 px-4 bg-[#0D1117] relative">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#3B82F6] rounded-full blur-[200px] opacity-[0.05] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-16"
        >
          <p className="text-xs font-medium text-[#22C55E] tracking-widest uppercase mb-3">
            Analysis Complete
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] tracking-tight">
            Your Resume Insights
          </h2>
        </motion.div>

        {/* Fallback Message Alert */}
        {data.fallbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-8 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-[#F59E0B]"
          >
            <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium">{data.fallbackMessage}</p>
          </motion.div>
        )}

        {/* ATS Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease }}
          className="rounded-2xl border border-[#1F2937] bg-[#111827]/60 p-8 mb-6 flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#1F2937"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{
                  strokeDashoffset:
                    2 * Math.PI * 42 * (1 - data.atsScore / 100),
                }}
                transition={{ duration: 1.2, delay: 0.3, ease }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-2xl font-bold"
                style={{ color: scoreColor }}
              >
                {data.atsScore}
              </span>
              <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">
                ATS
              </span>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-xl font-semibold text-[#E5E7EB] mb-1">
              ATS Compatibility:{" "}
              <span style={{ color: scoreColor }}>{scoreLabel}</span>
            </h3>
            <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-lg">
              {data.summary}
            </p>
          </div>
        </motion.div>

        {/* ATS Score Improvement Prompt (Low Score CTA) */}
        {data.atsScore < 85 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease }}
            className="mb-8 rounded-2xl border-2 border-dashed border-[#3B82F6]/30 bg-gradient-to-r from-[#3B82F6]/5 to-transparent p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6] rounded-full blur-[80px] opacity-[0.08] group-hover:opacity-[0.12] transition-opacity" />
            
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] shrink-0 shadow-lg">
                 <PlusCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Boost Your Score Instantly</h4>
                <p className="text-[#9CA3AF] text-sm max-w-md">Your score could be significantly higher with our elite, ATS-optimized layouts. Switch to a pro template now.</p>
              </div>
            </div>

            <Link 
              href="/create-resume"
              className="px-6 py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-bold transition-all shadow-[0_0_20px_-5px_rgba(59,130,246,0.4)] whitespace-nowrap"
            >
              Browse ATS Templates
            </Link>
          </motion.div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills */}
          <ResultCard
            icon={<Zap className="w-5 h-5" />}
            title="Skills Identified"
            color="#3B82F6"
            delay={0.1}
            ease={ease}
          >
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </ResultCard>

          {/* Strengths */}
          <ResultCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Strengths"
            color="#22C55E"
            delay={0.15}
            ease={ease}
          >
            <ul className="space-y-2.5">
              {data.strengths.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-[#9CA3AF]"
                >
                  <span className="text-[#22C55E] mt-0.5 shrink-0">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </ResultCard>

          {/* Weaknesses */}
          <ResultCard
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Areas for Improvement"
            color="#F59E0B"
            delay={0.2}
            ease={ease}
          >
            <ul className="space-y-2.5">
              {data.weaknesses.map((w, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-[#9CA3AF]"
                >
                  <span className="text-[#F59E0B] mt-0.5 shrink-0">!</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </ResultCard>

          {/* Suggestions */}
          <ResultCard
            icon={<Lightbulb className="w-5 h-5" />}
            title="Suggestions"
            color="#A78BFA"
            delay={0.25}
            ease={ease}
          >
            <ul className="space-y-2.5">
              {data.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-[#9CA3AF]"
                >
                  <span className="text-[#A78BFA] mt-0.5 shrink-0">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </ResultCard>

          {/* Experience */}
          {data.experience.length > 0 && (
            <ResultCard
              icon={<Briefcase className="w-5 h-5" />}
              title="Experience"
              color="#F472B6"
              delay={0.3}
              ease={ease}
            >
              <ul className="space-y-2.5">
                {data.experience.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-[#9CA3AF]"
                  >
                    <span className="text-[#F472B6] mt-0.5 shrink-0">•</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </ResultCard>
          )}

          {/* Projects */}
          {data.projects.length > 0 && (
            <ResultCard
              icon={<FolderGit2 className="w-5 h-5" />}
              title="Projects"
              color="#38BDF8"
              delay={0.35}
              ease={ease}
            >
              <ul className="space-y-2.5">
                {data.projects.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-[#9CA3AF]"
                  >
                    <span className="text-[#38BDF8] mt-0.5 shrink-0">◆</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </ResultCard>
          )}

          {/* Suggested Jobs */}
          {data.suggestedJobs.length > 0 && (
            <ResultCard
              icon={<Target className="w-5 h-5" />}
              title="Suggested Roles"
              color="#FB923C"
              delay={0.4}
              ease={ease}
              fullWidth
            >
              <div className="flex flex-wrap gap-2">
                {data.suggestedJobs.map((job, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FB923C]/10 text-[#FB923C] border border-[#FB923C]/20"
                  >
                    {job}
                  </span>
                ))}
              </div>
            </ResultCard>
          )}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => document.getElementById("jobhunt-anchor")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3.5 rounded-xl border border-transparent bg-[#3B82F6] text-white font-bold hover:bg-[#2563EB] shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] transition-all duration-300 w-full sm:w-auto text-sm"
          >
            Find Targeted Jobs
          </button>
          
          <button
            onClick={onReset}
            className="px-8 py-3.5 rounded-xl border border-[#1F2937] bg-[#111827]/60 text-[#E5E7EB] font-medium hover:border-[#3B82F6]/50 hover:bg-[#111827] transition-all duration-300 w-full sm:w-auto text-sm"
          >
            Analyze Another Resume
          </button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Reusable card wrapper ─── */
function ResultCard({
  icon,
  title,
  color,
  delay,
  ease,
  fullWidth,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  delay: number;
  ease: [number, number, number, number];
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
      className={`rounded-2xl border border-[#1F2937] bg-[#111827]/60 p-6 ${
        fullWidth ? "md:col-span-2" : ""
      }`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <h3 className="text-[#E5E7EB] font-semibold text-sm tracking-wide">
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}
