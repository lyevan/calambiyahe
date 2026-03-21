import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || GEMINI_MODEL;
const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL || "gemini-1.5-pro";
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

function resolveApiKey(): string {
  if (GEMINI_API_KEY) return GEMINI_API_KEY;
  if (process.env.NODE_ENV === "test") return "test-key";
  throw new Error("Gemini API key is not configured");
}

export const geminiClient = {
  isConfigured() {
    return Boolean(GEMINI_API_KEY);
  },

  async generateJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const apiKey = resolveApiKey();

    // Initialize the new client
    const ai = new GoogleGenAI({ apiKey });
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

  async generateText(
    prompt: string,
    model = GEMINI_TEXT_MODEL,
  ): Promise<string> {
    const apiKey = resolveApiKey();

    const ai = new GoogleGenAI({ apiKey });

    const result = await withTimeout(
      ai.models.generateContent({
        model,
        contents: prompt,
      }),
      GEMINI_TIMEOUT_MS,
    );

    return (result.text || "").trim();
  },

  async generateVisionText(
    prompt: string,
    imageBase64: string,
    mimeType: string,
    model = GEMINI_VISION_MODEL,
  ): Promise<string> {
    const apiKey = resolveApiKey();

    const ai = new GoogleGenAI({ apiKey });

    const result = await withTimeout(
      ai.models.generateContent({
        model,
        contents: [
          prompt,
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
        ],
      }),
      GEMINI_TIMEOUT_MS,
    );

    return (result.text || "").trim();
  },
};
