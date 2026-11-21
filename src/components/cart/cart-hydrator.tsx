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
