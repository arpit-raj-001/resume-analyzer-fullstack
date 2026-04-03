"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Sparkles, Download, ArrowLeft, Plus, Trash2, Eye, Edit3, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import templatesData from "@/data/templates.json";
import RefillModal from "@/components/RefillModal";

export default function ResumeBuilder() {
  const { id } = useParams();
  const router = useRouter();
  const resumeRef = useRef<HTMLDivElement>(null);
  
  // Mobile View Switcher (Form vs Preview)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  
  // Find the selected template
  const template = useMemo(() => {
    if (!id) return null;
    return templatesData.templates.find(t => t.id === id);
  }, [id]);

  // State for the reactive resume data
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Credits Integration
  const [showRefill, setShowRefill] = useState(false);
  const [lastCreditInfo, setLastCreditInfo] = useState({ current: 0, required: 5 });

  // Initialize data from localstorage or sample
  useEffect(() => {
    if (!template) return;
    try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(`resume_draft_${id}`) : null;
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
                setFormData(parsed);
                return;
            }
        }
        setFormData(template.sample_data);
    } catch (e) {
        console.error("Error loading resume data:", e);
        setFormData(template.sample_data);
    }
  }, [id, template]);

  const handleInputChange = (field: string, value: any) => {
    if (!formData) return;
    const updated = { ...formData, [field]: value };
    setFormData(updated);
  };

  const handleArrayChange = (field: string, index: number, subField: string, value: any) => {
    if (!formData || !formData[field]) return;
    const arr = [...(formData[field] || [])];
    if (arr[index]) {
      arr[index] = { ...arr[index], [subField]: value };
      handleInputChange(field, arr);
    }
  };

  const addArrayItem = (field: string, defaultFields: any) => {
    if (!formData) return;
    const arr = [...(formData[field] || [])];
    const newItem = defaultFields.reduce((acc: any, f: any) => ({ ...acc, [f.name]: "" }), {});
    handleInputChange(field, [...arr, newItem]);
  };

  const removeArrayItem = (field: string, index: number) => {
    if (!formData || !formData[field]) return;
    const arr = [...(formData[field] || [])];
    arr.splice(index, 1);
    handleInputChange(field, arr);
  };

  const saveToLocal = () => {
    if (!formData || !template) return;
    setIsSaving(true);
    localStorage.setItem(`resume_draft_${id}`, JSON.stringify(formData));
    
    const library = JSON.parse(localStorage.getItem("resuai_library") || "[]");
    const existingIdx = library.findIndex((r: any) => r.draftId === id);
    const entry = { draftId: id, name: formData.name || "Untitled", templateName: template.name, updatedAt: new Date().toISOString() };
    
    if (existingIdx > -1) library[existingIdx] = entry;
    else library.push(entry);
    
    localStorage.setItem("resuai_library", JSON.stringify(library));
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleDownloadPDF = async () => {
    if (!resumeRef.current || !formData) return;
    setIsDownloading(true);
    
    try {
        const creditRes = await fetch("/api/user/credits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "consume_download" })
        });
        const creditData = await creditRes.json();

        if (creditRes.status === 403) {
            setLastCreditInfo({ current: creditData.credits || 0, required: 5 });
            setShowRefill(true);
            setIsDownloading(false);
            return;
        }

        if (!creditRes.ok) throw new Error(creditData.error || "Credit check failed");
        window.dispatchEvent(new Event("credits_updated"));

        const originalScrollY = window.scrollY;
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 100));

        const html2pdf = (await import("html2pdf.js")).default;
        const element = resumeRef.current;
        const filename = `${(formData.name || "Resume").replace(/\s+/g, '_')}_Resume.pdf`;
        
        const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 } as const,
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false, backgroundColor: "#ffffff" },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } as const,
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const }
        };
        
        await (html2pdf() as any).set(opt).from(element).save();
        window.scrollTo(0, originalScrollY);
    } catch (error) {
        console.error("PDF generation failed:", error);
    } finally {
        setIsDownloading(false);
    }
  };

  const renderedHTML = useMemo(() => {
    if (!template || !formData) return "";
    try {
        let html = template.html_template;
        const fontName = (template.style?.font || "Inter").replace(/ /g, '+');
        const fontImport = `<style>@import url('https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700;800;900&display=swap');</style>`;
        html = fontImport + html;

        Object.keys(formData).forEach(key => {
            const val = formData[key];
            if (typeof val === 'string' || typeof val === 'number') {
                const regex = new RegExp(`{{${key}}}`, 'g');
                html = html.replace(regex, String(val || ''));
            }
        });

        const loopRegex = /{{#each (\w+)}}([\s\S]*?){{\/each}}/g;
        html = html.replace(loopRegex, (_, field, inner) => {
            const items = formData[field];
            if (!Array.isArray(items)) return "";
            return items.map((item: any) => {
                let itemHtml = inner;
                Object.keys(item || {}).forEach(key => {
                    const r = new RegExp(`{{${key}}}`, 'g');
                    itemHtml = itemHtml.replace(r, String(item[key] || ''));
                });
                return itemHtml;
            }).join('');
        });

        html = html.replace(/{{.*?}}/g, '');
        return html;
    } catch (err) {
        return `<div style="padding: 40px; color: #EF4444; font-family: sans-serif;">Rendering Error</div>`;
    }
  }, [formData, template]);

  // Zoom state for mobile preview
  const [isZoomed, setIsZoomed] = useState(true);

  if (!template || !formData) return null;

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col md:flex-row pt-20 overflow-x-hidden">
      
      {/* MOBILE TABS: Switch between edit and preview */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
         <button onClick={() => setActiveTab("edit")} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'edit' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF]'}`}>
            <Edit3 className="w-4 h-4" /> Edit
         </button>
         <button onClick={() => setActiveTab("preview")} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'preview' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF]'}`}>
            <Eye className="w-4 h-4" /> Preview
         </button>
      </div>

      {/* LEFT: FORM PANEL */}
      <div className={`w-full md:w-[450px] lg:w-[500px] bg-[#0D1117] border-r border-[#1F2937] flex flex-col h-[calc(100vh-80px)] sticky top-20 overflow-hidden ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-[#1F2937] flex items-center justify-between bg-[#0D1117]/50 backdrop-blur-sm z-10">
           <Link href="/create-resume" className="text-[#9CA3AF] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
           </Link>
           <div className="flex gap-2">
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="md:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B82F6] text-white text-xs font-bold uppercase transition-all shadow-lg active:scale-95"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              </button>
              <button onClick={saveToLocal} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-bold uppercase transition-all hover:bg-[#3B82F6]/20">
                {isSaving ? "Saving..." : <><Save className="w-4 h-4"/> Save Draft</>}
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32 md:pb-20">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">{template.name}</h2>
            <p className="text-xs text-[#9CA3AF]">Fill your details below. Preview updates instantly.</p>
          </div>

          {(template.form_schema || []).map((section: any) => (
            <div key={section.field} className="space-y-4">
               <label className="text-xs font-black uppercase tracking-widest text-[#3B82F6] flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                 {section.label}
               </label>
               
               {section.type === "text" || section.type === "email" || section.type === "url" || section.type === "tel" ? (
                 <input type={section.type} value={formData[section.field] || ""} onChange={(e) => handleInputChange(section.field, e.target.value)} className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B82F6]/50 transition-all font-medium" />
               ) : section.type === "textarea" ? (
                 <textarea rows={4} value={formData[section.field] || ""} onChange={(e) => handleInputChange(section.field, e.target.value)} className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B82F6]/50 transition-all resize-none" />
               ) : section.type === "array" ? (
                  <div className="space-y-4">
                    {(formData[section.field] || []).map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-[#111827] border border-[#1F2937] rounded-2xl relative space-y-3 group/item">
                         <button onClick={() => removeArrayItem(section.field, idx)} className="absolute top-4 right-4 text-[#9CA3AF] hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                         {(section.fields || []).map((sub: any) => (
                            <div key={sub.name} className="space-y-1">
                               <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">{sub.label}</label>
                               {sub.type === "textarea" ? (
                                  <textarea rows={3} value={item[sub.name] || ""} onChange={(e) => handleArrayChange(section.field, idx, sub.name, e.target.value)} className="w-full bg-[#0D1117] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                               ) : (
                                  <input type={sub.type} value={item[sub.name] || ""} onChange={(e) => handleArrayChange(section.field, idx, sub.name, e.target.value)} className="w-full bg-[#0D1117] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                               )}
                            </div>
                         ))}
                      </div>
                    ))}
                    <button onClick={() => addArrayItem(section.field, section.fields)} className="w-full py-3 border-2 border-dashed border-[#1F2937] rounded-2xl text-[#9CA3AF] hover:text-white hover:border-[#3B82F6]/50 transition-all flex items-center justify-center gap-2 text-xs font-bold"><Plus className="w-4 h-4" /> Add {section.label}</button>
                  </div>
               ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: PREVIEW PANEL */}
      <div className={`flex-1 bg-[#0B0F1A] p-4 md:p-10 lg:p-20 flex flex-col items-center overflow-y-auto overflow-x-auto custom-scrollbar ${activeTab === 'edit' ? 'hidden md:flex' : 'flex px-2 md:px-10'}`}>
          <div className="w-full max-w-4xl flex items-center justify-between mb-8 gap-4 px-2 sticky top-0 md:relative z-20">
             <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-[#9CA3AF] uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                </span>
                {/* Mobile Toggle: Zoom vs Fit */}
                <button 
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="md:hidden px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/40 rounded-full text-[10px] font-black text-[#60A5FA] uppercase flex items-center gap-2 active:scale-95 transition-all"
                >
                  {isZoomed ? <><ChevronRight className="w-3 h-3 rotate-90" /> Fit Page</> : <><Sparkles className="w-3 h-3" /> Focus Mode</>}
                </button>
             </div>
             
             {/* Sticky Download for Mobile & Desktop */}
             <button 
               onClick={handleDownloadPDF}
               disabled={isDownloading}
               className="flex items-center gap-2 px-6 lg:px-8 py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-black shadow-[0_10px_30px_rgba(59,130,246,0.4)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
               <Download className="w-4 h-4" /> {isDownloading ? "..." : "PDF"}
             </button>
          </div>

          <div 
            ref={resumeRef} 
            className={`bg-white shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden transform-gpu origin-top mb-32 transition-transform duration-300 ${isZoomed ? 'w-[850px] min-w-[850px]' : 'w-full max-w-[850px]'}`}
            style={{
                scale: typeof window !== 'undefined' && window.innerWidth < 768 && !isZoomed ? Math.min(1, (window.innerWidth - 32) / 850) : 1
            }}
          >
             <div dangerouslySetInnerHTML={{ __html: renderedHTML }} className="w-full h-full" />
          </div>
      </div>

      <RefillModal isOpen={showRefill} onClose={() => setShowRefill(false)} currentCredits={lastCreditInfo.current} requiredCredits={lastCreditInfo.required} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1F2937; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3B82F6; }
      `}</style>
    </div>
  );
}
