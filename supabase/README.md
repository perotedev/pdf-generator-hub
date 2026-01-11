# Supabase Backend Configuration

Este documento contém todas as instruções necessárias para configurar o backend do PDF Generator Hub usando Supabase.

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
3. [Configuração do Stripe Wrapper](#configuração-do-stripe-wrapper)
4. [Deploy das Edge Functions](#deploy-das-edge-functions)
5. [Configuração de Webhooks](#configuração-de-webhooks)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Testes](#testes)

## 🚀 Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Crie um novo projeto
3. Anote as credenciais:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Instalar Supabase CLI

```bash
npm install -g supabase
# ou
brew install supabase/tap/supabase
```

### 3. Fazer Login

```bash
supabase login
```

### 4. Link com o Projeto

```bash
supabase link --project-ref your-project-ref
```

## 💾 Configuração do Banco de Dados

Execute os scripts SQL na seguinte ordem no **SQL Editor** do Supabase Dashboard:

### 1. Criar Tabela de Usuários

```bash
# Copie o conteúdo de supabase/sql/users.sql
```

Execute no SQL Editor do Supabase.

### 2. Criar Tabelas de Assinaturas e Pagamentos

```bash
# Copie o conteúdo de supabase/sql/subscriptions.sql
```

Execute no SQL Editor do Supabase.

### 3. Atualizar Tabela de Licenças

A tabela de licenças já existe (licences.sql), mas será atualizada pelo script subscriptions.sql com novos campos:
- `subscription_id`: Link com assinatura
- `user_id`: Link com usuário
- `plan_type`: Tipo de plano
- `is_standalone`: Flag para licenças avulsas

## 🔗 Configuração do Stripe Wrapper

### 1. Obter Chave Secreta do Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Navegue até **Developers > API Keys**
3. Copie sua **Secret Key**

### 2. Armazenar no Supabase Vault

No Supabase Dashboard:

1. Vá em **Settings > Vault**
2. Clique em **New Secret**
3. Nome: `stripe_secret_key`
4. Valor: Sua chave secreta do Stripe
5. Clique em **Add Secret**

### 3. Configurar Stripe Wrapper

Execute o script `supabase/sql/stripe_wrapper.sql` no SQL Editor.

**IMPORTANTE:** Este script cria:
- Foreign Data Wrapper para Stripe
- Tabelas estrangeiras (customers, subscriptions, products, prices, etc.)
- Views combinando dados locais com Stripe
- Função de sincronização

### 4. Criar Produtos e Preços no Stripe

No Stripe Dashboard, crie:

1. **Produtos:**
   - Básico
   - Profissional
   - Empresarial

2. **Preços para cada produto:**
   - Monthly (mensal)
   - Yearly (anual)

3. Anote os IDs dos preços e atualize a tabela `plans`:

```sql
UPDATE plans SET
  stripe_product_id = 'prod_xxx',
  stripe_price_id_monthly = 'price_xxx',
  stripe_price_id_yearly = 'price_yyy'
WHERE name = 'Profissional';
```

## 🎯 Deploy das Edge Functions

### 1. Estrutura das Functions

```
supabase/
├── activate_license.js      (já existe - para app desktop)
├── verify-license.js         (já existe - para app desktop)
├── auth-login.js             (nova - login web)
├── auth-register.js          (nova - registro web)
├── user-management.js        (nova - CRUD de usuários)
├── license-management.js     (nova - gerenciar licenças standalone)
└── stripe-webhook.js         (nova - webhooks do Stripe)
```

### 2. Deploy Individual

```bash
# Login
supabase functions deploy auth-login

# Registro
supabase functions deploy auth-register

# Gerenciamento de usuários
supabase functions deploy user-management

# Gerenciamento de licenças
supabase functions deploy license-management

# Webhook do Stripe
supabase functions deploy stripe-webhook
```

### 3. Deploy de Todas as Functions

```bash
supabase functions deploy --project-ref your-project-ref
```

## 🔔 Configuração de Webhooks

### 1. Obter URL do Webhook

Após fazer deploy da função `stripe-webhook`:

```
https://your-project-ref.supabase.co/functions/v1/stripe-webhook
```

### 2. Configurar no Stripe

1. Acesse [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em **Add endpoint**
3. URL: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
4. Selecione os eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
5. Copie o **Signing secret** (webhook secret)

### 3. Adicionar Webhook Secret ao Supabase

No Supabase Dashboard:

1. Vá em **Settings > Edge Functions**
2. Adicione a variável de ambiente:
   - Nome: `STRIPE_WEBHOOK_SECRET`
   - Valor: Seu webhook signing secret

## 🔐 Variáveis de Ambiente

### Edge Functions

Configure no Supabase Dashboard (**Settings > Edge Functions**):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Frontend (.env.local)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🧪 Testes

### 1. Testar Autenticação

```bash
# Registro
curl -X POST https://your-project.supabase.co/functions/v1/auth-register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test User"}'

# Login
curl -X POST https://your-project.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### 2. Testar Licenças Desktop (já existentes)

```bash
# Ativar licença
curl -X POST https://your-project.supabase.co/functions/v1/activate_license \
  -H "Content-Type: application/json" \
  -d '{"code":"XXXXX-XXXXX-XXXXX-XXXXX-XXXXX","type":"windows","device_id":"WIN-123"}'

# Verificar licença
curl -X POST https://your-project.supabase.co/functions/v1/verify-license \
  -H "Content-Type: application/json" \
  -d '{"code":"XXXXX-XXXXX-XXXXX-XXXXX-XXXXX","device_id":"WIN-123"}'
```

### 3. Testar Stripe Wrapper

Execute no SQL Editor:

```sql
-- Listar customers do Stripe
SELECT * FROM stripe_customers LIMIT 10;

-- Listar assinaturas do Stripe
SELECT * FROM stripe_subscriptions LIMIT 10;

-- View combinada
SELECT * FROM subscriptions_with_stripe;
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

1. **users** - Usuários do sistema web
2. **plans** - Planos de assinatura
3. **subscriptions** - Assinaturas ativas
4. **payments** - Histórico de pagamentos
5. **licenses** - Licenças (web + standalone)

### Relacionamentos

```
users (1) -----> (N) subscriptions
subscriptions (1) -----> (N) payments
subscriptions (1) -----> (1) licenses
plans (1) -----> (N) subscriptions
```

### Licenças

Existem dois tipos de licenças:

1. **Licenças vinculadas a assinaturas** (`is_standalone = false`)
   - Criadas automaticamente quando uma assinatura é ativada
   - Vinculadas a um usuário via `user_id`
   - Vinculadas a uma assinatura via `subscription_id`

2. **Licenças standalone** (`is_standalone = true`)
   - Criadas manualmente pelo admin
   - Não vinculadas a assinaturas do sistema
   - Usadas para clientes que compraram fora do sistema

## 🔒 Row Level Security (RLS)

Todas as tabelas têm RLS habilitado:

- **Usuários comuns:** Veem apenas seus próprios dados
- **Gerentes (MANAGER):** Podem gerenciar usuários, mas não alterar permissões
- **Admins (ADMIN):** Acesso total ao sistema

## 📝 Notas Importantes

1. **Bcrypt:** As Edge Functions usam bcrypt para hash de senhas
2. **CORS:** Todas as functions têm CORS habilitado
3. **Tokens:** Use JWT tokens do Supabase Auth para autenticação
4. **Sincronização:** A função `sync_stripe_subscription` pode ser chamada manualmente se necessário

## 🆘 Troubleshooting

### Erro: "relation does not exist"

Execute os scripts SQL na ordem correta.

### Erro: "foreign data wrapper does not exist"

Certifique-se de que a extensão wrappers está instalada:

```sql
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;
```

### Webhook não está funcionando

1. Verifique se o `STRIPE_WEBHOOK_SECRET` está configurado
2. Teste o endpoint manualmente
3. Verifique os logs no Stripe Dashboard

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs das Edge Functions no Supabase Dashboard
2. Verifique os logs do webhook no Stripe Dashboard
3. Teste as queries SQL diretamente no SQL Editor
