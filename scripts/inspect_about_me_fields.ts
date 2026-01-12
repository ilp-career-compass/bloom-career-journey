
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

// Load .env first
if (fs.existsSync(envPath)) {
    console.log('Loading .env');
    dotenv.config({ path: envPath });
}

// Override with .env.local if exists
if (fs.existsSync(envLocalPath)) {
    console.log('Loading .env.local');
    dotenv.config({ path: envLocalPath, override: true });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectFields() {
    console.log('Fetching about_me_fields...');

    const { data, error } = await supabase
        .from('about_me_fields')
        .select('*')
        .order('sequence_number');

    if (error) {
        console.error('Error fetching table:', error);
        // Fallback to RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_about_me_fields');
        if (rpcError) {
            console.error('Error calling RPC:', rpcError);
        } else {
            fs.writeFileSync('about_me_fields.json', JSON.stringify(rpcData, null, 2));
            console.log('Written to about_me_fields.json');
        }
    } else {
        fs.writeFileSync('about_me_fields.json', JSON.stringify(data, null, 2));
        console.log('Written to about_me_fields.json');
    }
}

inspectFields();
