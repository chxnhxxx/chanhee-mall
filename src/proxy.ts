/**
 * [쉬운 설명] 모든 페이지 요청이 제일 먼저 지나가는 '현관문'.
 * 1) 주소에 언어가 없으면 /ko 로 보내고  2) Supabase 로그인이 곧 만료되면 미리 연장합니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

/**
 * Next.js 16 Proxy (예전 이름: Middleware)
 * 1) next-intl: /ko, /en 언어 경로 처리 (접두사 없으면 /ko 로 보냄)
 * 2) Supabase: 로그인 토큰이 만료되기 전에 갱신해 쿠키에 다시 씀
 * 권한 검사는 여기서 하지 않고 각 페이지·서버 액션에서 합니다 (Proxy 는 "낙관적 검사"용).
 */
const intl = createIntlMiddleware(routing);

const supabaseEnabled =
  process.env.DATA_BACKEND !== "memory" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  !!process.env.SUPABASE_SECRET_KEY;

// ▶ 모든 페이지 요청마다 실행: ① 언어 주소 처리 ② (Supabase 모드) 로그인 연장
export async function proxy(request: NextRequest) {
  const response = intl(request);

  if (supabaseEnabled) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (toSet) => {
            for (const { name, value, options } of toSet) {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            }
          },
        },
      },
    );
    // 토큰 갱신을 위해 호출 (결과는 쓰지 않음)
    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  // API, Next 내부 파일, 정적 파일(확장자 있는 경로)은 제외
  matcher: ["/((?!api|_next|_vercel|monitoring|.*\\..*).*)"],
};
