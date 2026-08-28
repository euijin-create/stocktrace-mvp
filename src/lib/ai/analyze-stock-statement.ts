import { getGeminiConfig } from "@/lib/ai/config";
import { GeminiStockAnalysisProvider } from "@/lib/ai/providers/gemini";
import { MockStockAnalysisProvider } from "@/lib/ai/providers/mock";
import type { StockAnalysisResponse } from "@/lib/ai/types";

const mockProvider = new MockStockAnalysisProvider();

export async function analyzeStockStatement(statementText: string): Promise<StockAnalysisResponse> {
  const normalizedText = statementText.trim();
  if (!normalizedText || normalizedText.length > 500) {
    throw new Error("Statement text must contain between 1 and 500 characters");
  }

  const geminiConfig = getGeminiConfig();
  if (!geminiConfig) {
    const result = await mockProvider.analyze(normalizedText);
    return { ...result, mode: "demo" };
  }

  const provider = new GeminiStockAnalysisProvider(geminiConfig.apiKey, geminiConfig.model);
  try {
    const result = await provider.analyze(normalizedText);
    return { ...result, mode: "ai" };
  } catch (error) {
    const providerError = error as { name?: unknown; status?: unknown; code?: unknown };
    console.error("[StockTrace] Gemini analysis failed; using demo fallback", {
      name: typeof providerError.name === "string" ? providerError.name : "UnknownError",
      status: typeof providerError.status === "number" ? providerError.status : undefined,
      code:
        typeof providerError.code === "string" || typeof providerError.code === "number"
          ? providerError.code
          : undefined,
    });
    const result = await mockProvider.analyze(normalizedText);
    return { ...result, mode: "demo" };
  }
}
