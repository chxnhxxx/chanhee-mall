/**
 * [쉬운 설명] ★ 이 쇼핑몰에서 가장 중요한 파일. 주문 만들기 → 결제 승인 → 취소/반품/발송까지 주문의 일생을 다룹니다.
 * 돈과 관련된 안전장치(금액 대조, 중복 결제 방지, 만료 주문 자동 환불)가 모두 여기 있습니다.
 * 리뷰 순서: 5단계 (docs/REVIEW_GUIDE.md 참고)
 */
import "server-only";
import type { Order, ShippingAddress } from "@/lib/domain";
import { generateOrderNumber, summarize } from "@/lib/pricing";
import { priceCart } from "@/server/cart";
import { sendOrderEmail } from "@/server/email";
import { cancelPayment, confirmPayment, getPayment, isMockMode, TossError } from "@/server/payments/toss";
import { repo, RepoError } from "@/server/repo";

// ▶ [주문 만들기] '결제하기로 이동' 버튼을 누르면 실행됩니다.
// ▶ 순서: 장바구니 읽기 → 서버가 가격 다시 계산 → DB 가 재고를 잠그고 줄임 → '결제 대기' 주문 생성
/** 주문 생성: 장바구니(DB) → 서버에서 가격 재계산 → DB 함수가 재고 잠금·차감 */
export async function placeOrder(userId: string, shipping: ShippingAddress): Promise<Order> {
  const lines = await repo().getCart(userId);
  if (lines.length === 0) throw new RepoError("EMPTY_CART");
  // ▶ 브라우저가 보낸 가격은 믿지 않고, DB 에 저장된 가격으로 다시 계산합니다.
  const priced = await priceCart(lines);
  if (priced.lines.length !== lines.length) throw new RepoError("NOT_AVAILABLE");

  // ▶ 재고 확인과 차감은 DB 안에서 '한 번에' 처리됩니다. 두 사람이 마지막 1개를 동시에 사도 한 명만 성공합니다.
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

// ▶ [결제 승인] 토스 결제창에서 결제를 마친 뒤 실행됩니다. 아래 확인을 모두 통과해야 돈이 실제로 결제됩니다.
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
  // ▶ 확인 1: 내 주문이 맞는가?
  if (order.userId !== input.userId) return { ok: false, code: "FORBIDDEN" };

  // ▶ 확인 2: 아직 '결제 대기' 상태인가? 이미 결제된 주문이면(새로고침 등) 같은 결제인지 보고 그냥 성공 처리합니다.
  if (order.status !== "pending_payment") {
    if (order.paymentKey === input.paymentKey && order.status !== "expired") {
      return { ok: true, order, alreadyPaid: true };
    }
    return { ok: false, code: "INVALID_STATE" };
  }
  // ▶ 확인 3: 결제하려는 금액이 DB 의 주문 금액과 똑같은가? (주소창 금액을 바꿔치기하는 조작 방지)
  if (order.totalAmount !== input.amount) {
    await repo().logPaymentEvent(order.orderNumber, "error", { reason: "AMOUNT_MISMATCH", got: input.amount });
    return { ok: false, code: "AMOUNT_MISMATCH" };
  }

  try {
    // ▶ 모든 확인 통과 → 토스에 '이 결제를 최종 승인해 주세요' 요청
    const payment = await confirmPayment({
      paymentKey: input.paymentKey,
      orderId: order.orderNumber,
      amount: order.totalAmount,
    });
    await repo().logPaymentEvent(order.orderNumber, "confirm", payment);
    if (payment.status !== "DONE" || payment.totalAmount !== order.totalAmount) {
      return { ok: false, code: "TOSS_ERROR", message: `status=${payment.status}` };
    }
    // ▶ 토스 승인 성공 → 주문 상태를 '결제 완료'로 바꿈. 이미 바뀌어 있으면 아무것도 안 함(중복 방지)
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
    // ▶ 결제가 끝났으니 장바구니를 비우고 확인 메일을 보냅니다. 메일이 실패해도 결제는 그대로 유효합니다.
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

// ▶ [상태 맞추기] 토스에 결제 상태를 직접 물어보고 우리 DB 를 그에 맞춥니다. 웹훅(토스의 알림)이 올 때 쓰입니다.
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

// ▶ [구매자 취소] 결제 전이면 그냥 닫고, 결제 후·발송 전이면 토스에 환불 요청 → 재고 되돌림 → 취소 메일
/** 구매자: 발송 전 취소 → 즉시 환불 */
export async function cancelOrderByUser(userId: string, orderNumber: string): Promise<Order> {
  const order = await repo().getOrderByNumber(orderNumber);
  if (!order || order.userId !== userId) throw new RepoError("NOT_FOUND");
  if (order.status === "pending_payment") {
    return repo().closeOrderRestock(order.id, ["pending_payment"], "cancelled");
  }
  if (order.status !== "paid" || !order.paymentKey) throw new RepoError("INVALID_STATE");
  // ▶ idempotencyKey(중복 방지 표식): 같은 취소 요청이 두 번 가도 토스는 한 번만 환불합니다.
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

// ▶ [반품 요청] 발송 후에는 바로 환불하지 않고 '반품 요청' 상태로 바꿔 관리자 승인을 기다립니다.
/** 구매자: 발송 후 반품 요청 (관리자 승인 대기) */
export async function requestReturn(userId: string, orderNumber: string, reason: string): Promise<Order> {
  const order = await repo().getOrderByNumber(orderNumber);
  if (!order || order.userId !== userId) throw new RepoError("NOT_FOUND");
  if (order.status !== "shipping" && order.status !== "delivered") throw new RepoError("INVALID_STATE");
  return repo().updateOrder(order.id, { status: "return_requested", returnReason: reason });
}

// ▶ [반품 승인] 관리자가 승인하면 토스 환불 → 재고 되돌림 → 환불 메일
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

// ▶ [발송·배송완료] 관리자가 송장번호를 넣으면 '배송중', 배송이 끝나면 '배송 완료'로 바꿉니다.
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
