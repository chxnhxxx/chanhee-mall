import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
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

const notoSans = Noto_Sans_KR({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "700"] });

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

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className={`${notoSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DemoBanner locale={locale} />
          <SiteHeader locale={locale} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
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
