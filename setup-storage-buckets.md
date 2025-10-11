# Storage Buckets Setup Guide

## Issue: "Bucket not found" Error

The "Bucket not found" error occurs when trying to upload profile pictures because the Supabase Storage buckets haven't been created yet.

## Solution

### Option 1: Run the Migration (Recommended)
Run the migration script to automatically create the buckets:

```bash
# Apply the migration
supabase db push
```

### Option 2: Manual Setup via Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to Storage section

2. **Create Avatars Bucket**
   - Click "New bucket"
   - Name: `avatars`
   - Make it public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

3. **Create Assessment Audio Bucket**
   - Click "New bucket"
   - Name: `assessment-audio`
   - Make it public: ✅ Yes
   - File size limit: 50MB
   - Allowed MIME types: `audio/webm, audio/mp4, audio/ogg, audio/wav`

4. **Set Storage Policies**
   - Go to Authentication > Policies
   - Add the policies from the migration script

### Option 3: SQL Editor Setup

Run this SQL in the Supabase SQL Editor:

```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create assessment-audio bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-audio',
  'assessment-audio',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']
);
```

## Verification

After setup, test the profile picture upload:
1. Go to Profile dialog
2. Select a profile picture
3. Click Save
4. Should work without "Bucket not found" error

## Troubleshooting

- **Still getting errors?** Check the Supabase logs in the dashboard
- **Permission issues?** Ensure the storage policies are correctly set
- **File size issues?** Check the bucket file size limits
