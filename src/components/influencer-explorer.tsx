"use client";

import Link from "next/link";
import { ArrowRight, MessageSquareQuote, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";

export type InfluencerExplorerProfile = {
  id: string;
  displayName: string;
  channelName: string;
  platformLabel: string;
  avatarInitials: string;
  analyzedStatements: number;
  officialAgreementLabel: string;
  marketExcessPerformanceLabel: string;
  href: string;
  isRecommended: boolean;
};

type InfluencerExplorerProps = {
  profiles: InfluencerExplorerProfile[];
  initialQuery?: string;
};

function normalizeSearchText(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

export function InfluencerExplorer({
  profiles,
  initialQuery = "",
}: InfluencerExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const normalizedQuery = normalizeSearchText(query);
  const isSearching = normalizedQuery.length > 0;

  const displayedProfiles = useMemo(() => {
    if (!normalizedQuery) {
      return profiles.filter((profile) => profile.isRecommended).slice(0, 6);
    }

    return profiles.filter((profile) => {
      const searchableText = normalizeSearchText(
        `${profile.displayName} ${profile.channelName}`,
      );
      return searchableText.includes(normalizedQuery);
    });
  }, [normalizedQuery, profiles]);

  return (
    <div className="mt-6 sm:mt-8">
      <section className="surface-card p-4 sm:p-6" aria-labelledby="influencer-search-title">
        <div className="mx-auto max-w-3xl">
          <h2 id="influencer-search-title" className="text-sm font-black text-ink">
            인플루언서 검색
          </h2>
          <label htmlFor="influencer-search" className="sr-only">
            인플루언서 이름 또는 채널명 검색
          </label>
          <div className="relative mt-3">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
            />
            <input
              id="influencer-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="인플루언서 이름 또는 채널명을 검색하세요"
              autoComplete="off"
              className="min-h-14 w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 text-base font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-action focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">
            현재 MVP에 등록된 예시 인플루언서의 이름과 채널명에서 검색합니다.
          </p>
        </div>
      </section>

      <section className="mt-9" aria-labelledby="influencer-results-title" aria-live="polite">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.12em] text-brand">
              {isSearching ? "SEARCH RESULTS" : "FEATURED PROFILES"}
            </p>
            <h2
              id="influencer-results-title"
              className="mt-1.5 text-xl font-black tracking-[-0.025em] text-ink sm:text-2xl"
            >
              {isSearching ? "검색 결과" : "추천 프로필"}
            </h2>
          </div>
          {isSearching && displayedProfiles.length > 0 ? (
            <p className="number-tabular text-sm font-semibold text-muted">
              {displayedProfiles.length}명
            </p>
          ) : null}
        </div>

        {displayedProfiles.length > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedProfiles.map((profile) => (
              <InfluencerProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="surface-card mt-5 flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <SearchX aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-base font-black text-ink">검색 결과가 없습니다.</p>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              인플루언서 이름이나 채널명의 일부를 다시 입력해보세요.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function InfluencerProfileCard({ profile }: { profile: InfluencerExplorerProfile }) {
  return (
    <Link
      href={profile.href}
      aria-label={`${profile.displayName} 프로필 보기`}
      className="surface-card group flex min-h-64 flex-col p-5 transition hover:-translate-y-0.5 hover:border-[#adc3ca] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action sm:p-6"
    >
      <header className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-sm font-black text-white"
        >
          {profile.avatarInitials}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black tracking-[-0.02em] text-ink">
            {profile.displayName}
          </h3>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-600">
            {profile.channelName}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">{profile.platformLabel}</p>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <ProfileMetric label="공식자료 일치" value={profile.officialAgreementLabel} />
        <ProfileMetric label="시장 대비 성과" value={profile.marketExcessPerformanceLabel} />
      </div>

      <footer className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
          <MessageSquareQuote aria-hidden="true" className="size-3.5" />
          분석 발언 {profile.analyzedStatements}건
        </span>
        <span className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-black text-action">
          프로필 보기
          <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-1" />
        </span>
      </footer>
    </Link>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <dl className="min-w-0 rounded-xl bg-slate-50 p-3">
      <dt className="truncate text-[11px] font-semibold text-muted">{label}</dt>
      <dd className="number-tabular mt-1 break-words text-lg font-black text-ink">{value}</dd>
    </dl>
  );
}
