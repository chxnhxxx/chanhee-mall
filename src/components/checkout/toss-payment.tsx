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
