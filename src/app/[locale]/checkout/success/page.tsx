/**
 * [쉬운 설명] 결제 완료 화면. 주문번호와 '주문 상세 보기' 버튼, GA4 구매 기록.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { PurchaseTracker } from "@/components/checkout/purchase-tracker";
import { Button } from "@/components/ui/button";
import { Link, redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth";
import { repo } from "@/server/repo";

export default async function SuccessPage({ params, searchParams }: PageProps<"/[locale]/checkout/success">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={null}>
      <SuccessContent locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

async function SuccessContent({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const orderNumber = typeof sp.orderNumber === "string" ? sp.orderNumber : "";
  const session = await getSession();
  const order = orderNumber ? await repo().getOrderByNumber(orderNumber) : null;
  if (!session || !order || order.userId !== session.userId) redirect({ href: "/orders", locale });
  const t = await getTranslations({ locale, namespace: "result" });

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#e2e8df] text-3xl text-[#3d5238]">
        ✓
      </div>
      <h1 className="text-2xl font-light tracking-tight" data-testid="success-title">
        {t("successTitle")}
      </h1>
      <p className="text-muted-foreground">{t("successBody", { orderNumber: order!.orderNumber })}</p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href={`/orders/${order!.orderNumber}`}>{t("viewOrder")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">{t("continue")}</Link>
        </Button>
      </div>
      <PurchaseTracker
        transactionId={order!.orderNumber}
        value={order!.totalAmount}
        shipping={order!.shippingFee}
        items={order!.items.map((i) => ({
          item_id: i.variantId,
          item_name: i.productNameKo,
          item_variant: i.variantNameKo,
          price: i.unitPrice,
          quantity: i.quantity,
        }))}
      />
    </div>
  );
}
