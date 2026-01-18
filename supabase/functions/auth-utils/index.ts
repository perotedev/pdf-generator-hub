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

          const normalizedEmail = String(email).trim().toLowerCase()
          const safeName = String(name).trim()

          // 1) Verificar se já existe na tabela users (sem estourar quando não acha)
          const { data: existingUser, error: existingErr } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('email', normalizedEmail)
            .maybeSingle()

          if (existingErr) {
            console.error('Existing user check error:', existingErr)
            throw existingErr
          }

          if (existingUser) {
            return new Response(
              JSON.stringify({
                error: 'Este email já está em uso. Tente fazer login ou use outro email.',
                code: 'EMAIL_EXISTS'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
            )
          }

          // 2) Criar no Supabase Auth
          const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
              email: normalizedEmail,
              password,
              email_confirm: false,
              user_metadata: { name: safeName },
            })

          if (authError) {
            console.error('Auth error:', authError)

            // mensagens comuns quando já existe no Auth
            const msg = (authError.message || '').toLowerCase()
            if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
              return new Response(
                JSON.stringify({
                  error: 'Este email já está cadastrado. Tente fazer login ou recuperar sua senha.',
                  code: 'EMAIL_EXISTS'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
              )
            }

            throw authError
          }

          const createdAuthUser = authData?.user
          if (!createdAuthUser?.id) {
            throw new Error('Failed to create user in auth')
          }

          // 3) Criar/garantir na tabela users (UPsert evita 23505 no users_pkey)
          const { data: userRow, error: dbError } = await supabaseAdmin
            .from('users')
            .upsert(
              {
                id: createdAuthUser.id,
                email: normalizedEmail,
                name: safeName,
                password_hash: 'hashed',
                role: 'USER',
                status: 'PENDING',
              },
              { onConflict: 'id' }
            )
            .select('id, email, name')
            .single()

          if (dbError) {
            console.error('DB error:', dbError)

            // Se falhou por um motivo diferente de duplicidade, tenta rollback do Auth
            // (duplicidade no id não deve mais ocorrer por causa do upsert)
            try {
              await supabaseAdmin.auth.admin.deleteUser(createdAuthUser.id)
            } catch (e) {
              console.error('Rollback auth delete failed:', e)
            }

            throw dbError
          }

          return new Response(
            JSON.stringify({
              success: true,
              user: {
                id: userRow.id,
                email: userRow.email,
                name: userRow.name,
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
          )
        }

        // Login - retorna status do usuário
        case 'login': {
          console.log('Login attempt - checking OAuth user')
          const { email, password } = body

          if (!email || !password) {
            return new Response(
              JSON.stringify({ error: 'Email and password are required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          // Verificar se o usuário existe e qual método de autenticação ele usa
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, email, password_hash')
            .eq('email', email.toLowerCase())
            .single()

          console.log('Existing user found:', existingUser)
          console.log('Password hash:', existingUser?.password_hash)

          // Se o usuário existe e foi criado via OAuth (password_hash é 'oauth' ou null/vazio), informar que deve usar Google
          if (existingUser && (!existingUser.password_hash || existingUser.password_hash === 'oauth')) {
            console.log('User is OAuth (no password), returning error')
            return new Response(
              JSON.stringify({
                error: 'Este email está cadastrado com login do Google. Por favor, use o botão "Entrar com Google" para acessar sua conta.',
                code: 'OAUTH_USER'
              }),
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
            .select('id, status, email, role')
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
            .select('id, email', 'role')
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
              role: existingUserByEmail.role,
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
