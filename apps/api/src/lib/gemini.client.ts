import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Updated to the correct Gemini 3 Flash string
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 15000);

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Gemini request timed out"));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export const geminiClient = {
  isConfigured() {
    return Boolean(GEMINI_API_KEY);
  },

  async generateJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    // Initialize the new client
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const fullPrompt = `${systemPrompt}\n\nUser Input:\n${userPrompt}`;

    const result = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: fullPrompt,
        config: {
          // This entirely replaces the need for extractJsonBlock()
          // It forces the model to strictly output parsable JSON
          responseMimeType: "application/json",
        },
      }),
      GEMINI_TIMEOUT_MS,
    );

    // The new SDK accesses the text directly on the result object
    if (!result.text) {
      throw new Error("Received empty response from Gemini");
    }

    return JSON.parse(result.text) as T;
  },
};
