"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesCombined,
  FlaskConical,
  Home,
  ScanSearch,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Brand } from "@/components/brand";

type AppShellProps = {
  children: ReactNode;
};

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  mobileLabel?: string;
};

const navigation: NavigationItem[] = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/analyze", icon: ScanSearch, label: "분석" },
  { href: "/predictions", icon: ChartNoAxesCombined, label: "예측" },
  {
    href: "/influencers",
    icon: UserRound,
    label: "인플루언서 프로필",
    mobileLabel: "인플루언서",
  },
];

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh text-ink antialiased">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[70] -translate-y-20 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        본문으로 바로가기
      </a>

      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Brand compact />

          <nav aria-label="주요 메뉴" className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => {
              const active = isCurrentPath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    active
                      ? "bg-action/10 text-action"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-4.5" strokeWidth={active ? 2.35 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[0.7rem] font-bold text-slate-600 sm:px-3 sm:text-xs">
            <FlaskConical aria-hidden="true" className="size-3.5 text-action" />
            MVP
          </span>
        </div>
      </header>

      <div id="main-content" tabIndex={-1} className="pb-28 outline-none md:pb-10">
        {children}
      </div>

      <footer className="hidden border-t border-line bg-white md:block">
        <div className="mx-auto flex max-w-[1180px] items-start justify-between gap-8 px-6 py-7 text-xs leading-5 text-slate-500 lg:px-8">
          <div>
            <Brand compact />
            <p className="mt-3">주식 콘텐츠의 발언과 이후 결과를 객관적으로 기록합니다.</p>
          </div>
          <p className="max-w-2xl text-right">
            StockTrace는 Gemini, OpenDART 및 시장데이터를 활용해 공개 발언을 분석합니다. 데모 데이터가
            사용되는 영역은 별도로 표시됩니다. 특정 종목의 매수·매도를 추천하지 않으며,
            불공정거래나 위법 여부를 판단하지 않습니다.
          </p>
        </div>
      </footer>

      <nav
        aria-label="모바일 주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 px-2">
          {navigation.map((item) => {
            const active = isCurrentPath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.68rem] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                  active ? "text-action" : "text-slate-500 active:bg-slate-100"
                }`}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-action"
                  />
                ) : null}
                <Icon
                  aria-hidden="true"
                  className={`size-5 ${active ? "fill-blue-100" : ""}`}
                  strokeWidth={active ? 2.35 : 2}
                />
                <span>{item.mobileLabel ?? item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
