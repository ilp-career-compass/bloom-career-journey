import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN')
  const base = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
  if (!allowedOrigin) return { ...base, 'Access-Control-Allow-Origin': '*' }
  const origin = req.headers.get('Origin') ?? ''
  return { ...base, 'Access-Control-Allow-Origin': origin === allowedOrigin ? origin : allowedOrigin, 'Vary': 'Origin' }
}

interface RequestBody {
  fullName: string
  phone: string
  password: string
  stateId: string
  preferredLanguage: string
  accessToken: string
}

function isValidE164(phone: string): boolean {
  return /^\+\d{10,15}$/.test(phone)
}

Deno.serve(async (req) => {
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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body: RequestBody = await req.json()
    const { fullName, phone, password, stateId, preferredLanguage, accessToken } = body

    if (!fullName || !phone || !password || !stateId) {
      return new Response(
        JSON.stringify({ error: 'fullName, phone, password, and stateId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 1. Validate MSG91 OTP token server-side (enforced when MSG91_AUTH_KEY is configured)
    const msg91AuthKey = Deno.env.get('MSG91_AUTH_KEY')
    if (msg91AuthKey) {
      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: 'OTP verification is required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      const verifyRes = await fetch(`${supabaseUrl}/functions/v1/verify-msg91-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}` },
        body: JSON.stringify({ access_token: accessToken }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyData.success) {
        return new Response(
          JSON.stringify({ error: 'OTP verification failed. Please verify your mobile number.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      // Only cross-check mobile if MSG91 returned one — if empty, token validity alone is sufficient
      const normalize = (m: string) => (m || '').replace(/\D/g, '').slice(-10)
      if (verifyData.mobile && normalize(verifyData.mobile) !== normalize(phone)) {
        return new Response(
          JSON.stringify({ error: 'OTP was verified for a different mobile number.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    // 2. Validate phone format
    if (!isValidE164(phone)) {
      return new Response(
        JSON.stringify({ error: `Invalid phone format: ${phone}. Expected E.164 format like +91XXXXXXXXXX` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 3. Check for duplicate phone in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('mobile', phone)
      .maybeSingle()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Phone number already registered' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 3. Create Supabase Auth user with phone + teacher's chosen password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone,
      password,
      phone_confirm: true,
      user_metadata: { full_name: fullName, role: 'teacher' },
    })

    if (authError || !authData.user) {
      console.error('[create-teacher] auth.admin.createUser failed:', JSON.stringify(authError))
      return new Response(
        JSON.stringify({ error: authError?.message || 'Failed to create auth account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const authUserId = authData.user.id

    try {
      // 4. Insert into public.users
      const VALID_LANGUAGES = ['en', 'kn', 'ta', 'hi']
      const lang = VALID_LANGUAGES.includes(preferredLanguage) ? preferredLanguage : 'en'
      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: authUserId,
        full_name: fullName,
        mobile: phone,
        role: 'teacher',
        state_id: stateId,
        preferred_language: lang,
        password_hash: 'managed_by_supabase_auth',
      })
      if (userError) {
        console.error('[create-teacher] users insert failed:', JSON.stringify(userError))
        throw new Error(`users insert: ${userError.message}`)
      }

      // 5. Insert into public.teachers
      const { error: teacherError } = await supabaseAdmin.from('teachers').insert({
        user_id: authUserId,
        state_id: stateId,
        is_active: true,
        joining_date: new Date().toISOString(),
      })
      if (teacherError) {
        console.error('[create-teacher] teachers insert failed:', JSON.stringify(teacherError))
        throw new Error(`teachers insert: ${teacherError.message}`)
      }
    } catch (dbError: unknown) {
      // 6. Rollback: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      const message = dbError instanceof Error ? dbError.message : String(dbError)
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 7. Return userId on success
    return new Response(
      JSON.stringify({ userId: authUserId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    console.error('[create-teacher] outer catch:', JSON.stringify(err), err instanceof Error ? err.stack : '')
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
