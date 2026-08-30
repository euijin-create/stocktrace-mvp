import { Database } from "lucide-react";
import { ComparisonList, EvidenceCard } from "@/components/evidence-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { OpenDartVerificationResult } from "@/lib/fact-check/types";

function formatCompactDate(value: string): string {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

export function OpenDartVerificationDetails({
  result,
}: {
  result: OpenDartVerificationResult;
}) {
  const comparisons = [
    ...result.matchedFacts.map((fact, index) => ({
      claimedValue: fact.claimedFact,
      field: `확인된 내용 ${index + 1}`,
      officialValue: fact.officialEvidence,
      result: "match" as const,
      resultLabel: "일치",
    })),
    ...result.conflictingFacts.map((fact, index) => ({
      claimedValue: fact.claimedFact,
      field: `상이한 내용 ${index + 1}`,
      officialValue: fact.officialEvidence,
      result: "mismatch" as const,
      resultLabel: "불일치",
    })),
    ...result.unverifiedFacts.map((fact, index) => ({
      claimedValue: fact.claimedFact,
      field: `미확인 내용 ${index + 1}`,
      officialValue: "공식자료에서 확인되지 않음",
      result: "unknown" as const,
      resultLabel: "확인되지 않음",
    })),
  ];

  return (
    <>
      <section aria-labelledby="actual-comparison-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold tracking-[0.12em] text-blue-700">
              CLAIM VS OPENDART
            </p>
            <h2
              id="actual-comparison-title"
              className="mt-1.5 text-lg font-black tracking-[-0.025em] text-ink"
            >
              발언과 실제 공시 근거 비교
            </h2>
          </div>
          <StatusBadge tone="info" icon={Database}>
            OpenDART 실제 공시 기반 검증
          </StatusBadge>
        </div>
        {comparisons.length > 0 ? (
          <ComparisonList items={comparisons} />
        ) : (
          <p className="rounded-2xl border border-line bg-slate-50 p-4 text-sm leading-6 text-muted">
            공식자료에서 비교 가능한 세부 항목을 확인하지 못했습니다.
          </p>
        )}

        {[...result.matchedFacts, ...result.conflictingFacts, ...result.unverifiedFacts].length > 0 ? (
          <div className="mt-4 space-y-2">
            {result.matchedFacts.map((fact, index) => (
              <p key={`match-reason-${index}`} className="rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
                <strong>확인 이유:</strong> {fact.reason}
              </p>
            ))}
            {result.conflictingFacts.map((fact, index) => (
              <p key={`conflict-reason-${index}`} className="rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-950">
                <strong>상이한 이유:</strong> {fact.reason}
              </p>
            ))}
            {result.unverifiedFacts.map((fact, index) => (
              <p key={`unknown-reason-${index}`} className="rounded-xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
                <strong>미확인 이유:</strong> {fact.reason}
              </p>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-7" aria-labelledby="actual-sources-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold tracking-[0.12em] text-blue-700">
              ACTUAL SOURCES
            </p>
            <h2
              id="actual-sources-title"
              className="mt-1.5 text-lg font-black tracking-[-0.025em] text-ink"
            >
              검증에 사용한 실제 공시
            </h2>
          </div>
          <StatusBadge tone="info" icon={Database}>
            실제 접수번호
          </StatusBadge>
        </div>
        <div className="space-y-3">
          {result.sources.map((source) => {
            const citedFacts = [...result.matchedFacts, ...result.conflictingFacts]
              .filter((fact) => fact.sourceReceiptNumber === source.receiptNumber)
              .map((fact) => fact.officialEvidence);
            return (
              <EvidenceCard
                key={source.receiptNumber}
                organization={source.corpName}
                title={source.reportName}
                category="OpenDART 실제 공시"
                documentDate={formatCompactDate(source.receiptDate)}
                referenceNo={source.receiptNumber}
                keyPoint={
                  citedFacts.length > 0
                    ? citedFacts.join(" / ")
                    : "이 공시를 검토했으나 발언을 직접 뒷받침하거나 반박하는 문구는 확인되지 않았습니다."
                }
                sourceUrl={source.originalUrl}
              />
            );
          })}
        </div>
      </section>
    </>
  );
}
