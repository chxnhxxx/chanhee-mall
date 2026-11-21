/**
 * [쉬운 설명] 머리글: 로고, 검색창, 언어 전환, 로그인/주문내역, 장바구니 개수, 카테고리 메뉴.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { ShoppingBag } from "lucide-react";
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
    // ▶ 스크롤해도 맨 위에 붙어 있는 머리글 (모바일에서 장바구니·검색에 바로 손이 가도록)
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-3 pb-2">
        <Link href="/" className="flex items-center gap-2 font-display text-lg leading-none text-ink sm:text-xl">
          <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-butter">
            찬
          </span>
          chanhee-mall
        </Link>
        <div className="order-3 w-full sm:order-none sm:w-auto sm:max-w-md sm:flex-1">
          <SearchBox placeholder={t("searchPlaceholder")} />
        </div>
        <nav className="ml-auto flex items-center gap-0.5 text-sm">
          <LocaleSwitcher label={t("language")} />
          <Suspense fallback={<span className="w-16" />}>
            <UserMenu locale={locale} />
          </Suspense>
          <Link
            href="/cart"
            className="relative ml-1 grid size-10 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-primary"
            aria-label={t("cart")}
          >
            <ShoppingBag className="size-[18px]" strokeWidth={2.2} />
            <CartBadge />
          </Link>
        </nav>
      </div>
      <nav className="mx-auto no-scrollbar flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-2.5 text-sm">
        <Link
          href="/products"
          className="rounded-full px-3 py-1 font-medium whitespace-nowrap text-ink hover:bg-secondary"
        >
          {t("products")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={{ pathname: "/products", query: { category: c.slug } }}
            className="rounded-full px-3 py-1 whitespace-nowrap text-muted-foreground hover:bg-secondary hover:text-ink"
          >
            {locale === "en" ? c.nameEn : c.nameKo}
          </Link>
        ))}
      </nav>
    </header>
  );
}
