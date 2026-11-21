/**
 * [쉬운 설명] 머리글의 상품 검색창. 입력 후 엔터를 누르면 상품 목록 페이지로 검색어를 넘깁니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";

export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        router.push(q ? { pathname: "/products", query: { q } } : "/products");
      }}
    >
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 rounded-full border-transparent bg-card pl-9 shadow-[inset_0_0_0_1px_var(--border)]"
        maxLength={50}
      />
    </form>
  );
}
