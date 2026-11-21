import "server-only";
import type { Order, ShippingAddress } from "@/lib/domain";
import { generateOrderNumber, summarize } from "@/lib/pricing";
import { priceCart } from "@/server/cart";
import { sendOrderEmail } from "@/server/email";
import { cancelPayment, confirmPayment, getPayment, isMockMode, TossError } from "@/server/payments/toss";
import { repo, RepoError } from "@/server/repo";

/** 주문 생성: 장바구니(DB) → 서버에서 가격 재계산 → DB 함수가 재고 잠금·차감 */
export async function placeOrder(userId: string, shipping: ShippingAddress): Promise<Order> {
  const lines = await repo().getCart(userId);
  if (lines.length === 0) throw new RepoError("EMPTY_CART");
  const priced = await priceCart(lines);
  if (priced.lines.length !== lines.length) throw new RepoError("NOT_AVAILABLE");

  const order = await repo().createOrder({
    userId,
    orderNumber: generateOrderNumber(),
    shipping,
    lines: priced.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
  });

  // 안전 장치: DB 함수가 계산한 금액과 앱 계산이 다르면 규칙이 어긋난 것 → 주문을 바로 닫음
  const expected = summarize(priced.lines);
  if (expected.totalAmount !== order.totalAmount) {
    await repo().closeOrderRestock(order.id, ["pending_payment"], "expired");
    throw new Error(`금액 규칙 불일치: app=${expected.totalAmount} db=${order.totalAmount}`);
  }
  return order;
}

export type ConfirmResult =
  | { ok: true; order: Order; alreadyPaid: boolean }
  | {
      ok: false;
      code: "NOT_FOUND" | "FORBIDDEN" | "AMOUNT_MISMATCH" | "INVALID_STATE" | "TOSS_ERROR";
      message?: string;
    };

/**
 * 결제 승인 (토스 successUrl 로 돌아온 뒤 서버에서 호출).
 * 1) 주문이 이 사용자 것인지  2) 금액이 DB 금액과 같은지  3) 아직 결제 대기인지 확인한 뒤 토스에 승인 요청.
 * 같은 주문으로 두 번 와도(새로고침 등) 한 번만 처리됩니다.
 */
export async function confirmOrderPayment(input: {
  userId: string;
  orderNumber: string;
  paymentKey: string;
  amount: number;
}): Promise<ConfirmResult> {
  const order = await repo().getOrderByNumber(input.orderNumber);
  if (!order) return { ok: false, code: "NOT_FOUND" };
  if (order.userId !== input.userId) return { ok: false, code: "FORBIDDEN" };

  if (order.status !== "pending_payment") {
    if (order.paymentKey === input.paymentKey && order.status !== "expired") {
      return { ok: true, order, alreadyPaid: true };
    }
    return { ok: false, code: "INVALID_STATE" };
  }
  if (order.totalAmount !== input.amount) {
    await repo().logPaymentEvent(order.orderNumber, "error", { reason: "AMOUNT_MISMATCH", got: input.amount });
    return { ok: false, code: "AMOUNT_MISMATCH" };
  }

  try {
    const payment = await confirmPayment({
      paymentKey: input.paymentKey,
      orderId: order.orderNumber,
      amount: order.totalAmount,
    });
    await repo().logPaymentEvent(order.orderNumber, "confirm", payment);
    if (payment.status !== "DONE" || payment.totalAmount !== order.totalAmount) {
      return { ok: false, code: "TOSS_ERROR", message: `status=${payment.status}` };
    }
    const paid = await repo().markPaid({
      orderNumber: order.orderNumber,
      paymentKey: payment.paymentKey,
      method: payment.method ?? null,
      paidAt: payment.approvedAt ?? new Date().toISOString(),
    });
    if (!paid) {
      // 그 사이 만료 처리된 경우: 결제는 됐으므로 바로 취소해 돈이 묶이지 않게 함
      await cancelPayment({
        paymentKey: payment.paymentKey,
        reason: "주문 만료 후 승인됨",
        idempotencyKey: `expired-${order.orderNumber}`,
      }).catch((e) => console.error("[toss] 자동 취소 실패", e));
      return { ok: false, code: "INVALID_STATE" };
    }
    await repo().clearCart(order.userId);
    await sendOrderEmail("paid", paid).catch((e) => console.error("[email] 발송 실패", e));
    return { ok: true, order: paid, alreadyPaid: false };
  } catch (e) {
    const message = e instanceof TossError ? `${e.code}: ${e.message}` : String(e);
    await repo().logPaymentEvent(order.orderNumber, "error", { message });
    // 이미 승인된 결제를 다시 승인하려 한 경우(ALREADY_PROCESSED_PAYMENT)는 조회로 확인
    if (e instanceof TossError && e.code === "ALREADY_PROCESSED_PAYMENT") {
      return syncFromToss(input.paymentKey).then((o) =>
        o && o.status === "paid"
          ? { ok: true as const, order: o, alreadyPaid: true }
          : { ok: false as const, code: "TOSS_ERROR" as const, message },
      );
    }
    return { ok: false, code: "TOSS_ERROR", message };
  }
}

/** 웹훅·재확인용: 토스 조회 API 결과를 DB 에 반영 */
export async function syncFromToss(paymentKey: string): Promise<Order | null> {
  if (isMockMode()) return null;
  const payment = await getPayment(paymentKey);
  const order = await repo().getOrderByNumber(payment.orderId);
  if (!order) return null;
  await repo().logPaymentEvent(order.orderNumber, "webhook", payment);

  if (payment.status === "DONE" && order.status === "pending_payment" && payment.totalAmount === order.totalAmount) {
    return repo().markPaid({
      orderNumber: order.orderNumber,
      paymentKey: payment.paymentKey,
      method: payment.method ?? null,
      paidAt: payment.approvedAt ?? new Date().toISOString(),
    });
  }
  if (payment.status === "CANCELED") {
    // 토스 쪽(관리자 콘솔 등)에서 취소된 경우 DB 도 맞춤
    if (order.status === "paid") return repo().closeOrderRestock(order.id, ["paid"], "cancelled");
    if (order.status === "shipping" || order.status === "delivered" || order.status === "return_requested") {
      return repo().closeOrderRestock(order.id, [order.status], "refunded");
    }
  }
  return order;
}

/** 구매자: 발송 전 취소 → 즉시 환불 */
export async function cancelOrderByUser(userId: string, orderNumber: string): Promise<Order> {
  const order = await repo().getOrderByNumber(orderNumber);
  if (!order || order.userId !== userId) throw new RepoError("NOT_FOUND");
  if (order.status === "pending_payment") {
    return repo().closeOrderRestock(order.id, ["pending_payment"], "cancelled");
  }
  if (order.status !== "paid" || !order.paymentKey) throw new RepoError("INVALID_STATE");
  const res = await cancelPayment({
    paymentKey: order.paymentKey,
    reason: "구매자 발송 전 취소",
    idempotencyKey: `cancel-${order.orderNumber}`,
  });
  await repo().logPaymentEvent(order.orderNumber, "cancel", res);
  const closed = await repo().closeOrderRestock(order.id, ["paid"], "cancelled");
  await sendOrderEmail("cancelled", closed).catch((e) => console.error("[email]", e));
  return closed;
}

/** 구매자: 발송 후 반품 요청 (관리자 승인 대기) */
export async function requestReturn(userId: string, orderNumber: string, reason: string): Promise<Order> {
  const order = await repo().getOrderByNumber(orderNumber);
  if (!order || order.userId !== userId) throw new RepoError("NOT_FOUND");
  if (order.status !== "shipping" && order.status !== "delivered") throw new RepoError("INVALID_STATE");
  return repo().updateOrder(order.id, { status: "return_requested", returnReason: reason });
}

/** 관리자: 반품 승인 → 토스 환불 → 재고 복구 */
export async function approveReturn(orderNumber: string): Promise<Order> {
  const order = await repo().getOrderByNumber(orderNumber);
  if (!order) throw new RepoError("NOT_FOUND");
  if (order.status !== "return_requested" || !order.paymentKey) throw new RepoError("INVALID_STATE");
  const res = await cancelPayment({
    paymentKey: order.paymentKey,
    reason: `반품 승인: ${order.returnReason ?? ""}`.slice(0, 200),
    idempotencyKey: `refund-${order.orderNumber}`,
  });
  await repo().logPaymentEvent(order.orderNumber, "cancel", res);
  const closed = await repo().closeOrderRestock(order.id, ["return_requested"], "refunded");
  await sendOrderEmail("refunded", closed).catch((e) => console.error("[email]", e));
  return closed;
}

/** 관리자: 송장 입력·배송 상태 변경 */
export async function setShippingStatus(
  orderNumber: string,
  next: "shipping" | "delivered",
  trackingNumber?: string,
): Promise<Order> {
  const order = await repo().getOrderByNumber(orderNumber);
  if (!order) throw new RepoError("NOT_FOUND");
  const allowed = next === "shipping" ? ["paid", "shipping"] : ["shipping"];
  if (!allowed.includes(order.status)) throw new RepoError("INVALID_STATE");
  if (next === "shipping" && !trackingNumber) throw new RepoError("INVALID_STATE", "송장번호 필요");
  const updated = await repo().updateOrder(order.id, {
    status: next,
    ...(trackingNumber ? { trackingNumber } : {}),
  });
  if (next === "shipping" && order.status === "paid") {
    await sendOrderEmail("shipped", updated).catch((e) => console.error("[email]", e));
  }
  return updated;
}
