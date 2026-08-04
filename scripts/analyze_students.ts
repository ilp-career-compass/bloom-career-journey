import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Fetching users and students data...');

  // Get all users from public.users with role student
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, password_hash, created_at')
    .eq('role', 'student');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  // Get auth users to check last sign in
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }

  const authUsers = authData.users;
  const authUserMap = new Map(authUsers.map(u => [u.id, u]));

  let totalStudents = users.length;
  let manuallyUploaded = 0;
  let changedPassword = 0;
  let manuallySignedUp = 0;

  users.forEach((user: any) => {
    const isUploaded = user.password_hash === 'managed_by_supabase_auth';
    const authUser = authUserMap.get(user.id);
    
    // An uploaded user is one created via the script
    if (isUploaded) {
      manuallyUploaded++;
      
      // If they were uploaded but have logged in or updated something, 
      // they might have changed their password. 
      // Supabase tracks password_updated_at or last_sign_in_at.
      // Wait, if password_hash changes in public.users when they update, we check that.
      // But if it stays 'managed_by_supabase_auth', how do we know they verified?
      // Let's check authUser.last_sign_in_at or if they have an identity/verified phone.
    } else {
      // If it's not 'managed_by_supabase_auth', it might be a manual signup
      // or an uploaded user who changed their password and updated this column.
      manuallySignedUp++;
    }
  });
  
  // Let's get a more detailed view by looking at student_auth_credentials as well
  const { data: creds } = await supabase.from('student_auth_credentials').select('*');
  
  console.log(`\n--- Initial Analysis ---`);
  console.log(`Total Student Users in public.users: ${totalStudents}`);
  console.log(`Users with password_hash='managed_by_supabase_auth': ${manuallyUploaded}`);
  console.log(`Users with other password_hash: ${manuallySignedUp}`);
  console.log(`Total in student_auth_credentials: ${creds?.length || 0}`);
  
  // Look for evidence of password change in authUsers
  let uploadedAndLoggedIn = 0;
  let uploadedAndConfirmed = 0;
  
  users.forEach((user: any) => {
    const authUser = authUserMap.get(user.id);
    if (authUser && user.password_hash === 'managed_by_supabase_auth') {
      if (authUser.last_sign_in_at) uploadedAndLoggedIn++;
      if (authUser.phone_confirmed_at) uploadedAndConfirmed++;
    }
  });
  
  console.log(`Uploaded users who have logged in (last_sign_in_at != null): ${uploadedAndLoggedIn}`);
  console.log(`Uploaded users who have confirmed phone: ${uploadedAndConfirmed}`);
}

main().catch(console.error);
