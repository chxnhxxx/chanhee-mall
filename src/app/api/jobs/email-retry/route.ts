/**
 * [쉬운 설명] 보내기 실패한 메일을 다시 보내는 예약 작업 주소(비밀 토큰 필요).
 * 리뷰 순서: 8단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/server/cron-auth";
import { processEmailRetries } from "@/server/email";

/** 메일 재시도 큐 처리. Supabase pg_cron + pg_net 이 10분마다 호출 (supabase/migrations 참고) */
export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const result = await processEmailRetries();
  return NextResponse.json({ ok: true, ...result });
}
