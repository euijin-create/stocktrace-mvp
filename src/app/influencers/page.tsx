import type { Metadata } from "next";

import {
  InfluencerExplorer,
  type InfluencerExplorerProfile,
} from "@/components/influencer-explorer";
import { influencers } from "@/data/mock-data";
import {
  PLATFORM_LABEL,
  formatPercentPoint,
  formatRatioPercent,
  getInfluencerProfileView,
  routes,
} from "@/lib/stocktrace";

export const metadata: Metadata = {
  title: "인플루언서 프로필",
  description: "주식 인플루언서의 정보와 과거 발언 기록을 검색하고 확인합니다.",
};

type PageProps = {
  searchParams: Promise<{ query?: string | string[] }>;
};

export default async function InfluencersPage({ searchParams }: PageProps) {
  const { query } = await searchParams;
  const initialQuery = Array.isArray(query) ? (query[0] ?? "") : (query ?? "");

  const profiles: InfluencerExplorerProfile[] = influencers
    .map((influencer) => getInfluencerProfileView(influencer.slug))
    .filter((view) => view !== undefined)
    .map(({ influencer, profile }) => ({
      id: influencer.id,
      displayName: influencer.displayName,
      channelName: influencer.channelName ?? "채널 정보 없음",
      platformLabel: PLATFORM_LABEL[influencer.platform],
      avatarInitials: influencer.avatarInitials,
      analyzedStatements: profile.metrics.analyzedStatements,
      officialAgreementLabel: formatRatioPercent(profile.metrics.officialAgreement),
      marketExcessPerformanceLabel: formatPercentPoint(
        profile.metrics.predictionPerformance.averageExcessReturnPct,
      ),
      href: routes.influencer(influencer.slug),
      isRecommended: influencer.isFeatured === true,
    }));

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <header className="soft-grid overflow-hidden rounded-[1.75rem] bg-[#102f3e] px-5 py-8 text-white shadow-[0_24px_70px_rgb(15_47_62/12%)] sm:px-8 sm:py-10">
        <p className="text-xs font-extrabold tracking-[0.12em] text-cyan-200">
          INFLUENCER DIRECTORY
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
          인플루언서 프로필
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
          궁금한 주식 인플루언서의 정보와 과거 기록을 확인해보세요.
        </p>
      </header>

      <InfluencerExplorer
        key={initialQuery}
        profiles={profiles}
        initialQuery={initialQuery}
      />
    </main>
  );
}
