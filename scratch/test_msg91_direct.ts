import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const widgetIdRaw = process.env.VITE_MSG91_WIDGET_ID;
const tokenAuthRaw = process.env.VITE_MSG91_TOKEN_AUTH;
const authKeyRaw = process.env.MSG91_AUTH_KEY || process.env.VITE_MSG91_TOKEN_AUTH; // Fallback or check

function sanitize(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

const widgetId = sanitize(widgetIdRaw);
const tokenAuth = sanitize(tokenAuthRaw);
const authKey = sanitize(authKeyRaw);

console.log('--- MSG91 Key Inspection ---');
console.log('VITE_MSG91_WIDGET_ID:');
console.log('  Raw:  ', JSON.stringify(widgetIdRaw));
console.log('  Clean:', JSON.stringify(widgetId));
console.log('VITE_MSG91_TOKEN_AUTH:');
console.log('  Raw:  ', JSON.stringify(tokenAuthRaw));
console.log('  Clean:', JSON.stringify(tokenAuth));
console.log('MSG91_AUTH_KEY (or fallback):');
console.log('  Raw:  ', JSON.stringify(authKeyRaw));
console.log('  Clean:', JSON.stringify(authKey));

async function testConnection() {
  console.log('\n--- Testing Upstream Connection to MSG91 ---');
  try {
    // Try a dummy verify call to check authkey acceptance vs rejection
    const url = 'https://api.msg91.com/api/v5/widget/verifyAccessToken';
    const body = { 'access-token': 'dummy_access_token_12345' };
    
    console.log('Sending request to MSG91 with cleaned keys...');
    console.log('URL:', url);
    console.log('Headers:', {
      'authkey': authKey ? `${authKey.slice(0, 5)}...${authKey.slice(-5)}` : 'undefined',
      'Content-Type': 'application/json'
    });
    console.log('Body:', JSON.stringify(body));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    const responseText = await response.text();
    console.log('Response Text:', responseText);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testConnection();
