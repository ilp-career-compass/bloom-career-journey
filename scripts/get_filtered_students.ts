import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Fetching data...");
  const { data: students } = await supabase.from('students').select('*');
  const { data: users } = await supabase.from('users').select('*').eq('role', 'student');
  const { data: teachers } = await supabase.from('teachers').select('*');
  const { data: states } = await supabase.from('states').select('*');
  const { data: allUsers } = await supabase.from('users').select('*');
  const { data: authData } = await supabase.auth.admin.listUsers();

  const authUsers = authData?.users || [];
  const authUserMap = new Map(authUsers.map(u => [u.id, u]));
  const allUserMap = new Map((allUsers || []).map((u: any) => [u.id, u]));
  const teacherMap = new Map((teachers || []).map((t: any) => [t.id, t]));
  const stateMap = new Map((states || []).map((s: any) => [s.id, s]));
  const studentMap = new Map((students || []).map((s: any) => [s.user_id, s]));

  const manuallyUploaded: any[] = [];
  const manuallySignedUp: any[] = [];
  const verifiedAndLoggedIn: any[] = [];

  const studentsToIgnore = ['Sai Sree', 'Student K', 'Student Sam', 'Student B', 'Student P ', 'Student P', 'Sharmi KR'];
  const teachersToIgnore = ['Madhumita R', 'Rajesh', 'swapna priya', 'madhu'];

  (users || []).forEach((studentUser: any) => {
    const studentRecord = studentMap.get(studentUser.id) || {};
    const teacher = teacherMap.get(studentRecord.teacher_id) || {};
    const teacherUser = allUserMap.get(teacher.user_id) || {};
    const authUser = authUserMap.get(studentUser.id);
    
    const stateId = studentUser.state_id;
    const location = stateId ? stateMap.get(stateId)?.state_name || stateMap.get(stateId)?.name : 'Unknown';

    const studentName = studentUser.full_name?.trim() || 'Unknown';
    const teacherName = teacherUser.full_name?.trim() || 'Unknown';

    // Ignore specified students
    if (studentsToIgnore.some(ignored => studentName.toLowerCase() === ignored.toLowerCase().trim())) {
      return;
    }
    // Ignore specified teachers
    if (teachersToIgnore.some(ignored => teacherName.toLowerCase().includes(ignored.toLowerCase()))) {
      return;
    }

    const info = {
      student_name: studentName,
      preferred_language: studentUser.preferred_language || 'en',
      teacher: teacherName,
      state: location || 'Unknown'
    };

    const isUploaded = studentUser.password_hash === 'managed_by_supabase_auth';
    const hasLoggedIn = authUser && authUser.last_sign_in_at != null;

    // Use enrollment_status for better classification
    if (studentRecord.enrollment_status === 'pending') {
      manuallySignedUp.push(info);
    } else {
      if (hasLoggedIn) {
        verifiedAndLoggedIn.push(info);
      } else {
        manuallyUploaded.push(info);
      }
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
    "Manually Signed Up (Pending)": {
      count: manuallySignedUp.length,
      students: manuallySignedUp
    }
  };

  const outputPath = path.resolve(process.cwd(), 'scratch', 'filtered_students_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  
  console.log(`Generated filtered report at ${outputPath}`);
}

main().catch(console.error);
