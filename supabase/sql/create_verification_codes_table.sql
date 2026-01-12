-- Tabela para armazenar códigos de verificação (email e recuperação de senha)
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')),
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON public.verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON public.verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_type ON public.verification_codes(type);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_verification_codes_updated_at
  BEFORE UPDATE ON public.verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios códigos
CREATE POLICY "Users can view own verification codes"
  ON public.verification_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas o sistema pode criar códigos (via Edge Functions)
CREATE POLICY "Service role can insert verification codes"
  ON public.verification_codes
  FOR INSERT
  WITH CHECK (true);

-- Apenas o sistema pode atualizar códigos
CREATE POLICY "Service role can update verification codes"
  ON public.verification_codes
  FOR UPDATE
  USING (true);

-- Função para limpar códigos expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION clean_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Comentários
COMMENT ON TABLE public.verification_codes IS 'Armazena códigos de verificação de email e recuperação de senha';
COMMENT ON COLUMN public.verification_codes.type IS 'Tipo do código: EMAIL_VERIFICATION ou PASSWORD_RESET';
COMMENT ON COLUMN public.verification_codes.expires_at IS 'Data e hora de expiração do código (15 minutos)';
COMMENT ON COLUMN public.verification_codes.verified_at IS 'Data e hora em que o código foi verificado';
