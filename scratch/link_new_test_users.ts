import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const teacherPhone = '+919964454701';
  const studentUserId = '653b5292-d9dd-451a-b660-5930818bce03';
  const studentPhone = '+919964454702';
  const password = 'Test@1234';

  console.log(`Logging in as Teacher: ${teacherPhone}...`);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    phone: teacherPhone,
    password: password,
  });

  if (authErr || !authData.user) {
    console.error('Teacher login failed:', authErr?.message);
    return;
  }

  const teacherUserId = authData.user.id;
  console.log(`Teacher login succeeded. User ID: ${teacherUserId}`);

  // Fetch the teacher's profile id
  const { data: teacherRow, error: tErr } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', teacherUserId)
    .single();

  if (tErr || !teacherRow) {
    console.error('Failed to fetch teacher profile row:', tErr?.message);
    return;
  }

  const teacherId = teacherRow.id;
  console.log(`Teacher ID: ${teacherId}`);

  // Let's try to update the student record to link them
  console.log(`Updating student (user_id=${studentUserId}) with teacher_id=${teacherId}...`);
  const { data: updatedStudent, error: uErr } = await supabase
    .from('students')
    .update({
      teacher_id: teacherId,
      enrollment_status: 'active',
    })
    .eq('user_id', studentUserId)
    .select();

  if (uErr) {
    console.error('Failed to link student via update:', uErr.message);
    
    // Let's see if we can do it by signing in as the student!
    console.log('\nRetrying: Logging in as Student to update own record...');
    const { data: sAuthData, error: sAuthErr } = await supabase.auth.signInWithPassword({
      phone: studentPhone,
      password: password,
    });

    if (sAuthErr || !sAuthData.user) {
      console.error('Student login failed:', sAuthErr?.message);
      return;
    }

    console.log('Student login succeeded. Trying self-update...');
    const { data: sUpdatedStudent, error: suErr } = await supabase
      .from('students')
      .update({
        teacher_id: teacherId,
        enrollment_status: 'active',
      })
      .eq('user_id', studentUserId)
      .select();

    if (suErr) {
      console.error('Student self-update failed:', suErr.message);
    } else {
      console.log('Student self-update succeeded!', sUpdatedStudent);
    }
  } else {
    console.log('Teacher update succeeded!', updatedStudent);
  }
}

main().catch(console.error);
