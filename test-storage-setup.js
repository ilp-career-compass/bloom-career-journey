// Test script to verify Supabase Storage buckets are set up correctly
// Run this in the browser console after logging in

import { supabase } from './src/integrations/supabase/client.js';

async function testStorageSetup() {
  console.log('🧪 Testing Supabase Storage setup...');
  
  try {
    // Test 1: Check if avatars bucket exists
    console.log('📁 Checking avatars bucket...');
    const { data: avatarsData, error: avatarsError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 });
    
    if (avatarsError) {
      console.error('❌ Avatars bucket error:', avatarsError);
      if (avatarsError.message?.includes('Bucket not found')) {
        console.error('🚨 AVATARS BUCKET NOT FOUND! Please run the migration or create it manually.');
        return false;
      }
    } else {
      console.log('✅ Avatars bucket exists');
    }
    
    // Test 2: Check if assessment-audio bucket exists
    console.log('📁 Checking assessment-audio bucket...');
    const { data: audioData, error: audioError } = await supabase.storage
      .from('assessment-audio')
      .list('', { limit: 1 });
    
    if (audioError) {
      console.error('❌ Assessment-audio bucket error:', audioError);
      if (audioError.message?.includes('Bucket not found')) {
        console.error('🚨 ASSESSMENT-AUDIO BUCKET NOT FOUND! Please run the migration or create it manually.');
        return false;
      }
    } else {
      console.log('✅ Assessment-audio bucket exists');
    }
    
    // Test 3: Try to upload a small test file to avatars
    console.log('📤 Testing avatar upload...');
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testPath = `test/${Date.now()}_test.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testPath, testBlob, { upsert: true });
    
    if (uploadError) {
      console.error('❌ Avatar upload test failed:', uploadError);
      return false;
    } else {
      console.log('✅ Avatar upload test successful');
      
      // Clean up test file
      await supabase.storage.from('avatars').remove([testPath]);
      console.log('🧹 Test file cleaned up');
    }
    
    console.log('🎉 All storage tests passed!');
    return true;
    
  } catch (error) {
    console.error('💥 Storage test failed:', error);
    return false;
  }
}

// Export for use in browser console
window.testStorageSetup = testStorageSetup;

console.log('💡 To test storage setup, run: testStorageSetup()');
