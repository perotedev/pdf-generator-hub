import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Gerar código de licença único no formato 99ABC-99ABC-99ABC-99ABC-99ABC
function generateLicenseCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = []
  for (let i = 0; i < 5; i++) {
    let segment = ''
    for (let j = 0; j < 5; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }
  return segments.join('-')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar autenticação
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

    console.log('Starting sync for user:', authUser.id)

    // Buscar dados do usuário no banco
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('id', authUser.id)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    let stripeCustomerId = userData.stripe_customer_id
    let syncedSubscriptions = 0
    let syncedPayments = 0
    let createdLicenses = 0

    // Se não tem stripe_customer_id, tentar encontrar pelo email
    if (!stripeCustomerId) {
      console.log('No stripe_customer_id found, searching by email:', userData.email)

      const customers = await stripe.customers.list({
        email: userData.email,
        limit: 1,
      })

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
        console.log('Found customer by email:', stripeCustomerId)

        // Atualizar o stripe_customer_id no banco
        await supabaseAdmin
          .from('users')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', authUser.id)
      }
    }

    if (!stripeCustomerId) {
      console.log('No Stripe customer found for user')
      return new Response(
        JSON.stringify({
          message: 'No Stripe customer found',
          synced: { subscriptions: 0, payments: 0, licenses: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('Syncing data for Stripe customer:', stripeCustomerId)

    // Buscar assinaturas do Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      expand: ['data.default_payment_method'],
    })

    console.log('Found', stripeSubscriptions.data.length, 'subscriptions in Stripe')

    // Processar cada assinatura
    for (const stripeSub of stripeSubscriptions.data) {
      console.log('Processing subscription:', stripeSub.id, 'status:', stripeSub.status)

      // Verificar se já existe no banco
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id, status')
        .eq('stripe_subscription_id', stripeSub.id)
        .single()

      // Mapear status do Stripe para status local
      const mapStatus = (stripeStatus: string): string => {
        switch (stripeStatus) {
          case 'active':
          case 'trialing':
            return 'ACTIVE'
          case 'canceled':
            return 'CANCELED'
          case 'past_due':
          case 'unpaid':
            return 'PAST_DUE'
          case 'incomplete':
            return 'PENDING_PAYMENT'
          case 'incomplete_expired':
          default:
            return 'EXPIRED'
        }
      }

      const localStatus = mapStatus(stripeSub.status)

      if (existingSub) {
        // Atualizar se o status mudou
        if (existingSub.status !== localStatus) {
          console.log('Updating subscription status:', existingSub.id, '->', localStatus)

          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: localStatus,
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: stripeSub.cancel_at_period_end,
              canceled_at: stripeSub.canceled_at
                ? new Date(stripeSub.canceled_at * 1000).toISOString()
                : null,
            })
            .eq('id', existingSub.id)

          syncedSubscriptions++
        }
      } else {
        // Assinatura não existe localmente - criar se tiver metadata válido
        const userId = stripeSub.metadata?.user_id
        const planId = stripeSub.metadata?.plan_id

        if (userId === authUser.id && planId) {
          console.log('Creating missing subscription:', stripeSub.id)

          // Verificar se o plano existe
          const { data: planData } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single()

          if (planData && localStatus === 'ACTIVE') {
            // Criar a assinatura
            const { data: newSub, error: subError } = await supabaseAdmin
              .from('subscriptions')
              .insert({
                user_id: authUser.id,
                plan_id: planId,
                stripe_subscription_id: stripeSub.id,
                stripe_customer_id: stripeCustomerId,
                status: localStatus,
                billing_cycle: planData.billing_cycle,
                current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
                current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
                cancel_at_period_end: stripeSub.cancel_at_period_end,
              })
              .select()
              .single()

            if (!subError && newSub) {
              syncedSubscriptions++

              // Verificar se já existe licença para esta assinatura
              const { data: existingLicense } = await supabaseAdmin
                .from('licenses')
                .select('id')
                .eq('subscription_id', newSub.id)
                .single()

              if (!existingLicense) {
                // Criar licença
                const licenseCode = generateLicenseCode()

                const { error: licenseError } = await supabaseAdmin
                  .from('licenses')
                  .insert({
                    code: licenseCode,
                    user_id: authUser.id,
                    subscription_id: newSub.id,
                    company: 'Capidoc',
                    is_standalone: false,
                    is_used: false,
                    sold: true,
                    expire_date: new Date(stripeSub.current_period_end * 1000).toISOString(),
                    plan_type: planData.billing_cycle,
                  })

                if (!licenseError) {
                  createdLicenses++
                  console.log('Created license:', licenseCode)
                }
              }
            }
          }
        }
      }

      // Verificar se existe licença para assinaturas existentes
      if (existingSub && localStatus === 'ACTIVE') {
        const { data: existingLicense } = await supabaseAdmin
          .from('licenses')
          .select('id')
          .eq('subscription_id', existingSub.id)
          .single()

        if (!existingLicense) {
          // Buscar dados do plano
          const { data: subWithPlan } = await supabaseAdmin
            .from('subscriptions')
            .select('*, plans(*)')
            .eq('id', existingSub.id)
            .single()

          if (subWithPlan && subWithPlan.plans) {
            const licenseCode = generateLicenseCode()

            const { error: licenseError } = await supabaseAdmin
              .from('licenses')
              .insert({
                code: licenseCode,
                user_id: authUser.id,
                subscription_id: existingSub.id,
                company: 'Capidoc',
                is_standalone: false,
                is_used: false,
                sold: true,
                expire_date: new Date(stripeSub.current_period_end * 1000).toISOString(),
                plan_type: subWithPlan.plans.billing_cycle,
              })

            if (!licenseError) {
              createdLicenses++
              console.log('Created missing license for existing subscription')
            }
          }
        }
      }
    }

    // Buscar pagamentos do Stripe (últimos 100)
    const stripeInvoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      status: 'paid',
      limit: 100,
    })

    console.log('Found', stripeInvoices.data.length, 'paid invoices in Stripe')

    // Processar cada invoice paga
    for (const invoice of stripeInvoices.data) {
      if (!invoice.subscription) continue

      // Verificar se já existe no banco
      const { data: existingPayment } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('stripe_invoice_id', invoice.id)
        .single()

      if (!existingPayment) {
        // Buscar a assinatura local
        const { data: localSub } = await supabaseAdmin
          .from('subscriptions')
          .select('id, plans(*)')
          .eq('stripe_subscription_id', invoice.subscription)
          .single()

        if (localSub) {
          console.log('Creating missing payment for invoice:', invoice.id)

          const { error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert({
              user_id: authUser.id,
              subscription_id: localSub.id,
              stripe_payment_intent_id: invoice.payment_intent as string,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid / 100,
              currency: (invoice.currency || 'brl').toUpperCase(),
              status: 'SUCCEEDED',
              payment_method: 'card',
              description: `Pagamento - ${localSub.plans?.name || 'Plano'}`,
              paid_at: invoice.status_transitions?.paid_at
                ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                : new Date().toISOString(),
            })

          if (!paymentError) {
            syncedPayments++
          }
        }
      }
    }

    console.log('Sync completed:', { syncedSubscriptions, syncedPayments, createdLicenses })

    return new Response(
      JSON.stringify({
        message: 'Sync completed successfully',
        synced: {
          subscriptions: syncedSubscriptions,
          payments: syncedPayments,
          licenses: createdLicenses,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
