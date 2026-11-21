/**
 * [쉬운 설명] 상품 상세의 옵션 선택·수량·'장바구니 담기' 버튼.
 * 손님이면 브라우저에, 로그인 사용자면 서버(DB)에 담습니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { track } from "@/lib/analytics";
import type { Product } from "@/lib/domain";
import { formatKRW, MAX_QTY_PER_LINE, unitPrice } from "@/lib/pricing";
import { addToCartAction } from "@/server/actions/cart";
import { useCartStore } from "@/stores/cart-store";

export function AddToCart({ product, locale }: { product: Product; locale: "ko" | "en" }) {
  const t = useTranslations();
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [qty, setQty] = useState(1);
  const [pending, start] = useTransition();
  const mode = useCartStore((s) => s.mode);
  const addGuest = useCartStore((s) => s.addGuest);
  const setUserCount = useCartStore((s) => s.setUserCount);

  const variant = product.variants.find((v) => v.id === variantId);
  const price = variant ? unitPrice(product.price, variant.priceDelta) : product.price;
  const soldOut = !variant || variant.stock <= 0;
  const name = (v: { nameKo: string; nameEn: string }) => (locale === "en" ? v.nameEn : v.nameKo);
  const gaItem = { item_id: product.id, item_name: product.nameKo, item_variant: variant?.nameKo, price };

  useEffect(() => {
    track("view_item", { value: product.price, items: [{ ...gaItem, price: product.price }] });
    // 상품이 바뀔 때만 한 번 기록
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  function onAdd() {
    if (!variant) return;
    const quantity = Math.min(qty, variant.stock);
    start(async () => {
      if (mode === "user") {
        const res = await addToCartAction(variant.id, quantity);
        if (!res.ok) {
          toast.error(t(`errors.${res.code}` as never));
          return;
        }
        setUserCount(res.data.count);
      } else {
        addGuest(variant.id, quantity);
      }
      track("add_to_cart", { value: price * quantity, items: [{ ...gaItem, quantity }] });
      toast.success(t("product.added"));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {product.variants.length > 1 || product.variants[0]?.nameKo !== "기본" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="variant">{t("product.option")}</Label>
          <Select value={variantId} onValueChange={setVariantId}>
            <SelectTrigger id="variant" className="h-11 w-full rounded-xl bg-card" data-testid="variant-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {product.variants.map((v) => (
                <SelectItem key={v.id} value={v.id} disabled={v.stock <= 0}>
                  {name(v)}
                  {v.priceDelta !== 0 ? ` (${v.priceDelta > 0 ? "+" : ""}${formatKRW(v.priceDelta, locale)})` : ""}
                  {v.stock <= 0 ? ` (${t("product.soldOut")})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Label htmlFor="qty">{t("product.quantity")}</Label>
        <div className="flex h-10 items-center overflow-hidden rounded-full bg-card ring-1 ring-input">
          <button
            type="button"
            className="h-full px-3.5 text-lg hover:bg-secondary"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="-"
          >
            −
          </button>
          <input
            id="qty"
            inputMode="numeric"
            className="w-9 bg-transparent text-center font-bold tabular-nums"
            value={qty}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/D/g, ""));
              setQty(Math.min(Math.max(1, n || 1), MAX_QTY_PER_LINE));
            }}
          />
          <button
            type="button"
            className="h-full px-3.5 text-lg hover:bg-secondary"
            onClick={() => setQty((q) => Math.min(MAX_QTY_PER_LINE, q + 1))}
            aria-label="+"
          >
            +
          </button>
        </div>
        {variant && variant.stock > 0 && variant.stock <= 5 ? (
          <span className="rounded-md bg-butter px-2 py-0.5 text-xs font-bold text-ink">
            {t("product.stockLeft", { count: variant.stock })}
          </span>
        ) : null}
      </div>

      {/* ▶ 가격 + 담기 버튼: 모바일에서는 화면 아래에 붙어 있어서 엄지로 바로 누를 수 있음 */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <p className="font-display text-2xl leading-none text-ink tabular-nums md:text-3xl">
          {formatKRW(price * qty, locale)}
        </p>
        <Button
          size="lg"
          className="h-12 flex-1 rounded-full text-base md:max-w-xs"
          disabled={soldOut || pending}
          onClick={onAdd}
          data-testid="add-to-cart"
        >
          {soldOut ? t("product.soldOut") : t("product.addToCart")}
        </Button>
      </div>
    </div>
  );
}
