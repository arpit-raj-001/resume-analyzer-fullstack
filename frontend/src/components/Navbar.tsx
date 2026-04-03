"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { FileText, Briefcase, PlusCircle, Bookmark, Menu, X, Zap } from "lucide-react";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import CreditsPill from "./CreditsPill";

// Fixed navbar with backdrop blur.
// Using z-[100] to stay above the dynamic gradients in the hero section.
// Also added a subtle bottom border to define the separation during scroll.
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { checkAuth } = useAuthCheck();

  const navLinks = [
    { name: "Pricing", href: "/pricing", icon: Zap, protected: false },
    { name: "Analyzer", href: "/", icon: FileText, protected: false },
    { name: "Job Hunt", href: "/#jobhunt-anchor", icon: Briefcase, protected: true },
    { name: "Resume Builder", href: "/create-resume", icon: PlusCircle, protected: true },
    { name: "My Resumes", icon: Bookmark, href: "/library", protected: true },
  ];

  const handleLinkClick = (e: React.MouseEvent, isProtected: boolean) => {
    if (isProtected && !checkAuth()) {
      e.preventDefault();
    }
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-[100] bg-[#0D1117]/80 backdrop-blur-md border-b border-[#1F2937]"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-blue-400/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] group-hover:scale-105">
            <img 
              src="/favicon.jpg" 
              alt="ResuAI Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[#F9FAFB] font-bold text-xl tracking-tighter transition-colors group-hover:text-blue-400">
            Resu<span className="text-[#3B82F6]">AI</span>
          </span>
        </Link>

        {/* Global Navigation - Mid Section (Desktop) */}
        <div className="hidden md:flex items-center gap-1 bg-[#111827]/50 p-1 rounded-full border border-[#1F2937]">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
                <link.icon className="w-4 h-4" />
                {link.name}
              </div>
            </Link>
          ))}
        </div>

        {/* Auth States & Mobile Toggle */}
        <div className="flex items-center gap-3 md:gap-4">
          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <CreditsPill />
              <div className="hidden md:block">
                <UserButton appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9 border border-blue-500/30 ring-2 ring-blue-500/10"
                  }
                }} />
              </div>
            </div>
          </Show>

          <div className="hidden md:block">
            <Show when="signed-out">
              <div className="flex items-center gap-4">
                <SignInButton mode="modal">
                  <button className="text-[#E5E7EB] hover:text-white transition-colors text-sm font-bold px-4 py-2 rounded-full hover:bg-white/5 cursor-pointer">
                    Log In
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] cursor-pointer">
                    Get Started
                  </button>
                </SignInButton>
              </div>
            </Show>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-all"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[#1F2937] bg-[#0D1117]/95 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  onClick={(e) => handleLinkClick(e, link.protected ?? false)}
                  className="flex items-center gap-4 text-[#9CA3AF] hover:text-[#3B82F6] transition-all font-semibold"
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-[#1F2937] flex flex-col gap-4">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="w-full bg-[#3B82F6] text-white py-3 rounded-xl font-bold shadow-lg">
                      Get Started
                    </button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <div className="flex items-center justify-between bg-[#111827] p-4 rounded-xl border border-[#1F2937]">
                    <span className="text-sm font-bold text-[#9CA3AF]">My Profile</span>
                    <UserButton />
                  </div>
                </Show>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
