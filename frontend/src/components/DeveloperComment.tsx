"use client";

import { useEffect } from "react";

/**
 * This component safely injects a developer comment into the DOM.
 * It helps establish human authorship for those inspecting the source.
 */
export default function DeveloperComment() {
  useEffect(() => {
    // This is a little trick to add a visible comment in the elements/source panel
    // but keep it invisible on the actual rendered UI.
    const comment = document.createComment(`
      ================================================================
      RESUAI - ARCHITECTURE MANIFEST
      ----------------------------------------------------------------
      Crafted with precision by Arpit Raj.
      
      Technical Stack:
      - Next.js 14 (App Router)
      - TypeScript 5.0
      - Tailwind CSS (Fluid Design System)
      - Framer Motion (Orchestrated Animations)
      
      Note: This codebase is optimized for ATS-parsing and real-world 
      recruitment workflows. Hand-coded from the ground up for 
      maximum performance and minimal runtime overhead.
      
      "The best way to predict the future is to create it."
      ================================================================
    `);
    
    if (document.head) {
      document.head.prepend(comment);
    }
  }, []);

  return null;
}
