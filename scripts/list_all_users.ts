import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Querying users table...');
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, mobile, role, preferred_language')
    .limit(20);
    
  if (error) {
    console.error('Error fetching users:', error.message);
    return;
  }
  
  console.log('Users found:');
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error);
