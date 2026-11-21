"use server";

import { guestLinesSchema, loginSchema, signupSchema } from "@/lib/schemas";
import { signIn, signOut, signUp } from "@/server/auth";
import { clientIp, rateLimit } from "@/server/redis";
import { repo } from "@/server/repo";

export type AuthFormState = { ok: boolean; code?: string; redirectTo?: string } | null;

/** 로그인 후 이동할 주소는 우리 사이트 내부 경로만 허용 (오픈 리다이렉트 방지) */
function safeNext(raw: FormDataEntryValue | null, fallback: string) {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

async function mergeGuestCart(userId: string, raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw === "") return;
  try {
    const lines = guestLinesSchema.parse(JSON.parse(raw));
    for (const l of lines) await repo().addToCart(userId, l.variantId, l.quantity);
  } catch {
    // 손상된 비회원 장바구니는 무시
  }
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!(await rateLimit("login", await clientIp()))) return { ok: false, code: "RATE_LIMITED" };
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, code: "INVALID" };
  const res = await signIn(parsed.data.email, parsed.data.password);
  if (!res.ok) return { ok: false, code: res.code };
  await mergeGuestCart(res.session.userId, formData.get("guestCart"));
  const fallback = `/${formData.get("locale") === "en" ? "en" : "ko"}`;
  return { ok: true, redirectTo: safeNext(formData.get("next"), fallback) };
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!(await rateLimit("login", await clientIp()))) return { ok: false, code: "RATE_LIMITED" };
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, code: "WEAK" };
  const res = await signUp(parsed.data.email, parsed.data.password, parsed.data.name);
  if (!res.ok) return { ok: false, code: res.code };
  await mergeGuestCart(res.session.userId, formData.get("guestCart"));
  const fallback = `/${formData.get("locale") === "en" ? "en" : "ko"}`;
  return { ok: true, redirectTo: safeNext(formData.get("next"), fallback) };
}

export async function logoutAction() {
  await signOut();
}
