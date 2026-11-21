/**
 * [쉬운 설명] 돈 계산 규칙 모음. 배송비(3만원 이상 무료, 아니면 3,000원), 주문번호 만들기, 원화 표시 등.
 * 화면과 서버가 같은 규칙을 쓰지만, 실제 결제 금액은 항상 서버가 DB 가격으로 다시 계산합니다.
 * 리뷰 순서: 2단계 (docs/REVIEW_GUIDE.md 참고)
 */
/**
 * 금액 계산 규칙. 화면과 서버가 같은 함수를 쓰지만, "결제 금액의 기준"은 언제나 서버가
 * DB 가격으로 다시 계산한 값입니다. 브라우저가 보낸 금액은 믿지 않습니다.
 */
export const SHIPPING_FEE = 3000;
export const FREE_SHIPPING_THRESHOLD = 30000;
export const MAX_QTY_PER_LINE = 20;
export const PAYMENT_TIMEOUT_MINUTES = 30;

export function unitPrice(basePrice: number, priceDelta: number): number {
  const v = basePrice + priceDelta;
  if (!Number.isInteger(v) || v < 0) throw new Error("잘못된 가격");
  return v;
}

export function shippingFeeFor(itemsAmount: number): number {
  if (itemsAmount <= 0) return 0;
  return itemsAmount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function summarize(lines: { unitPrice: number; quantity: number }[]) {
  const itemsAmount = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const shippingFee = shippingFeeFor(itemsAmount);
  return { itemsAmount, shippingFee, totalAmount: itemsAmount + shippingFee };
}

/** 토스 orderName: "첫 상품명 외 N건" */
export function buildOrderName(names: string[]): string {
  if (names.length === 0) return "";
  const first = names[0].slice(0, 80);
  return names.length === 1 ? first : `${first} 외 ${names.length - 1}건`;
}

/** 토스 orderId 규칙: 영문 대소문자, 숫자, -, _ 로 6~64자 */
export function isValidTossOrderId(id: string): boolean {
  return /^[A-Za-z0-9_-]{6,64}$/.test(id);
}

export function generateOrderNumber(now = new Date(), rand = Math.random): string {
  const ymd = now.toISOString().slice(0, 10).replaceAll("-", "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 10; i++) suffix += chars[Math.floor(rand() * chars.length)];
  return `CH${ymd}-${suffix}`;
}

export function formatKRW(amount: number, locale: "ko" | "en" = "ko"): string {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}
