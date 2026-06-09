const fs = require('fs');
const path = require('path');

// Basic parser for .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*["']?(.*?)["']?\s*$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

async function run() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Fetching all users to find students...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, role');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  console.log(`Found ${users.length} users:`);
  users.forEach(u => console.log(`- ID: ${u.id}, Name: ${u.full_name}, Email: ${u.email}, Role: ${u.role}`));

  // Fetch all students
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, user_id');
  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    return;
  }
  console.log(`Found ${students.length} students:`);
  students.forEach(s => console.log(`- Student ID: ${s.id}, User ID: ${s.user_id}`));

  for (const student of students) {
    const studentUser = users.find(u => u.id === student.user_id);
    const studentName = studentUser ? studentUser.full_name : 'Unknown';
    console.log(`\n========================================`);
    console.log(`Student: ${studentName} (ID: ${student.id}, User ID: ${student.user_id})`);

    // Fetch assessment_responses
    const { data: responses, error: respError } = await supabase
      .from('assessment_responses')
      .select('assessment_type, review_status, completed_at, responses')
      .eq('student_id', student.id);

    if (respError) {
      console.error('  Error fetching responses:', respError);
    } else {
      console.log(`  Assessment Responses count: ${responses.length}`);
      responses.forEach(r => {
        console.log(`  - Type: ${r.assessment_type}`);
        console.log(`    Status: ${r.review_status}`);
        console.log(`    Completed: ${r.completed_at}`);
        if (r.assessment_type === 'hobbies') {
          console.log(`    Responses:`, JSON.stringify(r.responses, null, 2));
        }
      });
    }

    // Fetch profile_card_cache
    const { data: cache, error: cacheError } = await supabase
      .from('profile_card_cache')
      .select('assessment_type, approval_status, keywords, generated_at')
      .eq('student_id', student.user_id);

    if (cacheError) {
      console.error('  Error fetching profile_card_cache:', cacheError);
    } else {
      console.log(`  Profile Card Cache count: ${cache.length}`);
      cache.forEach(c => {
        console.log(`  - Type: ${c.assessment_type}`);
        console.log(`    Approval Status: ${c.approval_status}`);
        console.log(`    Generated: ${c.generated_at}`);
        console.log(`    Keywords:`, JSON.stringify(c.keywords, null, 2));
      });
    }
  }
}

run().catch(console.error);
