import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Fetching all Users ---');
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, full_name');
  
  if (error) {
    console.error('Users error:', error);
  } else {
    console.log(`Found ${users?.length || 0} users:`);
    console.log(JSON.stringify(users, null, 2));
  }
}

main().catch(console.error);
