
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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    console.log('Available keys starting with VITE_:', Object.keys(process.env).filter(k => k.startsWith('VITE_')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateQuestions() {
    console.log('🔄 Updating Career Guidance Tools questions...');

    // 1. Delete existing questions
    const { error: deleteError } = await supabase
        .from('career_guidance_tools_questions')
        .delete()
        .neq('sequence_number', -1);

    if (deleteError) {
        console.error('❌ Error deleting existing questions:', deleteError);
        if (deleteError.code === '42501') {
            console.error('⚠️ Permission denied.');
        }
        return;
    }
    console.log('🗑️  Existing questions deleted.');

    // 2. Insert new questions
    const newQuestions = [
        {
            sequence_number: 1,
            question_type: 'textarea',
            question_text: 'Before seeing the career chart and career guide book, did you know that there are so many different careers and courses to choose from?',
            help_text: 'Did you know there are many careers and courses?'
        },
        {
            sequence_number: 2,
            question_type: 'textarea',
            question_text: 'List 5 careers you learned about after the career guidance class.',
            help_text: 'Name 5 careers you learned after the career guidance class'
        },
        {
            sequence_number: 3,
            question_type: 'textarea',
            question_text: 'List 2 careers from the career chart that are easiest or most reachable.\n\n(Example: To become a teacher, you can take certain subjects in PU, then complete B.Sc / M.Sc, and become a teacher.)',
            help_text: 'Easiest / Most Reachable Careers:\nTeacher – PU → B.Sc/M.Sc → Teacher\nNurse – PU Science → B.Sc Nursing → Nurse'
        },
        {
            sequence_number: 4,
            question_type: 'textarea',
            question_text: 'For the job/career you are interested in, look at the career chart and career guide book.\nWrite step by step the process to progress, including:\nRequired education\nJob opportunities\nSkills needed\nTraining or courses (2–3 hours per day) to improve',
            help_text: 'How to get your career: Courses → Job → Skills → Practice'
        },
        {
            sequence_number: 5,
            question_type: 'textarea',
            question_text: 'Visit the ILP website and list all the information needed for career guidance.',
            help_text: 'Visit ILP Website — Information Needed'
        },
        {
            sequence_number: 6,
            question_type: 'checkbox',
            question_text: 'Is the ILP app available on the Android Play Store? – Yes / No',
            help_text: 'ILP app on Android Play Store?'
        },
        {
            sequence_number: 7,
            question_type: 'input',
            question_text: 'Write the ILP WhatsApp chat link/number',
            help_text: 'ILP WhatsApp chatbot / Link'
        }
    ];

    const { data, error: insertError } = await supabase
        .from('career_guidance_tools_questions')
        .insert(newQuestions)
        .select();

    if (insertError) {
        console.error('❌ Error inserting updated questions:', insertError);
        return;
    }

    console.log('✅ Successfully inserted', data?.length, 'questions.');
}

updateQuestions();
