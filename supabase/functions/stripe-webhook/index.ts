import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
      )
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, stripe, event.data.object)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(supabase, event.data.object)
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

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase, event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function handleCheckoutSessionCompleted(supabase, stripe, session) {
  console.log('Processing checkout.session.completed:', session.id)

  // Verificar se é uma sessão de subscription
  if (session.mode !== 'subscription') {
    console.log('Session is not a subscription, skipping')
    return
  }

  const userId = session.metadata?.user_id
  const planId = session.metadata?.plan_id
  const subscriptionId = session.subscription
  const customerId = session.customer

  if (!userId || !planId || !subscriptionId) {
    console.error('Missing metadata in checkout session:', { userId, planId, subscriptionId })
    return
  }

  console.log('Checkout metadata:', { userId, planId, subscriptionId, customerId })

  // Buscar detalhes da subscription no Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  console.log('Stripe subscription:', stripeSubscription.id, stripeSubscription.status)

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

  // Verificar se já existe uma subscription para este stripe_subscription_id
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (existingSub) {
    console.log('Subscription already exists:', existingSub.id)
    return
  }

  // Criar a subscription no banco
  const { data: newSubscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      status: 'ACTIVE',
      billing_cycle: planData.billing_cycle,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: false,
    })
    .select()
    .single()

  if (subError) {
    console.error('Error creating subscription:', subError)
    return
  }

  console.log('Subscription created:', newSubscription.id)

  // Gerar código de licença único
  const generateLicenseCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const segments = []
    for (let i = 0; i < 4; i++) {
      let segment = ''
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      segments.push(segment)
    }
    return segments.join('-')
  }

  // Criar a licença
  const { data: newLicense, error: licenseError } = await supabase
    .from('licenses')
    .insert({
      user_id: userId,
      subscription_id: newSubscription.id,
      license_key: generateLicenseCode(),
      status: 'ACTIVE',
      is_active: true,
      activated_at: new Date().toISOString(),
      expires_at: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    })
    .select()
    .single()

  if (licenseError) {
    console.error('Error creating license:', licenseError)
  } else {
    console.log('License created:', newLicense.id, newLicense.license_key)
  }

  // Criar o registro de pagamento
  const amountPaid = session.amount_total / 100 // Stripe usa centavos
  const { data: newPayment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      subscription_id: newSubscription.id,
      stripe_payment_intent_id: session.payment_intent,
      amount: amountPaid,
      currency: (session.currency || 'brl').toUpperCase(),
      status: 'SUCCEEDED',
      payment_method: 'stripe',
      description: `Pagamento inicial - ${planData.name} (${planData.billing_cycle === 'MONTHLY' ? 'Mensal' : 'Anual'})`,
      paid_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (paymentError) {
    console.error('Error creating payment:', paymentError)
  } else {
    console.log('Payment created:', newPayment.id, 'Amount:', amountPaid)
  }

  // Atualizar o usuário com o stripe_customer_id se não tiver
  await supabase
    .from('users')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId)
    .is('stripe_customer_id', null)

  console.log('Checkout session completed successfully')
}

async function handleSubscriptionUpdate(supabase, subscription) {
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  const status = subscription.status === 'active' ? 'ACTIVE' :
                 subscription.status === 'canceled' ? 'CANCELED' :
                 subscription.status === 'past_due' ? 'PAST_DUE' : 'EXPIRED'

  const subData = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
  }

  if (existingSub) {
    await supabase
      .from('subscriptions')
      .update(subData)
      .eq('id', existingSub.id)
  }
}

async function handleSubscriptionDeleted(supabase, subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'CANCELED',
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleInvoicePaid(supabase, invoice) {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', invoice.subscription)
    .single()

  if (subscription) {
    await supabase
      .from('payments')
      .insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        stripe_payment_intent_id: invoice.payment_intent,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'SUCCEEDED',
        payment_method: 'stripe',
        description: `Payment for subscription ${subscription.id}`,
        paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      })
  }
}

async function handleInvoicePaymentFailed(supabase, invoice) {
  await supabase
    .from('subscriptions')
    .update({ status: 'PAST_DUE' })
    .eq('stripe_subscription_id', invoice.subscription)
}

async function handlePaymentSucceeded(supabase, paymentIntent) {
  await supabase
    .from('payments')
    .update({
      status: 'SUCCEEDED',
      paid_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
}
