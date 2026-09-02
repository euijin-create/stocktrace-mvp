import "server-only";

import { lookupOpenDartCorporation } from "@/lib/dart/open-dart";
import type { OpenDartCorporation } from "@/lib/dart/types";
import {
  addCalendarDays,
  calculateEvaluationDate,
  compareDateStrings,
  isCompletedDailyDate,
  parseStrictDate,
  toKoreanMarketDate,
} from "@/lib/market-data/date";
import { evaluatePredictionFromDailyBars } from "@/lib/market-data/prediction-evaluation";
import {
  MarketDataProviderError,
  type ProviderSymbolInspection,
} from "@/lib/market-data/provider";
import { yahooFinanceProvider } from "@/lib/market-data/providers/yahoo-finance";
import {
  MARKET_DATA_PROVIDER,
  type BenchmarkHistoryResult,
  type DailyPriceBar,
  type GetBenchmarkHistoryInput,
  type GetHistoricalPriceInput,
  type GetPredictionMarketSnapshotInput,
  type GetPriceRangeInput,
  type HistoricalPriceResult,
  type KoreanMarket,
  type KoreanMarketResolutionResult,
  type MarketDataErrorCode,
  type MarketDataFailure,
  type PredictionDirection,
  type PredictionActualAssessment,
  type PredictionMarketSnapshotFailure,
  type PredictionMarketSnapshotResult,
  type PredictionTargetSnapshot,
  type PriceRangeResult,
} from "@/lib/market-data/types";

export * from "@/lib/market-data/types";
export { calculateEvaluationDate } from "@/lib/market-data/date";

const MARKET_RESOLUTION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FAILED_MARKET_RESOLUTION_CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_MARKET_RESOLUTION_CACHE_ENTRIES = 200;

type ResolutionCache = {
  promises: Map<string, Promise<KoreanMarketResolutionResult>>;
  values: Map<
    string,
    { expiresAt: number; value: KoreanMarketResolutionResult }
  >;
};

const globalWithMarketResolutionCache = globalThis as typeof globalThis & {
  __stockTraceMarketResolutionCache?: ResolutionCache;
};

const resolutionCache =
  globalWithMarketResolutionCache.__stockTraceMarketResolutionCache ??
  (globalWithMarketResolutionCache.__stockTraceMarketResolutionCache = {
    promises: new Map(),
    values: new Map(),
  });

function failure(code: MarketDataErrorCode, message: string): MarketDataFailure {
  return { code, message, ok: false, provider: MARKET_DATA_PROVIDER };
}

function predictionFailure(
  code: MarketDataErrorCode,
  message: string,
  requestedCompanyName: string | null,
  statementDate: string | null,
  assessment: PredictionActualAssessment = {
    dueDate: null,
    message: "현재 평가에 필요한 정보를 확인하지 못했습니다.",
    reason: "conditions_insufficient",
    status: "unavailable",
  },
): PredictionMarketSnapshotFailure {
  return {
    ...failure(code, message),
    assessment,
    dataMode: "unavailable",
    requestedCompanyName,
    statementDate,
  };
}

function logMarketDataError(context: string, error: unknown): void {
  console.error("[StockTrace] Market-data operation failed", {
    context,
    message: error instanceof Error ? error.message : "Unknown error",
    name: error instanceof Error ? error.name : "UnknownError",
  });
}

export async function getPriceRange(
  input: GetPriceRangeInput,
): Promise<PriceRangeResult> {
  if (
    !parseStrictDate(input.startDate) ||
    !parseStrictDate(input.endDate) ||
    compareDateStrings(input.startDate, input.endDate) > 0
  ) {
    return failure("invalid_date", "조회 날짜를 확인해주세요.");
  }
  try {
    const result = await yahooFinanceProvider.getPriceRange(input);
    if (
      result.meta.currency.trim().toLocaleUpperCase("en-US") !== "KRW" ||
      result.meta.exchangeTimezoneName !== "Asia/Seoul"
    ) {
      return failure("symbol_not_found", "종목을 정확하게 식별하지 못했습니다.");
    }
    return {
      bars: result.bars,
      currency: "KRW",
      ok: true,
      provider: MARKET_DATA_PROVIDER,
      symbol: result.symbol,
    };
  } catch (error) {
    logMarketDataError(`price-range:${input.symbol}`, error);
    if (error instanceof MarketDataProviderError && error.code === "not_found") {
      return failure("symbol_not_found", "종목을 정확하게 식별하지 못했습니다.");
    }
    return failure(
      "provider_unavailable",
      "시장데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    );
  }
}

function latestBarOnOrBefore(
  bars: DailyPriceBar[],
  date: string,
): DailyPriceBar | null {
  for (let index = bars.length - 1; index >= 0; index -= 1) {
    if (compareDateStrings(bars[index].date, date) <= 0) return bars[index];
  }
  return null;
}

export async function getHistoricalPrice({
  onOrBefore,
  symbol,
}: GetHistoricalPriceInput): Promise<HistoricalPriceResult> {
  if (!parseStrictDate(onOrBefore)) {
    return failure("invalid_date", "조회 날짜를 확인해주세요.");
  }
  const startDate = addCalendarDays(onOrBefore, -31);
  if (!startDate) return failure("invalid_date", "조회 날짜를 확인해주세요.");
  const result = await getPriceRange({ endDate: onOrBefore, startDate, symbol });
  if (!result.ok) return result;
  const bar = latestBarOnOrBefore(result.bars, onOrBefore);
  if (!bar) {
    return failure("price_not_found", "해당 기간의 주가 데이터를 찾지 못했습니다.");
  }
  return {
    bar,
    ok: true,
    provider: MARKET_DATA_PROVIDER,
    requestedDate: onOrBefore,
    symbol: result.symbol,
  };
}

const BENCHMARK_SYMBOLS = {
  KOSDAQ: "^KQ11",
  KOSPI: "^KS11",
} as const;

export async function getBenchmarkHistory({
  endDate,
  market,
  startDate,
}: GetBenchmarkHistoryInput): Promise<BenchmarkHistoryResult> {
  if (
    !parseStrictDate(startDate) ||
    !parseStrictDate(endDate) ||
    compareDateStrings(startDate, endDate) > 0
  ) {
    return failure("invalid_date", "조회 날짜를 확인해주세요.");
  }
  const symbol = BENCHMARK_SYMBOLS[market];
  try {
    const result = await yahooFinanceProvider.getPriceRange({
      endDate,
      startDate,
      symbol,
    });
    const exchangeName = result.meta.exchangeName.trim().toLocaleUpperCase("en-US");
    const fullExchangeName = (result.meta.fullExchangeName ?? "")
      .trim()
      .toLocaleUpperCase("en-US");
    const isKoreanExchange =
      ["KSC", "KSE", "KOE", "KOSDAQ"].includes(exchangeName) ||
      ["KOREA STOCK EXCHANGE", "KSC", "KSE", "KOE", "KOSDAQ"].includes(
        fullExchangeName,
      );
    if (
      result.meta.symbol.trim().toLocaleUpperCase("en-US") !== symbol ||
      result.meta.instrumentType.trim().toLocaleUpperCase("en-US") !== "INDEX" ||
      result.meta.currency.trim().toLocaleUpperCase("en-US") !== "KRW" ||
      result.meta.exchangeTimezoneName !== "Asia/Seoul" ||
      !isKoreanExchange
    ) {
      return failure(
        "provider_unavailable",
        "시장데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
    return {
      bars: result.bars,
      benchmarkName: market,
      currency: "KRW",
      market,
      ok: true,
      provider: MARKET_DATA_PROVIDER,
      symbol,
    };
  } catch (error) {
    logMarketDataError(`benchmark:${market}`, error);
    return failure(
      "provider_unavailable",
      "시장데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    );
  }
}

function metadataMatchesMarket(
  inspection: ProviderSymbolInspection,
  expectedSymbol: string,
  market: KoreanMarket,
): boolean {
  if (inspection.status !== "valid") return false;
  const meta = inspection.meta;
  const exchangeName = meta.exchangeName.trim().toLocaleUpperCase("en-US");
  const fullExchangeName = (meta.fullExchangeName ?? "")
    .trim()
    .toLocaleUpperCase("en-US");
  const validExchange =
    market === "KOSPI"
      ? ["KSC", "KSE"].includes(exchangeName) ||
        ["KOREA STOCK EXCHANGE", "KSC", "KSE"].includes(fullExchangeName)
      : ["KOE", "KOSDAQ"].includes(exchangeName) ||
        ["KOE", "KOSDAQ"].includes(fullExchangeName);
  return (
    meta.symbol.trim().toLocaleUpperCase("en-US") === expectedSymbol &&
    meta.instrumentType.trim().toLocaleUpperCase("en-US") === "EQUITY" &&
    meta.currency.trim().toLocaleUpperCase("en-US") === "KRW" &&
    meta.exchangeTimezoneName === "Asia/Seoul" &&
    validExchange
  );
}

async function resolveKoreanMarketUncached(
  stockCode: string,
): Promise<KoreanMarketResolutionResult> {
  const endDate = toKoreanMarketDate(new Date());
  const startDate = addCalendarDays(endDate, -14);
  if (!startDate) return failure("invalid_date", "조회 날짜를 확인해주세요.");
  const candidates = [
    { benchmarkSymbol: "^KS11" as const, market: "KOSPI" as const, symbol: `${stockCode}.KS` },
    { benchmarkSymbol: "^KQ11" as const, market: "KOSDAQ" as const, symbol: `${stockCode}.KQ` },
  ];
  const inspections = await Promise.all(
    candidates.map(async (candidate) => ({
      ...candidate,
      inspection: await yahooFinanceProvider.inspectSymbol({
        endDate,
        startDate,
        symbol: candidate.symbol,
      }),
    })),
  );
  const matches = inspections.filter((candidate) =>
    metadataMatchesMarket(candidate.inspection, candidate.symbol, candidate.market),
  );
  if (matches.length === 1) {
    const [match] = matches;
    return {
      benchmarkName: match.market,
      benchmarkSymbol: match.benchmarkSymbol,
      currency: "KRW",
      market: match.market,
      ok: true,
      provider: MARKET_DATA_PROVIDER,
      stockCode,
      symbol: match.symbol,
    };
  }
  if (matches.length > 1) {
    return failure("ambiguous_market", "종목을 정확하게 식별하지 못했습니다.");
  }
  if (inspections.some(({ inspection }) => inspection.status === "unavailable")) {
    return failure(
      "provider_unavailable",
      "시장데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    );
  }
  return failure("symbol_not_found", "종목을 정확하게 식별하지 못했습니다.");
}

export async function resolveKoreanMarket(
  stockCode: string,
): Promise<KoreanMarketResolutionResult> {
  const normalizedStockCode = stockCode.trim();
  if (!/^\d{6}$/.test(normalizedStockCode)) {
    return failure("invalid_request", "종목을 정확하게 식별하지 못했습니다.");
  }
  const cached = resolutionCache.values.get(normalizedStockCode);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const pending = resolutionCache.promises.get(normalizedStockCode);
  if (pending) return pending;

  const request = resolveKoreanMarketUncached(normalizedStockCode)
    .then((value) => {
      resolutionCache.values.set(normalizedStockCode, {
        expiresAt:
          Date.now() +
          (value.ok
            ? MARKET_RESOLUTION_CACHE_TTL_MS
            : FAILED_MARKET_RESOLUTION_CACHE_TTL_MS),
        value,
      });
      while (resolutionCache.values.size > MAX_MARKET_RESOLUTION_CACHE_ENTRIES) {
        const oldestKey = resolutionCache.values.keys().next().value;
        if (typeof oldestKey !== "string") break;
        resolutionCache.values.delete(oldestKey);
      }
      return value;
    })
    .finally(() => {
      if (resolutionCache.promises.get(normalizedStockCode) === request) {
        resolutionCache.promises.delete(normalizedStockCode);
      }
    });
  resolutionCache.promises.set(normalizedStockCode, request);
  return request;
}

export function calculatePredictionTarget({
  baseClose,
  direction,
  targetPrice,
  targetReturnPercent,
}: {
  baseClose: number;
  direction: PredictionDirection;
  targetPrice: number | null | undefined;
  targetReturnPercent: number | null | undefined;
}): PredictionTargetSnapshot {
  const statedTargetPrice =
    typeof targetPrice === "number" && Number.isFinite(targetPrice) && targetPrice > 0
      ? targetPrice
      : null;
  const validReturn =
    typeof targetReturnPercent === "number" && Number.isFinite(targetReturnPercent)
      ? targetReturnPercent
      : null;
  if (statedTargetPrice !== null || validReturn === null) {
    return {
      calculatedTargetPrice: null,
      statedTargetPrice,
      targetReturnPercent: validReturn,
    };
  }
  const signedReturn =
    direction === "down"
      ? -Math.abs(validReturn)
      : direction === "up"
        ? Math.abs(validReturn)
        : validReturn;
  const calculated = baseClose * (1 + signedReturn / 100);
  return {
    calculatedTargetPrice:
      Number.isFinite(calculated) && calculated > 0 ? Math.round(calculated) : null,
    statedTargetPrice: null,
    targetReturnPercent: validReturn,
  };
}

function mapCorporationFailure(
  status: string,
  requestedCompanyName: string | null,
  statementDate: string,
  assessment: PredictionActualAssessment,
): PredictionMarketSnapshotFailure {
  if (status === "company_not_found") {
    return predictionFailure(
      "company_not_found",
      "종목을 정확하게 식별하지 못했습니다.",
      requestedCompanyName,
      statementDate,
      assessment,
    );
  }
  if (status === "stock_code_not_found" || status === "stock_not_listed") {
    return predictionFailure(
      "stock_not_listed",
      "종목을 정확하게 식별하지 못했습니다.",
      requestedCompanyName,
      statementDate,
      assessment,
    );
  }
  return predictionFailure(
    "company_lookup_unavailable",
    "종목 식별 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    requestedCompanyName,
    statementDate,
    assessment,
  );
}

function assessmentBeforeMarketData(
  dueDate: string | null,
  now: Date,
): PredictionActualAssessment {
  if (!dueDate) {
    return {
      dueDate: null,
      message: "구체적인 예측 기간이 없어 현재 평가할 수 없습니다.",
      reason: "conditions_insufficient",
      status: "unavailable",
    };
  }
  if (!isCompletedDailyDate(dueDate, now)) {
    return { dueDate, status: "tracking" };
  }
  return {
    dueDate,
    message: "평가기간의 실제 시장데이터를 충분히 확인하지 못했습니다.",
    reason: "stock_data_missing",
    status: "unavailable",
  };
}

export async function getPredictionMarketSnapshot({
  companyNames,
  direction,
  predictionPeriod,
  statementDate,
  targetPrice,
  targetReturnPercent,
}: GetPredictionMarketSnapshotInput): Promise<PredictionMarketSnapshotResult> {
  const requestedCompanyName =
    companyNames.map((name) => name?.trim() ?? "").find(Boolean) ?? null;
  if (!parseStrictDate(statementDate)) {
    return predictionFailure(
      "invalid_date",
      "발언 기준일을 확인해주세요.",
      requestedCompanyName,
      null,
    );
  }
  const now = new Date();
  const today = toKoreanMarketDate(now);
  const dueDate = calculateEvaluationDate(statementDate, predictionPeriod);
  const pendingAssessment = assessmentBeforeMarketData(dueDate, now);
  if (compareDateStrings(statementDate, today) > 0) {
    return predictionFailure(
      "invalid_date",
      "발언 기준일은 오늘 또는 과거 날짜를 선택해주세요.",
      requestedCompanyName,
      statementDate,
      pendingAssessment,
    );
  }

  let corporationResult: Awaited<ReturnType<typeof lookupOpenDartCorporation>>;
  try {
    corporationResult = await lookupOpenDartCorporation({ companyNames });
  } catch (error) {
    logMarketDataError("corporation-lookup", error);
    return mapCorporationFailure(
      "unavailable",
      requestedCompanyName,
      statementDate,
      pendingAssessment,
    );
  }
  if (corporationResult.status !== "success" || !corporationResult.company) {
    return mapCorporationFailure(
      corporationResult.status,
      requestedCompanyName,
      statementDate,
      pendingAssessment,
    );
  }
  const corporation: OpenDartCorporation = corporationResult.company;
  if (!corporation.stockCode) {
    return mapCorporationFailure(
      "stock_not_listed",
      corporation.corpName,
      statementDate,
      pendingAssessment,
    );
  }

  const resolution = await resolveKoreanMarket(corporation.stockCode);
  if (!resolution.ok) {
    return {
      ...predictionFailure(
        resolution.code,
        resolution.message,
        corporation.corpName,
        statementDate,
        pendingAssessment,
      ),
    };
  }

  const lastRequestedDate =
    dueDate && isCompletedDailyDate(dueDate, now) ? dueDate : statementDate;
  const startDate = addCalendarDays(statementDate, -31);
  if (!startDate) {
    return predictionFailure(
      "invalid_date",
      "발언 기준일을 확인해주세요.",
      corporation.corpName,
      statementDate,
      pendingAssessment,
    );
  }

  const [stockHistory, benchmarkHistory] = await Promise.all([
    getPriceRange({
      endDate: lastRequestedDate,
      startDate,
      symbol: resolution.symbol,
    }),
    getBenchmarkHistory({
      endDate: lastRequestedDate,
      market: resolution.market,
      startDate,
    }),
  ]);
  if (!stockHistory.ok) {
    return predictionFailure(
      stockHistory.code,
      stockHistory.message,
      corporation.corpName,
      statementDate,
      pendingAssessment,
    );
  }
  if (!benchmarkHistory.ok) {
    return predictionFailure(
      benchmarkHistory.code,
      benchmarkHistory.message,
      corporation.corpName,
      statementDate,
      pendingAssessment,
    );
  }
  const priceAtStatement = latestBarOnOrBefore(stockHistory.bars, statementDate);
  if (!priceAtStatement) {
    return predictionFailure(
      "price_not_found",
      "해당 기간의 주가 데이터를 찾지 못했습니다.",
      corporation.corpName,
      statementDate,
      pendingAssessment,
    );
  }
  const targets = calculatePredictionTarget({
    baseClose: priceAtStatement.close,
    direction,
    targetPrice,
    targetReturnPercent,
  });
  const assessment = evaluatePredictionFromDailyBars({
    benchmarkBars: benchmarkHistory.bars,
    benchmarkName: resolution.benchmarkName,
    direction,
    dueDate,
    now,
    statementDate,
    stockBars: stockHistory.bars,
    targets,
  });
  const benchmarkBase =
    assessment.status === "completed"
      ? assessment.benchmarkBasePrice
      : latestBarOnOrBefore(benchmarkHistory.bars, priceAtStatement.date);
  const evaluationPrice =
    assessment.status === "completed" ? assessment.evaluationPrice : null;
  const benchmarkEvaluation =
    assessment.status === "completed"
      ? assessment.benchmarkEvaluationPrice
      : null;

  return {
    assessment,
    benchmark: {
      basePrice: benchmarkBase,
      evaluationPrice: benchmarkEvaluation,
      market: resolution.market,
      name: resolution.benchmarkName,
      symbol: resolution.benchmarkSymbol,
    },
    company: {
      corpCode: corporation.corpCode,
      corpName: corporation.corpName,
      stockCode: corporation.stockCode,
    },
    dataMode: "actual",
    evaluation: {
      benchmarkPrice: benchmarkEvaluation,
      dueDate,
      periodRecognized: dueDate !== null,
      price: evaluationPrice,
    },
    market: resolution.market,
    ok: true,
    priceAtStatement,
    provider: MARKET_DATA_PROVIDER,
    statementDate,
    stockCode: corporation.stockCode,
    symbol: resolution.symbol,
    targets,
  };
}
