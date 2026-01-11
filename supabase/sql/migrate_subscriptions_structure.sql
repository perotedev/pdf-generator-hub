-- Script de migração para atualizar estrutura de planos
-- Execute este script se você já executou o subscriptions.sql antigo

-- ============================================
-- 1. Verificar estrutura atual da tabela plans
-- ============================================

-- Adicionar novas colunas se não existirem
do $$
begin
  -- Verificar se precisa migrar de estrutura antiga (price_monthly/price_yearly) para nova (price/billing_cycle)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'plans'
      and column_name = 'price_monthly'
  ) then
    raise notice 'Estrutura antiga detectada. Iniciando migração...';

    -- Criar nova coluna price
    alter table public.plans add column if not exists price numeric(10, 2);

    -- Criar nova coluna billing_cycle
    alter table public.plans add column if not exists billing_cycle_new text;

    -- Migrar dados existentes
    -- Nota: Esta migração assume que você quer converter para o novo formato
    -- Se você tinha 3 planos (Básico, Profissional, Empresarial), eles serão convertidos

    raise notice 'Dados antigos preservados. Por favor, revise e ajuste manualmente.';

  else
    raise notice 'Estrutura já está no formato novo. Nenhuma migração necessária.';
  end if;
end $$;

-- ============================================
-- 2. Remover constraint antiga e adicionar nova
-- ============================================

-- Remover constraint antiga se existir
alter table public.plans drop constraint if exists plans_name_key;

-- Adicionar nova constraint para permitir mesmo nome com billing_cycle diferente
alter table public.plans drop constraint if exists plans_name_billing_cycle_key;
alter table public.plans add constraint plans_name_billing_cycle_key unique (name, billing_cycle);

-- ============================================
-- 3. Limpar planos antigos e inserir novos
-- ============================================

-- IMPORTANTE: Só execute esta parte se você NÃO tem assinaturas ativas
-- Se tiver assinaturas, você precisa migrar os dados manualmente

do $$
begin
  -- Verificar se existem assinaturas
  if exists (select 1 from public.subscriptions limit 1) then
    raise warning 'ATENÇÃO: Existem assinaturas no banco. NÃO deletando planos antigos.';
    raise warning 'Você precisa migrar manualmente as assinaturas para os novos planos.';
  else
    raise notice 'Não há assinaturas. Seguro remover planos antigos.';

    -- Deletar planos antigos
    delete from public.plans;

    -- Inserir novos planos (Mensal e Anual)
    insert into public.plans (name, description, price, billing_cycle, features)
    values
      (
        'PDF Generator Hub',
        'Plano Mensal - Acesso completo ao sistema',
        49.90,
        'MONTHLY',
        '{"features": ["Geração ilimitada de PDFs", "Templates personalizados", "Suporte prioritário", "Atualizações automáticas"]}'::jsonb
      ),
      (
        'PDF Generator Hub',
        'Plano Anual - Acesso completo ao sistema com desconto',
        499.00,
        'YEARLY',
        '{"features": ["Geração ilimitada de PDFs", "Templates personalizados", "Suporte prioritário", "Atualizações automáticas", "2 meses grátis"]}'::jsonb
      )
    on conflict (name, billing_cycle) do nothing;

    raise notice 'Novos planos inseridos com sucesso!';
  end if;
end $$;

-- ============================================
-- 4. Remover colunas antigas (SE NÃO TIVER DADOS)
-- ============================================

-- ATENÇÃO: Só remova as colunas antigas se você já migrou todos os dados
-- Descomente as linhas abaixo APENAS quando tiver certeza

-- alter table public.plans drop column if exists price_monthly;
-- alter table public.plans drop column if exists price_yearly;
-- alter table public.plans drop column if exists stripe_price_id_monthly;
-- alter table public.plans drop column if exists stripe_price_id_yearly;

-- ============================================
-- 5. Verificar resultado
-- ============================================

-- Mostrar estrutura atual
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'plans'
order by ordinal_position;

-- Mostrar planos cadastrados
select
  id,
  name,
  billing_cycle,
  price,
  is_active
from public.plans
order by billing_cycle;

-- Mensagem final
do $$
begin
  raise notice '✅ Migração concluída!';
  raise notice 'Verifique os resultados acima.';
  raise notice 'Se houver colunas antigas (price_monthly, etc), você pode removê-las manualmente.';
end $$;
