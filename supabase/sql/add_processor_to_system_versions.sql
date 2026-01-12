-- Adicionar campo de requisitos de processador à tabela system_versions
ALTER TABLE public.system_versions
ADD COLUMN IF NOT EXISTS minimum_processor TEXT;

-- Comentário na coluna
COMMENT ON COLUMN public.system_versions.minimum_processor IS 'Requisitos mínimos do processador (ex: Intel Core i3 ou equivalente)';
