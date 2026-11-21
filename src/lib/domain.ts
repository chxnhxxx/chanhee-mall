/**
 * 도메인 타입. DB(Supabase)와 메모리 DB가 같은 모양을 돌려주도록 맞춘 "앱 내부 표준 형태"입니다.
 * DB 컬럼(snake_case)은 저장소 계층에서 이 형태(camelCase)로 바꿉니다.
 */
export type Locale = "ko" | "en";

export type Role = "customer" | "admin";

export type Category = {
  id: string;
  slug: string;
  nameKo: string;
  nameEn: string;
  sortOrder: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  /** 옵션 이름 (예: "화이트 / 500ml") */
  nameKo: string;
  nameEn: string;
  /** 기본가에 더하는 금액(원). 음수 가능 */
  priceDelta: number;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  categoryId: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  /** 기본 판매가(원, 정수) */
  price: number;
  images: string[];
  isPublished: boolean;
  createdAt: string;
  variants: ProductVariant[];
};

export type CartLine = {
  variantId: string;
  quantity: number;
};

/** 화면에 보여줄 장바구니 한 줄 (가격은 항상 서버가 DB 기준으로 계산) */
export type PricedCartLine = {
  variantId: string;
  productId: string;
  productSlug: string;
  productNameKo: string;
  productNameEn: string;
  variantNameKo: string;
  variantNameEn: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
  lineTotal: number;
};

export const ORDER_STATUSES = [
  "pending_payment", // 주문 생성, 결제 대기 (30분 지나면 expired)
  "paid", // 결제 완료
  "shipping", // 배송중 (송장 입력)
  "delivered", // 배송완료
  "cancelled", // 발송 전 취소 (환불 완료)
  "return_requested", // 발송 후 반품 요청
  "refunded", // 반품 승인 → 환불 완료
  "expired", // 결제 시간 초과로 자동 취소
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ShippingAddress = {
  recipient: string;
  phone: string;
  postcode: string;
  address1: string;
  address2: string;
  memo?: string;
};

export type OrderItem = {
  id: string;
  variantId: string;
  productNameKo: string;
  productNameEn: string;
  variantNameKo: string;
  variantNameEn: string;
  unitPrice: number;
  quantity: number;
};

export type Order = {
  id: string;
  /** 토스 orderId 로 쓰는 공개 주문번호 (6~64자, 영문·숫자·-·_) */
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  itemsAmount: number;
  shippingFee: number;
  totalAmount: number;
  orderName: string;
  shipping: ShippingAddress;
  trackingNumber: string | null;
  paymentKey: string | null;
  paymentMethod: string | null;
  returnReason: string | null;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string;
  items: OrderItem[];
};

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type DailyStat = { day: string; orders: number; revenue: number };
