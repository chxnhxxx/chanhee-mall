/**
 * [쉬운 설명] 주문서 화면(배송지 입력). 로그인과 장바구니가 비어 있지 않은지 먼저 확인합니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Skeleton } from "@/components/ui/skeleton";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth";
import { priceCart } from "@/server/cart";
import { repo } from "@/server/repo";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("title") };
}

export default async function CheckoutPage({ params }: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "checkout" });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CheckoutContent locale={locale} />
      </Suspense>
    </div>
  );
}

async function CheckoutContent({ locale }: { locale: string }) {
  const session = await getSession();
  if (!session) redirect({ href: { pathname: "/login", query: { next: `/${locale}/checkout` } }, locale });
  const cart = await priceCart(await repo().getCart(session!.userId));
  if (cart.lines.length === 0) redirect({ href: "/cart", locale });
  return <CheckoutForm cart={cart} defaultRecipient={session!.name} />;
}
