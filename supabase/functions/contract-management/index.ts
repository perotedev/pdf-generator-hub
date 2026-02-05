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

// Função auxiliar para verificar se é admin ou manager
async function isAdminOrManager(supabase: any, userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'ADMIN' || user?.role === 'MANAGER'
}

// Função auxiliar para verificar se é admin
async function isAdmin(supabase: any, userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === 'ADMIN'
}

// Função para gerar número do contrato
async function generateContractNumber(supabase: any) {
  // Buscar o último número de contrato
  const { data: lastContract } = await supabase
    .from('contracts')
    .select('contract_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let nextNumber = 1000
  if (lastContract?.contract_number) {
    const lastNumber = parseInt(lastContract.contract_number.replace('CTR-', ''))
    nextNumber = lastNumber + 1
  }

  return `CTR-${nextNumber.toString().padStart(6, '0')}`
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
        JSON.stringify({ code: 401, message: 'Invalid JWT' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const currentUserId = authUser.id
    const supabase = supabaseAdmin

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const contractId = url.searchParams.get('contractId')
    const licenseId = url.searchParams.get('licenseId')

    // GET: Listar contratos
    if (req.method === 'GET' && !action) {
      const adminOrManager = await isAdminOrManager(supabase, currentUserId)

      let query = supabase
        .from('contracts')
        .select('*, enterprise_quotes(company_name, contact_name)')
        .order('created_at', { ascending: false })

      // Se não for admin/manager, filtrar pelo email do usuário
      if (!adminOrManager) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', currentUserId)
          .single()

        if (currentUser?.email) {
          query = query.eq('email', currentUser.email)
        } else {
          return new Response(
            JSON.stringify({ contracts: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
      }

      const { data: contracts, error } = await query

      if (error) throw error

      return new Response(
        JSON.stringify({ contracts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // GET: Buscar um contrato específico
    if (req.method === 'GET' && action === 'get' && contractId) {
      const adminOrManager = await isAdminOrManager(supabase, currentUserId)

      let query = supabase
        .from('contracts')
        .select('*, enterprise_quotes(company_name, contact_name)')
        .eq('id', contractId)
        .single()

      const { data: contract, error } = await query

      if (error) throw error

      // Verificar acesso
      if (!adminOrManager) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', currentUserId)
          .single()

        if (contract.email !== currentUser?.email) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          )
        }
      }

      return new Response(
        JSON.stringify({ contract }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // GET: Listar licenças de um contrato
    if (req.method === 'GET' && action === 'licenses' && contractId) {
      const adminOrManager = await isAdminOrManager(supabase, currentUserId)

      // Verificar acesso ao contrato
      const { data: contract } = await supabase
        .from('contracts')
        .select('email')
        .eq('id', contractId)
        .single()

      if (!contract) {
        return new Response(
          JSON.stringify({ error: 'Contract not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      if (!adminOrManager) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', currentUserId)
          .single()

        if (contract.email !== currentUser?.email) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          )
        }
      }

      const { data: licenses, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ licenses }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // POST: Criar contrato com licenças
    if (req.method === 'POST' && action === 'create') {
      const adminOrManager = await isAdminOrManager(supabase, currentUserId)
      if (!adminOrManager) {
        return new Response(
          JSON.stringify({ error: 'Only admins and managers can create contracts' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      const {
        company_name,
        representative_name,
        email,
        phone,
        value,
        quote_id,
        // Dados das licenças
        license_quantity,
        plan_type,
        expire_days
      } = await req.json()

      // Validações
      if (!company_name || !representative_name || !email || !phone || value === undefined) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      if (!license_quantity || license_quantity < 1) {
        return new Response(
          JSON.stringify({ error: 'License quantity must be at least 1' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // Gerar número do contrato
      const contractNumber = await generateContractNumber(supabase)

      // Criar o contrato
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          contract_number: contractNumber,
          company_name,
          representative_name,
          email,
          phone,
          value,
          quote_id: quote_id || null
        })
        .select()
        .single()

      if (contractError) throw contractError

      // Calcular data de expiração
      let expireDate = null
      if (expire_days) {
        expireDate = new Date()
        expireDate.setDate(expireDate.getDate() + parseInt(expire_days))
      }

      // Gerar as licenças
      const licensesToCreate = []
      for (let i = 0; i < license_quantity; i++) {
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

        licensesToCreate.push({
          code,
          company: company_name,
          plan_type: plan_type || null,
          is_standalone: true,
          sold: true, // Licenças de contrato já são consideradas vendidas
          expire_date: expireDate,
          contract_id: contract.id
        })
      }

      // Inserir todas as licenças
      const { data: licenses, error: licensesError } = await supabase
        .from('licenses')
        .insert(licensesToCreate)
        .select()

      if (licensesError) {
        // Rollback: deletar o contrato se falhar ao criar licenças
        await supabase.from('contracts').delete().eq('id', contract.id)
        throw licensesError
      }

      return new Response(
        JSON.stringify({
          contract,
          licenses,
          message: `Contract created with ${licenses.length} licenses`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      )
    }

    // PUT: Atualizar contrato
    if (req.method === 'PUT' && contractId && !action) {
      const adminOrManager = await isAdminOrManager(supabase, currentUserId)
      if (!adminOrManager) {
        return new Response(
          JSON.stringify({ error: 'Only admins and managers can update contracts' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      const { company_name, representative_name, email, phone, value } = await req.json()

      const updateData: Record<string, any> = {}
      if (company_name !== undefined) updateData.company_name = company_name
      if (representative_name !== undefined) updateData.representative_name = representative_name
      if (email !== undefined) updateData.email = email
      if (phone !== undefined) updateData.phone = phone
      if (value !== undefined) updateData.value = value

      const { data: contract, error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ contract, message: 'Contract updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // PUT: Atualizar licença do contrato (nickname/client)
    if (req.method === 'PUT' && action === 'update-license' && licenseId) {
      const { client } = await req.json()

      // Buscar a licença para verificar se pertence a um contrato
      const { data: license } = await supabase
        .from('licenses')
        .select('contract_id, device_type, device_id, contracts(email, representative_name)')
        .eq('id', licenseId)
        .single()

      if (!license || !license.contract_id) {
        return new Response(
          JSON.stringify({ error: 'License not found or not part of a contract' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Verificar acesso
      const adminOrManager = await isAdminOrManager(supabase, currentUserId)
      if (!adminOrManager) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', currentUserId)
          .single()

        if (license.contracts?.email !== currentUser?.email) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          )
        }
      }

      const { data: updatedLicense, error } = await supabase
        .from('licenses')
        .update({ client })
        .eq('id', licenseId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ license: updatedLicense, message: 'License updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // PUT: Atualizar licença do contrato (admin - todos os campos)
    if (req.method === 'PUT' && action === 'admin-update-license' && licenseId) {
      const adminOrManager = await isAdminOrManager(supabase, currentUserId)
      if (!adminOrManager) {
        return new Response(
          JSON.stringify({ error: 'Only admins and managers can perform this action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      const { client, expire_date, plan_type, sold } = await req.json()

      const updateData: Record<string, any> = {}
      if (client !== undefined) updateData.client = client
      if (expire_date !== undefined) updateData.expire_date = expire_date
      if (plan_type !== undefined) updateData.plan_type = plan_type
      if (sold !== undefined) updateData.sold = sold

      const { data: updatedLicense, error } = await supabase
        .from('licenses')
        .update(updateData)
        .eq('id', licenseId)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ license: updatedLicense, message: 'License updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // POST: Desvincular dispositivo de licença do contrato
    if (req.method === 'POST' && action === 'unbind' && licenseId) {
      // Buscar a licença para verificar se pertence a um contrato
      const { data: license } = await supabase
        .from('licenses')
        .select('contract_id, device_type, device_id, contracts(email, representative_name)')
        .eq('id', licenseId)
        .single()

      if (!license || !license.contract_id) {
        return new Response(
          JSON.stringify({ error: 'License not found or not part of a contract' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Verificar acesso
      const adminOrManager = await isAdminOrManager(supabase, currentUserId)
      if (!adminOrManager) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', currentUserId)
          .single()

        if (license.contracts?.email !== currentUser?.email) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          )
        }
      }

      const { data: updatedLicense, error } = await supabase
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

      // Enviar email de notificacao de desvinculacao para o email do contrato
      if (license?.contracts?.email) {
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
          const deviceName = license.device_type || 'Dispositivo'
          const recipientName = license.contracts.representative_name || license.contracts.email

          await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              type: 'DEVICE_UNLINKED',
              to: license.contracts.email,
              data: {
                name: recipientName,
                deviceName: deviceName,
                unlinkedAt: new Date().toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            }),
          })
        } catch (emailError) {
          console.error('Error sending contract device unlinked email:', emailError)
          // Nao falhar por causa do email
        }
      }

      return new Response(
        JSON.stringify({ license: updatedLicense, message: 'Device unbound successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // DELETE: Deletar contrato
    if (req.method === 'DELETE' && contractId) {
      const admin = await isAdmin(supabase, currentUserId)
      if (!admin) {
        return new Response(
          JSON.stringify({ error: 'Only admins can delete contracts' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      // Primeiro deletar as licenças associadas
      await supabase
        .from('licenses')
        .delete()
        .eq('contract_id', contractId)

      // Depois deletar o contrato
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId)

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'Contract and associated licenses deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
