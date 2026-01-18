-- Configurar Stripe Wrapper Extension
-- Documentação: https://supabase.com/docs/guides/database/extensions/wrappers/stripe
-- IMPORTANTE: Atualizado para corresponder à estrutura atual do Supabase Stripe Wrapper

-- 1. Habilitar a extensão wrappers
create extension if not exists wrappers with schema extensions;

-- 2. Criar o Foreign Data Wrapper para Stripe
-- NOTA: A secret key deve ser configurada no Vault do Supabase

do $$
begin
  if not exists (
    select 1 from pg_foreign_data_wrapper where fdwname = 'stripe_wrapper'
  ) then
    create foreign data wrapper stripe_wrapper
      handler stripe_fdw_handler
      validator stripe_fdw_validator;
  end if;
end $$;

-- 3. Criar o servidor Stripe
-- IMPORTANTE: Configure a secret key 'stripe_secret_key' no Vault do Supabase antes de executar

do $$
begin
  if not exists (
    select 1 from pg_foreign_server where srvname = 'stripe_server'
  ) then
    create server stripe_server
      foreign data wrapper stripe_wrapper
      options (
        api_key_id 'stripe_secret_key'
      );
  end if;
end $$;

-- 4. Criar tabelas estrangeiras para acessar dados do Stripe
-- NOTA: As colunas DEVEM corresponder EXATAMENTE ao que o Stripe Wrapper retorna
-- Referência: https://github.com/supabase/wrappers/tree/main/wrappers/src/fdw/stripe_fdw

-- Customers do Stripe
-- Colunas suportadas pelo Stripe Wrapper para customers
drop foreign table if exists stripe_customers cascade;
create foreign table stripe_customers (
  id text,
  email text,
  name text,
  description text,
  created timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'customers'
);

-- Subscriptions do Stripe
-- Colunas suportadas pelo Stripe Wrapper para subscriptions
drop foreign table if exists stripe_subscriptions cascade;
create foreign table stripe_subscriptions (
  id text,
  customer text,
  currency text,
  current_period_start timestamp,
  current_period_end timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'subscriptions'
);

-- Products do Stripe
-- Colunas suportadas pelo Stripe Wrapper para products
drop foreign table if exists stripe_products cascade;
create foreign table stripe_products (
  id text,
  name text,
  active boolean,
  default_price text,
  description text,
  created timestamp,
  updated timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'products'
);

-- Prices do Stripe (Preços)
-- Colunas suportadas pelo Stripe Wrapper para prices
drop foreign table if exists stripe_prices cascade;
create foreign table stripe_prices (
  id text,
  active boolean,
  currency text,
  product text,
  unit_amount bigint,
  type text,
  created timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'prices'
);

-- Payment Intents do Stripe
-- Colunas suportadas pelo Stripe Wrapper para payment_intents
drop foreign table if exists stripe_payment_intents cascade;
create foreign table stripe_payment_intents (
  id text,
  customer text,
  amount bigint,
  currency text,
  payment_method text,
  created timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'payment_intents'
);

-- Invoices do Stripe
-- Colunas suportadas pelo Stripe Wrapper para invoices
drop foreign table if exists stripe_invoices cascade;
create foreign table stripe_invoices (
  id text,
  customer text,
  subscription text,
  status text,
  total bigint,
  currency text,
  period_start timestamp,
  period_end timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'invoices'
);

-- Charges do Stripe (adicional - útil para histórico de pagamentos)
drop foreign table if exists stripe_charges cascade;
create foreign table stripe_charges (
  id text,
  amount bigint,
  currency text,
  customer text,
  description text,
  invoice text,
  payment_intent text,
  status text,
  created timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'charges'
);

-- NOTA: stripe_checkout_sessions foi removido pois não é suportado pelo Stripe Wrapper
-- Para acessar dados de checkout sessions, use a API do Stripe diretamente via Edge Functions

-- 5. Criar views para facilitar consultas
-- NOTA: Views usam security_invoker para herdar permissões RLS das tabelas base

-- View combinando dados locais com Stripe
create or replace view public.subscriptions_with_stripe
with (security_invoker=true) as
select
  s.id,
  s.user_id,
  s.plan_id,
  p.name as plan_name,
  p.billing_cycle,
  p.price,
  s.status as local_status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.created_at,
  ss.attrs->>'status' as stripe_status,
  ss.attrs as stripe_data
from public.subscriptions s
left join public.plans p on s.plan_id = p.id
left join stripe_subscriptions ss on s.stripe_subscription_id = ss.id;

-- View de pagamentos com dados do Stripe
create or replace view public.payments_with_stripe
with (security_invoker=true) as
select
  pay.id,
  pay.user_id,
  pay.subscription_id,
  pay.amount,
  pay.currency,
  pay.status as local_status,
  pay.payment_method,
  pay.paid_at,
  pay.created_at,
  spi.attrs->>'status' as stripe_status,
  spi.attrs as stripe_data
from public.payments pay
left join stripe_payment_intents spi on pay.stripe_payment_intent_id = spi.id;

-- 6. Função para sincronizar dados do Stripe com o banco local
create or replace function public.sync_stripe_subscription(p_subscription_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stripe_sub_id text;
  v_stripe_data record;
  v_status text;
begin
  -- Buscar ID da subscription no Stripe
  select stripe_subscription_id into v_stripe_sub_id
  from public.subscriptions
  where id = p_subscription_id;

  if v_stripe_sub_id is null then
    raise exception 'Subscription does not have a Stripe ID';
  end if;

  -- Buscar dados no Stripe (usando attrs para obter campos adicionais)
  select
    id,
    customer,
    current_period_start,
    current_period_end,
    attrs->>'status' as status,
    (attrs->>'cancel_at_period_end')::boolean as cancel_at_period_end,
    (attrs->>'canceled_at')::timestamp as canceled_at
  into v_stripe_data
  from stripe_subscriptions
  where id = v_stripe_sub_id;

  if not found then
    raise exception 'Subscription not found in Stripe';
  end if;

  -- Mapear status do Stripe para status local
  v_status := case
    when v_stripe_data.status = 'active' then 'ACTIVE'
    when v_stripe_data.status = 'canceled' then 'CANCELED'
    when v_stripe_data.status = 'past_due' then 'PAST_DUE'
    when v_stripe_data.status = 'unpaid' then 'PAST_DUE'
    when v_stripe_data.status = 'incomplete' then 'PENDING'
    when v_stripe_data.status = 'incomplete_expired' then 'EXPIRED'
    when v_stripe_data.status = 'trialing' then 'ACTIVE'
    else 'EXPIRED'
  end;

  -- Atualizar dados locais
  update public.subscriptions
  set
    status = v_status,
    current_period_start = v_stripe_data.current_period_start,
    current_period_end = v_stripe_data.current_period_end,
    cancel_at_period_end = coalesce(v_stripe_data.cancel_at_period_end, false),
    canceled_at = v_stripe_data.canceled_at,
    updated_at = now()
  where id = p_subscription_id;
end;
$$;

-- 7. Configurar permissões de segurança

-- IMPORTANTE: Foreign tables do Stripe NÃO devem ser acessíveis via API
-- Elas não respeitam RLS e contêm dados sensíveis
-- Acesso deve ser apenas via service_role (Edge Functions)

-- Revogar todo acesso público às foreign tables
revoke all on stripe_customers from public, anon, authenticated;
revoke all on stripe_subscriptions from public, anon, authenticated;
revoke all on stripe_products from public, anon, authenticated;
revoke all on stripe_prices from public, anon, authenticated;
revoke all on stripe_payment_intents from public, anon, authenticated;
revoke all on stripe_invoices from public, anon, authenticated;
revoke all on stripe_charges from public, anon, authenticated;

-- Conceder SELECT nas views (que respeitam RLS) para authenticated users
grant select on public.subscriptions_with_stripe to authenticated;
grant select on public.payments_with_stripe to authenticated;

-- Conceder execução da função de sincronização para authenticated users
grant execute on function public.sync_stripe_subscription to authenticated;

DROP FOREIGN TABLE IF EXISTS stripe_checkout_sessions CASCADE;
