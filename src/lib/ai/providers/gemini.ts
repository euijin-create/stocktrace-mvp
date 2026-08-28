import { GoogleGenAI } from "@google/genai";
import { STOCK_ANALYSIS_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  parseStockContentAnalysis,
  STOCK_CONTENT_ANALYSIS_JSON_SCHEMA,
} from "@/lib/ai/schema";
import type { StockAnalysisProvider, StockContentAnalysis } from "@/lib/ai/types";

// Gemini 3.5 Flash-Lite currently rejects nested maxItems constraints through
// Interactions. The existing runtime parser still enforces those same limits.
function toGeminiResponseSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toGeminiResponseSchema);
  if (typeof value !== "object" || value === null) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "maxItems")
      .map(([key, nestedValue]) => [key, toGeminiResponseSchema(nestedValue)]),
  );
}

const GEMINI_STOCK_CONTENT_ANALYSIS_JSON_SCHEMA = toGeminiResponseSchema(
  STOCK_CONTENT_ANALYSIS_JSON_SCHEMA,
) as Record<string, unknown>;

export class GeminiStockAnalysisProvider implements StockAnalysisProvider {
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async analyze(statementText: string): Promise<StockContentAnalysis> {
    const interaction = await this.client.interactions.create({
      model: this.model,
      input: statementText,
      system_instruction: STOCK_ANALYSIS_SYSTEM_PROMPT,
      generation_config: {
        max_output_tokens: 4096,
      },
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: GEMINI_STOCK_CONTENT_ANALYSIS_JSON_SCHEMA,
      },
      store: false,
    });

    const responseText = interaction.output_text?.trim();
    if (!responseText) throw new Error("Gemini returned an empty response");

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error("Gemini returned invalid JSON");
    }

    return parseStockContentAnalysis(parsed, statementText);
  }
}
