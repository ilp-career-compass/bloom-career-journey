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
  const { data: users, error: usersError } = await supabase.from('users').select('*');
  if (usersError) throw usersError;

  console.log("Fetching classes...");
  const { data: classes, error: classesError } = await supabase.from('classes').select('*');
  if (classesError) throw classesError;

  console.log("Fetching teachers...");
  const { data: teachers, error: teachersError } = await supabase.from('teachers').select('*');
  if (teachersError) throw teachersError;

  console.log("Fetching states...");
  const { data: states, error: statesError } = await supabase.from('states').select('*');
  if (statesError) throw statesError;

  const userMap = new Map(users.map((u: any) => [u.id, u]));
  const classMap = new Map(classes.map((c: any) => [c.id, c]));
  const teacherMap = new Map(teachers.map((t: any) => [t.id, t]));
  const stateMap = new Map(states.map((s: any) => [s.id, s]));

  const report = students.map((s: any) => {
    const studentUser = userMap.get(s.user_id) || {};
    const cls = classMap.get(s.class_id) || {};
    const teacher = teacherMap.get(s.teacher_id) || {};
    const teacherUser = userMap.get(teacher.user_id) || {};
    
    // Determine location from student user state_id, fallback to class state_id
    const stateId = studentUser.state_id || cls.state_id;
    const location = stateId ? stateMap.get(stateId)?.state_name || stateMap.get(stateId)?.name : null;

    return {
      student_name: studentUser.full_name || 'Unknown',
      preferred_language: studentUser.preferred_language || 'en',
      location: location || 'Unknown',
      class_name: cls.name || 'Unknown',
      teacher_name: teacherUser.full_name || 'Unknown'
    };
  });

  const outputPath = path.resolve(process.cwd(), 'scratch', 'comprehensive_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  
  console.log(`Generated report for ${report.length} students at ${outputPath}`);
}

main().catch(console.error);
