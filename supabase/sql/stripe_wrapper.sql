-- Configurar Stripe Wrapper Extension
-- Documentação: https://supabase.com/docs/guides/database/extensions/wrappers/stripe

-- 1. Habilitar a extensão wrappers
create extension if not exists wrappers with schema extensions;

-- 2. Criar o Foreign Data Wrapper para Stripe
-- NOTA: A secret key deve ser configurada no Vault do Supabase
-- Se já existir, o comando DROP não fará nada (usando cascade apenas se necessário)

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
-- IMPORTANTE: Configure a secret key 'stripe_secret_key' no Vault do Supabase antes de executar (substitua pelo id da secret)

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

-- Customers do Stripe
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
drop foreign table if exists stripe_subscriptions cascade;
create foreign table stripe_subscriptions (
  id text,
  customer text,
  status text,
  current_period_start timestamp,
  current_period_end timestamp,
  cancel_at_period_end boolean,
  canceled_at timestamp,
  created timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'subscriptions'
);

-- Products do Stripe
drop foreign table if exists stripe_products cascade;
create foreign table stripe_products (
  id text,
  name text,
  description text,
  active boolean,
  created timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'products'
);

-- Prices do Stripe
drop foreign table if exists stripe_prices cascade;
create foreign table stripe_prices (
  id text,
  product text,
  active boolean,
  currency text,
  unit_amount bigint,
  recurring jsonb,
  created timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'prices'
);

-- Payment Intents do Stripe
drop foreign table if exists stripe_payment_intents cascade;
create foreign table stripe_payment_intents (
  id text,
  customer text,
  amount bigint,
  currency text,
  status text,
  created timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'payment_intents'
);

-- Invoices do Stripe
drop foreign table if exists stripe_invoices cascade;
create foreign table stripe_invoices (
  id text,
  customer text,
  subscription text,
  status text,
  amount_due bigint,
  amount_paid bigint,
  currency text,
  created timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'invoices'
);

-- 5. Criar views para facilitar consultas

-- View combinando dados locais com Stripe
-- NOTA: Esta view herda as permissões RLS das tabelas base (subscriptions e plans)
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
  ss.status as stripe_status,
  ss.attrs as stripe_data
from public.subscriptions s
left join public.plans p on s.plan_id = p.id
left join stripe_subscriptions ss on s.stripe_subscription_id = ss.id;

-- View de pagamentos com dados do Stripe
-- NOTA: Esta view herda as permissões RLS das tabelas base (payments)
create or replace view public.payments_with_stripe
with (security_invoker=true) as
select
  p.id,
  p.user_id,
  p.subscription_id,
  p.amount,
  p.currency,
  p.status as local_status,
  p.payment_method,
  p.paid_at,
  p.created_at,
  spi.status as stripe_status,
  spi.attrs as stripe_data
from public.payments p
left join stripe_payment_intents spi on p.stripe_payment_intent_id = spi.id;

-- 6. Função para sincronizar dados do Stripe com o banco local
create or replace function public.sync_stripe_subscription(p_subscription_id uuid)
returns void as $$
declare
  v_stripe_sub_id text;
  v_stripe_data record;
begin
  -- Buscar ID da subscription no Stripe
  select stripe_subscription_id into v_stripe_sub_id
  from public.subscriptions
  where id = p_subscription_id;

  if v_stripe_sub_id is null then
    raise exception 'Subscription does not have a Stripe ID';
  end if;

  -- Buscar dados no Stripe
  select * into v_stripe_data
  from stripe_subscriptions
  where id = v_stripe_sub_id;

  if not found then
    raise exception 'Subscription not found in Stripe';
  end if;

  -- Atualizar dados locais
  update public.subscriptions
  set
    status = case
      when v_stripe_data.status = 'active' then 'ACTIVE'
      when v_stripe_data.status = 'canceled' then 'CANCELED'
      when v_stripe_data.status = 'past_due' then 'PAST_DUE'
      else 'EXPIRED'
    end,
    current_period_start = v_stripe_data.current_period_start,
    current_period_end = v_stripe_data.current_period_end,
    cancel_at_period_end = v_stripe_data.cancel_at_period_end,
    canceled_at = v_stripe_data.canceled_at,
    updated_at = now()
  where id = p_subscription_id;
end;
$$ language plpgsql security definer;

-- Grant permissions
grant select on stripe_customers to authenticated;
grant select on stripe_subscriptions to authenticated;
grant select on stripe_products to authenticated;
grant select on stripe_prices to authenticated;
grant execute on function public.sync_stripe_subscription to authenticated;
