import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { features } from "@/env";
import { repo } from "@/server/repo";

export default async function EditProductPage({ params }: PageProps<"/[locale]/admin/products/[id]">) {
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
