/**
 * [쉬운 설명] 장바구니 가격 계산기. 담긴 상품들을 DB 가격으로 다시 계산하고 합계·배송비를 구합니다.
 * 리뷰 순서: 5단계 (docs/REVIEW_GUIDE.md 참고)
 */
import "server-only";
import type { CartLine, PricedCartLine } from "@/lib/domain";
import { MAX_QTY_PER_LINE, summarize, unitPrice } from "@/lib/pricing";
import { repo } from "@/server/repo";

/** 장바구니 줄을 DB 가격으로 계산. 사라졌거나 비공개가 된 상품은 빠짐 */
export async function priceCart(lines: CartLine[]) {
  // ▶ 1단계: 같은 상품이 여러 줄이면 합치고, 한 상품은 최대 20개까지만
  const merged = new Map<string, number>();
  for (const l of lines) {
    if (!l.variantId || !Number.isInteger(l.quantity) || l.quantity < 1) continue;
    merged.set(l.variantId, Math.min((merged.get(l.variantId) ?? 0) + l.quantity, MAX_QTY_PER_LINE));
  }
  // ▶ 2단계: DB 에서 현재 판매 중인 상품만 가져옴 (사라지거나 숨겨진 상품은 자동으로 빠짐)
  const found = await repo().getVariantsWithProduct([...merged.keys()]);
  const priced: PricedCartLine[] = [];
  for (const { product, variantId } of found) {
    const v = product.variants.find((x) => x.id === variantId)!;
    const quantity = merged.get(variantId)!;
    const price = unitPrice(product.price, v.priceDelta);
    priced.push({
      variantId,
      productId: product.id,
      productSlug: product.slug,
      productNameKo: product.nameKo,
      productNameEn: product.nameEn,
      variantNameKo: v.nameKo,
      variantNameEn: v.nameEn,
      image: product.images[0] ?? null,
      unitPrice: price,
      quantity,
      stock: v.stock,
      lineTotal: price * quantity,
    });
  }
  // 원래 담은 순서 유지
  const order = [...merged.keys()];
  priced.sort((a, b) => order.indexOf(a.variantId) - order.indexOf(b.variantId));
  // ▶ 3단계: 합계·배송비·총액을 붙여서 돌려줌
  return { lines: priced, ...summarize(priced) };
}

export type PricedCart = Awaited<ReturnType<typeof priceCart>>;
