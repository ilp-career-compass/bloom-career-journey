import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import NodeWebSocket from "npm:ws";

console.log("Sarvam STT WebSocket Proxy function initialized.");

// Helper: Create WAV header (16kHz, mono, 16-bit PCM)
function createWavHeader(pcmLength: number): Uint8Array {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  
  // "RIFF"
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + pcmLength, true); // file length - 8
  
  // "WAVE"
  view.setUint32(8, 0x57415645, false);
  
  // "fmt "
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);           // Subchunk1Size
  view.setUint16(20, 1, true);            // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true);            // NumChannels (1 = Mono)
  view.setUint32(24, 16000, true);        // SampleRate (16000 Hz)
  view.setUint32(28, 32000, true);        // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true);            // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true);           // BitsPerSample (16 bits)
  
  // "data"
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, pcmLength, true);     // Chunk size
  
  return new Uint8Array(buffer);
}

// Helper: Decode base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Encode Uint8Array to base64 string
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Concatenate two Uint8Arrays
function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

serve(async (req) => {
  const url = new URL(req.url);

  // 1. Health check endpoint
  if (url.pathname === "/health" || req.method === "GET") {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response(
        JSON.stringify({ status: "ok", service: "sarvam-proxy-deno" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }

  // 2. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  // 3. WebSocket Connection
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const apiKey = Deno.env.get("SARVAM_API_KEY") || Deno.env.get("VITE_SARVAM_API_KEY");
  if (!apiKey) {
    console.error("SARVAM_API_KEY environment variable is missing.");
    return new Response("Server configuration error: API Key missing", { status: 500 });
  }

  // upgrade WebSocket using Deno's native WS server for client
  const { socket: clientWs, response } = Deno.upgradeWebSocket(req);
  const languageCode = url.searchParams.get("language_code") || "hi-IN";

  console.log(`Client connected to Deno Proxy (Language: ${languageCode})`);

  // Establish connection to Sarvam STT WebSocket API using Node's 'ws' library to allow custom headers
  const sarvamUrl = `wss://api.sarvam.ai/speech-to-text/ws?language-code=${languageCode}&model=saarika:v2.5&flush_signal=true&vad_signals=true`;
  
  let sarvamWs: NodeWebSocket;
  try {
    sarvamWs = new NodeWebSocket(sarvamUrl, {
      headers: {
        "api-subscription-key": apiKey
      }
    });
  } catch (err) {
    console.error("Failed to initialize Sarvam WebSocket:", err);
    return new Response("Failed to connect to speech provider", { status: 502 });
  }

  // Wait for Sarvam to open, then bind events
  sarvamWs.on("open", () => {
    console.log("Connected to Sarvam AI successfully!");
  });

  sarvamWs.on("message", (data) => {
    try {
      // Deno WS OPEN state is 1
      if (clientWs.readyState === 1) {
        clientWs.send(data.toString());
      }
    } catch (err) {
      console.error("Failed to forward message from Sarvam to Client:", err);
    }
  });

  sarvamWs.on("error", (err) => {
    console.error("Sarvam WebSocket Error:", err);
  });

  sarvamWs.on("close", (code, reason) => {
    console.log(`Sarvam WebSocket closed: ${code} - ${reason}`);
    try {
      if (clientWs.readyState === 1) {
        clientWs.close(1011, "Sarvam connection closed");
      }
    } catch (e) {
      // Ignored
    }
  });

  // Bind client messages
  clientWs.onmessage = (event) => {
    const dataStr = event.data.toString();

    if (dataStr.trim() === "STOP") {
      console.log("Received STOP command. Flushing Sarvam buffer...");
      if (sarvamWs.readyState === NodeWebSocket.OPEN) {
        try {
          sarvamWs.send(JSON.stringify({ type: "flush" }));
        } catch (e) {
          console.error("Failed to send STOP/flush to Sarvam:", e);
        }
      }
      return;
    }

    // Decode base64 PCM from client
    let pcmBytes: Uint8Array;
    try {
      pcmBytes = base64ToUint8Array(dataStr);
    } catch (err) {
      console.error("Failed to decode base64 chunk:", err);
      return;
    }

    // Wrap in WAV header
    const wavHeader = createWavHeader(pcmBytes.length);
    const wavBytes = concatUint8Arrays(wavHeader, pcmBytes);
    const wavB64 = uint8ArrayToBase64(wavBytes);

    const payload = {
      audio: {
        data: wavB64,
        encoding: "audio/wav",
        sample_rate: 16000,
      },
    };

    if (sarvamWs.readyState === NodeWebSocket.OPEN) {
      try {
        sarvamWs.send(JSON.stringify(payload));
      } catch (err) {
        console.error("Failed to send payload to Sarvam:", err);
      }
    } else {
      console.warn("Sarvam socket not open; chunk dropped.");
    }
  };

  clientWs.onclose = () => {
    console.log("Client disconnected (Cleanup)");
    try {
      if (sarvamWs.readyState === NodeWebSocket.OPEN || sarvamWs.readyState === NodeWebSocket.CONNECTING) {
        sarvamWs.close();
      }
    } catch (e) {
      // Ignored
    }
  };

  clientWs.onerror = (err) => {
    console.error("Client WebSocket Error:", err);
  };

  return response;
});
