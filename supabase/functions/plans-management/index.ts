import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Função auxiliar para verificar permissões
async function checkPermission(supabase: any, userId: string, requiredRole: string): Promise<boolean> {
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // GET: Buscar planos (público)
    if (req.method === 'GET') {
      if (action === 'all') {
        // Todos os planos (para admin)
        const { data, error } = await supabaseAdmin
          .from('plans')
          .select('*')
          .order('billing_cycle')

        if (error) throw error

        return new Response(
          JSON.stringify({ plans: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Planos ativos (público)
      const { data, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('billing_cycle')

      if (error) throw error

      return new Response(
        JSON.stringify({ plans: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Para operações de escrita, verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar se é admin
    const isAdmin = await checkPermission(supabaseAdmin, authUser.id, 'ADMIN')

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // PUT: Atualizar plano
    if (req.method === 'PUT') {
      const body = await req.json()
      const planId = url.searchParams.get('planId')

      if (!planId) {
        return new Response(
          JSON.stringify({ error: 'Plan ID required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('plans')
        .update(body)
        .eq('id', planId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ plan: data, message: 'Plan updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
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
