import { ProductForm } from "@/components/admin/product-form";
import { features } from "@/env";
import { repo } from "@/server/repo";

export default async function NewProductPage() {
  const categories = await repo().listCategories();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">새 상품</h1>
      <ProductForm categories={categories} uploadEnabled={features.supabase} />
    </div>
  );
}
