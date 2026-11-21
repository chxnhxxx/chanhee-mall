"use server";

import { z } from "zod";
import type { CartLine } from "@/lib/domain";
import { cartLineSchema, guestLinesSchema } from "@/lib/schemas";
import { requireUser } from "@/server/auth";
import { type PricedCart, priceCart } from "@/server/cart";
import { clientIp, rateLimit } from "@/server/redis";
import { repo } from "@/server/repo";
import { type ActionResult, fail, ok, toErrorCode } from "./result";

const countOf = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity, 0);

/** 로그인 사용자 장바구니에 담기 → 새 개수 반환 (Zustand 거울 갱신용) */
export async function addToCartAction(variantId: string, quantity: number): Promise<ActionResult<{ count: number }>> {
  try {
    const input = cartLineSchema.parse({ variantId, quantity });
    const session = await requireUser();
    if (!(await rateLimit("cart", session.userId))) return fail("RATE_LIMITED");
    const priced = await priceCart([{ variantId: input.variantId, quantity: 1 }]);
    const line = priced.lines[0];
    if (!line) return fail("NOT_AVAILABLE");
    if (line.stock <= 0) return fail("OUT_OF_STOCK");
    await repo().addToCart(session.userId, input.variantId, Math.max(1, input.quantity));
    return ok({ count: countOf(await repo().getCart(session.userId)) });
  } catch (e) {
    if (e instanceof z.ZodError) return fail("BAD_QUANTITY");
    return fail(toErrorCode(e));
  }
}

/** 수량 변경 (0 이면 삭제) → 다시 계산된 장바구니 반환 */
export async function updateCartAction(
  variantId: string,
  quantity: number,
): Promise<ActionResult<{ cart: PricedCart; count: number }>> {
  try {
    const input = cartLineSchema.parse({ variantId, quantity });
    const session = await requireUser();
    if (!(await rateLimit("cart", session.userId))) return fail("RATE_LIMITED");
    await repo().setCartQuantity(session.userId, input.variantId, input.quantity);
    const lines = await repo().getCart(session.userId);
    return ok({ cart: await priceCart(lines), count: countOf(lines) });
  } catch (e) {
    if (e instanceof z.ZodError) return fail("BAD_QUANTITY");
    return fail(toErrorCode(e));
  }
}

/** 비회원 장바구니 가격 계산 (가격은 언제나 서버가 DB 기준으로) */
export async function priceGuestCartAction(lines: CartLine[]): Promise<ActionResult<PricedCart>> {
  try {
    if (!(await rateLimit("cart", await clientIp()))) return fail("RATE_LIMITED");
    return ok(await priceCart(guestLinesSchema.parse(lines)));
  } catch (e) {
    if (e instanceof z.ZodError) return fail("BAD_QUANTITY");
    return fail(toErrorCode(e));
  }
}
