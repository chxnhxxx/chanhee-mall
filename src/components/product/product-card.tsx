/**
 * [쉬운 설명] 상품 목록에 쓰이는 상품 카드(사진·이름·가격·품절 표시)와 로딩 중 회색 상자.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/domain";
import { formatKRW } from "@/lib/pricing";

/** 남은 재고가 이 개수 이하이면 카드에 '남은 수량' 표시 */
const LOW_STOCK = 10;

export function ProductCard({
  product,
  locale,
  soldOutLabel,
  lowStockLabel,
}: {
  product: Product;
  locale: string;
  soldOutLabel: string;
  lowStockLabel?: (count: number) => string;
}) {
  const stock = product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
  const soldOut = stock <= 0;
  const name = locale === "en" ? product.nameEn : product.nameKo;
  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col gap-2.5" data-testid="product-card">
      <div className="relative aspect-square overflow-hidden bg-sand">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
        ) : null}
        {soldOut ? (
          // ▶ 품절이면 사진 위를 어둡게 덮고 '품절' 표시
          <div className="absolute inset-0 grid place-items-center bg-background/55">
            <span className="border border-ink/40 bg-card px-3 py-1 text-xs text-ink">{soldOutLabel}</span>
          </div>
        ) : stock <= LOW_STOCK && lowStockLabel ? (
          <span className="absolute bottom-2 left-2 bg-kraft px-2 py-0.5 text-[11px] text-ink">
            {lowStockLabel(stock)}
          </span>
        ) : null}
      </div>
      <div className="px-0.5">
        <p className="line-clamp-2 text-sm leading-snug text-ink/85 underline-offset-4 group-hover:underline">{name}</p>
        <p className="mt-1.5 text-[15px] leading-none font-bold text-ink tabular-nums">
          {formatKRW(product.price, locale === "en" ? "en" : "ko")}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  locale,
  soldOutLabel,
  lowStockLabel,
}: {
  products: Product[];
  locale: string;
  soldOutLabel: string;
  lowStockLabel?: (count: number) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} locale={locale} soldOutLabel={soldOutLabel} lowStockLabel={lowStockLabel} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[4/5] animate-pulse bg-muted" />
      ))}
    </div>
  );
}
