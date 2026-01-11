# Correção: Valores dos Planos não Refletem o Banco de Dados

## Problema Identificado

Os valores dos planos não estão sendo exibidos corretamente na página Admin porque as políticas RLS (Row Level Security) da tabela `plans` não permitem que administradores atualizem os preços.

## Solução

Execute o script SQL abaixo no seu projeto Supabase para corrigir as políticas RLS:

### Passo 1: Acessar o SQL Editor no Supabase

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto: `lppqqjivhmlqnkhdfnib`
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o Script de Correção

Copie e cole o conteúdo do arquivo `supabase/sql/fix_plans_rls.sql` no SQL Editor e execute.

Ou execute o seguinte SQL diretamente:

```sql
-- Fix RLS policies for plans table to allow admin management

-- Drop existing policy if exists
drop policy if exists "Anyone can view active plans" on public.plans;

-- Recreate policy for viewing active plans (all users)
create policy "Anyone can view active plans"
  on public.plans
  for select
  using (is_active = true);

-- Add policy for admins to view all plans (including inactive)
create policy "Admins can view all plans"
  on public.plans
  for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Add policy for admins to update plans
create policy "Admins can update plans"
  on public.plans
  for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Add policy for admins to insert plans
create policy "Admins can insert plans"
  on public.plans
  for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Add policy for admins to delete plans
create policy "Admins can delete plans"
  on public.plans
  for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'ADMIN'
    )
  );
```

### Passo 3: Verificar os Dados

Após executar o script, verifique se os planos estão cadastrados corretamente:

```sql
-- Ver todos os planos cadastrados
SELECT * FROM public.plans ORDER BY billing_cycle;
```

Os planos iniciais já foram inseridos com os seguintes valores:
- **Mensal**: R$ 49,90
- **Anual**: R$ 499,00

### Passo 4: Testar a Aplicação

1. Recarregue a página Admin no navegador
2. Abra o DevTools (F12) e vá até a aba Console
3. Você deverá ver os logs:
   - "Plans fetched from database: [...]"
   - "Monthly plan: {...}"
   - "Annual plan: {...}"
4. Os valores corretos devem aparecer na interface

## Explicação Técnica

### O que estava errado?

A política RLS original apenas permitia que **todos os usuários** vissem planos ativos:

```sql
create policy "Anyone can view active plans"
  on public.plans
  for select
  using (is_active = true);
```

Mas não havia políticas para:
- Admins visualizarem **todos** os planos (inclusive inativos)
- Admins **atualizarem** os preços
- Admins **inserirem** novos planos
- Admins **excluírem** planos

### O que foi corrigido?

Foram adicionadas 4 novas políticas:
1. **Admins can view all plans** - Permite que admins vejam todos os planos
2. **Admins can update plans** - Permite que admins atualizem preços
3. **Admins can insert plans** - Permite que admins criem novos planos
4. **Admins can delete plans** - Permite que admins excluam planos

Todas essas políticas verificam se o usuário logado tem `role = 'ADMIN'` na tabela `users`.

## Troubleshooting

### Erro: "new row violates row-level security policy"

Isso significa que você não está logado como ADMIN. Verifique:

```sql
-- Verificar seu usuário atual
SELECT id, email, name, role FROM public.users WHERE id = auth.uid();
```

Se necessário, promova seu usuário a ADMIN:

```sql
-- Substitua 'seu-email@exemplo.com' pelo seu email
UPDATE public.users SET role = 'ADMIN' WHERE email = 'seu-email@exemplo.com';
```

### Os valores ainda não aparecem

1. Verifique o console do navegador (F12 → Console) para ver os logs de debug
2. Verifique se há erros de autenticação
3. Certifique-se de que está logado com um usuário ADMIN
4. Limpe o cache do navegador (Ctrl+Shift+Delete)
5. Faça logout e login novamente

### Valores aparecem como R$ 0,00

Isso significa que a consulta não está retornando dados. Verifique:

1. Se os planos foram inseridos no banco de dados
2. Se o usuário está autenticado
3. Se há erros no console do navegador

```sql
-- Inserir planos manualmente se necessário
INSERT INTO public.plans (name, description, price, billing_cycle, features)
VALUES
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
ON CONFLICT (name, billing_cycle) DO UPDATE SET
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  features = EXCLUDED.features;
```
