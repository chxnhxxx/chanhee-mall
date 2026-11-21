/**
 * [쉬운 설명] 주문 상태(결제 완료, 배송중 등)를 색깔 있는 꼬리표로 보여 주는 부품.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";

const COLORS: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  paid: "bg-blue-100 text-blue-900",
  shipping: "bg-indigo-100 text-indigo-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-zinc-200 text-zinc-700",
  return_requested: "bg-orange-100 text-orange-900",
  refunded: "bg-zinc-200 text-zinc-700",
  expired: "bg-zinc-200 text-zinc-700",
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return (
    <Badge variant="secondary" className={cn("border-0", COLORS[status])} data-testid="order-status">
      {label}
    </Badge>
  );
}
