-- ============================================
-- TABELA: enterprise_quotes
-- Descrição: Solicitações de orçamento Enterprise
-- ============================================

-- Primeiro, atualizar o constraint de status da tabela subscriptions para incluir PENDING_PAYMENT
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE', 'PENDING_PAYMENT'));

-- Criar tabela de orçamentos Enterprise
CREATE TABLE IF NOT EXISTS public.enterprise_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  -- Dados do solicitante
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NULL,
  -- Detalhes do orçamento
  license_quantity INTEGER NOT NULL DEFAULT 1,
  billing_preference TEXT NOT NULL CHECK (billing_preference IN ('MONTHLY', 'YEARLY', 'CUSTOM')),
  message TEXT NULL,
  -- Status do orçamento
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'CONVERTED')),
  -- Campos de administração
  admin_notes TEXT NULL,
  quoted_price NUMERIC(10, 2) NULL,
  assigned_to UUID NULL,
  contacted_at TIMESTAMPTZ NULL,
  -- Rastreamento
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT enterprise_quotes_pkey PRIMARY KEY (id),
  CONSTRAINT enterprise_quotes_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_enterprise_quotes_email ON public.enterprise_quotes USING btree (email);
CREATE INDEX IF NOT EXISTS idx_enterprise_quotes_status ON public.enterprise_quotes USING btree (status);
CREATE INDEX IF NOT EXISTS idx_enterprise_quotes_created_at ON public.enterprise_quotes USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_quotes_assigned_to ON public.enterprise_quotes USING btree (assigned_to);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_enterprise_quotes_updated_at ON public.enterprise_quotes;
CREATE TRIGGER update_enterprise_quotes_updated_at
  BEFORE UPDATE ON public.enterprise_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.enterprise_quotes ENABLE ROW LEVEL SECURITY;

-- Policies
-- Qualquer pessoa pode criar um orçamento
CREATE POLICY "Anyone can create enterprise quotes"
  ON public.enterprise_quotes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Apenas admins e managers podem ver todos os orçamentos
CREATE POLICY "Admins can view all enterprise quotes"
  ON public.enterprise_quotes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- Apenas admins podem atualizar orçamentos
CREATE POLICY "Admins can update enterprise quotes"
  ON public.enterprise_quotes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Apenas admins podem deletar orçamentos
CREATE POLICY "Admins can delete enterprise quotes"
  ON public.enterprise_quotes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass for enterprise quotes"
  ON public.enterprise_quotes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE public.enterprise_quotes IS 'Solicitações de orçamento para planos Enterprise';
COMMENT ON COLUMN public.enterprise_quotes.status IS 'Status: PENDING (novo), CONTACTED (cliente contactado), NEGOTIATING (em negociação), APPROVED (aprovado), REJECTED (rejeitado), CONVERTED (convertido em assinatura)';
COMMENT ON COLUMN public.enterprise_quotes.billing_preference IS 'Preferência de cobrança: MONTHLY (mensal), YEARLY (anual), CUSTOM (personalizado)';
