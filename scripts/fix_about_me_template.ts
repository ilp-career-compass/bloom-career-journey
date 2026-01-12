
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

async function fixTemplate() {
    console.log('Fetching assessment_summary_templates for about_me...');

    const { data, error } = await supabase
        .from('assessment_summary_templates')
        .select('*')
        .eq('assessment_type', 'about_me')
        .single();

    if (error || !data) {
        console.error('Error fetching template:', error);
        return;
    }

    const questions = data.summary_questions;

    // Helper to process a language block
    const processLang = (langBlock: any) => {
        if (!langBlock) return langBlock;

        const newBlock: any = {};
        if (langBlock.header1) newBlock.header1 = langBlock.header1;

        // 1 to 6 copy as is
        for (let i = 1; i <= 6; i++) {
            if (langBlock[`question${i}`]) newBlock[`question${i}`] = langBlock[`question${i}`];
        }

        // Split 7
        const q7Old = langBlock.question7;
        // We expect split by '?' usually, but let's be safer and use the manual strings I identified
        // Actually, splitting by '?' might be fragile if there are multiple.
        // The structure is "Q1? Q2?".
        // I will use regex or index.

        // For English
        if (q7Old.includes("Which school activity do I find difficult even though I must do it? Which activity do I find difficult to manage after school or outside school?")) {
            newBlock.question7 = "Which school activity do I find difficult even though I must do it?";
            newBlock.question8 = "Which activity do I find difficult to manage after school or outside school?";
        }
        // For Kannada
        else if (q7Old.includes("ಶಾಲೆಯಲ್ಲಿ ಮಾಡಬೇಕಾದರೂ ನನಗೆ ಕಷ್ಟವಾಗುವ ಚಟುವಟಿಕೆ ಯಾವುದು? ಶಾಲೆಯ ನಂತರ ಅಥವಾ ಶಾಲೆ ಹೊರಗೆ ನನಗೆ ನಿರ್ವಹಿಸಲು ಕಷ್ಟವಾಗುವ ಚಟುವಟಿಕೆ ಯಾವುದು?")) {
            newBlock.question7 = "ಶಾಲೆಯಲ್ಲಿ ಮಾಡಬೇಕಾದರೂ ನನಗೆ ಕಷ್ಟವಾಗುವ ಚಟುವಟಿಕೆ ಯಾವುದು?";
            newBlock.question8 = "ಶಾಲೆಯ ನಂತರ ಅಥವಾ ಶಾಲೆ ಹೊರಗೆ ನನಗೆ ನಿರ್ವಹಿಸಲು ಕಷ್ಟವಾಗುವ ಚಟುವಟಿಕೆ ಯಾವುದು?";
        }
        // For Tamil
        else if (q7Old.includes("பள்ளியில் செய்ய வேண்டியிருந்தாலும் எனக்கு கடினமாக இருக்கும் செயல் எது? பள்ளிக்கு பிறகு அல்லது பள்ளிக்கு வெளியே செய்ய கடினமாக இருப்பது எது?")) {
            newBlock.question7 = "பள்ளியில் செய்ய வேண்டியிருந்தாலும் எனக்கு கடினமாக இருக்கும் செயல் எது?";
            newBlock.question8 = "பள்ளிக்கு பிறகு அல்லது பள்ளிக்கு வெளியே செய்ய கடினமாக இருப்பது எது?";
        } else {
            console.warn('Does not match expected combined string, trying naive split by ?');
            const parts = q7Old.split('?').filter((s: string) => s.trim().length > 0);
            if (parts.length >= 2) {
                newBlock.question7 = parts[0].trim() + '?';
                newBlock.question8 = parts[1].trim() + '?';
            } else {
                // Fallback
                newBlock.question7 = q7Old;
                newBlock.question8 = "Unknown (Split failed)";
            }
        }

        // Shift 8 to N (which is now 9 to N+1)
        // Original has 8 to 13.
        // New will have 9 to 14.
        for (let i = 8; i <= 13; i++) {
            if (langBlock[`question${i}`]) {
                newBlock[`question${i + 1}`] = langBlock[`question${i}`];
            }
        }

        return newBlock;
    };

    const newQuestions = {
        en: processLang(questions.en),
        kn: processLang(questions.kn),
        ta: processLang(questions.ta)
    };

    console.log('New questions structure (en):', JSON.stringify(newQuestions.en, null, 2));

    // Update DB
    const { error: updateError } = await supabase
        .from('assessment_summary_templates')
        .update({ summary_questions: newQuestions })
        .eq('id', data.id);

    if (updateError) {
        console.error('Error updating template:', updateError);
    } else {
        console.log('✅ Template updated successfully!');
    }
}

fixTemplate();
