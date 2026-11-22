/**
 * [쉬운 설명] 로그아웃 버튼.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { LogOut } from "lucide-react";
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
      aria-label={label}
      className="grid size-9 place-items-center hover:bg-secondary disabled:opacity-50 sm:flex sm:size-auto sm:px-2.5 sm:py-1.5"
      onClick={() =>
        start(async () => {
          await logoutAction();
          setGuestMode();
          router.replace("/");
          router.refresh();
        })
      }
    >
      <LogOut className="size-[18px] sm:hidden" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
