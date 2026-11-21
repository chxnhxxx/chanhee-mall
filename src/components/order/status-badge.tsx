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
