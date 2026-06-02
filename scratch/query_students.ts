import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vvnogvhdkkevfwcdlwsr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

async function main() {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('Querying students from public.users table...');
  const { data, error } = await client
    .from('users')
    .select('id, full_name, mobile, role, preferred_language, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Recent students:');
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
});
