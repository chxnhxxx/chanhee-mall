import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { repo } from "@/server/repo";
import { cachedJson } from "@/server/redis";

/**
 * 공개 카탈로그 읽기. 모든 사용자에게 같은 데이터이므로 "use cache" 로 캐시합니다.
 * (사용자별 데이터는 여기에 넣지 않음: Next.js 16.4.5 미만의 "use cache" 사용자 간 노출 버그 이력 참고)
 * 상품·재고가 바뀌면 updateTag/revalidateTag("catalog") 로 무효화합니다.
 * 2차 캐시로 Upstash Redis 를 씁니다 (키가 없으면 건너뜀).
 */
export const CATALOG_TAG = "catalog";

export async function getCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return cachedJson("categories", 3600, () => repo().listCategories());
}

export async function getProducts(categorySlug?: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);
  return cachedJson(`products:${categorySlug ?? "all"}`, 60, () => repo().listProducts({ categorySlug }));
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG, `product:${slug}`);
  return cachedJson(`product:${slug}`, 60, () => repo().getProductBySlug(slug));
}

/** 검색은 검색어마다 결과가 달라 캐시하지 않음 (레이트 리밋 대상) */
export async function searchProducts(q: string, categorySlug?: string) {
  return repo().listProducts({ q, categorySlug });
}
