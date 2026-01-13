import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Função auxiliar para verificar permissões
async function checkPermission(supabase, userId, requiredRole) {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (!user) return false

  if (requiredRole === 'ADMIN') {
    return user.role === 'ADMIN'
  } else if (requiredRole === 'MANAGER') {
    return user.role === 'ADMIN' || user.role === 'MANAGER'
  }

  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Cliente para operações no banco de dados
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Extrair o token do header
    const token = authHeader.replace('Bearer ', '')

    // Validar o token usando o supabaseAdmin com getUser(token)
    // Isso é mais confiável do que criar um novo cliente
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authUser) {
      console.error('Auth error:', authError?.message || 'No user found')
      return new Response(
        JSON.stringify({ code: 401, message: 'Invalid JWT', details: authError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const currentUserId = authUser.id

    if (!currentUserId) {
      return new Response(
        JSON.stringify({ code: 401, message: 'User ID not found in token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Usar supabaseAdmin para todas as operações no banco
    const supabase = supabaseAdmin

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const userId = url.searchParams.get('userId')

    // GET: Listar usuários ou buscar um específico
    if (req.method === 'GET') {
      // Verificar se pode gerenciar usuários
      const canManage = await checkPermission(supabase, currentUserId, 'MANAGER')

      if (!canManage && userId !== currentUserId) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      if (userId) {
        // Buscar usuário específico
        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, name, role, status, created_at, updated_at, last_login')
          .eq('id', userId)
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } else {
        // Listar todos os usuários
        const { data: users, error } = await supabase
          .from('users')
          .select('id, email, name, role, status, created_at, updated_at, last_login')
          .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(
          JSON.stringify({ users }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    // PUT: Atualizar usuário
    if (req.method === 'PUT' && userId) {
      const body = await req.json()
      const { name, role, status, password } = body

      // Verificar permissões
      if (userId !== currentUserId) {
        const canManage = await checkPermission(supabase, currentUserId, 'MANAGER')
        if (!canManage) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          )
        }
      }

      // Se estiver mudando role, verificar se é admin
      if (role && userId !== currentUserId) {
        const isAdmin = await checkPermission(supabase, currentUserId, 'ADMIN')
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: 'Only admins can change user roles' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          )
        }
      }

      // Preparar dados para atualização
      const updateData = {}
      if (name) updateData.name = name
      if (role && role !== undefined) updateData.role = role
      if (status && status !== undefined) updateData.status = status
      if (password) {
        updateData.password_hash = await bcrypt.hash(password)
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('id, email, name, role, status, created_at, updated_at, last_login')
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ user: updatedUser, message: 'User updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // DELETE: Deletar usuário (apenas admin)
    if (req.method === 'DELETE' && userId) {
      const isAdmin = await checkPermission(supabase, currentUserId, 'ADMIN')

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Only admins can delete users' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      // Não permitir deletar a si mesmo
      if (userId === currentUserId) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own account' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'User deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
