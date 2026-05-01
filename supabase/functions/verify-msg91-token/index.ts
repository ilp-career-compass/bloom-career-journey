const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authKey = Deno.env.get('MSG91_AUTH_KEY')
    if (!authKey) {
      return new Response(
        JSON.stringify({ error: 'MSG91_AUTH_KEY not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const accessToken: string | undefined = body?.access_token

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: access_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const upstream = await fetch('https://api.msg91.com/api/v5/widget/verifyAccessToken', {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 'access-token': accessToken }),
    })

    const data = await upstream.json()

    // MSG91 returns { type: "success", widget_data: { mobile: "..." } } on success
    // and { type: "error", message: "..." } on failure
    if (data?.type === 'success') {
      const mobile: string = data?.widget_data?.mobile ?? data?.mobile ?? ''
      return new Response(
        JSON.stringify({ success: true, mobile }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'OTP verification failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
