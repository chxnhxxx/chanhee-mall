import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { OrderActions } from "@/components/order/order-actions";
import { StatusBadge } from "@/components/order/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, redirect } from "@/i18n/navigation";
import { formatKRW } from "@/lib/pricing";
import { getSession } from "@/server/auth";
import { repo } from "@/server/repo";

export default function OrderDetailPage({ params }: PageProps<"/[locale]/orders/[orderNumber]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: { params: Promise<{ locale: string; orderNumber: string }> }) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) redirect({ href: { pathname: "/login", query: { next: `/${locale}/orders/${orderNumber}` } }, locale });
  const order = await repo().getOrderByNumber(orderNumber);
  // 남의 주문은 존재 여부도 알려주지 않음 (주문번호 바꿔 보기 차단)
  if (!order || order.userId !== session!.userId) redirect({ href: "/orders", locale });
  const o = order!;

  const t = await getTranslations({ locale, namespace: "orders" });
  const ts = await getTranslations({ locale, namespace: "status" });
  const tc = await getTranslations({ locale, namespace: "cart" });
  const format = await getFormatter({ locale });
  const lang = locale === "en" ? "en" : "ko";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("detail")}</h1>
        <StatusBadge status={o.status} label={ts(o.status)} />
      </div>

      <dl className="grid grid-cols-[120px_1fr] gap-y-2 rounded-xl border p-4 text-sm">
        <dt className="text-muted-foreground">{t("orderNumber")}</dt>
        <dd data-testid="order-number">{o.orderNumber}</dd>
        <dt className="text-muted-foreground">{t("orderedAt")}</dt>
        <dd>{format.dateTime(new Date(o.createdAt), { dateStyle: "medium", timeStyle: "short" })}</dd>
        {o.trackingNumber ? (
          <>
            <dt className="text-muted-foreground">{t("tracking")}</dt>
            <dd>{o.trackingNumber}</dd>
          </>
        ) : null}
        <dt className="text-muted-foreground">{t("shippingTo")}</dt>
        <dd>
          {o.shipping.recipient} · {o.shipping.phone}
          <br />({o.shipping.postcode}) {o.shipping.address1} {o.shipping.address2}
        </dd>
      </dl>

      {o.status === "pending_payment" ? (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
          <p>{t("expiresAt", { time: format.dateTime(new Date(o.expiresAt), { timeStyle: "short" }) })}</p>
          <Button asChild className="w-fit">
            <Link href={`/checkout/pay/${o.orderNumber}`}>{t("payNow")}</Link>
          </Button>
        </div>
      ) : null}

      <ul className="divide-y rounded-xl border text-sm">
        {o.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-2 p-3">
            <span>
              {lang === "en" ? i.productNameEn : i.productNameKo}
              <span className="text-muted-foreground">
                {" "}
                · {lang === "en" ? i.variantNameEn : i.variantNameKo}
              </span> × {i.quantity}
            </span>
            <span>{formatKRW(i.unitPrice * i.quantity, lang)}</span>
          </li>
        ))}
        <li className="flex justify-between p-3 text-muted-foreground">
          <span>{tc("shippingFee")}</span>
          <span>{o.shippingFee === 0 ? tc("free") : formatKRW(o.shippingFee, lang)}</span>
        </li>
        <li className="flex justify-between p-3 font-bold">
          <span>{tc("total")}</span>
          <span>{formatKRW(o.totalAmount, lang)}</span>
        </li>
      </ul>

      {o.returnReason ? (
        <p className="text-sm text-muted-foreground">
          {t("returnReason")}: {o.returnReason}
        </p>
      ) : null}

      <OrderActions orderNumber={o.orderNumber} status={o.status} />
    </div>
  );
}
