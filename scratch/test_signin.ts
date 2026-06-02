import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vvnogvhdkkevfwcdlwsr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

async function main() {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('Trying sign in with teacher_test@ilp.test / Test@1234...');
  const { data, error } = await client.auth.signInWithPassword({
    email: 'teacher_test@ilp.test',
    password: 'Test@1234',
  });

  if (error) {
    console.error('Sign in failed:', error.message);
  } else {
    console.log('Sign in succeeded! User details:');
    console.log('ID:', data.user?.id);
    console.log('Phone:', data.user?.phone);
    console.log('Metadata:', data.user?.user_metadata);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
});
