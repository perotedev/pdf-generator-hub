-- Adicionar campos estruturados de requisitos à tabela system_versions
ALTER TABLE public.system_versions
ADD COLUMN IF NOT EXISTS minimum_processor TEXT,
ADD COLUMN IF NOT EXISTS minimum_ram TEXT,
ADD COLUMN IF NOT EXISTS minimum_storage TEXT,
ADD COLUMN IF NOT EXISTS minimum_os TEXT;

-- Comentários nas colunas
COMMENT ON COLUMN public.system_versions.minimum_processor IS 'Requisitos mínimos do processador (ex: Intel Core i3 ou equivalente)';
COMMENT ON COLUMN public.system_versions.minimum_ram IS 'Requisitos mínimos de memória RAM (ex: 4 GB)';
COMMENT ON COLUMN public.system_versions.minimum_storage IS 'Requisitos mínimos de armazenamento (ex: 500 MB)';
COMMENT ON COLUMN public.system_versions.minimum_os IS 'Sistema operacional mínimo (ex: Windows 10 ou superior)';
