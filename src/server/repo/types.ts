import type {
  CartLine,
  Category,
  DailyStat,
  Order,
  OrderStatus,
  Product,
  Profile,
  ShippingAddress,
} from "@/lib/domain";

export type ProductInput = {
  id?: string;
  slug: string;
  categoryId: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  price: number;
  images: string[];
  isPublished: boolean;
  variants: {
    id?: string;
    sku: string;
    nameKo: string;
    nameEn: string;
    priceDelta: number;
    stock: number;
  }[];
};

export type OrderPatch = {
  status?: OrderStatus;
  trackingNumber?: string | null;
  returnReason?: string | null;
};

/** 저장소 계층 오류 코드 (화면에서 번역해 보여줌) */
export class RepoError extends Error {
  constructor(
    public code:
      "EMPTY_CART" | "OUT_OF_STOCK" | "NOT_AVAILABLE" | "BAD_QUANTITY" | "INVALID_STATE" | "NOT_FOUND" | "CONFLICT",
    message?: string,
  ) {
    super(message ?? code);
  }
}

/**
 * 데이터 저장소. Supabase 구현과 메모리 구현이 같은 약속을 지킵니다.
 * 권한 검사(본인 주문인지, 관리자인지)는 이 계층을 부르는 서버 액션에서 먼저 하고,
 * Supabase 구현에서는 RLS 가 한 번 더 막습니다(이중 방어).
 */
export interface Repo {
  readonly kind: "supabase" | "memory";

  // 카탈로그 (공개)
  listCategories(): Promise<Category[]>;
  listProducts(opts?: { categorySlug?: string; q?: string; includeUnpublished?: boolean }): Promise<Product[]>;
  getProductBySlug(slug: string, opts?: { includeUnpublished?: boolean }): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  /** 장바구니 가격 계산용: 공개 상품의 옵션만 돌려줌 */
  getVariantsWithProduct(variantIds: string[]): Promise<{ product: Product; variantId: string }[]>;

  // 카탈로그 (관리자)
  saveProduct(input: ProductInput): Promise<Product>;

  // 장바구니
  getCart(userId: string): Promise<CartLine[]>;
  setCartQuantity(userId: string, variantId: string, quantity: number): Promise<void>;
  addToCart(userId: string, variantId: string, quantity: number): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // 주문
  createOrder(input: {
    userId: string;
    orderNumber: string;
    shipping: ShippingAddress;
    lines: CartLine[];
  }): Promise<Order>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  listOrdersByUser(userId: string): Promise<Order[]>;
  listOrders(opts?: { status?: OrderStatus }): Promise<Order[]>;
  /** 결제 대기 상태일 때만 결제완료로 바꿈. 이미 처리됐으면 null */
  markPaid(input: {
    orderNumber: string;
    paymentKey: string;
    method: string | null;
    paidAt: string;
  }): Promise<Order | null>;
  closeOrderRestock(orderId: string, from: OrderStatus[], to: OrderStatus): Promise<Order>;
  updateOrder(orderId: string, patch: OrderPatch): Promise<Order>;
  expirePendingOrders(): Promise<number>;
  logPaymentEvent(
    orderNumber: string,
    kind: "confirm" | "cancel" | "webhook" | "error",
    payload: unknown,
  ): Promise<void>;
  dailyStats(days: number): Promise<DailyStat[]>;

  // 프로필
  getProfile(userId: string): Promise<Profile | null>;
}
