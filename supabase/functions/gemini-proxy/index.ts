function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN')
  const base = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
  if (!allowedOrigin) return { ...base, 'Access-Control-Allow-Origin': '*' }
  const origin = req.headers.get('Origin') ?? ''
  return { ...base, 'Access-Control-Allow-Origin': origin === allowedOrigin ? origin : allowedOrigin, 'Vary': 'Origin' }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { model, contents, generationConfig, systemInstruction } = await req.json()

    if (!model || !contents) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: model, contents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const geminiBody: any = { contents }
    if (generationConfig) geminiBody.generationConfig = generationConfig
    if (systemInstruction) geminiBody.systemInstruction = systemInstruction

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    })

    const data = await upstream.json()

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
