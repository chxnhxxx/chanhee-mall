/**
 * [쉬운 설명] 홈 화면의 '이번 주 채울 것' 체크리스트 카드. 체크하면 줄이 그어지고, 이름을 누르면 상품으로 이동합니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type RestockItem = { slug: string; name: string; price: string; done: boolean };

export function RestockList({ title, hint, items }: { title: string; hint: string; items: RestockItem[] }) {
  // ▶ 체크 상태는 이 화면에서만 기억합니다 (새로고침하면 처음 상태로)
  const [done, setDone] = useState(() => items.map((i) => i.done));
  const left = done.filter((d) => !d).length;

  return (
    <div className="border border-border bg-card p-5 sm:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-medium tracking-tight text-ink">{title}</h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {left}/{items.length}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <ul className="mt-5 divide-y divide-border border-t border-border">
        {items.map((item, i) => (
          <li key={item.slug} className="flex items-center gap-3 py-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={done[i]}
              aria-label={item.name}
              onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-[2px] border transition-colors",
                done[i] ? "border-ink bg-ink text-card" : "border-input bg-card hover:border-ink",
              )}
            >
              {done[i] ? <Check className="size-3.5" strokeWidth={2} /> : null}
            </button>
            <Link
              href={`/products/${item.slug}`}
              className={cn(
                "flex-1 text-[15px] underline-offset-4 transition-colors hover:underline",
                done[i] && "text-muted-foreground line-through",
              )}
            >
              {item.name}
            </Link>
            <span className={cn("text-sm tabular-nums", done[i] ? "text-muted-foreground" : "font-medium text-ink")}>
              {item.price}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
