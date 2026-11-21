import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductGrid } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCategories, getProducts } from "@/server/catalog";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const tp = await getTranslations({ locale, namespace: "product" });
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 px-6 py-12 sm:px-10">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("heroTitle")}</h1>
        <p className="mt-3 max-w-lg text-muted-foreground">{t("heroBody")}</p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/products">{t("shopNow")}</Link>
        </Button>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">{t("categories")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={{ pathname: "/products", query: { category: c.slug } }}
              className="rounded-xl border p-4 text-center font-medium hover:bg-muted"
            >
              {locale === "en" ? c.nameEn : c.nameKo}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">{t("newArrivals")}</h2>
        <ProductGrid products={products.slice(0, 8)} locale={locale} soldOutLabel={tp("soldOut")} />
      </section>
    </div>
  );
}
