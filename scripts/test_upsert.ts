import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://puvyqwrqbvqrovogavev.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dnlxd3JxYnZxcm92b2dhdmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODQ1ODAsImV4cCI6MjA3MDg2MDU4MH0.kbh419Vq7N4Mrr9eeC1mrtmo5YRN58R3V4xrvSLdEOw'
);

async function main() {
  // Step 1: Sign in as test student
  console.log('--- Step 1: Sign in ---');
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'student_en@ilp.test',
    password: 'Test@1234'
  });
  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }
  console.log('Signed in as:', auth.user?.id);

  // Step 2: Get student record
  console.log('\n--- Step 2: Get student record ---');
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id, user_id')
    .eq('user_id', auth.user!.id)
    .single();
  if (studentErr) {
    console.error('Student lookup error:', studentErr);
    return;
  }
  console.log('Student ID:', student.id);
  console.log('User ID:', student.user_id);

  // Step 3: Check existing rows
  console.log('\n--- Step 3: Existing rows for this student ---');
  const { data: existing, error: existErr } = await supabase
    .from('assessment_responses')
    .select('id, student_id, assessment_type, assessment_title, completed_at, updated_at')
    .eq('student_id', student.id)
    .eq('assessment_type', 'inspiration');
  console.log('Existing rows:', JSON.stringify(existing, null, 2));
  if (existErr) console.error('Select error:', existErr);

  // Step 4: Try the exact upsert
  console.log('\n--- Step 4: Try upsert ---');
  const { data, error } = await supabase
    .from('assessment_responses')
    .upsert({
      student_id: student.id,
      assessment_type: 'inspiration',
      assessment_title: 'My Inspiration',
      responses: { test: true },
      updated_at: new Date().toISOString()
    }, { onConflict: 'student_id,assessment_type' })
    .select()
    .single();
  console.log('Upsert result:', JSON.stringify(data, null, 2));
  if (error) {
    console.error('Upsert error:', JSON.stringify(error, null, 2));
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
  }

  // Step 5: Try a plain insert to compare
  if (error) {
    console.log('\n--- Step 5: Try plain update instead ---');
    if (existing && existing.length > 0) {
      const { data: upd, error: updErr } = await supabase
        .from('assessment_responses')
        .update({
          responses: { test: true },
          updated_at: new Date().toISOString()
        })
        .eq('id', existing[0].id)
        .select()
        .single();
      console.log('Update result:', JSON.stringify(upd, null, 2));
      if (updErr) console.error('Update error:', JSON.stringify(updErr, null, 2));
    }
  }

  // Step 6: Check is_student_owned_by_auth function
  console.log('\n--- Step 6: RLS function check ---');
  const { data: rpcCheck, error: rpcErr } = await supabase
    .rpc('is_student_owned_by_auth', { student_id: student.id });
  console.log('is_student_owned_by_auth result:', rpcCheck);
  if (rpcErr) console.error('RPC error:', JSON.stringify(rpcErr, null, 2));
}

main().catch(console.error);
