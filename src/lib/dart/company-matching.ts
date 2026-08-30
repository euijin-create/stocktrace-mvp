import type { OpenDartCorporation } from "@/lib/dart/types";

export type OpenDartCorporationIndex = Map<string, OpenDartCorporation[]>;

export function normalizeOpenDartCompanyName(companyName: string): string {
  return companyName
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/^(?:(?:주식회사)|(?:\(주\)))+/gi, "")
    .replace(/(?:(?:주식회사)|(?:\(주\)))+$/gi, "")
    .trim()
    .toLocaleLowerCase("ko-KR");
}

export function isOpenDartPlaceholderCompanyName(companyName: string): boolean {
  const normalized = companyName.normalize("NFKC").replace(/\s+/g, "").trim();
  return (
    /^[A-Z]사$/i.test(normalized) ||
    /^[가나다라마바사아자차카타파하]사$/.test(normalized) ||
    /^(?:회사명미상|종목확인필요|기업확인필요|해당기업|해당회사)$/.test(normalized)
  );
}

export function buildOpenDartCorporationIndex(
  corporations: OpenDartCorporation[],
): OpenDartCorporationIndex {
  const index: OpenDartCorporationIndex = new Map();
  for (const corporation of corporations) {
    const normalizedName = normalizeOpenDartCompanyName(corporation.corpName);
    if (!normalizedName) continue;
    const matches = index.get(normalizedName) ?? [];
    matches.push(corporation);
    index.set(normalizedName, matches);
  }
  return index;
}

export function findExactOpenDartCorporationInIndex(
  index: OpenDartCorporationIndex,
  companyNames: string[],
): OpenDartCorporation | null {
  const normalizedNames = Array.from(
    new Set(
      companyNames
        .map((name) => name.trim())
        .filter((name) => name && !isOpenDartPlaceholderCompanyName(name))
        .map(normalizeOpenDartCompanyName)
        .filter(Boolean),
    ),
  );
  const matches = new Map<string, OpenDartCorporation>();

  for (const normalizedName of normalizedNames) {
    for (const corporation of index.get(normalizedName) ?? []) {
      matches.set(corporation.corpCode, corporation);
    }
  }

  return matches.size === 1 ? Array.from(matches.values())[0] : null;
}

export function findExactOpenDartCorporation(
  corporations: OpenDartCorporation[],
  companyNames: string[],
): OpenDartCorporation | null {
  return findExactOpenDartCorporationInIndex(
    buildOpenDartCorporationIndex(corporations),
    companyNames,
  );
}
