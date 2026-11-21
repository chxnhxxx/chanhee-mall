/**
 * [쉬운 설명] 토스 키가 없을 때 쓰는 '모의 결제' 버튼. 토스가 결제 성공 후 돌려보내는 동작을 흉내 냅니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** 토스 키가 없을 때: 토스가 successUrl 로 돌려보내는 동작을 흉내 냄 (서버 검증 로직은 그대로 탐) */
export function MockPayment({ orderId, amount, locale }: { orderId: string; amount: number; locale: string }) {
  const t = useTranslations("checkout");
  function pay() {
    const paymentKey = `mock_${crypto.randomUUID().replaceAll("-", "")}`;
    const q = new URLSearchParams({ paymentKey, orderId, amount: String(amount), locale });
    // 페이지가 아니라 API(Route Handler)로 이동해야 하므로 전체 이동 사용
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/api/payments/toss/success?${q}`);
  }
  return (
    <div className="flex flex-col gap-3">
      <Alert>
        <AlertDescription>{t("mockNotice")}</AlertDescription>
      </Alert>
      <Button size="lg" onClick={pay} data-testid="mock-pay">
        {t("mockPay")}
      </Button>
    </div>
  );
}
