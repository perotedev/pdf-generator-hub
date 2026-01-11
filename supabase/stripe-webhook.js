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
