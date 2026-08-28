import { NextResponse } from "next/server";
import { analyzeStockStatement } from "@/lib/ai/analyze-stock-statement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeServerError(error: unknown): { name: string; message: string } {
  if (!(error instanceof Error)) return { name: "UnknownError", message: "Unknown error" };
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return {
    name: error.name,
    message: apiKey ? error.message.replaceAll(apiKey, "[redacted]") : error.message,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "분석할 발언을 확인해 주세요." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const statement =
    typeof body === "object" && body !== null && "statement" in body
      ? (body as { statement?: unknown }).statement
      : null;

  if (typeof statement !== "string" || !statement.trim() || statement.trim().length > 500) {
    return NextResponse.json(
      { message: "분석할 발언을 확인해 주세요." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await analyzeStockStatement(statement);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[StockTrace] AI statement analysis failed", safeServerError(error));
    return NextResponse.json(
      { message: "AI 분석을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
