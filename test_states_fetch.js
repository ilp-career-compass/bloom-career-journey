import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vvnogvhdkkevfwcdlwsr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY is not defined in environment');
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  console.log('Attempting to fetch states anonymously with orgs join...');
  const { data, error } = await supabase
    .from('states')
    .select('id, state_name, state_code, org_id, orgs(name)');

  if (error) {
    console.error('❌ Fetch failed with error:', error);
  } else {
    console.log('✅ Fetch succeeded! Number of states fetched:', data.length);
    if (data.length > 0) {
      console.log('First state example:', data[0]);
    } else {
      console.log('No states returned (the table might be empty or policies return empty array).');
    }
  }
}

testFetch();
