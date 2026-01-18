// Supabase Edge Function para enviar emails transacionais
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type EmailType =
  | 'PURCHASE_CONFIRMATION'
  | 'SUBSCRIPTION_CANCELED'
  | 'DEVICE_UNLINKED'
  | 'ENTERPRISE_QUOTE_RECEIVED'
  | 'ENTERPRISE_QUOTE_CONTACTED'
  | 'PAYMENT_REMINDER'

interface RequestBody {
  type: EmailType
  to: string
  data: Record<string, any>
}

// Template base do email
const getEmailWrapper = (title: string, content: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #FD8216 0%, #1470BB 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">PDF Generator</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                ${content}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} PDF Generator. Todos os direitos reservados.<br>
                  <a href="https://perotedev.com" style="color: #1470BB; text-decoration: none;">PeroteDev</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

// Templates de email por tipo
const emailTemplates: Record<EmailType, (data: Record<string, any>) => { subject: string; html: string }> = {
  PURCHASE_CONFIRMATION: (data) => ({
    subject: 'Confirmacao de Compra - PDF Generator',
    html: getEmailWrapper('Confirmacao de Compra', `
      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Obrigado pela sua compra, ${data.name}!</h2>
      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Sua assinatura do <strong>PDF Generator</strong> foi confirmada com sucesso!
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <tr>
          <td>
            <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">Detalhes da Assinatura</h3>
            <table width="100%" cellpadding="5" cellspacing="0">
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Plano:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.planName}</td>
              </tr>
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Valor:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.amount}</td>
              </tr>
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Ciclo:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.billingCycle === 'MONTHLY' ? 'Mensal' : 'Anual'}</td>
              </tr>
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Proximo Pagamento:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.nextPaymentDate}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${data.licenseCode ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <tr>
          <td align="center">
            <h3 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 16px;">Sua Licenca</h3>
            <div style="background-color: #ffffff; border: 2px dashed #2e7d32; border-radius: 8px; display: inline-block; padding: 15px 30px;">
              <span style="font-size: 20px; font-weight: bold; color: #2e7d32; letter-spacing: 4px;">${data.licenseCode}</span>
            </div>
            <p style="color: #666666; font-size: 12px; margin: 15px 0 0 0;">
              Use este codigo para ativar o PDF Generator no seu computador
            </p>
          </td>
        </tr>
      </table>
      ` : ''}

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <a href="${data.dashboardUrl || 'https://perotedev.com/dashboard'}"
               style="display: inline-block; background: linear-gradient(135deg, #FD8216 0%, #1470BB 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Acessar Minha Conta
            </a>
          </td>
        </tr>
      </table>

      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
        Se tiver alguma duvida, entre em contato conosco!
      </p>
    `)
  }),

  SUBSCRIPTION_CANCELED: (data) => ({
    subject: 'Cancelamento de Assinatura - PDF Generator',
    html: getEmailWrapper('Cancelamento de Assinatura', `
      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ola, ${data.name}</h2>
      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Confirmamos o cancelamento da renovacao automatica da sua assinatura do <strong>PDF Generator</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3e0; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ff9800;">
        <tr>
          <td>
            <h3 style="color: #e65100; margin: 0 0 10px 0; font-size: 16px;">Importante</h3>
            <p style="color: #666666; font-size: 14px; margin: 0;">
              Sua assinatura permanecera ativa ate <strong>${data.expirationDate}</strong>.
              Apos essa data, voce perdera o acesso aos recursos do PDF Generator.
            </p>
          </td>
        </tr>
      </table>

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Sentiremos sua falta! Se mudar de ideia, voce pode reativar sua assinatura a qualquer momento antes da data de expiracao.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <a href="${data.dashboardUrl || 'https://perotedev.com/dashboard/assinaturas'}"
               style="display: inline-block; background: linear-gradient(135deg, #FD8216 0%, #1470BB 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Reativar Assinatura
            </a>
          </td>
        </tr>
      </table>
    `)
  }),

  DEVICE_UNLINKED: (data) => ({
    subject: 'Dispositivo Desvinculado - PDF Generator',
    html: getEmailWrapper('Dispositivo Desvinculado', `
      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ola, ${data.name}</h2>
      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Um dispositivo foi desvinculado da sua licenca do <strong>PDF Generator</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <tr>
          <td>
            <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">Detalhes</h3>
            <table width="100%" cellpadding="5" cellspacing="0">
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Dispositivo:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.deviceName || 'Nao identificado'}</td>
              </tr>
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Data:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.unlinkedAt}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Sua licenca agora esta disponivel para ativacao em outro dispositivo.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8e1; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <tr>
          <td>
            <p style="color: #666666; font-size: 14px; margin: 0;">
              <strong>Nao foi voce?</strong> Se voce nao solicitou esta desvinculacao,
              recomendamos alterar sua senha imediatamente por seguranca.
            </p>
          </td>
        </tr>
      </table>
    `)
  }),

  ENTERPRISE_QUOTE_RECEIVED: (data) => ({
    subject: 'Recebemos seu orcamento - PDF Generator',
    html: getEmailWrapper('Orcamento Recebido', `
      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ola, ${data.contactName}!</h2>
      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Recebemos sua solicitacao de orcamento Enterprise para a <strong>${data.companyName}</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e3f2fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <tr>
          <td>
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">Resumo da Solicitacao</h3>
            <table width="100%" cellpadding="5" cellspacing="0">
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Empresa:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.companyName}</td>
              </tr>
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Quantidade de Licencas:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.licenseQuantity}</td>
              </tr>
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Preferencia de Cobranca:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.billingPreference === 'MONTHLY' ? 'Mensal' : data.billingPreference === 'YEARLY' ? 'Anual' : 'Personalizado'}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Nossa equipe comercial entrara em contato em ate <strong>24 horas uteis</strong> para discutir os detalhes e enviar uma proposta personalizada.
      </p>

      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
        Agradecemos seu interesse no PDF Generator!
      </p>
    `)
  }),

  ENTERPRISE_QUOTE_CONTACTED: (data) => ({
    subject: 'Atualizacao do seu orcamento - PDF Generator',
    html: getEmailWrapper('Atualizacao de Orcamento', `
      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ola, ${data.contactName}!</h2>
      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Temos novidades sobre sua solicitacao de orcamento Enterprise para a <strong>${data.companyName}</strong>.
      </p>

      ${data.quotedPrice ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <tr>
          <td align="center">
            <h3 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 16px;">Valor Proposto</h3>
            <span style="font-size: 28px; font-weight: bold; color: #2e7d32;">${data.quotedPrice}</span>
            <p style="color: #666666; font-size: 14px; margin: 10px 0 0 0;">
              Para ${data.licenseQuantity} licencas (${data.billingPreference === 'MONTHLY' ? 'Mensal' : data.billingPreference === 'YEARLY' ? 'Anual' : 'Personalizado'})
            </p>
          </td>
        </tr>
      </table>
      ` : ''}

      ${data.adminNotes ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <tr>
          <td>
            <h3 style="color: #333333; margin: 0 0 10px 0; font-size: 16px;">Mensagem da equipe</h3>
            <p style="color: #666666; font-size: 14px; margin: 0; white-space: pre-line;">${data.adminNotes}</p>
          </td>
        </tr>
      </table>
      ` : ''}

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Para dar continuidade, responda este email ou entre em contato conosco.
      </p>
    `)
  }),

  PAYMENT_REMINDER: (data) => ({
    subject: 'Lembrete de Pagamento - PDF Generator',
    html: getEmailWrapper('Lembrete de Pagamento', `
      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ola, ${data.name}!</h2>
      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Este e um lembrete amigavel sobre seu proximo pagamento do <strong>PDF Generator</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3e0; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ff9800;">
        <tr>
          <td>
            <h3 style="color: #e65100; margin: 0 0 15px 0; font-size: 18px;">Proximo Pagamento</h3>
            <table width="100%" cellpadding="5" cellspacing="0">
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Plano:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.planName}</td>
              </tr>
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Valor:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.amount}</td>
              </tr>
              <tr>
                <td style="color: #666666; font-size: 14px; padding: 5px 0;">Data:</td>
                <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right;">${data.paymentDate}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Certifique-se de que seu metodo de pagamento esta atualizado para evitar interrupcoes no servico.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <a href="${data.dashboardUrl || 'https://perotedev.com/dashboard/assinaturas'}"
               style="display: inline-block; background: linear-gradient(135deg, #FD8216 0%, #1470BB 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Verificar Assinatura
            </a>
          </td>
        </tr>
      </table>
    `)
  }),
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, data }: RequestBody = await req.json()

    // Validate request
    if (!type || !to || !data) {
      throw new Error('Missing required fields: type, to, data')
    }

    // Get email template
    const template = emailTemplates[type]
    if (!template) {
      throw new Error(`Unknown email type: ${type}`)
    }

    const { subject, html } = template(data)

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'PDF Generator <noreply@perotedev.com>',
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    const resendData = await res.json()

    if (!res.ok) {
      console.error('Resend error:', resendData)
      throw new Error('Failed to send email')
    }

    console.log(`Email sent successfully: ${type} to ${to}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', id: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
