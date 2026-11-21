import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { features, sessionSecret } from "@/env";
import type { Role } from "@/lib/domain";
import { repo } from "@/server/repo";
import { memoryState } from "@/server/repo/memory";
import { DEMO_ACCOUNTS } from "@/server/seed-data";
import { userClient } from "@/server/supabase/clients";

export type Session = { userId: string; email: string; name: string; role: Role };

export type AuthResult = { ok: true; session: Session } | { ok: false; code: "INVALID" | "EXISTS" | "WEAK" | "ERROR" };

/* ─────────────── 메모리 모드: 서명된 쿠키 세션 ─────────────── */
const COOKIE = "chm_session";
const MAX_AGE = 60 * 60 * 24 * 7;

const hashPassword = (password: string, salt: string) => scryptSync(password, salt, 32).toString("hex");

type MemUser = { id: string; email: string; salt: string; hash: string };
const g = globalThis as unknown as { __chmMemUsers?: MemUser[] };
function memUsers(): MemUser[] {
  g.__chmMemUsers ??= DEMO_ACCOUNTS.map((a) => {
    const salt = a.id;
    return { id: a.id, email: a.email, salt, hash: hashPassword(a.password, salt) };
  });
  return g.__chmMemUsers;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url");
}

async function writeMemSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

async function readMemSession(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  let parsed: { uid: string; exp: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; exp: number };
  } catch {
    return null;
  }
  // 만료 확인에 현재 시각이 필요 → "요청 시점"에만 실행되도록 표시 (미리 렌더·프리페치 중에는 여기서 멈춤)
  await connection();
  return parsed.exp > Date.now() ? parsed.uid : null;
}

/* ─────────────── 공개 함수 ─────────────── */

/** 현재 로그인 사용자. 요청 1회 안에서는 결과를 재사용(react cache) */
export const getSession = cache(async (): Promise<Session | null> => {
  let userId: string | null;
  if (features.supabase) {
    const supabase = await userClient();
    // getUser 는 Supabase 서버에 토큰을 확인하므로 위조된 쿠키를 믿지 않음
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } else {
    userId = await readMemSession();
  }
  if (!userId) return null;
  const profile = await repo().getProfile(userId);
  if (!profile) return null;
  return { userId: profile.id, email: profile.email, name: profile.name, role: profile.role };
});

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (features.supabase) {
    const supabase = await userClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { ok: false, code: "INVALID" };
    const profile = await repo().getProfile(data.user.id);
    if (!profile) return { ok: false, code: "ERROR" };
    return { ok: true, session: { userId: profile.id, email: profile.email, name: profile.name, role: profile.role } };
  }
  const user = memUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { ok: false, code: "INVALID" };
  const a = Buffer.from(hashPassword(password, user.salt));
  const b = Buffer.from(user.hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, code: "INVALID" };
  await writeMemSession(user.id);
  const profile = (await repo().getProfile(user.id))!;
  return { ok: true, session: { userId: profile.id, email: profile.email, name: profile.name, role: profile.role } };
}

export async function signUp(email: string, password: string, name: string): Promise<AuthResult> {
  if (features.supabase) {
    // 전제: Supabase 대시보드에서 "Confirm email" 을 꺼 둠 → 가입 즉시 세션이 생김
    const supabase = await userClient();
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) {
      if (/already/i.test(error.message)) return { ok: false, code: "EXISTS" };
      if (/password/i.test(error.message)) return { ok: false, code: "WEAK" };
      return { ok: false, code: "ERROR" };
    }
    if (!data.user || !data.session) return { ok: false, code: "ERROR" };
    return { ok: true, session: { userId: data.user.id, email, name, role: "customer" } };
  }
  const users = memUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, code: "EXISTS" };
  const id = crypto.randomUUID();
  users.push({ id, email, salt: id, hash: hashPassword(password, id) });
  memoryState().profiles.push({ id, email, name, role: "customer" });
  await writeMemSession(id);
  return { ok: true, session: { userId: id, email, name, role: "customer" } };
}

export async function signOut() {
  if (features.supabase) {
    await (await userClient()).auth.signOut();
  } else {
    (await cookies()).delete(COOKIE);
  }
}

/** 서버 권한 검사 헬퍼: 화면 숨김과 별개로 서버 액션·페이지에서 반드시 호출 */
export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code);
  }
}

export async function requireUser(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new AuthError("UNAUTHENTICATED");
  return s;
}

export async function requireAdmin(): Promise<Session> {
  const s = await requireUser();
  if (s.role !== "admin") throw new AuthError("FORBIDDEN");
  return s;
}
