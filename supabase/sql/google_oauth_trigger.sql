-- Trigger para criar usuários automaticamente quando fazem login com Google OAuth
-- Este script deve ser executado no SQL Editor do Supabase Dashboard

-- 1. Criar a função que será executada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Inserir ou atualizar usuário na tabela public.users
  INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    -- Tenta pegar o nome completo dos metadados do Google, senão usa o email
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'USER', -- Role padrão
    'ACTIVE', -- Status ativo
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, users.name),
    email = EXCLUDED.email,
    updated_at = now();

  RETURN new;
END;
$$;

-- 2. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Criar o trigger na tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Adicionar comentários para documentação
COMMENT ON FUNCTION public.handle_new_user() IS
  'Cria automaticamente um registro na tabela public.users quando um usuário é criado via Supabase Auth (incluindo Google OAuth)';

-- 5. Testar se o trigger foi criado corretamente
-- Execute a query abaixo para verificar:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
