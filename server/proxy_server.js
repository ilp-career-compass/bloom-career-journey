import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';

// Read .env manually to find VITE_SARVAM_API_KEY
const envPath = path.join(process.cwd(), '.env');
let apiKey = '';

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('VITE_SARVAM_API_KEY=')) {
        apiKey = line.split('=')[1].trim();
        // Strip quotes if present
        if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
          apiKey = apiKey.substring(1, apiKey.length - 1);
        }
        if (apiKey.startsWith("'") && apiKey.endsWith("'")) {
          apiKey = apiKey.substring(1, apiKey.length - 1);
        }
      }
    }
  }
} catch (e) {
  console.error('Failed to read .env file:', e);
}

console.log('Parsed Sarvam API Key:', apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : 'None');

function createWavHeader(pcmBuffer) {
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const subChunk2Size = pcmBuffer.length;
  const chunkSize = 36 + subChunk2Size;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // AudioFormat (PCM = 1)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(subChunk2Size, 40);

  return Buffer.concat([header, pcmBuffer]);
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ status: 'ok', service: 'sarvam-proxy' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/ws/stream') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } catch (err) {
    console.error('Upgrade connection error:', err);
    socket.destroy();
  }
});

wss.on('connection', (clientWs, request) => {
  let languageCode = 'hi-IN';
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    languageCode = url.searchParams.get('language_code') || 'hi-IN';
  } catch (err) {
    console.error('Failed to parse connection URL:', err);
  }

  console.log(`Client connected to proxy (Language: ${languageCode})`);

  if (!apiKey) {
    console.error('Server API Key missing');
    clientWs.close(1008, 'Server API Key missing');
    return;
  }

  const sarvamUrl = `wss://api.sarvam.ai/speech-to-text/ws?language-code=${languageCode}&model=saarika:v2.5&flush_signal=true&vad_signals=true`;
  console.log('Connecting to Sarvam Streaming API...', sarvamUrl);

  const sarvamWs = new WebSocket(sarvamUrl, {
    headers: {
      'api-subscription-key': apiKey
    }
  });

  let chunkCount = 0;
  let responseCount = 0;

  sarvamWs.on('open', () => {
    console.log('Connected to Sarvam AI successfully!');
  });

  sarvamWs.on('message', (data) => {
    try {
      responseCount++;
      const dataStr = data.toString();
      console.log(`[Sarvam -> Client] Msg #${responseCount}: ${dataStr.substring(0, 150)}...`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(dataStr);
      }
    } catch (err) {
      console.error('Failed to forward message to client:', err);
    }
  });

  sarvamWs.on('error', (err) => {
    console.error('Sarvam WebSocket Error:', err);
  });

  sarvamWs.on('close', (code, reason) => {
    console.log(`Sarvam WebSocket closed: ${code} - ${reason}`);
    try {
      clientWs.close(1011, 'Sarvam connection closed');
    } catch (e) { }
  });

  clientWs.on('message', (message) => {
    const dataStr = message.toString();

    if (dataStr.trim() === 'STOP') {
      console.log('Received STOP command. Flushing Sarvam buffer...');
      if (sarvamWs.readyState === WebSocket.OPEN) {
        try {
          sarvamWs.send(JSON.stringify({ type: 'flush' }));
        } catch (e) {
          console.error('Failed to send STOP/flush to Sarvam:', e);
        }
      }
      return;
    }

    // Decode base64 PCM from client
    let pcmBytes;
    try {
      pcmBytes = Buffer.from(dataStr, 'base64');
    } catch (err) {
      console.error('Failed to decode base64 chunk:', err);
      return;
    }

    chunkCount++;
    if (chunkCount <= 5 || chunkCount % 10 === 0) {
      console.log(`[Client -> Sarvam] Chunk #${chunkCount}: Received base64 audio, decoded ${pcmBytes.length} bytes`);
    }

    // Wrap in WAV header
    const wavBytes = createWavHeader(pcmBytes);
    const wavB64 = wavBytes.toString('base64');

    const payload = {
      audio: {
        data: wavB64,
        encoding: 'audio/wav',
        sample_rate: 16000
      }
    };

    if (sarvamWs.readyState === WebSocket.OPEN) {
      try {
        sarvamWs.send(JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to send payload to Sarvam:', err);
      }
    } else {
      console.warn(`[Client -> Sarvam] Warning: Sarvam socket not open (state: ${sarvamWs.readyState}), chunk #${chunkCount} dropped`);
    }
  });

  clientWs.on('close', () => {
    console.log('Client disconnected (Cleanup)');
    try {
      if (sarvamWs.readyState === WebSocket.OPEN || sarvamWs.readyState === WebSocket.CONNECTING) {
        sarvamWs.close();
      }
    } catch (e) { }
  });

  clientWs.on('error', (err) => {
    console.error('Client WebSocket Error:', err);
  });
});

const PORT = 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Node Sarvam STT Proxy Server running on port ${PORT}`);
});
