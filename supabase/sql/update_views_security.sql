-- Script para atualizar views com security_invoker
-- Execute este script no SQL Editor do Supabase para corrigir os avisos de SECURITY DEFINER

-- 1. Recriar view de subscriptions com security_invoker
drop view if exists public.subscriptions_with_stripe cascade;

create view public.subscriptions_with_stripe
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

-- 2. Recriar view de payments com security_invoker
drop view if exists public.payments_with_stripe cascade;

create view public.payments_with_stripe
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

-- 3. Verificar se as views foram criadas corretamente
select
  schemaname,
  viewname,
  viewowner
from pg_views
where schemaname = 'public'
  and viewname in ('subscriptions_with_stripe', 'payments_with_stripe');

-- Mensagem de sucesso
do $$
begin
  raise notice 'Views atualizadas com sucesso! Agora usam security_invoker=true';
end $$;
