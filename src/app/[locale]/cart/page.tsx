/**
 * [쉬운 설명] 장바구니 화면. 로그인 여부를 확인해 손님용/회원용 장바구니를 보여줍니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CartView } from "@/components/cart/cart-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/server/auth";
import { priceCart } from "@/server/cart";
import { repo } from "@/server/repo";

export async function generateMetadata({ params }: PageProps<"/[locale]/cart">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return { title: t("title") };
}

export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "cart" });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-light tracking-tight">{t("title")}</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <CartContent />
      </Suspense>
    </div>
  );
}

async function CartContent() {
  const session = await getSession();
  if (!session) return <CartView mode="guest" initial={null} />;
  const cart = await priceCart(await repo().getCart(session.userId));
  return <CartView mode="user" initial={cart} />;
}
