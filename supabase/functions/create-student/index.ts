/// <reference path="../global.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN')
  const base = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
  if (!allowedOrigin) return { ...base, 'Access-Control-Allow-Origin': '*' }
  const origin = req.headers.get('Origin') ?? ''
  return { ...base, 'Access-Control-Allow-Origin': origin === allowedOrigin ? origin : allowedOrigin, 'Vary': 'Origin' }
}

interface StudentInput {
  fullName: string
  phone: string
  grade: string
  preferredLanguage: string
  teacherId: string
  stateId: string
}

interface RequestBody {
  students: StudentInput[]
  teacherUserId: string
}

interface CreatedResult {
  fullName: string
  phone: string
  userId: string
}

interface ErrorResult {
  fullName: string
  phone: string
  reason: string
}

function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => chars[b % chars.length]).join('')
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

    if (!body.students || !Array.isArray(body.students) || body.students.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Request must include a non-empty students array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (body.students.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Batch size exceeds maximum of 200 students per request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!body.teacherUserId) {
      return new Response(
        JSON.stringify({ error: 'teacherUserId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Authorization: verify caller is the teacher they claim to be ──
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(authHeader)
    if (callerError || !callerData.user || callerData.user.id !== body.teacherUserId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Collect unique teacherIds from the request and verify ownership
    const uniqueTeacherIds = [...new Set(body.students.map((s) => s.teacherId))]
    for (const tid of uniqueTeacherIds) {
      const { data: teacherRow } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('id', tid)
        .eq('user_id', body.teacherUserId)
        .maybeSingle()
      if (!teacherRow) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    const created: CreatedResult[] = []
    const errors: ErrorResult[] = []

    for (const student of body.students) {
      const { fullName, phone, grade, preferredLanguage, teacherId, stateId } = student

      // 1. Validate phone format
      if (!isValidE164(phone)) {
        errors.push({ fullName, phone, reason: `Invalid phone format: ${phone}. Expected E.164 format like +91XXXXXXXXXX` })
        continue
      }

      // 2. Check for duplicate phone in users table
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('mobile', phone)
        .maybeSingle()

      if (existingUser) {
        errors.push({ fullName, phone, reason: 'Phone number already registered' })
        continue
      }

      // 3. Resolve class_id from grade + state_id
      const className = `Class ${grade}`
      const { data: classRow, error: classError } = await supabaseAdmin
        .from('classes')
        .select('id')
        .eq('name', className)
        .eq('state_id', stateId)
        .maybeSingle()

      if (classError || !classRow) {
        errors.push({ fullName, phone, reason: `Class not found for grade ${grade}` })
        continue
      }

      // 4. Create Supabase Auth user with phone + random password
      const password = generatePassword()
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        phone,
        password,
        phone_confirm: true,
        user_metadata: { full_name: fullName, role: 'student' },
      })

      if (authError || !authData.user) {
        errors.push({ fullName, phone, reason: authError?.message || 'Failed to create auth account' })
        continue
      }

      const authUserId = authData.user.id

      try {
        // 5. Insert into public.users
        const email = `${phone.replace(/\+/g, '')}@internal.app`
        const { error: userError } = await supabaseAdmin.from('users').insert({
          id: authUserId,
          full_name: fullName,
          mobile: phone,
          email: email,
          role: 'student',
          state_id: stateId,
          password_hash: 'managed_by_supabase_auth',
          preferred_language: ['en', 'kn', 'ta', 'hi'].includes(preferredLanguage) ? preferredLanguage : 'en',
        })
        if (userError) throw new Error(`users insert: ${userError.message}`)

        // 6. Upsert into public.students
        const { error: studentError } = await supabaseAdmin.from('students').upsert(
          {
            user_id: authUserId,
            teacher_id: teacherId,
            class_id: classRow.id,
            enrollment_status: 'active',
          },
          { onConflict: 'user_id' },
        )
        if (studentError) throw new Error(`students upsert: ${studentError.message}`)

        created.push({ fullName, phone, userId: authUserId })
      } catch (dbError: unknown) {
        const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
        if (rollbackError) {
          console.error('[create-student] rollback deleteUser failed — orphaned auth user:', authUserId, JSON.stringify(rollbackError))
        }
        console.error('[create-student] DB error for', phone, ':', dbError instanceof Error ? dbError.message : String(dbError))
        errors.push({ fullName, phone, reason: 'Account creation failed — please try again' })
      }
    }

    return new Response(
      JSON.stringify({ created, errors }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[create-student] outer catch:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
