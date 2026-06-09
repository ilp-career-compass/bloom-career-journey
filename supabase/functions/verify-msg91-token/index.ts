// Internal-only Edge Function: called by create-teacher, create-student-self-register, set-first-password.
// No CORS headers — browsers should never call this directly.

Deno.serve(async (req: Request) => {
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

    let authKey = Deno.env.get('MSG91_AUTH_KEY')
    if (authKey) {
      authKey = authKey.trim().replace(/^["']|["']$/g, '')
    }

    console.log('[verify-msg91-token] Server Configuration:')
    console.log(`  - MSG91_AUTH_KEY configured: ${!!authKey}`)
    if (authKey) {
      console.log(`  - MSG91_AUTH_KEY clean length: ${authKey.length}`)
      console.log(`  - MSG91_AUTH_KEY mask: ${authKey.slice(0, 4)}...${authKey.slice(-4)}`)
    }

    if (!authKey) {
      return new Response(
        JSON.stringify({ error: 'MSG91_AUTH_KEY not configured on server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json()
    const accessToken: string | undefined = body?.access_token

    console.log('[verify-msg91-token] Request Payload:')
    console.log(`  - access_token received: ${!!accessToken}`)
    if (accessToken) {
      console.log(`  - access_token length: ${accessToken.length}`)
      console.log(`  - access_token mask: ${accessToken.slice(0, 8)}...${accessToken.slice(-8)}`)
    }

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
      console.log('[verify-msg91-token] Dispatching fetch to MSG91 verifyAccessToken...')
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
        console.error('[verify-msg91-token] MSG91 call timed out after 10s')
        return new Response(
          JSON.stringify({ success: false, error: 'MSG91 API timed out' }),
          { status: 504, headers: { 'Content-Type': 'application/json' } },
        )
      }
      console.error('[verify-msg91-token] Fetch network error calling MSG91:', fetchErr)
      throw fetchErr
    } finally {
      clearTimeout(timeoutId)
    }

    console.log(`[verify-msg91-token] Upstream MSG91 Response Status: ${upstream.status}`)
    const rawBody = await upstream.text()
    console.log('[verify-msg91-token] Upstream MSG91 Response Body:', rawBody)

    if (!upstream.ok) {
      console.error('[verify-msg91-token] MSG91 upstream HTTP error:', upstream.status, rawBody.slice(0, 200))
      return new Response(
        JSON.stringify({ success: false, error: `MSG91 API error: ${upstream.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      )
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(rawBody)
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
      const widgetData = data?.widget_data as Record<string, unknown> | undefined
      const mobile: string = (widgetData?.mobile as string) ?? (data?.mobile as string) ?? ''
      // G23: Require a non-empty mobile — token validity alone is not sufficient to confirm phone ownership.
      // If MSG91 returns success without a mobile (unexpected), treat as failure rather than silently
      // skipping the cross-check in callers.
      if (!mobile) {
        console.error('[verify-msg91-token] MSG91 success response was missing mobile data')
        return new Response(
          JSON.stringify({ success: false, error: 'MSG91 verified OTP but did not return mobile — cannot confirm phone ownership' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
      console.log(`[verify-msg91-token] Success! Mobile confirmed: ${mobile}`)
      return new Response(
        JSON.stringify({ success: true, mobile }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    console.warn('[verify-msg91-token] Verification rejected by MSG91 backend:', data?.message || 'Unknown reason')
    return new Response(
      JSON.stringify({ success: false, error: 'OTP verification failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[verify-msg91-token] Uncaught error in Edge Function:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
