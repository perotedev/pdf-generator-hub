# Correção do Erro "Database error saving new user"

## O Erro que Você Está Vendo

```
http://localhost:8080/auth/callback?error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user
```

## Causa do Problema

O erro ocorre porque a tabela `public.users` tem uma constraint `NOT NULL` na coluna `password_hash`:

```sql
password_hash text not null,
```

Quando um usuário faz login via Google OAuth:
1. ✅ O Google autentica o usuário
2. ✅ O Supabase cria o usuário na tabela `auth.users`
3. ❌ O trigger tenta inserir na tabela `public.users` **SEM** `password_hash`
4. ❌ PostgreSQL rejeita porque `password_hash` é obrigatório
5. ❌ OAuth falha com "Database error saving new user"

## Por Que Isso Acontece?

Usuários que fazem login com Google OAuth **não têm senha local** no seu sistema. Eles são autenticados pelo Google, não pelo seu banco de dados. Portanto, não faz sentido exigir um `password_hash` para eles.

## Solução

Execute o script SQL que corrige esse problema:

### Passo 1: Acessar o SQL Editor do Supabase

1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto: `lppqqjivhmlqnkhdfnib`
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o Script de Correção

Abra o arquivo `supabase/sql/fix_oauth_user_creation.sql` e execute-o no SQL Editor.

O script faz duas coisas importantes:

#### 1. Remove a constraint NOT NULL de password_hash

```sql
ALTER TABLE public.users
ALTER COLUMN password_hash DROP NOT NULL;
```

Isso permite que usuários OAuth tenham `password_hash = NULL`.

#### 2. Atualiza o trigger para inserir NULL como password_hash

```sql
INSERT INTO public.users (id, email, password_hash, name, role, status, created_at, updated_at)
VALUES (
  new.id,
  new.email,
  NULL, -- ✅ Usuários OAuth não têm senha local
  COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  ),
  'USER',
  'ACTIVE',
  now(),
  now()
)
```

### Passo 3: Verificar se Funcionou

Execute esta query para verificar se a alteração foi aplicada:

```sql
-- Verificar se password_hash agora é nullable
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'password_hash';
```

Você deve ver: `is_nullable = 'YES'`

### Passo 4: Testar o Login com Google Novamente

1. Limpe os cookies do navegador (ou use janela anônima)
2. Acesse: http://localhost:5173/login
3. Clique em "Login com Google"
4. Autorize o aplicativo
5. Você deve ser redirecionado para `/dashboard` com sucesso! ✅

## Alternativa (Se Você Quiser Manter password_hash NOT NULL)

Se, por algum motivo, você **precisa** manter `password_hash` como `NOT NULL`, você pode usar uma string vazia como placeholder:

```sql
-- Manter NOT NULL e definir valor padrão
ALTER TABLE public.users
ALTER COLUMN password_hash SET DEFAULT '';

-- Atualizar o trigger para inserir string vazia
INSERT INTO public.users (id, email, password_hash, name, role, status, created_at, updated_at)
VALUES (
  new.id,
  new.email,
  '', -- String vazia como placeholder
  ...
)
```

**Porém, NÃO RECOMENDO esta abordagem**, pois:
- É semanticamente incorreto (usuários OAuth não têm senha)
- Pode causar confusão no código
- `NULL` é o valor correto para "não aplicável"

## Como Distinguir Usuários OAuth de Usuários com Senha?

Depois da correção, você pode diferenciar os tipos de usuário:

```sql
-- Usuários que fizeram login com email/senha
SELECT * FROM public.users WHERE password_hash IS NOT NULL;

-- Usuários que fizeram login com OAuth (Google, etc)
SELECT * FROM public.users WHERE password_hash IS NULL;
```

No código TypeScript:

```typescript
// Verificar se o usuário tem senha local
const hasLocalPassword = user.password_hash !== null;

// Ou verificar no auth.users
const { data: { user } } = await supabase.auth.getUser();
const isOAuthUser = user?.app_metadata?.provider === 'google';
```

## Impacto em Funcionalidades Existentes

### ✅ Não Afeta:
- Login com email/senha (continua funcionando normalmente)
- Registro com email/senha (continua criando com password_hash)
- Autenticação e autorização
- RLS policies

### ⚠️ Pode Afetar:
Se você tem código que assume que **todos** os usuários têm `password_hash`, você precisará atualizar para lidar com `NULL`:

```typescript
// ANTES (pode dar erro)
if (user.password_hash.length > 0) { ... }

// DEPOIS (correto)
if (user.password_hash && user.password_hash.length > 0) { ... }
```

## Segurança

Esta mudança **não compromete** a segurança porque:

1. ✅ Usuários OAuth são autenticados pelo Google (mais seguro que senha)
2. ✅ O Supabase valida o token OAuth do Google
3. ✅ Apenas o Supabase pode criar usuários na tabela `auth.users`
4. ✅ O trigger só é executado quando o Supabase cria um usuário
5. ✅ RLS continua protegendo os dados

## Resumo dos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `supabase/sql/fix_oauth_user_creation.sql` | Script que remove NOT NULL e atualiza trigger |
| `supabase/sql/google_oauth_trigger.sql` | Trigger original (ainda útil como referência) |

## Próximos Passos

1. ✅ Execute o script `fix_oauth_user_creation.sql` no SQL Editor
2. ✅ Verifique que `password_hash` agora é nullable
3. ✅ Teste o login com Google novamente
4. ✅ Verifique que o usuário foi criado em `public.users` com `password_hash = NULL`
5. ✅ Confirme que o usuário foi redirecionado para `/dashboard`

## Troubleshooting

### Se ainda der erro de database:

1. Verifique se o script foi executado com sucesso (sem erros)
2. Verifique se a coluna foi alterada:
   ```sql
   \d public.users
   ```
3. Verifique se há outros triggers ou constraints que possam estar bloqueando
4. Verifique os logs do Supabase:
   - Dashboard → Settings → Logs → Postgres Logs

### Se o usuário for criado mas não aparecer no dashboard:

1. Verifique se o usuário existe em `auth.users`:
   ```sql
   SELECT * FROM auth.users WHERE email = 'seu-email@gmail.com';
   ```

2. Verifique se o usuário existe em `public.users`:
   ```sql
   SELECT * FROM public.users WHERE email = 'seu-email@gmail.com';
   ```

3. Se existe em `auth.users` mas não em `public.users`, o trigger não funcionou
4. Se existe em ambos, o problema pode ser no AuthContext ou nas RLS policies

## Conclusão

Após executar o script de correção, o Google OAuth deve funcionar perfeitamente. Usuários poderão:

1. ✅ Fazer login com Google
2. ✅ Ser redirecionados para `/dashboard`
3. ✅ Ter seus dados salvos na tabela `public.users`
4. ✅ Acessar todas as funcionalidades do sistema

A única diferença é que `password_hash` será `NULL` para usuários OAuth, o que é correto e esperado.
