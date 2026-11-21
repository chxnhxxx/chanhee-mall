import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E 테스트: 외부 서비스 없이 "메모리 DB + 모의 결제" 모드로 실제 빌드를 띄워 검사합니다.
 * - 로컬: 설치된 Chrome 사용 (브라우저 따로 내려받지 않음)
 * - CI: `pnpm exec playwright install --with-deps chromium` 후 기본 Chromium 사용
 * - 실제 토스 결제창 자동화는 하지 않음 [미확인: 토스 테스트 결제창 자동화 가능 여부]
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    locale: "ko-KR",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    channel: process.env.CI ? undefined : "chrome",
  },
  webServer: {
    command: process.env.E2E_SKIP_BUILD ? `pnpm start -p ${PORT}` : `pnpm build && pnpm start -p ${PORT}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      DATA_BACKEND: "memory",
      DISABLE_RATE_LIMIT: "1",
      NEXT_PUBLIC_SITE_URL: baseURL,
      // 아래 키를 비워 외부 서비스가 절대 호출되지 않게 함
      NEXT_PUBLIC_TOSS_CLIENT_KEY: "",
      TOSS_SECRET_KEY: "",
      RESEND_API_KEY: "",
      UPSTASH_REDIS_REST_URL: "",
      NEXT_PUBLIC_SENTRY_DSN: "",
      NEXT_PUBLIC_GA_ID: "",
    },
  },
});
