import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Querying states...');
  const { data: states, error: sErr } = await supabase
    .from('states')
    .select('id, state_name')
    .limit(1);

  if (sErr || !states || states.length === 0) {
    console.error('Failed to query states:', sErr?.message);
    return;
  }

  const stateId = states[0].id;
  console.log(`Using State: ${states[0].state_name} (${stateId})`);

  // We will generate unique phone numbers to avoid duplicates
  const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6 digits
  const teacherPhone = `+9199${randomSuffix}01`;
  const studentPhone = `+9199${randomSuffix}02`;
  const password = 'Test@1234';

  console.log(`\nAttempting to register Teacher: Phone ${teacherPhone}, Password ${password}`);
  try {
    const { data: teacherData, error: tErr } = await supabase.functions.invoke('create-teacher', {
      body: {
        fullName: 'Test Teacher Verification',
        phone: teacherPhone,
        password: password,
        stateId: stateId,
        preferredLanguage: 'en',
        accessToken: 'mock_otp_access_token'
      }
    });

    if (tErr) {
      console.error('create-teacher Edge Function invocation failed:', tErr);
    } else {
      console.log('create-teacher response:', teacherData);
    }
  } catch (err: any) {
    console.error('create-teacher caught error:', err.message);
  }

  console.log(`\nAttempting to register Student: Phone ${studentPhone}, Password ${password}`);
  try {
    const { data: studentData, error: stErr } = await supabase.functions.invoke('create-student-self-register', {
      body: {
        fullName: 'Test Student Verification',
        phone: studentPhone,
        password: password,
        grade: '8',
        stateId: stateId,
        preferredLanguage: 'en',
        accessToken: 'mock_otp_access_token'
      }
    });

    if (stErr) {
      console.error('create-student-self-register Edge Function invocation failed:', stErr);
    } else {
      console.log('create-student-self-register response:', studentData);
    }
  } catch (err: any) {
    console.error('create-student-self-register caught error:', err.message);
  }
}

main().catch(console.error);
