import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchemas() {
  console.log("Fetching student schema...");
  const { data: students } = await supabase.from('students').select('*').limit(1);
  console.log("students:", Object.keys(students?.[0] || {}));

  console.log("Fetching teachers schema...");
  const { data: teachers } = await supabase.from('teachers').select('*').limit(1);
  console.log("teachers:", Object.keys(teachers?.[0] || {}));

  console.log("Fetching classes schema...");
  const { data: classes } = await supabase.from('classes').select('*').limit(1);
  console.log("classes:", Object.keys(classes?.[0] || {}));

  console.log("Fetching states schema...");
  const { data: states } = await supabase.from('states').select('*').limit(1);
  console.log("states:", Object.keys(states?.[0] || {}));
  
  console.log("Fetching users schema...");
  const { data: users } = await supabase.from('users').select('*').limit(1);
  console.log("users:", Object.keys(users?.[0] || {}));
}

checkSchemas().catch(console.error);
