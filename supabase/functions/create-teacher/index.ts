import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  fullName: string
  phone: string
  password: string
  stateId: string
  preferredLanguage: string
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
    const { fullName, phone, password, stateId, preferredLanguage } = body

    if (!fullName || !phone || !password || !stateId) {
      return new Response(
        JSON.stringify({ error: 'fullName, phone, password, and stateId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 1. Validate phone format
    if (!isValidE164(phone)) {
      return new Response(
        JSON.stringify({ error: `Invalid phone format: ${phone}. Expected E.164 format like +91XXXXXXXXXX` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 2. Check for duplicate phone in users table
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
      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: authUserId,
        full_name: fullName,
        mobile: phone,
        role: 'teacher',
        state_id: stateId,
        preferred_language: preferredLanguage || 'en',
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
