-- ============================================
-- CORREÇÃO: Recursão infinita nas políticas RLS da tabela users
-- Descrição: Corrige o erro "infinite recursion detected in policy for relation users"
-- ============================================

-- 1. Criar função SECURITY DEFINER para verificar role do usuário
-- Esta função bypassa o RLS e evita recursão infinita
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.users WHERE id = user_id LIMIT 1;
$$;

-- 2. Remover todas as políticas antigas da tabela users
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins and managers can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins and managers can update users" ON public.users;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Service role bypass for users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update data" ON public.users;

-- 3. Criar novas políticas sem recursão

-- SELECT: Usuário pode ver seus próprios dados OU admins/managers podem ver todos
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- INSERT: Permitir criação de novos usuários (para OAuth/registro)
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Usuário pode atualizar seus dados OU admins/managers podem atualizar qualquer um
CREATE POLICY "Users can update data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) IN ('ADMIN', 'MANAGER')
  );

-- DELETE: Apenas admins podem deletar
CREATE POLICY "Only admins can delete users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'ADMIN');

-- Service Role: Acesso total para Edge Functions
CREATE POLICY "Service role bypass for users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comentário
COMMENT ON FUNCTION public.get_user_role IS 'Função auxiliar para verificar role do usuário sem causar recursão RLS';
