import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Buscar usuário por email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (fetchError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar se o usuário está ativo
    if (user.status !== 'ACTIVE') {
      return new Response(
        JSON.stringify({ error: 'Account is not active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Atualizar last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Gerar token JWT (usando Supabase Auth)
    const { data: { session }, error: sessionError } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: true,
      user_metadata: {
        user_id: user.id,
        name: user.name,
        role: user.role
      }
    })

    // Retornar dados do usuário (sem senha)
    const { password_hash, ...userWithoutPassword } = user

    return new Response(
      JSON.stringify({
        user: userWithoutPassword,
        session: session,
        message: 'Login successful'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
