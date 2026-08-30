import {
  Building2,
  CalendarDays,
  Database,
  FileText,
  Hash,
  UserRound,
} from "lucide-react";
import { OfficialSourceAction } from "@/components/official-source-action";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import type {
  OpenDartDisclosure,
  OpenDartLookupResult,
  OpenDartLookupStatus,
} from "@/lib/dart/types";

const statusPresentation: Record<
  OpenDartLookupStatus,
  { label: string; tone: StatusTone }
> = {
  success: { label: "OpenDART 실제 조회", tone: "info" },
  not_configured: { label: "데모 공시 데이터", tone: "neutral" },
  company_not_found: { label: "기업 미식별", tone: "warning" },
  no_disclosures: { label: "OpenDART 실제 조회 · 결과 없음", tone: "neutral" },
  rate_limited: { label: "잠시 후 재시도", tone: "warning" },
  auth_error: { label: "연결 설정 확인", tone: "warning" },
  unavailable: { label: "조회 일시 중단", tone: "warning" },
};

function formatCompactDate(value: string): string {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

function DisclosureCard({ disclosure }: { disclosure: OpenDartDisclosure }) {
  return (
    <article className="rounded-2xl border border-blue-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <StatusBadge tone="info" icon={Database}>OpenDART 실제 조회</StatusBadge>
          <h3 className="mt-3 break-words text-base font-black leading-6 text-ink">
            {disclosure.reportName}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">{disclosure.corpName}</p>
        </div>
        {disclosure.originalUrl ? (
          <OfficialSourceAction sourceUrl={disclosure.originalUrl} />
        ) : (
          <span className="inline-flex min-h-10 shrink-0 items-center rounded-xl border border-line bg-slate-50 px-3.5 text-xs font-bold text-muted">
            원문 링크 없음
          </span>
        )}
      </div>

      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-brand" />
          <div>
            <dt className="font-semibold text-muted">접수일</dt>
            <dd className="mt-0.5 font-extrabold text-ink">{formatCompactDate(disclosure.receiptDate)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <Hash aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-brand" />
          <div className="min-w-0">
            <dt className="font-semibold text-muted">접수번호</dt>
            <dd className="mt-0.5 break-all font-extrabold text-ink">{disclosure.receiptNo}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 sm:col-span-2">
          <UserRound aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-brand" />
          <div>
            <dt className="font-semibold text-muted">제출인</dt>
            <dd className="mt-0.5 font-extrabold text-ink">{disclosure.filerName}</dd>
          </div>
        </div>
        {disclosure.remarks ? (
          <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 sm:col-span-2">
            <FileText aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-brand" />
            <div>
              <dt className="font-semibold text-muted">비고</dt>
              <dd className="mt-0.5 font-extrabold text-ink">{disclosure.remarks}</dd>
            </div>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

export function OpenDartDisclosures({ result }: { result: OpenDartLookupResult }) {
  const presentation = statusPresentation[result.status];
  const hasActualCompany = result.company !== null;
  const sectionTitle =
    result.status === "success" || hasActualCompany
      ? "OpenDART 실제 공시 후보"
      : "OpenDART 공시 조회";
  const scopeDescription =
    result.status === "success"
      ? "기업 식별과 아래 공시 메타데이터는 OpenDART에서 실제로 조회했습니다. 발언과 공시 내용의 일치 여부를 판정한 결과는 아닙니다."
      : hasActualCompany
        ? "기업 식별 정보는 OpenDART에서 실제로 확인했습니다. 최근 공시 내용과 발언의 일치 여부는 아직 판정하지 않습니다."
        : "현재 OpenDART 실제 공시 데이터는 표시되지 않았습니다. 아래 데모 자료와 데모 판정은 실제 OpenDART 조회 결과가 아닙니다.";

  return (
    <section aria-labelledby="open-dart-title">
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold tracking-[0.12em] text-blue-700">OFFICIAL DISCLOSURE LIST</p>
            <h2 id="open-dart-title" className="mt-1.5 text-lg font-black tracking-[-0.025em] text-ink">
              {sectionTitle}
            </h2>
          </div>
          <StatusBadge tone={presentation.tone} icon={Database}>{presentation.label}</StatusBadge>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">{result.message}</p>
        <p className="mt-1.5 text-xs leading-5 text-muted">{scopeDescription}</p>

        {result.company ? (
          <dl className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-white px-3 py-3">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Building2 aria-hidden="true" className="size-3.5" /> 실제 기업명</dt>
              <dd className="mt-1 text-sm font-extrabold text-ink">{result.company.corpName}</dd>
            </div>
            <div className="rounded-xl border border-blue-100 bg-white px-3 py-3">
              <dt className="text-xs font-semibold text-muted">고유번호</dt>
              <dd className="mt-1 text-sm font-extrabold text-ink">{result.company.corpCode}</dd>
            </div>
            <div className="rounded-xl border border-blue-100 bg-white px-3 py-3">
              <dt className="text-xs font-semibold text-muted">종목코드</dt>
              <dd className="mt-1 text-sm font-extrabold text-ink">{result.company.stockCode ?? "비상장·미확인"}</dd>
            </div>
          </dl>
        ) : null}

        {result.searchRange ? (
          <p className="mt-3 text-xs font-semibold text-muted">
            검색 범위: {formatCompactDate(result.searchRange.from)} ~ {formatCompactDate(result.searchRange.to)}
          </p>
        ) : null}
      </div>

      {result.status === "success" ? (
        <div className="mt-3 space-y-3">
          {result.disclosures.map((disclosure) => (
            <DisclosureCard
              key={`${disclosure.corpCode}-${disclosure.receiptNo}`}
              disclosure={disclosure}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
