export type KoreanMarket = "KOSDAQ" | "KOSPI";

export type PredictionDirection = "down" | "neutral" | "unknown" | "up";

export const MARKET_DATA_PROVIDER = {
  displayName: "Yahoo Finance (비공식)",
  id: "yahoo-finance2",
  isOfficial: false,
  note: "Yahoo Finance의 비공식 인터페이스를 사용하는 실제 시장데이터",
  requiresApiKey: false,
} as const;

export type MarketDataProviderInfo = typeof MARKET_DATA_PROVIDER;

export interface DailyPriceBar {
  close: number;
  currency: "KRW";
  date: string;
  high: number;
  low: number;
  open: number;
  volume: number | null;
}

export type MarketDataErrorCode =
  | "ambiguous_market"
  | "company_lookup_unavailable"
  | "company_not_found"
  | "invalid_date"
  | "invalid_request"
  | "price_not_found"
  | "provider_unavailable"
  | "stock_not_listed"
  | "symbol_not_found";

export interface MarketDataFailure {
  code: MarketDataErrorCode;
  message: string;
  ok: false;
  provider: MarketDataProviderInfo;
}

export interface PriceRangeSuccess {
  bars: DailyPriceBar[];
  currency: "KRW";
  ok: true;
  provider: MarketDataProviderInfo;
  symbol: string;
}

export type PriceRangeResult = MarketDataFailure | PriceRangeSuccess;

export interface HistoricalPriceSuccess {
  bar: DailyPriceBar;
  ok: true;
  provider: MarketDataProviderInfo;
  requestedDate: string;
  symbol: string;
}

export type HistoricalPriceResult = MarketDataFailure | HistoricalPriceSuccess;

export interface BenchmarkHistorySuccess extends PriceRangeSuccess {
  benchmarkName: KoreanMarket;
  market: KoreanMarket;
}

export type BenchmarkHistoryResult = BenchmarkHistorySuccess | MarketDataFailure;

export interface KoreanMarketResolutionSuccess {
  benchmarkName: KoreanMarket;
  benchmarkSymbol: "^KQ11" | "^KS11";
  currency: "KRW";
  market: KoreanMarket;
  ok: true;
  provider: MarketDataProviderInfo;
  stockCode: string;
  symbol: string;
}

export type KoreanMarketResolutionResult =
  | KoreanMarketResolutionSuccess
  | MarketDataFailure;

export interface PredictionTargetSnapshot {
  calculatedTargetPrice: number | null;
  statedTargetPrice: number | null;
  targetReturnPercent: number | null;
}

export interface PredictionEvaluationSnapshot {
  benchmarkPrice: DailyPriceBar | null;
  dueDate: string | null;
  periodRecognized: boolean;
  price: DailyPriceBar | null;
}

export interface PredictionBenchmarkSnapshot {
  basePrice: DailyPriceBar | null;
  evaluationPrice: DailyPriceBar | null;
  market: KoreanMarket;
  name: KoreanMarket;
  symbol: "^KQ11" | "^KS11";
}

export interface PredictionMarketSnapshotSuccess {
  benchmark: PredictionBenchmarkSnapshot;
  company: {
    corpCode: string;
    corpName: string;
    stockCode: string;
  };
  dataMode: "actual";
  evaluation: PredictionEvaluationSnapshot;
  market: KoreanMarket;
  ok: true;
  priceAtStatement: DailyPriceBar;
  provider: MarketDataProviderInfo;
  statementDate: string;
  stockCode: string;
  symbol: string;
  targets: PredictionTargetSnapshot;
}

export interface PredictionMarketSnapshotFailure extends MarketDataFailure {
  dataMode: "unavailable";
  requestedCompanyName: string | null;
  statementDate: string | null;
}

export type PredictionMarketSnapshotResult =
  | PredictionMarketSnapshotFailure
  | PredictionMarketSnapshotSuccess;

export interface GetPriceRangeInput {
  endDate: string;
  startDate: string;
  symbol: string;
}

export interface GetHistoricalPriceInput {
  onOrBefore: string;
  symbol: string;
}

export interface GetBenchmarkHistoryInput {
  endDate: string;
  market: KoreanMarket;
  startDate: string;
}

export interface GetPredictionMarketSnapshotInput {
  companyNames: Array<string | null | undefined>;
  direction: PredictionDirection;
  predictionPeriod: string | null | undefined;
  statementDate: string;
  targetPrice: number | null | undefined;
  targetReturnPercent: number | null | undefined;
}
