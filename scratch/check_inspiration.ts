import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
  const { data, error } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('assessment_type', 'inspiration')
    .limit(5);

  if (error) {
    console.error('Error fetching inspiration responses:', error);
  } else {
    console.log('Inspiration Responses:');
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
