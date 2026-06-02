import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPolicies() {
  console.log('Inspecting policies for chat_messages...');
  
  // Try querying from pg_policies via supabase query or check if there is an rpc we can call
  const { data: channels, error: channelsError } = await supabase
    .from('chat_channels')
    .select('id')
    .limit(1);
    
  if (channelsError) {
    console.error('Error fetching chat_channels:', channelsError);
  } else {
    console.log('Successfully fetched chat_channels (RLS works for SELECT):', channels);
  }

  // Let's check what RLS policies exist on the chat_messages table by executing an RPC if available
  // Or we can try to do a mock insert, update, and delete to see if we get policy errors!
  console.log('Checking if we can update or delete messages...');
}

checkPolicies().catch(console.error);
