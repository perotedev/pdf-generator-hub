# 🚨 ERRO ENCONTRADO: "Database error saving new user"

## O Problema

Você está recebendo este erro ao tentar fazer login com Google:

```
http://localhost:8080/auth/callback?error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user
```

## Por Que Acontece?

A tabela `users` no banco de dados tem uma coluna `password_hash` marcada como `NOT NULL` (obrigatória). Porém, usuários que fazem login via Google OAuth **não têm senha** no sistema, pois são autenticados pelo Google.

Quando o trigger tenta criar o usuário na tabela `public.users` sem um `password_hash`, o PostgreSQL rejeita a inserção e causa o erro.

## Solução Rápida

**Execute este script no SQL Editor do Supabase:**

`supabase/sql/fix_oauth_user_creation.sql`

Este script faz duas coisas:
1. Remove a obrigatoriedade da coluna `password_hash` (permite NULL)
2. Atualiza o trigger para inserir `NULL` como password_hash para usuários OAuth

## Passos Detalhados

### 1. Acessar o Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Selecione o projeto: `lppqqjivhmlqnkhdfnib`
3. No menu lateral, clique em **SQL Editor**

### 2. Executar o Script

1. Abra o arquivo `supabase/sql/fix_oauth_user_creation.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor
4. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)

### 3. Verificar se Funcionou

Execute esta query no SQL Editor:

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'password_hash';
```

**Resultado esperado:**
```
column_name   | is_nullable
password_hash | YES
```

Se `is_nullable = YES`, a correção funcionou! ✅

### 4. Testar Novamente

1. Limpe os cookies do navegador (ou use janela anônima)
2. Acesse: http://localhost:5173/login
3. Clique em "Login com Google"
4. Autorize o aplicativo
5. Você deve ser redirecionado para `/dashboard` ✅

## Documentação Completa

Para entender melhor o problema e a solução:

- 📄 **CORRIGIR_ERRO_OAUTH_DATABASE.md** - Explicação detalhada do erro
- 📄 **CHECKLIST_GOOGLE_OAUTH.md** - Checklist completo de configuração
- 📄 **CORRECAO_OAUTH_CALLBACK.md** - Correções no fluxo de callback

## Ordem de Execução dos Scripts

Execute nesta ordem no SQL Editor do Supabase:

1. ✅ **fix_oauth_user_creation.sql** (PRIMEIRO - corrige password_hash)
2. ✅ **google_oauth_trigger.sql** (já está incluído no fix_oauth_user_creation.sql)
3. ✅ **fix_plans_rls.sql** (se você for usar a página Admin)

## Resumo

| Problema | Solução |
|----------|---------|
| `password_hash` é obrigatório | Tornar nullable com `fix_oauth_user_creation.sql` |
| Trigger insere sem password | Atualizado para inserir `NULL` |
| OAuth callback falha | Corrigido ao permitir `NULL` |

## Após Executar o Script

✅ Login com Google funcionará
✅ Usuários OAuth terão `password_hash = NULL`
✅ Login com email/senha continuará funcionando normalmente
✅ Registro com email/senha continuará criando com password_hash

## Segurança

Esta mudança **NÃO compromete** a segurança:

- ✅ Usuários OAuth são autenticados pelo Google (mais seguro que senha)
- ✅ O Supabase valida o token OAuth
- ✅ RLS continua protegendo os dados
- ✅ Apenas triggers autorizados podem inserir usuários

## Precisa de Ajuda?

Se ainda tiver problemas:

1. Verifique o console do navegador (F12) para erros
2. Consulte **CORRIGIR_ERRO_OAUTH_DATABASE.md** para troubleshooting
3. Verifique se o script foi executado sem erros no SQL Editor
4. Verifique os logs do Supabase: Dashboard → Settings → Logs → Postgres Logs
