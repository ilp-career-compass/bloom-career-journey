import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLang(lang: string) {
  console.log(`\n================ Testing Language: ${lang} ================`);
  
  const { data: questions, error: qError } = await supabase.rpc('get_hobbies_questions_i18n', { p_lang: lang } as any);
  if (qError) {
    console.error(`Error in get_hobbies_questions_i18n (${lang}):`, qError);
  } else {
    console.log(`Questions count (${lang}):`, questions?.length);
  }

  const { data: summaryQuestions, error: summaryError } = await supabase.rpc('get_hobbies_summary_questions_i18n', { p_lang: lang } as any);
  if (summaryError) {
    console.error(`Error in get_hobbies_summary_questions_i18n (${lang}):`, summaryError);
  } else {
    console.log(`Summary Questions count (${lang}):`, summaryQuestions?.length);
  }
}

async function run() {
  await testLang('en');
  await testLang('kn');
  await testLang('hi');
  await testLang('ta');
}

run();
