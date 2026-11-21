/**
 * [쉬운 설명] 로그아웃 버튼.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { logoutAction } from "@/server/actions/auth";
import { useCartStore } from "@/stores/cart-store";

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const setGuestMode = useCartStore((s) => s.setGuestMode);
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-md px-2 py-1 hover:bg-muted disabled:opacity-50"
      onClick={() =>
        start(async () => {
          await logoutAction();
          setGuestMode();
          router.replace("/");
          router.refresh();
        })
      }
    >
      {label}
    </button>
  );
}
