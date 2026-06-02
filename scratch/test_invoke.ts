import { createClient, FunctionsHttpError } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vvnogvhdkkevfwcdlwsr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

async function main() {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('Invoking set-first-password...');
  const { data, error } = await client.functions.invoke('set-first-password', {
    body: { mobile: '+919999999999', newPassword: 'dummyPassword123', access_token: 'dummyToken' },
  });

  if (error) {
    console.log('Error type:', error.constructor.name);
    if (error instanceof FunctionsHttpError) {
      try {
        const bodyText = await error.context.text();
        console.log('Response body as text:', bodyText);
      } catch (e) {
        console.error('Failed to read context body:', e);
      }
    } else {
      console.log('Error details:', error);
    }
  } else {
    console.log('Succeeded:', data);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
});
