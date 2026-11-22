/**
 * [쉬운 설명] Supabase 데이터베이스에 표(테이블)·규칙을 만들고 데모 상품 24개를 넣는 도구. `pnpm db:setup`.
 * Supabase 화면의 SQL Editor 에 SQL 파일을 직접 붙여 넣는 대신, 이 명령 한 줄로 같은 일을 합니다.
 * 리뷰 순서: 4단계 (docs/REVIEW_GUIDE.md 참고)
 *
 * 실행 전: .env.local 에 SUPABASE_DB_URL(데이터베이스 접속 주소, 비밀번호 포함)을 넣으세요.
 * 여러 번 실행해도 안전하도록, 이미 만들어진 경우에는 아무것도 하지 않고 멈춥니다.
 */
import { readdirSync, readFileSync } from "node:fs";
import postgres from "postgres";

process.loadEnvFile?.(".env.local");

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL 이 없습니다 (.env.local 확인).");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1, onnotice: () => {} });

try {
  // ▶ 이미 설치했는지 확인: products 표가 있으면 다시 만들지 않음
  const [{ exists }] = await sql`select to_regclass('public.products') is not null as exists`;
  if (exists) {
    console.log("이미 설치되어 있습니다. 아무것도 바꾸지 않았습니다.");
  } else {
    const dir = new URL("../supabase/migrations/", import.meta.url);
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const f of files) {
      await sql.unsafe(readFileSync(new URL(f, dir), "utf8"));
      console.log(`적용: migrations/${f}`);
    }
    await sql.unsafe(readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8"));
    console.log("적용: seed.sql (데모 상품)");
  }
  const [{ count }] = await sql`select count(*)::int as count from public.products`;
  console.log(`상품 ${count}개 확인`);
} catch (e) {
  console.error("실패:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
