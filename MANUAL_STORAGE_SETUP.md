# Manual Storage Buckets Setup Guide

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
- Open your Supabase project dashboard
- Navigate to **Storage** section in the left sidebar

### 2. Create Avatars Bucket
- Click **"New bucket"** button
- **Bucket name**: `avatars`
- **Public bucket**: ✅ **Yes** (check this box)
- **File size limit**: `5 MB`
- **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
- Click **"Create bucket"**

### 3. Create Assessment Audio Bucket
- Click **"New bucket"** button again
- **Bucket name**: `assessment-audio`
- **Public bucket**: ✅ **Yes** (check this box)
- **File size limit**: `50 MB`
- **Allowed MIME types**: `audio/webm, audio/mp4, audio/ogg, audio/wav`
- Click **"Create bucket"**

### 4. Set Storage Policies
- Go to **Authentication** → **Policies**
- Click **"New Policy"** for each policy below:

#### Policy 1: Users can upload their own avatars
```sql
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Anyone can view avatars
```sql
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

#### Policy 3: Users can update their own avatars
```sql
CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: Users can delete their own avatars
```sql
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 5. Test the Setup
- Go back to your application
- Try uploading a profile picture
- Should work without "Bucket not found" error

## Troubleshooting

### If you still get errors:
1. **Check bucket names** - must be exactly `avatars` and `assessment-audio`
2. **Verify public access** - buckets must be public
3. **Check policies** - make sure all 4 policies are created
4. **Check file size** - ensure your image is under 5MB

### Common Issues:
- **"Bucket not found"** → Bucket doesn't exist or wrong name
- **"Permission denied"** → Storage policies not set up correctly
- **"File too large"** → Image exceeds 5MB limit
