
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

async function inspectTemplates() {
    console.log('Fetching assessment_summary_templates for about_me...');

    const { data, error } = await supabase
        .from('assessment_summary_templates')
        .select('*')
        .eq('assessment_type', 'about_me');

    if (error) {
        console.error('Error fetching table:', error);
    } else {
        fs.writeFileSync('about_me_templates.json', JSON.stringify(data, null, 2));
        console.log('Written to about_me_templates.json');
        if (data && data.length > 0) {
            console.log('First template ID:', data[0].id);
        }
    }
}

inspectTemplates();
