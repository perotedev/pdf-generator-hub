-- Configurar Stripe Wrapper Extension
-- Documentação: https://supabase.com/docs/guides/database/extensions/wrappers/stripe

-- 1. Habilitar a extensão wrappers
create extension if not exists wrappers with schema extensions;

-- 2. Criar o Foreign Data Wrapper para Stripe
-- NOTA: Você precisa substituir 'YOUR_STRIPE_SECRET_KEY' pela sua chave secreta do Stripe
-- Isso deve ser feito via interface do Supabase ou variáveis de ambiente

create foreign data wrapper if not exists stripe_wrapper
  handler stripe_fdw_handler
  validator stripe_fdw_validator;

-- 3. Criar o servidor Stripe
-- IMPORTANTE: Configure a secret key nas variáveis de ambiente do Supabase
create server if not exists stripe_server
  foreign data wrapper stripe_wrapper
  options (
    api_key_id 'stripe_secret_key'  -- Referência para a chave armazenada no Vault do Supabase
  );

-- 4. Criar tabelas estrangeiras para acessar dados do Stripe

-- Customers do Stripe
create foreign table if not exists stripe_customers (
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
create foreign table if not exists stripe_subscriptions (
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
create foreign table if not exists stripe_products (
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
create foreign table if not exists stripe_prices (
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
create foreign table if not exists stripe_payment_intents (
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
create foreign table if not exists stripe_invoices (
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
create or replace view public.subscriptions_with_stripe as
select
  s.id,
  s.user_id,
  s.plan_id,
  s.status as local_status,
  s.billing_cycle,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.created_at,
  ss.status as stripe_status,
  ss.attrs as stripe_data
from public.subscriptions s
left join stripe_subscriptions ss on s.stripe_subscription_id = ss.id;

-- View de pagamentos com dados do Stripe
create or replace view public.payments_with_stripe as
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
