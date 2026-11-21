import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CartBadge } from "@/components/cart/cart-badge";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { SearchBox } from "@/components/layout/search-box";
import { UserMenu } from "@/components/layout/user-menu";
import { Link } from "@/i18n/navigation";
import { getCategories } from "@/server/catalog";

export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const categories = await getCategories();
  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-primary">
          chanhee-mall
        </Link>
        <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <SearchBox placeholder={t("searchPlaceholder")} />
        </div>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <LocaleSwitcher label={t("language")} />
          <Suspense fallback={<span className="w-16" />}>
            <UserMenu locale={locale} />
          </Suspense>
          <Link href="/cart" className="relative rounded-md px-2 py-1 hover:bg-muted" aria-label={t("cart")}>
            {t("cart")}
            <CartBadge />
          </Link>
        </nav>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-2 text-sm text-muted-foreground">
        <Link href="/products" className="whitespace-nowrap hover:text-foreground">
          {t("products")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={{ pathname: "/products", query: { category: c.slug } }}
            className="whitespace-nowrap hover:text-foreground"
          >
            {locale === "en" ? c.nameEn : c.nameKo}
          </Link>
        ))}
      </nav>
    </header>
  );
}
