import "server-only";

import { unzipSync } from "fflate";

const DOCUMENT_ENDPOINT = "https://opendart.fss.or.kr/api/document.xml";
const REQUEST_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 750;
const MAX_REQUEST_ATTEMPTS = 2;
const DOCUMENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ARCHIVE_BYTES = 20 * 1024 * 1024;
const MAX_TEXT_FILE_BYTES = 12 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 36 * 1024 * 1024;
const MAX_TEXT_FILES = 20;
const MAX_PLAIN_TEXT_CHARACTERS = 2_000_000;

export type OpenDartDocumentStatus =
  | "success"
  | "not_configured"
  | "not_found"
  | "rate_limited"
  | "auth_error"
  | "unavailable";

export interface OpenDartDocument {
  fileNames: string[];
  plainText: string;
  receiptNo: string;
}

export interface OpenDartDocumentResult {
  document: OpenDartDocument | null;
  message: string;
  status: OpenDartDocumentStatus;
}

type TimedDocument = {
  expiresAt: number;
  value: OpenDartDocumentResult;
};

type DocumentCache = {
  documents: Map<string, TimedDocument>;
  pending: Map<string, Promise<OpenDartDocumentResult>>;
};

const globalWithDocumentCache = globalThis as typeof globalThis & {
  __stockTraceOpenDartDocumentCache?: DocumentCache;
};

const cache: DocumentCache =
  globalWithDocumentCache.__stockTraceOpenDartDocumentCache ??
  (globalWithDocumentCache.__stockTraceOpenDartDocumentCache = {
    documents: new Map(),
    pending: new Map(),
  });

class OpenDartDocumentError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "OpenDartDocumentError";
  }
}

function readXmlTag(xml: string, tagName: string): string {
  const match = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i").exec(xml);
  return match?.[1]?.replace(/^<!\[CDATA\[|\]\]>$/g, "").trim() ?? "";
}

async function readLimitedBody(response: Response): Promise<Uint8Array> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_ARCHIVE_BYTES) {
    throw new OpenDartDocumentError(
      "archive_too_large",
      "OpenDART document archive exceeded the allowed size",
    );
  }

  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_ARCHIVE_BYTES) {
      throw new OpenDartDocumentError(
        "archive_too_large",
        "OpenDART document archive exceeded the allowed size",
      );
    }
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_ARCHIVE_BYTES) {
      await reader.cancel();
      throw new OpenDartDocumentError(
        "archive_too_large",
        "OpenDART document archive exceeded the allowed size",
      );
    }
    chunks.push(value);
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function hasSafeTextFileName(fileName: string): boolean {
  if (!fileName || fileName.includes("\0") || /^[\\/]/.test(fileName)) return false;
  if (/^[a-z]:[\\/]/i.test(fileName)) return false;
  const parts = fileName.replaceAll("\\", "/").split("/");
  if (parts.some((part) => part === "..")) return false;
  return /\.(?:xml|html?|txt)$/i.test(fileName);
}

function detectEncoding(bytes: Uint8Array): "euc-kr" | "utf-8" {
  const header = new TextDecoder("windows-1252").decode(bytes.subarray(0, 8192));
  const declared = /(?:charset\s*=\s*["']?|encoding\s*=\s*["'])([^\s"';>]+)/i.exec(
    header,
  )?.[1]?.toLowerCase();
  return declared && /^(?:euc-kr|ks_c_5601-1987|cp949|ms949)$/.test(declared)
    ? "euc-kr"
    : "utf-8";
}

function decodeTextFile(bytes: Uint8Array): string {
  // Some DART documents declare EUC-KR while their actual bytes are UTF-8.
  // Prefer a strictly valid UTF-8 decode, then use the declared legacy encoding.
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder(detectEncoding(bytes), { fatal: false }).decode(bytes);
  }
}

function decodeEntities(value: string): string {
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
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&amp;/gi, "&");
}

export function extractReadableDisclosureText(markup: string): string {
  const withoutExecutableMarkup = markup
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<\?(?:xml|[\s\S]*?)\?>/gi, " ")
    .replace(/<(script|style|noscript|template|head)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");

  const withTableBoundaries = withoutExecutableMarkup
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/?(?:p|div|section|article|header|footer|table|tbody|thead|tfoot|tr|li|ul|ol|h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<\/?(?:td|th)\b[^>]*>/gi, "\t")
    .replace(/<[^>]+>/g, " ");

  const lines = decodeEntities(withTableBoundaries)
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t\u00a0 ]+/g, " ").trim())
    .filter(Boolean);

  const normalizedLines: string[] = [];
  let previous = "";
  for (const line of lines) {
    if (line === previous) continue;
    normalizedLines.push(line);
    previous = line;
  }
  return normalizedLines.join("\n").slice(0, MAX_PLAIN_TEXT_CHARACTERS);
}

function extractDocumentFromZip(archive: Uint8Array, receiptNo: string): OpenDartDocument {
  let selectedFiles = 0;
  let declaredUncompressedBytes = 0;
  let entries: Record<string, Uint8Array>;

  try {
    entries = unzipSync(archive, {
      filter: (file) => {
        if (!hasSafeTextFileName(file.name)) return false;
        if (file.originalSize <= 0 || file.originalSize > MAX_TEXT_FILE_BYTES) return false;
        if (selectedFiles >= MAX_TEXT_FILES) return false;
        if (declaredUncompressedBytes + file.originalSize > MAX_UNCOMPRESSED_BYTES) return false;
        selectedFiles += 1;
        declaredUncompressedBytes += file.originalSize;
        return true;
      },
    });
  } catch {
    throw new OpenDartDocumentError(
      "invalid_archive",
      "OpenDART document archive could not be decompressed safely",
    );
  }

  const fileNames: string[] = [];
  const documents: string[] = [];
  let actualUncompressedBytes = 0;
  for (const [fileName, bytes] of Object.entries(entries)) {
    actualUncompressedBytes += bytes.byteLength;
    if (actualUncompressedBytes > MAX_UNCOMPRESSED_BYTES) {
      throw new OpenDartDocumentError(
        "archive_too_large",
        "OpenDART document archive exceeded the decompression limit",
      );
    }
    const readableText = extractReadableDisclosureText(decodeTextFile(bytes));
    if (readableText.length < 20) continue;
    fileNames.push(fileName);
    documents.push(readableText);
  }

  const plainText = documents.join("\n\n").slice(0, MAX_PLAIN_TEXT_CHARACTERS);
  if (!plainText || fileNames.length === 0) {
    throw new OpenDartDocumentError(
      "no_readable_document",
      "OpenDART archive did not contain readable disclosure text",
    );
  }
  return { fileNames, plainText, receiptNo };
}

function mapDocumentError(error: unknown): OpenDartDocumentResult {
  const code = error instanceof OpenDartDocumentError ? error.code : "unknown";
  const status: OpenDartDocumentStatus =
    code === "020"
      ? "rate_limited"
      : ["010", "011", "012", "901"].includes(code)
        ? "auth_error"
        : ["013", "014"].includes(code)
          ? "not_found"
          : "unavailable";
  const message =
    status === "rate_limited"
      ? "공식자료 조회 요청이 많습니다. 잠시 후 다시 시도해주세요."
      : status === "auth_error"
        ? "OpenDART 연결 설정을 확인해주세요."
        : status === "not_found"
          ? "공시 원문을 찾지 못했습니다."
          : "현재 공식자료 원문을 불러오지 못했습니다.";

  console.error("[StockTrace] OpenDART document lookup failed", {
    code,
    httpStatus: error instanceof OpenDartDocumentError ? error.httpStatus : undefined,
    message: error instanceof Error ? error.message : "UnknownError",
  });
  return { document: null, message, status };
}

function isTransientDocumentError(error: unknown): boolean {
  if (!(error instanceof OpenDartDocumentError)) return false;
  if (
    error.code === "timeout" ||
    error.code === "network_error" ||
    error.code === "invalid_document_response" ||
    error.code === "020" ||
    error.code === "800"
  ) {
    return true;
  }
  return (
    error.httpStatus === 408 ||
    error.httpStatus === 429 ||
    (error.httpStatus !== undefined && error.httpStatus >= 500 && error.httpStatus <= 599)
  );
}

function waitBeforeRetry(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
}

async function requestOpenDartDocument(
  apiKey: string,
  receiptNo: string,
): Promise<OpenDartDocumentResult> {
  const url = new URL(DOCUMENT_ENDPOINT);
  url.searchParams.set("crtfc_key", apiKey);
  url.searchParams.set("rcept_no", receiptNo);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/zip, application/octet-stream" },
      redirect: "manual",
      signal: controller.signal,
    });
    if (response.status >= 300 && response.status < 400) {
      throw new OpenDartDocumentError(
        "service_redirect",
        "OpenDART redirected the document request",
        response.status,
      );
    }
    if (!response.ok) {
      throw new OpenDartDocumentError(
        `http_${response.status}`,
        `OpenDART returned HTTP ${response.status}`,
        response.status,
      );
    }

    const archive = await readLimitedBody(response);
    if (archive[0] !== 0x50 || archive[1] !== 0x4b) {
      const errorText = new TextDecoder("utf-8", { fatal: false }).decode(archive);
      const code = readXmlTag(errorText, "status") || "invalid_document_response";
      const message = readXmlTag(errorText, "message") || "OpenDART did not return a ZIP archive";
      throw new OpenDartDocumentError(code, message);
    }

    return {
      document: extractDocumentFromZip(archive, receiptNo),
      message: "OpenDART 실제 공시 원문을 불러왔습니다.",
      status: "success",
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new OpenDartDocumentError("timeout", "Request timed out");
    }
    if (error instanceof OpenDartDocumentError) throw error;
    throw new OpenDartDocumentError(
      "network_error",
      error instanceof Error ? error.message : "OpenDART network request failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadOpenDartDocument(
  apiKey: string,
  receiptNo: string,
): Promise<OpenDartDocumentResult> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_REQUEST_ATTEMPTS; attempt += 1) {
    try {
      return await requestOpenDartDocument(apiKey, receiptNo);
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_REQUEST_ATTEMPTS || !isTransientDocumentError(error)) {
        return mapDocumentError(error);
      }
      console.warn("[StockTrace] Retrying transient OpenDART document request", {
        attempt: attempt + 1,
        code: error instanceof OpenDartDocumentError ? error.code : undefined,
        httpStatus: error instanceof OpenDartDocumentError ? error.httpStatus : undefined,
      });
      await waitBeforeRetry();
    }
  }
  return mapDocumentError(lastError);
}

export async function getOpenDartDocument(
  receiptNo: string,
): Promise<OpenDartDocumentResult> {
  if (!/^\d{14}$/.test(receiptNo)) {
    return {
      document: null,
      message: "유효한 공시 접수번호가 아닙니다.",
      status: "not_found",
    };
  }

  const apiKey = process.env.DART_API_KEY?.trim();
  if (!apiKey) {
    return {
      document: null,
      message: "OpenDART 인증키가 없어 공시 원문을 조회하지 않았습니다.",
      status: "not_configured",
    };
  }

  const now = Date.now();
  const cached = cache.documents.get(receiptNo);
  if (cached && cached.expiresAt > now) return cached.value;
  const pending = cache.pending.get(receiptNo);
  if (pending) return pending;

  const request = downloadOpenDartDocument(apiKey, receiptNo)
    .then((result) => {
      if (result.status === "success") {
        cache.documents.set(receiptNo, {
          expiresAt: Date.now() + DOCUMENT_CACHE_TTL_MS,
          value: result,
        });
        while (cache.documents.size > 60) {
          const oldestKey = cache.documents.keys().next().value;
          if (typeof oldestKey !== "string") break;
          cache.documents.delete(oldestKey);
        }
      }
      return result;
    })
    .finally(() => {
      if (cache.pending.get(receiptNo) === request) cache.pending.delete(receiptNo);
    });
  cache.pending.set(receiptNo, request);
  return request;
}
