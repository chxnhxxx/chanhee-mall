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
      className="rounded-md px-2 py-1 text-xs uppercase hover:bg-muted"
      onClick={() => {
        const { pathname, search } = window.location;
        const rest = pathname.replace(/^\/(ko|en)(?=\/|$)/, "");
        window.location.assign(`/${next}${rest}${search}`);
      }}
    >
      {next}
    </button>
  );
}
