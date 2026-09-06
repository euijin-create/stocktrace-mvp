import { mockDatabase } from "@/data/mock-data";
import {
  CLAIM_TYPE,
  HISTORY_EVENT_TYPE,
  PREDICTION_STATUS,
  RECEIPT_STATUS,
  SOURCE_AVAILABILITY,
  VERIFICATION_STATUS,
  type AiConfidence,
  type ClaimType,
  type ConfidenceLevel,
  type ContentSource,
  type DemoScenario,
  type DemoScenarioId,
  type FactCheck,
  type FactComparisonResult,
  type HistoryEventType,
  type Influencer,
  type InfluencerProfile,
  type MockDatabase,
  type Money,
  type OfficialSource,
  type Platform,
  type Prediction,
  type PredictionStatus,
  type RatioMetric,
  type ReceiptStatus,
  type SourceAvailability,
  type Statement,
  type StatementReceipt,
  type Stock,
  type VerificationStatus,
} from "@/types/stocktrace";

export type SemanticTone = "positive" | "information" | "caution" | "negative" | "neutral";

export interface DisplayMeta {
  label: string;
  description: string;
  tone: SemanticTone;
  /** Semantic hint only; the React layer chooses the actual icon component. */
  iconHint: string;
}

export const AI_CONFIDENCE_DISCLAIMER =
  "AI 신뢰수준은 발언을 분류하고 정보를 추출한 확신도를 뜻하며, 발언이 사실일 확률이나 투자 판단을 의미하지 않습니다.";

export const CLAIM_TYPE_META: Record<ClaimType, DisplayMeta> = {
  [CLAIM_TYPE.VERIFIABLE_FACT]: {
    label: "사실 주장",
    description: "공시나 기관 자료에서 객관적으로 비교할 수 있는 내용입니다.",
    tone: "information",
    iconHint: "file-check",
  },
  [CLAIM_TYPE.CONTEXT_RISK]: {
    label: "과장·맥락 확인 필요",
    description: "수치의 기준, 범위 또는 전제가 함께 제시되었는지 확인이 필요합니다.",
    tone: "caution",
    iconHint: "message-square-warning",
  },
  [CLAIM_TYPE.PRICE_PREDICTION]: {
    label: "미래 예측",
    description: "방향, 목표와 기간을 기록해 평가일 이후 결과와 비교합니다.",
    tone: "information",
    iconHint: "chart-no-axes-combined",
  },
  [CLAIM_TYPE.OPINION]: {
    label: "개인 의견",
    description: "검증 가능한 사실보다 해석이나 관점이 중심인 표현입니다.",
    tone: "neutral",
    iconHint: "message-circle",
  },
  [CLAIM_TYPE.CONFLICT_DISCLOSURE]: {
    label: "광고·이해관계 관련 표현",
    description: "광고, 협찬 또는 종목 보유 여부와 관련된 표현입니다.",
    tone: "caution",
    iconHint: "badge-info",
  },
};

export const VERIFICATION_STATUS_META: Record<VerificationStatus, DisplayMeta> = {
  [VERIFICATION_STATUS.CONFIRMED]: {
    label: "공식자료로 확인됨",
    description: "주장의 핵심 내용이 확인한 공식자료와 일치합니다.",
    tone: "positive",
    iconHint: "circle-check",
  },
  [VERIFICATION_STATUS.PARTIALLY_CONFIRMED]: {
    label: "일부만 확인됨",
    description: "주장의 일부는 확인되지만 나머지 내용은 근거가 더 필요합니다.",
    tone: "information",
    iconHint: "circle-dot-dashed",
  },
  [VERIFICATION_STATUS.CONTEXT_MAY_BE_MISSING]: {
    label: "과장 또는 맥락 누락 가능",
    description: "인용한 수치나 사실의 적용 범위가 원문 자료와 다를 수 있습니다.",
    tone: "caution",
    iconHint: "triangle-alert",
  },
  [VERIFICATION_STATUS.NO_OFFICIAL_EVIDENCE]: {
    label: "공식적인 근거를 찾지 못함",
    description: "확인 범위의 공식자료에서 주장을 뒷받침하는 근거를 찾지 못했습니다.",
    tone: "caution",
    iconHint: "search-x",
  },
  [VERIFICATION_STATUS.CONFLICTS_OFFICIAL]: {
    label: "공식자료와 충돌함",
    description: "주장의 핵심 내용이 확인한 공식자료의 내용과 다릅니다.",
    tone: "negative",
    iconHint: "circle-x",
  },
  [VERIFICATION_STATUS.CURRENTLY_UNVERIFIABLE]: {
    label: "현재 검증 불가",
    description: "식별정보나 공개자료가 부족해 지금은 결론을 낼 수 없습니다.",
    tone: "neutral",
    iconHint: "circle-help",
  },
};

export const PREDICTION_STATUS_META: Record<PredictionStatus, DisplayMeta> = {
  [PREDICTION_STATUS.TRACKING]: {
    label: "추적 중",
    description: "평가 예정일까지 주가 흐름을 기록하고 있습니다.",
    tone: "information",
    iconHint: "radar",
  },
  [PREDICTION_STATUS.EVALUATION_DUE]: {
    label: "평가 데이터 확인 필요",
    description: "예측기간은 끝났지만 실제 평가 데이터를 충분히 확인하지 못했습니다.",
    tone: "caution",
    iconHint: "clock",
  },
  [PREDICTION_STATUS.COMPLETED]: {
    label: "평가 완료",
    description: "정해진 평가일의 결과를 시장지수와 함께 계산했습니다.",
    tone: "positive",
    iconHint: "badge-check",
  },
  [PREDICTION_STATUS.INSUFFICIENT_CONDITIONS]: {
    label: "평가조건 불충분",
    description: "목표나 기간이 불명확해 객관적인 성과 평가를 진행하지 않습니다.",
    tone: "neutral",
    iconHint: "list-x",
  },
};

export const RECEIPT_STATUS_META: Record<ReceiptStatus, DisplayMeta> = {
  [RECEIPT_STATUS.RECORDED]: {
    label: "기록 완료",
    description: "발언과 콘텐츠 정보를 StockTrace에 기록했습니다.",
    tone: "positive",
    iconHint: "receipt-text",
  },
  [RECEIPT_STATUS.SOURCE_CHANGED]: {
    label: "원본 변경 이력 있음",
    description: "기록 이후 원본 콘텐츠에서 객관적인 변경 상태가 관찰되었습니다.",
    tone: "caution",
    iconHint: "history",
  },
  [RECEIPT_STATUS.SOURCE_UNAVAILABLE]: {
    label: "원본 접근 불가",
    description: "현재 기록된 URL에서 원본을 확인할 수 없습니다. 그 이유나 의도는 판단하지 않습니다.",
    tone: "neutral",
    iconHint: "link-2-off",
  },
};

export const SOURCE_AVAILABILITY_META: Record<SourceAvailability, DisplayMeta> = {
  [SOURCE_AVAILABILITY.AVAILABLE]: {
    label: "원본 공개 중",
    description: "기록된 URL에서 원본 콘텐츠를 확인할 수 있습니다.",
    tone: "positive",
    iconHint: "link",
  },
  [SOURCE_AVAILABILITY.CHANGED]: {
    label: "변경 이력 있음",
    description: "기록 이후 제목 또는 내용의 변경이 관찰되었습니다.",
    tone: "caution",
    iconHint: "history",
  },
  [SOURCE_AVAILABILITY.PRIVATE]: {
    label: "비공개 상태",
    description: "원본 콘텐츠의 공개 상태가 비공개로 확인됩니다.",
    tone: "neutral",
    iconHint: "lock",
  },
  [SOURCE_AVAILABILITY.DELETED]: {
    label: "원본 찾을 수 없음",
    description: "기록된 URL에서 원본 콘텐츠를 찾을 수 없습니다.",
    tone: "neutral",
    iconHint: "file-x",
  },
  [SOURCE_AVAILABILITY.UNAVAILABLE]: {
    label: "접근 상태 확인 불가",
    description: "네트워크 또는 플랫폼 상태로 원본 접근 여부를 확인할 수 없습니다.",
    tone: "neutral",
    iconHint: "wifi-off",
  },
};

export const HISTORY_EVENT_META: Record<HistoryEventType, Omit<DisplayMeta, "description">> = {
  [HISTORY_EVENT_TYPE.CAPTURED]: {
    label: "최초 기록",
    tone: "information",
    iconHint: "circle-plus",
  },
  [HISTORY_EVENT_TYPE.MODIFIED]: {
    label: "변경 확인",
    tone: "caution",
    iconHint: "pencil-line",
  },
  [HISTORY_EVENT_TYPE.MADE_PRIVATE]: {
    label: "비공개 확인",
    tone: "neutral",
    iconHint: "lock",
  },
  [HISTORY_EVENT_TYPE.DELETED]: {
    label: "접근 불가 확인",
    tone: "neutral",
    iconHint: "file-x",
  },
  [HISTORY_EVENT_TYPE.RESTORED]: {
    label: "원본 재확인",
    tone: "positive",
    iconHint: "rotate-ccw",
  },
};

export const CONFIDENCE_META: Record<ConfidenceLevel, Omit<DisplayMeta, "description">> = {
  high: { label: "높음", tone: "positive", iconHint: "signal-high" },
  medium: { label: "보통", tone: "caution", iconHint: "signal-medium" },
  low: { label: "낮음", tone: "neutral", iconHint: "signal-low" },
};

export const COMPARISON_RESULT_META: Record<
  FactComparisonResult,
  Omit<DisplayMeta, "description">
> = {
  match: { label: "일치", tone: "positive", iconHint: "check" },
  partial: { label: "일부 일치", tone: "information", iconHint: "circle-dot-dashed" },
  mismatch: { label: "불일치", tone: "negative", iconHint: "x" },
  unknown: { label: "확인 불가", tone: "neutral", iconHint: "minus" },
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "유튜브",
  instagram: "인스타그램",
  x: "X",
  blog: "블로그",
  other: "기타",
};

// Compact label maps are convenient for components that do not need descriptions.
export const claimTypeLabels = Object.fromEntries(
  Object.entries(CLAIM_TYPE_META).map(([key, meta]) => [key, meta.label]),
) as Record<ClaimType, string>;

export const verificationStatusLabels = Object.fromEntries(
  Object.entries(VERIFICATION_STATUS_META).map(([key, meta]) => [key, meta.label]),
) as Record<VerificationStatus, string>;

export const predictionStatusLabels = Object.fromEntries(
  Object.entries(PREDICTION_STATUS_META).map(([key, meta]) => [key, meta.label]),
) as Record<PredictionStatus, string>;

export const receiptStatusLabels = Object.fromEntries(
  Object.entries(RECEIPT_STATUS_META).map(([key, meta]) => [key, meta.label]),
) as Record<ReceiptStatus, string>;

export const routes = {
  home: "/",
  analyze: "/analyze",
  factCheck: (id: string) => `/fact-checks/${id}`,
  predictions: (focusId?: string) =>
    focusId ? `/predictions?focus=${encodeURIComponent(focusId)}` : "/predictions",
  influencers: "/influencers",
  influencer: (slug: string) => `/influencers/${slug}`,
  receipt: (id: string) => `/receipts/${id}`,
} as const;

const koreanDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

const koreanDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatKoreanDate(value?: string | Date): string {
  if (!value) return "날짜 정보 없음";
  const date = toDate(value);
  return date ? koreanDateFormatter.format(date) : "날짜 정보 없음";
}

export function formatKoreanDateTime(value?: string | Date): string {
  if (!value) return "날짜 정보 없음";
  const date = toDate(value);
  return date ? koreanDateTimeFormatter.format(date) : "날짜 정보 없음";
}

export function formatMoney(money?: Money): string {
  if (!money) return "정보 없음";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: 0,
  }).format(money.amount);
}

export function formatPercent(value?: number | null, options?: { signed?: boolean }): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "정보 없음";
  const sign = options?.signed !== false && value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
}

export function formatPercentPoint(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "정보 없음";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%p`;
}

export function ratioToPercent(metric: RatioMetric): number | null {
  if (metric.denominator <= 0) return null;
  return (metric.numerator / metric.denominator) * 100;
}

export function formatRatio(metric: RatioMetric): string {
  return `${metric.numerator}/${metric.denominator}`;
}

export function formatRatioPercent(metric: RatioMetric): string {
  const percent = ratioToPercent(metric);
  return percent === null ? "표본 없음" : formatPercent(percent, { signed: false });
}

export function calculateReturnPct(start: Money, end: Money): number | null {
  if (start.currency !== end.currency || start.amount === 0) return null;
  return ((end.amount - start.amount) / start.amount) * 100;
}

export function getConfidenceMeta(confidence: AiConfidence): DisplayMeta {
  const meta = CONFIDENCE_META[confidence.level];
  return {
    ...meta,
    description: confidence.rationale,
  };
}

export interface FactCheckView {
  factCheck: FactCheck;
  statement: Statement;
  influencer: Influencer;
  content: ContentSource;
  stocks: Stock[];
  sources: OfficialSource[];
  receipt?: StatementReceipt;
  href: string;
  influencerHref: string;
}

export interface PredictionView {
  prediction: Prediction;
  statement: Statement;
  influencer: Influencer;
  content: ContentSource;
  stock: Stock;
  receipt?: StatementReceipt;
  href: string;
  influencerHref: string;
}

export interface InfluencerProfileView {
  influencer: Influencer;
  profile: InfluencerProfile;
  statements: Statement[];
  factChecks: FactCheck[];
  predictions: Prediction[];
  receipts: StatementReceipt[];
  href: string;
}

function byId<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

export function getStatementById(
  id: string,
  database: MockDatabase = mockDatabase,
): Statement | undefined {
  return byId(database.statements, id);
}

export function getContentById(
  id: string,
  database: MockDatabase = mockDatabase,
): ContentSource | undefined {
  return byId(database.contents, id);
}

export function getInfluencerById(
  id: string,
  database: MockDatabase = mockDatabase,
): Influencer | undefined {
  return byId(database.influencers, id);
}

export function getInfluencerBySlug(
  slug: string,
  database: MockDatabase = mockDatabase,
): Influencer | undefined {
  return database.influencers.find((influencer) => influencer.slug === slug);
}

function normalizeInfluencerSearch(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

export function resolveInfluencerProfileHref(
  name: string | undefined,
  fallbackSlug?: string,
  database: MockDatabase = mockDatabase,
): string {
  const normalizedName = name ? normalizeInfluencerSearch(name) : "";

  if (!normalizedName) {
    return fallbackSlug ? routes.influencer(fallbackSlug) : routes.influencers;
  }

  const matches = database.influencers.filter((influencer) => {
    const searchableValues = [influencer.displayName, influencer.channelName]
      .filter((value): value is string => Boolean(value))
      .map(normalizeInfluencerSearch);

    return searchableValues.some((value) => value.includes(normalizedName));
  });

  if (matches.length === 1) {
    return routes.influencer(matches[0].slug);
  }

  return `${routes.influencers}?query=${encodeURIComponent(name?.trim() ?? "")}`;
}

export function getStockById(id: string, database: MockDatabase = mockDatabase): Stock | undefined {
  return byId(database.stocks, id);
}

export function getFactCheckById(
  id: string,
  database: MockDatabase = mockDatabase,
): FactCheck | undefined {
  return byId(database.factChecks, id);
}

export function getPredictionById(
  id: string,
  database: MockDatabase = mockDatabase,
): Prediction | undefined {
  return byId(database.predictions, id);
}

export function getReceiptById(
  id: string,
  database: MockDatabase = mockDatabase,
): StatementReceipt | undefined {
  return byId(database.receipts, id);
}

export function getReceiptByStatementId(
  statementId: string,
  database: MockDatabase = mockDatabase,
): StatementReceipt | undefined {
  return database.receipts.find((receipt) => receipt.statementId === statementId);
}

export function getFactCheckView(
  id: string,
  database: MockDatabase = mockDatabase,
): FactCheckView | undefined {
  const factCheck = getFactCheckById(id, database);
  if (!factCheck) return undefined;

  const statement = getStatementById(factCheck.statementId, database);
  if (!statement) return undefined;
  const influencer = getInfluencerById(statement.influencerId, database);
  const content = getContentById(statement.contentId, database);
  if (!influencer || !content) return undefined;

  const stocks = statement.stockIds
    .map((stockId) => getStockById(stockId, database))
    .filter((stock): stock is Stock => Boolean(stock));
  const sources = factCheck.sourceIds
    .map((sourceId) => byId(database.officialSources, sourceId))
    .filter((source): source is OfficialSource => Boolean(source));

  return {
    factCheck,
    statement,
    influencer,
    content,
    stocks,
    sources,
    receipt: getReceiptByStatementId(statement.id, database),
    href: routes.factCheck(factCheck.id),
    influencerHref: routes.influencer(influencer.slug),
  };
}

export function getPredictionView(
  id: string,
  database: MockDatabase = mockDatabase,
): PredictionView | undefined {
  const prediction = getPredictionById(id, database);
  if (!prediction) return undefined;

  const statement = getStatementById(prediction.statementId, database);
  const influencer = getInfluencerById(prediction.influencerId, database);
  const stock = getStockById(prediction.stockId, database);
  if (!statement || !influencer || !stock) return undefined;
  const content = getContentById(statement.contentId, database);
  if (!content) return undefined;

  return {
    prediction,
    statement,
    influencer,
    content,
    stock,
    receipt: getReceiptByStatementId(statement.id, database),
    href: routes.predictions(prediction.id),
    influencerHref: routes.influencer(influencer.slug),
  };
}

export function getInfluencerProfileView(
  slug: string,
  database: MockDatabase = mockDatabase,
): InfluencerProfileView | undefined {
  const influencer = getInfluencerBySlug(slug, database);
  if (!influencer) return undefined;
  const profile = database.influencerProfiles.find(
    (candidate) => candidate.influencerId === influencer.id,
  );
  if (!profile) return undefined;

  const statements = database.statements.filter(
    (statement) => statement.influencerId === influencer.id,
  );
  const statementIds = new Set(statements.map((statement) => statement.id));

  return {
    influencer,
    profile,
    statements,
    factChecks: database.factChecks.filter((factCheck) => statementIds.has(factCheck.statementId)),
    predictions: database.predictions.filter(
      (prediction) => prediction.influencerId === influencer.id,
    ),
    receipts: database.receipts.filter((receipt) => statementIds.has(receipt.statementId)),
    href: routes.influencer(influencer.slug),
  };
}

export function getHomeFactChecks(database: MockDatabase = mockDatabase): FactCheckView[] {
  return database.home.recentFactCheckIds
    .map((id) => getFactCheckView(id, database))
    .filter((view): view is FactCheckView => Boolean(view));
}

export function getHomePredictions(database: MockDatabase = mockDatabase): PredictionView[] {
  return database.home.completedPredictionIds
    .map((id) => getPredictionView(id, database))
    .filter((view): view is PredictionView => Boolean(view));
}

export function getFeaturedInfluencerProfiles(
  database: MockDatabase = mockDatabase,
): InfluencerProfileView[] {
  return database.home.featuredInfluencerIds
    .map((id) => getInfluencerById(id, database))
    .filter((influencer): influencer is Influencer => Boolean(influencer))
    .map((influencer) => getInfluencerProfileView(influencer.slug, database))
    .filter((view): view is InfluencerProfileView => Boolean(view));
}

export function getDemoScenario(
  id: DemoScenarioId,
  database: MockDatabase = mockDatabase,
): DemoScenario {
  return (
    database.demoScenarios.find((scenario) => scenario.id === id) ?? database.demoScenarios[0]
  );
}

/**
 * Deterministic keyword routing for the MVP only. It deliberately does not
 * pretend to be AI and should be presented as a demo scenario selector.
 */
export function inferDemoScenario(
  statement: string,
  database: MockDatabase = mockDatabase,
): DemoScenario {
  const normalized = statement.replace(/\s+/g, " ").trim();

  if (/부채.{0,8}(전혀|없)/.test(normalized)) {
    return getDemoScenario("official-conflict", database);
  }

  const predictionCue = /(오를|오른|상승|하락|떨어|목표가|수익률|예측|전망)/.test(normalized);
  const vagueCue = /(조만간|곧|언젠가|많이|크게|상당히)/.test(normalized);
  const measurableCue = /(\d+(?:\.\d+)?\s*%|\d+\s*(?:일|주|개월|달|년)\s*(?:안|내)?)/.test(
    normalized,
  );

  if (predictionCue && (vagueCue || !measurableCue)) {
    return getDemoScenario("prediction-insufficient", database);
  }

  if (predictionCue && measurableCue) {
    return getDemoScenario("prediction-completed", database);
  }

  return getDemoScenario("contract-confirmed", database);
}

export function getMissingConditionLabels(prediction: Prediction): string[] {
  const labels = {
    direction: "상승·하락 방향",
    target: "목표가격 또는 목표 수익률",
    period: "예측기간",
  } as const;
  return prediction.missingConditions.map((condition) => labels[condition]);
}

export function getTargetReachedLabel(prediction: Prediction): string {
  if (prediction.status === PREDICTION_STATUS.INSUFFICIENT_CONDITIONS) {
    return "평가조건 불충분";
  }
  if (!prediction.evaluation || prediction.evaluation.targetReached === null) {
    return "아직 평가하지 않음";
  }
  return prediction.evaluation.targetReached
    ? "기간 중 목표가 달성"
    : "기간 중 목표가 미달성";
}

function duplicateIds<T extends { id: string }>(items: T[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }
  return [...duplicates];
}

/** Returns human-readable relation errors without mutating the data. */
export function validateMockData(database: MockDatabase = mockDatabase): string[] {
  const issues: string[] = [];
  const collections: Array<[string, Array<{ id: string }>]> = [
    ["stocks", database.stocks],
    ["influencers", database.influencers],
    ["contents", database.contents],
    ["analyses", database.analyses],
    ["statements", database.statements],
    ["officialSources", database.officialSources],
    ["factChecks", database.factChecks],
    ["receipts", database.receipts],
    ["predictions", database.predictions],
    ["demoScenarios", database.demoScenarios],
  ];

  for (const [name, items] of collections) {
    for (const id of duplicateIds(items)) issues.push(`${name}: 중복 ID ${id}`);
  }

  const has = <T extends { id: string }>(items: T[], id: string) => Boolean(byId(items, id));

  for (const content of database.contents) {
    if (!has(database.influencers, content.influencerId)) {
      issues.push(`content ${content.id}: influencer ${content.influencerId} 없음`);
    }
  }

  for (const statement of database.statements) {
    if (!has(database.contents, statement.contentId)) {
      issues.push(`statement ${statement.id}: content ${statement.contentId} 없음`);
    }
    if (!has(database.influencers, statement.influencerId)) {
      issues.push(`statement ${statement.id}: influencer ${statement.influencerId} 없음`);
    }
    for (const stockId of statement.stockIds) {
      if (!has(database.stocks, stockId)) {
        issues.push(`statement ${statement.id}: stock ${stockId} 없음`);
      }
    }
  }

  for (const analysis of database.analyses) {
    if (!has(database.contents, analysis.contentId)) {
      issues.push(`analysis ${analysis.id}: content ${analysis.contentId} 없음`);
    }
    for (const statementId of analysis.statementIds) {
      if (!has(database.statements, statementId)) {
        issues.push(`analysis ${analysis.id}: statement ${statementId} 없음`);
      }
    }
    if (analysis.relatedFactCheckId && !has(database.factChecks, analysis.relatedFactCheckId)) {
      issues.push(`analysis ${analysis.id}: fact check ${analysis.relatedFactCheckId} 없음`);
    }
    if (analysis.relatedPredictionId && !has(database.predictions, analysis.relatedPredictionId)) {
      issues.push(`analysis ${analysis.id}: prediction ${analysis.relatedPredictionId} 없음`);
    }
    if (analysis.receiptId && !has(database.receipts, analysis.receiptId)) {
      issues.push(`analysis ${analysis.id}: receipt ${analysis.receiptId} 없음`);
    }
  }

  for (const factCheck of database.factChecks) {
    if (!has(database.statements, factCheck.statementId)) {
      issues.push(`fact check ${factCheck.id}: statement ${factCheck.statementId} 없음`);
    }
    for (const sourceId of factCheck.sourceIds) {
      if (!has(database.officialSources, sourceId)) {
        issues.push(`fact check ${factCheck.id}: source ${sourceId} 없음`);
      }
    }
  }

  for (const receipt of database.receipts) {
    if (!has(database.statements, receipt.statementId)) {
      issues.push(`receipt ${receipt.id}: statement ${receipt.statementId} 없음`);
    }
  }

  for (const prediction of database.predictions) {
    if (!has(database.statements, prediction.statementId)) {
      issues.push(`prediction ${prediction.id}: statement ${prediction.statementId} 없음`);
    }
    if (!has(database.influencers, prediction.influencerId)) {
      issues.push(`prediction ${prediction.id}: influencer ${prediction.influencerId} 없음`);
    }
    if (!has(database.stocks, prediction.stockId)) {
      issues.push(`prediction ${prediction.id}: stock ${prediction.stockId} 없음`);
    }
    if (prediction.status === PREDICTION_STATUS.COMPLETED && !prediction.evaluation) {
      issues.push(`prediction ${prediction.id}: 완료 상태이나 evaluation 없음`);
    }
    if (prediction.evaluation) {
      const expectedExcess =
        prediction.evaluation.actualReturnPct - prediction.evaluation.benchmarkReturnPct;
      if (Math.abs(expectedExcess - prediction.evaluation.excessReturnPct) > 0.01) {
        issues.push(`prediction ${prediction.id}: 시장 대비 성과 계산 불일치`);
      }
    }
  }

  for (const profile of database.influencerProfiles) {
    if (!has(database.influencers, profile.influencerId)) {
      issues.push(`profile: influencer ${profile.influencerId} 없음`);
    }
    const ratios: RatioMetric[] = [
      profile.metrics.officialAgreement,
      profile.metrics.predictionPerformance.targetReached,
      profile.metrics.sourceCitation,
      profile.metrics.interestDisclosure,
      profile.metrics.exaggerationFlags,
    ];
    if (ratios.some((ratio) => ratio.numerator < 0 || ratio.denominator < ratio.numerator)) {
      issues.push(`profile ${profile.influencerId}: 비율 분자/분모가 유효하지 않음`);
    }
  }

  for (const factCheckId of database.home.recentFactCheckIds) {
    if (!has(database.factChecks, factCheckId)) {
      issues.push(`home: fact check ${factCheckId} 없음`);
    }
  }
  for (const predictionId of database.home.completedPredictionIds) {
    if (!has(database.predictions, predictionId)) {
      issues.push(`home: prediction ${predictionId} 없음`);
    }
  }
  for (const influencerId of database.home.featuredInfluencerIds) {
    if (!has(database.influencers, influencerId)) {
      issues.push(`home: influencer ${influencerId} 없음`);
    }
  }
  for (const scenario of database.demoScenarios) {
    if (!has(database.analyses, scenario.analysisId)) {
      issues.push(`scenario ${scenario.id}: analysis ${scenario.analysisId} 없음`);
    }
  }

  return issues;
}

export function assertMockDataIsValid(database: MockDatabase = mockDatabase): void {
  const issues = validateMockData(database);
  if (issues.length > 0) {
    throw new Error(`StockTrace mock data validation failed:\n${issues.join("\n")}`);
  }
}
