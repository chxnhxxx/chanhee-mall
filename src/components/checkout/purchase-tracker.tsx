"use client";

import { useEffect } from "react";
import { type GaItem, track } from "@/lib/analytics";

/** GA4 purchase 이벤트 (같은 주문은 브라우저당 한 번만) */
export function PurchaseTracker(props: { transactionId: string; value: number; shipping: number; items: GaItem[] }) {
  useEffect(() => {
    const key = `ga-purchase-${props.transactionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // 저장소를 못 쓰는 환경이면 그냥 보냄
    }
    track("purchase", { transaction_id: props.transactionId, value: props.value, shipping: props.shipping, items: props.items });
  }, [props]);
  return null;
}
