/**
 * [쉬운 설명] 관리자 상품 수정 화면.
 * 리뷰 순서: 7단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { features } from "@/env";
import { repo } from "@/server/repo";
import { assertAdminPage } from "@/server/admin-page";

async function EditProductPageContent({ params }: PageProps<"/[locale]/admin/products/[id]">) {
  await assertAdminPage(params);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [product, categories] = await Promise.all([repo().getProductById(id), repo().listCategories()]);
  if (!product) notFound();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">상품 수정 · {product.nameKo}</h1>
      <ProductForm categories={categories} product={product} uploadEnabled={features.supabase} />
    </div>
  );
}

// 요청마다 달라지는 데이터(로그인·주문)는 Suspense 안에서 읽어야 함 (Cache Components 규칙)
export default function EditProductPage(props: PageProps<"/[locale]/admin/products/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <EditProductPageContent {...props} />
    </Suspense>
  );
}
