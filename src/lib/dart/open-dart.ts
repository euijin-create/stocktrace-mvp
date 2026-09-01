import "server-only";

import { unzipSync } from "fflate";
import {
  buildOpenDartCorporationIndex,
  findExactOpenDartCorporationInIndex,
  isOpenDartPlaceholderCompanyName,
  type OpenDartCorporationIndex,
} from "@/lib/dart/company-matching";
import type {
  OpenDartCorporation,
  OpenDartCorporationLookupResult,
  OpenDartDisclosure,
  OpenDartLookupResult,
} from "@/lib/dart/types";

const CORP_CODE_ENDPOINT = "https://opendart.fss.or.kr/api/corpCode.xml";
const DISCLOSURE_LIST_ENDPOINT = "https://opendart.fss.or.kr/api/list.json";
const DART_DOCUMENT_ENDPOINT = "https://dart.fss.or.kr/dsaf001/main.do";

const CORP_CODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DISCLOSURE_CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_CORP_CODE_ARCHIVE_BYTES = 30 * 1024 * 1024;
const MAX_CORP_CODE_XML_BYTES = 100 * 1024 * 1024;
const DEFAULT_DISCLOSURE_COUNT = 6;
const MAX_DISCLOSURE_COUNT = 40;

type CorporationIndex = {
  byNormalizedName: OpenDartCorporationIndex;
};

type TimedCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type OpenDartCacheState = {
  corporationIndex?: TimedCacheEntry<CorporationIndex>;
  corporationIndexPromise?: Promise<CorporationIndex>;
  disclosurePromises: Map<string, Promise<OpenDartDisclosure[]>>;
  disclosures: Map<string, TimedCacheEntry<OpenDartDisclosure[]>>;
};

const globalWithOpenDartCache = globalThis as typeof globalThis & {
  __stockTraceOpenDartCache?: OpenDartCacheState;
};

const cacheState: OpenDartCacheState =
  globalWithOpenDartCache.__stockTraceOpenDartCache ??
  (globalWithOpenDartCache.__stockTraceOpenDartCache = {
    disclosurePromises: new Map(),
    disclosures: new Map(),
  });

class OpenDartError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly endpoint: "corpCode" | "list",
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "OpenDartError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (entity, hex: string) => {
      const codePoint = Number.parseInt(hex, 16);
      try {
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
      } catch {
        return entity;
      }
    })
    .replace(/&#(\d+);/g, (entity, decimal: string) => {
      const codePoint = Number.parseInt(decimal, 10);
      try {
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
      } catch {
        return entity;
      }
    })
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function readXmlTag(xml: string, tagName: string): string {
  const match = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i").exec(xml);
  if (!match) return "";
  const rawValue = match[1].trim();
  const cdataMatch = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(rawValue);
  return decodeXmlEntities((cdataMatch?.[1] ?? rawValue).trim());
}

export function parseOpenDartCorpCodeXml(xml: string): OpenDartCorporation[] {
  const corporations: OpenDartCorporation[] = [];
  const listPattern = /<list>([\s\S]*?)<\/list>/gi;
  let match: RegExpExecArray | null;

  while ((match = listPattern.exec(xml)) !== null) {
    const corpCode = readXmlTag(match[1], "corp_code");
    const corpName = readXmlTag(match[1], "corp_name");
    const stockCodeValue = readXmlTag(match[1], "stock_code");
    if (!/^\d{8}$/.test(corpCode) || !corpName) continue;

    corporations.push({
      corpCode,
      corpName,
      stockCode: /^\d{6}$/.test(stockCodeValue) ? stockCodeValue : null,
    });
  }

  if (corporations.length === 0) {
    throw new OpenDartError(
      "invalid_corp_code_xml",
      "OpenDART corporation archive did not contain valid companies",
      "corpCode",
    );
  }

  return corporations;
}

function extractCorpCodeXml(archive: Uint8Array): string {
  let entries: Record<string, Uint8Array>;
  let selectedXml = false;
  try {
    entries = unzipSync(archive, {
      filter: (file) => {
        const selected =
          !selectedXml &&
          file.name.toLocaleLowerCase("en-US").endsWith(".xml") &&
          file.originalSize <= MAX_CORP_CODE_XML_BYTES;
        if (selected) selectedXml = true;
        return selected;
      },
    });
  } catch {
    throw new OpenDartError(
      "invalid_corp_code_archive",
      "OpenDART corporation archive could not be decompressed",
      "corpCode",
    );
  }

  const xmlEntry = Object.entries(entries).find(([fileName]) =>
    fileName.toLocaleLowerCase("en-US").endsWith(".xml"),
  );
  if (!xmlEntry || xmlEntry[1].byteLength > MAX_CORP_CODE_XML_BYTES) {
    throw new OpenDartError(
      "invalid_corp_code_archive",
      "OpenDART corporation archive did not contain a usable XML file",
      "corpCode",
    );
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(xmlEntry[1]);
}

function buildCorporationIndex(corporations: OpenDartCorporation[]): CorporationIndex {
  return { byNormalizedName: buildOpenDartCorporationIndex(corporations) };
}

function findExactCorporationFromIndex(
  index: CorporationIndex,
  companyNames: string[],
): OpenDartCorporation | null {
  return findExactOpenDartCorporationInIndex(index.byNormalizedName, companyNames);
}

function getOpenDartApiKey(): string | null {
  return process.env.DART_API_KEY?.trim() || null;
}

async function fetchOpenDart(
  url: URL,
  endpoint: OpenDartError["endpoint"],
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: endpoint === "list" ? "application/json" : "application/zip" },
      redirect: "manual",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new OpenDartError(
        `http_${response.status}`,
        `OpenDART returned HTTP ${response.status}`,
        endpoint,
        response.status,
      );
    }
    return response;
  } catch (error) {
    if (error instanceof OpenDartError) throw error;
    throw new OpenDartError(
      controller.signal.aborted ? "timeout" : "network_error",
      controller.signal.aborted
        ? "OpenDART request timed out"
        : "OpenDART network request failed",
      endpoint,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function throwOpenDartXmlError(xml: string, endpoint: OpenDartError["endpoint"]): never {
  const status = readXmlTag(xml, "status") || "invalid_response";
  const message = readXmlTag(xml, "message") || "OpenDART returned an invalid response";
  throw new OpenDartError(status, message, endpoint);
}

async function downloadCorporationIndex(apiKey: string): Promise<CorporationIndex> {
  const url = new URL(CORP_CODE_ENDPOINT);
  url.searchParams.set("crtfc_key", apiKey);
  const response = await fetchOpenDart(url, "corpCode");
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_CORP_CODE_ARCHIVE_BYTES) {
    throw new OpenDartError(
      "corp_code_archive_too_large",
      "OpenDART corporation archive exceeded the allowed size",
      "corpCode",
    );
  }

  const archive = new Uint8Array(await response.arrayBuffer());
  if (archive.byteLength > MAX_CORP_CODE_ARCHIVE_BYTES) {
    throw new OpenDartError(
      "corp_code_archive_too_large",
      "OpenDART corporation archive exceeded the allowed size",
      "corpCode",
    );
  }

  const isZip = archive[0] === 0x50 && archive[1] === 0x4b;
  if (!isZip) {
    throwOpenDartXmlError(new TextDecoder("utf-8").decode(archive), "corpCode");
  }

  return buildCorporationIndex(parseOpenDartCorpCodeXml(extractCorpCodeXml(archive)));
}

async function getCorporationIndex(apiKey: string): Promise<CorporationIndex> {
  const now = Date.now();
  if (cacheState.corporationIndex && cacheState.corporationIndex.expiresAt > now) {
    return cacheState.corporationIndex.value;
  }
  if (cacheState.corporationIndexPromise) return cacheState.corporationIndexPromise;

  const request = downloadCorporationIndex(apiKey)
    .then((value) => {
      cacheState.corporationIndex = {
        expiresAt: Date.now() + CORP_CODE_CACHE_TTL_MS,
        value,
      };
      return value;
    })
    .finally(() => {
      if (cacheState.corporationIndexPromise === request) {
        cacheState.corporationIndexPromise = undefined;
      }
    });
  cacheState.corporationIndexPromise = request;
  return request;
}

function formatDartDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}${read("month")}${read("day")}`;
}

function getSearchRange(asOfDate?: Date | string): { from: string; to: string } {
  const parsedDate = asOfDate instanceof Date ? new Date(asOfDate) : new Date(asOfDate ?? Date.now());
  const endDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const startDate = new Date(endDate);
  startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
  return { from: formatDartDate(startDate), to: formatDartDate(endDate) };
}

export function buildOpenDartDocumentUrl(receiptNo: string): string | null {
  if (!/^\d{14}$/.test(receiptNo)) return null;
  const url = new URL(DART_DOCUMENT_ENDPOINT);
  url.searchParams.set("rcpNo", receiptNo);
  return url.toString();
}

function readDisclosure(value: unknown): OpenDartDisclosure | null {
  if (!isRecord(value)) return null;
  const corpCode = readText(value.corp_code);
  const corpName = readText(value.corp_name);
  const stockCodeValue = readText(value.stock_code);
  const reportName = readText(value.report_nm);
  const receiptNo = readText(value.rcept_no);
  const receiptDate = readText(value.rcept_dt);
  const filerName = readText(value.flr_nm);
  if (!/^\d{8}$/.test(corpCode) || !corpName || !reportName || !/^\d{8}$/.test(receiptDate)) {
    return null;
  }

  return {
    corpCode,
    corpName,
    filerName: filerName || "제출인 미확인",
    originalUrl: buildOpenDartDocumentUrl(receiptNo),
    receiptDate,
    receiptNo,
    remarks: readText(value.rm),
    reportName,
    stockCode: /^\d{6}$/.test(stockCodeValue) ? stockCodeValue : null,
  };
}

async function downloadDisclosures(
  apiKey: string,
  corporation: OpenDartCorporation,
  searchRange: { from: string; to: string },
  limit: number,
): Promise<OpenDartDisclosure[]> {
  const url = new URL(DISCLOSURE_LIST_ENDPOINT);
  url.searchParams.set("crtfc_key", apiKey);
  url.searchParams.set("corp_code", corporation.corpCode);
  url.searchParams.set("bgn_de", searchRange.from);
  url.searchParams.set("end_de", searchRange.to);
  url.searchParams.set("sort", "date");
  url.searchParams.set("sort_mth", "desc");
  url.searchParams.set("page_no", "1");
  url.searchParams.set("page_count", String(limit));
  url.searchParams.set("last_reprt_at", "N");

  const response = await fetchOpenDart(url, "list");
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new OpenDartError(
      "invalid_json",
      "OpenDART returned invalid disclosure JSON",
      "list",
    );
  }
  if (!isRecord(payload)) {
    throw new OpenDartError(
      "invalid_response",
      "OpenDART returned an invalid disclosure response",
      "list",
    );
  }

  const status = readText(payload.status);
  if (status === "013") return [];
  if (status !== "000") {
    throw new OpenDartError(
      status || "invalid_response",
      readText(payload.message) || "OpenDART disclosure lookup failed",
      "list",
    );
  }

  return Array.isArray(payload.list)
    ? payload.list
        .map(readDisclosure)
        .filter((disclosure): disclosure is OpenDartDisclosure => disclosure !== null)
        .slice(0, limit)
    : [];
}

async function getDisclosures(
  apiKey: string,
  corporation: OpenDartCorporation,
  searchRange: { from: string; to: string },
  limit: number,
): Promise<OpenDartDisclosure[]> {
  const cacheKey = `${corporation.corpCode}:${searchRange.from}:${searchRange.to}:${limit}`;
  const now = Date.now();
  const cached = cacheState.disclosures.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.value;
  const pending = cacheState.disclosurePromises.get(cacheKey);
  if (pending) return pending;

  const request = downloadDisclosures(apiKey, corporation, searchRange, limit)
    .then((value) => {
      cacheState.disclosures.set(cacheKey, {
        expiresAt: Date.now() + DISCLOSURE_CACHE_TTL_MS,
        value,
      });
      while (cacheState.disclosures.size > 100) {
        const oldestKey = cacheState.disclosures.keys().next().value;
        if (typeof oldestKey !== "string") break;
        cacheState.disclosures.delete(oldestKey);
      }
      return value;
    })
    .finally(() => {
      if (cacheState.disclosurePromises.get(cacheKey) === request) {
        cacheState.disclosurePromises.delete(cacheKey);
      }
    });
  cacheState.disclosurePromises.set(cacheKey, request);
  return request;
}

function logOpenDartError(error: unknown): void {
  if (error instanceof OpenDartError) {
    console.error("[StockTrace] OpenDART lookup failed", {
      code: error.code,
      endpoint: error.endpoint,
      httpStatus: error.httpStatus,
      message: error.message,
    });
    return;
  }
  console.error("[StockTrace] OpenDART lookup failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
}

function errorResult(
  error: unknown,
  requestedName: string,
  searchRange: { from: string; to: string } | null,
  company: OpenDartCorporation | null,
): OpenDartLookupResult {
  logOpenDartError(error);
  const code = error instanceof OpenDartError ? error.code : "unknown";
  if (code === "020") {
    return {
      company,
      disclosures: [],
      message: "공식자료 조회 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
      requestedName,
      searchRange,
      status: "rate_limited",
    };
  }
  if (["010", "011", "012", "901"].includes(code)) {
    return {
      company,
      disclosures: [],
      message: "OpenDART 연결 설정을 확인해 주세요.",
      requestedName,
      searchRange,
      status: "auth_error",
    };
  }
  if (code === "800") {
    return {
      company,
      disclosures: [],
      message: "OpenDART 시스템 점검 중입니다. 잠시 후 다시 시도해 주세요.",
      requestedName,
      searchRange,
      status: "unavailable",
    };
  }
  return {
    company,
    disclosures: [],
    message: "공식자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    requestedName,
    searchRange,
    status: "unavailable",
  };
}

function corporationErrorResult(
  error: unknown,
  requestedName: string,
): OpenDartCorporationLookupResult {
  logOpenDartError(error);
  const code = error instanceof OpenDartError ? error.code : "unknown";

  if (code === "020") {
    return {
      company: null,
      message: "기업 조회 요청이 많습니다. 잠시 후 다시 시도해주세요.",
      requestedName,
      status: "rate_limited",
    };
  }

  if (["010", "011", "012", "901"].includes(code)) {
    return {
      company: null,
      message: "OpenDART 연결 설정을 확인해주세요.",
      requestedName,
      status: "auth_error",
    };
  }

  return {
    company: null,
    message: "기업 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    requestedName,
    status: "unavailable",
  };
}

export async function lookupOpenDartCorporation({
  companyNames,
}: {
  companyNames: Array<string | null | undefined>;
}): Promise<OpenDartCorporationLookupResult> {
  const candidates = companyNames
    .map((name) => name?.trim() ?? "")
    .filter(Boolean);
  const requestedName = candidates[0] ?? null;
  const identifiableNames = candidates.filter(
    (name) => !isOpenDartPlaceholderCompanyName(name),
  );

  if (!requestedName || identifiableNames.length === 0) {
    return {
      company: null,
      message: "기업을 정확하게 식별하지 못했습니다.",
      requestedName,
      status: "company_not_found",
    };
  }

  const apiKey = getOpenDartApiKey();
  if (!apiKey) {
    return {
      company: null,
      message: "OpenDART 인증키가 없어 실제 기업 정보를 조회할 수 없습니다.",
      requestedName,
      status: "not_configured",
    };
  }

  try {
    const index = await getCorporationIndex(apiKey);
    const company = findExactCorporationFromIndex(index, identifiableNames);

    if (!company) {
      return {
        company: null,
        message: "기업을 정확하게 식별하지 못했습니다.",
        requestedName,
        status: "company_not_found",
      };
    }

    if (!company.stockCode) {
      return {
        company,
        message: "해당 기업의 상장 종목코드를 확인하지 못했습니다.",
        requestedName,
        status: "stock_code_not_found",
      };
    }

    return {
      company,
      message: "OpenDART에서 실제 기업과 상장 종목코드를 확인했습니다.",
      requestedName,
      status: "success",
    };
  } catch (error) {
    return corporationErrorResult(error, requestedName);
  }
}

export async function lookupOpenDartDisclosures({
  asOfDate,
  companyNames,
  limit = DEFAULT_DISCLOSURE_COUNT,
}: {
  asOfDate?: Date | string;
  companyNames: Array<string | null | undefined>;
  limit?: number;
}): Promise<OpenDartLookupResult> {
  const candidates = companyNames
    .map((name) => name?.trim() ?? "")
    .filter(Boolean);
  const requestedName = candidates[0] ?? null;
  if (!requestedName || candidates.every(isOpenDartPlaceholderCompanyName)) {
    return {
      company: null,
      disclosures: [],
      message: "기업을 정확하게 식별하지 못했습니다.",
      requestedName,
      searchRange: null,
      status: "company_not_found",
    };
  }

  const apiKey = getOpenDartApiKey();
  if (!apiKey) {
    return {
      company: null,
      disclosures: [],
      message: "OpenDART 인증키가 없어 현재는 데모 공시 데이터를 표시합니다.",
      requestedName,
      searchRange: null,
      status: "not_configured",
    };
  }

  let corporation: OpenDartCorporation | null = null;
  let searchRange: { from: string; to: string } | null = null;
  try {
    const index = await getCorporationIndex(apiKey);
    corporation = findExactCorporationFromIndex(index, candidates);
    if (!corporation) {
      return {
        company: null,
        disclosures: [],
        message: "기업을 정확하게 식별하지 못했습니다.",
        requestedName,
        searchRange: null,
        status: "company_not_found",
      };
    }

    searchRange = getSearchRange(asOfDate);
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), MAX_DISCLOSURE_COUNT);
    const disclosures = await getDisclosures(apiKey, corporation, searchRange, safeLimit);
    if (disclosures.length === 0) {
      return {
        company: corporation,
        disclosures: [],
        message: "최근 검색 범위에서 관련 공시를 찾지 못했습니다.",
        requestedName,
        searchRange,
        status: "no_disclosures",
      };
    }

    return {
      company: corporation,
      disclosures,
      message: "OpenDART에서 실제 기업과 최근 공시 목록을 조회했습니다.",
      requestedName,
      searchRange,
      status: "success",
    };
  } catch (error) {
    return errorResult(error, requestedName, searchRange, corporation);
  }
}
