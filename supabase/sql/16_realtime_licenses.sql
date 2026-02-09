-- ============================================
-- MIGRATION: Habilitar Realtime na tabela licenses
-- Descrição:
--   Habilita Realtime (WebSocket) na tabela licenses para que
--   mudanças (ativação, desativação, etc.) sejam notificadas
--   em tempo real no frontend. Os eventos servem apenas como
--   gatilho para refetch dos dados via API autenticada.
-- ============================================

-- Adiciona a tabela licenses à publicação do Supabase Realtime (se ainda não estiver)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'licenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE licenses;
  END IF;
END $$;

-- ============================================
-- Verificação
-- ============================================

-- Verificar que o Realtime está habilitado na tabela:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

DO $$
BEGIN
  RAISE NOTICE 'Migration 16 completed: Realtime enabled for licenses table.';
END $$;

DROP POLICY IF EXISTS "Users can view licenses from their contracts" ON public.licenses;
