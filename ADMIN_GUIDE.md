# Guia de Administração - PDF Generator Hub

## Visão Geral

O sistema de administração do PDF Generator Hub permite gerenciar usuários, permissões, licenças e dispositivos vinculados. Este guia explica como acessar e utilizar as funcionalidades administrativas.

## Sistema de Autenticação e Permissões

### Tipos de Usuário

O sistema possui dois níveis de permissão:

- **ADMIN**: Acesso completo ao sistema, incluindo:
  - Gerenciamento de usuários
  - Atribuição de permissões
  - Gerenciamento de licenças e dispositivos
  - Configurações do sistema (preços, versões, recursos)

- **USER**: Acesso limitado às próprias funcionalidades:
  - Visualizar e gerenciar suas próprias assinaturas
  - Downloads de versões
  - Histórico de pagamentos

### Como Fazer Login como Admin

Para testar funcionalidades de administrador, use um email que contenha a palavra "admin":

**Exemplos de emails admin:**
- `admin@email.com`
- `admin.teste@gmail.com`
- `joao.admin@empresa.com`

**Emails regulares (usuário comum):**
- `usuario@email.com`
- `joao@gmail.com`

> **Nota**: Em produção, o sistema de autenticação deve ser substituído por uma integração com API real e controle de permissões adequado.

## Funcionalidades Administrativas

### 1. Gerenciamento de Usuários

**Acesso**: Dashboard > Gerenciar Usuários (no menu lateral)

#### Funcionalidades Disponíveis:

**Visualização de Usuários**
- Lista completa de todos os usuários do sistema
- Informações exibidas:
  - Nome e email
  - Permissão (Admin/Usuário)
  - Status (Ativo/Inativo/Suspenso)
  - Assinaturas ativas
  - Último acesso

**Filtros Disponíveis**
- Busca por nome ou email
- Filtro por permissão (Admin/Usuário)
- Filtro por status (Ativo/Inativo/Suspenso)

**Estatísticas**
- Total de usuários
- Usuários ativos
- Total de administradores
- Usuários suspensos

#### Atribuir/Modificar Permissões

1. Clique no botão "Permissões" ao lado do usuário
2. No diálogo, selecione:
   - **Permissão**: Admin ou Usuário
   - **Status da Conta**: Ativo, Inativo ou Suspenso
3. Clique em "Salvar Alterações"

**Diferenças entre Status:**
- **Ativo**: Usuário pode acessar o sistema normalmente
- **Inativo**: Usuário temporariamente sem acesso
- **Suspenso**: Usuário bloqueado por violação ou não pagamento

#### Gerenciar Dispositivos Vinculados

Cada licença pode estar vinculada a um dispositivo específico. Para desvincular:

1. Clique no botão "Dispositivos" ao lado do usuário
2. Visualize todos os dispositivos vinculados às licenças do usuário
3. Clique em "Desvincular Dispositivo" no dispositivo desejado
4. Confirme a ação

**Informações do Dispositivo:**
- Nome do dispositivo (ex: "Desktop Dell - Windows 11")
- UID do computador (identificador único)
- Data de ativação
- Licença associada

**Casos de Uso:**
- Cliente trocou de computador
- Computador foi formatado
- Cliente precisa instalar em outra máquina
- Dispositivo foi perdido ou roubado

#### Suspender/Ativar Usuários

Clique no botão "Suspender" ou "Ativar" diretamente na lista de usuários para alterar o status rapidamente.

#### Remover Usuários

1. Clique no botão vermelho com ícone de lixeira
2. Confirme a ação no diálogo
3. **Atenção**: Se o usuário tiver assinaturas ativas, um aviso será exibido

### 2. Configurações do Sistema

**Acesso**: Dashboard > Administração (no menu lateral)

#### Preços dos Planos

- Editar preço mensal
- Editar preço anual
- Configurar número máximo de parcelas
- Botões "Salvar" e "Cancelar" para controle de alterações

#### Versões do Sistema

**Gerenciar Versões:**
- Adicionar nova versão
- Editar versão existente
- Remover versão
- Informações incluídas:
  - Número da versão (ex: v2.5.3)
  - Data de lançamento
  - Link de download
  - Tamanho do arquivo
  - Changelog (novidades e correções)

#### Links de Recursos

**Tipos de Recursos:**
- Manual do Usuário
- Documentação Técnica
- Vídeo Instrutivo

**Operações:**
- Adicionar novo recurso
- Editar recurso existente
- Remover recurso

## Estrutura de Arquivos

### Novos Arquivos Criados:

```
src/
├── contexts/
│   └── AuthContext.tsx          # Context de autenticação com roles
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx   # Componente para proteger rotas admin
└── pages/
    └── AdminUsers.tsx            # Página de gerenciamento de usuários
```

### Arquivos Modificados:

```
src/
├── App.tsx                       # Integração do AuthProvider e rotas protegidas
├── pages/
│   ├── Login.tsx                 # Integração com AuthContext
│   └── Admin.tsx                 # Adicionado card de acesso rápido
└── components/layout/
    └── DashboardLayout.tsx       # Menu dinâmico baseado em permissões
```

## Fluxo de Autenticação

### 1. Login
```
Usuário insere credenciais → AuthContext.login()
→ Verifica se email contém "admin"
→ Define role (ADMIN ou USER)
→ Salva usuário no localStorage
→ Redireciona para /dashboard
```

### 2. Proteção de Rotas
```
Usuário acessa rota → ProtectedRoute verifica isAuthenticated
→ Se não autenticado: redireciona para /login
→ Se requireAdmin=true: verifica isAdmin
→ Se não admin: redireciona para /dashboard
→ Se autorizado: renderiza componente
```

### 3. Menu Dinâmico
```
DashboardLayout renderiza → useAuth() obtém isAdmin
→ Filtra navLinks baseado em adminOnly
→ Exibe apenas links permitidos para o usuário
```

## Dados Mockados

O sistema atualmente utiliza dados mockados para demonstração. Em produção, estes dados devem vir de uma API:

### Usuários de Exemplo:

1. **João Silva** (USER)
   - Email: joao.silva@email.com
   - 1 assinatura ativa (Mensal)
   - Dispositivo vinculado: Desktop Dell

2. **Maria Santos** (USER)
   - Email: maria.santos@email.com
   - 1 assinatura ativa (Anual)
   - Dispositivo vinculado: MacBook Pro

3. **Carlos Oliveira** (ADMIN)
   - Email: carlos.oliveira@email.com
   - Sem assinaturas

4. **Ana Paula** (USER - Suspenso)
   - Email: ana.paula@email.com
   - 1 assinatura expirada
   - Sem dispositivo vinculado

5. **Roberto Lima** (USER)
   - Email: roberto.lima@email.com
   - 1 assinatura ativa (Mensal)
   - Dispositivo vinculado: Desktop HP

## Próximos Passos para Produção

### Backend Necessário:

1. **API de Autenticação**
   - Endpoint de login com JWT
   - Validação de credenciais
   - Refresh tokens

2. **API de Usuários**
   - CRUD de usuários
   - Atribuição de permissões
   - Gerenciamento de status

3. **API de Licenças**
   - Vincular/desvincular dispositivos
   - Atualizar status de licenças
   - Histórico de ativações

4. **API de Configurações**
   - Gerenciar preços
   - Gerenciar versões do sistema
   - Gerenciar recursos

### Banco de Dados:

Sugestão de schema Prisma/SQL para as tabelas necessárias:

```prisma
model User {
  id            String         @id @default(uuid())
  name          String
  email         String         @unique
  password      String
  role          UserRole       @default(USER)
  status        UserStatus     @default(ACTIVE)
  subscriptions Subscription[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum UserRole {
  ADMIN
  USER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model Subscription {
  id        String             @id @default(uuid())
  userId    String
  user      User               @relation(fields: [userId], references: [id])
  plan      String
  status    SubscriptionStatus
  endDate   DateTime
  licenseId String             @unique
  license   License            @relation(fields: [licenseId], references: [id])
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
}

model License {
  id           String        @id @default(uuid())
  code         String        @unique
  nickname     String
  status       LicenseStatus
  deviceId     String?       @unique
  device       Device?       @relation(fields: [deviceId], references: [id])
  subscription Subscription?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Device {
  id          String   @id @default(uuid())
  computerUid String   @unique
  deviceName  String
  license     License?
  activatedAt DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Segurança:

1. **Implementar hash de senhas** (bcrypt, argon2)
2. **Tokens JWT** com expiração
3. **Validação de permissões no backend**
4. **Rate limiting** para APIs
5. **Logs de auditoria** para ações administrativas
6. **Proteção contra CSRF/XSS**

### Melhorias Futuras:

- Sistema de notificações para usuários suspensos
- Histórico de alterações de permissões
- Relatórios de uso e estatísticas
- Exportação de dados de usuários
- Sistema de auditoria completo
- Autenticação de dois fatores (2FA)
- Integração com SSO (Single Sign-On)

## Suporte

Para dúvidas ou problemas, consulte a documentação técnica completa ou entre em contato com a equipe de desenvolvimento.
