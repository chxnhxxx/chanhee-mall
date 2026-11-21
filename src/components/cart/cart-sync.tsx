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
