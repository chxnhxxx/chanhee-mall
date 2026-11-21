/**
 * [쉬운 설명] 상품 목록에 쓰이는 상품 카드(사진·이름·가격·품절 표시)와 로딩 중 회색 상자.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/domain";
import { formatKRW } from "@/lib/pricing";

export function ProductCard({
  product,
  locale,
  soldOutLabel,
}: {
  product: Product;
  locale: string;
  soldOutLabel: string;
}) {
  const soldOut = product.variants.every((v) => v.stock <= 0);
  const name = locale === "en" ? product.nameEn : product.nameKo;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-2 rounded-xl border bg-card p-2 transition hover:shadow-md"
      data-testid="product-card"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : null}
        {soldOut ? (
          <Badge variant="secondary" className="absolute top-2 left-2">
            {soldOutLabel}
          </Badge>
        ) : null}
      </div>
      <div className="px-1 pb-1">
        <p className="line-clamp-2 text-sm">{name}</p>
        <p className="mt-1 font-bold">{formatKRW(product.price, locale === "en" ? "en" : "ko")}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  locale,
  soldOutLabel,
}: {
  products: Product[];
  locale: string;
  soldOutLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} locale={locale} soldOutLabel={soldOutLabel} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
