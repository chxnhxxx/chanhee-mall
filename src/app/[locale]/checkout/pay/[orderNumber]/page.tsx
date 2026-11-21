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
  if (!order || order.userId !== session!.userId) redirect({ href: "/orders", locale });
  if (order!.status !== "pending_payment") redirect({ href: `/orders/${orderNumber}`, locale });

  const t = await getTranslations({ locale, namespace: "checkout" });
  const lang = locale === "en" ? "en" : "ko";
  const base = await requestOrigin();
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
