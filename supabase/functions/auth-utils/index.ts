import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // POST: Ações que requerem corpo
    if (req.method === 'POST') {
      const body = await req.json()

      switch (action) {
        // Verificar se email existe
        case 'check-email': {
          const { email } = body

          if (!email) {
            return new Response(
              JSON.stringify({ error: 'Email is required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          const { data: existingUser, error } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('email', email.toLowerCase())
            .single()

          if (error && error.code !== 'PGRST116') {
            throw error
          }

          return new Response(
            JSON.stringify({ exists: !!existingUser, user: existingUser }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        // Criar usuário no auth e na tabela users
        case 'register': {
          const { email, password, name } = body

          if (!email || !password || !name) {
            return new Response(
              JSON.stringify({ error: 'Email, password and name are required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          // Verificar se já existe na tabela users
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('email', email.toLowerCase())
            .single()

          if (existingUser) {
            return new Response(
              JSON.stringify({ error: 'Este email já está em uso. Tente fazer login ou use outro email.', code: 'EMAIL_EXISTS' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
            )
          }

          // Criar no Supabase Auth
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: false,
            user_metadata: { name: name }
          })

          if (authError) {
            console.error('Auth error:', authError)
            if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
              return new Response(
                JSON.stringify({ error: 'Este email já está cadastrado. Tente fazer login ou recuperar sua senha.', code: 'EMAIL_EXISTS' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
              )
            }
            throw authError
          }

          if (!authData.user) {
            throw new Error('Failed to create user')
          }

          // Criar na tabela users
          const { error: dbError } = await supabaseAdmin
            .from('users')
            .insert({
              id: authData.user.id,
              email: email.toLowerCase(),
              name: name,
              password_hash: 'hashed',
              role: 'USER',
              status: 'PENDING',
            })

          if (dbError) {
            console.error('DB error:', dbError)
            // Se falhar, deletar do auth
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            throw dbError
          }

          return new Response(
            JSON.stringify({
              success: true,
              user: {
                id: authData.user.id,
                email: authData.user.email,
                name: name,
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
          )
        }

        // Login - retorna status do usuário
        case 'login': {
          const { email, password } = body

          if (!email || !password) {
            return new Response(
              JSON.stringify({ error: 'Email and password are required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          // Tentar fazer login
          const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
          })

          if (authError) {
            return new Response(
              JSON.stringify({ error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
          }

          if (!authData.user) {
            return new Response(
              JSON.stringify({ error: 'Usuário não encontrado' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
          }

          // Buscar dados do usuário
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, email, name, status, role')
            .eq('id', authData.user.id)
            .single()

          if (userError) {
            console.error('User fetch error:', userError)
          }

          return new Response(
            JSON.stringify({
              success: true,
              session: authData.session,
              user: userData || {
                id: authData.user.id,
                email: authData.user.email,
                status: 'ACTIVE',
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        // Buscar status do usuário pelo ID
        case 'get-user-status': {
          const { userId } = body

          if (!userId) {
            return new Response(
              JSON.stringify({ error: 'User ID is required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          const { data: userData, error } = await supabaseAdmin
            .from('users')
            .select('id, email, name, status, role')
            .eq('id', userId)
            .single()

          if (error) {
            if (error.code === 'PGRST116') {
              return new Response(
                JSON.stringify({ error: 'User not found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
              )
            }
            throw error
          }

          return new Response(
            JSON.stringify({ user: userData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        // Criar usuário OAuth (para AuthCallback)
        case 'create-oauth-user': {
          const { id, email, name } = body

          if (!id || !email) {
            return new Response(
              JSON.stringify({ error: 'ID and email are required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          // Verificar se já existe pelo ID
          const { data: existingUserById } = await supabaseAdmin
            .from('users')
            .select('id, status, email')
            .eq('id', id)
            .single()

          if (existingUserById) {
            return new Response(
              JSON.stringify({ exists: true, user: existingUserById }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
          }

          // Verificar se email já existe
          const { data: existingUserByEmail } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('email', email.toLowerCase())
            .single()

          if (existingUserByEmail) {
            return new Response(
              JSON.stringify({ error: 'Este email já está cadastrado com outro método de login.', code: 'EMAIL_EXISTS_OTHER_METHOD' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
            )
          }

          // Criar usuário
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: id,
              email: email.toLowerCase(),
              name: name || email.split('@')[0],
              password_hash: 'oauth',
              role: 'USER',
              status: 'ACTIVE',
            })

          if (insertError) {
            if (insertError.code === '23505') {
              return new Response(
                JSON.stringify({ error: 'Este email já está cadastrado.', code: 'EMAIL_EXISTS' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
              )
            }
            throw insertError
          }

          return new Response(
            JSON.stringify({ success: true, created: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
          )
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
