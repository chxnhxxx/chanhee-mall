/**
 * [쉬운 설명] 다국어 기본 설정: 한국어(ko)·영어(en)를 쓰고, 주소에 항상 /ko 또는 /en 을 붙입니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "always", // /ko/..., /en/...
});

export type AppLocale = (typeof routing.locales)[number];
