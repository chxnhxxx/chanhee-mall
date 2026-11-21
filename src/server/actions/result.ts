/**
 * [쉬운 설명] 서버 액션의 결과 형식 통일: 성공이면 {ok:true, data}, 실패면 {ok:false, code}.
 * 실패 이유는 '코드'로만 화면에 전달하고, 내부 오류 내용은 숨긴 채 Sentry 로 보냅니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
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
