/**
 * [쉬운 설명] 한국어 ↔ 영어 전환 버튼. 지금 보던 페이지를 다른 언어로 다시 엽니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { useLocale } from "next-intl";

/**
 * 언어 전환. 현재 주소는 클릭할 때 읽음 (렌더 중 usePathname 을 쓰면 정적 미리 렌더가 막힘)
 */
export function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const next = locale === "ko" ? "en" : "ko";
  return (
    <button
      type="button"
      aria-label={label}
      className="rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-ink"
      onClick={() => {
        const { pathname, search } = window.location;
        const rest = pathname.replace(/^\/(ko|en)(?=\/|$)/, "");
        // 언어가 바뀌면 레이아웃 전체(html lang, 메시지)를 새로 받아야 하므로 전체 이동
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/${next}${rest}${search}`);
      }}
    >
      {next === "en" ? "EN" : "한국어"}
    </button>
  );
}
