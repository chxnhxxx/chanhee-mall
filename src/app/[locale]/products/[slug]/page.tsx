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
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
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
        <h1 className="text-2xl font-bold" data-testid="product-name">
          {name}
        </h1>
        <p className="whitespace-pre-line text-muted-foreground">
          {lang === "en" ? product.descriptionEn : product.descriptionKo}
        </p>
        <AddToCart product={product} locale={lang} />
        <div className="space-y-1 rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
          <p>{t("shippingInfo")}</p>
          <p>{t("refundInfo")}</p>
        </div>
      </div>
    </div>
  );
}
