-- Tabela para gerenciar versões do sistema (para download)
CREATE TABLE IF NOT EXISTS public.system_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,
  release_date DATE NOT NULL,
  download_url TEXT NOT NULL,
  file_size VARCHAR(20), -- Ex: "125 MB"
  release_notes TEXT,
  is_latest BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  minimum_requirements TEXT, -- JSON ou texto com requisitos mínimos
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_system_versions_version ON public.system_versions(version);
CREATE INDEX IF NOT EXISTS idx_system_versions_is_latest ON public.system_versions(is_latest);
CREATE INDEX IF NOT EXISTS idx_system_versions_is_active ON public.system_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_system_versions_release_date ON public.system_versions(release_date DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_versions_updated_at
  BEFORE UPDATE ON public.system_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para garantir que apenas uma versão seja marcada como "latest"
CREATE OR REPLACE FUNCTION ensure_single_latest_version()
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

-- Trigger para executar a função
CREATE TRIGGER trigger_ensure_single_latest_version
  BEFORE INSERT OR UPDATE OF is_latest ON public.system_versions
  FOR EACH ROW
  WHEN (NEW.is_latest = true)
  EXECUTE FUNCTION ensure_single_latest_version();

-- RLS Policies
ALTER TABLE public.system_versions ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar versões ativas
CREATE POLICY "Anyone can view active versions"
  ON public.system_versions
  FOR SELECT
  USING (is_active = true);

-- Admins podem ver todas as versões
CREATE POLICY "Admins can view all versions"
  ON public.system_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Apenas admins podem criar versões
CREATE POLICY "Admins can insert versions"
  ON public.system_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Apenas admins podem atualizar versões
CREATE POLICY "Admins can update versions"
  ON public.system_versions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Apenas admins podem deletar versões
CREATE POLICY "Admins can delete versions"
  ON public.system_versions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Inserir versão de exemplo
INSERT INTO public.system_versions (
  version,
  release_date,
  download_url,
  file_size,
  release_notes,
  is_latest,
  is_active,
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
- Correções de bugs

## Requisitos
- Windows 10 ou superior
- 4GB de RAM
- 500MB de espaço em disco',
  true,
  true,
  'Windows 10 ou superior, 4GB RAM, 500MB espaço livre'
) ON CONFLICT (version) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.system_versions IS 'Versões do sistema disponíveis para download';
COMMENT ON COLUMN public.system_versions.version IS 'Número da versão (ex: 1.0.0, 1.2.5)';
COMMENT ON COLUMN public.system_versions.is_latest IS 'Indica se é a versão mais recente (apenas uma pode ser true)';
COMMENT ON COLUMN public.system_versions.is_active IS 'Indica se a versão está disponível para download';
COMMENT ON COLUMN public.system_versions.release_notes IS 'Notas da versão em Markdown';
