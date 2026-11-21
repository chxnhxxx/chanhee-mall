/**
 * [쉬운 설명] 관리자 대시보드에서 새 주문이 들어오면 알림을 띄우는 부품(Supabase 실시간 기능, 데모 모드는 30초마다 새로고침).
 * 리뷰 순서: 7단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { publicEnv } from "@/env.client";
import { useRouter } from "@/i18n/navigation";

/**
 * 새 주문 알림
 *  - Supabase 모드: Realtime 으로 orders 테이블 INSERT 를 구독 → 토스트 + 화면 새로고침.
 *    브라우저 클라이언트가 로그인 쿠키를 쓰므로 RLS 가 적용되어 관리자만 모든 주문을 받습니다.
 *    [미확인] Realtime 구독에 RLS 가 그대로 적용되는지는 실제 Supabase 연결 후 확인 필요
 *  - 메모리 모드: Realtime 이 없으므로 30초마다 새로고침해서 최신 주문번호가 바뀌면 알림
 */
export function NewOrderListener({
  realtime,
  latestOrderNumber,
}: {
  realtime: boolean;
  latestOrderNumber: string | null;
}) {
  const router = useRouter();
  const seen = useRef(latestOrderNumber);

  useEffect(() => {
    if (!realtime || !publicEnv.supabaseUrl || !publicEnv.supabasePublishableKey) return;
    const supabase = createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey);
    const channel = supabase
      .channel("admin-new-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as { order_number?: string; order_name?: string };
        toast.info(`새 주문: ${row.order_name ?? row.order_number ?? ""}`);
        router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [realtime, router]);

  useEffect(() => {
    if (realtime) return;
    const id = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(id);
  }, [realtime, router]);

  useEffect(() => {
    if (realtime) return;
    if (latestOrderNumber && seen.current && latestOrderNumber !== seen.current) {
      toast.info(`새 주문: ${latestOrderNumber}`);
    }
    seen.current = latestOrderNumber;
  }, [realtime, latestOrderNumber]);

  return (
    <p className="text-xs text-muted-foreground">
      {realtime
        ? "● 실시간 주문 알림 켜짐 (Supabase Realtime)"
        : "○ 데모 모드: 실시간 알림 대신 30초마다 새로고침합니다"}
    </p>
  );
}
