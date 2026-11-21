/**
 * [쉬운 설명] 브라우저 쪽 Sentry(오류 추적) 준비. DSN 키가 없으면 아무것도 하지 않습니다.
 * 리뷰 순서: 8단계 (docs/REVIEW_GUIDE.md 참고)
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.user) event.user = { id: event.user.id };
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
