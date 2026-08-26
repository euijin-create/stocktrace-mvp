"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2 } from "lucide-react";

export function QuickAnalyzeForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = url.trim();

    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("invalid protocol");
    } catch {
      setError("http:// 또는 https://로 시작하는 콘텐츠 주소를 입력해 주세요.");
      return;
    }

    setError("");
    router.push(`/analyze?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={submit} noValidate className="mt-7" aria-label="콘텐츠 URL 빠른 분석">
      <label htmlFor="home-content-url" className="sr-only">
        분석할 콘텐츠 URL
      </label>
      <div className="rounded-2xl border border-white/15 bg-white p-2 shadow-[0_18px_60px_rgb(2_23_35/22%)] sm:flex sm:items-center">
        <div className="flex min-h-13 flex-1 items-center gap-3 px-3">
          <Link2 aria-hidden="true" className="size-5 shrink-0 text-slate-400" />
          <input
            id="home-content-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="유튜브 또는 SNS 콘텐츠 URL"
            aria-describedby={error ? "home-url-error" : "home-url-help"}
            aria-invalid={Boolean(error)}
            className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#1769e0] px-5 text-sm font-extrabold text-white transition hover:bg-[#0d5ac7] sm:w-auto"
        >
          분석 시작
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      <p
        id={error ? "home-url-error" : "home-url-help"}
        role={error ? "alert" : undefined}
        className={`mt-2.5 px-1 text-xs leading-5 ${error ? "font-semibold text-[#ffbbb2]" : "text-slate-300"}`}
      >
        {error ?? ""}
        {!error && "MVP에서는 URL의 실제 콘텐츠를 수집하지 않으며, 다음 화면에서 발언을 직접 입력합니다."}
      </p>
    </form>
  );
}
