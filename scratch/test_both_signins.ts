import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function tryLogin(email: string, role: string) {
  console.log(`Trying sign in as ${role}: ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'Test@1234',
  });

  if (error) {
    console.error(`Sign in failed for ${email}:`, error.message);
  } else {
    console.log(`Sign in succeeded for ${email}! User ID:`, data.user?.id);
    
    // Now let's try to query the users table since we are authenticated!
    const { data: profile, error: pErr } = await supabase
      .from('users')
      .select('id, full_name, role, email')
      .eq('id', data.user?.id)
      .single();
      
    if (pErr) {
      console.error('Failed to fetch user profile row:', pErr.message);
    } else {
      console.log('User profile row:', profile);
    }
  }
}

async function main() {
  await tryLogin('student_en@ilp.test', 'student');
  console.log('');
  await tryLogin('teacher_test@ilp.test', 'teacher');
}

main().catch(console.error);
