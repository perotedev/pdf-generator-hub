import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { code, device_id } = await req.json()

    if (!code || !device_id) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          message: "Missing required fields: code, device_id",
          expiration_date: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    const licenseCode = code.trim().toUpperCase()
    const deviceId = device_id.trim()

    // validar formato XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
    const parts = licenseCode.split("-")
    const isValidFormat = parts.length === 5 && parts.every(
      p => p.length === 5 && /^[a-z0-9]+$/i.test(p)
    )

    if (!isValidFormat) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          message: "Invalid license code format.",
          expiration_date: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // buscar licença
    const { data: license, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("code", licenseCode)
      .single()

    if (error || !license) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          message: "License not found.",
          expiration_date: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      )
    }

    // precisa estar vendida
    if (!license.sold) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          message: "License must be avaliable to use.",
          expiration_date: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      )
    }

    // precisa estar ativa
    if (!license.is_used) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          message: "License has not been activated yet.",
          expiration_date: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      )
    }

    // precisa pertencer ao mesmo device
    if (license.device_id !== deviceId) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          message: "License does not belong to this device.",
          expiration_date: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      )
    }

    // verificar expiração
    const now = new Date()
    const expireDate = license.expire_date
      ? new Date(license.expire_date)
      : null

    if (!expireDate) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          message: "License does not have an expiration date set.",
          expiration_date: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    }

    if (expireDate.getTime() < now.getTime()) {
      return new Response(
        JSON.stringify({
          is_valid: false,
          message: "License has expired.",
          expiration_date: Math.floor(expireDate.getTime() / 1000)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    // tudo ok
    return new Response(
      JSON.stringify({
        is_valid: true,
        message: "License is valid.",
        expiration_date: Math.floor(expireDate.getTime() / 1000)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )

  } catch (e) {
    return new Response(
      JSON.stringify({
        is_valid: false,
        message: e.message ?? "Unexpected error",
        expiration_date: null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
