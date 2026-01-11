# Configuração do Google OAuth no Supabase

## Visão Geral

Para habilitar o login com Google no seu aplicativo, você precisa:
1. Criar credenciais OAuth no Google Cloud Console
2. Configurar o provedor Google no Supabase
3. Adicionar as URLs de redirecionamento

## Passo 1: Criar Credenciais no Google Cloud Console

### 1.1 Acessar o Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. Selecione ou crie um projeto

### 1.2 Ativar a Google+ API

1. No menu lateral, vá em **APIs e Serviços** → **Biblioteca**
2. Procure por "Google+ API"
3. Clique em **Ativar** (Enable)

### 1.3 Criar Credenciais OAuth 2.0

1. No menu lateral, vá em **APIs e Serviços** → **Credenciais**
2. Clique em **+ CRIAR CREDENCIAIS**
3. Selecione **ID do cliente OAuth 2.0**

### 1.4 Configurar a Tela de Consentimento OAuth (se solicitado)

Se for a primeira vez criando credenciais OAuth:

1. Clique em **CONFIGURAR TELA DE CONSENTIMENTO**
2. Escolha **Externo** (para permitir qualquer usuário com conta Google)
3. Clique em **Criar**

**Preencha as informações obrigatórias:**
- **Nome do app**: PDF Generator Hub
- **E-mail de suporte do usuário**: seu-email@exemplo.com
- **Domínios autorizados**: (deixe em branco por enquanto)
- **E-mail do desenvolvedor**: seu-email@exemplo.com

4. Clique em **Salvar e Continuar**
5. **Escopos**: Clique em **Salvar e Continuar** (sem adicionar escopos)
6. **Usuários de teste**: Adicione seu e-mail de teste (opcional para desenvolvimento)
7. Clique em **Salvar e Continuar**
8. Revise e clique em **Voltar ao painel**

### 1.5 Criar o ID do Cliente OAuth

1. Volte para **Credenciais** → **+ CRIAR CREDENCIAIS** → **ID do cliente OAuth 2.0**
2. **Tipo de aplicativo**: Selecione **Aplicativo da Web**
3. **Nome**: PDF Generator Hub - Web

**URLs de redirecionamento autorizadas:**

Adicione as seguintes URLs (substitua `lppqqjivhmlqnkhdfnib` pelo ID do seu projeto Supabase):

```
https://lppqqjivhmlqnkhdfnib.supabase.co/auth/v1/callback
```

Para desenvolvimento local (opcional):
```
http://localhost:5173/auth/callback
http://localhost:3000/auth/callback
```

4. Clique em **Criar**

### 1.6 Copiar as Credenciais

Após criar, você verá uma janela com:
- **ID do cliente**: algo como `123456789-abc123def456.apps.googleusercontent.com`
- **Chave secreta do cliente**: algo como `GOCSPX-abc123def456xyz`

**⚠️ IMPORTANTE**: Copie e guarde essas credenciais em um lugar seguro!

## Passo 2: Configurar o Supabase

### 2.1 Acessar o Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `lppqqjivhmlqnkhdfnib`
3. No menu lateral, vá em **Authentication** → **Providers**

### 2.2 Habilitar o Google Provider

1. Procure por **Google** na lista de provedores
2. Clique para expandir as configurações
3. Ative o toggle **Enable Sign in with Google**

### 2.3 Inserir as Credenciais do Google

Cole as credenciais que você copiou do Google Cloud Console:

- **Client ID (for OAuth)**: Cole o ID do cliente do Google
- **Client Secret (for OAuth)**: Cole a chave secreta do Google

### 2.4 Configurar a URL de Redirecionamento

A URL de callback do Supabase será:
```
https://lppqqjivhmlqnkhdfnib.supabase.co/auth/v1/callback
```

Esta é a URL que você já adicionou no Google Cloud Console.

### 2.5 Salvar as Configurações

Clique em **Save** para salvar as configurações.

## Passo 3: Configurar URLs Permitidas no Supabase

### 3.1 Adicionar Site URLs

1. No Supabase Dashboard, vá em **Authentication** → **URL Configuration**
2. Adicione as seguintes URLs em **Redirect URLs**:

**Para desenvolvimento:**
```
http://localhost:5173/dashboard
http://localhost:3000/dashboard
```

**Para produção (quando fizer deploy):**
```
https://seu-dominio.com/dashboard
```

3. **Site URL**: Configure a URL principal do seu site:
   - Desenvolvimento: `http://localhost:5173`
   - Produção: `https://seu-dominio.com`

4. Clique em **Save**

## Passo 4: Testar a Integração

### 4.1 Testar Localmente

1. Certifique-se de que o servidor está rodando:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:5173/registro
3. Clique no botão **Registrar com Google**
4. Você deverá ser redirecionado para a página de login do Google
5. Após autorizar, você será redirecionado de volta para `/dashboard`

### 4.2 Verificar no Supabase

1. Vá em **Authentication** → **Users** no dashboard do Supabase
2. Você deverá ver o usuário criado com o provedor `google`

## Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa**: A URL de redirecionamento não está configurada corretamente no Google Cloud Console.

**Solução**:
1. Volte ao Google Cloud Console → Credenciais
2. Edite seu ID do cliente OAuth 2.0
3. Certifique-se de que a URL está EXATAMENTE assim:
   ```
   https://lppqqjivhmlqnkhdfnib.supabase.co/auth/v1/callback
   ```
4. Não deve haver espaços, barras extras ou diferenças no protocolo (https)

### Erro: "invalid_client"

**Causa**: As credenciais do Google estão incorretas no Supabase.

**Solução**:
1. Verifique se o Client ID e Client Secret foram copiados corretamente
2. Certifique-se de que não há espaços extras no início ou fim
3. Re-salve as configurações no Supabase

### Erro: "Access blocked: This app's request is invalid"

**Causa**: A tela de consentimento OAuth não foi configurada corretamente.

**Solução**:
1. Volte ao Google Cloud Console
2. Vá em **APIs e Serviços** → **Tela de consentimento OAuth**
3. Complete todas as informações obrigatórias
4. Salve as alterações

### O usuário é criado, mas não tem role/name

**Causa**: O trigger do Supabase pode não estar funcionando corretamente.

**Solução**: Verifique se o trigger `on_auth_user_created` está ativo no banco de dados:

```sql
-- Verificar se o trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Se não existir, criar o trigger para usuários OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'USER',
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, users.name),
    email = EXCLUDED.email,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Fluxo Completo do Login com Google

1. **Usuário clica em "Registrar com Google"** ou "Login com Google"
2. **Redirecionamento para o Google**: O Supabase redireciona para a página de login do Google
3. **Usuário autoriza o app**: O usuário faz login e autoriza o PDF Generator Hub
4. **Google redireciona de volta**: Com um código de autorização
5. **Supabase processa o código**: Cria/atualiza o usuário na tabela `auth.users`
6. **Trigger cria registro na tabela users**: O trigger `on_auth_user_created` cria o registro em `public.users`
7. **Redirecionamento para o app**: Usuário é redirecionado para `/dashboard`
8. **AuthContext carrega os dados**: O `AuthContext` detecta a sessão e carrega os dados do usuário

## Segurança

### Variáveis de Ambiente

As credenciais OAuth do Google devem ficar **apenas no Supabase Dashboard**, não no código.

Seu arquivo `.env.local` deve conter apenas:
```env
VITE_SUPABASE_URL=https://lppqqjivhmlqnkhdfnib.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ NUNCA comite o arquivo `.env.local` no Git!**

### Modo de Produção

Quando publicar o app em produção:

1. **Adicione o domínio de produção no Google Cloud Console**:
   ```
   https://seu-dominio.com/auth/callback
   ```

2. **Adicione o domínio nas URLs permitidas do Supabase**:
   ```
   https://seu-dominio.com/dashboard
   ```

3. **Publique a tela de consentimento** (remova o status de teste):
   - Google Cloud Console → Tela de consentimento OAuth
   - Clique em **PUBLICAR APP**

## Recursos Adicionais

- [Documentação oficial do Supabase sobre Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Configuração de OAuth 2.0 do Google](https://developers.google.com/identity/protocols/oauth2)

## Resumo dos URLs Importantes

| Contexto | URL |
|----------|-----|
| Callback do Supabase | `https://lppqqjivhmlqnkhdfnib.supabase.co/auth/v1/callback` |
| Desenvolvimento Local | `http://localhost:5173/dashboard` |
| Produção (exemplo) | `https://seu-dominio.com/dashboard` |
| Google Cloud Console | https://console.cloud.google.com/ |
| Supabase Dashboard | https://supabase.com/dashboard |
