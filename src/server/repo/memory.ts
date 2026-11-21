/**
 * [쉬운 설명] 연습용 '메모리 DB'. 서버가 켜져 있는 동안만 데이터를 기억합니다(껐다 켜면 처음 상태).
 * 재고 차감·취소 시 재고 복구 같은 규칙을 Supabase 의 SQL 함수와 똑같이 흉내 냅니다. 테스트도 이걸로 합니다.
 * 리뷰 순서: 4단계 (docs/REVIEW_GUIDE.md 참고)
 */
/**
 * 메모리 DB: Supabase 가 연결되기 전 로컬 개발·E2E 테스트용.
 * 서버 프로세스 메모리에만 있으므로 서버를 다시 켜면 시드 상태로 돌아갑니다.
 * Supabase 의 create_order / close_order_restock SQL 함수와 같은 규칙을 JS 로 구현했습니다.
 */
import type { CartLine, Order, OrderItem, OrderStatus, Product, Profile } from "@/lib/domain";
import { buildOrderName, MAX_QTY_PER_LINE, PAYMENT_TIMEOUT_MINUTES, summarize, unitPrice } from "@/lib/pricing";
import { CATEGORIES, DEMO_ACCOUNTS, PRODUCTS } from "@/server/seed-data";
import { type OrderPatch, type ProductInput, type Repo, RepoError } from "./types";

type State = {
  products: Product[];
  carts: Map<string, CartLine[]>;
  orders: Order[];
  profiles: Profile[];
  paymentEvents: { orderNumber: string; kind: string; payload: unknown; createdAt: string }[];
};

function freshState(): State {
  return {
    products: structuredClone(PRODUCTS),
    carts: new Map(),
    orders: [],
    profiles: DEMO_ACCOUNTS.map((a) => ({ id: a.id, email: a.email, name: a.name, role: a.role })),
    paymentEvents: [],
  };
}

const g = globalThis as unknown as { __chmMemoryDb?: State };
export function memoryState(): State {
  g.__chmMemoryDb ??= freshState();
  return g.__chmMemoryDb;
}
/** 테스트용 초기화 */
export function resetMemoryDb() {
  g.__chmMemoryDb = freshState();
}

const clone = <T>(v: T): T => structuredClone(v);

function findVariant(s: State, variantId: string) {
  for (const p of s.products) {
    const v = p.variants.find((x) => x.id === variantId);
    if (v) return { product: p, variant: v };
  }
  return null;
}

function matchesQuery(p: Product, q: string) {
  const needle = q.trim().toLowerCase();
  return `${p.nameKo} ${p.nameEn}`.toLowerCase().includes(needle);
}

export function createMemoryRepo(): Repo {
  const repo: Repo = {
    kind: "memory",

    async listCategories() {
      return clone(CATEGORIES);
    },

    async listProducts(opts = {}) {
      const s = memoryState();
      const cat = opts.categorySlug ? CATEGORIES.find((c) => c.slug === opts.categorySlug) : undefined;
      if (opts.categorySlug && !cat) return [];
      return clone(
        s.products
          .filter((p) => opts.includeUnpublished || p.isPublished)
          .filter((p) => !cat || p.categoryId === cat.id)
          .filter((p) => !opts.q || matchesQuery(p, opts.q))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    },

    async getProductBySlug(slug, opts = {}) {
      const p = memoryState().products.find((x) => x.slug === slug);
      if (!p || (!p.isPublished && !opts.includeUnpublished)) return null;
      return clone(p);
    },

    async getProductById(id) {
      const p = memoryState().products.find((x) => x.id === id);
      return p ? clone(p) : null;
    },

    async getVariantsWithProduct(variantIds) {
      const s = memoryState();
      const out: { product: Product; variantId: string }[] = [];
      for (const id of variantIds) {
        const found = findVariant(s, id);
        if (found && found.product.isPublished) out.push({ product: clone(found.product), variantId: id });
      }
      return out;
    },

    async saveProduct(input: ProductInput) {
      const s = memoryState();
      const dupSlug = s.products.find((p) => p.slug === input.slug && p.id !== input.id);
      if (dupSlug) throw new RepoError("CONFLICT", "slug 중복");
      const existing = input.id ? s.products.find((p) => p.id === input.id) : undefined;
      const id = existing?.id ?? crypto.randomUUID();
      const product: Product = {
        id,
        slug: input.slug,
        categoryId: input.categoryId,
        nameKo: input.nameKo,
        nameEn: input.nameEn,
        descriptionKo: input.descriptionKo,
        descriptionEn: input.descriptionEn,
        price: input.price,
        images: input.images,
        isPublished: input.isPublished,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        variants: input.variants.map((v) => ({
          id: v.id ?? crypto.randomUUID(),
          productId: id,
          sku: v.sku,
          nameKo: v.nameKo,
          nameEn: v.nameEn,
          priceDelta: v.priceDelta,
          stock: v.stock,
        })),
      };
      if (existing) s.products[s.products.indexOf(existing)] = product;
      else s.products.push(product);
      return clone(product);
    },

    async getCart(userId) {
      return clone(memoryState().carts.get(userId) ?? []);
    },

    async setCartQuantity(userId, variantId, quantity) {
      const s = memoryState();
      const lines = (s.carts.get(userId) ?? []).filter((l) => l.variantId !== variantId);
      if (quantity > 0) lines.push({ variantId, quantity: Math.min(quantity, MAX_QTY_PER_LINE) });
      s.carts.set(userId, lines);
    },

    async addToCart(userId, variantId, quantity) {
      const current = (memoryState().carts.get(userId) ?? []).find((l) => l.variantId === variantId);
      await repo.setCartQuantity(userId, variantId, (current?.quantity ?? 0) + quantity);
    },

    async clearCart(userId) {
      memoryState().carts.delete(userId);
    },

    async createOrder({ userId, orderNumber, shipping, lines }) {
      const s = memoryState();
      if (lines.length === 0) throw new RepoError("EMPTY_CART");
      if (s.orders.some((o) => o.orderNumber === orderNumber)) throw new RepoError("CONFLICT");

      // ▶ 먼저 모든 줄을 검사만 합니다(판매 중인가, 수량이 1~20인가, 재고가 충분한가).
      const resolved = lines.map((l) => {
        const found = findVariant(s, l.variantId);
        if (!found || !found.product.isPublished) throw new RepoError("NOT_AVAILABLE");
        if (l.quantity < 1 || l.quantity > MAX_QTY_PER_LINE) throw new RepoError("BAD_QUANTITY");
        if (found.variant.stock < l.quantity) throw new RepoError("OUT_OF_STOCK");
        return { ...found, quantity: l.quantity, unitPrice: unitPrice(found.product.price, found.variant.priceDelta) };
      });

      // 검사를 모두 통과한 뒤에 재고 차감 (SQL 트랜잭션과 같은 효과)
      // ▶ 하나라도 실패하면 위에서 멈추므로, 여기까지 왔다면 전부 통과 → 이제서야 재고를 줄입니다.
      for (const r of resolved) r.variant.stock -= r.quantity;

      const totals = summarize(resolved);
      const now = new Date();
      const items: OrderItem[] = resolved.map((r) => ({
        id: crypto.randomUUID(),
        variantId: r.variant.id,
        productNameKo: r.product.nameKo,
        productNameEn: r.product.nameEn,
        variantNameKo: r.variant.nameKo,
        variantNameEn: r.variant.nameEn,
        unitPrice: r.unitPrice,
        quantity: r.quantity,
      }));
      const order: Order = {
        id: crypto.randomUUID(),
        orderNumber,
        userId,
        status: "pending_payment",
        ...totals,
        orderName: buildOrderName(resolved.map((r) => r.product.nameKo)),
        shipping,
        trackingNumber: null,
        paymentKey: null,
        paymentMethod: null,
        returnReason: null,
        createdAt: now.toISOString(),
        paidAt: null,
        expiresAt: new Date(now.getTime() + PAYMENT_TIMEOUT_MINUTES * 60_000).toISOString(),
        items,
      };
      s.orders.push(order);
      return clone(order);
    },

    async getOrderByNumber(orderNumber) {
      await repo.expirePendingOrders();
      const o = memoryState().orders.find((x) => x.orderNumber === orderNumber);
      return o ? clone(o) : null;
    },

    async listOrdersByUser(userId) {
      await repo.expirePendingOrders();
      return clone(
        memoryState()
          .orders.filter((o) => o.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    },

    async listOrders(opts = {}) {
      await repo.expirePendingOrders();
      return clone(
        memoryState()
          .orders.filter((o) => !opts.status || o.status === opts.status)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    },

    async markPaid({ orderNumber, paymentKey, method, paidAt }) {
      const o = memoryState().orders.find((x) => x.orderNumber === orderNumber);
      if (!o || o.status !== "pending_payment") return null;
      o.status = "paid";
      o.paymentKey = paymentKey;
      o.paymentMethod = method;
      o.paidAt = paidAt;
      return clone(o);
    },

    async closeOrderRestock(orderId, from: OrderStatus[], to: OrderStatus) {
      const s = memoryState();
      const o = s.orders.find((x) => x.id === orderId);
      if (!o) throw new RepoError("NOT_FOUND");
      if (!from.includes(o.status)) throw new RepoError("INVALID_STATE");
      o.status = to;
      for (const item of o.items) {
        const found = findVariant(s, item.variantId);
        if (found) found.variant.stock += item.quantity;
      }
      return clone(o);
    },

    async updateOrder(orderId, patch: OrderPatch) {
      const o = memoryState().orders.find((x) => x.id === orderId);
      if (!o) throw new RepoError("NOT_FOUND");
      if (patch.status !== undefined) o.status = patch.status;
      if (patch.trackingNumber !== undefined) o.trackingNumber = patch.trackingNumber;
      if (patch.returnReason !== undefined) o.returnReason = patch.returnReason;
      return clone(o);
    },

    // ▶ 결제 대기 30분이 지난 주문을 '자동 취소'로 바꾸고 재고를 되돌립니다.
    async expirePendingOrders() {
      const s = memoryState();
      const now = Date.now();
      let count = 0;
      for (const o of s.orders) {
        if (o.status === "pending_payment" && new Date(o.expiresAt).getTime() < now) {
          o.status = "expired";
          for (const item of o.items) {
            const found = findVariant(s, item.variantId);
            if (found) found.variant.stock += item.quantity;
          }
          count++;
        }
      }
      return count;
    },

    async logPaymentEvent(orderNumber, kind, payload) {
      memoryState().paymentEvents.push({ orderNumber, kind, payload, createdAt: new Date().toISOString() });
    },

    async dailyStats(days) {
      const s = memoryState();
      const out = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
        const day = d.toISOString().slice(0, 10);
        const paid = s.orders.filter(
          (o) =>
            o.paidAt?.slice(0, 10) === day && ["paid", "shipping", "delivered", "return_requested"].includes(o.status),
        );
        out.push({ day, orders: paid.length, revenue: paid.reduce((a, o) => a + o.totalAmount, 0) });
      }
      return out;
    },

    async getProfile(userId) {
      const p = memoryState().profiles.find((x) => x.id === userId);
      return p ? clone(p) : null;
    },
  };
  return repo;
}
