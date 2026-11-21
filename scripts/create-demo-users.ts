/**
 * [쉬운 설명] Supabase 에 데모 계정 2개(관리자·고객)를 만드는 도구. `pnpm db:demo-users`.
 * 리뷰 순서: 4단계 (docs/REVIEW_GUIDE.md 참고)
 */
/**
 * Supabase 프로젝트에 데모 테스트 계정 2개를 만들고, 관리자 계정의 role 을 admin 으로 바꿉니다.
 * 실행 전: .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY 를 넣으세요.
 * 실행: pnpm db:demo-users
 * (인증 메일은 대시보드에서 꺼 두는 것이 전제입니다. 여기서는 email_confirm: true 로 바로 확인 처리)
 */
import { createClient } from "@supabase/supabase-js";
import { DEMO_ACCOUNTS } from "../src/server/seed-data.ts";

process.loadEnvFile?.(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 가 없습니다 (.env.local 확인).");
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

for (const acc of DEMO_ACCOUNTS) {
  const { data, error } = await admin.auth.admin.createUser({
    email: acc.email,
    password: acc.password,
    email_confirm: true,
    user_metadata: { name: acc.name },
  });
  let userId = data.user?.id;
  if (error) {
    if (!/already|registered|exists/i.test(error.message)) throw error;
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    userId = list.users.find((u) => u.email === acc.email)?.id;
    console.log(`이미 있음: ${acc.email}`);
  } else {
    console.log(`생성: ${acc.email}`);
  }
  if (userId && acc.role === "admin") {
    const { error: e2 } = await admin.from("profiles").update({ role: "admin" }).eq("id", userId);
    if (e2) throw e2;
    console.log(`  → role=admin`);
  }
}
