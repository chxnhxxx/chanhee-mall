import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDev = process.env.NODE_ENV !== "production";

/**
 * CSP: 도메인 허용 목록 방식. 처음에는 Report-Only(차단하지 않고 위반만 보고)로 시작하고,
 * 결제창·주소검색·GA4·Sentry 가 문제없이 동작하는 것을 확인한 뒤 CSP_ENFORCE=1 로 강제 전환합니다.
 * nonce 방식은 모든 페이지를 동적으로 만들어 "use cache" 이점을 잃기 때문에 쓰지 않음.
 * [미확인] Next.js 인라인 스크립트 때문에 'unsafe-inline' 이 필요한지, 토스 위젯이 쓰는 정확한 도메인 목록.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://js.tosspayments.com https://*.tosspayments.com https://t1.daumcdn.net https://*.daumcdn.net https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.tosspayments.com https://*.daumcdn.net https://www.googletagmanager.com https://*.google-analytics.com",
  "font-src 'self' data:",
  `connect-src 'self' ${isDev ? "ws://localhost:*" : ""} https://*.supabase.co wss://*.supabase.co https://*.tosspayments.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io`,
  "frame-src https://*.tosspayments.com https://postcode.map.daum.net https://*.daum.net",
  "worker-src 'self' blob:",
  "form-action 'self' https://*.tosspayments.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "report-uri /api/csp-report",
]
  .join("; ")
  .replace(/\s+/g, " ");

const securityHeaders = [
  {
    key: process.env.CSP_ENFORCE === "1" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    value: csp,
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://*.tosspayments.com")',
  },
  // [미확인] Vercel 이 HSTS 를 기본 적용하는지. 명시해도 해가 없어 넣어 둠 (로컬 http 에서는 브라우저가 무시)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withSentryConfig(withNextIntl(nextConfig), {
  // 소스맵 업로드는 SENTRY_AUTH_TOKEN·ORG·PROJECT 가 있을 때만 동작 (없으면 건너뜀)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  telemetry: false,
});
