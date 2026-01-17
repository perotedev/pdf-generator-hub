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

    // Para leitura pública de versões e settings
    if (req.method === 'GET' && (action === 'versions' || action === 'settings' || action === 'latest-version')) {
      switch (action) {
        case 'versions': {
          const { data, error } = await supabaseAdmin
            .from('system_versions')
            .select('*')
            .eq('is_active', true)
            .order('release_date', { ascending: false })

          if (error) throw error

          return new Response(
            JSON.stringify({ versions: data || [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        case 'latest-version': {
          const { data, error } = await supabaseAdmin
            .from('system_versions')
            .select('*')
            .eq('is_latest', true)
            .eq('is_active', true)
            .single()

          if (error && error.code !== 'PGRST116') throw error

          return new Response(
            JSON.stringify({ version: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        case 'settings': {
          const { data, error } = await supabaseAdmin
            .from('system_settings')
            .select('*')

          if (error) throw error

          return new Response(
            JSON.stringify({ settings: data || [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
      }
    }

    // Para operações que requerem autenticação
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

    // Verificar se é admin para operações de escrita
    const isAdmin = await checkPermission(supabaseAdmin, authUser.id, 'ADMIN')

    if (!isAdmin && req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // GET: Listar todas as versões (incluindo inativas para admin)
    if (req.method === 'GET' && action === 'all-versions') {
      const { data, error } = await supabaseAdmin
        .from('system_versions')
        .select('*')
        .order('release_date', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ versions: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // POST: Criar nova versão
    if (req.method === 'POST' && action === 'version') {
      const body = await req.json()

      const { data, error } = await supabaseAdmin
        .from('system_versions')
        .insert(body)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ version: data, message: 'Version created successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      )
    }

    // PUT: Atualizar versão ou setting
    if (req.method === 'PUT') {
      const body = await req.json()

      if (action === 'version') {
        const versionId = url.searchParams.get('versionId')

        if (!versionId) {
          return new Response(
            JSON.stringify({ error: 'Version ID required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const { data, error } = await supabaseAdmin
          .from('system_versions')
          .update(body)
          .eq('id', versionId)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ version: data, message: 'Version updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      if (action === 'setting') {
        const key = url.searchParams.get('key')
        const { value } = body

        if (!key) {
          return new Response(
            JSON.stringify({ error: 'Setting key required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const { data, error } = await supabaseAdmin
          .from('system_settings')
          .update({ value })
          .eq('key', key)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ setting: data, message: 'Setting updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    // DELETE: Deletar versão
    if (req.method === 'DELETE' && action === 'version') {
      const versionId = url.searchParams.get('versionId')

      if (!versionId) {
        return new Response(
          JSON.stringify({ error: 'Version ID required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const { error } = await supabaseAdmin
        .from('system_versions')
        .delete()
        .eq('id', versionId)

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'Version deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
