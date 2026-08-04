import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: students, error: studentsError, count } = await supabase
    .from('students')
    .select('user_id', { count: 'exact' })
    .gte('created_at', '2026-07-28T00:00:00Z');

  console.log(`Students joined since 28th July: ${count}`);

  const userIds = students?.map(s => s.user_id) || [];
  
  // Find which tables might hold stage info.
  // We can query assessment_responses or user_stages if it exists.
  const { data: assessments, error: asError } = await supabase
    .from('assessment_responses')
    .select('*')
    .limit(1);

  if (!asError) {
    console.log(`assessment_responses sample:`, JSON.stringify(assessments, null, 2));
  } else {
    console.log('Error fetching assessment_responses:', asError.message);
  }
}

main().catch(console.error);
