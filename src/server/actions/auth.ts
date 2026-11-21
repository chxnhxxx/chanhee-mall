/**
 * [쉬운 설명] 로그인·회원가입·로그아웃 버튼을 누르면 실행되는 서버 쪽 코드.
 * 로그인 전에 담아 둔 장바구니를 계정 장바구니로 합쳐 줍니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use server";

import { guestLinesSchema, loginSchema, signupSchema } from "@/lib/schemas";
import { signIn, signOut, signUp } from "@/server/auth";
import { clientIp, rateLimit } from "@/server/redis";
import { repo } from "@/server/repo";

export type AuthFormState = { ok: boolean; code?: string; redirectTo?: string } | null;

// ▶ 로그인 후 이동할 주소가 우리 사이트 안쪽인지 확인. 남의 사이트로 보내는 피싱 수법을 막습니다.
/** 로그인 후 이동할 주소는 우리 사이트 내부 경로만 허용 (오픈 리다이렉트 방지) */
function safeNext(raw: FormDataEntryValue | null, fallback: string) {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

// ▶ 로그인 전에 담아 둔 상품을 계정 장바구니로 옮깁니다.
async function mergeGuestCart(userId: string, raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw === "") return;
  try {
    const lines = guestLinesSchema.parse(JSON.parse(raw));
    for (const l of lines) await repo().addToCart(userId, l.variantId, l.quantity);
  } catch {
    // 손상된 비회원 장바구니는 무시
  }
}

// ▶ '로그인' 버튼 → 횟수 제한 → 입력 검사 → 비밀번호 확인 → 장바구니 합치기 → 이동할 주소 알려줌
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

// ▶ '회원가입' 버튼 (흐름은 로그인과 같음)
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
