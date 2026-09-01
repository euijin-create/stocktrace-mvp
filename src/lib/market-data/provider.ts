import type { DailyPriceBar, MarketDataProviderInfo } from "@/lib/market-data/types";

export interface ProviderMarketMetadata {
  currency: string;
  exchangeName: string;
  exchangeTimezoneName: string;
  fullExchangeName?: string;
  instrumentType: string;
  symbol: string;
}

export interface ProviderPriceRange {
  bars: DailyPriceBar[];
  meta: ProviderMarketMetadata;
  symbol: string;
}

export interface MarketDataProvider {
  readonly info: MarketDataProviderInfo;
  getPriceRange(input: {
    endDate: string;
    startDate: string;
    symbol: string;
  }): Promise<ProviderPriceRange>;
  inspectSymbol(input: {
    endDate: string;
    startDate: string;
    symbol: string;
  }): Promise<ProviderSymbolInspection>;
}

export type ProviderSymbolInspection =
  | { meta: ProviderMarketMetadata; status: "valid" }
  | { status: "invalid" }
  | { status: "unavailable" };

export class MarketDataProviderError extends Error {
  constructor(
    readonly code: "invalid_symbol" | "not_found" | "request_failed" | "timeout",
    message: string,
  ) {
    super(message);
    this.name = "MarketDataProviderError";
  }
}
