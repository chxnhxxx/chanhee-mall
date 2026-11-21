/**
 * [쉬운 설명] 머리글의 장바구니 아이콘과 숫자 배지.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { useSyncExternalStore } from "react";
import { selectCartCount, useCartStore } from "@/stores/cart-store";

const subscribeNoop = () => () => {};

export function CartBadge() {
  const count = useCartStore(selectCartCount);
  // 서버 렌더와 첫 화면이 어긋나지 않도록, 브라우저에 붙은 뒤에만 숫자를 보여줌
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  if (!mounted || count === 0) return null;
  return (
    <span
      data-testid="cart-count"
      className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
