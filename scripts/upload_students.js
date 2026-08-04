import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import csvParser from 'csv-parser';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 1. Initialize Supabase Admin Client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// MUST use service_role key to bypass RLS and use auth.admin
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper to generate a random 16-char password
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => chars[b % chars.length])
    .join('');
}

async function uploadStudents() {
  const students = [];
  const csvFilePath = path.resolve(__dirname, '../students.csv');

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV not found at: ${csvFilePath}`);
    console.log("Please save your Excel sheet as 'students.csv' in the root of the project.");
    process.exit(1);
  }

  console.log("📄 Reading students.csv...");
  
  // Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (data) => students.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`✅ Found ${students.length} students. Starting upload...`);

  let successCount = 0;
  let errorCount = 0;

  // Process each student sequentially to prevent database locking/rate limits
  for (const row of students) {
    // The keys match the exact column headers from your spreadsheet
    const fullName = row['Student Full Name']?.trim();
    const phone = row['Student Mobile']?.trim();
    const classId = row['class_id']?.trim();
    const stateId = row['state_id']?.trim();
    const teacherId = row['teacher_id']?.trim();
    const prefLang = row['Preferred Language']?.trim() || 'hi'; // Default to hi

    if (!fullName || !phone || !classId || !stateId || !teacherId) {
      console.warn(`⚠️ Skipping row due to missing required data: ${fullName || 'Unknown'}`);
      errorCount++;
      continue;
    }

    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        phone: phone,
        password: generatePassword(),
        phone_confirm: true,
        user_metadata: { full_name: fullName, role: 'student' },
      });

      if (authError || !authData.user) {
        // If user exists, authError message usually says "Phone number already exists"
        console.error(`❌ Failed to create auth user for ${fullName} (${phone}): ${authError?.message}`);
        errorCount++;
        continue;
      }

      const authUserId = authData.user.id;
      const email = `${phone.replace(/\+/g, '')}@internal.app`;

      // 2. Insert into public.users
      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: authUserId,
        full_name: fullName,
        mobile: phone,
        email: email,
        role: 'student',
        state_id: stateId,
        password_hash: 'managed_by_supabase_auth',
        preferred_language: prefLang,
      });

      if (userError) {
        console.error(`❌ Failed to insert into public.users for ${fullName}: ${userError.message}`);
        errorCount++;
        // Rollback auth user
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        continue;
      }

      // 3. Insert into public.students
      const { error: studentError } = await supabaseAdmin.from('students').insert({
        user_id: authUserId,
        teacher_id: teacherId,
        class_id: classId,
        enrollment_status: 'active',
      });

      if (studentError) {
        console.error(`❌ Failed to insert into public.students for ${fullName}: ${studentError.message}`);
        errorCount++;
        // Rollback both
        await supabaseAdmin.from('users').delete().eq('id', authUserId);
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        continue;
      }

      console.log(`✅ Successfully uploaded: ${fullName} (${phone})`);
      successCount++;
    } catch (err) {
      console.error(`❌ Unexpected error for ${fullName}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n====================================');
  console.log('🎉 UPLOAD COMPLETE');
  console.log(`Total Processed: ${students.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('====================================');
}

uploadStudents();
