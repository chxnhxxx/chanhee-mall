-- chanhee-mall 초기 스키마
-- 원칙: 모든 테이블 RLS 켜기 + 서버에서도 권한 검사(이중 방어). 금액은 원 단위 정수.

create extension if not exists pg_trgm;

-- ───────────────────────── 프로필 (역할) ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ───────────────────────── 카탈로그 ─────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ko text not null,
  name_en text not null,
  sort_order int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  category_id uuid not null references public.categories (id),
  name_ko text not null,
  name_en text not null,
  description_ko text not null default '',
  description_en text not null default '',
  price int not null check (price >= 0),
  images text[] not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
-- 상품명 부분 일치 검색 (ILIKE '%검색어%' 가 이 인덱스를 씀. 1~2글자는 인덱스 효과 없음)
create index products_name_trgm_idx on public.products
  using gin ((name_ko || ' ' || name_en) gin_trgm_ops);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  name_ko text not null,
  name_en text not null,
  price_delta int not null default 0,
  stock int not null default 0 check (stock >= 0),
  sort_order int not null default 0
);

create index product_variants_product_idx on public.product_variants (product_id);

-- ───────────────────────── 장바구니 (원본은 DB) ─────────────────────────
create table public.cart_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity int not null check (quantity between 1 and 20),
  created_at timestamptz not null default now(),
  primary key (user_id, variant_id)
);

-- ───────────────────────── 주문 ─────────────────────────
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique check (order_number ~ '^[A-Za-z0-9_-]{6,64}$'),
  user_id uuid not null references public.profiles (id),
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'paid', 'shipping', 'delivered',
    'cancelled', 'return_requested', 'refunded', 'expired'
  )),
  items_amount int not null check (items_amount >= 0),
  shipping_fee int not null check (shipping_fee >= 0),
  total_amount int not null check (total_amount >= 0),
  order_name text not null,
  shipping jsonb not null,
  tracking_number text,
  payment_key text unique,
  payment_method text,
  return_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  expires_at timestamptz not null default now() + interval '30 minutes',
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, expires_at);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name_ko text not null,
  product_name_en text not null,
  variant_name_ko text not null,
  variant_name_en text not null,
  unit_price int not null check (unit_price >= 0),
  quantity int not null check (quantity > 0)
);

create index order_items_order_idx on public.order_items (order_id);

-- 토스 승인·취소·웹훅 응답 기록 (감사 로그)
create table public.payment_events (
  id bigint generated always as identity primary key,
  order_number text not null,
  kind text not null check (kind in ('confirm', 'cancel', 'webhook', 'error')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index payment_events_order_idx on public.payment_events (order_number);

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ───────────────────────── 금액 규칙 (src/lib/pricing.ts 와 같아야 함) ─────────────────────────
create or replace function public.shipping_fee_for(items_amount int)
returns int language sql immutable as $$
  select case when items_amount <= 0 then 0 when items_amount >= 30000 then 0 else 3000 end;
$$;

-- 주문 생성: 가격을 DB에서 다시 읽고, 재고를 잠그고 차감한 뒤 주문을 만든다 (한 트랜잭션)
-- p_lines 예: [{"variant_id": "...", "quantity": 2}]
create or replace function public.create_order(
  p_user_id uuid,
  p_order_number text,
  p_shipping jsonb,
  p_lines jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line record;
  v_items_amount int := 0;
  v_first_name text;
  v_count int := 0;
  v_order public.orders;
begin
  if jsonb_array_length(p_lines) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- 재고 행 잠금 (동시 주문 시 초과 판매 방지)
  for v_line in
    select v.id as variant_id, v.stock, v.name_ko as v_ko, v.name_en as v_en,
           p.name_ko as p_ko, p.name_en as p_en, p.is_published,
           (p.price + v.price_delta) as unit_price, l.quantity
    from jsonb_to_recordset(p_lines) as l(variant_id uuid, quantity int)
    join public.product_variants v on v.id = l.variant_id
    join public.products p on p.id = v.product_id
    order by v.id
    for update of v
  loop
    if not v_line.is_published then raise exception 'NOT_AVAILABLE'; end if;
    if v_line.quantity < 1 or v_line.quantity > 20 then raise exception 'BAD_QUANTITY'; end if;
    if v_line.stock < v_line.quantity then raise exception 'OUT_OF_STOCK'; end if;
    v_items_amount := v_items_amount + v_line.unit_price * v_line.quantity;
    v_count := v_count + 1;
    if v_first_name is null then v_first_name := v_line.p_ko; end if;
  end loop;

  if v_count <> jsonb_array_length(p_lines) then
    raise exception 'NOT_AVAILABLE';
  end if;

  insert into public.orders (
    order_number, user_id, items_amount, shipping_fee, total_amount, order_name, shipping
  ) values (
    p_order_number, p_user_id, v_items_amount, public.shipping_fee_for(v_items_amount),
    v_items_amount + public.shipping_fee_for(v_items_amount),
    case when v_count = 1 then v_first_name else v_first_name || ' 외 ' || (v_count - 1) || '건' end,
    p_shipping
  ) returning * into v_order;

  insert into public.order_items (
    order_id, variant_id, product_name_ko, product_name_en, variant_name_ko, variant_name_en, unit_price, quantity
  )
  select v_order.id, v.id, p.name_ko, p.name_en, v.name_ko, v.name_en, p.price + v.price_delta, l.quantity
  from jsonb_to_recordset(p_lines) as l(variant_id uuid, quantity int)
  join public.product_variants v on v.id = l.variant_id
  join public.products p on p.id = v.product_id;

  update public.product_variants v
  set stock = v.stock - l.quantity
  from jsonb_to_recordset(p_lines) as l(variant_id uuid, quantity int)
  where v.id = l.variant_id;

  return v_order;
end;
$$;

-- 주문 상태를 바꾸면서 재고를 되돌린다 (취소·만료·환불)
create or replace function public.close_order_restock(
  p_order_id uuid,
  p_from_statuses text[],
  p_to_status text
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  update public.orders
  set status = p_to_status
  where id = p_order_id and status = any (p_from_statuses)
  returning * into v_order;

  if v_order.id is null then
    raise exception 'INVALID_STATE';
  end if;

  update public.product_variants v
  set stock = v.stock + oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id and oi.variant_id = v.id;

  return v_order;
end;
$$;

-- 결제 대기 30분 초과 주문 자동 만료 + 재고 복구 (pg_cron 이 5분마다 호출)
create or replace function public.expire_pending_orders()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count int := 0;
begin
  for v_id in
    select id from public.orders
    where status = 'pending_payment' and expires_at < now()
    for update skip locked
  loop
    perform public.close_order_restock(v_id, array['pending_payment'], 'expired');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- 일별 주문 수·매출 (관리자 통계)
create or replace function public.daily_stats(p_days int default 14)
returns table (day date, orders bigint, revenue bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select d::date as day,
         count(o.id) as orders,
         coalesce(sum(o.total_amount), 0) as revenue
  from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d
  left join public.orders o
    on o.paid_at::date = d::date
   and o.status in ('paid', 'shipping', 'delivered', 'return_requested')
  group by d
  order by d;
$$;

-- 서버(secret key)만 호출하도록 일반 역할의 실행 권한 회수
revoke execute on function public.create_order(uuid, text, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.close_order_restock(uuid, text[], text) from public, anon, authenticated;
revoke execute on function public.expire_pending_orders() from public, anon, authenticated;
revoke execute on function public.daily_stats(int) from public, anon, authenticated;

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;

-- profiles: 본인 또는 관리자만 조회. 이름만 본인이 수정 (role 은 수정 불가)
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

-- 카탈로그: 누구나 조회(공개 상품만), 관리자는 전체 조회·수정
create policy "categories_read_all" on public.categories
  for select to anon, authenticated using (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products_read_published" on public.products
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy "products_admin_write" on public.products
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "variants_read_published" on public.product_variants
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and (p.is_published or (select public.is_admin()))
  ));
create policy "variants_admin_write" on public.product_variants
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- 장바구니: 본인 행만
create policy "cart_own" on public.cart_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 주문: 본인 또는 관리자만 조회. 생성·결제 처리는 서버(secret key)가 함수로만 수행
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "orders_admin_update" on public.orders
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "order_items_select" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
  ));

create policy "payment_events_admin_read" on public.payment_events
  for select to authenticated using ((select public.is_admin()));

-- ───────────────────────── Realtime (관리자 새 주문 알림) ─────────────────────────
-- Realtime 구독에도 위 RLS 가 적용되어 관리자만 다른 사람의 주문 이벤트를 받는다 [미확인: 구축 후 실험]
alter publication supabase_realtime add table public.orders;

-- ───────────────────────── Storage (상품 이미지) ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');
create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
