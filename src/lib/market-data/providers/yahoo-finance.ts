import "server-only";

import YahooFinance from "yahoo-finance2";
import type { ChartResultArrayQuote } from "yahoo-finance2/modules/chart";

import {
  addCalendarDays,
  compareDateStrings,
  isCompletedDailyDate,
  parseStrictDate,
  toKoreanMarketDate,
  toKoreanMidnight,
} from "@/lib/market-data/date";
import {
  MarketDataProviderError,
  type MarketDataProvider,
  type ProviderPriceRange,
  type ProviderSymbolInspection,
} from "@/lib/market-data/provider";
import {
  MARKET_DATA_PROVIDER,
  type DailyPriceBar,
} from "@/lib/market-data/types";

const REQUEST_TIMEOUT_MS = 12_000;
const RANGE_CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_RANGE_CACHE_ENTRIES = 200;
const SYMBOL_PATTERN = /^(?:\^[A-Z0-9]{1,14}|[A-Z0-9][A-Z0-9.^=-]{0,24})$/;

type TimedEntry<T> = { expiresAt: number; value: T };
type YahooMarketCache = {
  range: Map<string, TimedEntry<ProviderPriceRange>>;
  rangePromises: Map<string, Promise<ProviderPriceRange>>;
};

const globalWithYahooMarketCache = globalThis as typeof globalThis & {
  __stockTraceYahooMarketCache?: YahooMarketCache;
};

const cache =
  globalWithYahooMarketCache.__stockTraceYahooMarketCache ??
  (globalWithYahooMarketCache.__stockTraceYahooMarketCache = {
    range: new Map(),
    rangePromises: new Map(),
  });

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toLocaleUpperCase("en-US");
}

function assertSymbol(symbol: string): string {
  const normalized = normalizeSymbol(symbol);
  if (!SYMBOL_PATTERN.test(normalized)) {
    throw new MarketDataProviderError("invalid_symbol", "Invalid market symbol");
  }
  return normalized;
}

function isFinitePrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function readDailyBar(quote: ChartResultArrayQuote): DailyPriceBar | null {
  const date = toKoreanMarketDate(quote.date);
  if (
    !isCompletedDailyDate(date) ||
    !isFinitePrice(quote.open) ||
    !isFinitePrice(quote.high) ||
    !isFinitePrice(quote.low) ||
    !isFinitePrice(quote.close) ||
    quote.high < quote.low
  ) {
    return null;
  }
  return {
    close: quote.close,
    currency: "KRW",
    date,
    high: quote.high,
    low: quote.low,
    open: quote.open,
    volume:
      typeof quote.volume === "number" && Number.isFinite(quote.volume) && quote.volume >= 0
        ? quote.volume
        : null,
  };
}

function looksLikeMissingSymbol(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /404|delisted|invalid symbol|no data found|not found|quote not found/i.test(message);
}

function logProviderError(error: unknown, symbol: string): void {
  console.error("[StockTrace] Yahoo Finance market-data request failed", {
    code: error instanceof MarketDataProviderError ? error.code : "unknown",
    message: error instanceof Error ? error.message : "Unknown error",
    symbol,
  });
}

async function downloadPriceRange({
  endDate,
  startDate,
  symbol,
}: {
  endDate: string;
  startDate: string;
  symbol: string;
}): Promise<ProviderPriceRange> {
  const period1 = toKoreanMidnight(startDate);
  const exclusiveEnd = addCalendarDays(endDate, 1);
  const period2 = exclusiveEnd ? toKoreanMidnight(exclusiveEnd) : null;
  if (!period1 || !period2) {
    throw new MarketDataProviderError("request_failed", "Invalid market-data date range");
  }

  try {
    const result = await yahooFinance.chart(
      symbol,
      {
        events: "",
        includePrePost: false,
        interval: "1d",
        period1,
        period2,
      },
      {
        fetchOptions: { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
      },
    );
    const exactSymbol = normalizeSymbol(result.meta.symbol);
    if (exactSymbol !== symbol) {
      throw new MarketDataProviderError("not_found", "Provider returned a different symbol");
    }
    const bars = result.quotes
      .map(readDailyBar)
      .filter((bar): bar is DailyPriceBar => bar !== null)
      .filter(
        (bar) =>
          compareDateStrings(bar.date, startDate) >= 0 &&
          compareDateStrings(bar.date, endDate) <= 0,
      )
      .sort((left, right) => compareDateStrings(left.date, right.date));
    return { bars, meta: result.meta, symbol };
  } catch (error) {
    if (error instanceof MarketDataProviderError) throw error;
    const isTimeout =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");
    throw new MarketDataProviderError(
      isTimeout ? "timeout" : looksLikeMissingSymbol(error) ? "not_found" : "request_failed",
      error instanceof Error ? error.message : "Yahoo Finance request failed",
    );
  }
}

async function getCachedPriceRange(input: {
  endDate: string;
  startDate: string;
  symbol: string;
}): Promise<ProviderPriceRange> {
  const symbol = assertSymbol(input.symbol);
  if (
    !parseStrictDate(input.startDate) ||
    !parseStrictDate(input.endDate) ||
    compareDateStrings(input.startDate, input.endDate) > 0
  ) {
    throw new MarketDataProviderError("request_failed", "Invalid market-data date range");
  }
  const key = `${symbol}:${input.startDate}:${input.endDate}`;
  const existing = cache.range.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.value;
  const pending = cache.rangePromises.get(key);
  if (pending) return pending;

  const request = downloadPriceRange({ ...input, symbol })
    .then((value) => {
      cache.range.set(key, { expiresAt: Date.now() + RANGE_CACHE_TTL_MS, value });
      while (cache.range.size > MAX_RANGE_CACHE_ENTRIES) {
        const oldestKey = cache.range.keys().next().value;
        if (typeof oldestKey !== "string") break;
        cache.range.delete(oldestKey);
      }
      return value;
    })
    .finally(() => {
      if (cache.rangePromises.get(key) === request) cache.rangePromises.delete(key);
    });
  cache.rangePromises.set(key, request);
  return request;
}

async function inspectSymbol(input: {
  endDate: string;
  startDate: string;
  symbol: string;
}): Promise<ProviderSymbolInspection> {
  try {
    const result = await getCachedPriceRange(input);
    return { meta: result.meta, status: "valid" };
  } catch (error) {
    if (error instanceof MarketDataProviderError && error.code === "not_found") {
      return { status: "invalid" };
    }
    logProviderError(error, input.symbol);
    return { status: "unavailable" };
  }
}

export const yahooFinanceProvider: MarketDataProvider = {
  getPriceRange: getCachedPriceRange,
  info: MARKET_DATA_PROVIDER,
  inspectSymbol,
};
