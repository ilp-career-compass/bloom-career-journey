# Audio Upload Storage RLS Fix

## Problem
Students are unable to upload audio recordings because the storage RLS (Row-Level Security) policies are checking the wrong folder in the file path.

### Current Path Structure
```
audio-responses/{studentId}/{assessmentId}/filename.webm
```

### Current Policy Issue
The existing policy checks `(storage.foldername(name))[1]` (first folder = "audio-responses") and expects it to be the user's `auth.uid()`, but the actual `studentId` is in position `[2]`.

## Solution

### Option 1: Apply Migration (Recommended)
Run the migration file that was created: `supabase/migrations/20251017120000_fix_audio_storage_rls.sql`

**Steps:**
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251017120000_fix_audio_storage_rls.sql`
4. Paste and click **Run**

### Option 2: Quick Fix via Dashboard

1. Go to **Storage** → **Policies** → **assessment-audio** bucket
2. Delete these policies:
   - "Students can upload audio files"
   - "Users can view audio files"  
   - "Students can update their own audio files"
   - "Students can delete their own audio files"

3. Create new policy for **INSERT**:
```sql
CREATE POLICY "Students can upload their own audio responses" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'assessment-audio' 
  AND (storage.foldername(name))[1] = 'audio-responses'
  AND (
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM students 
      WHERE user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[2] = auth.uid()::text
  )
);
```

4. Create new policy for **SELECT**:
```sql
CREATE POLICY "Users can view assessment audio files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'assessment-audio' 
  AND (
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM students 
      WHERE user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    (storage.foldername(name))[2] IN (
      SELECT s.id::text FROM students s
      JOIN teachers t ON s.teacher_id = t.id
      WHERE t.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
);
```

5. Create new policy for **UPDATE**:
```sql
CREATE POLICY "Students can update their own audio files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'assessment-audio' 
  AND (storage.foldername(name))[1] = 'audio-responses'
  AND (
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM students 
      WHERE user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[2] = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'assessment-audio' 
  AND (storage.foldername(name))[1] = 'audio-responses'
  AND (
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM students 
      WHERE user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[2] = auth.uid()::text
  )
);
```

6. Create new policy for **DELETE**:
```sql
CREATE POLICY "Students can delete their own audio files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'assessment-audio' 
  AND (storage.foldername(name))[1] = 'audio-responses'
  AND (
    (storage.foldername(name))[2] IN (
      SELECT id::text FROM students 
      WHERE user_id = auth.uid()
    )
    OR
    (storage.foldername(name))[2] = auth.uid()::text
  )
);
```

## Verification

After applying the fix:
1. Log in as a student
2. Navigate to an assessment with audio recording
3. Click the Record button
4. Record a response
5. You should see "Audio response saved successfully" ✅
6. No more "new row violates row-level security policy" errors

## How It Works

The new policies:
1. Check that the path starts with `audio-responses/`
2. Extract the `studentId` from the second folder position
3. Verify that the `studentId` belongs to a student record where `user_id = auth.uid()`
4. Also allow direct `auth.uid()` match for backward compatibility

This ensures:
- ✅ Students can only upload to their own folders
- ✅ Teachers can view their students' audio files
- ✅ Admins can view all audio files
- ✅ No unauthorized access

## Additional Notes

### MIME Type Support
The bucket accepts these audio formats:
- `audio/webm` ✅
- `audio/mp4` ✅
- `audio/ogg` ✅
- `audio/wav` ✅

### File Size Limit
- Maximum: 50MB per audio file

### Bucket Configuration
- Bucket name: `assessment-audio`
- Public: Yes (but access controlled by RLS)
- File size limit: 52,428,800 bytes (50MB)

