import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/components/admin/product-form";
import { features } from "@/env";
import { repo } from "@/server/repo";
import { assertAdminPage } from "@/server/admin-page";

async function NewProductPageContent({ params }: PageProps<"/[locale]/admin/products/new">) {
  await assertAdminPage(params);
  const categories = await repo().listCategories();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">새 상품</h1>
      <ProductForm categories={categories} uploadEnabled={features.supabase} />
    </div>
  );
}

// 요청마다 달라지는 데이터(로그인·주문)는 Suspense 안에서 읽어야 함 (Cache Components 규칙)
export default function NewProductPage(props: PageProps<"/[locale]/admin/products/new">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <NewProductPageContent {...props} />
    </Suspense>
  );
}
