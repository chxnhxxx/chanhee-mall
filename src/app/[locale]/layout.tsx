/**
 * [쉬운 설명] 모든 페이지를 감싸는 공통 틀: 데모 배너, 머리글(헤더), 본문, 바닥글, 알림창, 분석 도구.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, IBM_Plex_Sans_KR } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Analytics } from "@/components/analytics";
import { CartSync } from "@/components/cart/cart-sync";
import { DemoBanner } from "@/components/layout/demo-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import "../globals.css";

// ▶ 본문 글꼴(IBM Plex Sans KR)과 큰 제목·가격용 굵은 글꼴(검은고딕)
const bodyFont = IBM_Plex_Sans_KR({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "700"] });
const displayFont = Black_Han_Sans({ variable: "--font-display", subsets: ["latin"], weight: "400" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { default: t("title"), template: `%s | ${t("title")}` },
    description: t("description"),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    robots: { index: false, follow: false }, // 데모 사이트: 검색 노출 안 함
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f3f5f9" };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}>
      {/* ▶ 한국어 화면은 단어 중간에서 줄이 바뀌지 않도록(break-keep) */}
      <body className={locale === "ko" ? "flex min-h-full flex-col break-keep" : "flex min-h-full flex-col"}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DemoBanner locale={locale} />
          <SiteHeader locale={locale} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-12">{children}</main>
          <SiteFooter locale={locale} />
          <Suspense fallback={null}>
            <CartSync />
          </Suspense>
          <Toaster richColors position="top-center" />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
