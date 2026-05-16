-- Status enums
create type public.order_status as enum ('received','preparing','ready','delivering','completed','cancelled');
create type public.payment_method as enum ('card','pix','applepay','cash');
create type public.payment_status as enum ('pending','paid','refunded','failed');
create type public.table_status as enum ('free','occupied','reserved','maintenance');

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  image_url text,
  kcal int,
  prep_minutes int,
  available boolean not null default true,
  featured boolean not null default false,
  tag text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_category on public.products(category_id);

-- Tables
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  capacity int not null default 4,
  status public.table_status not null default 'free',
  qr_token text not null unique default encode(gen_random_bytes(16),'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default 'EM-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6)),
  table_id uuid references public.tables(id) on delete set null,
  customer_id uuid references auth.users(id) on delete set null,
  status public.order_status not null default 'received',
  payment_method public.payment_method,
  payment_status public.payment_status not null default 'pending',
  subtotal_cents int not null default 0,
  tax_cents int not null default 0,
  total_cents int not null default 0,
  notes text,
  placed_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_status on public.orders(status);
create index idx_orders_table on public.orders(table_id);
create index idx_orders_customer on public.orders(customer_id);

-- Order items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name_snapshot text not null,
  qty int not null check (qty > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  notes text,
  created_at timestamptz not null default now()
);
create index idx_order_items_order on public.order_items(order_id);

-- updated_at triggers
create trigger trg_categories_updated before update on public.categories for each row execute function public.tg_set_updated_at();
create trigger trg_products_updated   before update on public.products   for each row execute function public.tg_set_updated_at();
create trigger trg_tables_updated     before update on public.tables     for each row execute function public.tg_set_updated_at();
create trigger trg_orders_updated     before update on public.orders     for each row execute function public.tg_set_updated_at();

-- Enable RLS
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.tables      enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Public read (catalog + tables)
create policy "Catalog readable by all" on public.categories for select using (true);
create policy "Products readable by all" on public.products  for select using (true);
create policy "Tables readable by all"   on public.tables    for select using (true);

-- Admin manage catalog
create policy "Admins manage categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Admins manage products"   on public.products   for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Admins manage tables"     on public.tables     for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Orders: anyone may create (table-side guest checkout)
create policy "Anyone can create orders" on public.orders for insert to anon, authenticated with check (true);

-- Orders: visible to customer, kitchen, waiter, admin
create policy "Order visibility" on public.orders for select to authenticated using (
  auth.uid() = customer_id
  or public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'kitchen')
  or public.has_role(auth.uid(),'waiter')
);
-- Allow anon to read their just-created order via code (returning row from insert needs select)
create policy "Anon read orders" on public.orders for select to anon using (true);

-- Orders update: staff only
create policy "Staff update orders" on public.orders for update to authenticated using (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'kitchen')
  or public.has_role(auth.uid(),'waiter')
) with check (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'kitchen')
  or public.has_role(auth.uid(),'waiter')
);
create policy "Admin delete orders" on public.orders for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- Order items follow orders
create policy "Anyone can create order items" on public.order_items for insert to anon, authenticated with check (true);
create policy "Order items visibility" on public.order_items for select to anon, authenticated using (true);
create policy "Staff update order items" on public.order_items for update to authenticated using (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'kitchen')
  or public.has_role(auth.uid(),'waiter')
);
create policy "Admin delete order items" on public.order_items for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- Realtime
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.tables;
alter table public.orders replica identity full;
alter table public.order_items replica identity full;
alter table public.tables replica identity full;