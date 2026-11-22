/**
 * [쉬운 설명] 상품 목록 화면. 카테고리 선택과 검색어(?q=)에 따라 상품을 걸러 보여줍니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getCategories, getProducts, searchProducts } from "@/server/catalog";
import { clientIp, rateLimit } from "@/server/redis";

export async function generateMetadata({ params }: PageProps<"/[locale]/products">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("products") };
}

export default async function ProductsPage({ params, searchParams }: PageProps<"/[locale]/products">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductList locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductList({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 50) : "";
  const t = await getTranslations({ locale, namespace: "product" });
  const categories = await getCategories();

  let products;
  if (q) {
    if (!(await rateLimit("search", await clientIp()))) {
      return <p className="py-10 text-center text-muted-foreground">{t("tooManyRequests")}</p>;
    }
    products = await searchProducts(q, category);
  } else {
    products = await getProducts(category);
  }

  const activeCat = categories.find((c) => c.slug === category);
  const activeName = activeCat ? (locale === "en" ? activeCat.nameEn : activeCat.nameKo) : undefined;

  const chip = (active: boolean) =>
    cn(
      "shrink-0 border px-4 py-2 text-sm whitespace-nowrap transition-colors",
      active ? "border-ink bg-ink text-card" : "border-border bg-card text-ink hover:border-ink",
    );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-light tracking-tight text-ink">{category ? (activeName ?? t("all")) : t("all")}</h1>
      {/* ▶ 카테고리 칩: 모바일에서는 옆으로 밀어서 넘김 */}
      <div className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={q ? { pathname: "/products", query: { q } } : "/products"} className={chip(!category)}>
          {t("all")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={{ pathname: "/products", query: q ? { category: c.slug, q } : { category: c.slug } }}
            className={chip(category === c.slug)}
          >
            {locale === "en" ? c.nameEn : c.nameKo}
          </Link>
        ))}
      </div>
      {q ? <p className="text-sm text-muted-foreground">{t("searchResults", { q, count: products.length })}</p> : null}
      {products.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <ProductGrid
          products={products}
          locale={locale}
          soldOutLabel={t("soldOut")}
          lowStockLabel={(count) => t("stockLeft", { count })}
        />
      )}
    </div>
  );
}
