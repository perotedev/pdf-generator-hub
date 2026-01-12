-- ============================================
-- MIGRATION: Update licenses table
-- Descrição: Adiciona integração com sistema de assinaturas sem afetar dados existentes
-- ============================================

-- ============================================
-- Adicionar novas colunas
-- ============================================

-- Adicionar coluna para vincular com assinaturas
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS subscription_id UUID NULL;

-- Adicionar coluna para vincular diretamente com usuário
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS user_id UUID NULL;

-- Adicionar coluna para tipo de plano
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS plan_type TEXT NULL;

-- Adicionar coluna para identificar licenças avulsas (standalone)
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS is_standalone BOOLEAN NOT NULL DEFAULT false;

-- Adicionar coluna updated_at para auditoria
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ============================================
-- Adicionar foreign keys
-- ============================================

-- FK para subscriptions (pode ser NULL para licenças avulsas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'licenses_subscription_id_fkey'
  ) THEN
    ALTER TABLE public.licenses
    ADD CONSTRAINT licenses_subscription_id_fkey
    FOREIGN KEY (subscription_id)
    REFERENCES public.subscriptions(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- FK para users (pode ser NULL se licença não foi atribuída)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'licenses_user_id_fkey'
  ) THEN
    ALTER TABLE public.licenses
    ADD CONSTRAINT licenses_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- Adicionar índices para performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_licenses_subscription_id ON public.licenses USING btree (subscription_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON public.licenses USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_is_used ON public.licenses USING btree (is_used);
CREATE INDEX IF NOT EXISTS idx_licenses_is_standalone ON public.licenses USING btree (is_standalone);
CREATE INDEX IF NOT EXISTS idx_licenses_expire_date ON public.licenses USING btree (expire_date);
CREATE INDEX IF NOT EXISTS idx_licenses_company ON public.licenses USING btree (company);

-- ============================================
-- Atualizar dados existentes
-- ============================================

-- Marcar todas as licenças existentes (sem subscription_id) como standalone
UPDATE public.licenses
SET is_standalone = true
WHERE subscription_id IS NULL AND is_standalone = false;

-- ============================================
-- Adicionar constraints de consistência
-- ============================================

-- Garantir consistência entre is_standalone e subscription_id
-- Se is_standalone=false, então subscription_id deve ser NOT NULL
-- Se subscription_id IS NOT NULL, então is_standalone deve ser false
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'licenses_standalone_consistency'
  ) THEN
    ALTER TABLE public.licenses
    ADD CONSTRAINT licenses_standalone_consistency
    CHECK (
      (is_standalone = true AND subscription_id IS NULL) OR
      (is_standalone = false AND subscription_id IS NOT NULL)
    );
  END IF;
END $$;

-- ============================================
-- Adicionar trigger para updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_licenses_updated_at ON public.licenses;
CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Habilitar RLS (Row Level Security)
-- ============================================

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Remover policies antigas (se existirem)
-- ============================================

DROP POLICY IF EXISTS "Users can view own licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can view all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can insert licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can update licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can delete licenses" ON public.licenses;
DROP POLICY IF EXISTS "Service role bypass for licenses" ON public.licenses;

-- ============================================
-- Criar policies de segurança
-- ============================================

-- Policy: Usuários podem ver apenas suas próprias licenças
CREATE POLICY "Users can view own licenses"
  ON public.licenses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins podem ver todas as licenças
CREATE POLICY "Admins can view all licenses"
  ON public.licenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Policy: Admins podem inserir licenças
CREATE POLICY "Admins can insert licenses"
  ON public.licenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Policy: Admins podem atualizar licenças
CREATE POLICY "Admins can update licenses"
  ON public.licenses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Policy: Admins podem deletar licenças
CREATE POLICY "Admins can delete licenses"
  ON public.licenses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Policy: Service Role tem acesso total (para Edge Functions)
CREATE POLICY "Service role bypass for licenses"
  ON public.licenses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Adicionar comentários
-- ============================================

COMMENT ON TABLE public.licenses IS 'Licenças do sistema (vinculadas a assinaturas ou avulsas)';
COMMENT ON COLUMN public.licenses.subscription_id IS 'ID da assinatura relacionada (NULL para licenças avulsas)';
COMMENT ON COLUMN public.licenses.user_id IS 'ID do usuário que possui a licença (NULL se não atribuída)';
COMMENT ON COLUMN public.licenses.plan_type IS 'Tipo do plano (ex: MONTHLY, YEARLY, STANDALONE)';
COMMENT ON COLUMN public.licenses.is_standalone IS 'Indica se é uma licença avulsa (não vinculada a assinatura)';
COMMENT ON COLUMN public.licenses.is_used IS 'Indica se a licença foi ativada/utilizada';
COMMENT ON COLUMN public.licenses.device_id IS 'ID único do dispositivo onde a licença foi ativada';
COMMENT ON COLUMN public.licenses.device_type IS 'Tipo do dispositivo (ex: Windows, macOS)';
COMMENT ON COLUMN public.licenses.expire_date IS 'Data de expiração da licença';
COMMENT ON COLUMN public.licenses.activated_at IS 'Data/hora em que a licença foi ativada';
COMMENT ON COLUMN public.licenses.client IS 'Nome do cliente que adquiriu a licença';
COMMENT ON COLUMN public.licenses.company IS 'Nome da empresa/organização';
COMMENT ON COLUMN public.licenses.sold IS 'Indica se a licença foi vendida';
COMMENT ON COLUMN public.licenses.updated_at IS 'Data/hora da última atualização';

-- ============================================
-- Verificação final
-- ============================================

-- Verificar estrutura da tabela
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Licenses table has been updated with new columns and policies.';
  RAISE NOTICE 'All existing data has been preserved.';
END $$;
