-- Tabela de planos de assinatura
create table if not exists public.plans (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text null,
  price_monthly numeric(10, 2) not null,
  price_yearly numeric(10, 2) not null,
  stripe_price_id_monthly text null,
  stripe_price_id_yearly text null,
  stripe_product_id text null,
  features jsonb null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint plans_pkey primary key (id),
  constraint plans_name_key unique (name)
) tablespace pg_default;

-- Tabela de assinaturas
create table if not exists public.subscriptions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid not null,
  stripe_subscription_id text null,
  stripe_customer_id text null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE')),
  billing_cycle text not null check (billing_cycle in ('MONTHLY', 'YEARLY')),
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint subscriptions_pkey primary key (id),
  constraint subscriptions_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade,
  constraint subscriptions_plan_id_fkey foreign key (plan_id) references public.plans(id) on delete restrict,
  constraint subscriptions_stripe_subscription_id_key unique (stripe_subscription_id)
) tablespace pg_default;

-- Tabela de pagamentos
create table if not exists public.payments (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  subscription_id uuid null,
  stripe_payment_intent_id text null,
  stripe_invoice_id text null,
  amount numeric(10, 2) not null,
  currency text not null default 'BRL',
  status text not null check (status in ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELED')),
  payment_method text null,
  description text null,
  paid_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint payments_pkey primary key (id),
  constraint payments_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade,
  constraint payments_subscription_id_fkey foreign key (subscription_id) references public.subscriptions(id) on delete set null,
  constraint payments_stripe_payment_intent_id_key unique (stripe_payment_intent_id)
) tablespace pg_default;

-- Atualizar tabela de licenças para vincular a assinaturas
alter table public.licenses add column if not exists subscription_id uuid null;
alter table public.licenses add column if not exists user_id uuid null;
alter table public.licenses add column if not exists plan_type text null;
alter table public.licenses add column if not exists is_standalone boolean not null default false;

alter table public.licenses add constraint licenses_subscription_id_fkey
  foreign key (subscription_id) references public.subscriptions(id) on delete set null;

alter table public.licenses add constraint licenses_user_id_fkey
  foreign key (user_id) references public.users(id) on delete set null;

-- Índices
create index if not exists idx_subscriptions_user_id on public.subscriptions using btree (user_id) tablespace pg_default;
create index if not exists idx_subscriptions_plan_id on public.subscriptions using btree (plan_id) tablespace pg_default;
create index if not exists idx_subscriptions_status on public.subscriptions using btree (status) tablespace pg_default;
create index if not exists idx_subscriptions_stripe_subscription_id on public.subscriptions using btree (stripe_subscription_id) tablespace pg_default;

create index if not exists idx_payments_user_id on public.payments using btree (user_id) tablespace pg_default;
create index if not exists idx_payments_subscription_id on public.payments using btree (subscription_id) tablespace pg_default;
create index if not exists idx_payments_status on public.payments using btree (status) tablespace pg_default;
create index if not exists idx_payments_stripe_payment_intent_id on public.payments using btree (stripe_payment_intent_id) tablespace pg_default;

create index if not exists idx_licenses_subscription_id on public.licenses using btree (subscription_id) tablespace pg_default;
create index if not exists idx_licenses_user_id on public.licenses using btree (user_id) tablespace pg_default;
create index if not exists idx_licenses_is_standalone on public.licenses using btree (is_standalone) tablespace pg_default;

-- Triggers
create trigger update_plans_updated_at
  before update on public.plans
  for each row
  execute function public.update_updated_at_column();

create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.update_updated_at_column();

-- RLS
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

-- Políticas para plans (todos podem ver)
create policy "Anyone can view active plans"
  on public.plans
  for select
  using (is_active = true);

-- Políticas para subscriptions
create policy "Users can view own subscriptions"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

create policy "Admins and managers can view all subscriptions"
  on public.subscriptions
  for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('ADMIN', 'MANAGER')
    )
  );

-- Políticas para payments
create policy "Users can view own payments"
  on public.payments
  for select
  using (auth.uid() = user_id);

create policy "Admins and managers can view all payments"
  on public.payments
  for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role in ('ADMIN', 'MANAGER')
    )
  );

-- Atualizar RLS de licenses
create policy "Users can view own licenses"
  on public.licenses
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.users
      where id = auth.uid() and role in ('ADMIN', 'MANAGER')
    )
  );

-- Apenas admins podem gerenciar licenças standalone
create policy "Only admins can manage standalone licenses"
  on public.licenses
  for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Inserir planos iniciais
insert into public.plans (name, description, price_monthly, price_yearly, features)
values
  (
    'Básico',
    'Plano ideal para começar',
    29.00,
    290.00,
    '{"max_documents": 100, "support": "email", "features": ["Geração em lote", "Templates personalizados"]}'::jsonb
  ),
  (
    'Profissional',
    'Para uso profissional',
    49.00,
    468.00,
    '{"max_documents": 500, "support": "priority", "features": ["Geração em lote", "Templates personalizados", "Suporte prioritário", "API Access"]}'::jsonb
  ),
  (
    'Empresarial',
    'Solução completa para empresas',
    99.00,
    990.00,
    '{"max_documents": -1, "support": "dedicated", "features": ["Documentos ilimitados", "Templates personalizados", "Suporte dedicado", "API Access", "White label"]}'::jsonb
  )
on conflict (name) do nothing;
