/**
 * [쉬운 설명] 브라우저에 공개해도 되는 설정값(NEXT_PUBLIC_ 로 시작)만 모아 둔 곳. 비밀 키는 절대 여기 오지 않습니다.
 * 리뷰 순서: 2단계 (docs/REVIEW_GUIDE.md 참고)
 */
/**
 * 브라우저에서 읽을 수 있는 공개 환경변수.
 * Next.js는 `process.env.NEXT_PUBLIC_...` 를 문자 그대로 적은 곳만 빌드 시 값으로 바꿔 넣으므로
 * 아래처럼 하나씩 적어야 합니다. (비밀 값은 절대 NEXT_PUBLIC_ 으로 시작하면 안 됩니다)
 */
const blank = (v: string | undefined) => (v && v.trim() !== "" ? v : undefined);

export const publicEnv = {
  siteUrl: blank(process.env.NEXT_PUBLIC_SITE_URL),
  supabaseUrl: blank(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: blank(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  tossClientKey: blank(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY),
  sentryDsn: blank(process.env.NEXT_PUBLIC_SENTRY_DSN),
  gaId: blank(process.env.NEXT_PUBLIC_GA_ID),
} as const;
