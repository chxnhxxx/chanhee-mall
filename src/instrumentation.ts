import * as Sentry from "@sentry/nextjs";

/** 서버가 켜질 때 한 번 실행. Sentry DSN 이 있을 때만 초기화 */
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // 요청 본문·쿠키 제거 (주소·전화번호가 섞일 수 있음)
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
      }
      if (event.user) event.user = { id: event.user.id };
      return event;
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
