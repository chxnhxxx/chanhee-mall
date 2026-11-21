/**
 * [쉬운 설명] 상품·재고가 바뀌었을 때 저장해 둔 목록(캐시)을 버리고 새로 읽게 하는 도우미.
 * 리뷰 순서: 5단계 (docs/REVIEW_GUIDE.md 참고)
 */
import "server-only";
import { revalidateTag, updateTag } from "next/cache";
import { CATALOG_TAG } from "@/server/catalog";
import { invalidateCache } from "@/server/redis";

/** 서버 액션에서: 바로 다음 화면에 새 데이터가 보이도록 (read-your-writes) */
export async function invalidateCatalogFromAction() {
  updateTag(CATALOG_TAG);
  await invalidateCache("");
}

/** Route Handler(결제 리다이렉트·웹훅)에서 */
export async function invalidateCatalogFromRoute() {
  revalidateTag(CATALOG_TAG, { expire: 0 });
  await invalidateCache("");
}
