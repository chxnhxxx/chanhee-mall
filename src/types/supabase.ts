/**
 * Supabase DB 타입.
 * ⚠️ 지금은 supabase/migrations 를 보고 손으로 맞춘 "임시본"입니다.
 * Supabase 프로젝트를 연결한 뒤 `pnpm db:types` 로 자동 생성본으로 덮어쓰세요.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  created_at: string;
};
export type CategoryRow = {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string;
  sort_order: number;
};
export type ProductRow = {
  id: string;
  slug: string;
  category_id: string;
  name_ko: string;
  name_en: string;
  description_ko: string;
  description_en: string;
  price: number;
  images: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
export type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  name_ko: string;
  name_en: string;
  price_delta: number;
  stock: number;
  sort_order: number;
};
export type CartItemRow = {
  user_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
};
export type OrderRow = {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  items_amount: number;
  shipping_fee: number;
  total_amount: number;
  order_name: string;
  shipping: Json;
  tracking_number: string | null;
  payment_key: string | null;
  payment_method: string | null;
  return_reason: string | null;
  created_at: string;
  paid_at: string | null;
  expires_at: string;
  updated_at: string;
};
export type OrderItemRow = {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_name_ko: string;
  product_name_en: string;
  variant_name_ko: string;
  variant_name_en: string;
  unit_price: number;
  quantity: number;
};
export type PaymentEventRow = {
  id: number;
  order_number: string;
  kind: "confirm" | "cancel" | "webhook" | "error";
  payload: Json;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, "id" | "email">;
      categories: Table<CategoryRow, "slug" | "name_ko" | "name_en">;
      products: Table<ProductRow, "slug" | "category_id" | "name_ko" | "name_en" | "price">;
      product_variants: Table<VariantRow, "product_id" | "sku" | "name_ko" | "name_en">;
      cart_items: Table<CartItemRow, "user_id" | "variant_id" | "quantity">;
      orders: Table<
        OrderRow,
        "order_number" | "user_id" | "items_amount" | "shipping_fee" | "total_amount" | "order_name" | "shipping"
      >;
      order_items: Table<
        OrderItemRow,
        | "order_id"
        | "product_name_ko"
        | "product_name_en"
        | "variant_name_ko"
        | "variant_name_en"
        | "unit_price"
        | "quantity"
      >;
      payment_events: Table<PaymentEventRow, "order_number" | "kind" | "payload">;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      shipping_fee_for: { Args: { items_amount: number }; Returns: number };
      create_order: {
        Args: { p_user_id: string; p_order_number: string; p_shipping: Json; p_lines: Json };
        Returns: OrderRow;
      };
      close_order_restock: {
        Args: { p_order_id: string; p_from_statuses: string[]; p_to_status: string };
        Returns: OrderRow;
      };
      expire_pending_orders: { Args: Record<string, never>; Returns: number };
      daily_stats: {
        Args: { p_days?: number };
        Returns: { day: string; orders: number; revenue: number }[];
      };
      enqueue_email: { Args: { p_payload: Json }; Returns: number };
      read_email_jobs: {
        Args: { p_qty?: number };
        Returns: { msg_id: number; read_ct: number; message: Json }[];
      };
      archive_email_job: { Args: { p_msg_id: number }; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
