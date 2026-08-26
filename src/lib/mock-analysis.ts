import { CLAIM_TYPE, type ClaimType } from "@/types/stocktrace";

export interface ContentAnalysisInput {
  contentUrl: string;
  influencerName: string;
  statement: string;
}

export type MockAnalysisKind =
  | "fact"
  | "prediction"
  | "opinion"
  | "insufficient_prediction";

export interface MockAnalysisResult {
  kind: MockAnalysisKind;
  claimType: ClaimType;
  label: string;
  description: string;
  conditionLabel: string;
  detectedEntity: string;
  confidence: number;
  destinationHref: string | null;
  destinationLabel: string | null;
  receiptHref: string | null;
  predictionDetails?: {
    directionLabel: "상승" | "하락" | "방향 확인 필요";
    targetReturnLabel?: string;
    periodLabel?: string;
  };
}

export interface MockAnalyzedStatement {
  id: string;
  statement: string;
  analysis: MockAnalysisResult;
}

export interface MockContentAnalysisResult {
  statements: MockAnalyzedStatement[];
}

const ANALYSIS_MARKER = "stocktrace-demo";

export const ANALYSIS_QUERY_KEYS = {
  marker: "analysis",
  contentUrl: "contentUrl",
  influencerName: "influencer",
  statement: "statement",
} as const;

function detectEntity(statement: string): string {
  if (/에이원테크/.test(statement)) return "에이원테크 · 123450";
  if (/한빛리테일/.test(statement)) return "한빛리테일 · 345670";
  if (/누리셀/.test(statement)) return "누리셀 · 567890";
  if (/(?:^|\s)A사/.test(statement)) return "A사 · 종목 확인 필요";
  return "종목 확인 필요";
}

const sentenceEndings = new Set([".", "?", "!", "…", "。", "？", "！"]);
const closingMarks = new Set(['"', "'", "”", "’", "」", "』", ")", "]"]);

/**
 * Lightweight MVP sentence splitter. It recognizes both punctuation and line
 * breaks, while protecting decimal points such as 20.5%. Replace this function
 * together with the mock classifier when a real analysis API is introduced.
 */
export function splitStatementsWithMock(value: string): string[] {
  const source = value.replace(/\r\n?/g, "\n").trim();
  if (!source) return [];

  const statements: string[] = [];
  let buffer = "";

  const flush = () => {
    const statement = buffer.replace(/\s+/g, " ").trim();
    if (statement) statements.push(statement);
    buffer = "";
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (character === "\n") {
      flush();
      continue;
    }

    buffer += character;
    if (!sentenceEndings.has(character)) continue;

    const previousCharacter = source[index - 1];
    const nextCharacter = source[index + 1];
    const isDecimalPoint =
      character === "." && /\d/.test(previousCharacter ?? "") && /\d/.test(nextCharacter ?? "");
    if (isDecimalPoint) continue;
    while (
      sentenceEndings.has(source[index + 1]) ||
      closingMarks.has(source[index + 1])
    ) {
      index += 1;
      buffer += source[index];
    }

    flush();
  }

  flush();

  if (statements.length > 1) {
    const quotePairs: Array<[string, string]> = [
      ['"', '"'],
      ["'", "'"],
      ["“", "”"],
      ["‘", "’"],
    ];
    const first = statements[0];
    const lastIndex = statements.length - 1;
    const last = statements[lastIndex];
    const wrapper = quotePairs.find(
      ([opening, closing]) => first.startsWith(opening) && last.endsWith(closing),
    );
    if (wrapper) {
      statements[0] = first.slice(1).trim();
      statements[lastIndex] = last.slice(0, -1).trim();
    }
  }

  return statements.filter(Boolean);
}

function extractPredictionDetails(statement: string) {
  const directionLabel = /(하락|떨어|내릴)/.test(statement)
    ? "하락"
    : /(상승|오를|오른)/.test(statement)
      ? "상승"
      : "방향 확인 필요";
  const targetMatch = statement.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  const periodMatch = statement.match(
    /(\d+(?:\.\d+)?|한|두|세|네)\s*(일|주|개월|달|년)\s*(?:안|내|후)?/,
  );
  const koreanNumber = { 한: "1", 두: "2", 세: "3", 네: "4" } as const;

  let targetReturnLabel: string | undefined;
  if (targetMatch) {
    const rawValue = Number(targetMatch[1]);
    const signedValue = directionLabel === "하락" ? -Math.abs(rawValue) : Math.abs(rawValue);
    targetReturnLabel = `${signedValue > 0 ? "+" : ""}${signedValue.toLocaleString("ko-KR")}%`;
  }

  let periodLabel: string | undefined;
  if (periodMatch) {
    const rawAmount = periodMatch[1];
    const amount = rawAmount in koreanNumber
      ? koreanNumber[rawAmount as keyof typeof koreanNumber]
      : rawAmount;
    const unit = periodMatch[2] === "달" ? "개월" : periodMatch[2];
    periodLabel = `${amount}${unit}`;
  }

  return { directionLabel, targetReturnLabel, periodLabel } as const;
}

/**
 * Deterministic MVP classifier. Replace this function with an API-backed
 * implementation later while keeping ContentAnalysisInput/Result stable.
 */
export function classifyStatementWithMock(statement: string): MockAnalysisResult {
  const normalized = statement.replace(/\s+/g, " ").trim();
  const detectedEntity = detectEntity(normalized);
  const opinionCue = /(생각한다|생각해|개인적으로|저평가|고평가|느낌|보인다)/.test(normalized);
  const predictionCue = /(오를|오른|상승|하락|떨어|내릴|목표가|수익률|예측|전망)/.test(normalized);
  const vagueCue = /(조만간|곧|언젠가|많이|크게|상당히)/.test(normalized);
  const predictionDetails = extractPredictionDetails(normalized);
  const periodCue = Boolean(predictionDetails.periodLabel);
  const targetCue = Boolean(predictionDetails.targetReturnLabel) || /목표가\s*\d+/.test(normalized);

  if (opinionCue && !predictionCue) {
    return {
      kind: "opinion",
      claimType: CLAIM_TYPE.OPINION,
      label: "개인적인 의견",
      description: "검증 가능한 사건이나 수치보다 작성자의 해석과 판단이 중심인 발언입니다.",
      conditionLabel: "팩트체크·예측 평가 대상 아님",
      detectedEntity,
      confidence: 90,
      destinationHref: null,
      destinationLabel: null,
      receiptHref: null,
    };
  }

  if (predictionCue && (vagueCue || !periodCue || !targetCue)) {
    return {
      kind: "insufficient_prediction",
      claimType: CLAIM_TYPE.PRICE_PREDICTION,
      label: "미래 주가 예측",
      description: "상승·하락에 대한 표현은 있지만 목표 수준이나 기간이 구체적이지 않아 객관적인 사후 평가가 어렵습니다.",
      conditionLabel: "평가조건 불충분",
      detectedEntity,
      confidence: 88,
      destinationHref: "/predictions?focus=prediction-insufficient",
      destinationLabel: "조건 불충분 예측 보기",
      receiptHref: "/receipts/receipt-prediction-insufficient",
      predictionDetails,
    };
  }

  if (predictionCue) {
    return {
      kind: "prediction",
      claimType: CLAIM_TYPE.PRICE_PREDICTION,
      label: "미래 주가 예측",
      description: "방향, 목표 수익률과 예측기간이 있어 사후 성과를 기록하고 평가할 수 있는 발언입니다.",
      conditionLabel: "평가조건 충족",
      detectedEntity,
      confidence: 92,
      destinationHref: "/predictions?focus=prediction-completed",
      destinationLabel: "예측 추적 결과 보기",
      receiptHref: "/receipts/receipt-prediction-completed",
      predictionDetails,
    };
  }

  const conflictsOfficialData = /부채.{0,8}(전혀|없)/.test(normalized);
  return {
    kind: "fact",
    claimType: CLAIM_TYPE.VERIFIABLE_FACT,
    label: "공식자료로 확인 가능한 사실 주장",
    description: "기업명, 사건 또는 수치가 포함되어 있어 공식자료와 비교할 수 있는 발언입니다.",
    conditionLabel: "팩트체크 가능",
    detectedEntity,
    confidence: 93,
    destinationHref: conflictsOfficialData
      ? "/fact-checks/fact-nuricell-conflict"
      : "/fact-checks/fact-contract-confirmed",
    destinationLabel: "팩트체크 결과 보기",
    receiptHref: conflictsOfficialData
      ? "/receipts/receipt-nuricell"
      : "/receipts/receipt-contract",
  };
}

export function analyzeStatementsWithMock(statement: string): MockAnalyzedStatement[] {
  return splitStatementsWithMock(statement).map((extractedStatement, index) => ({
    id: `extracted-statement-${index + 1}`,
    statement: extractedStatement,
    analysis: classifyStatementWithMock(extractedStatement),
  }));
}

/** Async boundary matching the shape of a future content-analysis API call. */
export async function analyzeContentWithMock(
  input: ContentAnalysisInput,
): Promise<MockContentAnalysisResult> {
  return { statements: analyzeStatementsWithMock(input.statement) };
}

export function appendAnalysisInput(
  href: string,
  input: ContentAnalysisInput,
): string {
  const url = new URL(href, "https://stocktrace.local");
  url.searchParams.set(ANALYSIS_QUERY_KEYS.marker, ANALYSIS_MARKER);
  url.searchParams.set(ANALYSIS_QUERY_KEYS.contentUrl, input.contentUrl);
  url.searchParams.set(ANALYSIS_QUERY_KEYS.influencerName, input.influencerName);
  url.searchParams.set(ANALYSIS_QUERY_KEYS.statement, input.statement);
  return `${url.pathname}${url.search}${url.hash}`;
}

export type AnalysisParamReader = (key: string) => string | null | undefined;
export type AnalysisSearchParams = Record<string, string | string[] | undefined>;

export function readAnalysisInput(read: AnalysisParamReader): ContentAnalysisInput | null {
  if (read(ANALYSIS_QUERY_KEYS.marker) !== ANALYSIS_MARKER) return null;

  const contentUrl = read(ANALYSIS_QUERY_KEYS.contentUrl)?.trim() ?? "";
  const influencerName = read(ANALYSIS_QUERY_KEYS.influencerName)?.trim() ?? "";
  const statement = read(ANALYSIS_QUERY_KEYS.statement)?.trim() ?? "";
  if (!contentUrl || !influencerName || !statement) return null;

  try {
    const parsed = new URL(contentUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  } catch {
    return null;
  }

  return { contentUrl, influencerName, statement };
}

export function readAnalysisInputFromRecord(
  searchParams: AnalysisSearchParams,
): ContentAnalysisInput | null {
  return readAnalysisInput((key) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  });
}
