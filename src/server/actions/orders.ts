/**
 * [쉬운 설명] '주문하기', '주문 취소', '반품 요청' 버튼을 누르면 실행되는 서버 쪽 코드.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use server";

import { z } from "zod";
import { returnSchema, type ShippingInput, shippingSchema } from "@/lib/schemas";
import { requireUser } from "@/server/auth";
import { cancelOrderByUser, placeOrder, requestReturn } from "@/server/orders";
import { rateLimit } from "@/server/redis";
import { invalidateCatalogFromAction } from "@/server/revalidate";
import { type ActionResult, fail, ok, toErrorCode } from "./result";

// ▶ '결제하기로 이동' 버튼 → 로그인 확인 → 요청 횟수 제한 → 배송지 검사 → 주문 생성 → 주문번호를 화면에 돌려줌
export async function placeOrderAction(input: ShippingInput): Promise<ActionResult<{ orderNumber: string }>> {
  try {
    const session = await requireUser();
    if (!(await rateLimit("checkout", session.userId))) return fail("RATE_LIMITED");
    const shipping = shippingSchema.parse(input);
    const order = await placeOrder(session.userId, { ...shipping, address2: shipping.address2 ?? "" });
    await invalidateCatalogFromAction(); // 재고가 바뀌었으므로
    return ok({ orderNumber: order.orderNumber });
  } catch (e) {
    if (e instanceof z.ZodError) return fail("INVALID_STATE");
    return fail(toErrorCode(e));
  }
}

// ▶ '주문 취소' 버튼
export async function cancelOrderAction(orderNumber: string): Promise<ActionResult> {
  try {
    const session = await requireUser();
    await cancelOrderByUser(session.userId, z.string().max(64).parse(orderNumber));
    await invalidateCatalogFromAction();
    return ok(null);
  } catch (e) {
    return fail(toErrorCode(e));
  }
}

// ▶ '반품 요청' 버튼
export async function requestReturnAction(orderNumber: string, reason: string): Promise<ActionResult> {
  try {
    const session = await requireUser();
    const input = returnSchema.parse({ orderNumber, reason });
    await requestReturn(session.userId, input.orderNumber, input.reason);
    return ok(null);
  } catch (e) {
    if (e instanceof z.ZodError) return fail("INVALID_STATE");
    return fail(toErrorCode(e));
  }
}
