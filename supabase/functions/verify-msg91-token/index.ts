// Internal-only Edge Function: called by create-teacher, create-student-self-register, set-first-password.
// No CORS headers — browsers should never call this directly.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  try {
    // G21: Restrict to internal Edge Function callers via service role key
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const authHeader = req.headers.get('Authorization')
    if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const authKey = Deno.env.get('MSG91_AUTH_KEY')
    if (!authKey) {
      return new Response(
        JSON.stringify({ error: 'MSG91_AUTH_KEY not configured on server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json()
    const accessToken: string | undefined = body?.access_token

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: access_token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // G24: bound the upstream call so a slow MSG91 API doesn't hang the entire EF chain
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    let upstream: Response
    try {
      upstream = await fetch('https://api.msg91.com/api/v5/widget/verifyAccessToken', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'access-token': accessToken }),
      })
    } catch (fetchErr) {
      if ((fetchErr as Error).name === 'AbortError') {
        return new Response(
          JSON.stringify({ success: false, error: 'MSG91 API timed out' }),
          { status: 504, headers: { 'Content-Type': 'application/json' } },
        )
      }
      throw fetchErr
    } finally {
      clearTimeout(timeoutId)
    }

    if (!upstream.ok) {
      const body = await upstream.text()
      console.error('[verify-msg91-token] MSG91 upstream error:', upstream.status, body.slice(0, 200))
      return new Response(
        JSON.stringify({ success: false, error: `MSG91 API error: ${upstream.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      )
    }

    let data: Record<string, unknown>
    try {
      data = await upstream.json()
    } catch {
      console.error('[verify-msg91-token] MSG91 returned non-JSON response')
      return new Response(
        JSON.stringify({ success: false, error: 'MSG91 API returned unexpected response format' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // MSG91 returns { type: "success", widget_data: { mobile: "..." } } on success
    // and { type: "error", message: "..." } on failure
    if (data?.type === 'success') {
      const mobile: string = data?.widget_data?.mobile ?? data?.mobile ?? ''
      // G23: Require a non-empty mobile — token validity alone is not sufficient to confirm phone ownership.
      // If MSG91 returns success without a mobile (unexpected), treat as failure rather than silently
      // skipping the cross-check in callers.
      if (!mobile) {
        return new Response(
          JSON.stringify({ success: false, error: 'MSG91 verified OTP but did not return mobile — cannot confirm phone ownership' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response(
        JSON.stringify({ success: true, mobile }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'OTP verification failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
