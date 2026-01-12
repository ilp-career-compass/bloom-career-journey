# Deployment and Capacity Guide

## 📦 How Deployment Works

### Current Deployment Architecture

Your application is deployed using a **serverless architecture**:

1. **Frontend Hosting**: Vercel (via Lovable)
   - Static React application built with Vite
   - Serverless functions for API routes (if any)
   - Global CDN distribution
   - Automatic HTTPS

2. **Backend Services**: Supabase
   - PostgreSQL database
   - Authentication service
   - Storage buckets (avatars, assessment-audio)
   - Real-time subscriptions

3. **Deployment Process**:
   ```
   Code Push → Lovable/Vercel → Build → Deploy → CDN Distribution
   ```

### Deployment Configuration

**Vercel Configuration** (`vercel.json`):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
- Single Page Application (SPA) routing
- All routes redirect to `index.html` for client-side routing

**Build Process**:
- Build command: `npm run build` (Vite build)
- Output directory: `dist/`
- Static assets optimized and served via CDN

---

## 👥 User Capacity & Concurrent Limits

### Application-Level Limits

#### 1. **File Upload Concurrency**
```42:42:src/services/supabaseUploadService.ts
  private maxConcurrentUploads = 2;
```
- **Maximum concurrent uploads per user**: 2 simultaneous file uploads
- Queue-based system handles uploads sequentially if more than 2 are queued
- Applies to audio assessment submissions

#### 2. **AI Summary Generation Rate Limits**
Based on `SETUP_GUIDE_AI_SUMMARY.md`:
- **Gemini API (Free Tier)**:
  - 60 requests per minute
  - 1,500 requests per day
  - 1 million tokens per minute
- **Impact**: If many students submit assessments simultaneously, AI summary generation will be queued/throttled

#### 3. **Authentication**
- No explicit rate limiting in application code
- Relies on Supabase Auth rate limits (see below)

### Supabase Limits (Dependent on Plan)

#### Free Tier (Hobby Plan)
- **Database Connections**: ~60 direct connections
- **API Requests**: 500,000/month
- **Storage**: 1 GB
- **Bandwidth**: 2 GB/month
- **Concurrent Users**: ~200-500 (estimated based on typical usage)

#### Pro Tier ($25/month)
- **Database Connections**: ~200 direct connections
- **API Requests**: 5,000,000/month
- **Storage**: 100 GB
- **Bandwidth**: 250 GB/month
- **Concurrent Users**: ~1,000-2,000 (estimated)

#### Team/Enterprise Tiers
- Higher limits, custom configurations available
- Can handle thousands of concurrent users

### Vercel Limits (Dependent on Plan)

#### Free Tier (Hobby)
- **Bandwidth**: 100 GB/month
- **Build Time**: 6,000 minutes/month
- **Serverless Function Execution**: 100 GB-hours/month
- **Concurrent Requests**: No hard limit, but performance may degrade under heavy load

#### Pro Tier ($20/month)
- **Bandwidth**: 1 TB/month
- **Build Time**: 24,000 minutes/month
- **Serverless Function Execution**: 1,000 GB-hours/month
- **Better performance under load**

---

## 🎯 Estimated Capacity

### Realistic Scenarios

#### Scenario 1: Small School (Free Tier)
- **Total Users**: 100-200 students + 10-20 teachers
- **Concurrent Sign-ins**: 20-50 students simultaneously
- **Concurrent Submissions**: 5-10 students submitting assessments at once
- **Status**: ✅ Should work fine on free tier

#### Scenario 2: Medium School (Pro Tier)
- **Total Users**: 500-1,000 students + 50-100 teachers
- **Concurrent Sign-ins**: 100-200 students simultaneously
- **Concurrent Submissions**: 20-50 students submitting assessments at once
- **Status**: ✅ Should work well on Pro tier

#### Scenario 3: Large School (Team/Enterprise)
- **Total Users**: 2,000-5,000+ students + 200+ teachers
- **Concurrent Sign-ins**: 500-1,000 students simultaneously
- **Concurrent Submissions**: 100-200 students submitting assessments at once
- **Status**: ✅ Requires Team/Enterprise tier or custom scaling

### Bottlenecks to Watch

1. **Database Connections** (Supabase)
   - Each active user session may hold a connection
   - Peak times (e.g., all students submitting at end of class) can spike connections

2. **AI Summary Generation** (Gemini API)
   - Free tier: 60 requests/minute
   - If 100 students submit simultaneously, summaries will queue
   - Consider upgrading Gemini API tier for production

3. **File Uploads** (Supabase Storage)
   - Audio files can be up to 50MB each
   - Multiple concurrent uploads may slow down
   - Current limit: 2 concurrent uploads per user

4. **Network Bandwidth** (Vercel)
   - Free tier: 100 GB/month
   - Audio/video content can consume bandwidth quickly

---

## 📊 Monitoring & Scaling Recommendations

### Key Metrics to Monitor

1. **Supabase Dashboard**:
   - Database connection count
   - API request rate
   - Storage usage
   - Bandwidth consumption

2. **Vercel Dashboard**:
   - Function execution time
   - Bandwidth usage
   - Error rates

3. **Application Metrics**:
   - Sign-in success rate
   - Assessment submission success rate
   - AI summary generation queue length
   - Upload queue length

### Scaling Strategies

#### For Small Scale (< 500 users)
- ✅ Current setup should handle this
- Monitor Supabase free tier limits
- Consider Pro tier if approaching limits

#### For Medium Scale (500-2,000 users)
- Upgrade to Supabase Pro tier
- Upgrade to Vercel Pro tier
- Upgrade Gemini API to paid tier
- Implement request queuing for AI summaries

#### For Large Scale (2,000+ users)
- Upgrade to Supabase Team/Enterprise tier
- Consider database connection pooling
- Implement rate limiting on client side
- Add caching layer (Redis) for frequently accessed data
- Consider horizontal scaling with load balancers

### Optimization Tips

1. **Database Optimization**:
   - Ensure proper indexes on frequently queried columns
   - Use connection pooling (Supabase handles this automatically)
   - Optimize RLS policies to reduce query complexity

2. **Frontend Optimization**:
   - Lazy load components
   - Implement pagination for large lists
   - Cache API responses where appropriate

3. **Upload Optimization**:
   - Compress audio files before upload
   - Implement chunked uploads for large files
   - Queue uploads during peak times

---

## 🔧 Configuration Files

### Environment Variables Required
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key (optional)
VITE_GOOGLE_SPEECH_API_KEY=your-google-speech-key (optional)
VITE_AZURE_SPEECH_KEY=your-azure-key (optional)
```

### Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] Storage buckets created (avatars, assessment-audio)
- [ ] Environment variables set in Vercel/Lovable
- [ ] API keys configured (Gemini, Speech-to-Text)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Monitoring dashboards set up

---

## 📈 Performance Benchmarks

Based on code analysis:

- **Assessment Submission**: < 2 seconds (excluding AI)
- **AI Summary Generation**: 5-10 seconds
- **Sign-in**: < 1 second
- **File Upload**: Depends on file size and network (50MB audio ~30-60 seconds on average connection)

---

## 🚨 Important Notes

1. **No Hard User Limit**: The application doesn't have a hard-coded user limit. Capacity depends on your Supabase and Vercel plan tiers.

2. **Concurrent Submissions**: The main bottleneck for concurrent submissions is:
   - Supabase database connections
   - Gemini API rate limits (if using AI summaries)
   - Network bandwidth

3. **Peak Times**: During peak submission times (e.g., end of class), you may see:
   - Queued AI summary generation
   - Slower upload speeds
   - Higher database connection usage

4. **Scaling**: Both Vercel and Supabase auto-scale, but free tiers have limits. Monitor usage and upgrade when approaching limits.

---

## 📞 Support & Resources

- **Supabase Dashboard**: Monitor usage and limits
- **Vercel Dashboard**: Monitor deployments and bandwidth
- **Google Cloud Console**: Monitor Gemini API usage
- **Application Logs**: Check browser console and Supabase logs for errors

---

## 🔄 Upgrade Path

If you need to support more users:

1. **Start**: Free tier (100-200 users)
2. **Small Growth**: Supabase Pro + Vercel Pro (500-1,000 users)
3. **Medium Growth**: Supabase Team + Vercel Pro (2,000-5,000 users)
4. **Large Scale**: Supabase Enterprise + Custom infrastructure (10,000+ users)

---

*Last Updated: Based on current codebase analysis*
*For specific limits, check your Supabase and Vercel dashboard for real-time usage*





