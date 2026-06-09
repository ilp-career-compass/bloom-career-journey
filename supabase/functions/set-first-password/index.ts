/// <reference path="../global.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN')
  const base = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
  if (!allowedOrigin) return { ...base, 'Access-Control-Allow-Origin': '*' }
  const origin = req.headers.get('Origin') ?? ''
  return { ...base, 'Access-Control-Allow-Origin': origin === allowedOrigin ? origin : allowedOrigin, 'Vary': 'Origin' }
}

function isValidE164(phone: string): boolean {
  return /^\+\d{10,15}$/.test(phone)
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
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

    // G18: Enforce minimum password length server-side (client validation alone is bypassable)
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!isValidE164(mobile)) {
      return new Response(
        JSON.stringify({ error: 'Invalid mobile format — expected E.164 like +91XXXXXXXXXX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Look up the user BEFORE consuming the OTP — the role check below must not burn a teacher's
    // OTP session as a side effect of returning 403.
    // Normalise mobile lookup to handle format variants (+91XXXXXXXXXX, XXXXXXXXXX, 91XXXXXXXXXX)
    const bareMobile = (mobile || '').replace(/\D/g, '').slice(-10)
    const searchNumbers = [
      mobile,
      bareMobile,
      `+91${bareMobile}`,
      `91${bareMobile}`
    ].filter((val, index, self) => val && self.indexOf(val) === index)

    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .in('mobile', searchNumbers)
      .maybeSingle()


    // G20: maybeSingle() returns PGRST116 when multiple rows match — surface a clear 409.
    // Any other userError is a genuine DB/RLS failure — return 500, not 404.
    if (userError) {
      const isDuplicate = (userError as { code?: string }).code === 'PGRST116'
      if (!isDuplicate) {
        console.error('[set-first-password] users lookup error:', JSON.stringify(userError))
      }
      return new Response(
        JSON.stringify({ error: isDuplicate
          ? 'Multiple accounts found for this number — please contact support'
          : 'Account lookup failed — please try again' }),
        { status: isDuplicate ? 409 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (!userRow) {
      return new Response(
        JSON.stringify({ error: 'No account found for this mobile number' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // G19: First Login is only for students — check BEFORE OTP so a teacher calling this endpoint
    // does not have their OTP consumed before getting the 403.
    if (userRow.role !== 'student') {
      return new Response(
        JSON.stringify({ error: 'This flow is only available for student accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // G25: skip OTP verification in dev/staging when MSG91_AUTH_KEY is not configured —
    // matches the bypass behaviour of create-teacher and create-student-self-register.
    let msg91AuthKey = Deno.env.get('MSG91_AUTH_KEY')
    if (msg91AuthKey) {
      msg91AuthKey = msg91AuthKey.trim().replace(/^["']|["']$/g, '')
    }
    if (msg91AuthKey) {
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

      // Cross-check the verified mobile against the one the caller supplied.
      // verify-msg91-token guarantees a non-empty mobile on success (G23), so this check is always active.
      // Use last-10-digits normalization to handle format variants (91XXXXXXXXXX, +91XXXXXXXXXX, XXXXXXXXXX).
      const normalize = (m: string) => (m || '').replace(/\D/g, '').slice(-10)
      if (normalize(verifyData.mobile) !== normalize(mobile)) {
        return new Response(
          JSON.stringify({ error: 'Mobile number does not match OTP verification' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
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

    // G26: Sync the new password to student_auth_credentials if a record exists
    try {
      await supabaseAdmin
        .from('student_auth_credentials')
        .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
        .eq('user_id', userRow.id)
    } catch (dbErr) {
      console.warn('[set-first-password] Failed to sync password to student_auth_credentials:', dbErr)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[set-first-password] outer catch:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
