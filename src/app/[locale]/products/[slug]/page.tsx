/**
 * [쉬운 설명] 상품 상세 화면. 주소의 [slug] 자리에 상품 이름표(예: stainless-tumbler)가 들어갑니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { AddToCart } from "@/components/product/add-to-cart";
import { Skeleton } from "@/components/ui/skeleton";
import { getProduct } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: locale === "en" ? product.nameEn : product.nameKo,
    description: locale === "en" ? product.descriptionEn : product.descriptionKo,
  };
}

export default function ProductPage({ params }: PageProps<"/[locale]/products/[slug]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = await getProduct(slug);
  if (!product) notFound();
  const t = await getTranslations({ locale, namespace: "product" });
  const lang = locale === "en" ? "en" : "ko";
  const name = lang === "en" ? product.nameEn : product.nameKo;

  return (
    // ▶ 모바일에서는 아래쪽 고정 구매 버튼이 내용을 가리지 않도록 여백(pb-28)을 둠
    <div className="grid gap-6 pb-28 md:grid-cols-2 md:gap-10 md:pb-0">
      <div className="relative aspect-square overflow-hidden rounded-[1.75rem] bg-card ring-1 ring-border md:sticky md:top-32">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl" data-testid="product-name">
            {name}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">
            {lang === "en" ? product.descriptionEn : product.descriptionKo}
          </p>
        </div>
        <AddToCart product={product} locale={lang} />
        <dl className="space-y-2 rounded-2xl bg-card p-4 text-sm ring-1 ring-border">
          <div className="flex gap-3">
            <dt className="w-10 shrink-0 font-bold text-ink">{lang === "en" ? "Ship" : "배송"}</dt>
            <dd className="text-muted-foreground">{t("shippingInfo")}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-10 shrink-0 font-bold text-ink">{lang === "en" ? "Return" : "환불"}</dt>
            <dd className="text-muted-foreground">{t("refundInfo")}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
