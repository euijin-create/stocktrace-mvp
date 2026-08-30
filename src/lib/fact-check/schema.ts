import {
  OPEN_DART_VERIFICATION_STATUSES,
  type OpenDartVerificationResult,
  type OpenDartVerificationStatus,
  type UnverifiedEvidenceFact,
  type VerificationEvidenceDocument,
  type VerifiedEvidenceFact,
  type VerifiedOpenDartSource,
} from "@/lib/fact-check/types";

const evidenceFactSchema = {
  type: "object",
  additionalProperties: false,
  required: ["claimedFact", "officialEvidence", "reason", "sourceReceiptNumber"],
  properties: {
    claimedFact: { type: "string", minLength: 1, maxLength: 500 },
    officialEvidence: { type: "string", minLength: 1, maxLength: 1200 },
    reason: { type: "string", minLength: 1, maxLength: 700 },
    sourceReceiptNumber: { type: "string", pattern: "^[0-9]{14}$" },
  },
} as const;

export const OPEN_DART_VERIFICATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "verificationStatus",
    "summary",
    "matchedFacts",
    "conflictingFacts",
    "unverifiedFacts",
    "confidence",
    "sources",
  ],
  properties: {
    verificationStatus: { type: "string", enum: OPEN_DART_VERIFICATION_STATUSES },
    summary: { type: "string", minLength: 1, maxLength: 800 },
    matchedFacts: { type: "array", maxItems: 12, items: evidenceFactSchema },
    conflictingFacts: { type: "array", maxItems: 12, items: evidenceFactSchema },
    unverifiedFacts: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claimedFact", "reason"],
        properties: {
          claimedFact: { type: "string", minLength: 1, maxLength: 500 },
          reason: { type: "string", minLength: 1, maxLength: 700 },
        },
      },
    },
    confidence: { type: "number", minimum: 0, maximum: 100 },
    sources: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["reportName", "receiptNumber", "receiptDate", "corpName"],
        properties: {
          reportName: { type: "string", minLength: 1, maxLength: 500 },
          receiptNumber: { type: "string", pattern: "^[0-9]{14}$" },
          receiptDate: { type: "string", pattern: "^[0-9]{8}$" },
          corpName: { type: "string", minLength: 1, maxLength: 200 },
        },
      },
    },
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function readString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error(`Invalid ${field}`);
  const normalized = normalizeText(value);
  if (!normalized || normalized.length > maxLength) throw new Error(`Invalid ${field}`);
  return normalized;
}

function readFactArray(
  value: unknown,
  field: string,
  documentsByReceipt: Map<string, VerificationEvidenceDocument>,
): VerifiedEvidenceFact[] {
  if (!Array.isArray(value) || value.length > 12) throw new Error(`Invalid ${field}`);
  return value.map((item) => {
    if (!isRecord(item)) throw new Error(`Invalid ${field} item`);
    const sourceReceiptNumber = readString(
      item.sourceReceiptNumber,
      `${field}.sourceReceiptNumber`,
      14,
    );
    if (!/^\d{14}$/.test(sourceReceiptNumber)) {
      throw new Error(`Invalid ${field}.sourceReceiptNumber`);
    }
    const document = documentsByReceipt.get(sourceReceiptNumber);
    if (!document) throw new Error(`${field} cited a disclosure that was not supplied`);
    const officialEvidence = readString(item.officialEvidence, `${field}.officialEvidence`, 1200);
    const normalizedDocument = normalizeText(document.excerpts.join(" "));
    if (!normalizedDocument.includes(officialEvidence)) {
      throw new Error(`${field} evidence was not present in the supplied disclosure excerpt`);
    }
    return {
      claimedFact: readString(item.claimedFact, `${field}.claimedFact`, 500),
      officialEvidence,
      reason: readString(item.reason, `${field}.reason`, 700),
      sourceReceiptNumber,
    };
  });
}

function readUnverifiedFacts(value: unknown): UnverifiedEvidenceFact[] {
  if (!Array.isArray(value) || value.length > 12) throw new Error("Invalid unverifiedFacts");
  return value.map((item) => {
    if (!isRecord(item)) throw new Error("Invalid unverifiedFacts item");
    return {
      claimedFact: readString(item.claimedFact, "unverifiedFacts.claimedFact", 500),
      reason: readString(item.reason, "unverifiedFacts.reason", 700),
    };
  });
}

function readStatus(value: unknown): OpenDartVerificationStatus {
  if (
    typeof value !== "string" ||
    !OPEN_DART_VERIFICATION_STATUSES.includes(value as OpenDartVerificationStatus)
  ) {
    throw new Error("Invalid verificationStatus");
  }
  return value as OpenDartVerificationStatus;
}

function validateStatusConsistency(
  status: OpenDartVerificationStatus,
  matched: VerifiedEvidenceFact[],
  conflicting: VerifiedEvidenceFact[],
  unverified: UnverifiedEvidenceFact[],
): void {
  if (status === "confirmed" && (matched.length === 0 || conflicting.length > 0 || unverified.length > 0)) {
    throw new Error("Confirmed result is not supported by a complete match");
  }
  if (
    status === "partially_confirmed" &&
    (matched.length === 0 || (conflicting.length === 0 && unverified.length === 0))
  ) {
    throw new Error("Partially confirmed result lacks mixed evidence");
  }
  if (status === "exaggeration_or_context_missing" && matched.length === 0) {
    throw new Error("Context warning lacks an official factual basis");
  }
  if (
    status === "no_official_evidence" &&
    (matched.length > 0 || conflicting.length > 0 || unverified.length === 0)
  ) {
    throw new Error("No-evidence result is inconsistent with returned evidence");
  }
  if (status === "conflicts_with_official_source" && conflicting.length === 0) {
    throw new Error("Conflict result lacks a direct official contradiction");
  }
}

export function parseOpenDartVerification(
  value: unknown,
  evidenceDocuments: VerificationEvidenceDocument[],
): Omit<OpenDartVerificationResult, "verifiedAt"> {
  if (!isRecord(value)) throw new Error("Invalid fact-check response");
  const documentsByReceipt = new Map(
    evidenceDocuments.map((document) => [document.receiptNumber, document]),
  );
  const verificationStatus = readStatus(value.verificationStatus);
  const matchedFacts = readFactArray(value.matchedFacts, "matchedFacts", documentsByReceipt);
  const conflictingFacts = readFactArray(
    value.conflictingFacts,
    "conflictingFacts",
    documentsByReceipt,
  );
  const unverifiedFacts = readUnverifiedFacts(value.unverifiedFacts);
  validateStatusConsistency(
    verificationStatus,
    matchedFacts,
    conflictingFacts,
    unverifiedFacts,
  );

  if (typeof value.confidence !== "number" || !Number.isFinite(value.confidence)) {
    throw new Error("Invalid confidence");
  }
  const confidence = Math.round(value.confidence);
  if (confidence < 0 || confidence > 100) throw new Error("Invalid confidence");
  if (!Array.isArray(value.sources) || value.sources.length === 0 || value.sources.length > 5) {
    throw new Error("Invalid sources");
  }

  const sources: VerifiedOpenDartSource[] = [];
  const seenReceipts = new Set<string>();
  for (const source of value.sources) {
    if (!isRecord(source)) throw new Error("Invalid source item");
    readString(source.reportName, "sources.reportName", 500);
    readString(source.corpName, "sources.corpName", 200);
    const receiptDate = readString(source.receiptDate, "sources.receiptDate", 8);
    if (!/^\d{8}$/.test(receiptDate)) throw new Error("Invalid sources.receiptDate");
    const receiptNumber = readString(source.receiptNumber, "sources.receiptNumber", 14);
    const document = documentsByReceipt.get(receiptNumber);
    if (!document) throw new Error("A cited source was not supplied by OpenDART");
    if (seenReceipts.has(receiptNumber)) continue;
    seenReceipts.add(receiptNumber);
    sources.push({
      corpName: document.corpName,
      originalUrl: document.originalUrl,
      receiptDate: document.receiptDate,
      receiptNumber: document.receiptNumber,
      reportName: document.reportName,
    });
  }
  if (sources.length === 0) throw new Error("No valid OpenDART sources were cited");

  return {
    confidence,
    conflictingFacts,
    matchedFacts,
    sources,
    summary: readString(value.summary, "summary", 800),
    unverifiedFacts,
    verificationStatus,
  };
}
