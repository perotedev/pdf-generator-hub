# Correção do Google OAuth Callback

## Problema Identificado

Você estava conseguindo abrir a tela de autenticação do Google, mas após autenticar, voltava para a tela de login sem que nada acontecesse.

## Causa do Problema

O fluxo OAuth estava configurado para redirecionar diretamente para `/dashboard`, mas isso não permite que o Supabase processe corretamente o código de autorização retornado pelo Google.

### Fluxo Incorreto (ANTES):
1. Usuário clica em "Login com Google"
2. Redirecionado para Google
3. Google retorna para `/dashboard` com código OAuth
4. Código OAuth não é processado
5. Usuário volta para `/login` sem sessão estabelecida ❌

### Fluxo Correto (AGORA):
1. Usuário clica em "Login com Google"
2. Redirecionado para Google
3. Google retorna para `/auth/callback` com código OAuth
4. Página AuthCallback aguarda o Supabase processar o código
5. AuthContext detecta sessão via `onAuthStateChange`
6. Usuário é redirecionado para `/dashboard` ✅

## Arquivos Corrigidos

### 1. **Login.tsx**
Alterado o `redirectTo` de `/dashboard` para `/auth/callback`:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,  // ✅ Corrigido
  },
});
```

### 2. **Registro.tsx**
Mesma correção aplicada:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,  // ✅ Corrigido
  },
});
```

### 3. **AuthCallback.tsx** (melhorado)
Adicionado delay para aguardar processamento e uso de `replace: true`:

```typescript
// Aguarda o Supabase processar os parâmetros OAuth da URL
await new Promise(resolve => setTimeout(resolve, 100));

const { data: { session }, error } = await supabase.auth.getSession();

if (session) {
  console.log('OAuth session established for:', session.user.email);
  navigate('/dashboard', { replace: true });  // ✅ replace: true evita problemas com botão voltar
} else {
  navigate('/login', { replace: true });
}
```

### 4. **App.tsx** (já estava correto)
A rota `/auth/callback` já estava configurada corretamente:

```typescript
<Routes>
  {/* Auth Callback Route (must be before PublicLayout) */}
  <Route path="/auth/callback" element={<AuthCallback />} />

  {/* Outras rotas... */}
</Routes>
```

## O Que Você Precisa Fazer Agora

### 1. Configurar URLs no Supabase Dashboard

Acesse o Supabase Dashboard e adicione a URL de callback:

1. Vá em **Authentication → URL Configuration**
2. Adicione em **Redirect URLs**:
   ```
   http://localhost:5173/auth/callback
   ```
3. Quando fizer deploy, adicione também:
   ```
   https://seu-dominio.com/auth/callback
   ```

### 2. Configurar URLs no Google Cloud Console

No Google Cloud Console, nas credenciais OAuth:

1. Vá em **APIs e Serviços → Credenciais**
2. Edite seu ID do cliente OAuth 2.0
3. Em **URIs de redirecionamento autorizados**, você deve ter:
   ```
   https://lppqqjivhmlqnkhdfnib.supabase.co/auth/v1/callback
   ```

   **Importante**: Esta é a URL do Supabase, NÃO a URL do seu app. O fluxo é:
   - Google → Supabase (`/auth/v1/callback`)
   - Supabase → Seu App (`/auth/callback`)

### 3. Testar o Fluxo Completo

1. Execute o servidor:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:5173/login

3. Clique em "Login com Google"

4. Você será redirecionado para o Google

5. Após autorizar, o fluxo será:
   - Google redireciona para Supabase
   - Supabase redireciona para `http://localhost:5173/auth/callback`
   - AuthCallback processa a sessão
   - Você é redirecionado para `/dashboard`

### 4. Verificar no Console do Navegador

Abra o DevTools (F12) e veja as mensagens:
- `OAuth session established for: seu-email@gmail.com` ✅ Sucesso!
- `No session found after OAuth callback` ❌ Problema

## Troubleshooting

### Se ainda não funcionar:

#### 1. Verificar erros no console
- Abra F12 → Console
- Procure por erros relacionados a OAuth ou redirect_uri

#### 2. Verificar se o trigger do banco está ativo
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Se não retornar nada, execute o arquivo `supabase/sql/google_oauth_trigger.sql`.

#### 3. Verificar se o usuário foi criado no banco
Após tentar fazer login, verifique no Supabase:

**Authentication → Users**: Usuário deve aparecer com provider "google"

**Table Editor → users**: Usuário deve ter `role = 'USER'` e `status = 'ACTIVE'`

#### 4. Limpar cache e cookies
Às vezes o navegador mantém uma sessão antiga. Tente:
- Limpar cookies do localhost:5173
- Abrir em janela anônima
- Usar outro navegador

#### 5. Verificar se as variáveis de ambiente estão corretas
No arquivo `.env.local`:
```env
VITE_SUPABASE_URL=https://lppqqjivhmlqnkhdfnib.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## Resumo das Mudanças

| Arquivo | Mudança | Por quê |
|---------|---------|---------|
| Login.tsx | `redirectTo: '/auth/callback'` | Permite processamento correto do OAuth |
| Registro.tsx | `redirectTo: '/auth/callback'` | Permite processamento correto do OAuth |
| AuthCallback.tsx | Adicionado delay e `replace: true` | Aguarda sessão e evita problemas de navegação |
| App.tsx | Já estava correto | Rota `/auth/callback` já existia |

## Próximos Passos

1. ✅ Código corrigido
2. ⏳ Configurar URLs no Supabase Dashboard (você precisa fazer)
3. ⏳ Verificar URLs no Google Cloud Console (você precisa fazer)
4. ⏳ Testar o login com Google (você precisa fazer)

Se funcionar, você verá no console: `OAuth session established for: seu-email@gmail.com` e será redirecionado para o dashboard com sucesso!
