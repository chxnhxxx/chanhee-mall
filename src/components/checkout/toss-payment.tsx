/**
 * [쉬운 설명] 토스페이먼츠 결제위젯(카드·간편결제 선택 화면)을 불러와 결제창을 띄우는 부품.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * 토스페이먼츠 결제위젯 (SDK v2). 금액은 서버가 만든 주문 금액을 그대로 받음.
 * 결제 성공 시 토스가 successUrl 로 paymentKey·orderId·amount 를 붙여 돌려보내고,
 * 서버(/api/payments/toss/success)가 금액을 DB 와 대조한 뒤 승인 API 를 호출합니다.
 */
export function TossPayment(props: {
  clientKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerName: string;
}) {
  const t = useTranslations("checkout");
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [ready, setReady] = useState(false);

  // ▶ 화면이 열리면 토스 결제위젯을 불러와서, 서버가 정한 금액으로 결제수단·약관 영역을 그립니다.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const toss = await loadTossPayments(props.clientKey);
      if (cancelled) return;
      const w = toss.widgets({ customerKey: props.customerKey });
      await w.setAmount({ currency: "KRW", value: props.amount });
      await Promise.all([
        w.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
        w.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
      ]);
      if (!cancelled) {
        setWidgets(w);
        setReady(true);
      }
    })().catch((e) => {
      console.error(e);
      toast.error("결제 위젯을 불러오지 못했습니다.");
    });
    return () => {
      cancelled = true;
    };
  }, [props.clientKey, props.customerKey, props.amount]);

  // ▶ '결제하기' 버튼 → 토스 결제창이 뜸. 결제가 끝나면 토스가 successUrl(우리 서버)로 돌려보냅니다.
  async function pay() {
    if (!widgets) return;
    try {
      await widgets.requestPayment({
        orderId: props.orderId,
        orderName: props.orderName,
        successUrl: props.successUrl,
        failUrl: props.failUrl,
        customerName: props.customerName,
      });
    } catch (e) {
      // 사용자가 창을 닫은 경우 등
      console.warn(e);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div id="payment-method" />
      <div id="agreement" />
      <Button size="lg" disabled={!ready} onClick={pay}>
        {t("pay")}
      </Button>
    </div>
  );
}
