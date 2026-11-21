/**
 * [쉬운 설명] ★ 결제창에서 결제가 끝나면 브라우저가 돌아오는 주소. 여기서 서버가 금액을 대조하고 토스에 최종 승인을 요청합니다.
 * 성공하면 '결제 완료' 화면으로, 실패하면 '결제 실패' 화면으로 보냅니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/server/auth";
import { confirmOrderPayment } from "@/server/orders";
import { requestOrigin } from "@/server/origin";
import { clientIp, rateLimit } from "@/server/redis";
import { invalidateCatalogFromRoute } from "@/server/revalidate";

/**
 * 토스 결제창 성공 → 이 주소로 돌아옴 (?paymentKey&orderId&amount)
 * 브라우저가 붙인 amount 는 조작될 수 있으므로 confirmOrderPayment 가 DB 금액과 대조합니다.
 */
const querySchema = z.object({
  paymentKey: z.string().min(1).max(200),
  orderId: z.string().regex(/^[A-Za-z0-9_-]{6,64}$/),
  amount: z.coerce.number().int().nonnegative(),
  locale: z.enum(["ko", "en"]).catch("ko"),
});

// ▶ 토스 결제창이 끝나면 브라우저가 이 주소로 돌아옵니다. 순서대로 확인합니다.
export async function GET(request: NextRequest) {
  const origin = await requestOrigin();
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const locale = parsed.success ? parsed.data.locale : "ko";
  const fail = (code: string) =>
    NextResponse.redirect(`${origin}/${locale}/checkout/fail?code=${encodeURIComponent(code)}`, 303);

  // ▶ 1) 주소에 붙은 값의 형식이 올바른가  2) 너무 자주 요청하지 않았나
  if (!parsed.success) return fail("INVALID_STATE");
  if (!(await rateLimit("checkout", await clientIp()))) return fail("RATE_LIMITED");

  // ▶ 3) 로그인되어 있는가 (아니면 로그인 후 이 주소로 다시 돌아오게 함)
  const session = await getSession();
  if (!session) {
    const back = `/api/payments/toss/success?${request.nextUrl.searchParams}`;
    return NextResponse.redirect(`${origin}/${locale}/login?next=${encodeURIComponent(back)}`, 303);
  }

  // ▶ 4) 금액 대조와 토스 최종 승인 (자세한 내용은 src/server/orders.ts)
  const result = await confirmOrderPayment({
    userId: session.userId,
    orderNumber: parsed.data.orderId,
    paymentKey: parsed.data.paymentKey,
    amount: parsed.data.amount,
  });
  if (!result.ok) return fail(result.code);

  // ▶ 재고가 바뀌었으니 상품 목록 캐시를 새로 고치고 '결제 완료' 화면으로 보냄
  await invalidateCatalogFromRoute();
  return NextResponse.redirect(`${origin}/${locale}/checkout/success?orderNumber=${result.order.orderNumber}`, 303);
}
