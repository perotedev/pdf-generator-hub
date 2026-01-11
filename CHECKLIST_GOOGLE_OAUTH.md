# Checklist: Configuração Google OAuth

Use este checklist para garantir que tudo está configurado corretamente.

## ☐ 1. Google Cloud Console

- [ ] Acessar https://console.cloud.google.com/
- [ ] Criar ou selecionar um projeto
- [ ] Ativar a Google+ API
- [ ] Configurar a Tela de Consentimento OAuth
  - [ ] Tipo: Externo
  - [ ] Nome do app: PDF Generator Hub
  - [ ] E-mail de suporte
  - [ ] E-mail do desenvolvedor
- [ ] Criar credenciais OAuth 2.0
  - [ ] Tipo: Aplicativo da Web
  - [ ] Nome: PDF Generator Hub - Web
  - [ ] Adicionar URL de redirecionamento: `https://lppqqjivhmlqnkhdfnib.supabase.co/auth/v1/callback`
- [ ] Copiar Client ID
- [ ] Copiar Client Secret

## ☐ 2. Supabase Dashboard

- [ ] Acessar https://supabase.com/dashboard
- [ ] Selecionar projeto: lppqqjivhmlqnkhdfnib
- [ ] Ir em Authentication → Providers
- [ ] Encontrar e expandir Google
- [ ] Ativar "Enable Sign in with Google"
- [ ] Colar Client ID do Google
- [ ] Colar Client Secret do Google
- [ ] Salvar configurações

## ☐ 3. URLs de Redirecionamento (Supabase)

- [ ] Ir em Authentication → URL Configuration
- [ ] Adicionar em Redirect URLs:
  - [ ] `http://localhost:5173/auth/callback` (desenvolvimento - **IMPORTANTE!**)
  - [ ] `http://localhost:5173/dashboard` (desenvolvimento)
  - [ ] Seu domínio de produção quando fizer deploy (ex: `https://seu-dominio.com/auth/callback`)
- [ ] Configurar Site URL: `http://localhost:5173`
- [ ] Salvar configurações

## ☐ 4. Trigger do Banco de Dados

- [ ] Acessar SQL Editor no Supabase
- [ ] Executar o script: `supabase/sql/google_oauth_trigger.sql`
- [ ] Verificar se o trigger foi criado:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```

## ☐ 5. Variáveis de Ambiente

- [ ] Verificar se `.env.local` existe
- [ ] Verificar se contém:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] **NÃO adicionar credenciais do Google no .env**

## ☐ 6. Testar a Integração

### Teste 1: Registro com Google
- [ ] Iniciar o servidor: `npm run dev`
- [ ] Acessar: http://localhost:5173/registro
- [ ] Clicar em "Registrar com Google"
- [ ] Fazer login com uma conta Google
- [ ] Verificar se foi redirecionado para `/dashboard`
- [ ] Verificar no Supabase se o usuário foi criado:
  - [ ] Existe em Authentication → Users
  - [ ] Existe em Table Editor → users (tabela pública)
  - [ ] Tem role = 'USER'
  - [ ] Tem status = 'ACTIVE'

### Teste 2: Login com Google (usuário existente)
- [ ] Fazer logout
- [ ] Acessar: http://localhost:5173/login
- [ ] Clicar em "Login com Google"
- [ ] Usar a mesma conta Google
- [ ] Verificar se foi redirecionado para `/dashboard`
- [ ] Verificar se os dados do usuário aparecem corretamente

### Teste 3: Múltiplos usuários
- [ ] Testar com diferentes contas Google
- [ ] Verificar se cada uma cria um usuário único

## ☐ 7. Troubleshooting (se necessário)

Se algo não funcionar:

- [ ] Verificar erros no console do navegador (F12)
- [ ] Verificar erros no terminal do servidor
- [ ] Verificar se as URLs estão EXATAMENTE corretas (sem espaços, barras extras)
- [ ] Verificar se o trigger está ativo no banco de dados
- [ ] Consultar o arquivo CONFIGURAR_GOOGLE_OAUTH.md para troubleshooting detalhado

## Status da Implementação

- ✅ Código de OAuth no Login.tsx - redirectTo corrigido para /auth/callback
- ✅ Código de OAuth no Registro.tsx - redirectTo corrigido para /auth/callback
- ✅ AuthContext configurado para detectar login OAuth via onAuthStateChange
- ✅ Página AuthCallback.tsx criada para processar callback do Google
- ✅ Rota /auth/callback adicionada no App.tsx
- ✅ Script SQL do trigger criado
- ⏳ **Falta configurar no Google Cloud Console e Supabase Dashboard**

## Próximos Passos

1. **Agora**: Configure o Google Cloud Console (Passo 1)
2. **Depois**: Configure o Supabase Dashboard (Passo 2 e 3)
3. **Então**: Execute o script SQL do trigger (Passo 4)
4. **Finalmente**: Teste a integração (Passo 6)

## Notas Importantes

⚠️ **Segurança**:
- As credenciais OAuth ficam APENAS no Supabase Dashboard
- NUNCA comite credenciais no código
- O arquivo `.env.local` já está no .gitignore

✅ **O que já está pronto no código**:
- Login com Google (Login.tsx) - redireciona para /auth/callback
- Registro com Google (Registro.tsx) - redireciona para /auth/callback
- AuthContext detecta sessão OAuth via onAuthStateChange
- Página AuthCallback.tsx processa o callback e redireciona para /dashboard
- Toast notifications
- Rota /auth/callback configurada

🔧 **O que você precisa fazer**:
- Configurar credenciais no Google Cloud Console
- Configurar provedor no Supabase
- Executar script SQL do trigger
- Testar
