import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: tables, error } = await supabase.rpc('get_tables_info');
  // If rpc doesn't exist we'll have to find another way.
  
  if (error) {
    console.error('Error fetching tables via RPC:', error.message);
    
    // We can try to query one known table's relations if we don't know the list.
    // Or let's just grep the codebase for ".from("
  } else {
    console.log(tables);
  }
}

main().catch(console.error);
