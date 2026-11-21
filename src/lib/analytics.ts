"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { publicEnv } from "@/env.client";

/**
 * GA4 이커머스 이벤트. 개인정보(이메일·이름·주소·전화)는 절대 넣지 않습니다.
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */
export type GaItem = { item_id: string; item_name: string; item_variant?: string; price: number; quantity?: number };

export function track(
  event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase",
  params: { value: number; items: GaItem[]; transaction_id?: string; shipping?: number },
) {
  if (!publicEnv.gaId) return;
  try {
    sendGAEvent("event", event, { currency: "KRW", ...params });
  } catch {
    // 분석 실패는 사용자 흐름을 막지 않음
  }
}
