import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Querying distinct resource_type from content_translations...');
  const { data, error } = await supabase
    .from('content_translations')
    .select('resource_type');
    
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  const types = Array.from(new Set(data.map(item => item.resource_type)));
  console.log('Distinct resource types:', types);
  
  console.log('\nChecking for any holland translations...');
  const { data: hollandData, error: hollandErr } = await supabase
    .from('content_translations')
    .select('*')
    .ilike('resource_type', '%holland%');
    
  if (hollandErr) {
    console.error('Holland Query Error:', hollandErr.message);
  } else {
    console.log(`Found ${hollandData?.length || 0} holland translations:`);
    console.log(JSON.stringify(hollandData?.slice(0, 10), null, 2));
  }
}

main().catch(console.error);
