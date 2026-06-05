# CLAUDE.md — Bloom Career Journey: Project Context & Memory

## 1. Project Overview

**Bloom Career Journey** is a career guidance and self-assessment platform for rural Indian students (grades 8–12), built by the India Literacy Project (ILP). Combines structured self-reflection exercises with AI-powered summarization and teacher-guided mentoring.

### Target Users
| Role | Description |
|------|-------------|
| **Students** | Rural students (grades 8–12) completing self-assessment modules, recording voice responses, building a career portfolio |
| **Teachers** | Review AI-generated summaries, approve/reject/edit them, manage student groups, view roadmaps/interests |
| **Admins** | Manage users, schools/states, assessment content, system configuration |

### Regional/Language Context
- Supports **English (`en`)**, **Kannada (`kn`)**, **Tamil (`ta`)**, **Hindi (`hi`)**; Unicode detection (Kannada: `0C80–0CFF`, Tamil: `0B80–0BFF`, Hindi: `0900–097F`)
- **Input method**: Virtual keyboard dropped. Students type using their device's built-in keyboard with transliteration (Tanglish/Kanglish/Hinglish — e.g. "nanna hesaru Raju" for Kannada). AI prompts already include Tanglish/Kanglish/Hinglish awareness. STT still supports `en-IN`, `hi-IN`, `kn-IN`, `ta-IN`.

---

## 2. Tech Stack

### Core
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript 5.8 |
| Build | Vite 5 (SWC plugin) |
| Styling | Tailwind CSS 3.4 + `tailwindcss-animate` + `@tailwindcss/typography` |
| UI Components | shadcn/ui (Radix UI primitives) |
| Backend & DB | Supabase (Auth, PostgreSQL, Storage, RPC, RLS) |
| AI Summaries | Google Gemini API (2.0 Flash / lite fallback) |
| AI Chatbot | Google Gemini API ("Vidya Saathi" persona) |
| Speech-to-Text | Google Cloud → Azure → Gemini 1.5 Flash (cascading fallback) |
| Streaming STT | Sarvam API via WebSocket proxy (`server/proxy_server.py`) |
| Routing | React Router DOM 6 |
| State/Data | TanStack React Query 5 |
| Forms | React Hook Form + Zod |

### Key Libraries
`recharts`, `sonner`, `lucide-react`, `date-fns`, `embla-carousel-react`, `react-resizable-panels`, `cmdk`, `vaul`, `class-variance-authority` + `clsx` + `tailwind-merge`

---

## 3. Project Structure
```
bloom-career-journey/
├── src/
│   ├── App.tsx                    # Root component, all routes
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── assessments/           # 8 assessment components + SummaryViewDialog (DB variants deleted May 2026)
│   │   ├── teacher/               # Header, StatsCards, StudentsTab, StudentModals, teacherStrings
│   │   ├── student/               # Header, AssessmentGrid, ProgressSection (unused), CareerChatSection, studentStrings
│   │   ├── chat/                  # Chat UI components
│   │   ├── ui/                    # 53 shadcn/ui components
│   │   ├── ProtectedRoute.tsx     # Role-based route guard
│   │   ├── HollandCodeTest.tsx / NotificationBell.tsx
│   │   ├── ProfileDialog.tsx      # User profile editor (includes language change)
│   │   ├── LanguageSelectionDialog.tsx / ImportStudentsDialog.tsx / ResourceManager.tsx
│   ├── pages/
│   │   ├── Index.tsx / AuthPage.tsx / AdminDashboard.tsx / HollandTest.tsx / CareersExplore.tsx
│   │   ├── StudentDashboard.tsx   # Student home (orchestrator, summary dialog, deep-link support)
│   │   ├── TeacherDashboard.tsx   # Teacher home (thin orchestrator)
│   │   ├── ProfileCardPage.tsx    # My Career Compass — profile card with approval workflow
│   │   ├── CareerRoadmapPage.tsx  # Career Roadmap — milestone-based career tracker
│   │   ├── ThingsInterestMePage.tsx # Things that Interest Me — editable interests table
│   │   ├── TeacherStudentRoadmapPage.tsx  # Teacher read-only view of student roadmap
│   │   ├── TeacherStudentInterestsPage.tsx # Teacher read-only view of student interests
│   │   └── StudentSummary.tsx     # Teacher view of student summaries
│   ├── services/
│   │   ├── aiSummaryService.ts    # AI summary generation + profile card keyword extraction
│   │   ├── aiChatService.ts / speechToTextService.ts / sarvamStreamingService.ts
│   │   ├── assessmentService.ts   # Assessment templates & media via Supabase RPCs
│   │   ├── summaryDatabaseService.ts / notificationService.ts
│   │   ├── audioResponseManager.ts / supabaseUploadService.ts / transcriptCleanupService.ts
│   │   └── translationService.ts
│   ├── lib/logger.ts              # Centralized logger (dev-only, `import.meta.env.DEV`)
│   ├── hooks/
│   │   ├── useAuth.tsx            # Auth context: signIn, signUp, signOut, userProfile
│   │   ├── useLang.tsx            # i18n context: language + translation
│   │   ├── use-toast.tsx / use-mobile.tsx
│   ├── integrations/supabase/client.ts + types.ts
│   ├── types/assessmentSummary.ts # Summary types + approval workflow types
│   └── utils/
│       ├── assessmentUnlock.ts    # Sequential unlock logic (currently bypassed)
│       └── summaryParsers.ts / databaseValidator.ts / errorHandler.ts / driveLinks.ts
├── server/proxy_server.py         # FastAPI WebSocket proxy for Sarvam STT
├── supabase/migrations/           # 150+ SQL migration files (Jan 2025–Apr 2026)
├── scripts/                       # seed_test_data, generate_test_answers, cleanup_test_data,
│                                  # parse_excel_questions, sync_questions (pending),
│                                  # generate_migration, dump_sheets, test_upsert,
│                                  # smoke_approval_workflow (5 RPC smoke tests)
├── docs/                          # E2E_test_report, manual_test_checklist, google-sheets-setup, test-screenshots/
├── .claude/commands/              # migrate, seed, ship, sync-sheet, test-plan, wrap-up
└── vercel.json / components.json
```

**Organization**: Hybrid layer-based + feature-based. Top-level by layer (`pages/`, `components/`, `services/`, `hooks/`, `utils/`); feature subdirs: `assessments/`, `teacher/`, `chat/`, `ui/`.

---

## 4. Core Features & Modules

### Assessment Modules

| # | Assessment | Type Key | Component |
|---|-----------|----------|-----------|
| 1 | My Inspiration | `inspiration` | `MyInspirationAssessment.tsx` |
| 2 | About Me | `about_me` | `AboutMeAssessment.tsx` |
| 3 | My Dreams | `dreams` | `MyDreamsAssessment.tsx` |
| 4 | My School, My Learning and I | `school_learning` | `MySchoolLearningAssessment.tsx` |
| 5 | My Talents and Hobbies | `hobbies` | `MyHobbiesAssessment.tsx` |
| 6 | My Role Models | `role_models` | `MyRoleModelsAssessment.tsx` |
| 7 | Holland Code (RIASEC) | `personality` | `HollandCodeAssessment.tsx` |
| 8 | Career Guidance Tools | `career_guidance_tools` | `CareerGuidanceToolsAssessment.tsx` |

Responses saved as JSON in `assessment_responses.responses`. (Companion `*DB.tsx` files deleted May 2026 — DB ops inlined into `*Assessment.tsx`.)

**Flow**: Student answers → `assessment_responses` → AI summary generated in background (fire-and-forget, 5s retry on failure) → `assessment_summaries` → teacher notified → reviews/approves → student views approved summary.

**Summary tab**: Locked until all core questions answered (`areCoreSectionsComplete()`). Unlocks progressively per section.

### AI Summary System (`aiSummaryService.ts`)
- Gemini primary: `gemini-2.0-flash`, fallback: `gemini-2.0-flash-lite`; all calls routed through `gemini-proxy` Edge Function
- `BASE_SYSTEM_PROMPT`: shared constant for all 12 prompt builders (standardized counsellor instructions, 2–3 sentence limits, Tanglish/Kanglish/Hinglish awareness note)
- Per-assessment `generate*Summary()` (6 × primary + fallback); profile card: `generateProfileCardKeywords()` + `generateCareerDirection()`
- All 6 request bodies include `generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }`
- Templates from `summary_templates` table (30-min TTL in-memory cache); hardcoded fallback
- `detectLanguage()` scans Unicode ranges → `en`/`kn`/`ta`/`hi`; uses **plurality vote at ≥20% threshold** (not majority) so mixed-script / Tanglish responses resolve correctly; `SummaryTemplate` supports `en`, `kn?`, `ta?`, `hi?`
- All 6 assessments have Hindi `languageInstruction` blocks; Role Models prompt reads questions from DB
- `validateSummary()` is format-aware: Dreams requires JSON array with `.dream`; Hobbies requires JSON arrays in `question1` + `question6`; Role Models requires plain text ≥50 chars (non-JSON); About Me requires `question1` + `question16`; Inspiration/School Learning require `question1`+`question2`+`question3` ≥50 chars
- `getSummaryWordCount()` extracts plaintext from JSON portfolios (Dreams/Hobbies) before counting
- `generateProfileCardKeywords()` accepts raw `assessmentResponses` (not just pre-formatted summary text); fire-and-forget `generateAndCacheProfileCardKeywords()` routes responses via `assessmentResponses` param
- Storage priority: student edits > teacher edits > AI original

### Teacher Approval Workflow
- Approve / reject / edit / request-revision via `SummaryApprovalCard.tsx`
- Statuses: `pending_approval` → `approved` | `rejected` | `revision_requested`; `revision_requested` → `pending_approval` (student resubmit via `update_student_summary`)
- RPCs: `approve_summary`, `reject_summary`, `request_revision_summary`, `update_student_summary` — all `SECURITY DEFINER`; `approve_summary` raises `already_approved` if status is not `pending_approval`
- Language-aware fire-and-forget notifications for all 3 teacher actions (approve/reject/request revision); fetches student `preferred_language` before building notification text
- `SummaryApprovalCard.tsx`: if teacher is in edit mode when approving, edits are saved first before the approve RPC; `already_approved` race condition handled with toast + refresh
- `AISummaryReview.tsx`: stats show 4 columns (pending/approved/rejected/revision requested with orange card); fixed `selectedStudentId` race condition (returns `Promise<Student[]>` from `fetchStudents`)
- `SummaryViewDialog.tsx`: `isEditing` resets to false when dialog closes; revision banner shown when status is `revision_requested`; uses shared `summaryParsers` (no local duplicates)

### Audio / Voice Features
- **Batch STT** (`speechToTextService.ts`): Google Cloud → Azure → Gemini; supports `en-IN`, `hi-IN`, `kn-IN`, `ta-IN`
- **Streaming STT** (`sarvamStreamingService.ts`): Browser → WebSocket → FastAPI proxy → Sarvam API
- Offline queue (`audioResponseManager.ts`) + resumable chunked uploads (`supabaseUploadService.ts`) for poor connectivity
- **Lazy init**: mic permission on first record click only; localized denial messages (en/kn/ta/hi)

### AI Chatbot
`aiChatService.ts` + `CareerChatSection.tsx` (student dashboard embedded panel); "Vidya Saathi" persona. Cascade: `gemini-2.0-flash` → `gemini-2.0-flash-lite`; `systemInstruction` forwarded to `gemini-proxy` on every call. History capped at 30 messages. Safety blocks return the on-topic redirect phrase rather than exposing the raw block reason. `ChatbotDialog.tsx` deleted (was dead code — permanently `open={false}` in TeacherDashboard with wrong persona).

### My Compass
- **Profile Card** (`/student/profile-card`): 6 module cards (always visible, never locked). Questions from `content_translations` (`resource_type: profile_card_{type}`); 2-3 word AI answers when complete. 7th card ("My Career Direction") synthesizes Dreams + Hobbies + Role Models keywords — also gated behind teacher approval (student sees `—` until approved). Cached in `profile_card_cache`. Teacher approval: keywords and career direction hidden until approved, reset to `pending` when student updates responses. Teacher review at `/teacher/student-profile-card/:studentId`. Two teacher review surfaces: full-page (`ProfileCardPage readOnly`) and embedded panel (`ProfileCardModulesPanel` in StudentAssessmentReview). Both use student's `preferred_language` for regen and label display.
- **Things that Interest Me** (`/student/things-interest-me`): Editable 4-col table (Subject, Lesson/Chapter, Why Factors, Compatible Career). Autosave 1s debounce. All 4 languages. Backed by `things_that_interest_me` (RLS-protected). Post-assessment redirect with `?from={type}`. Students type in transliteration using device keyboard.
- **Career Roadmap** (`/student/career-roadmap`): 8 milestones × 4 cols (Milestone + Plan A/B/C). Top 3 editable (`beginning_9th`, `midterm_9th`, `end_9th`), bottom 5 locked (`midterm_9th` was added Mar 2026, making it 8 total not the original 7). Autosave 1s debounce to `career_roadmap`. Midterm trigger: module 5. Shared types/constants in `src/utils/roadmapConfig.ts`.

---

## 5. Data Models / Schema

### Core Tables

#### `users`
| Column | Type |
|--------|------|
| id | uuid PK |
| role | enum: `admin`, `teacher`, `student` |
| full_name, email | text NOT NULL |
| mobile, state_id, school | nullable |
| preferred_language | CHECK: `en`, `kn`, `ta`, `hi` (default `en`) |
| bio, interests, career_goals, strengths, areas_for_growth, profile_picture_url, date_of_birth, gender, address | nullable |

#### `students`
| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | FK → `users.id` |
| class_id | FK → `classes.id` |
| teacher_id | uuid NOT NULL |
| enrollment_status | `active`, `inactive`, `pending`, `graduated`, `transferred` |
| family_income_range, academic_performance, attendance_percentage | nullable |

#### `teachers`
| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | FK → `users.id` |
| state_id | FK → `states.id` |
| specialization, qualification, experience_years | nullable |
| is_active | boolean default true |

#### `orgs` / `states` / `classes`
```
orgs (id, name) → states (id, state_name, org_id, state_code)
  → classes (id, name, state_id) / teachers (via state_id)
```

#### `assessment_responses`
| Column | Type |
|--------|------|
| id | uuid PK |
| student_id | FK → `students.id` |
| assessment_type | text NOT NULL |
| responses | jsonb NOT NULL |
| completed_at | timestamptz nullable (null = in progress) |
| review_status | `unreviewed`, `in_review`, `reviewed`, `needs_revision`, `flagged` |
| | **UNIQUE (student_id, assessment_type)** — ALWAYS use `.upsert()` |

#### `assessment_summaries`
| Column | Type |
|--------|------|
| id | uuid PK |
| assessment_response_id | FK → `assessment_responses.id` |
| ai_summary, teacher_edited_summary, student_edited_summary | jsonb |
| approval_status | `pending_approval`, `approved`, `rejected`, `revision_requested` |
| approved_by, rejected_by, rejection_reason | nullable |

#### `notifications`
| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | FK → `users.id` |
| type | `summary_approved`, `summary_rejected`, `revision_requested`, `teacher_message`, `assessment_submitted`, `system` |
| title, message, link | text |
| read_at | timestamptz nullable (null = unread) |

#### Compass Tables
- **`profile_card_cache`**: `(student_id, assessment_type)` unique; `keywords` jsonb `{question1: "2-3 words"}` per module, `{direction: "paragraph"}` for `career_direction`
- **`career_roadmap`**: `(student_id, milestone)` unique; `plan_a/b/c` text; milestones: `beginning_9th`, `end_9th`, `beginning_10th`, `midterm_10th`, `post_exam_10th`, `before_results_10th`, `final_decision`

#### Other Tables
- `chat_channels` / `chat_messages`: teacher–student messaging
- `counselling_activities` / `student_activity_progress`: structured activities with completion tracking
- `counselling_resources`: PDFs, videos, worksheets with download counts
- `student_notes`: teacher observations (types: observation/meeting/progress/concern/achievement/follow_up)
- `student_groups`: teacher-created groups within states/classes
- `summary_templates`: per-assessment Gemini prompt templates, multi-language
- `content_translations`: UI text by `resource_type`, `resource_key`, `lang`; includes `profile_card_{type}` entries (4 langs)
- `inspiration_sources`: video URLs; `lang` column for per-language sets (en/kn/ta/hi); filtered by `get_inspiration_videos(p_lang)`
- `things_that_interest_me`: PK `id`; `student_id` FK → `users.id`; `subject`, `lesson_chapter`, `why_factors`, `compatible_career`, `source_assessment`; rows ordered by `created_at` (no user-controlled ordering, no `row_order` column); RLS-protected; max 20 rows per student enforced client-side

### Relationships
```
orgs →1:N→ states →1:N→ classes / teachers
users →1:1→ students / teachers
students →1:N→ assessment_responses →1:1→ assessment_summaries
users →1:N→ notifications
students + teachers → chat_channels →1:N→ chat_messages
```

---

## 6. Database Migrations

`supabase/migrations/`: 150+ files, Jan 2025–May 2026.

### Key Schema Notes
- **SQL Unicode rule**: All Kannada/Tamil/Hindi text in migrations must use PostgreSQL dollar-quoting (`$$...$$`)
- **assessment_responses unique**: `UNIQUE (student_id, assessment_type)` — all writes MUST use `.upsert({ onConflict: 'student_id,assessment_type' })`. RLS: 4 policies (`ar_select_student`, `ar_insert_student`, `ar_update_student`, `ar_select_teacher`) via `is_student_owned_by_auth()`
- **preferred_language**: CHECK constraint (not enum) — easier to add languages without migration complexity
- **users email**: `UNIQUE INDEX users_email_lower_unique ON users (LOWER(email))`; all emails normalized to lowercase on insert
- **summary RPC keys**: All 6 `get_*_summary_questions_i18n` RPCs use `'summary_question' || N` prefix (not `'question' || N`)
- **inspiration_sources**: `lang` column (in `types.ts`); `get_inspiration_videos(p_lang)` RPC filters `is_active = true`; 3 videos × 4 languages (en/kn/ta/hi). Old stale `inspiration_videos` table dropped (`20260507000004`).
- **RLS on public tables (Apr 2026)**: 18 content/question tables have authenticated read-only policies; `SECURITY DEFINER` RPCs bypass RLS
- **About Me question12**: Section C Q5 key was mismatched (`question11` vs `question12`); migration `20260416000001` fixed it. Orphaned `question11` rows in `content_translations` are harmless.
- **assessment_responses.responses type constraint**: `20260506000001_responses_type_constraint.sql` adds `NOT VALID CHECK (jsonb_typeof(responses) = 'object')` — existing rows skipped, new inserts must be a JSON object.
- **Approval workflow RPCs (May 2026)**: `20260506000002_fix_approval_workflow.sql` adds `revision_requested`/`summary_rejected` to `notification_type` enum; updates `approve_summary` (already_approved guard, preserves student_user_id via COALESCE), `reject_summary` (already_approved guard), `update_student_summary` (accepts `revision_requested` → resets to `pending_approval`, clears rejection fields); adds new `request_revision_summary(p_summary_id, p_teacher_user_id, p_revision_notes)` RPC.

---

## 7. Supabase Configuration

### Auth
- Email + password; `localStorage` session (`persistSession: true`, `autoRefreshToken: true`)
- Role stored in both `auth.users.user_metadata.role` and `public.users.role`

### Storage Buckets
| Bucket | Purpose |
|--------|---------|
| `audio-files` | Voice recordings (RLS-protected) |
| `avatars` | Profile pictures (RLS-protected) |

### Key RPC Functions
- `get_assessment_template(p_assessment_type)`, `get_inspiration_videos(p_lang)`, `get_assessment_media_sources(p_assessment_type)`
- `get_student_assessment_responses(teacher_user_id, filter?)`, `get_review_overview(teacher_user_id)`, `get_student_review_progress(teacher_user_id)`, `update_assessment_review(...)`
- `approve_summary(p_summary_id, p_teacher_user_id)`, `reject_summary(p_summary_id, p_teacher_user_id, p_rejection_reason)`, `request_revision_summary(p_summary_id, p_teacher_user_id, p_revision_notes)`, `update_student_summary(p_summary_id, p_student_user_id, p_student_edited_summary)`
- `get_or_create_chat_channel(p_student_id, p_teacher_id)`, `create_notification_secure(p_user_id, p_type, p_title, p_message, p_link)`
- `get_all_assessment_templates()`, `update_assessment_template(...)`, `upsert_media_source(...)` — admin ops

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_GEMINI_API_KEY` | Gemini (AI summaries + chatbot) |
| `VITE_GOOGLE_SPEECH_API_KEY` | Google Cloud Speech-to-Text |
| `VITE_AZURE_SPEECH_KEY` / `VITE_AZURE_SPEECH_REGION` | Azure Speech fallback |
| `VITE_SARVAM_PROXY_URL` | Sarvam WS proxy (default: `ws://127.0.0.1:8000/ws/stream`) |
| `VITE_MSG91_WIDGET_ID` | MSG91 OTP widget ID — mark **Sensitive** in Vercel (Production + Preview) |
| `VITE_MSG91_TOKEN_AUTH` | MSG91 token auth — mark **Sensitive** in Vercel (Production + Preview) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_SHEET_ID` | Google Sheets API (sync-questions) |

---

## 8. API & Service Layer

**Pattern**: Frontend → Supabase directly. AI/ML via client-side `VITE_*` keys. Sarvam STT only server-mediated (Python proxy).

| Service | Key Methods |
|---------|-------------|
| `aiSummaryService.ts` | `generate*Summary()`, `detectLanguage()`, `generateProfileCardKeywords()`, `generateCareerDirection()` |
| `aiChatService.ts` | `sendMessage()` |
| `speechToTextService.ts` | `transcribe()`, `transcribeAutoDetect()`, `transcribeLongRunningByUri()` |
| `sarvamStreamingService.ts` | `connect()`, `sendAudioChunk()`, `disconnect()` |
| `assessmentService.ts` | `getAssessmentTemplate()`, `getMediaSources()`, `getHollandCodeData()` |
| `summaryDatabaseService.ts` | `createAISummary()`, `approveSummary()`, `rejectSummary()`, `updateTeacherSummary()`, `requestRevision()`, `updateStudentSummary()`, `getPendingSummariesForTeacher()`, `getTeacherSummaryOverview()` |
| `notificationService.ts` | `list(userId, limit?)`, `markRead(ids, userId?)`, `markAllReadForUser(userId)`, `create()` |
| `audioResponseManager.ts` | `processAudioResponse()`, `syncOfflineQueue()` |
| `supabaseUploadService.ts` | `uploadFile()`, `queueUpload()`, `processQueue()` |

---

## 9. Auth & Role-Based Access

- **`ProtectedRoute.tsx`**: auth + role check; redirects to `/auth` or role dashboard
- Role routes: admin → `/admin`, teacher → `/teacher`, student → `/student`
- Compass routes: `/student/profile-card`, `/student/career-roadmap`, `/student/things-interest-me`, `/teacher/student-profile-card/:studentId`, `/teacher/student-roadmap/:studentId`, `/teacher/student-interests/:studentId`
- **RLS**: students own data only; teachers access their state's students; admins broader; RPCs use `SECURITY DEFINER` where needed

### MSG91 OTP Integration

Three scenarios require OTP verification before account creation or password setup:

| Scenario | Triggered by |
|----------|-------------|
| Teacher self-registration | Sign Up tab → "I am a Teacher" |
| Student self-registration | Sign Up tab → "I am a Student" |
| First Login (set password) | Sign In tab → "First Login" mode — for teacher-created students who have no password |

**Widget setup** (`AuthPage.tsx`):
- Script loaded from `https://verify.msg91.com/otp-provider.js` via dynamic `<script>` tag
- Initialized with `exposeMethods: true` + empty `success`/`failure` callbacks + `captchaRenderId: ''` to suppress the built-in MSG91 popup
- `window.sendOtp(mobile)` — dispatches OTP SMS only; no callbacks (fire-and-forget); `mobile` must be `91XXXXXXXXXX` (no `+`)
- `window.verifyOtp(otp, successCb, failureCb)` — verifies the user-typed code; `successCb` receives `{ 'access-token': string }`
- `window.retryOtp(null)` — resends OTP
- **Cleanup caveat**: MSG91 defines all four globals (`initSendOTP`, `sendOtp`, `verifyOtp`, `retryOtp`) as both **non-configurable** and **non-writable** on `window`. In strict mode (all ES-module bundles) both `delete window.sendOtp` and `window.sendOtp = undefined` throw `TypeError`. Cleanup wraps each operation in its own try/catch and silently swallows both errors — the globals persist but MSG91 re-initialises them on the next mount anyway. The `useEffect` also removes any pending `'load'` listener on an already-present script tag to prevent orphaned callbacks on unmount.

**Custom OTP UI** — `OtpScreen` inner component in `AuthPage.tsx`:
- Shared between Sign Up and First Login flows
- Uses `InputOTP` / `InputOTPGroup` / `InputOTPSlot` (shadcn `input-otp`)
- Shown when `signUpStep === 'otp'` (Sign Up) or `firstLoginStep === 'otp'` (First Login)
- Sign Up state machine: `'form'` → `'otp'` (after `sendOtp`) → account created in `verifyOtp` success callback
- First Login state machine: `'phone'` → `'otp'` (after `sendOtp`) → `'setpassword'` (after `verifyOtp`) → signs in

**Edge Functions**:
| Function | Purpose |
|----------|---------|
| `verify-msg91-token` | Validates MSG91 `access_token` via `https://api.msg91.com/api/v5/widget/verifyAccessToken`; reads `MSG91_AUTH_KEY` Supabase secret; returns `{ success, mobile }` |
| `set-first-password` | Calls `verify-msg91-token` internally, cross-checks returned mobile, then calls `auth.admin.updateUserById` to set the student's chosen password |

**Secrets & env vars**:
- `VITE_MSG91_WIDGET_ID`, `VITE_MSG91_TOKEN_AUTH` — Vercel env vars, mark **Sensitive** for Production + Preview
- `MSG91_AUTH_KEY` — Supabase secret only (`supabase secrets set MSG91_AUTH_KEY=...`); never in `.env` or client bundle
- `ALLOWED_ORIGIN` — Supabase secret; set to `https://bloom-career-journey.vercel.app`; restricts CORS on `create-teacher`, `create-student-self-register`, `set-first-password`, `gemini-proxy`; update if custom domain added

---

## 10. State Management

**Global providers** (`App.tsx`): `ErrorBoundary → Router → AuthProvider → LangProvider → Routes + Toaster`
- `AuthProvider` (`useAuth.tsx`): `user`, `session`, `loading`, `refreshingProfile`, `signIn`, `signOut`, `userProfile`, `refreshUserProfile` — `signUp` removed (registration handled by Edge Functions)
- `LangProvider` (`useLang.tsx`): language state + translations; priority: URL param → `userProfile.preferred_language` → `localStorage.lang` → `'en'`
- Most data fetching: `useEffect` + direct Supabase calls (TanStack React Query available but underused)

---

## 11. Key Conventions & Patterns

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `MyInspirationAssessment.tsx` |
| Services | camelCase singleton | `aiSummaryService` |
| Hooks | `use` prefix | `useAuth`, `useLang` |
| DB tables | snake_case | `assessment_responses` |
| Env vars | `VITE_` + SCREAMING_SNAKE | `VITE_GEMINI_API_KEY` |

- **Forms**: React Hook Form + Zod + `@hookform/resolvers`
- **Logging**: `src/lib/logger.ts` — silent in production (`import.meta.env.DEV` gate)
- **Assessment components**: `*Assessment.tsx` — UI + logic + DB ops (DB companion files deleted May 2026)
- **Auto-save hardening**: All assessments use `isDirtyRef` (no spurious save on initial load) + `readOnlyView` guard (no DB writes in teacher read-only mode)
- **SQL Unicode**: Kannada/Tamil/Hindi in migrations → `$$...$$` dollar-quoting
- **assessment_responses writes**: ALWAYS `.upsert({ onConflict: 'student_id,assessment_type' })` — NEVER bare `.insert()`
- **Bug fixes**: documented in git commit messages only, not in this file

---

## 12. Current Implementation Status

**Last verified build:** 2026-06-04

### Assessment Module Status
| Assessment | UI | DB | AI Summary | Approval | Wired |
|------------|:--:|:--:|:----------:|:--------:|:-----:|
| My Inspiration | ✅ | ✅ | ✅ | ✅ | ✅ |
| About Me | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Dreams | ✅ | ✅ | ✅ | ✅ | ✅ |
| My School, My Learning and I | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Talents and Hobbies | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Role Models | ✅ | ✅ | ✅ | ✅ | ✅ |
| Holland Code (RIASEC) | ✅ | ✅ | ❌ | ❌ | ⚠️ |
| Career Guidance Tools | ✅ | ✅ | ❌ | ❌ | ⚠️ |

### Known Issues & Deferred Items

> [!WARNING]
> **Assessment unlock bypassed**: `checkAssessmentUnlock()` hardcoded to return `true`. Re-enable before production.

> [!NOTE]
> **Holland Code & Career Guidance Tools**: No AI summary or teacher approval — intentional for now.

> [!NOTE]
> **Hindi content translations**: Summary questions have Hindi for all 6 assessments. Some `content_translations` `hi` rows pending ILP Google Sheet update for non-summary content.

> [!NOTE]
> **Sheet restructuring**: Phases 2–3 (Google Sheets sync automation) paused until ILP finalizes new format.

> [!NOTE]
> **ResponseViewer duplicated**: Exists in `StudentSummary.tsx` and `TeacherStudentResponsesPage.tsx`. Use the latter (handles booleans as Yes/No). Extract to `src/components/ui/ResponseViewer.tsx` in a future cleanup.

> [!NOTE]
> **ProgressSection unused**: `src/components/student/ProgressSection.tsx` not rendered — delete in cleanup.

> [!NOTE]
> **Profile Card Holland Code**: 2 questions in Google Sheet not yet in `content_translations` or `ProfileCardPage.tsx`. Deferred until Holland Code gets AI summary support.

> [!NOTE]
> **Legacy NO students**: 30 students still use `student_auth_credentials` + `authenticate_student` RPC (phone-only). RLS is now enabled on the table (no policies — SECURITY DEFINER RPCs bypass it; direct client queries are blocked). Backfill to real Supabase Auth required before table/RPC can be deleted.

> [!NOTE]
> **PR 2b SMS hook blocked**: `send-sms-hook` Edge Function ready. Blocked on: MSG91 credentials (Auth Key, Flow ID, Sender ID), DLT OTP template approval, Supabase Pro plan (free plan 2s timeout may be too tight). Deploy: `supabase functions deploy send-sms-hook --no-verify-jwt`, configure Auth → Hooks, set Twilio placeholder, `supabase secrets set` for 4 MSG91 vars.

> [!NOTE]
> **Profile card rejection audit trail**: Teacher feedback is incorporated into the AI regen prompt and `rejection_reason` now persists in the DB after regen (shown to student only when `approval_status = 'rejected'`). Max 3 rejection rounds per module still enforced client-side only (`rejectionCounts` state — resets on page reload; no DB counter).

### Completed Work (Mar–May 2026)

Feature work phases 0A–14C, PR 2a/2b, and full audit fix passes (auth 19-point, OTP 29-point, AI-summary 22-point, approval-workflow, profile-card 10-point, things-interest 18-point, roadmap 22-point) — all completed and verified May 2026. See `git log` for per-phase details.

| Phase | Description |
|-------|-------------|
| **notification-audit** | Notification system 25-point gap analysis + High/Medium/Low fix pass (May 2026). **High** — `markAllRead` only cleared the visible 15-item window (fixed with `markAllReadForUser` server-side UPDATE, no limit); `summary_rejected` notification type was dead/never sent (added `buildRejectionNotif` + fire-and-forget in `handleReject`); profile card approval/rejection notifications were hardcoded English (added `buildProfileCardApprovedNotif`/`buildProfileCardRejectedNotif` helpers using `studentLang` in both `ProfileCardPage` and `ProfileCardModulesPanel`); panel used `top-14` (56 px) but header is `h-16` (64 px), overlapping 8 px on mobile (fixed to `top-16`). **Medium** — single DB call in `refresh()` (count derived from `list` result, `getUnreadCount` call removed; limit raised to 50); optimistic clear on mark-all-read; localized assessment title inside multilingual notification body (added `ASSESSMENT_TITLES_KN/TA/HI` + `getLocalizedAssessmentTitle`); chat notifications English-only (recipient `preferred_language` fetched before RPC); `student_user_id` null silent drop replaced with `resolveStudentUserId` fallback join; deep links (`link: '/student'`) added to all summary notifications; `NotificationType` TS union updated to match DB enum (added `profile_card_approved`, `profile_card_rejected`, `chat_message`); mobile scroll lock; `touchstart` alongside `mousedown`; Escape key closes panel; Tab focus trap; `aria-expanded`/`aria-haspopup`/`role="dialog"` added. **Low** — empty-state copy "No new notifications" → "No notifications"; `refresh()` after `navigate()` replaced with optimistic single-item update (avoids setState on unmounted); `markRead` accepts optional `userId` for client-side row guard; panel closes on route change via `useLocation`; `open` reset on `userId` prop change. |
| **i18n-audit** | Multilingual / i18n 18-point gap analysis + full fix pass (May 2026). **Critical** — `t('error')`, `t('success')`, `t('passwordUpdated')` added to DICT for all 4 languages (were returning empty string in ProfileDialog password toasts and AudioRecorder error toasts). **High** — `teacherStrings.ts` Hindi block fully translated (was English fallback with TODO); `signIn` catch block translated for all 4 languages; `signOut` now emits translated toast; `localStorage.lang` cleared on sign-out (shared-device fix). **Medium** — `TeacherDashboard` replaced manual lang derivation + localStorage write effect with `useLang()` (now reactive to ProfileDialog language changes); `cachedLang` in auth fallback path validated against whitelist; `ProfileDialog` 25+ inline ternary translation chains replaced with module-level `PD` map (4 languages × 28 keys); `langNames` redundant nested lookup simplified to `PD[selectedLang].langUpdated`; `LangProvider` `initial` state validated via `validateLang` helper (removes unsafe cast); Hindi `videoProgressSaved` emoji parity with kn/ta. **Low** — `urlLang` parsed with `validateLang` (invalid codes like `?lang=fr` produce `null` immediately); `t()` logs `logger.warn` in dev mode for missing keys; roadmap milestone Hindi labels confirmed complete (stale CLAUDE.md note removed). |
| **audio-voice-audit** | Audio / Voice Features gap analysis + Critical/High/Medium/Low fix pass (May 2026). **Critical** — Sarvam WS double-open guard added to `connect()` (cleared dangling timer + closed existing socket before reconnecting); `disconnect()` converted to `Promise<void>` with 2500 ms flush timer so `onstop` awaits the final transcript before reporting done; `onclose` now fires `onErrorCallback` for non-1000 codes; `isFinal` detection reads `data.is_final` / `data.data?.is_final` instead of hardcoding `true`. **High** — `stopStreamingCapture` returns the disconnect Promise; `stopRecording` stores it in `flushPromiseRef` before calling `mediaRecorder.stop()` so `onstop` can await it; existing `AudioContext` closed before creating a new one (leak on repeated record cycles); AudioWorklet `port.onmessage` guard uses `isPausedRef` (ref-based, not stale closure); stream kept alive after permission check and reused in `startActualRecording`; localized `micDeniedMessages`, `micNotFoundMessages`, `micInUseMessages` maps (en/kn/ta/hi); `NotAllowedError` in `startActualRecording` resets `hasPermission` + shows localized denial; offline queue `queueOfflineResponse` serialization removed (Blobs can't serialize — in-memory only); error catch queues on ANY failure when `enableOfflineMode`, not just `!isOnline`; `uploadInChunks` now calls `uploadSingleChunk` on the reassembled blob (chunks were staging files — final file was never uploaded); `processQueue` decrements `activeUploads` after success (queue was permanently blocked after 2 uploads); bucket corrected from `assessment-audio` → `audio-files`; `audio_files` table insert removed (table doesn't exist). **Medium** — transcript callback respects `isFinal`: partials show live but only finals accumulate into `streamingTranscriptRef`; `queueOfflineResponse` stamps `queuedAt: Date.now()`; `getOfflineQueueStatus` reads `item.queuedAt` (was always `Date.now()`); `uploadInChunks` tracks `uploadedChunkIndices` so failure cleanup only removes actually-uploaded chunks; `streamingUnavailableMessages` map (en/kn/ta/hi) replaces two inline ternary chains; all `baseLang` derivations fall back through `localStorage.getItem('lang')`. **Low** — "mb" typo → "🎤" in sarvamStreamingService speech-end log; dead test-student guard removed from `processAudioResponse` dbResult path (unreachable: `saveAudioResponse` returns success for test student before reaching that check); broken `localStorage.setItem(JSON.stringify(offlineQueue))` removed from `syncOfflineQueue` (Blobs → `{}`, data was always corrupt); `uploadQueue` annotated as in-memory only; `audioConfig.ts` `AUDIO_CONFIG.googleApiKey` added from `VITE_GOOGLE_SPEECH_API_KEY` (`AUDIO_FEATURES` helpers were always returning false/null without it). |
| **data-layer-rls-audit** | Data Layer & RLS deep gap analysis + security fix pass (May 2026). **Critical** — `student_auth_credentials` had no RLS; enabled RLS with no policies so direct client `SELECT` is blocked while SECURITY DEFINER RPCs still work (`20260510000001`). **High** — `get_or_create_chat_channel` SECURITY DEFINER had no internal auth check; any authenticated user could open a channel between arbitrary student/teacher pairs; fixed by resolving participant `user_id`s and raising `Unauthorized` if `auth.uid()` is neither (`20260510000002`). `update_user_profile` custom-auth `ELSIF` branch fired even when `auth.uid()` was set to a different user, allowing any authenticated teacher to update a legacy student's profile; fixed by adding `auth.uid() IS NULL` guard to that branch (`20260510000004`). **Medium** — `create_notification_secure` had no caller-to-recipient relationship check; any authenticated user could spam notifications to any `user_id`; added admin/teacher→student/student→teacher relationship enforcement before the claim-impersonation block (`20260510000003`). `ar_update_teacher` policy confirmed to have both `USING` and `WITH CHECK` — no fix needed. No frontend calls to `authenticate_student` found — RPC is dead code pending backfill. |
| **inspiration-videos-audit** | Inspiration Videos 15-point gap + Critical/High/Medium/Low fix pass (May 2026). **Critical** — Hindi fallback `kVideos` missing `hi` key; `kVideos['hi']` was `undefined` → `setDefaultVideos(undefined)` → `TypeError` on DB failure with Hindi lang (added `hi` entry + typed as `Record<string, InspirationVideo[]>` with `?? kVideos['en']` final guard). **High** — video load effect had empty deps `[]`; language switch never reloaded videos (added `lang` dep); `get_inspiration_videos` RPC lacked `is_active = true` filter (`20260507000002`). Hindi per-video question/help text translations still pending ILP Sheet update. **Medium** — `inspiration_sources.lang` added to `types.ts`; `checkExistingResponse` filtered by `assessment_title` in addition to `assessment_type` (removed extra filter); `mergeVideo`/`mergeVideo2` hardcoded `question1`–`question10` — replaced with dynamic loop that preserves any saved keys beyond 10 (`Math.max(savedMax, 10)`); dead Hindi `summary_question_N` underscore rows cleaned (`20260507000003`); dedup now emits `logger.warn` when it fires. **Low** — dead `video.youtube_id` read removed (RPC never returned that column); `inspirationVideos.length` race replaced with `defaultVideos.length`; `DatabaseTestPage` now tests all 4 language sets (passes only if all 4 return ≥1 video); stale `inspiration_videos` table dropped (`20260507000004`); `update_inspiration_videos_v2/v3.sql` loose files deleted from repo root. |
| **chatbot-audit** | AI Chatbot 18-point gap analysis + Critical/High/Medium/Low fix pass (May 2026). **Critical** — `systemInstruction` (Vidya Saathi persona, language rules, safety guardrails) was silently dropped in `callApi()` — never reached Gemini; fixed by forwarding `systemInstruction` to `gemini-proxy`. **High** — `ChatbotDialog.tsx` was permanently dead code (`open={false}`, wrong persona) — deleted; safety blocks exposed raw `HARM_CATEGORY_X` string as a "connectivity error" — now returns the on-topic redirect phrase; unbounded history capped at 30 messages to stay within Edge Function body limits; all chat error messages were English-only — now localized (en/kn/ta/hi). **Medium** — `isConfigured()` always returned `true` (dead guard removed); Enter key not wired in `CareerChatSection` (added `onKeyDown`); welcome message always visible above messages (now empty-state only); scroll container had no `overflow-y` so `scrollTo` was a no-op (added `max-h-[300px] overflow-y-auto`); inner 2-column grid had empty second column (removed); no typing indicator (added pulsing localised "Thinking…" while loading; scroll-to-bottom moved to after `setCcLoading(true)`). **Low** — `gemini-1.5-flash` deprecated fallback removed (cascade now `gemini-2.0-flash` → `gemini-2.0-flash-lite`); index-based last-model guard replaces hardcoded model name (eliminates implicit `undefined` return path); chat notification deep link hardcoded `/student?openChat=true` regardless of recipient role (now recipient-appropriate); `TeacherDashboard` wires `?openChat=true` URL param → `ChatBubble` controlled open state (matching `StudentDashboard` pattern). |
| **student-dashboard-low-audit** | Student Dashboard low-severity gap fix pass (May 2026). **G8** — progress bar + badge rendered `0%` until queries resolved; now shows `<Skeleton>` placeholders while `!progressLoaded`. **G13** — invalid `?assessment=xyz` URL param persisted in address bar; `setSearchParams({}, { replace: true })` now called for unrecognised values too. **G18** — full chat history sent on every request; capped to last 20 messages with `ccMessages.slice(-20)`. **G19** — CareerBot greeting was inline 4-way JSX ternary; moved to `chat_greeting` key in `studentStrings.ts` (all 4 languages), consumed via `t("chat_greeting")` in `CareerChatSection`. **G21** — `ccScrollToBottom` used `requestAnimationFrame` which can fire before React flushes the new message to the DOM; replaced with `useLayoutEffect` on `ccMessages.length + ccLoading` inside `CareerChatSection`. **G26** — already fixed (all 5 school-learning sections checked). **G28** — `areCoreSectionsComplete` iterated `Object.values(roleModel)` — brittle to schema additions; replaced with explicit `REQUIRED_ROLE_MODEL_FIELDS` constant (11 named fields). **G30** — `SummaryViewDialog` `DialogTitle`/`DialogDescription` missing Hindi for `about_me`, `dreams`, `school_learning`, `hobbies`; Hindi branches added throughout (also `questionTitles` defaults, `dreamHeadings` defaults, `schoolLearningColumnHeadings`, role\_models/inspiration description branches). **G31** — `fetchQuestionTitles` queried wrong table `assessment_summary_templates`; corrected to `summary_templates`; `preferredKey` now includes `hi`. **G35** — `roadmapRedirectedRef` reset on page reload allowing double-redirect; now initialised from `sessionStorage.roadmap_redirected` and written back on each redirect. |
| **teacher-dashboard-audit** | Teacher Dashboard 45-point gap analysis + High/Medium/Low fix pass (May 2026). **High** — grade filter used wrong field (fixed to `class.name` digit extraction); unenroll hard-deleted rows (changed to `enrollment_status: 'inactive'`); stats cards counted `assessment_responses.review_status` instead of `assessment_summaries.approval_status` (rewrote `refreshReviewOverview` with two-step join, no `.limit(500)`); Profile Card Pending card navigated to wrong tab; dead `AssessmentAnswersModal` + `ViewProgressModal` removed; `personality` + `career_guidance_tools` missing from activity timeline; `AddExistingStudentModal` state not reset on close; import guard added when `teacherRow` is null. **Medium** — `HobbiesRenderer` assumed `responses.hobbies` array (actual: flat `{questionId: string}` map — delegated to `ResponseViewer`); `RoleModelsRenderer` assumed array (actual: `roleModel1/roleModel2/roleModel3` objects + `question12`/`question13` reflection — rewritten); in-progress yellow dot added to tab triggers; audio URL values render `<audio controls>`; role guard redirects non-teachers; student name fetched via two-step query (FK join shorthand silently fails); "Transferred" missing from status filter; enrollment date showed raw string; all 6 dropdown labels + search placeholder use `t()` keys (all 4 languages added to `teacherStrings.ts`); "View Profile Card" added to student dropdown. **Low** — `LANG_LABELS` extracted to `src/lib/langLabels.ts` (was defined in 3 separate files); null `preferred_language` shows `—` instead of "English"; dead `stateId` field + `useEffect` removed from `newStudent` state; CSV template adds optional `preferred_language` column with per-row override; `classIdToGrade` regex widened from `Class N` to any digit group; Interests + Responses back buttons get history guard + `/teacher` fallback; roadmap stores per-milestone `updated_at` and shows it under each label; Holland Code `maxScore` dynamically derived; Responses page tab state synced to `?tab=` URL param. Deferred: pagination (G9), print/export (G45). |
| **admin-dashboard-audit** | Admin Dashboard deep gap analysis + Low fix pass (May 2026). **Low** — `AdminUser` interface extended with all 10 previously hidden `users` columns (`bio`, `interests`, `career_goals`, `strengths`, `areas_for_growth`, `profile_picture_url`, `date_of_birth`, `gender`, `address`, `school`); DB query updated; Users tab now shows Profile Picture indicator column; edit dialog shows all profile fields read-only in a collapsible section. Scoped refetch: added `fetchOrgs/fetchSchools/fetchClasses/fetchTeachers/fetchStudents/fetchUsers` helpers — each mutation calls only its affected table(s) instead of the full 4-table `fetchData()`; `saveTemplate` uses local state update (no DB round-trip). Audit log: new `admin_audit_log` table (`20260507000005`, RLS admin-only) + `logAudit()` fire-and-forget wired to all create/rename/delete operations; Audit Log card in Reports tab (on-demand, last 50 rows, actor resolved to full name). Orphan detection: Profile Picture Check card in Reports tab shows count of users with/without `profile_picture_url` set plus a listing for admin review. |
| **msg91-cleanup-fix** | AuthPage MSG91 useEffect cleanup fix (May 2026). **Critical (round 1)** — `delete window.sendOtp` (and the other 3 MSG91 globals) threw `TypeError: Cannot delete property 'sendOtp' of [object Window]` on every successful login because MSG91's CDN script registers globals as non-configurable; in strict-mode ES-module bundles `delete` on non-configurable properties throws; this propagated through React's commit phase → ErrorBoundary → "Something went wrong" crash on the student dashboard. Fixed with `try { delete w[key] } catch { w[key] = undefined }` for each of the four globals. **Critical (round 2)** — the `catch` fallback `w[key] = undefined` threw `TypeError: Cannot assign to read only property 'sendOtp' of object '[object Window]'` because MSG91 registers globals as **non-writable** too; fixed by wrapping both `delete` and assignment each in their own independent try/catch (both silently swallowed — globals persist but MSG91 re-initialises them on next mount). **Latent** — when the script tag already existed in the DOM but was still loading, a `'load'` event listener was added with no cleanup returned from the `useEffect`; if `AuthPage` unmounted before the script fired the listener was never removed; fixed by returning `() => existing.removeEventListener('load', doInit)` from that branch. `tsc --noEmit` and `npm run build` both pass cleanly after the fix. |
| **qa-bug-fix-pass** | QA-reported 13-bug validation and fix pass (May 2026). 12 of 13 confirmed as real bugs; 1 (Inspiration Next→Summary label) already working; 1 (grade filter) a data issue (no class_id assigned). **MyInspirationAssessment** — Save button on Summary tab was always disabled because `isVideoComplete(currentVideoIndex)` evaluated `video{N+1}` (non-existent) → `false`; fixed by branching on `currentVideoIndex >= inspirationVideos.length` to call new `saveSummaryProgress()` (fetches existing responses, merges all video + current summary, upserts); `mergeVideo` was padding saved responses to exactly 10 keys — empty questions 4-10 made `isComplete = false` for a 3-question video; replaced with dynamic loop over saved keys only + `Object.keys().length > 0` guard; `saveVideoProgress` now always forward-merges `responses.summary` so summary answers aren't wiped when saving a video. **MyDreamsAssessment** — DB `intro` field duplicated the Abdul Kalam quote when the Gemini prompt returned the same text as `dbQuote`; fixed with `safeDbIntro = dbIntro !== (dbQuote || '') ? dbIntro : null` guard; progress percentage now includes `summaryQuestions` in denominator (was 100% before summary answered); Next Section button now hidden on the Summary page via a ternary that renders Submit instead (was a disabled Next alongside a conditional Submit). **MyHobbiesAssessment** — Previous Section button was entirely absent; navigation div restructured to add it on the left; Next Section button now shows "Summary →" when the following section is `'summary'`. **MySchoolLearningAssessment** — Section 3 learning methods were multi-select (boolean flags); `handleLearningMethodChange` now single-selects by clearing all other flags before setting the chosen one; Next Section button shows "Summary →" before `section6`; save-progress toast used `section.replace('section', 'Section ')` for all sections — now shows "Summary" when `section === 'section6'`. **TeacherDashboard** — profile blink on save caused by `useEffect` dep `[userProfile]` (whole object): `refreshUserProfile()` created a new object reference → effect re-fired → `setLoading(true)` → full-page spinner replaced dashboard → ProfileDialog disappeared; fixed by changing dep to `[userProfile?.id]`; stats card → reviews tab navigation didn't reset `StudentAssessmentReview` internal `selectedStudent`; fixed with `reviewsResetKey` state incremented on every stats-card-to-reviews navigation, passed as `key` to `AssessmentResponsesView` to force remount. |
| **pre-signup-duplicate-check** | Pre-Signup Duplicate Mobile Validation (June 2026). Updated `AuthPage.tsx` to intercept signup flows before OTP is dispatched. Checks user existence server-side via the existing `set-first-password` Edge Function, returning a custom warning toast if a duplicate is registered, completely avoiding database migration requirements or new custom functions. |

