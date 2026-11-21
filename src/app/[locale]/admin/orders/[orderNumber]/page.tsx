/**
 * [쉬운 설명] 관리자 주문 상세. 상태에 맞는 작업 버튼(발송·배송완료·반품승인)이 아래에 나옵니다.
 * 리뷰 순서: 7단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { AdminOrderActions } from "@/components/admin/admin-order-actions";
import { StatusBadge } from "@/components/order/status-badge";
import { Link } from "@/i18n/navigation";
import { STATUS_KO, formatDateTimeKo } from "@/lib/admin-format";
import { formatKRW } from "@/lib/pricing";
import { repo } from "@/server/repo";
import { assertAdminPage } from "@/server/admin-page";

async function AdminOrderDetailPageContent({ params }: PageProps<"/[locale]/admin/orders/[orderNumber]">) {
  await assertAdminPage(params);
  const { orderNumber } = await params;
  const order = await repo().getOrderByNumber(orderNumber);
  if (!order) notFound();
  const o = order;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">
        ← 주문 목록
      </Link>
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-mono text-lg font-bold">{o.orderNumber}</h1>
        <StatusBadge status={o.status} label={STATUS_KO[o.status]} />
      </div>

      <dl className="grid grid-cols-[110px_1fr] gap-y-2 rounded-xl border p-4 text-sm">
        <dt className="text-muted-foreground">주문일시</dt>
        <dd>{formatDateTimeKo(o.createdAt)}</dd>
        <dt className="text-muted-foreground">결제일시</dt>
        <dd>{o.paidAt ? formatDateTimeKo(o.paidAt) : "-"}</dd>
        <dt className="text-muted-foreground">결제수단</dt>
        <dd>{o.paymentMethod ?? "-"}</dd>
        <dt className="text-muted-foreground">결제키</dt>
        <dd className="truncate font-mono text-xs">{o.paymentKey ?? "-"}</dd>
        <dt className="text-muted-foreground">송장번호</dt>
        <dd>{o.trackingNumber ?? "-"}</dd>
        {o.returnReason ? (
          <>
            <dt className="text-muted-foreground">반품 사유</dt>
            <dd className="whitespace-pre-wrap">{o.returnReason}</dd>
          </>
        ) : null}
      </dl>

      <section className="rounded-xl border p-4 text-sm">
        <h2 className="mb-2 font-semibold">배송지</h2>
        <p>
          {o.shipping.recipient} · {o.shipping.phone}
        </p>
        <p>
          ({o.shipping.postcode}) {o.shipping.address1} {o.shipping.address2}
        </p>
        {o.shipping.memo ? <p className="text-muted-foreground">요청사항: {o.shipping.memo}</p> : null}
      </section>

      <section className="rounded-xl border p-4 text-sm">
        <h2 className="mb-2 font-semibold">주문 상품</h2>
        <ul className="divide-y">
          {o.items.map((it) => (
            <li key={it.id} className="flex justify-between py-2">
              <span>
                {it.productNameKo} · {it.variantNameKo} × {it.quantity}
              </span>
              <span>{formatKRW(it.unitPrice * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-col items-end gap-1 border-t pt-2">
          <span>상품 {formatKRW(o.itemsAmount)}</span>
          <span>배송비 {formatKRW(o.shippingFee)}</span>
          <span className="font-bold">합계 {formatKRW(o.totalAmount)}</span>
        </div>
      </section>

      <AdminOrderActions orderNumber={o.orderNumber} status={o.status} />
    </div>
  );
}

// 요청마다 달라지는 데이터(로그인·주문)는 Suspense 안에서 읽어야 함 (Cache Components 규칙)
export default function AdminOrderDetailPage(props: PageProps<"/[locale]/admin/orders/[orderNumber]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AdminOrderDetailPageContent {...props} />
    </Suspense>
  );
}
