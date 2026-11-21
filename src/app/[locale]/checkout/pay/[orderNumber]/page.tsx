/**
 * [쉬운 설명] 결제 화면. 토스 키가 있으면 토스 결제위젯, 없으면 모의 결제 버튼을 보여줍니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { MockPayment } from "@/components/checkout/mock-payment";
import { TossPayment } from "@/components/checkout/toss-payment";
import { Skeleton } from "@/components/ui/skeleton";
import { features } from "@/env";
import { publicEnv } from "@/env.client";
import { redirect } from "@/i18n/navigation";
import { formatKRW } from "@/lib/pricing";
import { getSession } from "@/server/auth";
import { requestOrigin } from "@/server/origin";
import { repo } from "@/server/repo";

export default function PayPage({ params }: PageProps<"/[locale]/checkout/pay/[orderNumber]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <PayContent params={params} />
    </Suspense>
  );
}

async function PayContent({ params }: { params: Promise<{ locale: string; orderNumber: string }> }) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session)
    redirect({ href: { pathname: "/login", query: { next: `/${locale}/checkout/pay/${orderNumber}` } }, locale });
  const order = await repo().getOrderByNumber(orderNumber);
  // 남의 주문번호로 들어오면 "없는 주문"처럼 처리
  // ▶ 내 주문이 아니거나 이미 결제된 주문이면 결제 화면을 보여 주지 않습니다.
  if (!order || order.userId !== session!.userId) redirect({ href: "/orders", locale });
  if (order!.status !== "pending_payment") redirect({ href: `/orders/${orderNumber}`, locale });

  const t = await getTranslations({ locale, namespace: "checkout" });
  const lang = locale === "en" ? "en" : "ko";
  const base = await requestOrigin();
  // ▶ 결제가 끝난 뒤 토스가 돌려보낼 주소(성공/실패)
  const successUrl = `${base}/api/payments/toss/success?locale=${lang}`;
  const failUrl = `${base}/${lang}/checkout/fail`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("payment")}</h1>
      <div className="rounded-xl border p-4 text-sm">
        <p className="font-medium">{order!.orderName}</p>
        <p className="text-muted-foreground">{order!.orderNumber}</p>
        <p className="mt-2 text-xl font-bold" data-testid="pay-amount">
          {formatKRW(order!.totalAmount, lang)}
        </p>
      </div>
      {features.toss ? (
        <>
          <p className="text-sm text-amber-700">{t("testNotice")}</p>
          <TossPayment
            clientKey={publicEnv.tossClientKey!}
            customerKey={session!.userId}
            amount={order!.totalAmount}
            orderId={order!.orderNumber}
            orderName={order!.orderName}
            successUrl={successUrl}
            failUrl={failUrl}
            customerName={order!.shipping.recipient}
          />
        </>
      ) : (
        <MockPayment orderId={order!.orderNumber} amount={order!.totalAmount} locale={lang} />
      )}
    </div>
  );
}
