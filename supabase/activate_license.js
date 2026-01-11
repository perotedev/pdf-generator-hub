import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { code, type, device_id } = await req.json()

    if (!code || !type || !device_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: code, type, device_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const licenseCode = code.trim().toUpperCase()
    const deviceId = device_id.trim()
    const deviceType = type.trim().toLowerCase()

    // 1. Validate license code format (5 groups of 5 characters, separated by hyphens)
    const parts = licenseCode.split('-')
    const isValidFormat = parts.length === 5 && parts.every(part => part.length === 5 && /^[a-z0-9]+$/i.test(part))
    
    if (!isValidFormat) {
      return new Response(
        JSON.stringify({ error: 'Invalid license code format.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. Find the license in the database
    const { data: licenseDoc, error: fetchError } = await supabaseClient
      .from('licenses')
      .select('*')
      .eq('code', licenseCode)
      .single()

    if (fetchError || !licenseDoc) {
      // License code not found
      return new Response(
        JSON.stringify({ error: 'License provided is invalid or not found.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // 3. Check if the license is sold and avaliable to use
    if (!licenseDoc.sold) {
      return new Response(
        JSON.stringify({ error: 'License is not avaliable.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // 4. Check if the license is already used
    if (licenseDoc.is_used) {
      return new Response(
        JSON.stringify({ error: 'License is already bound to another device.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // 5. Verify Expiration Date
    let expireDate = licenseDoc.expire_date ? new Date(licenseDoc.expire_date) : null
    const now = new Date()

    if (expireDate) {
      if (expireDate.getTime() < now.getTime()) {
        return new Response(
          JSON.stringify({ error: 'License is already expired.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    } else {
      const LICENSE_DURATION_DAYS = 183
      const newExpireDate = new Date()
      newExpireDate.setDate(newExpireDate.getDate() + LICENSE_DURATION_DAYS)
      expireDate = newExpireDate
    }

    // 6. Activate the license
    const { data: updatedDoc, error: updateError } = await supabaseClient
      .from('licenses')
      .update({
        is_used: true,
        device_id: deviceId,
        device_type: deviceType,
        expire_date: expireDate,
        activated_at: new Date().toISOString()
      })
      .eq('code', licenseCode)
      .eq('is_used', false)
      .select()
      .single()

    if (updateError || !updatedDoc) {
      return new Response(
        JSON.stringify({ error: 'Failed to update license status. License may have been activated concurrently.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        code: licenseCode,
        type: deviceType,
        valid: true,
        expire_date: Math.floor(expireDate.getTime() / 1000),
        device_id: deviceId,
        company: updatedDoc.company
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
