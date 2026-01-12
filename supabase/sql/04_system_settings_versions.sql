-- ============================================
-- TABELAS: system_settings, system_versions
-- Descrição: Configurações do sistema e controle de versões
-- ============================================

-- ============================================
-- TABELA: system_settings
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id),
  CONSTRAINT system_settings_key_key UNIQUE (key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings USING btree (key);

-- Trigger
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Service role bypass for system settings" ON public.system_settings;

-- Policies
CREATE POLICY "Anyone can view system settings"
  ON public.system_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage system settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Service role bypass for system settings"
  ON public.system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Inserir configurações padrão
INSERT INTO public.system_settings (key, value, description) VALUES
  ('user_manual_url', '', 'URL do manual do usuário'),
  ('system_documentation_url', '', 'URL da documentação do sistema'),
  ('info_video_url', '', 'URL do vídeo informativo')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- TABELA: system_versions
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,
  release_date DATE NOT NULL,
  download_url TEXT NOT NULL,
  file_size VARCHAR(20) NULL,
  release_notes TEXT NULL,
  is_latest BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  minimum_requirements TEXT NULL,
  minimum_processor TEXT NULL,
  minimum_ram TEXT NULL,
  minimum_storage TEXT NULL,
  minimum_os TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT system_versions_pkey PRIMARY KEY (id),
  CONSTRAINT system_versions_version_key UNIQUE (version)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_system_versions_version ON public.system_versions USING btree (version);
CREATE INDEX IF NOT EXISTS idx_system_versions_is_latest ON public.system_versions USING btree (is_latest);
CREATE INDEX IF NOT EXISTS idx_system_versions_is_active ON public.system_versions USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_system_versions_release_date ON public.system_versions USING btree (release_date DESC);

-- Trigger
DROP TRIGGER IF EXISTS update_system_versions_updated_at ON public.system_versions;
CREATE TRIGGER update_system_versions_updated_at
  BEFORE UPDATE ON public.system_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para garantir que apenas uma versão seja marcada como "latest"
CREATE OR REPLACE FUNCTION public.ensure_single_latest_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_latest = true THEN
    -- Desmarcar todas as outras versões como latest
    UPDATE public.system_versions
    SET is_latest = false
    WHERE id != NEW.id AND is_latest = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para garantir única versão "latest"
DROP TRIGGER IF EXISTS trigger_ensure_single_latest_version ON public.system_versions;
CREATE TRIGGER trigger_ensure_single_latest_version
  BEFORE INSERT OR UPDATE OF is_latest ON public.system_versions
  FOR EACH ROW
  WHEN (NEW.is_latest = true)
  EXECUTE FUNCTION public.ensure_single_latest_version();

-- RLS
ALTER TABLE public.system_versions ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Anyone can view active versions" ON public.system_versions;
DROP POLICY IF EXISTS "Admins can view all versions" ON public.system_versions;
DROP POLICY IF EXISTS "Admins can insert versions" ON public.system_versions;
DROP POLICY IF EXISTS "Admins can update versions" ON public.system_versions;
DROP POLICY IF EXISTS "Admins can delete versions" ON public.system_versions;
DROP POLICY IF EXISTS "Service role bypass for system versions" ON public.system_versions;

-- Policies
CREATE POLICY "Anyone can view active versions"
  ON public.system_versions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all versions"
  ON public.system_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can insert versions"
  ON public.system_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update versions"
  ON public.system_versions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete versions"
  ON public.system_versions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Service role bypass for system versions"
  ON public.system_versions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Inserir versão de exemplo
INSERT INTO public.system_versions (
  version,
  release_date,
  download_url,
  file_size,
  release_notes,
  is_latest,
  is_active,
  minimum_processor,
  minimum_ram,
  minimum_storage,
  minimum_os,
  minimum_requirements
) VALUES (
  '1.0.0',
  CURRENT_DATE,
  'https://example.com/downloads/pdf-generator-1.0.0.exe',
  '125 MB',
  '# PDF Generator v1.0.0

## Novidades
- Geração ilimitada de PDFs
- Suporte a templates personalizados
- Assinaturas digitais
- Interface moderna e intuitiva

## Melhorias
- Performance otimizada
- Correções de bugs',
  true,
  true,
  'Intel Core i3 ou equivalente',
  '4 GB',
  '500 MB',
  'Windows 10 ou superior',
  'DirectX 11 ou superior'
) ON CONFLICT (version) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.system_settings IS 'Configurações gerais do sistema (chave-valor)';
COMMENT ON TABLE public.system_versions IS 'Versões do sistema disponíveis para download';
COMMENT ON COLUMN public.system_versions.version IS 'Número da versão (ex: 1.0.0, 1.2.5)';
COMMENT ON COLUMN public.system_versions.is_latest IS 'Indica se é a versão mais recente (apenas uma pode ser true)';
COMMENT ON COLUMN public.system_versions.is_active IS 'Indica se a versão está disponível para download';
COMMENT ON COLUMN public.system_versions.release_notes IS 'Notas da versão em Markdown';
COMMENT ON COLUMN public.system_versions.minimum_processor IS 'Requisitos mínimos do processador';
COMMENT ON COLUMN public.system_versions.minimum_ram IS 'Requisitos mínimos de memória RAM';
COMMENT ON COLUMN public.system_versions.minimum_storage IS 'Requisitos mínimos de armazenamento';
COMMENT ON COLUMN public.system_versions.minimum_os IS 'Sistema operacional mínimo';
