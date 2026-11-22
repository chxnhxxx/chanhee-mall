/**
 * [쉬운 설명] 홈 화면: 소개 문구, 카테고리 바로가기, 새로 들어온 상품.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { Bath, Boxes, CookingPot, type LucideIcon, SprayCan } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RestockList } from "@/components/home/restock-list";
import { ProductGrid } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatKRW } from "@/lib/pricing";
import { getCategories, getProducts } from "@/server/catalog";

// ▶ 카테고리별 아이콘 (색은 모두 같은 모래색 칸, 아이콘만 다름)
const CATEGORY_ICON: Record<string, LucideIcon> = {
  kitchen: CookingPot,
  bathroom: Bath,
  storage: Boxes,
  cleaning: SprayCan,
};

// ▶ 체크리스트 카드에 보여 줄 '자주 다시 사는' 상품들 (true = 이미 채운 것)
const RESTOCK: [slug: string, done: boolean][] = [
  ["microfiber-cloth", true],
  ["vacuum-bags", false],
  ["eco-cleaner", true],
  ["shower-filter", false],
  ["lint-roller", false],
];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale === "en" ? "en" : "ko";
  const t = await getTranslations({ locale, namespace: "home" });
  const tp = await getTranslations({ locale, namespace: "product" });
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);

  const restock = RESTOCK.flatMap(([slug, done]) => {
    const p = products.find((x) => x.slug === slug);
    return p ? [{ slug, done, name: lang === "en" ? p.nameEn : p.nameKo, price: formatKRW(p.price, lang) }] : [];
  });

  return (
    <div className="flex flex-col gap-16">
      <section className="grid items-center gap-10 border-b border-border pt-4 pb-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-12 lg:pb-20">
        <div>
          <h1 className="text-[2rem] leading-[1.35] font-light tracking-tight text-ink sm:text-[2.75rem]">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-loose text-muted-foreground">{t("heroBody")}</p>
          <Button asChild size="lg" className="mt-8 h-12 px-8 text-[15px] font-normal tracking-wide">
            <Link href="/products">{t("shopNow")}</Link>
          </Button>
        </div>
        <RestockList title={t("restockTitle")} hint={t("restockHint")} items={restock} />
      </section>

      <section>
        <h2 className="mb-5 text-lg font-medium tracking-tight text-ink">{t("categories")}</h2>
        <div className="grid grid-cols-2 border-t border-l border-border sm:grid-cols-4">
          {categories.map((c) => {
            const Icon = CATEGORY_ICON[c.slug] ?? Boxes;
            const count = products.filter((p) => p.categoryId === c.id).length;
            return (
              <Link
                key={c.id}
                href={{ pathname: "/products", query: { category: c.slug } }}
                className="group flex items-center gap-3 border-r border-b border-border bg-card px-4 py-5 transition-colors hover:bg-accent"
              >
                <span className="grid size-10 shrink-0 place-items-center bg-sand text-ink/80">
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
                <span className="flex flex-col">
                  <span className="font-medium text-ink">{lang === "en" ? c.nameEn : c.nameKo}</span>
                  <span className="text-xs text-muted-foreground">{t("itemCount", { count })}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-lg font-medium tracking-tight text-ink">{t("newArrivals")}</h2>
          <Link
            href="/products"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-ink hover:underline"
          >
            {t("allProducts")}
          </Link>
        </div>
        <ProductGrid
          products={products.slice(0, 8)}
          locale={locale}
          soldOutLabel={tp("soldOut")}
          lowStockLabel={(count) => tp("stockLeft", { count })}
        />
      </section>
    </div>
  );
}
