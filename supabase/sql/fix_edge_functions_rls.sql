-- Fix RLS policies to allow Service Role Key access for Edge Functions
-- Este script resolve o problema de "Invalid JWT" nas Edge Functions

-- ============================================
-- USERS TABLE - Adicionar bypass para Service Role
-- ============================================

-- Remover policies antigas que podem causar conflito
DROP POLICY IF EXISTS "Service role can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role can update all users" ON public.users;
DROP POLICY IF EXISTS "Service role can delete all users" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- Permitir que Service Role Key acesse tudo (bypass RLS)
-- Isso é seguro porque o Service Role Key só está disponível nas Edge Functions
CREATE POLICY "Service role bypass for users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- LICENSES TABLE - Adicionar RLS e bypass para Service Role
-- ============================================

-- Habilitar RLS na tabela licenses se ainda não estiver
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Users can view own licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can view all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can manage licenses" ON public.licenses;
DROP POLICY IF EXISTS "Service role bypass for licenses" ON public.licenses;

-- Policy para Service Role (usado pelas Edge Functions)
CREATE POLICY "Service role bypass for licenses"
  ON public.licenses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy para usuários visualizarem suas próprias licenças
CREATE POLICY "Users can view own licenses"
  ON public.licenses
  FOR SELECT
  TO authenticated
  USING (
    -- Licenças standalone (sem user_id) só podem ser vistas por admins
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    -- Admins podem ver todas as licenças
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  );

-- Policy para admins gerenciarem licenças
CREATE POLICY "Admins can manage all licenses"
  ON public.licenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  );

-- ============================================
-- VERIFICAÇÃO E INFORMAÇÕES
-- ============================================

-- Verificar se as policies foram criadas
DO $$
BEGIN
  RAISE NOTICE 'RLS Policies atualizadas com sucesso!';
  RAISE NOTICE 'Service Role agora pode acessar users e licenses sem restrições';
  RAISE NOTICE 'Usuários autenticados continuam com suas permissões normais';
END $$;

-- Listar todas as policies da tabela users (para debug)
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('users', 'licenses')
ORDER BY tablename, policyname;
