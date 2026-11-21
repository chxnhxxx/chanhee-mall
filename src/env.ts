import "server-only";
import { z } from "zod";

/**
 * 서버 전용 환경변수 검사.
 *
 * 외부 서비스 키는 모두 "선택"입니다. 키가 없으면 해당 기능은 로컬 대체 구현으로 동작합니다.
 *  - Supabase 키 없음 → 메모리 DB(데모 데이터)로 동작
 *  - Toss 키 없음     → 모의 결제 화면으로 동작
 *  - Resend 키 없음   → 메일 내용을 서버 콘솔에 출력
 *  - Upstash 키 없음  → 레이트 리밋·캐시를 프로세스 메모리로 대체
 *  - Sentry DSN 없음  → 에러 전송 안 함
 *
 * 단, 값이 "있는데 형식이 틀린" 경우에는 앱 시작 시 바로 실패시켜 실수를 빨리 알립니다.
 */
const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const optionalUrl = optionalString.pipe(z.url().optional());

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // 사이트 공개 주소 (결제 성공/실패 리다이렉트, 메일 링크에 사용)
  NEXT_PUBLIC_SITE_URL: optionalUrl,

  // 데이터 백엔드 선택: auto = Supabase 키가 있으면 supabase, 없으면 memory
  DATA_BACKEND: z.enum(["auto", "supabase", "memory"]).default("auto"),

  // 메모리 모드 세션 서명용 비밀값 (32자 이상). 비어 있으면 개발용 고정값 사용
  SESSION_SECRET: optionalString.pipe(z.string().min(32).optional()),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
  SUPABASE_SECRET_KEY: optionalString,

  // 토스페이먼츠 (test_ 로 시작하는 테스트 키만 허용 — 실서비스 키 실수 방지)
  NEXT_PUBLIC_TOSS_CLIENT_KEY: optionalString.pipe(
    z.string().startsWith("test_", "테스트 키(test_)만 허용합니다").optional(),
  ),
  TOSS_SECRET_KEY: optionalString.pipe(z.string().startsWith("test_", "테스트 키(test_)만 허용합니다").optional()),

  // Resend
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,
  // 도메인 인증 전에는 Resend가 가입한 본인 주소로만 발송 가능 [미확인] → 모든 메일을 이 주소로 보냄
  EMAIL_DEV_REDIRECT_TO: optionalString.pipe(z.email().optional()),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalString,

  // Sentry
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  SENTRY_AUTH_TOKEN: optionalString,

  // GA4
  NEXT_PUBLIC_GA_ID: optionalString,

  // 운영 작업용 비밀 토큰 (GitHub Actions 깨우기 핑 등)
  CRON_SECRET: optionalString,
});

export type ServerEnv = z.infer<typeof serverSchema>;

function parseEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`환경변수 형식 오류:\n${issues}`);
  }
  return parsed.data;
}

export const env = parseEnv();

const DEV_SESSION_SECRET = "dev-only-session-secret-change-me-0123456789";

export const features = {
  supabase:
    env.DATA_BACKEND === "supabase" ||
    (env.DATA_BACKEND === "auto" &&
      !!env.NEXT_PUBLIC_SUPABASE_URL &&
      !!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      !!env.SUPABASE_SECRET_KEY),
  toss: !!env.NEXT_PUBLIC_TOSS_CLIENT_KEY && !!env.TOSS_SECRET_KEY,
  resend: !!env.RESEND_API_KEY && !!env.EMAIL_FROM,
  upstash: !!env.UPSTASH_REDIS_REST_URL && !!env.UPSTASH_REDIS_REST_TOKEN,
  sentry: !!env.NEXT_PUBLIC_SENTRY_DSN,
  ga: !!env.NEXT_PUBLIC_GA_ID,
} as const;

if (features.supabase && (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY)) {
  throw new Error("DATA_BACKEND=supabase 인데 Supabase 환경변수가 비어 있습니다.");
}

if (
  env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !features.supabase &&
  !env.SESSION_SECRET
) {
  // 메모리 모드로 배포하는 경우에도 세션 서명값은 반드시 따로 둡니다.
  console.warn("[env] 운영 환경에서 SESSION_SECRET 이 비어 있어 개발용 값을 사용합니다.");
}

export const sessionSecret = env.SESSION_SECRET ?? DEV_SESSION_SECRET;

export function siteUrl(): string {
  return (env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
