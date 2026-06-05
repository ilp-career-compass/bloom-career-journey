import fs from 'fs';
import path from 'path';

// Manual simple env parsing to avoid dependency issues
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let apiKey = '';

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

console.log('Parsed API Key:', apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : 'None');

if (!apiKey) {
  console.error('❌ VITE_SARVAM_API_KEY not found in .env');
  process.exit(1);
}

async function checkApiKey() {
  const url = 'https://api.sarvam.ai/speech-to-text-translate';
  console.log('Sending test request to:', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log('HTTP Status Code:', res.status);
    const bodyText = await res.text();
    console.log('Response body:', bodyText);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

checkApiKey();
