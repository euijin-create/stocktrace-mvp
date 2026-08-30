import type { OpenDartDisclosure, OpenDartLookupResult } from "@/lib/dart/types";

export const OPEN_DART_VERIFICATION_STATUSES = [
  "confirmed",
  "partially_confirmed",
  "exaggeration_or_context_missing",
  "no_official_evidence",
  "conflicts_with_official_source",
  "not_currently_verifiable",
] as const;

export type OpenDartVerificationStatus =
  (typeof OPEN_DART_VERIFICATION_STATUSES)[number];

export interface VerificationEvidenceDocument {
  corpName: string;
  excerpts: string[];
  originalUrl: string;
  receiptDate: string;
  receiptNumber: string;
  reportName: string;
}

export interface VerifiedEvidenceFact {
  claimedFact: string;
  officialEvidence: string;
  reason: string;
  sourceReceiptNumber: string;
}

export interface UnverifiedEvidenceFact {
  claimedFact: string;
  reason: string;
}

export interface VerifiedOpenDartSource {
  corpName: string;
  originalUrl: string;
  receiptDate: string;
  receiptNumber: string;
  reportName: string;
}

export interface OpenDartVerificationResult {
  confidence: number;
  conflictingFacts: VerifiedEvidenceFact[];
  matchedFacts: VerifiedEvidenceFact[];
  sources: VerifiedOpenDartSource[];
  summary: string;
  unverifiedFacts: UnverifiedEvidenceFact[];
  verificationStatus: OpenDartVerificationStatus;
  verifiedAt: string;
}

export type OpenDartFactCheckStatus =
  | "success"
  | "not_attempted"
  | "not_configured"
  | "no_relevant_disclosures"
  | "insufficient_evidence"
  | "unavailable";

export interface OpenDartFactCheckOutcome {
  candidateDisclosures: OpenDartDisclosure[];
  lookup: OpenDartLookupResult;
  message: string;
  result: OpenDartVerificationResult | null;
  status: OpenDartFactCheckStatus;
}
