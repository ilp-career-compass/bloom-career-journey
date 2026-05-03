import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  fullName: string
  phone: string
  password: string
  grade: string
  stateId: string
  preferredLanguage: string
  accessToken: string
}

function isValidE164(phone: string): boolean {
  return /^\+\d{10,15}$/.test(phone)
}

Deno.serve({ verify: false }, async (req) => {
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
    const { fullName, phone, password, grade, stateId, preferredLanguage, accessToken } = body

    if (!fullName || !phone || !password || !grade || !stateId) {
      return new Response(
        JSON.stringify({ error: 'fullName, phone, password, grade, and stateId are required' }),
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
      const normalize = (m: string) => (m || '').replace(/\D/g, '').slice(-10)
      if (!verifyData.mobile || normalize(verifyData.mobile) !== normalize(phone)) {
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

    // 3. Resolve class_id from grade + stateId
    const className = `Class ${grade}`
    const { data: classRow, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id')
      .eq('name', className)
      .eq('state_id', stateId)
      .maybeSingle()

    if (classError || !classRow) {
      return new Response(
        JSON.stringify({ error: `Class not found for grade ${grade}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 4. Create Supabase Auth user with phone + chosen password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone,
      password,
      phone_confirm: true,
      user_metadata: { full_name: fullName, role: 'student' },
    })

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: authError?.message || 'Failed to create auth account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const authUserId = authData.user.id

    try {
      // 5. Insert into public.users
      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: authUserId,
        full_name: fullName,
        mobile: phone,
        role: 'student',
        state_id: stateId,
        preferred_language: preferredLanguage || 'en',
        password_hash: 'managed_by_supabase_auth',
      })
      if (userError) throw new Error(`users insert: ${userError.message}`)

      // 6. Upsert into public.students
      const { error: studentError } = await supabaseAdmin.from('students').upsert(
        {
          user_id: authUserId,
          class_id: classRow.id,
          teacher_id: null,
          enrollment_status: 'pending',
        },
        { onConflict: 'user_id' },
      )
      if (studentError) throw new Error(`students upsert: ${studentError.message}`)
    } catch (dbError: unknown) {
      // 7. Rollback: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      const message = dbError instanceof Error ? dbError.message : String(dbError)
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 8. Return userId on success
    return new Response(
      JSON.stringify({ userId: authUserId }),
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
