import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
  const { data, error } = await supabase.from('users').select('*').limit(20);
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users:');
    console.table(data.map(u => ({ id: u.id, name: u.full_name, mobile: u.mobile, role: u.role })));
  }
}
run();
