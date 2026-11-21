/**
 * [쉬운 설명] cart-sync 가 읽은 값을 브라우저 장바구니 상태(Zustand)에 실제로 넣는 작은 부품. 화면에는 아무것도 안 그립니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";

export function CartHydrator({ mode, count }: { mode: "guest" | "user"; count: number }) {
  const setUserMode = useCartStore((s) => s.setUserMode);
  const setGuestMode = useCartStore((s) => s.setGuestMode);
  useEffect(() => {
    if (mode === "user") setUserMode(count);
    else setGuestMode();
  }, [mode, count, setUserMode, setGuestMode]);
  return null;
}
