import "server-only";
import * as Sentry from "@sentry/nextjs";
import { AuthError } from "@/server/auth";
import { RepoError } from "@/server/repo";
import { TossError } from "@/server/payments/toss";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; code: string };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (code: string): { ok: false; code: string } => ({ ok: false, code });

/** 서버 액션에서 던진 오류를 화면용 오류 코드로 변환 (내부 메시지는 노출하지 않음) */
export function toErrorCode(e: unknown): string {
  if (e instanceof RepoError) return e.code;
  if (e instanceof AuthError) return e.code;
  if (e instanceof TossError) return "TOSS_ERROR";
  console.error(e);
  Sentry.captureException(e);
  return "UNKNOWN";
}
