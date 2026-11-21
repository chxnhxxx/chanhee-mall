/**
 * [쉬운 설명] 브라우저가 기억하는 장바구니 상태(Zustand).
 * 로그인 안 한 손님: 담은 목록을 브라우저에 저장. 로그인 사용자: 진짜 장바구니는 DB 에 있고 여기엔 '개수'만 둡니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine } from "@/lib/domain";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";

/**
 * 브라우저 쪽 장바구니 상태 (Zustand).
 * - 로그인 사용자: 원본은 DB. 여기에는 "개수"만 거울처럼 들고 있어 헤더 배지를 즉시 갱신
 * - 비회원: 담은 목록을 localStorage 에 보관. 로그인할 때 서버로 합쳐짐
 */
type CartState = {
  mode: "guest" | "user";
  userCount: number;
  guestLines: CartLine[];
  setUserMode: (count: number) => void;
  setGuestMode: () => void;
  setUserCount: (count: number) => void;
  addGuest: (variantId: string, quantity: number) => void;
  setGuestQuantity: (variantId: string, quantity: number) => void;
  clearGuest: () => void;
};

// ▶ 장바구니 상태 보관함. persist = 브라우저를 닫았다 열어도 손님 장바구니가 남도록 저장
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      mode: "guest",
      userCount: 0,
      guestLines: [],
      setUserMode: (count) => set({ mode: "user", userCount: count }),
      setGuestMode: () => set({ mode: "guest", userCount: 0 }),
      setUserCount: (count) => set({ userCount: count }),
      addGuest: (variantId, quantity) =>
        set((s) => {
          const existing = s.guestLines.find((l) => l.variantId === variantId);
          const next = Math.min((existing?.quantity ?? 0) + quantity, MAX_QTY_PER_LINE);
          return {
            guestLines: existing
              ? s.guestLines.map((l) => (l.variantId === variantId ? { ...l, quantity: next } : l))
              : [...s.guestLines, { variantId, quantity: next }],
          };
        }),
      setGuestQuantity: (variantId, quantity) =>
        set((s) => ({
          guestLines:
            quantity <= 0
              ? s.guestLines.filter((l) => l.variantId !== variantId)
              : s.guestLines.map((l) =>
                  l.variantId === variantId ? { ...l, quantity: Math.min(quantity, MAX_QTY_PER_LINE) } : l,
                ),
        })),
      clearGuest: () => set({ guestLines: [] }),
    }),
    {
      name: "chm-guest-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ guestLines: s.guestLines }),
    },
  ),
);

// ▶ 머리글 배지에 보여 줄 숫자: 로그인 사용자는 DB 개수, 손님은 브라우저에 담은 개수의 합
export const selectCartCount = (s: CartState) =>
  s.mode === "user" ? s.userCount : s.guestLines.reduce((sum, l) => sum + l.quantity, 0);
