import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, created_at, role')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(5);

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }
  
  console.log(`Latest 5 students:`, JSON.stringify(users, null, 2));
}

main().catch(console.error);
