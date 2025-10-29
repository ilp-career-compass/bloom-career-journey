# Quick Setup Guide - AI Summary Approval Workflow

## Prerequisites
- Supabase project configured
- Google Gemini API key (from Google AI Studio)

---

## Step 1: Database Migration

Run the migration files in order:

```bash
# Apply the database migrations
# If using Supabase CLI:
supabase db push

# Or manually run in Supabase SQL Editor:
# 1. Run: supabase/migrations/20251029000000_create_assessment_summaries.sql
# 2. Run: supabase/migrations/20251029000001_assessment_summary_rpcs.sql
```

---

## Step 2: Configure Gemini API Key

1. **Get Your API Key:**
   - Visit: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key

2. **Add to Environment:**
   ```bash
   # Create or update .env file:
   VITE_GEMINI_API_KEY=your-api-key-here
   ```

3. **Restart Dev Server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

---

## Step 3: Verify Installation

### Test Student Flow:
1. Login as a student
2. Complete Inspiration Assessment (all 6 videos)
3. Submit assessment
4. Watch for toast messages:
   - "Assessment Completed! ✨"
   - "Generating your reflection summary..."
   - "Summary Generated! 📝"
5. Check dashboard for "Summary Pending Review" badge

### Test Teacher Flow:
1. Login as a teacher
2. Navigate to "Assessment Responses"
3. Find the student's submission
4. Click to expand
5. Go to "AI Summary" tab
6. Review the generated summary
7. Click "Approve"
8. Verify student can now see summary

---

## Step 4: Troubleshooting

### If Summary Doesn't Generate:

**Check 1: API Key**
```bash
# Verify API key is set:
echo $VITE_GEMINI_API_KEY

# Should output your API key
# If empty, add to .env file
```

**Check 2: Console Logs**
Open browser console (F12) and look for:
- "Error generating summary" messages
- Gemini API error responses
- Network errors

**Check 3: Database**
```sql
-- Check if summary was created:
SELECT * FROM assessment_summaries
ORDER BY created_at DESC
LIMIT 1;

-- Check RLS policies:
SELECT * FROM pg_policies 
WHERE tablename = 'assessment_summaries';
```

### Common Issues:

**Issue: "Gemini API key is not configured"**
- Solution: Add `VITE_GEMINI_API_KEY` to `.env` file
- Restart dev server

**Issue: Summary shows as "pending_approval" but not visible**
- Solution: This is expected! Teacher must approve first
- Teachers can see pending summaries in Assessment Responses

**Issue: "Failed to generate summary"**
- Check API key is valid
- Check Gemini API quota/limits
- Verify internet connection
- Check browser console for detailed errors

**Issue: Student can't edit summary**
- Verify summary is approved (not pending)
- Check if student is logged in correctly
- Verify RLS policies are active

---

## Step 5: Configuration Options

### Adjust AI Temperature (Optional):
Edit `src/services/aiSummaryService.ts`:

```typescript
generationConfig: {
  temperature: 0.7,  // 0.0-1.0 (lower = more consistent)
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048, // Adjust for longer/shorter summaries
}
```

### Customize Summary Questions (Optional):
Edit `src/services/aiSummaryService.ts` → `buildPrompt()` method

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Student Completes                     │
│                  Inspiration Assessment                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│              Save Assessment Responses                   │
│           (assessment_responses table)                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│          Call Gemini API (5-10 seconds)                  │
│    Generate 3-question reflection summary                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│         Save to assessment_summaries table               │
│            Status: "pending_approval"                    │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ↓                   ↓
   STUDENT VIEW        TEACHER VIEW
   Dashboard          Assessment Responses
   "Pending Review"   "Approve" Button
        │                   │
        │         ┌─────────┘
        │         │ APPROVE
        │         ↓
        │    Status: "approved"
        │         │
        └─────────┴─────────┐
                            │
                            ↓
                  ┌─────────────────────┐
                  │   Student Views &   │
                  │   Edits Summary     │
                  └─────────────────────┘
```

---

## API Rate Limits

**Gemini API (Free Tier):**
- 60 requests per minute
- 1,500 requests per day
- 1 million tokens per minute

**For Production:**
- Consider upgrading to paid tier
- Implement rate limiting on client
- Add request queuing for high traffic
- Monitor API usage in Google Cloud Console

---

## Security Notes

### Row Level Security (RLS):
All tables have RLS enabled. Students can only:
- View their own approved summaries
- Edit their own approved summaries
- Cannot see pending/rejected summaries

Teachers can only:
- View summaries for their assigned students
- Approve/reject summaries for their students
- Cannot access other teachers' students

### API Key Security:
- Never commit `.env` file to git
- Use `.env.example` for documentation
- Rotate API keys periodically
- Monitor API usage for anomalies

---

## Success Metrics

Monitor these metrics to ensure smooth operation:

1. **Generation Success Rate:** % of assessments that get summaries
2. **Average Approval Time:** How long teacher takes to approve
3. **Student Edit Rate:** % of students who edit after approval
4. **API Response Time:** Average time for AI generation
5. **Error Rate:** % of failed generations

---

## Support

For issues or questions:
1. Check console logs (F12 in browser)
2. Review `AI_SUMMARY_APPROVAL_WORKFLOW_IMPLEMENTATION.md`
3. Check database tables for data integrity
4. Verify RLS policies are active
5. Test with different student/teacher accounts

---

**Happy Testing! 🚀**

