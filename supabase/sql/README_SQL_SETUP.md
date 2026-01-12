## Configuração do Banco de Dados - Ordem de Execução

Execute os scripts SQL nesta ordem exata para configurar o banco de dados do zero.

Estes arquivos consolidam TODOS os fixes e correções anteriores, incluindo:
- ✅ Status `PENDING` para verificação de email
- ✅ RLS com bypass para Service Role (corrige erro JWT)
- ✅ Requisitos estruturados para versões do sistema
- ✅ Todas as policies de segurança
- ✅ Índices otimizados

### 📋 Ordem de Execução

Execute os arquivos na seguinte ordem:

```bash
1. 01_users_table.sql
2. 02_plans_subscriptions_payments.sql
3. 03_verification_codes.sql
4. 04_system_settings_versions.sql
```

**IMPORTANTE:** O arquivo `licences.sql` deve ser executado separadamente conforme sua necessidade específica.

### 🔧 Como Executar

#### Opção 1: Via Dashboard do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Cole o conteúdo de cada arquivo na ordem
4. Clique em **Run** para cada um

#### Opção 2: Via CLI do Supabase

```bash
# Certifique-se de estar na raiz do projeto
cd pdf-generator-hub

# Execute cada arquivo em ordem
supabase db push --file supabase/sql/01_users_table.sql
supabase db push --file supabase/sql/02_plans_subscriptions_payments.sql
supabase db push --file supabase/sql/03_verification_codes.sql
supabase db push --file supabase/sql/04_system_settings_versions.sql
```

#### Opção 3: Via psql (PostgreSQL CLI)

```bash
# Configure a variável de ambiente com sua connection string
export DATABASE_URL="postgresql://..."

# Execute em ordem
psql $DATABASE_URL < supabase/sql/01_users_table.sql
psql $DATABASE_URL < supabase/sql/02_plans_subscriptions_payments.sql
psql $DATABASE_URL < supabase/sql/03_verification_codes.sql
psql $DATABASE_URL < supabase/sql/04_system_settings_versions.sql
```

### 📦 O Que Cada Arquivo Faz

#### `01_users_table.sql`
- ✅ Cria tabela `users` com roles e status
- ✅ Adiciona status `PENDING` para verificação de email
- ✅ Configura RLS com policies para usuários, admins e managers
- ✅ Adiciona bypass para Service Role (Edge Functions)
- ✅ Cria índices de performance
- ✅ Configura trigger de `updated_at`

#### `02_plans_subscriptions_payments.sql`
- ✅ Cria tabela `plans` (planos de assinatura)
- ✅ Cria tabela `subscriptions` (assinaturas dos usuários)
- ✅ Cria tabela `payments` (histórico de pagamentos)
- ✅ Configura RLS com policies apropriadas
- ✅ Adiciona bypass para Service Role
- ✅ Cria índices e foreign keys
- ✅ Configura triggers

#### `03_verification_codes.sql`
- ✅ Cria tabela `verification_codes`
- ✅ Suporta verificação de email e reset de senha
- ✅ Códigos com expiração (15 minutos)
- ✅ Função para limpar códigos expirados
- ✅ RLS restrito ao Service Role

#### `04_system_settings_versions.sql`
- ✅ Cria tabela `system_settings` (configurações do sistema)
- ✅ Cria tabela `system_versions` (versões para download)
- ✅ Insere configurações padrão (URLs de manual, docs, vídeo)
- ✅ Insere versão de exemplo (1.0.0)
- ✅ Função para garantir única versão "latest"
- ✅ Requisitos estruturados (OS, Processor, RAM, Storage)
- ✅ RLS com policies apropriadas

### 🔐 Segurança (RLS)

Todos os arquivos incluem:
- ✅ Row Level Security (RLS) habilitado
- ✅ Policies para usuários autenticados
- ✅ Policies especiais para ADMIN e MANAGER
- ✅ Bypass para Service Role (usado pelas Edge Functions)

### ✅ Verificação

Após executar todos os scripts, verifique se as tabelas foram criadas:

```sql
-- Ver todas as tabelas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver todas as policies RLS
SELECT schemaname, tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Você deve ver:
- `users`
- `plans`
- `subscriptions`
- `payments`
- `verification_codes`
- `system_settings`
- `system_versions`

E policies com role `service_role` para cada tabela.

### 🔄 Executar Novamente

Todos os scripts são **idempotentes**, ou seja, podem ser executados múltiplas vezes sem causar erros:

- Usam `CREATE TABLE IF NOT EXISTS`
- Usam `DROP POLICY IF EXISTS` antes de criar policies
- Usam `CREATE INDEX IF NOT EXISTS`
- Usam `INSERT ... ON CONFLICT DO NOTHING`

### 🐛 Solução de Problemas

#### Erro: "function update_updated_at_column() does not exist"
- Execute o `01_users_table.sql` primeiro (ele cria a função)

#### Erro: "relation users does not exist"
- Execute os arquivos na ordem correta
- `02_plans_subscriptions_payments.sql` depende de `01_users_table.sql`

#### Erro: "permission denied for schema public"
- Verifique se está usando o usuário correto
- No Supabase, use a connection string com permissões de admin

#### RLS bloqueando acesso nas Edge Functions
- Certifique-se de que as policies `service_role bypass` foram criadas
- Verifique no dashboard: SQL Editor → Execute:
  ```sql
  SELECT * FROM pg_policies WHERE roles @> ARRAY['service_role'];
  ```

### 📚 Próximos Passos

Após executar os SQLs:

1. Configure as Edge Functions
2. Faça deploy das Edge Functions
3. Configure variáveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
4. Teste o fluxo de registro
5. Teste o fluxo de login
6. Configure Stripe (webhook e checkout)

### 📄 Documentação Relacionada

- [CORRECAO_EDGE_FUNCTIONS_JWT.md](../../docs/CORRECAO_EDGE_FUNCTIONS_JWT.md) - Solução de problemas de JWT
- [PROXIMOS_PASSOS.md](../../docs/PROXIMOS_PASSOS.md) - Checklist completo de deploy
- [CONFIGURACAO_RESEND.md](../../docs/CONFIGURACAO_RESEND.md) - Configurar envio de emails
