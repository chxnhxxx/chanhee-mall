import "server-only";
import type { Category, DailyStat, Order, OrderStatus, Product, ShippingAddress } from "@/lib/domain";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";
import { publicClient, serviceClient, userClient } from "@/server/supabase/clients";
import type { CategoryRow, Json, OrderItemRow, OrderRow, ProductRow, VariantRow } from "@/types/supabase";
import { type ProductInput, type Repo, RepoError } from "./types";

const PRODUCT_SELECT = "*, product_variants(*)";
const ORDER_SELECT = "*, order_items(*)";

type ProductWithVariants = ProductRow & { product_variants: VariantRow[] };
type OrderWithItems = OrderRow & { order_items: OrderItemRow[] };

function toCategory(r: CategoryRow): Category {
  return { id: r.id, slug: r.slug, nameKo: r.name_ko, nameEn: r.name_en, sortOrder: r.sort_order };
}

function toProduct(r: ProductWithVariants): Product {
  return {
    id: r.id,
    slug: r.slug,
    categoryId: r.category_id,
    nameKo: r.name_ko,
    nameEn: r.name_en,
    descriptionKo: r.description_ko,
    descriptionEn: r.description_en,
    price: r.price,
    images: r.images,
    isPublished: r.is_published,
    createdAt: r.created_at,
    variants: [...(r.product_variants ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        productId: v.product_id,
        sku: v.sku,
        nameKo: v.name_ko,
        nameEn: v.name_en,
        priceDelta: v.price_delta,
        stock: v.stock,
      })),
  };
}

function toOrder(r: OrderWithItems | OrderRow, items?: OrderItemRow[]): Order {
  const rows = items ?? ("order_items" in r ? r.order_items : []);
  return {
    id: r.id,
    orderNumber: r.order_number,
    userId: r.user_id,
    status: r.status as OrderStatus,
    itemsAmount: r.items_amount,
    shippingFee: r.shipping_fee,
    totalAmount: r.total_amount,
    orderName: r.order_name,
    shipping: r.shipping as unknown as ShippingAddress,
    trackingNumber: r.tracking_number,
    paymentKey: r.payment_key,
    paymentMethod: r.payment_method,
    returnReason: r.return_reason,
    createdAt: r.created_at,
    paidAt: r.paid_at,
    expiresAt: r.expires_at,
    items: rows.map((i) => ({
      id: i.id,
      variantId: i.variant_id ?? "",
      productNameKo: i.product_name_ko,
      productNameEn: i.product_name_en,
      variantNameKo: i.variant_name_ko,
      variantNameEn: i.variant_name_en,
      unitPrice: i.unit_price,
      quantity: i.quantity,
    })),
  };
}

/** Postgres RAISE EXCEPTION 메시지를 앱 오류 코드로 변환 */
function mapDbError(e: { message?: string; code?: string } | null): never {
  const msg = e?.message ?? "";
  for (const code of ["EMPTY_CART", "OUT_OF_STOCK", "NOT_AVAILABLE", "BAD_QUANTITY", "INVALID_STATE"] as const) {
    if (msg.includes(code)) throw new RepoError(code);
  }
  if (e?.code === "23505") throw new RepoError("CONFLICT", msg);
  throw new Error(`DB 오류: ${msg}`);
}

/** ILIKE 패턴 특수문자 이스케이프 */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export function createSupabaseRepo(): Repo {
  const repo: Repo = {
    kind: "supabase",

    async listCategories() {
      const { data, error } = await publicClient().from("categories").select("*").order("sort_order");
      if (error) mapDbError(error);
      return data.map(toCategory);
    },

    async listProducts(opts = {}) {
      const db = opts.includeUnpublished ? await userClient() : publicClient();
      let query = db.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
      if (!opts.includeUnpublished) query = query.eq("is_published", true);
      if (opts.categorySlug) {
        const { data: cat } = await publicClient().from("categories").select("id").eq("slug", opts.categorySlug).maybeSingle();
        if (!cat) return [];
        query = query.eq("category_id", cat.id);
      }
      if (opts.q) {
        // pg_trgm 인덱스가 걸린 (name_ko || ' ' || name_en) 대신, PostgREST 에서는 컬럼별 ILIKE 를 OR 로 묶음
        // [미확인] 이 형태가 trgm 인덱스를 쓰는지는 EXPLAIN 으로 확인 필요. 상품 수가 적어 성능 영향은 작음.
        const p = `%${likeEscape(opts.q.trim())}%`;
        query = query.or(`name_ko.ilike.${JSON.stringify(p)},name_en.ilike.${JSON.stringify(p)}`);
      }
      const { data, error } = await query;
      if (error) mapDbError(error);
      return (data as unknown as ProductWithVariants[]).map(toProduct);
    },

    async getProductBySlug(slug, opts = {}) {
      const db = opts.includeUnpublished ? await userClient() : publicClient();
      const { data, error } = await db.from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
      if (error) mapDbError(error);
      if (!data) return null;
      const p = toProduct(data as unknown as ProductWithVariants);
      return p.isPublished || opts.includeUnpublished ? p : null;
    },

    async getProductById(id) {
      const { data, error } = await (await userClient()).from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
      if (error) mapDbError(error);
      return data ? toProduct(data as unknown as ProductWithVariants) : null;
    },

    async getVariantsWithProduct(variantIds) {
      if (variantIds.length === 0) return [];
      const { data: vs, error } = await publicClient().from("product_variants").select("id, product_id").in("id", variantIds);
      if (error) mapDbError(error);
      const productIds = [...new Set(vs.map((v) => v.product_id))];
      const { data: ps, error: e2 } = await publicClient()
        .from("products")
        .select(PRODUCT_SELECT)
        .in("id", productIds)
        .eq("is_published", true);
      if (e2) mapDbError(e2);
      const products = new Map((ps as unknown as ProductWithVariants[]).map((p) => [p.id, toProduct(p)]));
      return vs
        .filter((v) => products.has(v.product_id))
        .map((v) => ({ product: products.get(v.product_id)!, variantId: v.id }));
    },

    async saveProduct(input: ProductInput) {
      // 관리자 세션 클라이언트로 저장 → RLS(products_admin_write)가 한 번 더 검사
      const db = await userClient();
      const row = {
        slug: input.slug,
        category_id: input.categoryId,
        name_ko: input.nameKo,
        name_en: input.nameEn,
        description_ko: input.descriptionKo,
        description_en: input.descriptionEn,
        price: input.price,
        images: input.images,
        is_published: input.isPublished,
      };
      const { data: saved, error } = input.id
        ? await db.from("products").update(row).eq("id", input.id).select("id").single()
        : await db.from("products").insert(row).select("id").single();
      if (error) mapDbError(error);

      const keepIds = input.variants.map((v) => v.id).filter(Boolean) as string[];
      // 빠진 옵션 삭제 (주문 이력은 order_items 에 이름·가격이 복사돼 있어 안전)
      let del = db.from("product_variants").delete().eq("product_id", saved.id);
      if (keepIds.length) del = del.not("id", "in", `(${keepIds.join(",")})`);
      const { error: delErr } = await del;
      if (delErr) mapDbError(delErr);

      const variantRows = input.variants.map((v, i) => ({
        ...(v.id ? { id: v.id } : {}),
        product_id: saved.id,
        sku: v.sku,
        name_ko: v.nameKo,
        name_en: v.nameEn,
        price_delta: v.priceDelta,
        stock: v.stock,
        sort_order: i,
      }));
      if (variantRows.length) {
        const { error: vErr } = await db.from("product_variants").upsert(variantRows);
        if (vErr) mapDbError(vErr);
      }
      const p = await repo.getProductById(saved.id);
      if (!p) throw new RepoError("NOT_FOUND");
      return p;
    },

    async getCart(userId) {
      const { data, error } = await (await userClient())
        .from("cart_items")
        .select("variant_id, quantity")
        .eq("user_id", userId)
        .order("created_at");
      if (error) mapDbError(error);
      return data.map((r) => ({ variantId: r.variant_id, quantity: r.quantity }));
    },

    async setCartQuantity(userId, variantId, quantity) {
      const db = await userClient();
      if (quantity <= 0) {
        const { error } = await db.from("cart_items").delete().eq("user_id", userId).eq("variant_id", variantId);
        if (error) mapDbError(error);
        return;
      }
      const { error } = await db
        .from("cart_items")
        .upsert({ user_id: userId, variant_id: variantId, quantity: Math.min(quantity, MAX_QTY_PER_LINE) });
      if (error) mapDbError(error);
    },

    async addToCart(userId, variantId, quantity) {
      const lines = await repo.getCart(userId);
      const current = lines.find((l) => l.variantId === variantId)?.quantity ?? 0;
      await repo.setCartQuantity(userId, variantId, current + quantity);
    },

    async clearCart(userId) {
      // 결제 승인 처리(서버, 세션 없음)에서도 부르므로 service 클라이언트 사용
      const { error } = await serviceClient().from("cart_items").delete().eq("user_id", userId);
      if (error) mapDbError(error);
    },

    async createOrder({ userId, orderNumber, shipping, lines }) {
      const { data, error } = await serviceClient().rpc("create_order", {
        p_user_id: userId,
        p_order_number: orderNumber,
        p_shipping: shipping as unknown as Json,
        p_lines: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })) as unknown as Json,
      });
      if (error) mapDbError(error);
      const order = await repo.getOrderByNumber((data as OrderRow).order_number);
      if (!order) throw new RepoError("NOT_FOUND");
      return order;
    },

    async getOrderByNumber(orderNumber) {
      // 소유자 확인은 호출하는 서버 액션이 함. 웹훅·결제 승인에서도 쓰므로 service 사용
      const { data, error } = await serviceClient().from("orders").select(ORDER_SELECT).eq("order_number", orderNumber).maybeSingle();
      if (error) mapDbError(error);
      return data ? toOrder(data as unknown as OrderWithItems) : null;
    },

    async listOrdersByUser(userId) {
      const { data, error } = await (await userClient())
        .from("orders")
        .select(ORDER_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) mapDbError(error);
      return (data as unknown as OrderWithItems[]).map((r) => toOrder(r));
    },

    async listOrders(opts = {}) {
      let q = (await userClient()).from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(200);
      if (opts.status) q = q.eq("status", opts.status);
      const { data, error } = await q;
      if (error) mapDbError(error);
      return (data as unknown as OrderWithItems[]).map((r) => toOrder(r));
    },

    async markPaid({ orderNumber, paymentKey, method, paidAt }) {
      const { data, error } = await serviceClient()
        .from("orders")
        .update({ status: "paid", payment_key: paymentKey, payment_method: method, paid_at: paidAt })
        .eq("order_number", orderNumber)
        .eq("status", "pending_payment")
        .select(ORDER_SELECT)
        .maybeSingle();
      if (error) mapDbError(error);
      return data ? toOrder(data as unknown as OrderWithItems) : null;
    },

    async closeOrderRestock(orderId, from, to) {
      const { data, error } = await serviceClient().rpc("close_order_restock", {
        p_order_id: orderId,
        p_from_statuses: from,
        p_to_status: to,
      });
      if (error) mapDbError(error);
      const order = await repo.getOrderByNumber((data as OrderRow).order_number);
      return order!;
    },

    async updateOrder(orderId, patch) {
      const row: Partial<OrderRow> = {};
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.trackingNumber !== undefined) row.tracking_number = patch.trackingNumber;
      if (patch.returnReason !== undefined) row.return_reason = patch.returnReason;
      const { data, error } = await serviceClient().from("orders").update(row).eq("id", orderId).select(ORDER_SELECT).single();
      if (error) mapDbError(error);
      return toOrder(data as unknown as OrderWithItems);
    },

    async expirePendingOrders() {
      const { data, error } = await serviceClient().rpc("expire_pending_orders");
      if (error) mapDbError(error);
      return data as number;
    },

    async logPaymentEvent(orderNumber, kind, payload) {
      const { error } = await serviceClient()
        .from("payment_events")
        .insert({ order_number: orderNumber, kind, payload: payload as Json });
      if (error) console.error("[payment_events] 기록 실패", error.message);
    },

    async dailyStats(days): Promise<DailyStat[]> {
      const { data, error } = await serviceClient().rpc("daily_stats", { p_days: days });
      if (error) mapDbError(error);
      return (data as { day: string; orders: number; revenue: number }[]).map((r) => ({
        day: r.day,
        orders: Number(r.orders),
        revenue: Number(r.revenue),
      }));
    },

    async getProfile(userId) {
      const { data, error } = await serviceClient().from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) mapDbError(error);
      return data ? { id: data.id, email: data.email, name: data.name, role: data.role } : null;
    },
  };
  return repo;
}
