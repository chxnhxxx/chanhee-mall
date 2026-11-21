import { connection, NextResponse } from "next/server";
import { repo } from "@/server/repo";

/**
 * 상태 확인 + Supabase 깨우기. GitHub Actions 가 매일 호출해 무료 프로젝트 일시정지(7일 무활동)를 막습니다.
 * DB 를 실제로 한 번 읽어야 "활동"으로 잡힘 [미확인: Supabase 가 무엇을 활동으로 세는지].
 */
export async function GET() {
  await connection(); // 요청 때마다 실행 (빌드 시 미리 만들지 않음)
  const started = Date.now();
  try {
    const categories = await repo().listCategories();
    return NextResponse.json({
      ok: true,
      backend: repo().kind,
      categories: categories.length,
      ms: Date.now() - started,
    });
  } catch (e) {
    console.error("[health]", e);
    return NextResponse.json({ ok: false, backend: repo().kind }, { status: 503 });
  }
}
