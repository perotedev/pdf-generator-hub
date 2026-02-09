import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Função para gerar código de licença único
function generateLicenseCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const groups = []

  for (let i = 0; i < 5; i++) {
    let group = ''
    for (let j = 0; j < 5; j++) {
      group += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    groups.push(group)
  }

  return groups.join('-')
}

// Função auxiliar para verificar se é admin
async function isAdmin(supabase, userId) {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'ADMIN'
}

// Função auxiliar para verificar se é admin ou manager
async function isAdminOrManager(supabase, userId) {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'ADMIN' || user?.role === 'MANAGER'
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

    // Usar supabaseAdmin para todas as operações no banco
    const supabase = supabaseAdmin

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const licenseId = url.searchParams.get('licenseId')

    // GET: Buscar licença individual
    if (req.method === 'GET' && action === 'get' && licenseId) {
      const { data: license, error } = await supabase
        .from('licenses')
        .select('*, contracts(email)')
        .eq('id', licenseId)
        .single()

      if (error || !license) {
        return new Response(
          JSON.stringify({ error: 'License not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      const adminOrManager = await isAdminOrManager(supabase, currentUserId)
      if (!adminOrManager) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', currentUserId)
          .single()

        const ownsLicense = license.user_id === currentUserId
        const ownsContractLicense = license.contracts?.email && currentUser?.email
          ? license.contracts.email === currentUser.email
          : false

        if (!ownsLicense && !ownsContractLicense) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          )
        }
      }

      const { contracts, ...licenseData } = license

      return new Response(
        JSON.stringify({ license: licenseData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // GET: Listar licenças
    if (req.method === 'GET') {
      const showStandalone = url.searchParams.get('standalone') === 'true'

      let query = supabase
        .from('licenses')
        .select('*, subscriptions(id, plan_id, status)')

      if (showStandalone) {
        // Verificar se é admin
        const admin = await isAdmin(supabase, currentUserId)
        if (!admin) {
          return new Response(
            JSON.stringify({ error: 'Only admins can view standalone licenses' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          )
        }
        // Filtrar licenças standalone que NÃO pertencem a um contrato
        query = query.eq('is_standalone', true).is('contract_id', null)
      } else {
        query = query.eq('user_id', currentUserId)
      }

      const { data: licenses, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ licenses }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // POST: Criar nova licença standalone (apenas admin)
    if (req.method === 'POST' && action === 'create') {
      const admin = await isAdmin(supabase, currentUserId)
      if (!admin) {
        return new Response(
          JSON.stringify({ error: 'Only admins can create standalone licenses' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      const { client, company, plan_type, expire_days } = await req.json()

      if (!company) {
        return new Response(
          JSON.stringify({ error: 'Company is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Gerar código único
      let code
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        code = generateLicenseCode()
        const { data: existing } = await supabase
          .from('licenses')
          .select('id')
          .eq('code', code)
          .single()

        if (!existing) break
        attempts++
      }

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique license code')
      }

      // Calcular data de expiração
      let expireDate = null
      if (expire_days) {
        expireDate = new Date()
        expireDate.setDate(expireDate.getDate() + parseInt(expire_days))
      }

      const { data: license, error } = await supabase
        .from('licenses')
        .insert({
          code,
          client: client || null,
          company,
          plan_type: plan_type || null,
          is_standalone: true,
          sold: false,
          expire_date: expireDate
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ license, message: 'License created successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      )
    }

    // PUT: Atualizar licença
    if (req.method === 'PUT' && licenseId) {
      const admin = await isAdmin(supabase, currentUserId)
      if (!admin) {
        return new Response(
          JSON.stringify({ error: 'Only admins can update licenses' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      const { client, company, plan_type, sold, expire_date } = await req.json()

      const updateData = {}
      if (client !== undefined) updateData.client = client
      if (company !== undefined) updateData.company = company
      if (plan_type !== undefined) updateData.plan_type = plan_type
      if (sold !== undefined) updateData.sold = sold
      if (expire_date !== undefined) updateData.expire_date = expire_date

      const { data: license, error } = await supabase
        .from('licenses')
        .update(updateData)
        .eq('id', licenseId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ license, message: 'License updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // POST: Desvincular dispositivo
    if (req.method === 'POST' && action === 'unbind' && licenseId) {
      const admin = await isAdmin(supabase, currentUserId)
      if (!admin) {
        return new Response(
          JSON.stringify({ error: 'Only admins can unbind devices' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      const { data: license, error } = await supabase
        .from('licenses')
        .update({
          is_used: false,
          device_id: null,
          device_type: null,
          activated_at: null
        })
        .eq('id', licenseId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ license, message: 'Device unbound successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // DELETE: Deletar licença standalone
    if (req.method === 'DELETE' && licenseId) {
      const admin = await isAdmin(supabase, currentUserId)
      if (!admin) {
        return new Response(
          JSON.stringify({ error: 'Only admins can delete licenses' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      // Verificar se é standalone
      const { data: license } = await supabase
        .from('licenses')
        .select('is_standalone')
        .eq('id', licenseId)
        .single()

      if (!license?.is_standalone) {
        return new Response(
          JSON.stringify({ error: 'Can only delete standalone licenses' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', licenseId)

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'License deleted successfully' }),
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
