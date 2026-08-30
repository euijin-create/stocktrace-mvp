import type { OpenDartDisclosure } from "@/lib/dart/types";
import type { VerificationEvidenceDocument } from "@/lib/fact-check/types";

const MAX_CANDIDATES = 5;
const MAX_EXCERPTS_PER_DOCUMENT = 4;
const MAX_EXCERPT_CHARACTERS = 2_200;
const MAX_TOTAL_EXCERPT_CHARACTERS = 16_000;

type RelevanceConcept = {
  evidenceTerms: string[];
  reportTerms: string[];
  triggers: RegExp;
};

const CONCEPTS: RelevanceConcept[] = [
  {
    triggers: /(공급\s*계약|계약\s*체결|단일\s*판매|수주|계약금액|계약기간)/,
    reportTerms: ["단일판매", "공급계약", "계약체결", "수주"],
    evidenceTerms: ["단일판매", "공급계약", "계약체결", "계약금액", "계약기간", "판매공급계약"],
  },
  {
    triggers: /(매출|영업이익|당기순이익|순이익|실적|흑자|적자)/,
    reportTerms: ["잠정실적", "손익구조", "사업보고서", "분기보고서", "반기보고서"],
    evidenceTerms: ["매출액", "영업이익", "당기순이익", "손익구조", "실적"],
  },
  {
    triggers: /(시설투자|신규투자|투자금액|공장\s*투자|설비\s*투자)/,
    reportTerms: ["신규시설투자", "시설투자", "투자판단"],
    evidenceTerms: ["신규시설투자", "투자금액", "투자기간", "투자목적"],
  },
  {
    triggers: /(인수|합병|분할|타법인|지분\s*취득|주식\s*취득)/,
    reportTerms: ["타법인주식", "주식취득", "회사합병", "회사분할", "영업양수"],
    evidenceTerms: ["취득금액", "취득목적", "합병", "분할", "영업양수", "타법인주식"],
  },
  {
    triggers: /(배당|현금배당|주식배당)/,
    reportTerms: ["현금현물배당", "주식배당", "배당결정"],
    evidenceTerms: ["배당금", "배당기준일", "배당률", "현금배당", "주식배당"],
  },
  {
    triggers: /(유상증자|무상증자|전환사채|신주인수권)/,
    reportTerms: ["유상증자", "무상증자", "전환사채", "신주인수권"],
    evidenceTerms: ["증자", "발행금액", "발행가액", "전환사채", "신주인수권"],
  },
  {
    triggers: /(정부\s*사업|국책\s*사업|사업\s*선정|과제\s*선정)/,
    reportTerms: ["투자판단", "기타경영사항", "주요사항보고서"],
    evidenceTerms: ["정부", "국책", "사업선정", "과제", "협약"],
  },
];

const STOP_WORDS = new Set([
  "그리고",
  "그러나",
  "그래서",
  "규모의",
  "대해서",
  "했다",
  "한다",
  "있다",
  "라는",
  "해당",
  "회사",
  "기업",
]);

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/[\s,_·ㆍ()[\]{}'"`]/g, "");
}

function statementTokens(statement: string): string[] {
  const tokens = statement
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .match(/[가-힣a-z]+|\d+(?:\.\d+)?/g);
  return [...new Set((tokens ?? []).filter((token) => token.length >= 2 && !STOP_WORDS.has(token)))];
}

function activeConcepts(statement: string): RelevanceConcept[] {
  return CONCEPTS.filter((concept) => concept.triggers.test(statement));
}

function scoreDisclosure(
  statement: string,
  disclosure: OpenDartDisclosure,
): number {
  const normalizedReport = normalize(disclosure.reportName);
  const concepts = activeConcepts(statement);
  let score = 0;

  for (const concept of concepts) {
    for (const term of concept.reportTerms) {
      if (normalizedReport.includes(normalize(term))) score += 12;
    }
  }
  for (const token of statementTokens(statement)) {
    if (token.length >= 3 && normalizedReport.includes(normalize(token))) score += 4;
  }
  if (/기재정정|첨부정정/.test(disclosure.reportName)) score += 1;
  if (disclosure.remarks.includes("철")) score -= 30;
  return score;
}

export function selectRelevantDisclosures(
  statement: string,
  disclosures: OpenDartDisclosure[],
): OpenDartDisclosure[] {
  if (statement.length < 2 || activeConcepts(statement).length === 0) return [];
  return disclosures
    .map((disclosure, index) => ({ disclosure, index, score: scoreDisclosure(statement, disclosure) }))
    .filter(({ score }) => score >= 8)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, MAX_CANDIDATES)
    .map(({ disclosure }) => disclosure);
}

function splitLongLines(text: string): string[] {
  const result: string[] = [];
  for (const sourceLine of text.split("\n")) {
    const line = sourceLine.trim();
    if (!line) continue;
    if (line.length <= 1_400) {
      result.push(line);
      continue;
    }
    for (let start = 0; start < line.length; start += 1_200) {
      result.push(line.slice(start, start + 1_400));
    }
  }
  return result;
}

function buildEvidenceTerms(statement: string): string[] {
  const concepts = activeConcepts(statement);
  const conceptTerms = concepts.flatMap((concept) => concept.evidenceTerms);
  return [...new Set([...statementTokens(statement), ...conceptTerms].map(normalize).filter(Boolean))];
}

function scoreLine(line: string, terms: string[], numberTokens: string[]): number {
  const normalizedLine = normalize(line);
  let score = 0;
  for (const term of terms) {
    if (term.length >= 2 && normalizedLine.includes(term)) score += 2;
  }
  for (const number of numberTokens) {
    if (normalizedLine.includes(number)) score += 7;
  }
  return score;
}

export function extractRelevantExcerpts(
  statement: string,
  plainText: string,
): string[] {
  const lines = splitLongLines(plainText);
  const terms = buildEvidenceTerms(statement);
  const numbers = statement
    .normalize("NFKC")
    .replaceAll(",", "")
    .match(/\d+(?:\.\d+)?/g) ?? [];
  if (lines.length === 0 || terms.length === 0) return [];

  const candidates = lines
    .map((line, index) => ({ index, score: scoreLine(line, terms, numbers) }))
    .filter(({ score }) => score >= 2)
    .sort((left, right) => right.score - left.score || left.index - right.index);

  const excerpts: string[] = [];
  const usedCenters: number[] = [];
  for (const candidate of candidates) {
    if (usedCenters.some((center) => Math.abs(center - candidate.index) <= 2)) continue;
    const from = Math.max(0, candidate.index - 2);
    const to = Math.min(lines.length, candidate.index + 4);
    const excerpt = lines.slice(from, to).join("\n").slice(0, MAX_EXCERPT_CHARACTERS).trim();
    if (excerpt.length < 20 || excerpts.includes(excerpt)) continue;
    excerpts.push(excerpt);
    usedCenters.push(candidate.index);
    if (excerpts.length >= MAX_EXCERPTS_PER_DOCUMENT) break;
  }
  return excerpts;
}

export function limitEvidenceDocuments(
  documents: VerificationEvidenceDocument[],
): VerificationEvidenceDocument[] {
  let remaining = MAX_TOTAL_EXCERPT_CHARACTERS;
  const result: VerificationEvidenceDocument[] = [];
  for (const document of documents) {
    const excerpts: string[] = [];
    for (const excerpt of document.excerpts) {
      if (remaining < 20) break;
      const limited = excerpt.slice(0, remaining);
      if (limited.length < 20) break;
      excerpts.push(limited);
      remaining -= limited.length;
    }
    if (excerpts.length > 0) result.push({ ...document, excerpts });
    if (remaining < 20) break;
  }
  return result;
}
