// Supabase Edge Function para verificar código e resetar senha
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RequestBody {
  code: string
  email: string
  newPassword: string
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
    const { code, email, newPassword }: RequestBody = await req.json()

    if (!code || !email || !newPassword) {
      throw new Error('Code, email and newPassword are required')
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find the verification code
    const { data: verificationCode, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('type', 'PASSWORD_RESET')
      .is('verified_at', null) // Not yet verified
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !verificationCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Código inválido ou já utilizado' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if code has expired
    const now = new Date()
    const expiresAt = new Date(verificationCode.expires_at)

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ success: false, error: 'Código expirado. Solicite um novo código.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Mark code as verified
    const { error: updateCodeError } = await supabase
      .from('verification_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verificationCode.id)

    if (updateCodeError) {
      console.error('Error updating verification code:', updateCodeError)
      throw new Error('Failed to update verification code')
    }

    // Update user password using Supabase Admin API
    const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(
      verificationCode.user_id,
      { password: newPassword }
    )

    if (updatePasswordError) {
      console.error('Error updating password:', updatePasswordError)
      throw new Error('Failed to update password')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Senha atualizada com sucesso!' }),
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
