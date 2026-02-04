-- ============================================
-- TABELA: contracts
-- Descrição: Contratos para licenças em lote
-- ============================================

-- Criar sequência para número do contrato
CREATE SEQUENCE IF NOT EXISTS contract_number_seq START 1000;

-- Criar tabela de contratos
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  -- Número do contrato (gerado automaticamente)
  contract_number TEXT NOT NULL UNIQUE,
  -- Dados da empresa/cliente
  company_name TEXT NOT NULL,
  representative_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  -- Dados do contrato
  value NUMERIC(10, 2) NOT NULL,
  -- Referência opcional ao orçamento
  quote_id UUID NULL,
  -- Rastreamento
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contracts_pkey PRIMARY KEY (id),
  CONSTRAINT contracts_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.enterprise_quotes(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contracts_email ON public.contracts USING btree (email);
CREATE INDEX IF NOT EXISTS idx_contracts_company ON public.contracts USING btree (company_name);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON public.contracts USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON public.contracts USING btree (contract_number);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Policies

-- Admins e managers podem ver todos os contratos
CREATE POLICY "Admins and managers can view all contracts"
  ON public.contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- Usuários podem ver contratos com seu email
CREATE POLICY "Users can view their own contracts"
  ON public.contracts
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Apenas admins e managers podem criar contratos
CREATE POLICY "Admins and managers can create contracts"
  ON public.contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- Apenas admins e managers podem atualizar contratos
CREATE POLICY "Admins and managers can update contracts"
  ON public.contracts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

-- Apenas admins podem deletar contratos
CREATE POLICY "Admins can delete contracts"
  ON public.contracts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass for contracts"
  ON public.contracts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ATUALIZAÇÃO: Tabela licenses
-- Adicionar coluna contract_id
-- ============================================

-- Adicionar coluna contract_id na tabela licenses
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS contract_id UUID NULL;

-- Adicionar foreign key
ALTER TABLE public.licenses
DROP CONSTRAINT IF EXISTS licenses_contract_id_fkey;

ALTER TABLE public.licenses
ADD CONSTRAINT licenses_contract_id_fkey
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

-- Índice para contract_id
CREATE INDEX IF NOT EXISTS idx_licenses_contract_id ON public.licenses USING btree (contract_id);

-- Comentários
COMMENT ON TABLE public.contracts IS 'Contratos para geração de licenças em lote';
COMMENT ON COLUMN public.contracts.contract_number IS 'Número único do contrato gerado automaticamente';
COMMENT ON COLUMN public.contracts.quote_id IS 'Referência opcional ao orçamento Enterprise que originou o contrato';
COMMENT ON COLUMN public.licenses.contract_id IS 'Referência ao contrato quando a licença foi gerada em lote';
