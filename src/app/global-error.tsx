"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// 레이아웃 자체가 깨졌을 때의 마지막 안전망 (번역 사용 불가 → 두 언어 병기)
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="ko">
      <body style={{ fontFamily: "sans-serif", padding: 40, textAlign: "center" }}>
        <h1>문제가 발생했습니다 / Something went wrong</h1>
        {/* 레이아웃이 깨진 상태라 전체 새로고침이 필요하므로 일반 a 태그 사용 */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/">chanhee-mall</a>
      </body>
    </html>
  );
}
