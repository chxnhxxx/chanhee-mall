/**
 * src/server/seed-data.ts → supabase/seed.sql 생성.
 * 실행: pnpm db:seed-sql   (Node 24+ 의 TypeScript 타입 제거 실행 사용)
 * 데모 계정(auth.users)은 SQL 로 넣지 않고 scripts/create-demo-users.ts 로 만듭니다.
 */
import { writeFileSync } from "node:fs";
import { CATEGORIES, PRODUCTS } from "../src/server/seed-data.ts";

const q = (s: string) => `'${s.replaceAll("'", "''")}'`;
const arr = (xs: string[]) => `array[${xs.map(q).join(", ")}]::text[]`;

const lines: string[] = [
  "-- 자동 생성 파일입니다. 직접 고치지 말고 src/server/seed-data.ts 를 고친 뒤 pnpm db:seed-sql 을 실행하세요.",
  "begin;",
  "",
  "insert into public.categories (id, slug, name_ko, name_en, sort_order) values",
  CATEGORIES.map((c) => `  (${q(c.id)}, ${q(c.slug)}, ${q(c.nameKo)}, ${q(c.nameEn)}, ${c.sortOrder})`).join(",\n") +
    "\non conflict (id) do nothing;",
  "",
  "insert into public.products (id, slug, category_id, name_ko, name_en, description_ko, description_en, price, images, is_published, created_at) values",
  PRODUCTS.map(
    (p) =>
      `  (${q(p.id)}, ${q(p.slug)}, ${q(p.categoryId)}, ${q(p.nameKo)}, ${q(p.nameEn)}, ${q(p.descriptionKo)}, ${q(p.descriptionEn)}, ${p.price}, ${arr(p.images)}, ${p.isPublished}, ${q(p.createdAt)})`,
  ).join(",\n") + "\non conflict (id) do nothing;",
  "",
  "insert into public.product_variants (id, product_id, sku, name_ko, name_en, price_delta, stock, sort_order) values",
  PRODUCTS.flatMap((p) =>
    p.variants.map(
      (v, i) =>
        `  (${q(v.id)}, ${q(p.id)}, ${q(v.sku)}, ${q(v.nameKo)}, ${q(v.nameEn)}, ${v.priceDelta}, ${v.stock}, ${i})`,
    ),
  ).join(",\n") + "\non conflict (id) do nothing;",
  "",
  "commit;",
  "",
];

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), lines.join("\n"));
console.log(`supabase/seed.sql 생성: 카테고리 ${CATEGORIES.length}, 상품 ${PRODUCTS.length}`);
