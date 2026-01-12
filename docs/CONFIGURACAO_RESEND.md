# Configuração do Resend para Envio de Emails

Este guia explica como configurar o Resend para envio de emails transacionais no PDF Generator.

## O que é o Resend?

Resend é uma plataforma moderna de envio de emails transacionais com API simples e preços competitivos. Oferece:
- 100 emails gratuitos por dia
- API RESTful simples
- Templates HTML
- Dashboard com métricas
- Domínio personalizado

## Passo 1: Criar Conta no Resend

1. Acesse: https://resend.com
2. Clique em **Sign Up**
3. Crie sua conta (pode usar GitHub, Google ou email)
4. Confirme seu email

## Passo 2: Obter API Key

1. No Dashboard do Resend, vá em **API Keys**
2. Clique em **Create API Key**
3. Dê um nome: `PDF Generator Production`
4. Selecione permissão: **Sending access**
5. Clique em **Add**
6. **IMPORTANTE**: Copie a API Key (você só verá ela uma vez!)
   - Formato: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Passo 3: Configurar Domínio (Opcional mas Recomendado)

### Por que configurar domínio?

- Emails enviados de `noreply@seu-dominio.com` em vez de `noreply@resend.dev`
- Melhor taxa de entrega (deliverability)
- Mais profissional

### Como configurar:

1. No Resend Dashboard, vá em **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio: `perotedev.com`
4. Adicione os registros DNS fornecidos no seu provedor de domínio:

```
Tipo: TXT
Nome: _resend
Valor: [valor fornecido pelo Resend]

Tipo: MX
Nome: @
Valor: [valor fornecido pelo Resend]
Prioridade: 10

Tipo: CNAME
Nome: resend._domainkey
Valor: [valor fornecido pelo Resend]
```

5. Aguarde a verificação (pode levar até 72 horas, mas geralmente é rápido)
6. Quando verificado, você verá um ✅ verde no domínio

**Sem domínio**: Emails serão enviados de `onboarding@resend.dev` (funciona, mas não é ideal)

## Passo 4: Configurar no Supabase

### 4.1 Adicionar Secrets no Supabase

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings > Edge Functions**
4. Na seção **Secrets**, adicione:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

5. Clique em **Save**

### 4.2 Deploy das Edge Functions

As Edge Functions já foram criadas em:
- `supabase/functions/send-verification-email/`
- `supabase/functions/send-password-reset-email/`

**Deploy via CLI:**

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login
supabase login

# Link do projeto
supabase link --project-ref [SEU-PROJECT-REF]

# Deploy das funções
supabase functions deploy send-verification-email
supabase functions deploy send-password-reset-email
```

**Deploy via Dashboard:**

1. Vá em **Edge Functions** no Supabase Dashboard
2. Clique em **Deploy new function**
3. Faça upload do código de cada função

## Passo 5: Testar Envio de Email

### Teste manual via cURL:

```bash
curl -X POST 'https://[SEU-PROJECT-REF].supabase.co/functions/v1/send-verification-email' \
  -H 'Authorization: Bearer [SEU-ANON-KEY]' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-uuid-aqui",
    "email": "seu-email@example.com",
    "name": "Seu Nome"
  }'
```

### Teste via aplicação:

1. Tente criar uma nova conta no sistema
2. Verifique se o email foi enviado
3. Confira a pasta de spam se não receber

## Passo 6: Monitorar Envios

1. No Resend Dashboard, vá em **Emails**
2. Você verá todos os emails enviados com status:
   - ✅ **Delivered**: Email entregue com sucesso
   - ⏳ **Pending**: Aguardando envio
   - ❌ **Failed**: Falha no envio (veja o erro)

## Configuração no Código

### Atualizar remetente (se configurou domínio):

Edite as Edge Functions e altere o campo `from`:

```typescript
// De:
from: 'PDF Generator <noreply@perotedev.com>'

// Para (se não configurou domínio):
from: 'PDF Generator <onboarding@resend.dev>'
```

## Limites e Pricing

### Plano Gratuito:
- 100 emails/dia
- 3.000 emails/mês
- Ideal para desenvolvimento e testes

### Plano Pago (Pro):
- $20/mês
- 50.000 emails/mês inclusos
- $1 por 1.000 emails adicionais

## Troubleshooting

### Email não está chegando

1. **Verifique o spam/lixo eletrônico**
2. **Confira os logs no Resend Dashboard**
   - Vá em **Emails** e veja o status
   - Se houver erro, clique para ver detalhes
3. **Verifique a API Key**
   - Certifique-se que está configurada no Supabase
   - Teste se está ativa no Resend Dashboard
4. **Domínio não verificado**
   - Se configurou domínio próprio, verifique se está validado
   - Se não, use temporariamente `onboarding@resend.dev`

### Erro: "Failed to send email"

1. **Check API Key**: Verifique se copiou corretamente
2. **Check Secrets**: Confirme que `RESEND_API_KEY` está no Supabase
3. **Check Function Logs**: Vá em Edge Functions > Logs no Supabase

### Erro: "Rate limit exceeded"

- Você atingiu o limite de 100 emails/dia no plano gratuito
- Aguarde até o próximo dia ou faça upgrade para Pro

## Templates de Email

Os templates HTML já estão prontos nas Edge Functions:

- **Verificação de Email**: Template azul/laranja com código de 6 dígitos
- **Recuperação de Senha**: Template vermelho com código de 6 dígitos

### Personalizar templates:

Edite os arquivos:
- `supabase/functions/send-verification-email/index.ts`
- `supabase/functions/send-password-reset-email/index.ts`

Procure pela seção `html:` e modifique o HTML/CSS conforme necessário.

## Próximos Passos

Após configurar o Resend:

1. ✅ Execute os scripts SQL para criar as tabelas necessárias
2. ✅ Deploy das Edge Functions
3. ✅ Teste o envio de emails
4. ✅ Configure o domínio personalizado (opcional)
5. ✅ Monitore as entregas no Dashboard

## Links Úteis

- **Resend Dashboard**: https://resend.com/emails
- **Documentação Resend**: https://resend.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Status da API**: https://status.resend.com

## Suporte

Se encontrar problemas:
1. Verifique os logs no Resend Dashboard
2. Verifique os logs das Edge Functions no Supabase
3. Consulte a documentação do Resend
4. Entre em contato com o suporte do Resend (resposta rápida!)
