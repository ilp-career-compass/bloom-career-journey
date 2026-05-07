Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const rawBody = await req.text()

    // --- Webhook signature verification ---
    const hookSecret = Deno.env.get('SEND_SMS_HOOK_SECRET')
    if (hookSecret) {
      const webhookId = req.headers.get('webhook-id')
      const webhookTimestamp = req.headers.get('webhook-timestamp')
      const webhookSignature = req.headers.get('webhook-signature')

      if (!webhookId || !webhookTimestamp || !webhookSignature) {
        return new Response(JSON.stringify({ error: 'Missing webhook signature headers' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // hookSecret format: "v1,whsec_<base64>"
      const base64Secret = hookSecret.replace(/^v1,whsec_/, '')
      const secretBytes = Uint8Array.from(atob(base64Secret), (c) => c.charCodeAt(0))

      const signingString = `${webhookId}.${webhookTimestamp}.${rawBody}`
      const encoder = new TextEncoder()

      const key = await crypto.subtle.importKey(
        'raw',
        secretBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      )
      const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signingString))
      const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))

      // Header format: "v1,<base64>" — may contain multiple comma-separated signatures
      const receivedSignatures = webhookSignature.split(' ')
      const signatureMatch = receivedSignatures.some((sig) => {
        const sigValue = sig.replace(/^v1,/, '')
        return sigValue === computedSignature
      })

      if (!signatureMatch) {
        return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Replay protection: reject requests older than 5 minutes
      const now = Math.floor(Date.now() / 1000)
      const ts = parseInt(webhookTimestamp, 10)
      if (isNaN(ts) || Math.abs(now - ts) > 300) {
        return new Response(JSON.stringify({ error: 'Webhook timestamp expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // --- MSG91 credentials check ---
    const authKey = Deno.env.get('MSG91_AUTH_KEY')
    // If MSG91 is live but the webhook secret is absent, any unsigned POST would trigger real SMS.
    // Refuse rather than silently send from an unprotected endpoint.
    if (authKey && !hookSecret) {
      console.error('send-sms-hook: MSG91_AUTH_KEY is set but SEND_SMS_HOOK_SECRET is not — refusing SMS send to prevent unauthenticated trigger')
      return new Response(JSON.stringify({ error: 'Webhook not configured securely — contact admin' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (!authKey) {
      // Placeholder fallback: credentials not yet set — allow auth flow to proceed silently
      console.warn('send-sms-hook: MSG91_AUTH_KEY not set — skipping SMS send (placeholder mode)')
      return new Response(JSON.stringify({ message: 'SMS skipped (no credentials)' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const flowId = Deno.env.get('MSG91_FLOW_ID')
    const senderId = Deno.env.get('MSG91_SENDER_ID')
    if (!flowId || !senderId) {
      console.warn('send-sms-hook: MSG91_FLOW_ID or MSG91_SENDER_ID not set — skipping SMS send')
      return new Response(JSON.stringify({ message: 'SMS skipped (incomplete credentials)' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // --- Parse Supabase hook payload ---
    const payload = JSON.parse(rawBody)
    const phone: string = payload?.user?.phone
    const otp: string = payload?.sms?.otp

    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: 'Missing phone or otp in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Transform E.164 (+91XXXXXXXXXX) → MSG91 format (91XXXXXXXXXX)
    const mobiles = phone.replace(/^\+/, '')

    // --- Call MSG91 Flow API ---
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15_000)
    let msg91Response: Response
    try {
      msg91Response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'authkey': authKey,
        },
        body: JSON.stringify({
          flow_id: flowId,
          sender: senderId,
          recipients: [{ mobiles, VAR1: otp }],
        }),
      })
    } catch (fetchErr) {
      if ((fetchErr as Error).name === 'AbortError') {
        return new Response(JSON.stringify({ error: 'MSG91 API timed out' }), {
          status: 504,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      throw fetchErr
    } finally {
      clearTimeout(timeoutId)
    }

    if (!msg91Response.ok) {
      const errorText = await msg91Response.text()
      console.error(`send-sms-hook: MSG91 error ${msg91Response.status}: ${errorText}`)
      return new Response(
        JSON.stringify({ error: `MSG91 API error: ${msg91Response.status}`, detail: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ message: 'SMS sent successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('send-sms-hook: Uncaught error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
