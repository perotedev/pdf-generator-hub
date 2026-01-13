-- ============================================
-- CORREÇÃO: Permitir acesso público à tabela plans
-- Descrição: Permite que usuários não autenticados vejam os planos ativos
-- ============================================

-- Remover política antiga
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;

-- Criar política que permite acesso anônimo (público) aos planos ativos
CREATE POLICY "Public can view active plans"
  ON public.plans
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
