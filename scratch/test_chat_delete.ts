import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Signing in as student...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    phone: '+919964454702',
    password: 'Test@1234',
  });

  if (authError) {
    console.error('Auth failed:', authError.message);
    return;
  }

  const userId = authData.user?.id;
  console.log('Auth succeeded. User ID:', userId);

  // 1. Fetch some messages of this user
  console.log('\nFetching messages for this user...');
  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('sender_user_id', userId)
    .limit(5);

  if (msgError) {
    console.error('Failed to fetch messages:', msgError.message);
    return;
  }

  console.log(`Found ${messages?.length || 0} messages sent by this user.`);
  if (!messages || messages.length === 0) {
    console.log('No messages found. Creating a test message first...');
    // We need a channel first
    const { data: studentData } = await supabase
      .from('students')
      .select('id, teacher_id')
      .eq('user_id', userId)
      .single();

    if (!studentData || !studentData.teacher_id) {
      console.error('No student or teacher data found.');
      return;
    }

    const { data: channelData, error: channelError } = await supabase
      .rpc('get_or_create_chat_channel', {
        p_student_id: studentData.id,
        p_teacher_id: studentData.teacher_id,
      });

    if (channelError) {
      console.error('Failed to get/create channel:', channelError.message);
      return;
    }

    const channelId = channelData.id;
    console.log('Using channel:', channelId);

    const { data: insertData, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        sender_user_id: userId,
        content: 'Test message to delete',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert test message:', insertError.message);
      return;
    }

    messages.push(insertData);
    console.log('Inserted message:', insertData.id);
  }

  const testMessage = messages[0];
  console.log(`Using message ID: ${testMessage.id} content: "${testMessage.content}"`);

  // Try direct delete via table first to see what it does
  console.log('\n--- Test 1: Direct table DELETE ---');
  const { error: directDeleteErr } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', testMessage.id);

  if (directDeleteErr) {
    console.log('Direct delete returned error:', directDeleteErr.message, directDeleteErr);
  } else {
    console.log('Direct delete returned success (no error). checking if row still exists...');
    const { data: checkMsg } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('id', testMessage.id)
      .maybeSingle();
    console.log('Does row exist?', !!checkMsg);
  }

  // Try RPC edit_chat_message
  console.log('\n--- Test 2: RPC edit_chat_message ---');
  const { data: editData, error: editError } = await supabase
    .rpc('edit_chat_message', {
      p_message_id: testMessage.id,
      p_new_content: 'Edited via RPC',
    } as any);

  if (editError) {
    console.log('RPC edit returned error:', editError.message, editError);
  } else {
    console.log('RPC edit success value:', editData);
  }

  // Try RPC delete_chat_message
  console.log('\n--- Test 3: RPC delete_chat_message ---');
  const { data: deleteData, error: deleteError } = await supabase
    .rpc('delete_chat_message', {
      p_message_id: testMessage.id,
    } as any);

  if (deleteError) {
    console.log('RPC delete returned error:', deleteError.message, deleteError);
  } else {
    console.log('RPC delete success value:', deleteData);
  }
}

main().catch(console.error);
