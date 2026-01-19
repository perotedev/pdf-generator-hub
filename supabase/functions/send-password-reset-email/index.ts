// Supabase Edge Function para enviar email de recuperação de senha
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RequestBody {
  email: string
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
    const { email }: RequestBody = await req.json()

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      // Don't reveal if email exists for security
      return new Response(
        JSON.stringify({ success: true, message: 'If the email exists, a reset code has been sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user registered via Google OAuth (cannot reset password)
    const { data: authUser } = await supabase.auth.admin.getUserById(userData.id)

    if (authUser?.user?.app_metadata?.provider === 'google' ||
        authUser?.user?.app_metadata?.providers?.includes('google')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Esta conta foi criada usando o Google. Por favor, faça login com o Google.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Save code to database (expires in 15 minutes)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        user_id: userData.id,
        code: code,
        type: 'PASSWORD_RESET',
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
        from: 'PDF Generator <noreply@perotedev.com>',
        to: [email],
        subject: 'Recuperação de Senha - PDF Generator',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Recuperação de Senha</title>
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
                          <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Recuperação de Senha</h2>
                          <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Olá, ${userData.name || 'usuário'}!
                          </p>
                          <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Recebemos uma solicitação para redefinir a senha da sua conta no <strong>PDF Generator</strong>.
                          </p>
                          <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                            Utilize o código abaixo para criar uma nova senha:
                          </p>

                          <!-- Verification Code -->
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding: 20px 0;">
                                <div style="background-color: #fff5f5; border: 2px dashed #dc2626; border-radius: 8px; display: inline-block; padding: 20px 40px;">
                                  <span style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 8px;">${code}</span>
                                </div>
                              </td>
                            </tr>
                          </table>

                          <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                            Este código expira em <strong>15 minutos</strong>
                          </p>

                          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">

                          <div style="background-color: #fff8e1; border-left: 4px solid #fbbf24; padding: 15px; margin: 20px 0;">
                            <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                              <strong>⚠️ Importante:</strong> Se você não solicitou a recuperação de senha, ignore este email e sua senha permanecerá inalterada.
                            </p>
                          </div>
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
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      throw new Error('Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset email sent' }),
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
