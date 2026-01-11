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

    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Email, password and name are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verificar se o email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password)

    // Criar usuário
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        name: name.trim(),
        role: 'USER',
        status: 'ACTIVE'
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Retornar dados do usuário (sem senha)
    const { password_hash, ...userWithoutPassword } = newUser

    return new Response(
      JSON.stringify({
        user: userWithoutPassword,
        message: 'User registered successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
