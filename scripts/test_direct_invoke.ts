import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vvnogvhdkkevfwcdlwsr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

async function main() {
  console.log('SUPABASE_URL:', SUPABASE_URL);
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('Invoking gemini-proxy anonymously...');
  const { data, error } = await client.functions.invoke('gemini-proxy', {
    body: { test: true },
  });

  if (error) {
    console.log('Invoke failed as expected. Error status/message:');
    console.log('Error:', error);
  } else {
    console.log('Invoke succeeded?! Data:', data);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
});
