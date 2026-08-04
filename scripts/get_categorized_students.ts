import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Fetching students...");
  const { data: students, error: studentsError } = await supabase.from('students').select('*');
  if (studentsError) throw studentsError;

  console.log("Fetching users...");
  const { data: users, error: usersError } = await supabase.from('users').select('*').eq('role', 'student');
  if (usersError) throw usersError;

  console.log("Fetching teachers...");
  const { data: teachers, error: teachersError } = await supabase.from('teachers').select('*');
  if (teachersError) throw teachersError;

  console.log("Fetching states...");
  const { data: states, error: statesError } = await supabase.from('states').select('*');
  if (statesError) throw statesError;

  // We need all users to get teacher names
  const { data: allUsers, error: allUsersError } = await supabase.from('users').select('*');
  if (allUsersError) throw allUsersError;

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) throw authError;

  const authUsers = authData.users;
  const authUserMap = new Map(authUsers.map(u => [u.id, u]));

  const allUserMap = new Map(allUsers.map((u: any) => [u.id, u]));
  const teacherMap = new Map(teachers.map((t: any) => [t.id, t]));
  const stateMap = new Map(states.map((s: any) => [s.id, s]));
  const studentMap = new Map(students.map((s: any) => [s.user_id, s]));

  const manuallyUploaded: any[] = [];
  const manuallySignedUp: any[] = [];
  const verifiedAndLoggedIn: any[] = [];

  users.forEach((studentUser: any) => {
    const studentRecord = studentMap.get(studentUser.id) || {};
    const teacher = teacherMap.get(studentRecord.teacher_id) || {};
    const teacherUser = allUserMap.get(teacher.user_id) || {};
    const authUser = authUserMap.get(studentUser.id);
    
    // State logic
    const stateId = studentUser.state_id;
    const location = stateId ? stateMap.get(stateId)?.state_name || stateMap.get(stateId)?.name : 'Unknown';

    const info = {
      student_name: studentUser.full_name || 'Unknown',
      preferred_language: studentUser.preferred_language || 'en',
      teacher: teacherUser.full_name || 'Unknown',
      state: location || 'Unknown'
    };

    const isUploaded = studentUser.password_hash === 'managed_by_supabase_auth';
    const hasLoggedIn = authUser && authUser.last_sign_in_at != null;

    if (isUploaded) {
      if (hasLoggedIn) {
        verifiedAndLoggedIn.push(info);
      } else {
        manuallyUploaded.push(info);
      }
    } else {
      manuallySignedUp.push(info);
    }
  });

  const report = {
    "Verified and Logged In": {
      count: verifiedAndLoggedIn.length,
      students: verifiedAndLoggedIn
    },
    "Manually Uploaded (Not yet logged in)": {
      count: manuallyUploaded.length,
      students: manuallyUploaded
    },
    "Manually Signed Up": {
      count: manuallySignedUp.length,
      students: manuallySignedUp
    }
  };

  const outputPath = path.resolve(process.cwd(), 'scratch', 'categorized_students_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  
  console.log(`Generated categorized report at ${outputPath}`);
}

main().catch(console.error);
