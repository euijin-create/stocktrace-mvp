import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StockTrace | 주식 발언과 결과를 추적하다",
    template: "%s | StockTrace",
  },
  description:
    "주식 콘텐츠의 핵심 발언을 공식자료와 비교하고 미래 예측의 결과를 기록하는 모바일 투자정보 검증 서비스 MVP",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f7f8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
