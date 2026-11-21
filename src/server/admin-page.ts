/**
 * [쉬운 설명] 관리자 페이지 문지기. 로그인 안 했으면 로그인 화면으로, 관리자가 아니면 홈으로 보냅니다.
 * 리뷰 순서: 7단계 (docs/REVIEW_GUIDE.md 참고)
 */
import "server-only";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSession, type Session } from "@/server/auth";

/**
 * 관리자 페이지 보호. 레이아웃이 아니라 "각 페이지"에서 부릅니다.
 * (Next.js 는 레이아웃과 페이지를 동시에 렌더하므로 레이아웃 검사만으로는 페이지 데이터가 새어 나갈 수 있음)
 * 로그인 안 했으면 로그인 화면으로, 관리자가 아니면 홈으로 보냅니다.
 */
export async function assertAdminPage(params: Promise<{ locale: string }>): Promise<Session> {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: { pathname: "/login", query: { next: `/${locale}/admin` } }, locale });
  if (session.role !== "admin") return redirect({ href: "/", locale });
  return session;
}
