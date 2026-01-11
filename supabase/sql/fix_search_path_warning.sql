-- Fix: Function public.update_updated_at_column has a role mutable search_path
-- Este script adiciona search_path seguro à função update_updated_at_column

-- Recriar a função com search_path explícito
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Verificar se a função foi atualizada corretamente
SELECT
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    p.prosecdef AS security_definer,
    p.proconfig AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_updated_at_column';

-- Resultado esperado: config_settings deve mostrar search_path definido
