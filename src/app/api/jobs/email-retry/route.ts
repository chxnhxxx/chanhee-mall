import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/server/cron-auth";
import { processEmailRetries } from "@/server/email";

/** 메일 재시도 큐 처리. Supabase pg_cron + pg_net 이 10분마다 호출 (supabase/migrations 참고) */
export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const result = await processEmailRetries();
  return NextResponse.json({ ok: true, ...result });
}
