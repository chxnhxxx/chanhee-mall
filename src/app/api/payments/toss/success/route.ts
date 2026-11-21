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

export async function GET(request: NextRequest) {
  const origin = await requestOrigin();
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const locale = parsed.success ? parsed.data.locale : "ko";
  const fail = (code: string) => NextResponse.redirect(`${origin}/${locale}/checkout/fail?code=${encodeURIComponent(code)}`, 303);

  if (!parsed.success) return fail("INVALID_STATE");
  if (!(await rateLimit("checkout", await clientIp()))) return fail("RATE_LIMITED");

  const session = await getSession();
  if (!session) {
    const back = `/api/payments/toss/success?${request.nextUrl.searchParams}`;
    return NextResponse.redirect(`${origin}/${locale}/login?next=${encodeURIComponent(back)}`, 303);
  }

  const result = await confirmOrderPayment({
    userId: session.userId,
    orderNumber: parsed.data.orderId,
    paymentKey: parsed.data.paymentKey,
    amount: parsed.data.amount,
  });
  if (!result.ok) return fail(result.code);

  await invalidateCatalogFromRoute();
  return NextResponse.redirect(`${origin}/${locale}/checkout/success?orderNumber=${result.order.orderNumber}`, 303);
}
