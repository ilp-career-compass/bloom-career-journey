import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // Get students joined since 28th July from students table (which we know has 37)
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('user_id, created_at')
    .gte('created_at', '2026-07-28T00:00:00Z')
    .order('created_at', { ascending: true });

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    return;
  }

  const userIds = students.map((s: any) => s.user_id);
  
  // Now fetch user data
  let users: any[] = [];
  if (userIds.length > 0) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, preferred_language, state_id')
      .in('id', userIds);
      
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    users = userData || [];
  }

  // Also fetch states to get the location names
  const { data: states, error: statesError } = await supabase
    .from('states')
    .select('id, state_name');

  const stateMap: Record<string, string> = {};
  if (!statesError && states) {
    states.forEach((s: any) => {
      stateMap[s.id] = s.state_name;
    });
  }

  const userMap = new Map(users.map(u => [u.id, u]));

  const result = students.map((s: any) => {
    // Extract date (YYYY-MM-DD) from students table
    const date = s.created_at ? s.created_at.split('T')[0] : 'Unknown';
    const user = userMap.get(s.user_id) || {};
    
    return {
      date: date,
      id: s.user_id,
      location: user.state_id && stateMap[user.state_id] ? stateMap[user.state_id] : (user.state_id || 'Unknown'),
      language: user.preferred_language || 'en'
    };
  });

  // Write to a JSON file in the scratch directory or output it
  const outputPath = path.resolve(process.cwd(), 'scratch', 'datewise_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  
  console.log(`Report generated with ${result.length} records at ${outputPath}`);
}

main().catch(console.error);
