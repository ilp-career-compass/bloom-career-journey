import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('user_id')
    .gte('created_at', '2026-07-28T00:00:00Z');

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    return;
  }
  
  const userIds = students.map(s => s.user_id);
  console.log(`Found ${userIds.length} students joined since July 28.`);

  if (userIds.length > 0) {
    const { data: responses, error: respError } = await supabase
      .from('assessment_responses')
      .select('student_id')
      .in('student_id', userIds);

    if (respError) {
      console.error('Error fetching assessment_responses:', respError);
    } else {
      console.log(`Found ${responses?.length || 0} total assessment responses for these students.`);
      
      const studentsWithStages = new Set(responses?.map(r => r.student_id)).size;
      console.log(`${studentsWithStages} out of ${userIds.length} students have crossed at least one stage (completed an assessment).`);
    }
  }
}

main().catch(console.error);
