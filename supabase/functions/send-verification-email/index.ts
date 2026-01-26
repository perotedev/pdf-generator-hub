// Supabase Edge Function para enviar email de verificação
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RequestBody {
  userId: string
  email: string
  name: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, email, name }: RequestBody = await req.json()

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Save code to database (expires in 15 minutes)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        user_id: userId,
        code: code,
        type: 'EMAIL_VERIFICATION',
        email: email,
        expires_at: expiresAt.toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save verification code')
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Capidoc <noreply@perotedev.com>',
        to: [email],
        subject: 'Verificação de Email - Capidoc',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verificação de Email</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #FD8216 0%, #1470BB 100%); padding: 40px 20px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Capidoc</h1>
                        </td>
                      </tr>

                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Olá, ${name}!</h2>
                          <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Obrigado por se cadastrar no <strong>Capidoc</strong>!
                          </p>
                          <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                            Para ativar sua conta, utilize o código de verificação abaixo:
                          </p>

                          <!-- Verification Code -->
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding: 20px 0;">
                                <div style="background-color: #f8f9fa; border: 2px dashed #1470BB; border-radius: 8px; display: inline-block; padding: 20px 40px;">
                                  <span style="font-size: 32px; font-weight: bold; color: #1470BB; letter-spacing: 8px;">${code}</span>
                                </div>
                              </td>
                            </tr>
                          </table>

                          <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                            Este código expira em <strong>15 minutos</strong>
                          </p>

                          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">

                          <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0;">
                            Se você não criou uma conta no Capidoc, por favor ignore este email.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                          <p style="color: #999999; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} Capidoc. Todos os direitos reservados.<br>
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
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Verification email sent' }),
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
