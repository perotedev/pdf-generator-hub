import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Helper para enviar emails transacionais
async function sendTransactionalEmail(type: string, to: string, data: Record<string, any>) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping email')
    return
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const response = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ type, to, data }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error sending email:', error)
    } else {
      console.log(`Transactional email sent: ${type} to ${to}`)
    }
  } catch (error) {
    console.error('Error sending transactional email:', error)
  }
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const signature = req.headers.get('Stripe-Signature')
    const body = await req.text()

    let event

    try {
      // Usar constructEventAsync em vez de constructEvent para ambiente Deno
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Webhook signature verification failed:', errorMessage)
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${errorMessage}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Received Stripe event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(supabase, event.data.object)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object)
        break

      case 'invoice.paid':
        await handleInvoicePaid(supabase, event.data.object)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabase, event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaid(supabase, event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

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

// Helper para converter timestamp do Stripe para ISO string
function stripeTimestampToISO(timestamp: number | undefined | null): string {
  if (!timestamp || typeof timestamp !== 'number') {
    return new Date().toISOString()
  }
  return new Date(timestamp * 1000).toISOString()
}

// Quando uma nova subscription é criada no Stripe
async function handleSubscriptionCreated(supabase, subscription) {
  console.log('Processing customer.subscription.created:', subscription.id)
  console.log('Subscription metadata:', JSON.stringify(subscription.metadata))
  console.log('Subscription status:', subscription.status)
  console.log('Subscription current_period_start:', subscription.current_period_start)
  console.log('Subscription current_period_end:', subscription.current_period_end)

  const userId = subscription.metadata?.user_id
  const planId = subscription.metadata?.plan_id
  const customerId = subscription.customer

  if (!userId || !planId) {
    console.error('Missing metadata in subscription:', { userId, planId })
    console.log('Full subscription object metadata:', JSON.stringify(subscription.metadata))
    return
  }

  // Verificar se já existe uma subscription para este stripe_subscription_id
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (existingSub) {
    console.log('Subscription already exists:', existingSub.id)
    return
  }

  // Buscar dados do plano
  const { data: planData, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (planError || !planData) {
    console.error('Plan not found:', planId, planError)
    return
  }

  console.log('Plan data:', planData.name, planData.billing_cycle)

  // Obter timestamps - podem estar no objeto principal ou nos items
  const periodStart = subscription.current_period_start ||
    subscription.items?.data?.[0]?.current_period_start ||
    subscription.start_date ||
    Math.floor(Date.now() / 1000)

  const periodEnd = subscription.current_period_end ||
    subscription.items?.data?.[0]?.current_period_end ||
    (periodStart + (planData.billing_cycle === 'YEARLY' ? 31536000 : 2592000)) // 1 ano ou 30 dias

  console.log('Period start:', periodStart, '-> ', stripeTimestampToISO(periodStart))
  console.log('Period end:', periodEnd, '-> ', stripeTimestampToISO(periodEnd))

  // Mapear status do Stripe para status válido no banco
  // Valores válidos: ACTIVE, CANCELED, EXPIRED, PAST_DUE, PENDING_PAYMENT
  const mapStripeStatus = (stripeStatus: string): string => {
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
        // Status incomplete = pagamento pendente (ex: boleto aguardando)
        // Não liberamos a licença até o pagamento ser confirmado
        return 'PENDING_PAYMENT'
      case 'incomplete_expired':
      default:
        return 'EXPIRED'
    }
  }

  const mappedStatus = mapStripeStatus(subscription.status)
  const isPendingPayment = subscription.status === 'incomplete'

  console.log('Mapped status:', mappedStatus, 'isPendingPayment:', isPendingPayment)

  // Criar a subscription no banco
  const { data: newSubscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: mappedStatus,
      billing_cycle: planData.billing_cycle,
      current_period_start: stripeTimestampToISO(periodStart),
      current_period_end: stripeTimestampToISO(periodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
    })
    .select()
    .single()

  if (subError) {
    console.error('Error creating subscription:', JSON.stringify(subError))
    throw new Error(`Failed to create subscription: ${JSON.stringify(subError)}`)
  }

  console.log('Subscription created:', newSubscription.id)

  // IMPORTANTE: Só criar licença se o pagamento já foi confirmado (status 'active')
  // Para boletos, o status será 'incomplete' e a licença será criada quando o invoice.paid chegar
  if (isPendingPayment) {
    console.log('Payment pending (boleto/pix), license will be created when payment is confirmed')
  } else {
    // Verificar se já existe licença para esta assinatura antes de criar
    const { data: existingLicense } = await supabase
      .from('licenses')
      .select('id')
      .eq('subscription_id', newSubscription.id)
      .maybeSingle()

    if (!existingLicense) {
      // Criar a licença
      const licenseCode = generateLicenseCode()
      console.log('Creating license with data:', JSON.stringify({
        code: licenseCode,
        user_id: userId,
        subscription_id: newSubscription.id,
        company: 'Capidoc',
        is_standalone: false,
        is_used: false,
        sold: true,
        expire_date: stripeTimestampToISO(periodEnd),
        plan_type: planData.billing_cycle,
      }))

      const { data: newLicense, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          code: licenseCode,
          user_id: userId,
          subscription_id: newSubscription.id,
          company: 'Capidoc',
          is_standalone: false,
          is_used: false,
          sold: true,
          expire_date: stripeTimestampToISO(periodEnd),
          plan_type: planData.billing_cycle,
        })
        .select()
        .single()

      if (licenseError) {
        console.error('Error creating license:', JSON.stringify(licenseError))
      } else {
        console.log('License created:', newLicense.id, newLicense.code)
      }
    } else {
      console.log('License already exists for subscription:', existingLicense.id)
    }
  }

  // Atualizar o usuário com o stripe_customer_id se não tiver
  await supabase
    .from('users')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId)
    .is('stripe_customer_id', null)

  console.log('Subscription created successfully')
}

// Quando uma subscription é atualizada
async function handleSubscriptionUpdated(supabase, subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id)
  console.log('Subscription status:', subscription.status)

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (!existingSub) {
    console.log('Subscription not found in database:', subscription.id)
    return
  }

  console.log('Existing subscription status:', existingSub.status)

  // Mapear status do Stripe para status local
  const mapStripeStatus = (stripeStatus: string): string => {
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

  const status = mapStripeStatus(subscription.status)
  const wasPaymentPending = existingSub.status === 'PENDING_PAYMENT'
  const isNowActive = status === 'ACTIVE'

  // Obter timestamps com fallback
  const periodStart = subscription.current_period_start ||
    subscription.items?.data?.[0]?.current_period_start ||
    subscription.start_date

  const periodEnd = subscription.current_period_end ||
    subscription.items?.data?.[0]?.current_period_end

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status,
      current_period_start: periodStart ? stripeTimestampToISO(periodStart) : existingSub.current_period_start,
      current_period_end: periodEnd ? stripeTimestampToISO(periodEnd) : existingSub.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at ? stripeTimestampToISO(subscription.canceled_at) : null
    })
    .eq('id', existingSub.id)

  if (updateError) {
    console.error('Error updating subscription:', updateError)
  } else {
    console.log('Subscription updated:', existingSub.id, 'status:', status)
  }

  // Se a assinatura mudou de PENDING_PAYMENT para ACTIVE (boleto pago),
  // verificar se a licença já existe, senão criar
  if (wasPaymentPending && isNowActive) {
    console.log('Subscription changed from PENDING_PAYMENT to ACTIVE, checking license...')

    const { data: existingLicense } = await supabase
      .from('licenses')
      .select('id')
      .eq('subscription_id', existingSub.id)
      .maybeSingle()

    if (!existingLicense) {
      console.log('No license found, creating license for confirmed boleto payment')

      const licenseCode = generateLicenseCode()
      const expireDate = periodEnd ? stripeTimestampToISO(periodEnd) : existingSub.current_period_end

      const { data: newLicense, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          code: licenseCode,
          user_id: existingSub.user_id,
          subscription_id: existingSub.id,
          company: 'Capidoc',
          is_standalone: false,
          is_used: false,
          sold: true,
          expire_date: expireDate,
          plan_type: existingSub.billing_cycle,
        })
        .select()
        .single()

      if (licenseError) {
        console.error('Error creating license:', JSON.stringify(licenseError))
      } else {
        console.log('License created for boleto payment:', newLicense.id, newLicense.code)
      }
    } else {
      console.log('License already exists:', existingLicense.id)
    }
  }

  // Atualizar data de expiração da licença se status é ACTIVE
  if (status === 'ACTIVE') {
    await supabase
      .from('licenses')
      .update({
        expire_date: periodEnd ? stripeTimestampToISO(periodEnd) : existingSub.current_period_end,
      })
      .eq('subscription_id', existingSub.id)
  }
}

// Quando uma subscription é deletada/cancelada
async function handleSubscriptionDeleted(supabase, subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id)

  // Buscar subscription e dados do usuário antes de atualizar
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('*, users(name, email)')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'CANCELED',
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription to canceled:', error)
  }

  if (existingSub) {
    // Marcar licença como expirada (a tabela licenses não tem campo status, apenas expire_date)
    await supabase
      .from('licenses')
      .update({
        expire_date: new Date().toISOString(),
      })
      .eq('subscription_id', existingSub.id)

    // Enviar email de cancelamento
    if (existingSub.users?.email) {
      try {
        const formatDate = (dateString: string) => {
          return new Date(dateString).toLocaleDateString('pt-BR')
        }

        await sendTransactionalEmail('SUBSCRIPTION_CANCELED', existingSub.users.email, {
          name: existingSub.users.name,
          expirationDate: formatDate(existingSub.current_period_end),
          dashboardUrl: 'https://perotedev.com/dashboard/assinaturas',
        })
      } catch (emailError) {
        console.error('Error sending cancellation email:', emailError)
      }
    }
  }

  console.log('Subscription deleted:', subscription.id)
}

// Quando uma invoice é paga (inclui primeiro pagamento e renovações)
async function handleInvoicePaid(supabase, invoice) {
  console.log('Processing invoice.paid:', invoice.id)
  console.log('Invoice subscription:', invoice.subscription)
  console.log('Invoice amount_paid:', invoice.amount_paid)

  // Tentar obter subscription_id de diferentes locais possíveis
  const subscriptionId = invoice.subscription ||
    invoice.subscription_id ||
    invoice.lines?.data?.[0]?.subscription ||
    invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription

  console.log('Resolved subscription ID:', subscriptionId)

  if (!subscriptionId) {
    console.log('Invoice has no subscription, skipping')
    return
  }

  // Buscar a subscription no banco - tentar algumas vezes pois pode chegar antes do customer.subscription.created
  let subscription = null
  let attempts = 0
  const maxAttempts = 3

  while (!subscription && attempts < maxAttempts) {
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()

    if (subData) {
      subscription = subData
      break
    }

    attempts++
    if (attempts < maxAttempts) {
      console.log(`Subscription not found, attempt ${attempts}/${maxAttempts}, waiting 2 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  if (!subscription) {
    console.error('Subscription not found for invoice after retries:', subscriptionId)
    throw new Error(`Subscription not found for invoice: ${subscriptionId}`)
  }

  console.log('Found subscription:', subscription.id, 'user_id:', subscription.user_id)

  // Verificar se já existe um pagamento com este invoice_id
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_invoice_id', invoice.id)
    .maybeSingle()

  if (existingPayment) {
    console.log('Payment already exists for invoice:', invoice.id)
    return
  }

  // Determinar se é primeiro pagamento ou renovação
  const isFirstPayment = invoice.billing_reason === 'subscription_create'
  const description = isFirstPayment
    ? `Pagamento inicial - ${subscription.plans?.name || 'Plano'} (${subscription.billing_cycle === 'MONTHLY' ? 'Mensal' : 'Anual'})`
    : `Renovação - ${subscription.plans?.name || 'Plano'} (${subscription.billing_cycle === 'MONTHLY' ? 'Mensal' : 'Anual'})`

  // Extrair método de pagamento detalhado
  let paymentMethod = 'card' // default
  const chargePaymentMethodType = invoice.charge?.payment_method_details?.type
  if (chargePaymentMethodType) {
    paymentMethod = chargePaymentMethodType
  }

  const paymentIntentMethodType = invoice.payment_intent?.payment_method?.type ||
    invoice.payment_intent?.payment_method_types?.[0]
  if (paymentIntentMethodType) {
    paymentMethod = paymentIntentMethodType
  }

  if (invoice.collection_method === 'send_invoice') {
    paymentMethod = 'boleto'
  }

  console.log('Payment method detected:', paymentMethod)

  // Criar o registro de pagamento
  const { data: newPayment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_payment_intent_id: invoice.payment_intent,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: (invoice.currency || 'brl').toUpperCase(),
      status: 'SUCCEEDED',
      payment_method: paymentMethod,
      description: description,
      paid_at: invoice.status_transitions?.paid_at
        ? stripeTimestampToISO(invoice.status_transitions.paid_at)
        : new Date().toISOString()
    })
    .select()
    .single()

  if (paymentError) {
    if (paymentError.code === '23505') {
      console.log('Payment already exists (duplicate), skipping:', invoice.id)
    } else {
      console.error('Error creating payment:', JSON.stringify(paymentError))
      throw new Error(`Failed to create payment: ${JSON.stringify(paymentError)}`)
    }
  } else {
    console.log('Payment created:', newPayment.id, 'Amount:', invoice.amount_paid / 100)
  }

  // Atualizar subscription para ACTIVE se necessário (ex: boleto pago)
  if (subscription.status !== 'ACTIVE') {
    console.log('Updating subscription status to ACTIVE')
    await supabase
      .from('subscriptions')
      .update({ status: 'ACTIVE' })
      .eq('id', subscription.id)
  }

  // Verificar se existe licença para esta assinatura
  // Se não existir, criar (caso de boleto onde a licença não foi criada na subscription.created)
  const { data: existingLicense } = await supabase
    .from('licenses')
    .select('id')
    .eq('subscription_id', subscription.id)
    .maybeSingle()

  if (!existingLicense) {
    console.log('No license found for subscription, creating license (payment confirmed)')

    // Obter dados atualizados da subscription
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('id', subscription.id)
      .single()

    if (subData) {
      const licenseCode = generateLicenseCode()
      console.log('Creating license for payment:', licenseCode)

      const { data: newLicense, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          code: licenseCode,
          user_id: subData.user_id,
          subscription_id: subData.id,
          company: 'Capidoc',
          is_standalone: false,
          is_used: false,
          sold: true,
          expire_date: subData.current_period_end,
          plan_type: subData.billing_cycle,
        })
        .select()
        .single()

      if (licenseError) {
        console.error('Error creating license for payment:', JSON.stringify(licenseError))
      } else {
        console.log('License created for payment:', newLicense.id, newLicense.code)
      }
    }
  } else {
    console.log('License already exists for subscription:', existingLicense.id)
  }

  // Enviar email de confirmação de compra (apenas para primeiro pagamento)
  if (isFirstPayment) {
    try {
      // Buscar dados do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', subscription.user_id)
        .single()

      // Buscar licença para incluir no email
      const { data: licenseData } = await supabase
        .from('licenses')
        .select('code')
        .eq('subscription_id', subscription.id)
        .maybeSingle()

      if (userData) {
        const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(amount)
        }

        const formatDate = (dateString: string) => {
          return new Date(dateString).toLocaleDateString('pt-BR')
        }

        await sendTransactionalEmail('PURCHASE_CONFIRMATION', userData.email, {
          name: userData.name,
          planName: subscription.plans?.name || 'Capidoc',
          amount: formatCurrency(invoice.amount_paid / 100),
          billingCycle: subscription.billing_cycle,
          nextPaymentDate: formatDate(subscription.current_period_end),
          licenseCode: licenseData?.code || null,
          dashboardUrl: 'https://perotedev.com/dashboard',
        })
      }
    } catch (emailError) {
      console.error('Error sending purchase confirmation email:', emailError)
    }
  }

  console.log('Invoice paid processed successfully')
}

// Quando o pagamento de uma invoice falha
async function handleInvoicePaymentFailed(supabase, invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id)

  if (!invoice.subscription) {
    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'PAST_DUE' })
    .eq('stripe_subscription_id', invoice.subscription)

  if (error) {
    console.error('Error updating subscription to past_due:', error)
  }

  console.log('Subscription marked as PAST_DUE')
}
