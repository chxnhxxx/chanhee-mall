"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FREE_SHIPPING_THRESHOLD, formatKRW } from "@/lib/pricing";
import { priceGuestCartAction, updateCartAction } from "@/server/actions/cart";
import type { PricedCart } from "@/server/cart";
import { useCartStore } from "@/stores/cart-store";

export function CartView({ mode, initial }: { mode: "guest" | "user"; initial: PricedCart | null }) {
  const t = useTranslations("cart");
  const te = useTranslations("errors");
  const locale = useLocale() as "ko" | "en";
  const [cart, setCart] = useState<PricedCart | null>(initial);
  const [pending, start] = useTransition();
  const guestLines = useCartStore((s) => s.guestLines);
  const setGuestQuantity = useCartStore((s) => s.setGuestQuantity);
  const setUserCount = useCartStore((s) => s.setUserCount);

  // 비회원: 브라우저에 저장된 목록을 서버에 보내 가격 계산
  useEffect(() => {
    if (mode !== "guest") return;
    let cancelled = false;
    priceGuestCartAction(guestLines).then((res) => {
      if (!cancelled && res.ok) setCart(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, guestLines]);

  function changeQty(variantId: string, quantity: number) {
    if (mode === "guest") {
      setGuestQuantity(variantId, quantity);
      return;
    }
    start(async () => {
      const res = await updateCartAction(variantId, quantity);
      if (!res.ok) {
        toast.error(te(res.code as never));
        return;
      }
      setCart(res.data.cart);
      setUserCount(res.data.count);
    });
  }

  if (!cart) return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  if (cart.lines.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>;
  }

  const hasStockIssue = cart.lines.some((l) => l.quantity > l.stock);
  const remaining = FREE_SHIPPING_THRESHOLD - cart.itemsAmount;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y rounded-xl border" data-testid="cart-lines">
        {cart.lines.map((l) => (
          <li key={l.variantId} className="flex gap-3 p-3">
            <Link
              href={`/products/${l.productSlug}`}
              className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted"
            >
              {l.image ? <Image src={l.image} alt="" fill sizes="80px" className="object-cover" /> : null}
            </Link>
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-medium">{locale === "en" ? l.productNameEn : l.productNameKo}</p>
              <p className="text-xs text-muted-foreground">{locale === "en" ? l.variantNameEn : l.variantNameKo}</p>
              {l.quantity > l.stock ? (
                <p className="text-xs text-destructive">{t("stockExceeded", { stock: l.stock })}</p>
              ) : null}
              <div className="mt-auto flex items-center gap-2">
                <div className="flex items-center rounded-md border text-sm">
                  <button
                    type="button"
                    className="px-2"
                    disabled={pending || l.quantity <= 1}
                    onClick={() => changeQty(l.variantId, l.quantity - 1)}
                    aria-label="-"
                  >
                    −
                  </button>
                  <span className="w-8 text-center" data-testid="line-qty">
                    {l.quantity}
                  </span>
                  <button
                    type="button"
                    className="px-2"
                    disabled={pending || l.quantity >= Math.min(20, l.stock)}
                    onClick={() => changeQty(l.variantId, l.quantity + 1)}
                    aria-label="+"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  disabled={pending}
                  onClick={() => changeQty(l.variantId, 0)}
                >
                  {t("remove")}
                </button>
              </div>
            </div>
            <p className="font-semibold">{formatKRW(l.lineTotal, locale)}</p>
          </li>
        ))}
      </ul>

      <aside className="flex h-fit flex-col gap-2 rounded-xl border p-4 text-sm">
        <div className="flex justify-between">
          <span>{t("itemsAmount")}</span>
          <span>{formatKRW(cart.itemsAmount, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t("shippingFee")}</span>
          <span>{cart.shippingFee === 0 ? t("free") : formatKRW(cart.shippingFee, locale)}</span>
        </div>
        {remaining > 0 ? (
          <p className="text-xs text-primary">{t("freeShippingHint", { amount: formatKRW(remaining, locale) })}</p>
        ) : null}
        <div className="mt-2 flex justify-between border-t pt-3 text-base font-bold">
          <span>{t("total")}</span>
          <span data-testid="cart-total">{formatKRW(cart.totalAmount, locale)}</span>
        </div>
        {mode === "user" ? (
          <Button asChild size="lg" className="mt-2" disabled={hasStockIssue}>
            <Link href="/checkout" aria-disabled={hasStockIssue} data-testid="go-checkout">
              {t("checkout")}
            </Link>
          </Button>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{t("guestNotice")}</p>
            <Button asChild size="lg" className="mt-2">
              <Link href={{ pathname: "/login", query: { next: `/${locale}/cart` } }} data-testid="go-login">
                {t("loginToCheckout")}
              </Link>
            </Button>
          </>
        )}
      </aside>
    </div>
  );
}
