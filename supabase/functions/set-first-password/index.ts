import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function isValidE164(phone: string): boolean {
  return /^\+\d{10,15}$/.test(phone)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing server configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json()
    const { mobile, newPassword, access_token } = body

    if (!mobile || !newPassword || !access_token) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: mobile, newPassword, access_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!isValidE164(mobile)) {
      return new Response(
        JSON.stringify({ error: 'Invalid mobile format — expected E.164 like +91XXXXXXXXXX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Verify the MSG91 access token via our verify-msg91-token Edge Function
    const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-msg91-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ access_token }),
    })

    const verifyData = await verifyResponse.json()

    if (!verifyData?.success) {
      return new Response(
        JSON.stringify({ error: 'OTP verification failed — please verify your mobile number again' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Confirm the verified mobile matches the one the student entered.
    // MSG91 may return without the '+'; normalise before comparing.
    const rawVerified: string = verifyData.mobile ?? ''
    const normalizedVerified = rawVerified.startsWith('+') ? rawVerified : `+${rawVerified}`
    if (normalizedVerified !== mobile) {
      return new Response(
        JSON.stringify({ error: 'Mobile number does not match OTP verification' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Look up the user in public.users by mobile (stored as E.164)
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('mobile', mobile)
      .maybeSingle()

    if (userError || !userRow) {
      return new Response(
        JSON.stringify({ error: 'No account found for this mobile number' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Set the student's chosen password via Supabase Auth admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userRow.id, {
      password: newPassword,
    })

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message || 'Failed to set password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
