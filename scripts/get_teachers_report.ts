import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Fetching users with role teacher...");
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, preferred_language, state_id')
    .eq('role', 'teacher');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  console.log("Fetching states...");
  const { data: states, error: statesError } = await supabase
    .from('states')
    .select('id, state_name');

  if (statesError) {
    console.error('Error fetching states:', statesError);
    return;
  }

  const stateMap = new Map(states.map((s: any) => [s.id, s.state_name]));

  const report = users.map((u: any) => {
    const location = u.state_id ? stateMap.get(u.state_id) : 'Unknown';
    return {
      teacher_name: u.full_name || 'Unknown',
      preferred_language: u.preferred_language || 'en',
      location: location || 'Unknown',
    };
  });

  const outputPath = path.resolve(process.cwd(), 'scratch', 'teachers_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  
  console.log(`Generated report for ${report.length} teachers at ${outputPath}`);
}

main().catch(console.error);
