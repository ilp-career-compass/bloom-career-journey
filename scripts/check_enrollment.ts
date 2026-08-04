import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function run() { 
  const { data: students } = await supabase.from('students').select('user_id, enrollment_status, teacher_id, created_at'); 
  const { data: users } = await supabase.from('users').select('id, full_name').eq('role', 'student');
  
  const userMap = new Map(users?.map(u => [u.id, u.full_name]) || []);

  const manualSignups = students?.filter(s => s.enrollment_status === 'pending' || s.enrollment_status !== 'active') || [];
  
  console.log(`Pending / Non-active enrollments: ${manualSignups.length}`);
  manualSignups.forEach(s => {
    console.log(`- ${userMap.get(s.user_id)} (Status: ${s.enrollment_status}, Teacher: ${s.teacher_id})`);
  });

  const specificStudents = students?.filter(s => {
    const name = userMap.get(s.user_id) || '';
    return name.includes('Sai Sree') || name.includes('Student K') || name.includes('Student Sam');
  }) || [];

  console.log('\nSpecific students mentioned by user:');
  specificStudents.forEach(s => {
    console.log(`- ${userMap.get(s.user_id)} (Status: ${s.enrollment_status}, Teacher: ${s.teacher_id})`);
  });
} 

run();
