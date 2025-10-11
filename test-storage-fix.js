// Test script to verify storage buckets are working
// Run this in your browser console after setting up the buckets

console.log('🧪 Testing Supabase Storage setup...');

// Test 1: Check if avatars bucket exists
async function testAvatarsBucket() {
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 });
    
    if (error) {
      console.error('❌ Avatars bucket error:', error);
      return false;
    } else {
      console.log('✅ Avatars bucket exists');
      return true;
    }
  } catch (err) {
    console.error('❌ Avatars bucket test failed:', err);
    return false;
  }
}

// Test 2: Try to upload a small test file
async function testUpload() {
  try {
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testPath = `test/${Date.now()}_test.txt`;
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(testPath, testBlob, { upsert: true });
    
    if (error) {
      console.error('❌ Upload test failed:', error);
      return false;
    } else {
      console.log('✅ Upload test successful');
      
      // Clean up test file
      await supabase.storage.from('avatars').remove([testPath]);
      console.log('🧹 Test file cleaned up');
      return true;
    }
  } catch (err) {
    console.error('❌ Upload test failed:', err);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting storage tests...');
  
  const bucketTest = await testAvatarsBucket();
  if (!bucketTest) {
    console.error('💥 Bucket test failed - storage not set up correctly');
    return false;
  }
  
  const uploadTest = await testUpload();
  if (!uploadTest) {
    console.error('💥 Upload test failed - permissions not set up correctly');
    return false;
  }
  
  console.log('🎉 All storage tests passed! Profile pictures should work now.');
  return true;
}

// Export for browser console
window.testStorage = runAllTests;

console.log('💡 To test storage setup, run: testStorage()');
