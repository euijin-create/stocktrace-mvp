import { Link2, Quote, UserRound } from "lucide-react";
import type { ContentAnalysisInput } from "@/lib/mock-analysis";

export function AnalysisInputSummary({
  input,
  className = "",
}: {
  input: ContentAnalysisInput;
  className?: string;
}) {
  return (
    <section
      className={`surface-card overflow-hidden border-blue-200 ${className}`}
      aria-labelledby="submitted-analysis-title"
    >
      <div className="border-b border-blue-100 bg-blue-50/80 px-5 py-3.5 sm:px-6">
        <p id="submitted-analysis-title" className="text-sm font-extrabold text-blue-900">
          이번 분석에 입력한 내용
        </p>
      </div>
      <dl className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <div className="min-w-0">
          <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
            <UserRound aria-hidden="true" className="size-3.5" /> 인플루언서
          </dt>
          <dd className="mt-1.5 break-words text-sm font-extrabold text-ink">
            {input.influencerName}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Link2 aria-hidden="true" className="size-3.5" /> 콘텐츠 URL
          </dt>
          <dd className="mt-1.5 min-w-0">
            <a
              href={input.contentUrl}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-sm font-bold text-action hover:underline"
              title={input.contentUrl}
            >
              {input.contentUrl}
              <span className="sr-only"> 새 창에서 열기</span>
            </a>
          </dd>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Quote aria-hidden="true" className="size-3.5" /> 분석한 원문 발언
          </dt>
          <dd className="mt-2 break-words rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-ink">
            “{input.statement}”
          </dd>
        </div>
      </dl>
    </section>
  );
}
