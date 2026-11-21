/**
 * [쉬운 설명] 요청이 올 때마다 어떤 언어의 번역 파일(messages/ko.json 또는 en.json)을 쓸지 정합니다. 시간대는 서울.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Asia/Seoul",
  };
});
