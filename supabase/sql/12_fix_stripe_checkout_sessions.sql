-- ============================================
-- FIX: Remover tabela stripe_checkout_sessions
-- ============================================
-- A tabela stripe_checkout_sessions NÃO é suportada pelo Stripe Wrapper
-- Isso causa o erro: "HV008: target column number not match"
-- Checkout sessions devem ser acessadas via API do Stripe diretamente

-- Remover a foreign table se existir
DROP FOREIGN TABLE IF EXISTS stripe_checkout_sessions CASCADE;

-- Garantir que não existe nenhuma view ou dependência
DROP VIEW IF EXISTS public.checkout_sessions_view CASCADE;
