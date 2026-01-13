-- Fix para permitir criação de usuários via Google OAuth
-- Problema: A coluna password_hash é NOT NULL, mas usuários OAuth não têm senha

-- OPÇÃO 1: Alterar a coluna password_hash para ser nullable
-- Esta é a solução recomendada, pois usuários OAuth não precisam de senha
ALTER TABLE public.users
ALTER COLUMN password_hash DROP NOT NULL;

-- OPÇÃO 2: Se você quiser manter password_hash como NOT NULL,
-- descomente as linhas abaixo e comente a linha acima:
-- ALTER TABLE public.users
-- ALTER COLUMN password_hash SET DEFAULT '';
--
-- Então o trigger precisaria inserir uma string vazia como password_hash

-- Recriar a função do trigger para lidar corretamente com usuários OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Inserir ou atualizar usuário na tabela public.users
  -- Para usuários OAuth, password_hash será NULL
  INSERT INTO public.users (id, email, password_hash, name, role, status, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    NULL, -- Usuários OAuth não têm senha local
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

-- Verificar se o trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Se o trigger não existir, crie-o:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentário para documentação
COMMENT ON FUNCTION public.handle_new_user() IS
  'Cria automaticamente um registro na tabela public.users quando um usuário é criado via Supabase Auth (incluindo Google OAuth). Usuários OAuth têm password_hash NULL.';
