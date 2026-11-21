/**
 * [쉬운 설명] 페이지를 열 때마다 서버에서 '로그인 여부와 장바구니 개수'를 읽어 브라우저 상태에 알려 줍니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { getSession } from "@/server/auth";
import { repo } from "@/server/repo";
import { CartHydrator } from "./cart-hydrator";

/** 요청마다 로그인 상태와 DB 장바구니 개수를 읽어 Zustand 에 알려줌 */
export async function CartSync() {
  const session = await getSession();
  if (!session) return <CartHydrator mode="guest" count={0} />;
  const lines = await repo().getCart(session.userId);
  return <CartHydrator mode="user" count={lines.reduce((s, l) => s + l.quantity, 0)} />;
}
