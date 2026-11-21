import type { OrderStatus } from "@/lib/domain";

/** 관리자 화면(한국어 전용)에서 쓰는 상태 이름 */
export const STATUS_KO: Record<OrderStatus, string> = {
  pending_payment: "결제 대기",
  paid: "결제 완료",
  shipping: "배송중",
  delivered: "배송 완료",
  cancelled: "취소됨",
  return_requested: "반품 요청",
  refunded: "환불 완료",
  expired: "자동 취소",
};

export function formatDateTimeKo(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
