-- Permitir que usuários não autenticados vejam os planos ativos
-- Esta política é necessária para a página pública de Planos funcionar

-- Remover políticas antigas conflitantes (se existirem)
DROP POLICY IF EXISTS "Public can view active plans" ON public.plans;
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;

-- Criar política para visualização pública dos planos ativos
CREATE POLICY "Public can view active plans"
  ON public.plans
  FOR SELECT
  USING (is_active = true);

-- Verificar se a política foi criada
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'plans'
ORDER BY policyname;

-- Resultado esperado: deve aparecer a policy "Public can view active plans"
