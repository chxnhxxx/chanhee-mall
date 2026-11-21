import { NextResponse } from "next/server";
import { z } from "zod";
import { syncFromToss } from "@/server/orders";
import { invalidateCatalogFromRoute } from "@/server/revalidate";

/**
 * 토스 웹훅 수신 (개발자센터 > 웹훅에 이 주소 등록: https://<도메인>/api/payments/toss/webhook)
 * 결제 상태 변경 이벤트에는 서명이 없으므로 본문을 그대로 믿지 않고,
 * paymentKey 로 토스 조회 API 를 다시 불러 확인한 결과만 DB 에 반영합니다.
 * [미확인] 테스트 모드에서 웹훅이 실제로 발송되는지는 연동 후 확인 필요.
 */
const bodySchema = z.object({
  eventType: z.string(),
  data: z.object({ paymentKey: z.string().min(1).max(200) }).passthrough(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(payload);
  // 모르는 이벤트도 200 으로 응답해야 토스가 재전송을 멈춤
  if (!parsed.success || parsed.data.eventType !== "PAYMENT_STATUS_CHANGED") {
    return NextResponse.json({ ok: true, ignored: true });
  }
  try {
    await syncFromToss(parsed.data.data.paymentKey);
    await invalidateCatalogFromRoute();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook] 처리 실패", e);
    // 500 이면 토스가 다시 보내줌 → 일시적 오류에서 회복 가능
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
