-- ============================================
-- TABELA: verification_codes
-- Descrição: Códigos de verificação para email e recuperação de senha
-- ============================================

CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verification_codes_pkey PRIMARY KEY (id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes USING btree (email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON public.verification_codes USING btree (code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_type ON public.verification_codes USING btree (type);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes USING btree (expires_at);

-- RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Service role can manage verification codes" ON public.verification_codes;

-- Policy: Apenas Service Role pode acessar
CREATE POLICY "Service role can manage verification codes"
  ON public.verification_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Função para limpar códigos expirados (pode ser executada periodicamente)
CREATE OR REPLACE FUNCTION public.clean_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE expires_at < NOW() OR used = true;
END;
$$;

-- Comentários
COMMENT ON TABLE public.verification_codes IS 'Códigos temporários para verificação de email e recuperação de senha';
COMMENT ON COLUMN public.verification_codes.type IS 'Tipo do código: EMAIL_VERIFICATION ou PASSWORD_RESET';
COMMENT ON COLUMN public.verification_codes.expires_at IS 'Data de expiração do código (geralmente 15 minutos)';
COMMENT ON FUNCTION public.clean_expired_verification_codes() IS 'Limpa códigos expirados ou já usados';
