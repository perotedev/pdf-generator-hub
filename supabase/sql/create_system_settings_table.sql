-- Tabela para configurações do sistema (links de documentação, etc)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por chave
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Todos podem ler as configurações
CREATE POLICY "Anyone can view system settings"
  ON public.system_settings
  FOR SELECT
  USING (true);

-- Apenas admins podem criar/atualizar configurações
CREATE POLICY "Admins can insert system settings"
  ON public.system_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update system settings"
  ON public.system_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Inserir configurações padrão
INSERT INTO public.system_settings (key, value, description) VALUES
  ('user_manual_url', '', 'URL do manual do usuário (PDF ou link externo)'),
  ('system_documentation_url', '', 'URL da documentação técnica do sistema'),
  ('info_video_url', '', 'URL do vídeo informativo (YouTube, Vimeo, etc)')
ON CONFLICT (key) DO NOTHING;

-- Comentários
COMMENT ON TABLE public.system_settings IS 'Configurações globais do sistema';
COMMENT ON COLUMN public.system_settings.key IS 'Chave única da configuração';
COMMENT ON COLUMN public.system_settings.value IS 'Valor da configuração (pode ser URL, texto, JSON, etc)';
