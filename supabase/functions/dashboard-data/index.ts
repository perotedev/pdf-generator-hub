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

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const userId = url.searchParams.get('userId') || authUser.id

    // GET: Buscar dados do dashboard
    if (req.method === 'GET') {
      switch (action) {
        case 'subscription': {
          // Buscar assinatura ativa do usuário
          const { data, error } = await supabaseAdmin
            .from('subscriptions')
            .select('*, plans(*)')
            .eq('user_id', userId)
            .eq('status', 'ACTIVE')
            .single()

          if (error && error.code !== 'PGRST116') throw error

          return new Response(
            JSON.stringify({ subscription: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        case 'subscriptions': {
          // Buscar todas as assinaturas do usuário
          const { data, error } = await supabaseAdmin
            .from('subscriptions')
            .select('*, plans(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (error) throw error

          return new Response(
            JSON.stringify({ subscriptions: data || [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        case 'licenses': {
          // Buscar licenças do usuário (não standalone)
          const standalone = url.searchParams.get('standalone') === 'true'

          let query = supabaseAdmin
            .from('licenses')
            .select('*')

          if (standalone) {
            query = query.eq('is_standalone', true)
          } else {
            query = query.eq('user_id', userId)
          }

          const { data, error } = await query.order('created_at', { ascending: false })

          if (error) throw error

          return new Response(
            JSON.stringify({ licenses: data || [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        case 'license-by-subscription': {
          const subscriptionId = url.searchParams.get('subscriptionId')

          if (!subscriptionId) {
            return new Response(
              JSON.stringify({ error: 'Subscription ID required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          const { data, error } = await supabaseAdmin
            .from('licenses')
            .select('*')
            .eq('subscription_id', subscriptionId)
            .single()

          if (error && error.code !== 'PGRST116') throw error

          return new Response(
            JSON.stringify({ license: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        case 'payments': {
          const limit = parseInt(url.searchParams.get('limit') || '0')

          let query = supabaseAdmin
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (limit > 0) {
            query = query.limit(limit)
          }

          const { data, error } = await query

          if (error) throw error

          return new Response(
            JSON.stringify({ payments: data || [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        case 'user-details': {
          // Buscar detalhes completos de um usuário (para admin)
          const targetUserId = url.searchParams.get('targetUserId')

          if (!targetUserId) {
            return new Response(
              JSON.stringify({ error: 'Target user ID required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          const [subsData, licensesData, paymentsData] = await Promise.all([
            supabaseAdmin
              .from('subscriptions')
              .select('*, plans(*)')
              .eq('user_id', targetUserId),
            supabaseAdmin
              .from('licenses')
              .select('*')
              .eq('user_id', targetUserId)
              .eq('is_standalone', false),
            supabaseAdmin
              .from('payments')
              .select('*')
              .eq('user_id', targetUserId)
              .order('created_at', { ascending: false })
          ])

          return new Response(
            JSON.stringify({
              subscriptions: subsData.data || [],
              licenses: licensesData.data || [],
              payments: paymentsData.data || [],
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
      }
    }

    // PUT: Atualizar dados
    if (req.method === 'PUT') {
      const body = await req.json()

      switch (action) {
        case 'subscription-cancel-renewal': {
          const subscriptionId = url.searchParams.get('subscriptionId')

          if (!subscriptionId) {
            return new Response(
              JSON.stringify({ error: 'Subscription ID required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          const { data, error } = await supabaseAdmin
            .from('subscriptions')
            .update({ cancel_at_period_end: true })
            .eq('id', subscriptionId)
            .eq('user_id', authUser.id)
            .select()
            .single()

          if (error) throw error

          return new Response(
            JSON.stringify({ subscription: data, message: 'Renewal cancelled' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        case 'license-deactivate': {
          const licenseId = url.searchParams.get('licenseId')

          if (!licenseId) {
            return new Response(
              JSON.stringify({ error: 'License ID required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          // Buscar licença e dados do dispositivo antes de desativar
          const { data: existingLicense } = await supabaseAdmin
            .from('licenses')
            .select('*, users(name, email)')
            .eq('id', licenseId)
            .single()

          const deviceName = existingLicense?.device_type || 'Dispositivo'
          const deviceId = existingLicense?.device_id

          const { data, error } = await supabaseAdmin
            .from('licenses')
            .update({
              is_used: false,
              device_id: null,
              device_type: null,
              activated_at: null,
            })
            .eq('id', licenseId)
            .select()
            .single()

          if (error) throw error

          // Enviar email de notificação de desvinculação
          if (existingLicense?.users?.email && deviceId) {
            try {
              const supabaseUrl = Deno.env.get('SUPABASE_URL')
              const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

              await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  type: 'DEVICE_UNLINKED',
                  to: existingLicense.users.email,
                  data: {
                    name: existingLicense.users.name,
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
              console.error('Error sending device unlinked email:', emailError)
              // Não falhar por causa do email
            }
          }

          return new Response(
            JSON.stringify({ license: data, message: 'License deactivated' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        case 'license-nickname': {
          const licenseId = url.searchParams.get('licenseId')
          const { nickname } = body

          if (!licenseId) {
            return new Response(
              JSON.stringify({ error: 'License ID required' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          const { data, error } = await supabaseAdmin
            .from('licenses')
            .update({ client: nickname })
            .eq('id', licenseId)
            .select()
            .single()

          if (error) throw error

          return new Response(
            JSON.stringify({ license: data, message: 'Nickname updated' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
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
