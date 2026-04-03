import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import ModelToast from "@/components/ModelToast";
import DevDashboard from "@/components/DevDashboard";
import DeveloperComment from "@/components/DeveloperComment";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResuAI — AI Career Dashboard",
  description:
    "Analyze your resume, find hyper-local jobs, and build professional resumes with AI-powered templates.",
  authors: [{ name: "Arpit Raj", url: "https://github.com/arpitraj" }],
  creator: "Arpit Raj",
  publisher: "Arpit Raj",
  icons: {
    icon: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} h-full antialiased`}>
        <head>
          <link rel="author" href="/humans.txt" />
        </head>
        <body className="min-h-full flex flex-col font-sans bg-[#0B0F1A] text-white selection:bg-blue-500/30">
          <DeveloperComment />
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <ModelToast />
          <DevDashboard />
        </body>
      </html>
    </ClerkProvider>
  );
}
