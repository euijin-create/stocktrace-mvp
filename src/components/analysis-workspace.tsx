"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  ChevronRight,
  FileCheck2,
  FileText,
  Info,
  Link2,
  LoaderCircle,
  ScanSearch,
  Sparkles,
  UserRound,
} from "lucide-react";
import { demoScenarios, mockDatabase } from "@/data/mock-data";
import { CLAIM_TYPE_META, inferDemoScenario } from "@/lib/stocktrace";
import type { DemoScenario, DemoScenarioId } from "@/types/stocktrace";

function getScenarioPresentation(scenario: DemoScenario) {
  const analysis = mockDatabase.analyses.find((item) => item.id === scenario.analysisId);
  const seededStatement = analysis
    ? mockDatabase.statements.find((item) => item.id === analysis.statementIds[0])
    : undefined;
  const stocks = seededStatement?.stockIds
    .map((stockId) => mockDatabase.stocks.find((stock) => stock.id === stockId))
    .filter((stock) => stock !== undefined) ?? [];
  const prediction = analysis?.relatedPredictionId
    ? mockDatabase.predictions.find((item) => item.id === analysis.relatedPredictionId)
    : undefined;
  const isFactCheck = Boolean(scenario.links.factCheckHref);
  const primaryHref = scenario.links.factCheckHref ?? scenario.links.predictionHref ?? scenario.links.receiptHref ?? "/analyze";

  return {
    type: seededStatement ? CLAIM_TYPE_META[seededStatement.primaryType].label : "발언 유형 확인 필요",
    company: stocks.length > 0 ? stocks.map((stock) => `${stock.name} · ${stock.symbol}`).join(", ") : "종목 확인 필요",
    summary: analysis?.summary ?? scenario.description,
    confidence: seededStatement?.confidence.score ?? 70,
    condition: isFactCheck
      ? "팩트체크 가능"
      : prediction?.status === "insufficient_conditions"
        ? "평가조건 불충분"
        : "평가조건 충족",
    href: primaryHref,
    receiptHref: scenario.links.receiptHref,
    cta: isFactCheck
      ? "팩트체크 결과 보기"
      : prediction?.status === "insufficient_conditions"
        ? "조건 불충분 기록 보기"
        : "예측 추적 기록 보기",
    icon: isFactCheck ? FileCheck2 : prediction?.status === "insufficient_conditions" ? Info : BarChart3,
  };
}

export function AnalysisWorkspace() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") ?? "";
  const [url, setUrl] = useState(initialUrl);
  const [influencer, setInfluencer] = useState("");
  const [statement, setStatement] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoScenarioId | null>(null);

  const resultScenario = useMemo(
    () => (result ? demoScenarios.find((scenario) => scenario.id === result) ?? null : null),
    [result],
  );
  const resultMeta = useMemo(
    () => (resultScenario ? getScenarioPresentation(resultScenario) : null),
    [resultScenario],
  );

  function applySample(index: number) {
    const sample = demoScenarios[index];
    setUrl(sample.input.contentUrl);
    setInfluencer(sample.input.influencerName);
    setStatement(sample.input.statement);
    setError("");
    setResult(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || !influencer.trim() || !statement.trim()) {
      setError("콘텐츠 URL, 인플루언서 이름, 분석할 발언을 모두 입력해 주세요.");
      return;
    }
    try {
      const parsed = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("invalid protocol");
    } catch {
      setError("콘텐츠 URL은 http:// 또는 https://로 시작해야 합니다.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);
    window.setTimeout(() => {
      setResult(inferDemoScenario(statement).id);
      setLoading(false);
      window.requestAnimationFrame(() => {
        document.getElementById("analysis-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }, 850);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(340px,.78fr)] lg:items-start">
      <section className="surface-card overflow-hidden" aria-labelledby="analysis-form-title">
        <div className="border-b border-line bg-[#f9fbfb] px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f2f2] text-brand">
              <ScanSearch aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 id="analysis-form-title" className="text-lg font-black tracking-[-0.02em] text-ink">
                분석할 내용을 알려주세요
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">입력한 발언은 저장되거나 외부로 전송되지 않습니다.</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="space-y-5 p-5 sm:p-7">
          <div>
            <label htmlFor="content-url" className="mb-2 block text-sm font-bold text-ink">
              콘텐츠 URL <span className="text-action">*</span>
            </label>
            <div className="flex min-h-13 items-center gap-3 rounded-xl border border-line bg-white px-4 transition focus-within:border-action focus-within:ring-3 focus-within:ring-blue-100">
              <Link2 aria-hidden="true" className="size-4.5 shrink-0 text-slate-400" />
              <input
                id="content-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="influencer" className="mb-2 block text-sm font-bold text-ink">
              인플루언서 이름 <span className="text-action">*</span>
            </label>
            <div className="flex min-h-13 items-center gap-3 rounded-xl border border-line bg-white px-4 transition focus-within:border-action focus-within:ring-3 focus-within:ring-blue-100">
              <UserRound aria-hidden="true" className="size-4.5 shrink-0 text-slate-400" />
              <input
                id="influencer"
                type="text"
                autoComplete="off"
                value={influencer}
                onChange={(event) => setInfluencer(event.target.value)}
                placeholder="예: 주식왕"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="statement" className="text-sm font-bold text-ink">
                분석할 발언 <span className="text-action">*</span>
              </label>
              <span className="text-xs text-slate-400">{statement.length}/500</span>
            </div>
            <textarea
              id="statement"
              rows={5}
              maxLength={500}
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              placeholder={'예: “에이원테크는 한 달 안에 20% 상승할 것이다.”'}
              className="w-full resize-y rounded-xl border border-line bg-white px-4 py-3.5 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-action focus:ring-3 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1c4053] disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                발언 구조를 살펴보는 중…
              </>
            ) : (
              <>
                <Sparkles aria-hidden="true" className="size-4" />
                가상 AI 분석하기
              </>
            )}
          </button>
        </form>
      </section>

      <aside className="space-y-5 lg:sticky lg:top-24">
        <div className="surface-card p-5 sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand">빠른 체험</p>
          <h2 className="mt-2 text-lg font-black tracking-[-0.02em] text-ink">예시 발언으로 시작해 보세요</h2>
          <div className="mt-4 space-y-2.5">
            {demoScenarios.map((sample, index) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => applySample(index)}
                className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left transition hover:border-[#9db8c0] hover:bg-[#f7fbfb]"
              >
                <span>
                  <span className="block text-sm font-bold text-ink">{sample.label}</span>
                  <span className="mt-0.5 line-clamp-1 block text-xs text-muted">{sample.input.statement}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
          <details className="mt-4 border-t border-line pt-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-extrabold text-ink">
              분류하는 발언 유형 5가지
              <ChevronRight aria-hidden="true" className="size-4 text-slate-400" />
            </summary>
            <ul className="mt-2 space-y-2 pb-1">
              {Object.values(CLAIM_TYPE_META).map((meta) => (
                <li key={meta.label} className="flex items-start gap-2 text-xs leading-5 text-muted">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  <span><strong className="font-bold text-ink">{meta.label}</strong><br />{meta.description}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-3">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-action" />
            <div>
              <h2 className="text-sm font-extrabold text-ink">현재는 키워드 기반 데모입니다</h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">
                실제 AI나 콘텐츠 수집 API는 연결하지 않았습니다. 입력값은 화면 흐름을 보여주는 분류 미리보기에만 반영됩니다.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div id="analysis-result" aria-live="polite" className="scroll-mt-28 lg:col-span-2">
        {loading && (
          <div className="surface-card flex min-h-52 items-center justify-center p-8 text-center">
            <div>
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#e8f2f2] text-brand">
                <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
              </span>
              <p className="mt-4 font-extrabold text-ink">발언에서 검증 가능한 단서를 찾고 있어요</p>
              <p className="mt-1.5 text-sm text-muted">종목 · 수치 · 기간 · 출처 표현을 분리합니다.</p>
            </div>
          </div>
        )}

        {resultMeta && !loading && (
          <section className="surface-card animate-enter overflow-hidden" aria-labelledby="result-title">
            <div className="flex flex-col gap-4 border-b border-line bg-[#f8fbfa] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Check aria-hidden="true" className="size-5" strokeWidth={2.6} />
                </span>
                <div>
                  <p className="text-xs font-bold text-emerald-700">데모 분석 완료</p>
                  <h2 id="result-title" className="mt-0.5 text-xl font-black tracking-[-0.02em] text-ink">
                    발언의 기록 경로를 찾았습니다
                  </h2>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                <Sparkles aria-hidden="true" className="size-3.5" />
                AI 분류 신뢰수준 {resultMeta.confidence}%
              </span>
            </div>

            <div className="p-5 sm:p-7">
              <blockquote className="rounded-2xl border-l-4 border-brand bg-slate-50 px-5 py-4 text-[15px] font-semibold leading-7 text-ink">
                “{statement.trim()}”
                <footer className="mt-2 text-xs font-medium text-muted">— {influencer.trim()}</footer>
              </blockquote>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["발언 유형", resultMeta.type],
                  ["언급 종목", resultMeta.company],
                  ["기록 판단", resultMeta.condition],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-line bg-white p-4">
                    <p className="text-xs font-semibold text-muted">{label}</p>
                    <p className="mt-1.5 text-sm font-extrabold leading-5 text-ink">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#edf7f5] px-4 py-4">
                <BadgeCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                <p className="text-sm leading-6 text-slate-700">{resultMeta.summary}</p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Link
                  href={resultMeta.href}
                  className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-[#1c4053] sm:col-span-2"
                >
                  <resultMeta.icon aria-hidden="true" className="size-4.5" />
                  {resultMeta.cta}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                {resultMeta.receiptHref ? (
                  <Link
                    href={resultMeta.receiptHref}
                    className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-extrabold text-ink transition hover:bg-slate-50"
                  >
                    <FileText aria-hidden="true" className="size-4" />
                    발언 영수증
                  </Link>
                ) : (
                  <span className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-line bg-slate-50 px-4 text-sm font-bold text-muted">
                    <FileText aria-hidden="true" className="size-4" />
                    영수증 준비 중
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs leading-5 text-muted">
                상세 화면은 입력 내용과 별개로 준비된 예시 공시·주가 데이터를 사용합니다. 신뢰수준은 분류 결과에 대한 값이며 발언의 진실 확률이 아닙니다.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
