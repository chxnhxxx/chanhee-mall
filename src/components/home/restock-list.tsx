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
    <div className="relative rounded-[1.75rem] bg-card p-5 shadow-[0_1px_0_var(--border),0_18px_40px_-24px_rgb(24_32_58/0.45)] sm:p-6 lg:rotate-[1.2deg]">
      {/* 메모지 위쪽 테이프 */}
      <span aria-hidden className="absolute -top-2.5 left-8 h-5 w-20 -rotate-3 rounded-sm bg-butter/90" />
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        <span className="font-display text-lg text-primary tabular-nums">
          {left}/{items.length}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <ul className="mt-4 divide-y divide-dashed divide-border">
        {items.map((item, i) => (
          <li key={item.slug} className="flex items-center gap-3 py-2.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={done[i]}
              aria-label={item.name}
              onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
                done[i] ? "border-primary bg-primary text-white" : "border-input bg-card hover:border-primary",
              )}
            >
              {done[i] ? <Check className="size-4" strokeWidth={3} /> : null}
            </button>
            <Link
              href={`/products/${item.slug}`}
              className={cn(
                "flex-1 text-[15px] transition-colors hover:text-primary",
                done[i] && "text-muted-foreground line-through decoration-primary decoration-2",
              )}
            >
              {item.name}
            </Link>
            <span className={cn("text-sm tabular-nums", done[i] ? "text-muted-foreground" : "font-bold text-ink")}>
              {item.price}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
