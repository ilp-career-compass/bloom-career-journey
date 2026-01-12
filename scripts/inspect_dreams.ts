
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath, override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectDreams() {
    console.log('Fetching dreams questions via RPC...');

    const { data, error } = await supabase.rpc('get_dreams_questions');

    if (error) {
        console.error('Error fetching dreams questions:', error);
    } else {
        fs.writeFileSync('dreams_questions.json', JSON.stringify(data, null, 2));
        console.log('Written to dreams_questions.json');

        // Analyze sections
        const sections: Record<string, number> = {};
        const ids = new Set();
        const duplicates = [];

        if (Array.isArray(data)) {
            data.forEach((q: any) => {
                sections[q.section] = (sections[q.section] || 0) + 1;
                if (ids.has(q.id)) {
                    duplicates.push(q.id);
                }
                ids.add(q.id);
            });
        }

        console.log('Question counts by section:', sections);
        if (duplicates.length > 0) {
            console.error('⚠️ Found Duplicate IDs:', duplicates);
        } else {
            console.log('✅ No duplicate IDs found.');
        }
    }
}

inspectDreams();
