/**
 * [쉬운 설명] 결제 완료 화면에서 GA4 에 '구매' 기록을 한 번만 보내는 부품(새로고침해도 중복 기록 안 함).
 * 리뷰 순서: 8단계 (docs/REVIEW_GUIDE.md 참고)
 */
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
    track("purchase", {
      transaction_id: props.transactionId,
      value: props.value,
      shipping: props.shipping,
      items: props.items,
    });
  }, [props]);
  return null;
}
