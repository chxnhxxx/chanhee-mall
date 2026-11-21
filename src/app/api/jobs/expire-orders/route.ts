import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/server/cron-auth";
import { repo } from "@/server/repo";
import { invalidateCatalogFromRoute } from "@/server/revalidate";

/**
 * 결제 대기 30분 초과 주문 만료. 기본은 Supabase pg_cron 이 DB 안에서 직접 처리하고,
 * pg_cron 을 못 쓰는 경우의 대체 경로(Upstash QStash 등 외부 예약 호출)로 남겨 둠.
 */
export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const expired = await repo().expirePendingOrders();
  if (expired > 0) await invalidateCatalogFromRoute();
  return NextResponse.json({ ok: true, expired });
}
