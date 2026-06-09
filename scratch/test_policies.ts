import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Signing in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    phone: '+919964454702',
    password: 'Test@1234',
  });

  if (authError) {
    console.error('Auth failed:', authError.message);
    return;
  }

  console.log('Querying pg_policies...');
  // Let's try to query policies via an RPC or query if allowed
  const { data, error } = await supabase
    .from('pg_policies' as any)
    .select('*')
    .eq('tablename', 'chat_messages');

  if (error) {
    console.error('Failed to query pg_policies:', error.message);
  } else {
    console.log('Policies:', data);
  }
}

main().catch(console.error);
