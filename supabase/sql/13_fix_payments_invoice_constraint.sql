-- ============================================
-- FIX: Add unique constraint on stripe_invoice_id
-- ============================================
-- Garante que não hajam pagamentos duplicados para a mesma invoice

-- Adicionar índice único para stripe_invoice_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_invoice_id_unique
ON public.payments (stripe_invoice_id)
WHERE stripe_invoice_id IS NOT NULL;

-- Adicionar índice para performance em queries
CREATE INDEX IF NOT EXISTS idx_payments_stripe_invoice_id
ON public.payments (stripe_invoice_id);
