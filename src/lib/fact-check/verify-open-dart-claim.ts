import "server-only";

import { createHash } from "node:crypto";
import { getGeminiConfig } from "@/lib/ai/config";
import { GeminiOpenDartFactCheckProvider } from "@/lib/ai/providers/gemini-fact-check";
import { getOpenDartDocument } from "@/lib/dart/open-dart-document";
import type { OpenDartLookupResult } from "@/lib/dart/types";
import {
  extractRelevantExcerpts,
  limitEvidenceDocuments,
  selectRelevantDisclosures,
} from "@/lib/fact-check/relevance";
import type {
  OpenDartFactCheckOutcome,
  OpenDartVerificationResult,
  VerificationEvidenceDocument,
} from "@/lib/fact-check/types";

const VERIFICATION_CACHE_TTL_MS = 30 * 60 * 1000;

type TimedVerification = {
  expiresAt: number;
  value: OpenDartVerificationResult;
};

type VerificationCache = {
  pending: Map<string, Promise<OpenDartVerificationResult>>;
  results: Map<string, TimedVerification>;
};

const globalWithVerificationCache = globalThis as typeof globalThis & {
  __stockTraceOpenDartVerificationCache?: VerificationCache;
};

const cache: VerificationCache =
  globalWithVerificationCache.__stockTraceOpenDartVerificationCache ??
  (globalWithVerificationCache.__stockTraceOpenDartVerificationCache = {
    pending: new Map(),
    results: new Map(),
  });

function outcome(
  lookup: OpenDartLookupResult,
  overrides: Omit<OpenDartFactCheckOutcome, "lookup">,
): OpenDartFactCheckOutcome {
  return { lookup, ...overrides };
}

function createVerificationCacheKey(
  statement: string,
  model: string,
  documents: VerificationEvidenceDocument[],
): string {
  const evidenceFingerprint = documents.map((document) => ({
    excerpts: document.excerpts,
    receiptNumber: document.receiptNumber,
  }));
  return createHash("sha256")
    .update(JSON.stringify({ evidenceFingerprint, model, statement }))
    .digest("hex");
}

async function runGeminiVerification(
  statement: string,
  documents: VerificationEvidenceDocument[],
  apiKey: string,
  model: string,
): Promise<OpenDartVerificationResult> {
  const cacheKey = createVerificationCacheKey(statement, model, documents);
  const now = Date.now();
  const cached = cache.results.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.value;
  const pending = cache.pending.get(cacheKey);
  if (pending) return pending;

  const provider = new GeminiOpenDartFactCheckProvider(apiKey, model);
  const request = provider
    .verify(statement, documents)
    .then((verification) => {
      const value = { ...verification, verifiedAt: new Date().toISOString() };
      cache.results.set(cacheKey, {
        expiresAt: Date.now() + VERIFICATION_CACHE_TTL_MS,
        value,
      });
      while (cache.results.size > 80) {
        const oldestKey = cache.results.keys().next().value;
        if (typeof oldestKey !== "string") break;
        cache.results.delete(oldestKey);
      }
      return value;
    })
    .finally(() => {
      if (cache.pending.get(cacheKey) === request) cache.pending.delete(cacheKey);
    });
  cache.pending.set(cacheKey, request);
  return request;
}

function logVerificationFailure(error: unknown): void {
  const providerError = error as { name?: unknown; status?: unknown; code?: unknown };
  const safeMessage =
    error instanceof Error
      ? error.message
          .replace(/AIza[\w-]+/g, "[redacted]")
          .replace(/(key|crtfc_key)=[^&\s]+/gi, "$1=[redacted]")
          .slice(0, 500)
      : "UnknownError";
  console.error("[StockTrace] OpenDART evidence comparison failed", {
    name: typeof providerError.name === "string" ? providerError.name : "UnknownError",
    status: typeof providerError.status === "number" ? providerError.status : undefined,
    code:
      typeof providerError.code === "string" || typeof providerError.code === "number"
        ? providerError.code
        : undefined,
    message: safeMessage,
  });
}

export async function verifyOpenDartClaim({
  lookup,
  statement,
}: {
  lookup: OpenDartLookupResult;
  statement: string;
}): Promise<OpenDartFactCheckOutcome> {
  const normalizedStatement = statement.replace(/\s+/g, " ").trim();
  if (!normalizedStatement || normalizedStatement.length > 500) {
    return outcome(lookup, {
      candidateDisclosures: [],
      message: "현재 공식자료 검증을 완료하지 못했습니다.",
      result: null,
      status: "not_attempted",
    });
  }
  if (lookup.status !== "success") {
    return outcome(lookup, {
      candidateDisclosures: [],
      message:
        lookup.status === "not_configured"
          ? "OpenDART 인증키가 없어 실제 공식자료 검증을 실행하지 않았습니다."
          : "현재 공식자료 검증을 완료하지 못했습니다.",
      result: null,
      status: lookup.status === "not_configured" ? "not_configured" : "unavailable",
    });
  }

  const candidateDisclosures = selectRelevantDisclosures(
    normalizedStatement,
    lookup.disclosures,
  );
  if (candidateDisclosures.length === 0) {
    return outcome(lookup, {
      candidateDisclosures,
      message: "발언과 관련성이 명확한 공시 후보를 찾지 못했습니다.",
      result: null,
      status: "no_relevant_disclosures",
    });
  }

  const downloadedDocuments = await Promise.all(
    candidateDisclosures.map(async (disclosure) => ({
      disclosure,
      documentResult: await getOpenDartDocument(disclosure.receiptNo),
    })),
  );
  const evidenceDocuments = limitEvidenceDocuments(
    downloadedDocuments.flatMap<VerificationEvidenceDocument>(({ disclosure, documentResult }) => {
      if (documentResult.status !== "success" || !documentResult.document) return [];
      const excerpts = extractRelevantExcerpts(
        normalizedStatement,
        documentResult.document.plainText,
      );
      if (excerpts.length === 0 || !disclosure.originalUrl) return [];
      return [
        {
          corpName: disclosure.corpName,
          excerpts,
          originalUrl: disclosure.originalUrl,
          receiptDate: disclosure.receiptDate,
          receiptNumber: disclosure.receiptNo,
          reportName: disclosure.reportName,
        },
      ];
    }),
  );
  if (evidenceDocuments.length === 0) {
    return outcome(lookup, {
      candidateDisclosures,
      message: "현재 공식자료 검증을 완료하지 못했습니다.",
      result: null,
      status: "insufficient_evidence",
    });
  }

  const geminiConfig = getGeminiConfig();
  if (!geminiConfig) {
    return outcome(lookup, {
      candidateDisclosures,
      message: "Gemini 설정이 없어 실제 공시 비교를 실행하지 않았습니다.",
      result: null,
      status: "not_configured",
    });
  }

  try {
    const result = await runGeminiVerification(
      normalizedStatement,
      evidenceDocuments,
      geminiConfig.apiKey,
      geminiConfig.model,
    );
    return outcome(lookup, {
      candidateDisclosures,
      message: "OpenDART 실제 공시 원문을 바탕으로 발언을 비교했습니다.",
      result,
      status: "success",
    });
  } catch (error) {
    logVerificationFailure(error);
    return outcome(lookup, {
      candidateDisclosures,
      message: "현재 공식자료 검증을 완료하지 못했습니다.",
      result: null,
      status: "unavailable",
    });
  }
}
