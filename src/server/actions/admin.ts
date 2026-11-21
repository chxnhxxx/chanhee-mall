"use server";

import { z } from "zod";
import { type ProductFormInput, productFormSchema } from "@/lib/schemas";
import { requireAdmin } from "@/server/auth";
import { approveReturn, setShippingStatus } from "@/server/orders";
import { repo } from "@/server/repo";
import { invalidateCatalogFromAction } from "@/server/revalidate";
import { type ActionResult, fail, ok, toErrorCode } from "./result";

/**
 * 관리자 서버 액션. 화면에서 메뉴를 숨기는 것과 별개로, 모든 액션 첫 줄에서 requireAdmin() 으로 다시 검사합니다.
 * Supabase 모드에서는 RLS(is_admin())가 한 번 더 막습니다.
 */
export async function saveProductAction(input: ProductFormInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const values = productFormSchema.parse(input);
    const saved = await repo().saveProduct(values);
    await invalidateCatalogFromAction();
    return ok({ id: saved.id });
  } catch (e) {
    if (e instanceof z.ZodError) return fail("INVALID_STATE");
    return fail(toErrorCode(e));
  }
}

const orderNumberSchema = z.string().regex(/^[A-Za-z0-9_-]{6,64}$/);

export async function shipOrderAction(orderNumber: string, trackingNumber: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const tracking = z.string().trim().min(4).max(40).parse(trackingNumber);
    await setShippingStatus(orderNumberSchema.parse(orderNumber), "shipping", tracking);
    return ok(null);
  } catch (e) {
    if (e instanceof z.ZodError) return fail("INVALID_STATE");
    return fail(toErrorCode(e));
  }
}

export async function deliverOrderAction(orderNumber: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await setShippingStatus(orderNumberSchema.parse(orderNumber), "delivered");
    return ok(null);
  } catch (e) {
    return fail(toErrorCode(e));
  }
}

export async function approveReturnAction(orderNumber: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await approveReturn(orderNumberSchema.parse(orderNumber));
    await invalidateCatalogFromAction();
    return ok(null);
  } catch (e) {
    return fail(toErrorCode(e));
  }
}
