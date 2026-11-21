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

// ▶ 카테고리별 아이콘과 바탕색
const CATEGORY_STYLE: Record<string, { icon: LucideIcon; tone: string }> = {
  kitchen: { icon: CookingPot, tone: "bg-butter text-ink" },
  bathroom: { icon: Bath, tone: "bg-[#dce6ff] text-primary" },
  storage: { icon: Boxes, tone: "bg-[#e6e1fa] text-[#4b3aa8]" },
  cleaning: { icon: SprayCan, tone: "bg-mint text-[#1f6b4a]" },
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
    <div className="flex flex-col gap-12">
      <section className="grid items-center gap-8 pt-2 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pt-8">
        <div>
          <h1 className="font-display text-[2.6rem] leading-[1.08] text-ink sm:text-6xl">{t("heroTitle")}</h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {t("heroBody")}
          </p>
          <Button asChild size="lg" className="mt-6 h-12 rounded-full px-7 text-base">
            <Link href="/products">{t("shopNow")}</Link>
          </Button>
        </div>
        <RestockList title={t("restockTitle")} hint={t("restockHint")} items={restock} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl text-ink">{t("categories")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c) => {
            const style = CATEGORY_STYLE[c.slug] ?? { icon: Boxes, tone: "bg-secondary text-ink" };
            const Icon = style.icon;
            const count = products.filter((p) => p.categoryId === c.id).length;
            return (
              <Link
                key={c.id}
                href={{ pathname: "/products", query: { category: c.slug } }}
                className="group flex items-center gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-border transition-shadow hover:ring-2 hover:ring-primary"
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${style.tone}`}>
                  <Icon className="size-5" strokeWidth={2.2} />
                </span>
                <span className="flex flex-col">
                  <span className="font-bold text-ink">{lang === "en" ? c.nameEn : c.nameKo}</span>
                  <span className="text-xs text-muted-foreground">{t("itemCount", { count })}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-ink">{t("newArrivals")}</h2>
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">
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
