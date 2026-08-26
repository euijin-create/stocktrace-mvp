import { Building2, CalendarDays, FileKey2, Landmark } from "lucide-react";

export interface EvidenceCardProps {
  organization: string;
  title: string;
  category: string;
  documentDate: string;
  referenceNo?: string;
  keyPoint: string;
}

export function EvidenceCard({
  organization,
  title,
  category,
  documentDate,
  referenceNo,
  keyPoint,
}: EvidenceCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9f2f3] text-brand">
          <Landmark aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-600">{category}</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
              <Building2 aria-hidden="true" className="size-3" />
              {organization}
            </span>
          </div>
          <h3 className="mt-2 break-words text-[15px] font-extrabold leading-6 text-ink">{title}</h3>
        </div>
      </div>

      <dl className="mt-5 grid gap-2 text-xs text-muted sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
          <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
          <dt className="sr-only">자료 작성일</dt>
          <dd>작성일 {documentDate}</dd>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
          <FileKey2 aria-hidden="true" className="size-3.5 shrink-0" />
          <dt className="sr-only">문서 번호</dt>
          <dd className="truncate">{referenceNo ?? "예시 문서 · 번호 없음"}</dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3.5">
        <p className="text-xs font-extrabold text-emerald-800">근거가 되는 핵심 내용</p>
        <p className="mt-1.5 text-sm leading-6 text-slate-700">{keyPoint}</p>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">MVP용 예시 자료로, 외부 원문 링크는 연결되어 있지 않습니다.</p>
    </article>
  );
}

export interface ComparisonItem {
  field: string;
  claimedValue: string;
  officialValue: string;
  resultLabel: string;
  result: "match" | "partial" | "mismatch" | "unknown";
}

const resultStyle: Record<ComparisonItem["result"], string> = {
  match: "bg-emerald-50 text-emerald-800 border-emerald-200",
  partial: "bg-amber-50 text-amber-900 border-amber-200",
  mismatch: "bg-rose-50 text-rose-800 border-rose-200",
  unknown: "bg-slate-100 text-slate-700 border-slate-200",
};

export function ComparisonList({ items }: { items: ComparisonItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="hidden grid-cols-[.7fr_1fr_1fr_auto] gap-4 border-b border-line bg-slate-50 px-5 py-3 text-xs font-extrabold text-muted sm:grid">
        <span>비교 항목</span>
        <span>발언 내용</span>
        <span>공식자료</span>
        <span>일치 여부</span>
      </div>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <div key={item.field} className="grid gap-3 px-5 py-4 sm:grid-cols-[.7fr_1fr_1fr_auto] sm:items-center sm:gap-4">
            <p className="text-xs font-extrabold text-muted sm:text-sm sm:text-ink">{item.field}</p>
            <div>
              <p className="mb-1 text-[11px] font-bold text-slate-400 sm:hidden">발언 내용</p>
              <p className="text-sm font-semibold leading-5 text-ink">{item.claimedValue}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold text-slate-400 sm:hidden">공식자료</p>
              <p className="text-sm leading-5 text-slate-600">{item.officialValue}</p>
            </div>
            <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${resultStyle[item.result]}`}>
              {item.resultLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
