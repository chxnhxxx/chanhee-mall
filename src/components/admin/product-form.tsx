/**
 * [쉬운 설명] 상품 등록·수정 양식: 이름(한/영), 가격, 설명, 이미지, 옵션별 재고.
 * 리뷰 순서: 7단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import type { Category, Product } from "@/lib/domain";
import { type ProductFormInput, type ProductFormValues, productFormSchema } from "@/lib/schemas";
import { saveProductAction } from "@/server/actions/admin";

const ERR_KO: Record<string, string> = {
  FORBIDDEN: "관리자만 할 수 있습니다.",
  CONFLICT: "같은 주소(slug)나 SKU 를 쓰는 상품이 이미 있습니다.",
  INVALID_STATE: "입력값을 확인해 주세요.",
};

export function ProductForm({
  categories,
  product,
  uploadEnabled,
}: {
  categories: Category[];
  product?: Product;
  uploadEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          id: product.id,
          slug: product.slug,
          categoryId: product.categoryId,
          nameKo: product.nameKo,
          nameEn: product.nameEn,
          descriptionKo: product.descriptionKo,
          descriptionEn: product.descriptionEn,
          price: product.price,
          images: product.images,
          isPublished: product.isPublished,
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            nameKo: v.nameKo,
            nameEn: v.nameEn,
            priceDelta: v.priceDelta,
            stock: v.stock,
          })),
        }
      : {
          slug: "",
          categoryId: categories[0]?.id ?? "",
          nameKo: "",
          nameEn: "",
          descriptionKo: "",
          descriptionEn: "",
          price: 10000,
          images: [],
          isPublished: false,
          variants: [{ sku: "", nameKo: "기본", nameEn: "Default", priceDelta: 0, stock: 10 }],
        },
  });
  const variants = useFieldArray({ control: form.control, name: "variants" });
  const images = useWatch({ control: form.control, name: "images" }) ?? [];
  const errors = form.formState.errors;

  const onSubmit = (values: ProductFormValues) =>
    start(async () => {
      const res = await saveProductAction(values);
      if (!res.ok) return void toast.error(ERR_KO[res.code] ?? "저장하지 못했습니다.");
      toast.success("저장했습니다.");
      router.push("/admin/products");
      router.refresh();
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-3xl flex-col gap-6" noValidate>
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="상품명(한국어)" error={errors.nameKo?.message}>
          <Input {...form.register("nameKo")} />
        </Field>
        <Field label="상품명(영어)" error={errors.nameEn?.message}>
          <Input {...form.register("nameEn")} />
        </Field>
        <Field label="주소(slug)" error={errors.slug?.message}>
          <Input placeholder="stainless-tumbler" {...form.register("slug")} />
        </Field>
        <Field label="카테고리" error={errors.categoryId?.message}>
          <select className="h-9 rounded-md border bg-transparent px-3 text-sm" {...form.register("categoryId")}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameKo}
              </option>
            ))}
          </select>
        </Field>
        <Field label="기본 판매가(원)" error={errors.price?.message}>
          <Input type="number" inputMode="numeric" {...form.register("price")} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" className="size-4" {...form.register("isPublished")} />
          판매중으로 공개
        </label>
        <Field label="설명(한국어)" error={errors.descriptionKo?.message} className="sm:col-span-2">
          <Textarea rows={3} {...form.register("descriptionKo")} />
        </Field>
        <Field label="설명(영어)" error={errors.descriptionEn?.message} className="sm:col-span-2">
          <Textarea rows={3} {...form.register("descriptionEn")} />
        </Field>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">이미지 (최대 8장, 첫 번째가 대표)</h2>
        {images.length ? (
          <ul className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <li key={`${src}-${i}`} className="relative">
                {/* 관리자 미리보기는 외부 주소일 수 있어 next/image 대신 img 사용 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-20 rounded-md border object-cover" />
                <button
                  type="button"
                  aria-label="이미지 삭제"
                  className="absolute -top-2 -right-2 rounded-full bg-destructive px-1.5 text-xs text-white"
                  onClick={() =>
                    form.setValue(
                      "images",
                      images.filter((_, j) => j !== i),
                      { shouldDirty: true },
                    )
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {images.length < 8 ? (
          <ImageUploader
            uploadEnabled={uploadEnabled}
            onAdd={(url) => form.setValue("images", [...form.getValues("images"), url], { shouldDirty: true })}
          />
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">옵션·재고</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => variants.append({ sku: "", nameKo: "", nameEn: "", priceDelta: 0, stock: 0 })}
          >
            옵션 추가
          </Button>
        </div>
        {errors.variants?.root?.message || errors.variants?.message ? (
          <p className="text-xs text-destructive">{errors.variants?.root?.message ?? errors.variants?.message}</p>
        ) : null}
        <div className="flex flex-col gap-3">
          {variants.fields.map((f, i) => {
            const e = errors.variants?.[i];
            return (
              <div key={f.id} className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-6">
                <Field label="SKU" error={e?.sku?.message}>
                  <Input {...form.register(`variants.${i}.sku`)} />
                </Field>
                <Field label="옵션명(한)" error={e?.nameKo?.message}>
                  <Input {...form.register(`variants.${i}.nameKo`)} />
                </Field>
                <Field label="옵션명(영)" error={e?.nameEn?.message}>
                  <Input {...form.register(`variants.${i}.nameEn`)} />
                </Field>
                <Field label="추가금" error={e?.priceDelta?.message}>
                  <Input type="number" {...form.register(`variants.${i}.priceDelta`)} />
                </Field>
                <Field label="재고" error={e?.stock?.message}>
                  <Input type="number" min={0} {...form.register(`variants.${i}.stock`)} />
                </Field>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={variants.fields.length === 1 || (!!f.id && !!product)}
                    title={
                      f.id && product
                        ? "주문 이력 보존을 위해 저장된 옵션은 삭제하지 않습니다. 재고를 0으로 두세요."
                        : undefined
                    }
                    onClick={() => variants.remove(i)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중…" : "저장"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          취소
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
