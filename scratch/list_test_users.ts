import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Fetching Teachers ---');
  const { data: teachers, error: tError } = await supabase
    .from('teachers')
    .select('id, user_id, users:user_id(email, full_name, role)');
  
  if (tError) {
    console.error('Teachers error:', tError);
  } else {
    console.log(JSON.stringify(teachers, null, 2));
  }

  console.log('\n--- Fetching Students ---');
  const { data: students, error: sError } = await supabase
    .from('students')
    .select('id, user_id, teacher_id, users:user_id(email, full_name, role)');
  
  if (sError) {
    console.error('Students error:', sError);
  } else {
    console.log(JSON.stringify(students, null, 2));
  }
}

main().catch(console.error);
