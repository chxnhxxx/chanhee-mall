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
