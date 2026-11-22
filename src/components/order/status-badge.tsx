/**
 * [쉬운 설명] 주문 상태(결제 완료, 배송중 등)를 색깔 있는 꼬리표로 보여 주는 부품.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";

const COLORS: Record<OrderStatus, string> = {
  pending_payment: "bg-kraft text-ink",
  paid: "bg-[#e3e7e9] text-[#33444d]",
  shipping: "bg-[#e3e7e9] text-[#33444d]",
  delivered: "bg-[#e2e8df] text-[#3d5238]",
  cancelled: "bg-secondary text-muted-foreground",
  return_requested: "bg-[#f1e0dc] text-primary",
  refunded: "bg-secondary text-muted-foreground",
  expired: "bg-secondary text-muted-foreground",
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return (
    <Badge variant="secondary" className={cn("border-0", COLORS[status])} data-testid="order-status">
      {label}
    </Badge>
  );
}
