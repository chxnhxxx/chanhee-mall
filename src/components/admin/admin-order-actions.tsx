/**
 * [쉬운 설명] 관리자 주문 작업 버튼: 결제 완료 → 송장 입력·발송, 배송중 → 배송 완료, 반품 요청 → 승인(환불).
 * 리뷰 순서: 7단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import type { OrderStatus } from "@/lib/domain";
import { approveReturnAction, deliverOrderAction, shipOrderAction } from "@/server/actions/admin";
import type { ActionResult } from "@/server/actions/result";

const ERR_KO: Record<string, string> = {
  INVALID_STATE: "지금 상태에서는 할 수 없습니다. (또는 입력값 오류)",
  NOT_FOUND: "주문을 찾을 수 없습니다.",
  TOSS_ERROR: "토스 환불 요청이 실패했습니다. 잠시 후 다시 시도해 주세요.",
};

/** 상태별로 가능한 관리자 작업: 결제완료→발송(송장), 배송중→배송완료, 반품요청→승인(환불+재고복구) */
export function AdminOrderActions({ orderNumber, status }: { orderNumber: string; status: OrderStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tracking, setTracking] = useState("");

  const run = (fn: () => Promise<ActionResult>, done: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(ERR_KO[res.code] ?? "처리하지 못했습니다.");
      toast.success(done);
      router.refresh();
    });

  if (status === "paid") {
    return (
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => shipOrderAction(orderNumber, tracking), "발송 처리했습니다.");
        }}
      >
        <Input
          placeholder="송장번호"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          data-testid="tracking-input"
        />
        <Button type="submit" disabled={pending || tracking.trim().length < 4} data-testid="ship-order">
          발송 처리
        </Button>
      </form>
    );
  }
  if (status === "shipping") {
    return (
      <Button disabled={pending} onClick={() => run(() => deliverOrderAction(orderNumber), "배송 완료로 바꿨습니다.")}>
        배송 완료 처리
      </Button>
    );
  }
  if (status === "return_requested") {
    return (
      <Button
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("반품을 승인하면 전액 환불되고 재고가 복구됩니다. 진행할까요?")) return;
          run(() => approveReturnAction(orderNumber), "반품을 승인하고 환불했습니다.");
        }}
      >
        반품 승인 (환불)
      </Button>
    );
  }
  return null;
}
