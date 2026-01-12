# Implementação Pendente - Sistema de Emails e Configurações

## ✅ O que já foi criado:

### 1. Scripts SQL do Banco de Dados
- ✅ `create_verification_codes_table.sql` - Tabela para códigos de verificação
- ✅ `create_system_settings_table.sql` - Tabela para configurações do sistema
- ✅ `create_system_versions_table.sql` - Tabela para versões do sistema

### 2. Edge Functions (Resend)
- ✅ `send-verification-email/index.ts` - Envio de código de verificação
- ✅ `send-password-reset-email/index.ts` - Envio de código para reset de senha

### 3. Documentação
- ✅ `CONFIGURACAO_RESEND.md` - Guia completo de configuração do Resend
- ✅ `CONFIGURACAO_OAUTH_GOOGLE.md` - Guia de configuração OAuth

## 📋 O que falta implementar:

### 1. Páginas Frontend

#### A. Página de Verificação de Email
**Arquivo**: `src/pages/VerificarEmail.tsx`
- Input para código de 6 dígitos
- Botão para reenviar código
- Validação do código via API
- Ativar conta após verificação

#### B. Página de Recuperação de Senha
**Arquivo**: `src/pages/RecuperarSenha.tsx`
- Passo 1: Inserir email
- Passo 2: Inserir código de 6 dígitos
- Passo 3: Definir nova senha

#### C. Página de Configurações do Sistema (Admin)
**Arquivo**: `src/pages/admin/ConfiguracoesDoSistema.tsx`
- Formulário para editar:
  - URL do Manual do Usuário
  - URL da Documentação do Sistema
  - URL do Vídeo Informativo
- Salvar em `system_settings` table

#### D. Página de Gerenciamento de Versões (Admin)
**Arquivo**: `src/pages/admin/VersoesDoSistema.tsx`
- Listagem de versões cadastradas
- Formulário para adicionar nova versão:
  - Número da versão
  - Data de lançamento
  - URL de download
  - Tamanho do arquivo
  - Release notes (Markdown)
  - Requisitos mínimos
  - Marcar como versão mais recente
  - Ativar/desativar versão
- Editar versões existentes
- Deletar versões

### 2. Atualizar Páginas Existentes

#### A. Atualizar `src/pages/Registro.tsx`
- Adicionar lógica para detectar se é OAuth ou convencional
- Se OAuth (Google): pular verificação de email
- Se convencional:
  1. Criar usuário com `status: 'PENDING'`
  2. Chamar Edge Function `send-verification-email`
  3. Redirecionar para `/verificar-email`

#### B. Atualizar `src/pages/Login.tsx`
- Adicionar link "Esqueceu a senha?" que redireciona para `/recuperar-senha`
- Verificar se usuário tem status `PENDING` e redirecionar para verificação

#### C. Atualizar `src/pages/Download.tsx`
- Buscar versões da tabela `system_versions`
- Exibir versão mais recente em destaque
- Listar outras versões disponíveis
- Mostrar release notes, requisitos, tamanho do arquivo

#### D. Adicionar links no Dashboard
- Link para Manual do Usuário (buscar de `system_settings`)
- Link para Documentação do Sistema
- Link para Vídeo Informativo

### 3. Edge Functions Adicionais

#### A. `verify-email-code/index.ts`
- Receber: `{ code, userId }`
- Validar código
- Verificar se não expirou
- Marcar como verificado
- Atualizar `users.status` para `ACTIVE`

#### B. `verify-password-reset-code/index.ts`
- Receber: `{ code, email, newPassword }`
- Validar código
- Atualizar senha do usuário

### 4. Rotas a Adicionar

**Arquivo**: `src/App.tsx`

```typescript
<Route path="/verificar-email" element={<VerificarEmail />} />
<Route path="/recuperar-senha" element={<RecuperarSenha />} />

// Rotas Admin (protegidas)
<Route path="/admin/configuracoes" element={
  <ProtectedRoute requireAdmin>
    <ConfiguracoesDoSistema />
  </ProtectedRoute>
} />
<Route path="/admin/versoes" element={
  <ProtectedRoute requireAdmin>
    <VersoesDoSistema />
  </ProtectedRoute>
} />
```

### 5. Adicionar ao Menu Admin

**Arquivo**: `src/components/layout/DashboardLayout.tsx`

Adicionar ao menu lateral quando `isAdmin`:
- "Configurações do Sistema"
- "Versões do Sistema"

### 6. Tipos TypeScript

**Arquivo**: `src/lib/supabase.ts`

Adicionar tipos:

```typescript
export interface VerificationCode {
  id: string
  user_id: string
  code: string
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
  email: string
  expires_at: string
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface SystemSetting {
  id: string
  key: string
  value: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface SystemVersion {
  id: string
  version: string
  release_date: string
  download_url: string
  file_size: string | null
  release_notes: string | null
  is_latest: boolean
  is_active: boolean
  minimum_requirements: string | null
  created_at: string
  updated_at: string
}
```

## 🔧 Passos de Implementação Recomendados

### Fase 1: Configuração Inicial
1. Executar scripts SQL no Supabase
2. Configurar Resend (seguir CONFIGURACAO_RESEND.md)
3. Deploy das Edge Functions
4. Testar envio de emails

### Fase 2: Sistema de Verificação
5. Criar `VerificarEmail.tsx`
6. Criar Edge Function `verify-email-code`
7. Atualizar `Registro.tsx` para enviar email
8. Testar fluxo completo de registro

### Fase 3: Recuperação de Senha
9. Criar `RecuperarSenha.tsx`
10. Criar Edge Function `verify-password-reset-code`
11. Atualizar `Login.tsx` com link
12. Testar fluxo de recuperação

### Fase 4: Painel Admin
13. Criar `ConfiguracoesDoSistema.tsx`
14. Criar `VersoesDoSistema.tsx`
15. Adicionar rotas e menu
16. Testar CRUD completo

### Fase 5: Integração
17. Atualizar `Download.tsx` para buscar do banco
18. Adicionar links no Dashboard
19. Testes finais end-to-end

## 📧 Fluxo de Emails Implementado

### Registro Convencional:
1. Usuário preenche formulário
2. Sistema cria conta com `status: 'PENDING'`
3. Edge Function envia email com código
4. Usuário insere código
5. Código é validado
6. Status muda para `ACTIVE`
7. Usuário faz login

### Registro OAuth (Google):
1. Usuário clica em "Entrar com Google"
2. Autentica no Google
3. Sistema cria conta com `status: 'ACTIVE'` (sem verificação)
4. Usuário é logado automaticamente

### Recuperação de Senha:
1. Usuário clica em "Esqueceu a senha?"
2. Informa email
3. Sistema envia código
4. Usuário insere código
5. Define nova senha
6. Redireciona para login

## 🔒 Segurança Implementada

- ✅ Códigos expiram em 15 minutos
- ✅ RLS (Row Level Security) em todas as tabelas
- ✅ Edge Functions com service role key
- ✅ Verificação de admin para configurações
- ✅ Cleanup automático de códigos expirados

## 📝 Variáveis de Ambiente Necessárias

No Supabase (Edge Functions Secrets):
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Não é necessário adicionar no `.env` local do frontend.

## 🎨 UI/UX Considerations

- Inputs de código com formatação automática (XXX-XXX)
- Timer visual mostrando tempo restante
- Botão de reenviar desabilitado por 60 segundos
- Mensagens de erro claras
- Loading states em todos os botões
- Validação client-side antes de enviar

## ✅ Checklist de Deploy

Antes de colocar em produção:

- [ ] Executar todos os scripts SQL
- [ ] Configurar Resend e obter API Key
- [ ] Configurar domínio no Resend (recomendado)
- [ ] Deploy de todas as Edge Functions
- [ ] Adicionar RESEND_API_KEY nos secrets
- [ ] Testar envio de emails em ambiente de staging
- [ ] Criar todas as páginas frontend
- [ ] Adicionar todas as rotas
- [ ] Testar fluxo completo de registro
- [ ] Testar fluxo de recuperação de senha
- [ ] Testar painel admin
- [ ] Documentar para usuários finais

## 📚 Próximos Passos

Deseja que eu continue implementando alguma parte específica? Posso criar:
1. As páginas de verificação de email
2. As páginas de recuperação de senha
3. O painel admin de configurações
4. O painel admin de versões
5. As Edge Functions de validação
6. Ou qualquer outra parte específica

Apenas me avise qual parte deseja que eu implemente primeiro!
