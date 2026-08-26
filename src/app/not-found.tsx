import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-xl items-center px-5 py-16 text-center">
      <div className="surface-card w-full p-8 sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <SearchX aria-hidden="true" className="size-7" />
        </span>
        <p className="mt-6 text-sm font-bold text-action">404 · 찾을 수 없음</p>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-ink">
          요청한 기록을 찾지 못했어요
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          주소가 바뀌었거나 데모 데이터에 없는 기록일 수 있습니다.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-[#1d4054]"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
