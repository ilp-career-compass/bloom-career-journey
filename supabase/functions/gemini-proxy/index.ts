/// <reference path="../global.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_MODELS = new Set([
   'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
])

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Missing server configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Require a valid Supabase user JWT — CORS alone does not protect server-side callers
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rawBody = await req.text()
    if (rawBody.length > 100_000) {
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { model, contents, generationConfig, systemInstruction } = JSON.parse(rawBody)

    if (!model || !contents) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: model, contents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Whitelist models to prevent cost escalation and path traversal in the URL
    if (!ALLOWED_MODELS.has(model)) {
      return new Response(
        JSON.stringify({ error: `Model not allowed: ${model}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const geminiBody: Record<string, unknown> = { contents }
    if (generationConfig) geminiBody.generationConfig = generationConfig
    if (systemInstruction) geminiBody.systemInstruction = systemInstruction

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      console.error('[gemini-proxy] Gemini API error:', upstream.status, JSON.stringify(data).slice(0, 300))
    }

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
