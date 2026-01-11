-- Script para corrigir problemas de segurança adicionais
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. Corrigir search_path da função sync_stripe_subscription
-- ============================================

-- Recriar a função com search_path definido
create or replace function public.sync_stripe_subscription(p_subscription_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
$$;

-- ============================================
-- 2. Revogar acesso público às foreign tables do Stripe
-- ============================================

-- Revogar todos os acessos públicos às foreign tables
revoke all on stripe_customers from public;
revoke all on stripe_customers from anon;
revoke all on stripe_customers from authenticated;

revoke all on stripe_subscriptions from public;
revoke all on stripe_subscriptions from anon;
revoke all on stripe_subscriptions from authenticated;

revoke all on stripe_products from public;
revoke all on stripe_products from anon;
revoke all on stripe_products from authenticated;

revoke all on stripe_prices from public;
revoke all on stripe_prices from anon;
revoke all on stripe_prices from authenticated;

revoke all on stripe_payment_intents from public;
revoke all on stripe_payment_intents from anon;
revoke all on stripe_payment_intents from authenticated;

revoke all on stripe_invoices from public;
revoke all on stripe_invoices from anon;
revoke all on stripe_invoices from authenticated;

-- ============================================
-- 3. Conceder acesso APENAS via service_role (Edge Functions)
-- ============================================

-- IMPORTANTE: As foreign tables do Stripe devem ser acessadas APENAS por Edge Functions
-- que usam o service_role_key, nunca diretamente pelos usuários

-- Nota: service_role tem acesso total por padrão, então não precisamos adicionar grants

-- ============================================
-- 4. Garantir que as views são a única forma de acesso
-- ============================================

-- As views já têm security_invoker=true e respeitam RLS
-- Conceder SELECT nas views para authenticated users
grant select on public.subscriptions_with_stripe to authenticated;
grant select on public.payments_with_stripe to authenticated;

-- ============================================
-- 5. Verificar configurações
-- ============================================

-- Verificar função
select
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as config_settings
from pg_proc
where proname = 'sync_stripe_subscription';

-- Verificar privilégios nas foreign tables (deve estar vazio para authenticated/anon)
select
  table_name,
  array_agg(distinct privilege_type) as privileges,
  grantee
from information_schema.table_privileges
where table_schema = 'public'
  and table_name like 'stripe_%'
  and table_name in ('stripe_customers', 'stripe_subscriptions', 'stripe_products',
                     'stripe_prices', 'stripe_payment_intents', 'stripe_invoices')
group by table_name, grantee
order by table_name, grantee;

-- Verificar privilégios nas views (deve ter SELECT para authenticated)
select
  table_name,
  array_agg(distinct privilege_type) as privileges,
  grantee
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('subscriptions_with_stripe', 'payments_with_stripe')
group by table_name, grantee
order by table_name, grantee;

-- Mensagem de sucesso
do $$
begin
  raise notice '✅ Correções de segurança aplicadas com sucesso!';
  raise notice '1. Função sync_stripe_subscription agora tem search_path definido';
  raise notice '2. Foreign tables do Stripe não são mais acessíveis via API';
  raise notice '3. Acesso aos dados do Stripe apenas via views com RLS';
end $$;
