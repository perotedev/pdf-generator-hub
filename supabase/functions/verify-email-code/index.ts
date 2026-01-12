// Supabase Edge Function para verificar código de email
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RequestBody {
  code: string
  userId: string
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
    const { code, userId }: RequestBody = await req.json()

    if (!code || !userId) {
      throw new Error('Code and userId are required')
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find the verification code
    const { data: verificationCode, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('type', 'EMAIL_VERIFICATION')
      .is('verified_at', null) // Not yet verified
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

    // Update user status to ACTIVE
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ status: 'ACTIVE' })
      .eq('id', userId)

    if (updateUserError) {
      console.error('Error updating user status:', updateUserError)
      throw new Error('Failed to activate user')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email verificado com sucesso!' }),
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
