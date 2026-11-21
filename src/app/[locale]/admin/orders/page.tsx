import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/order/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { STATUS_KO, formatDateTimeKo } from "@/lib/admin-format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/domain";
import { formatKRW } from "@/lib/pricing";
import { repo } from "@/server/repo";
import { assertAdminPage } from "@/server/admin-page";

async function AdminOrdersPageContent({ params, searchParams }: PageProps<"/[locale]/admin/orders">) {
  await assertAdminPage(params);
  const sp = await searchParams;
  const raw = typeof sp.status === "string" ? sp.status : undefined;
  const status = ORDER_STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : undefined;
  const orders = await repo().listOrders(status ? { status } : undefined);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">주문 ({orders.length})</h1>
      <div className="flex flex-wrap gap-1 text-sm">
        <FilterLink label="전체" active={!status} href="/admin/orders" />
        {ORDER_STATUSES.map((s) => (
          <FilterLink key={s} label={STATUS_KO[s]} active={status === s} href={`/admin/orders?status=${s}`} />
        ))}
      </div>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>주문번호</TableHead>
              <TableHead className="hidden md:table-cell">주문명</TableHead>
              <TableHead className="hidden sm:table-cell">받는 분</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="hidden lg:table-cell">주문일시</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  해당하는 주문이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono text-xs hover:underline">
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-60 truncate md:table-cell">{o.orderName}</TableCell>
                  <TableCell className="hidden sm:table-cell">{o.shipping.recipient}</TableCell>
                  <TableCell className="text-right">{formatKRW(o.totalAmount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} label={STATUS_KO[o.status]} />
                  </TableCell>
                  <TableCell className="hidden text-xs lg:table-cell">{formatDateTimeKo(o.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilterLink({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 ${active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
    >
      {label}
    </Link>
  );
}

// 요청마다 달라지는 데이터(로그인·주문)는 Suspense 안에서 읽어야 함 (Cache Components 규칙)
export default function AdminOrdersPage(props: PageProps<"/[locale]/admin/orders">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AdminOrdersPageContent {...props} />
    </Suspense>
  );
}
