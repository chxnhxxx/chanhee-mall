import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NewOrderListener } from "@/components/admin/new-order-listener";
import { StatusBadge } from "@/components/order/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { features } from "@/env";
import { Link } from "@/i18n/navigation";
import { STATUS_KO, formatDateTimeKo } from "@/lib/admin-format";
import { formatKRW } from "@/lib/pricing";
import { repo } from "@/server/repo";
import { assertAdminPage } from "@/server/admin-page";

async function AdminDashboardContent({ params }: PageProps<"/[locale]/admin">) {
  await assertAdminPage(params);
  const [stats, orders] = await Promise.all([repo().dailyStats(14), repo().listOrders()]);
  const today = stats.at(-1) ?? { day: "", orders: 0, revenue: 0 };
  const total = stats.reduce((acc, s) => ({ orders: acc.orders + s.orders, revenue: acc.revenue + s.revenue }), {
    orders: 0,
    revenue: 0,
  });
  const maxRevenue = Math.max(1, ...stats.map((s) => s.revenue));
  const waiting = orders.filter((o) => o.status === "paid").length;
  const returns = orders.filter((o) => o.status === "return_requested").length;

  return (
    <div className="flex flex-col gap-6">
      <NewOrderListener realtime={features.supabase} latestOrderNumber={orders[0]?.orderNumber ?? null} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="오늘 주문" value={`${today.orders}건`} />
        <Stat label="오늘 매출" value={formatKRW(today.revenue)} />
        <Stat label="발송 대기" value={`${waiting}건`} href="/admin/orders?status=paid" />
        <Stat label="반품 요청" value={`${returns}건`} href="/admin/orders?status=return_requested" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            최근 14일 매출 · {total.orders}건 · {formatKRW(total.revenue)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 결제 완료 이후 상태(paid·shipping·delivered·return_requested)만 매출로 셈 */}
          <div className="flex h-40 items-end gap-1" role="img" aria-label="일별 매출 막대 그래프">
            {stats.map((s) => (
              <div
                key={s.day}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${s.day} · ${s.orders}건 · ${formatKRW(s.revenue)}`}
              >
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${Math.max(2, (s.revenue / maxRevenue) * 130)}px` }}
                />
                <span className="text-[10px] text-muted-foreground">{s.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 주문</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">아직 주문이 없습니다.</p>
          ) : (
            <ul className="divide-y">
              {orders.slice(0, 10).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.orderNumber}`}
                    className="flex items-center gap-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <span className="flex-1 truncate">{o.orderName}</span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {formatDateTimeKo(o.createdAt)}
                    </span>
                    <StatusBadge status={o.status} label={STATUS_KO[o.status]} />
                    <span className="w-24 text-right font-medium">{formatKRW(o.totalAmount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-1 py-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xl font-bold">{value}</span>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

// 요청마다 달라지는 데이터(로그인·주문)는 Suspense 안에서 읽어야 함 (Cache Components 규칙)
export default function AdminDashboard(props: PageProps<"/[locale]/admin">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AdminDashboardContent {...props} />
    </Suspense>
  );
}
