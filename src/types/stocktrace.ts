/**
 * StockTrace domain model.
 *
 * Dates are stored as ISO-8601 strings and percentages as display values
 * (`20` means 20%, not 0.2). The MVP uses the same model that a future API
 * can return, while the current data source is explicitly marked as mock.
 */

export type ISODateString = string;
export type Currency = "KRW" | "USD";

export interface Money {
  amount: number;
  currency: Currency;
}

export const CLAIM_TYPE = {
  VERIFIABLE_FACT: "verifiable_fact",
  CONTEXT_RISK: "context_risk",
  PRICE_PREDICTION: "price_prediction",
  OPINION: "opinion",
  CONFLICT_DISCLOSURE: "conflict_disclosure",
} as const;

export type ClaimType = (typeof CLAIM_TYPE)[keyof typeof CLAIM_TYPE];

export const VERIFICATION_STATUS = {
  CONFIRMED: "confirmed",
  PARTIALLY_CONFIRMED: "partially_confirmed",
  CONTEXT_MAY_BE_MISSING: "context_may_be_missing",
  NO_OFFICIAL_EVIDENCE: "no_official_evidence",
  CONFLICTS_OFFICIAL: "conflicts_official",
  CURRENTLY_UNVERIFIABLE: "currently_unverifiable",
} as const;

export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export const PREDICTION_STATUS = {
  TRACKING: "tracking",
  EVALUATION_DUE: "evaluation_due",
  COMPLETED: "completed",
  INSUFFICIENT_CONDITIONS: "insufficient_conditions",
} as const;

export type PredictionStatus =
  (typeof PREDICTION_STATUS)[keyof typeof PREDICTION_STATUS];

export type PredictionDirection = "up" | "down";
export type MissingPredictionCondition = "direction" | "target" | "period";

export const RECEIPT_STATUS = {
  RECORDED: "recorded",
  SOURCE_CHANGED: "source_changed",
  SOURCE_UNAVAILABLE: "source_unavailable",
} as const;

export type ReceiptStatus =
  (typeof RECEIPT_STATUS)[keyof typeof RECEIPT_STATUS];

export const SOURCE_AVAILABILITY = {
  AVAILABLE: "available",
  CHANGED: "changed",
  PRIVATE: "private",
  DELETED: "deleted",
  UNAVAILABLE: "unavailable",
} as const;

export type SourceAvailability =
  (typeof SOURCE_AVAILABILITY)[keyof typeof SOURCE_AVAILABILITY];

export const HISTORY_EVENT_TYPE = {
  CAPTURED: "captured",
  MODIFIED: "modified",
  MADE_PRIVATE: "made_private",
  DELETED: "deleted",
  RESTORED: "restored",
} as const;

export type HistoryEventType =
  (typeof HISTORY_EVENT_TYPE)[keyof typeof HISTORY_EVENT_TYPE];

export type ConfidenceLevel = "high" | "medium" | "low";
export type Platform = "youtube" | "instagram" | "x" | "blog" | "other";
export type Market = "KOSPI" | "KOSDAQ" | "NYSE" | "NASDAQ";
export type OfficialSourceCategory =
  | "dart"
  | "kind"
  | "krx"
  | "company"
  | "government";

export interface AiConfidence {
  /** Integer-like score between 0 and 100. */
  score: number;
  level: ConfidenceLevel;
  rationale: string;
}

export interface Stock {
  id: string;
  name: string;
  symbol: string;
  market: Market;
}

export interface Influencer {
  id: string;
  slug: string;
  displayName: string;
  channelName?: string;
  platform: Platform;
  avatarInitials: string;
  summary: string;
  isFeatured?: boolean;
}

export interface ContentSource {
  id: string;
  influencerId: string;
  url: string;
  title: string;
  platform: Platform;
  publishedAt?: ISODateString;
  capturedAt: ISODateString;
  availability: SourceAvailability;
}

export interface Statement {
  id: string;
  contentId: string;
  influencerId: string;
  text: string;
  primaryType: ClaimType;
  secondaryTypes: ClaimType[];
  stockIds: string[];
  analyzedAt: ISODateString;
  confidence: AiConfidence;
}

export interface AnalysisRecord {
  id: string;
  contentId: string;
  statementIds: string[];
  analyzedAt: ISODateString;
  isMock: true;
  summary: string;
  classificationReason: string;
  relatedFactCheckId?: string;
  relatedPredictionId?: string;
  receiptId?: string;
}

export interface OfficialSource {
  id: string;
  category: OfficialSourceCategory;
  organization: string;
  title: string;
  documentDate: ISODateString;
  referenceNo?: string;
  /** Omitted for mock documents so the UI does not link to a fictitious filing. */
  url?: string;
  accessedAt: ISODateString;
  keyPoint: string;
  isMock: true;
}

export type FactComparisonResult = "match" | "partial" | "mismatch" | "unknown";

export interface FactComparison {
  field: string;
  claimedValue: string;
  officialValue: string;
  result: FactComparisonResult;
}

export interface FactCheck {
  id: string;
  statementId: string;
  companyOrStockLabel: string;
  status: VerificationStatus;
  summary: string;
  sourceIds: string[];
  comparisons: FactComparison[];
  checkedAt: ISODateString;
  confidence: AiConfidence;
}

export interface PriceSnapshot {
  price: Money;
  capturedAt: ISODateString;
  sourceLabel: string;
}

export interface ReceiptHistoryEvent {
  id: string;
  type: HistoryEventType;
  observedAt: ISODateString;
  title: string;
  /** Describes only the observed change, without inferring motive or misconduct. */
  description: string;
}

export interface StatementReceipt {
  id: string;
  statementId: string;
  recordedAt: ISODateString;
  status: ReceiptStatus;
  /**
   * Immutable presentation snapshot. It deliberately duplicates source fields
   * so a later profile/content edit does not alter the original receipt.
   */
  snapshot: {
    influencerName: string;
    originalText: string;
    contentUrl: string;
    publishedAt?: ISODateString;
    stockName?: string;
    stockSymbol?: string;
    priceAtStatement?: PriceSnapshot;
    claimType: ClaimType;
  };
  history: ReceiptHistoryEvent[];
  integrity?: {
    hashPreview?: string;
    timestampLabel?: string;
    isDemo: true;
  };
}

export interface PredictionEvaluation {
  evaluatedAt: ISODateString;
  endPrice: Money;
  observedHighPrice?: Money;
  observedLowPrice?: Money;
  actualReturnPct: number;
  benchmarkName: string;
  benchmarkReturnPct: number;
  /** Percentage-point difference, not a percentage change. */
  excessReturnPct: number;
  targetReached: boolean | null;
  maxDrawdownPct: number;
  finalAssessment: string;
  methodologyNote: string;
}

export interface Prediction {
  id: string;
  statementId: string;
  influencerId: string;
  stockId: string;
  statedAt: ISODateString;
  priceAtStatement: PriceSnapshot;
  direction: PredictionDirection;
  targetReturnPct?: number;
  targetPrice?: Money;
  horizonLabel?: string;
  evaluationDueAt?: ISODateString;
  missingConditions: MissingPredictionCondition[];
  status: PredictionStatus;
  evaluation?: PredictionEvaluation;
}

export interface RatioMetric {
  numerator: number;
  denominator: number;
}

export interface InfluencerMetrics {
  analyzedStatements: number;
  factCheckEligible: number;
  officialAgreement: RatioMetric;
  predictionsRecorded: number;
  predictionsCompleted: number;
  predictionPerformance: {
    averageActualReturnPct: number;
    averageBenchmarkReturnPct: number;
    averageExcessReturnPct: number;
    targetReached: RatioMetric;
  };
  sourceCitation: RatioMetric;
  /** Only statements for which a relevant interest was identified form the denominator. */
  interestDisclosure: RatioMetric;
  exaggerationFlags: RatioMetric;
  contentHistory: {
    modified: number;
    deletedOrUnavailable: number;
  };
  corrections: number;
  totalSampleCount: number;
}

export type SampleAssessmentLevel = "limited" | "developing" | "substantial";

export interface InfluencerProfile {
  influencerId: string;
  metrics: InfluencerMetrics;
  calculatedAt: ISODateString;
  sampleAssessment: {
    level: SampleAssessmentLevel;
    message: string;
    recommendedMinimum: number;
  };
}

export type DemoScenarioId =
  | "contract-confirmed"
  | "prediction-completed"
  | "prediction-insufficient"
  | "official-conflict";

export interface DemoScenario {
  id: DemoScenarioId;
  label: string;
  description: string;
  input: {
    contentUrl: string;
    influencerName: string;
    statement: string;
  };
  analysisId: string;
  links: {
    factCheckHref?: string;
    receiptHref?: string;
    predictionHref?: string;
    influencerHref: string;
  };
}

export interface MockDatabase {
  meta: {
    mode: "mock";
    asOf: ISODateString;
    disclaimer: string;
  };
  stocks: Stock[];
  influencers: Influencer[];
  contents: ContentSource[];
  analyses: AnalysisRecord[];
  statements: Statement[];
  officialSources: OfficialSource[];
  factChecks: FactCheck[];
  receipts: StatementReceipt[];
  predictions: Prediction[];
  influencerProfiles: InfluencerProfile[];
  demoScenarios: DemoScenario[];
  home: {
    recentFactCheckIds: string[];
    completedPredictionIds: string[];
    featuredInfluencerIds: string[];
  };
}

