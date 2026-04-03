import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// In-memory status for failure tracking (Session-based, per serverless instance)
const exhaustedGeminiKeys = new Set<string>();
const keyFailureTimestamps = new Map<string, number>();

// Recovery time for a rate-limited key (60 seconds)
const RECOVERY_MS = 60 * 1000;

export interface AIResponse {
  text: string;
  modelUsed: string;
  isFallback: boolean;
  exhaustedKeys: string[];
}

// Type for Gemini prompt parts
type GeminiPart = string | { inlineData: { data: string; mimeType: string } };

function getGeminiKeys(): string[] {
  const keys = [];
  if (process.env.GEMINI_API_KEY) keys.push("GEMINI_API_KEY");
  for (let i = 1; i <= 20; i++) {
    const keyName = `GEMINI_API_KEY_${i}`;
    if (process.env[keyName]) keys.push(keyName);
  }
  return keys;
}

function refreshKeys() {
  const now = Date.now();
  for (const [key, timestamp] of keyFailureTimestamps.entries()) {
    if (now - timestamp > RECOVERY_MS) {
      exhaustedGeminiKeys.delete(key);
      keyFailureTimestamps.delete(key);
    }
  }
}

export async function runAIQuery(options: {
  systemPrompt: string;
  userPrompt: string;
  pdfBuffer?: Buffer;
  pdfText?: string;
  modelName?: string;
  tools?: any[];
}): Promise<AIResponse> {
  refreshKeys();
  
  const allKeys = getGeminiKeys();
  let availableKeys = allKeys.filter(k => !exhaustedGeminiKeys.has(k));
  
  // Explicit log for debugging in dev terminal
  console.log(`[AI Handler] Current Pool: ${allKeys.length} keys. Healthy: ${availableKeys.length}`);

  if (availableKeys.length === 0 && allKeys.length > 0) {
    console.warn("[AI Handler] No healthy Gemini keys. Best-effort recovery mode.");
    availableKeys = allKeys;
  }
  
  // SHUFFLE for absolute random selection among all keys
  availableKeys = availableKeys.sort(() => Math.random() - 0.5);

  // 1. Try Gemini Keys
  for (const keyName of availableKeys) {
    const apiKey = process.env[keyName];
    if (!apiKey) continue;

    try {
      console.log(`[AI Handler] Using Key: ${keyName} for reasoning...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Use provided model or default to gemini-3-flash-preview
      const modelName = options.modelName || "gemini-3-flash-preview";
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        tools: options.tools 
      });
      
      const promptParts: GeminiPart[] = [options.systemPrompt, options.userPrompt];
      
      if (options.pdfBuffer) {
        promptParts.push({
          inlineData: {
            data: options.pdfBuffer.toString("base64"),
            mimeType: "application/pdf"
          }
        });
      } else if (options.pdfText && options.pdfText !== "[PDF Text Extraction Skipped]") {
        promptParts.push(options.pdfText);
      }

      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Empty response from Gemini.");

      console.log(`[AI Handler] Success: ${keyName} (Model: ${modelName})`);

      return {
        text,
        modelUsed: `${keyName} (${modelName})`,
        isFallback: false,
        exhaustedKeys: Array.from(exhaustedGeminiKeys)
      };
    } catch (error) {
      const err = error as Error;
      const msg = err.message?.toLowerCase() || "";
      console.error(`[AI Handler] ${keyName} Fail:`, err.message);
      
      // If rate limited, mark exhausted
      if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit")) {
        exhaustedGeminiKeys.add(keyName);
        keyFailureTimestamps.set(keyName, Date.now());
      }
      // Move to next key in availablePool
    }
  }

  // 2. Groq Fallback
  console.warn("[AI Handler] Critical: All Gemini Keys failed. Resorting to Groq.");
  
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error("Critical AI System Offline: All providers failed.");
  }

  try {
    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: `${options.userPrompt}\n\nResume Text:\n${options.pdfText || "No text provided."}` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content || "";
    if (!content) throw new Error("Groq empty response.");

    return {
      text: content,
      modelUsed: "GROQ_API_KEY",
      isFallback: true,
      exhaustedKeys: Array.from(exhaustedGeminiKeys)
    };
  } catch (error) {
    const err = error as Error;
    console.error("[AI Handler] Groq fallback failed:", err.message);
    throw new Error(`AI System Unavailable. Detail: ${err.message}`);
  }
}
