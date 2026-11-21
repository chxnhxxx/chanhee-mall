/**
 * [쉬운 설명] 예약 작업 주소(만료 주문 정리 등)를 부를 때 '비밀 토큰'이 맞는지 확인합니다. 아무나 부를 수 없게.
 * 리뷰 순서: 8단계 (docs/REVIEW_GUIDE.md 참고)
 */
import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/env";

/** 예약 작업 호출 검증: Authorization: Bearer <CRON_SECRET> */
export function isAuthorizedCron(request: Request): boolean {
  if (!env.CRON_SECRET) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
