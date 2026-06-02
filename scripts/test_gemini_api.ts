import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vvnogvhdkkevfwcdlwsr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

console.log('SUPABASE_URL:', SUPABASE_URL);

const STUDENT_EMAIL = 'student_en@ilp.test';
const STUDENT_PASSWORD = 'Test@1234';

async function main() {
  console.log('Signing in as student...');
  const studentClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: studentAuth, error: studentAuthErr } = await studentClient.auth.signInWithPassword({
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
  });

  if (studentAuthErr || !studentAuth.user) {
    console.error('Student sign-in failed:', studentAuthErr?.message);
    process.exit(1);
  }
  console.log('Student signed in successfully! User ID:', studentAuth.user.id);

  console.log('Calling gemini-proxy...');
  const systemPrompt = 'You are a career guidance assistant. Reply in simple English.';
  const contents = [
    {
      role: 'user',
      parts: [{ text: 'Which career suits me?' }]
    }
  ];

  const requestBody = {
    model: 'gemini-2.5-flash',
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    },
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  };

  const { data, error } = await studentClient.functions.invoke('gemini-proxy', {
    body: requestBody,
  });

  if (error) {
    console.error('Function invoke error:', error);
  } else {
    console.log('Function invoke success! Data:', JSON.stringify(data, null, 2));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
});
