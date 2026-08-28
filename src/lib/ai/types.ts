export const STOCK_STATEMENT_TYPES = [
  "fact_claim",
  "prediction",
  "opinion",
  "exaggeration_or_context_missing",
  "advertising_or_conflict",
] as const;

export type StockStatementType = (typeof STOCK_STATEMENT_TYPES)[number];

export const STOCK_DIRECTIONS = ["up", "down", "neutral", "unknown"] as const;

export type StockDirection = (typeof STOCK_DIRECTIONS)[number];

export type AnalysisMode = "ai" | "demo";

export interface StockStatementAnalysis {
  statementType: StockStatementType;
  originalStatement: string;
  company: string | null;
  stockName: string | null;
  direction: StockDirection;
  targetPrice: number | null;
  targetReturnPercent: number | null;
  predictionPeriod: string | null;
  conditions: string[];
  summary: string;
  evaluationPossible: boolean;
  evaluationMissingReason: string | null;
}

export interface StockContentAnalysis {
  statements: StockStatementAnalysis[];
}

export interface StockAnalysisResponse extends StockContentAnalysis {
  mode: AnalysisMode;
}

export interface StockAnalysisProvider {
  analyze(statementText: string): Promise<StockContentAnalysis>;
}
