/**
 * [쉬운 설명] 내 주문 내역 목록 화면.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { StatusBadge } from "@/components/order/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, redirect } from "@/i18n/navigation";
import { formatKRW } from "@/lib/pricing";
import { getSession } from "@/server/auth";
import { repo } from "@/server/repo";

export async function generateMetadata({ params }: PageProps<"/[locale]/orders">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "orders" });
  return { title: t("title") };
}

export default async function OrdersPage({ params }: PageProps<"/[locale]/orders">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "orders" });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-light tracking-tight">{t("title")}</h1>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <OrderList locale={locale} />
      </Suspense>
    </div>
  );
}

async function OrderList({ locale }: { locale: string }) {
  const session = await getSession();
  if (!session) redirect({ href: { pathname: "/login", query: { next: `/${locale}/orders` } }, locale });
  const orders = await repo().listOrdersByUser(session!.userId);
  const t = await getTranslations({ locale, namespace: "orders" });
  const ts = await getTranslations({ locale, namespace: "status" });
  const format = await getFormatter({ locale });
  const lang = locale === "en" ? "en" : "ko";

  if (orders.length === 0) return <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>;
  return (
    <ul className="divide-y rounded-xl border" data-testid="order-list">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/orders/${o.orderNumber}`} className="flex items-center gap-3 p-4 hover:bg-muted/50">
            <div className="flex flex-1 flex-col gap-1">
              <p className="font-medium">{o.orderName}</p>
              <p className="text-xs text-muted-foreground">
                {o.orderNumber} · {format.dateTime(new Date(o.createdAt), { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={o.status} label={ts(o.status)} />
              <span className="text-sm font-semibold">{formatKRW(o.totalAmount, lang)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
