"use server";

import { z } from "zod";
import { returnSchema, type ShippingInput, shippingSchema } from "@/lib/schemas";
import { requireUser } from "@/server/auth";
import { cancelOrderByUser, placeOrder, requestReturn } from "@/server/orders";
import { rateLimit } from "@/server/redis";
import { invalidateCatalogFromAction } from "@/server/revalidate";
import { type ActionResult, fail, ok, toErrorCode } from "./result";

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
