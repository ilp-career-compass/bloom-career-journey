import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const studentPhone = '+919964454702';
  const password = 'Test@1234';

  console.log(`Logging in as Student: ${studentPhone}...`);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    phone: studentPhone,
    password: password,
  });

  if (authErr || !authData.user) {
    console.error('Student login failed:', authErr?.message);
    return;
  }

  const studentUserId = authData.user.id;
  console.log(`Student login succeeded. User ID: ${studentUserId}`);

  // Fetch the student's profile id
  const { data: studentRow, error: sErr } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', studentUserId)
    .single();

  if (sErr || !studentRow) {
    console.error('Failed to fetch student profile row:', sErr?.message);
    return;
  }

  const studentId = studentRow.id;
  console.log(`Student ID: ${studentId}`);

  // 1. Insert responses for My Inspiration
  const inspirationResponses = {
    video1: {
      videoTitle: 'Video 1',
      question1: 'I liked the part where the person talked about never giving up even when things are hard.',
      question2: 'I liked the way the main person spoke with confidence and kindness.',
      question3: 'I noticed courage, honesty, and hard work in them.',
      question4: 'Their patience can bring a positive change in my life.',
      question5: 'I found the village student relatable because I also come from a small village.',
      question6: 'Yes, I helped my friend when he was sad and that showed kindness.',
      question7: 'If I were that character, I would also help my community.',
      question8: 'The teacher in the video inspired me because she helped every student equally.',
      question9: 'I would like to follow their dedication and honesty in my real life.',
      question10: 'I also noticed that the video showed the importance of education for village children.',
    },
    video2: {
      videoTitle: 'Video 2',
      question1: 'I liked how Dr. Kalam came from a small village and became a great scientist.',
      question2: 'Dr. Kalam spoke very simply and from the heart. I liked that.',
      question3: 'I saw hard work, curiosity, and love for learning in him.',
      question4: 'His love for reading books can bring a positive change in my life.',
      question5: 'I related to the village boy character because I also dream big.',
      question6: 'Yes, I once read extra books to learn about space, like Dr. Kalam did.',
      question7: 'If I were Dr. Kalam, I would build schools in every village.',
      question8: 'Dr. Kalam is an inspiration because he proved that poor students can succeed.',
      question9: 'I would like to follow his habit of reading and learning every day.',
      question10: 'The video also showed that teachers play a very important role in our lives.',
    },
    summary: {
      question1: 'Hard work, courage, patience, dedication, love for learning',
      question2: 'Laziness, excuses, wasting time, giving up too easily',
      question3: 'Both video characters and my family members show dedication to their goals',
    }
  };

  console.log('Inserting Inspiration responses...');
  const { data: respRow, error: respErr } = await supabase
    .from('assessment_responses')
    .insert({
      student_id: studentId,
      assessment_type: 'inspiration',
      assessment_title: 'My Inspiration',
      responses: inspirationResponses,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (respErr || !respRow) {
    console.error('Failed to insert Inspiration responses:', respErr?.message);
    return;
  }

  const responseId = respRow.id;
  console.log(`Inserted responses with ID: ${responseId}`);

  // Create AI summary
  const aiSummary = {
    question1: 'The student shows high inspiration from community-oriented characters and Dr. Kalam. Key values include courage, dedication, and service to others.',
    question2: 'Main strengths identified: Creativity, empathy, and eagerness to learn. Goal: Wants to contribute to village development.',
    question3: 'Holland Code hint: Social and Investigative characteristics observed.'
  };

  console.log('Creating AI Summary...');
  const { data: summaryId, error: summaryErr } = await supabase.rpc('create_ai_summary', {
    p_assessment_response_id: responseId,
    p_ai_summary: aiSummary,
    p_student_user_id: studentUserId,
  });

  if (summaryErr) {
    console.error('Failed to create AI Summary:', summaryErr.message);
  } else {
    console.log(`Created AI Summary with ID: ${summaryId}`);
  }
}

main().catch(console.error);
