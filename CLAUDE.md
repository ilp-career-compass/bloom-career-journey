# CLAUDE.md — Bloom Career Journey: Project Context & Memory
<!-- Note: file exceeds 400 lines — all content is essential -->

## 1. Project Overview

**Bloom Career Journey** is a career guidance and self-assessment platform for rural Indian students (grades 8–12), built by the India Literacy Project (ILP). It bridges the career-guidance gap by combining structured self-reflection exercises with AI-powered summarization and teacher-guided mentoring.

### Target Users
| Role | Description |
|------|-------------|
| **Students** | Rural students (grades 8–12) completing self-assessment modules, recording voice responses, and building a career portfolio |
| **Teachers** | Counsellors/mentors who review AI-generated student summaries, approve/reject/edit them, manage student groups, view student career roadmaps/interests, and provide feedback |
| **Admins** | Platform administrators managing users, schools/states, assessment content, and system configuration |

### Regional/Language Context
- Supports **English (`en`)**, **Kannada (`kn`)**, **Tamil (`ta`)**, and **Hindi (`hi`)**
- AI language detection at the Unicode level (Kannada: `0C80–0CFF`, Tamil: `0B80–0BFF`, Hindi: `0900–097F`)
- Includes an **IndicKeyboard** component (`IndicKeyboard.tsx`) supporting Kannada, Tamil, and Hindi layouts with scroll compensation, enlarged touch targets, and haptic feedback
- Speech-to-Text optimized for **Indian accents and rural pronunciation** with post-processing for common Indian-English phonetic spellings

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
| AI Summaries | Google Gemini API (2.0 Flash / 1.5 Flash fallback) |
| AI Chatbot | Google Gemini API ("Vidya Saathi" persona) |
| Speech-to-Text | Google Cloud Speech-to-Text, Azure Speech Services, Gemini 1.5 Flash (cascading fallback) |
| Streaming STT | Sarvam API via WebSocket proxy (Python FastAPI backend at `server/proxy_server.py`) |
| Routing | React Router DOM 6 |
| State/Data | TanStack React Query 5 |
| Forms | React Hook Form + Zod validation |

### Key Libraries
- `recharts` — chart rendering (dashboards)
- `sonner` — toast notifications
- `lucide-react` — icon system
- `date-fns` — date formatting
- `embla-carousel-react` — carousels
- `IndicKeyboard` — custom multi-script virtual keyboard (Kannada, Tamil, Hindi layouts; replaced `simple-keyboard`)
- `react-resizable-panels` — resizable layouts
- `cmdk` — command palette
- `vaul` — drawer component
- `class-variance-authority` + `clsx` + `tailwind-merge` — styling utilities

---

## 3. Project Structure
```
bloom-career-journey/
├── src/
│   ├── App.tsx                    # Root component, all routes defined here
│   ├── main.tsx                   # Entry point, initializes speech services
│   ├── components/
│   │   ├── assessments/           # 8 assessment components + DB variants + SummaryViewDialog
│   │   ├── teacher/               # Teacher dashboard sub-components (5 files: Header, StatsCards, StudentsTab, StudentModals, teacherStrings)
│   │   ├── student/               # Student dashboard sub-components (5 files: Header, AssessmentGrid, ProgressSection (unused), CareerChatSection, studentStrings)
│   │   ├── chat/                  # Chat UI components
│   │   ├── ui/                    # 53 shadcn/ui components
│   │   ├── ProtectedRoute.tsx     # Role-based route guard
│   │   ├── HollandCodeTest.tsx    # Psychometric test component
│   │   ├── ChatbotDialog.tsx      # AI chatbot ("Vidya Saathi")
│   │   ├── NotificationBell.tsx   # Notification dropdown
│   │   ├── ProfileDialog.tsx      # User profile editor (includes language change)
│   │   ├── LanguageSelectionDialog.tsx  # Language picker (en/kn/ta/hi)
│   │   ├── ImportStudentsDialog.tsx     # Bulk student import
│   │   └── ResourceManager.tsx    # Counselling resource manager
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── AuthPage.tsx           # Login/Registration
│   │   ├── StudentDashboard.tsx   # Student home (orchestrator, summary dialog, deep-link support)
│   │   ├── TeacherDashboard.tsx   # Teacher home (thin orchestrator)
│   │   ├── AdminDashboard.tsx     # Admin panel
│   │   ├── HollandTest.tsx        # Standalone Holland test page
│   │   ├── CareersExplore.tsx     # Career exploration page
│   │   ├── ProfileCardPage.tsx    # My Career Compass — profile card with approval workflow
│   │   ├── CareerRoadmapPage.tsx  # Career Roadmap — milestone-based career tracker
│   │   ├── ThingsInterestMePage.tsx # Things that Interest Me — editable interests table
│   │   ├── TeacherStudentRoadmapPage.tsx  # Teacher read-only view of student's career roadmap
│   │   ├── TeacherStudentInterestsPage.tsx # Teacher read-only view of student's interests
│   │   └── StudentSummary.tsx     # Teacher view of a student's summaries
│   ├── services/
│   │   ├── aiSummaryService.ts       # AI summary generation + profile card keyword extraction
│   │   ├── aiChatService.ts          # AI chatbot service (Gemini)
│   │   ├── speechToTextService.ts    # STT with Google/Azure/Gemini fallback
│   │   ├── sarvamStreamingService.ts # Sarvam WebSocket streaming STT
│   │   ├── assessmentService.ts      # Assessment templates & media via Supabase RPCs
│   │   ├── summaryDatabaseService.ts # Summary CRUD + approval workflow
│   │   ├── notificationService.ts    # Notification CRUD via Supabase RPC
│   │   ├── audioResponseManager.ts   # Audio recording, transcription, upload, offline queue
│   │   ├── supabaseUploadService.ts  # Resumable chunked uploads for poor connectivity
│   │   ├── transcriptCleanupService.ts # Post-processing for transcriptions
│   │   └── translationService.ts     # Fetches translations from DB
│   ├── lib/
│   │   └── logger.ts                 # Centralized logger (dev-only output via import.meta.env.DEV)
│   ├── hooks/
│   │   ├── useAuth.tsx               # Auth context: signIn, signUp, signOut, profile management
│   │   ├── useLang.tsx               # i18n context: language + translation provider
│   │   ├── useIndicKeyboard.ts        # Multi-script virtual keyboard hook (Kannada, Tamil, Hindi)
│   │   ├── use-toast.tsx             # Toast notification hook
│   │   └── use-mobile.tsx            # Mobile detection hook
│   ├── integrations/supabase/
│   │   ├── client.ts                 # Supabase client initialization
│   │   └── types.ts                  # Generated Supabase types
│   ├── types/
│   │   └── assessmentSummary.ts      # Summary types + approval workflow types
│   └── utils/
│       ├── assessmentUnlock.ts       # Sequential assessment unlock logic (currently bypassed)
│       ├── summaryParsers.ts         # Summary text parsers
│       ├── databaseValidator.ts      # DB validation utilities
│       ├── errorHandler.ts           # Error handling utilities
│       └── driveLinks.ts             # Google Drive link utilities
├── server/
│   ├── proxy_server.py               # FastAPI WebSocket proxy for Sarvam STT
│   └── requirements.txt
├── supabase/
│   ├── config.toml
│   └── migrations/                   # 145+ SQL migration files (Jan 2025–Mar 2026)
├── scripts/
│   ├── parse_excel_questions.ts      # Parses xlsx → SQL migration
│   ├── sync_questions.ts             # Syncs questions from Google Sheet → SQL migration (pending)
│   ├── questions_snapshot.json       # Last known state of Google Sheet questions (pending)
│   ├── seed_test_data.ts             # Creates test teacher + 3 students for E2E testing
│   ├── generate_test_answers.ts      # Generates en/kn/ta test answers via Gemini API
│   ├── cleanup_test_data.ts          # Removes all seeded test data
│   ├── dump_sheets.ts                # Dumps Google Sheet tabs to console for inspection
│   ├── generate_migration.ts         # Generates SQL migration from Google Sheet data
│   ├── generate_correction_migration.ts # Generates correction migrations for key format fixes
│   └── test_upsert.ts               # Tests assessment_responses upsert as authenticated user
├── docs/
│   ├── E2E_test_report.md            # E2E test results
│   ├── manual_test_checklist.md      # Manual test checklist
│   ├── google-sheets-setup.md        # Google Sheets API setup guide (pending)
│   └── test-screenshots/             # Screenshots from E2E browser testing
├── .claude/
│   └── commands/
│       ├── migrate.md                # /migrate — scaffold a new Supabase migration file
│       ├── seed.md                   # /seed — set up or tear down test data
│       ├── ship.md                   # /ship — pre-commit verification pipeline (tsc + vite build)
│       ├── sync-sheet.md             # /sync-sheet — diff Google Sheet questions vs DB, generate migrations
│       ├── test-plan.md              # /test-plan — generate manual test checklist for a feature
│       └── wrap-up.md               # /wrap-up — update CLAUDE.md at end of session
├── vercel.json                       # Vercel deployment config
└── components.json                   # shadcn/ui config
```

### Organization Pattern
**Hybrid layer-based + feature-based**: Top-level folders by layer (`pages/`, `components/`, `services/`, `hooks/`, `utils/`); components use feature-based subdirectories (`assessments/`, `teacher/`, `chat/`, `ui/`).

---

## 4. Core Features & Modules

### Assessment Modules

| # | Assessment | Type Key | Component | Description |
|---|-----------|----------|-----------|-------------|
| 1 | **My Inspiration** | `inspiration` | `MyInspirationAssessment.tsx` | Watch inspirational videos, answer reflection questions |
| 2 | **About Me** | `about_me` | `AboutMeAssessment.tsx` | Personal profile questions: family, interests, strengths, dreams (up to 16 questions) |
| 3 | **My Dreams** | `dreams` | `MyDreamsAssessment.tsx` | Document 3 dream careers with pathways, qualities needed, prevention strategies |
| 4 | **My School, My Learning and I** | `school_learning` | `MySchoolLearningAssessment.tsx` | Reflect on school experience, learning styles, favorite subjects |
| 5 | **My Talents and Hobbies** | `hobbies` | `MyHobbiesAssessment.tsx` | Identify talents, hobbies, skills; connect to potential careers |
| 6 | **My Role Models** | `role_models` | `MyRoleModelsAssessment.tsx` | Identify role models, analyze qualities, draw parallels to own life |
| 7 | **Holland Code (RIASEC)** | `personality` | `HollandCodeAssessment.tsx` | 42-question psychometric test mapping to RIASEC categories |
| 8 | **Career Guidance Tools** | `career_guidance_tools` | `CareerGuidanceToolsAssessment.tsx` | Explore career resources, tools, and guidance materials |

Each assessment has a companion `*DB.tsx` component for DB operations. Responses saved as JSON in `assessment_responses.responses`.

**Assessment flow**: Student answers → saved to `assessment_responses` → AI summary auto-generated → saved to `assessment_summaries` → teacher notified → reviews/approves → student views approved summary.

**Summary tab**: Locked until all core questions answered. Uses `areCoreSectionsComplete()` per assessment. Unlocks progressively as student completes each section.

### AI Summary System (`src/services/aiSummaryService.ts`)
- **API**: Google Gemini (primary: `gemini-2.0-flash`, fallback: `gemini-2.0-flash-lite`)
- **`BASE_SYSTEM_PROMPT`**: Shared constant used by all 12 prompt builders — standardized career counsellor instructions with encouragement, language matching, and 2-3 sentence limits
- Per-assessment `generate*Summary()` methods (6 assessments × 2: primary + fallback)
- Profile card methods: `generateProfileCardKeywords()` (fetches questions from `content_translations`, returns `{question1: "2-3 words", ...}`) + `generateCareerDirection()` (synthesizes all modules into a paragraph)
- Prompt templates from `summary_templates` table (cached); falls back to hardcoded prompts
- `detectLanguage()` scans Unicode ranges for `en`/`kn`/`ta`/`hi`; output: structured JSON (`SummaryQuestions`)
- `SummaryTemplate` interface supports `en`, `kn?`, `ta?`, `hi?` language blocks
- All 6 assessments have Hindi `languageInstruction` blocks (Devanagari script instructions to Gemini)
- Role Models `buildRoleModelsPrompt()` reads questions from DB template (not hardcoded)
- Storage: `assessment_summaries` table; display priority: student edits > teacher edits > AI original

### Teacher Approval Workflow
- Teachers approve/reject/edit/request-revision on summaries via `SummaryApprovalCard.tsx`
- Statuses: `pending_approval` → `approved` | `rejected` | `revision_requested`
- On approval, language-aware notification sent to student (fetches `preferred_language` from `users` table) via `create_notification_secure` RPC
- `AISummaryReview.tsx` passes student's `preferred_language` to AI summary generators (not just `detectLanguage`)

### Audio / Voice Features
- **Batch STT** (`speechToTextService.ts`): Google Cloud → Azure → Gemini fallback; supports `en-IN`, `hi-IN`, `kn-IN`, `ta-IN`
- **Streaming STT** (`sarvamStreamingService.ts`): Browser → WebSocket → FastAPI proxy → Sarvam API
- Offline queue (`audioResponseManager.ts`) + resumable chunked uploads (`supabaseUploadService.ts`) for poor connectivity
- **Lazy initialization**: mic permission requested only on first record click (not on page load); localized denial messages (en/kn/ta/hi)

### AI Chatbot ("Vidya Saathi")
- `aiChatService.ts` + `ChatbotDialog.tsx`; empathetic career guidance persona; same Gemini cascade fallback as summaries

### My Compass Feature
- **Profile Card** (`/student/profile-card`): 6 module cards — always visible, never locked. Each card shows profile card questions (from `content_translations` with `resource_type: profile_card_{type}`) with 2-3 word AI-generated answers when complete, or blank labels with "Complete this module" nudge when incomplete. 7th "My Career Direction" card synthesizes all 6. Answers cached in `profile_card_cache` as JSON objects `{question1: "answer", ...}`. **Teacher approval workflow**: keywords hidden from student until teacher approves; rejected cards show teacher feedback; keywords reset to `pending` when student updates responses. Teachers review/approve/reject at `/teacher/student-profile-card/:studentId`. Hindi support included in all UI strings.
- **Profile Card Questions**: Stored in `content_translations` with `resource_type: profile_card_{assessment_type}` (e.g. `profile_card_inspiration`). Keys: `title`, `question1`, `question2`, etc. All 4 languages. Source: Google Sheet tab "Profile Card Questions - Grade". Holland Code section deferred.
- **Things that Interest Me** (`/student/things-interest-me`): Editable 4-column table (Subject, Lesson/Chapter, Why Factors, Compatible Career) where students list things they're interested in. Accessible from compass menu in student dashboard header. Post-assessment completion redirects here with `?from={assessment_type}` to encourage reflection. Auto-saves with 1s debounce. Fully translated in all 4 languages (en/kn/ta/hi). IndicKeyboard enabled for non-English users. Backed by `things_that_interest_me` table with RLS.
- **Career Roadmap** (`/student/career-roadmap`): 7 milestone rows × 4 columns (Milestone + Plan A/B/C). Top 3 rows editable (beginning/end of 9th, beginning of 10th), bottom 4 locked. Autosave with 1s debounce to `career_roadmap` table. Midterm roadmap trigger moved from module 4 to module 5.

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
| preferred_language | CHECK constraint: `en`, `kn`, `ta`, `hi` (default `en`) |
| bio, interests, career_goals, strengths, areas_for_growth | text nullable |
| profile_picture_url, date_of_birth, gender, address | nullable |

#### `students`
| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | FK → `users.id` |
| class_id | FK → `classes.id` |
| teacher_id | uuid NOT NULL |
| enrollment_status | enum: `active`, `inactive`, `pending`, `graduated`, `transferred` |
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
orgs (id, name)
  └──1:N──→ states (id, state_name, org_id, state_code)
                └──1:N──→ classes (id, name, state_id)
                └──1:N──→ teachers (via state_id)
```

#### `assessment_responses`
| Column | Type |
|--------|------|
| id | uuid PK |
| student_id | FK → `students.id` |
| assessment_type | text NOT NULL |
| responses | jsonb NOT NULL |
| completed_at | timestamptz nullable (null = in progress) |
| review_status | enum: `unreviewed`, `in_review`, `reviewed`, `needs_revision`, `flagged` |
| | **UNIQUE (student_id, assessment_type)** — all writes must use `.upsert()` |

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
| type | `summary_approved`, `teacher_message`, `assessment_submitted`, `system` |
| title, message, link | text |
| read_at | timestamptz nullable (null = unread) |

#### Compass Tables
- **`profile_card_cache`**: `(student_id, assessment_type)` unique; `keywords` jsonb stores `{question1: "2-3 word answer", question2: "..."}` for modules, `{direction: "paragraph"}` for `assessment_type = 'career_direction'`
- **`career_roadmap`**: `(student_id, milestone)` unique; `plan_a/b/c` text; milestones: `beginning_9th`, `end_9th`, `beginning_10th`, `midterm_10th`, `post_exam_10th`, `before_results_10th`, `final_decision`

#### Other Tables
- **`chat_channels`** / **`chat_messages`**: teacher–student messaging
- **`counselling_activities`** / **`student_activity_progress`**: structured activities with completion tracking
- **`counselling_resources`**: PDFs, videos, worksheets with download counts
- **`student_notes`**: teacher observations (types: observation/meeting/progress/concern/achievement/follow_up)
- **`student_groups`**: teacher-created groups within states/classes
- **`summary_templates`**: per-assessment-type Gemini prompt templates, multi-language
- **`content_translations`**: UI text translations by `resource_type`, `resource_key`, `lang`. Includes `profile_card_{type}` entries for profile card questions (4 langs)
- **`inspiration_sources`**: video URLs for My Inspiration assessment; `lang` column for per-language video sets (en/kn/ta/hi)
- **`things_that_interest_me`**: `(student_id, row_order)` with `subject`, `lesson_chapter`, `why_factors`, `compatible_career`, `source_assessment`; RLS-protected

### Relationships
```
orgs ──1:N──→ states ──1:N──→ classes / teachers
users ──1:1──→ students / teachers
students ──1:N──→ assessment_responses ──1:1──→ assessment_summaries
users ──1:N──→ notifications
students + teachers ──→ chat_channels ──1:N──→ chat_messages
```

---

## 6. Database Migrations

See `supabase/migrations/` for full history (150+ files, Jan 2025 – Apr 2026).

### Recent Migrations (last 5)
| Date | Migration | What It Does |
|------|-----------|--------------|
| 2026-04-01 | `enable_rls_public_tables` | Enables RLS on 18 public content/question tables (assessment_questions, content_translations, etc.) with read-only policies for authenticated users |
| 2026-03-31 | `fix_summary_rpc_key_mismatch` | Recreates all 6 summary question RPCs to use `'summary_question' || N` key prefix (was `'question' || N`), fixing i18n fallback to English |
| 2026-03-31 | `users_email_case_insensitive_unique` | Normalizes existing emails to lowercase, adds `UNIQUE INDEX users_email_lower_unique ON users (LOWER(email))` |
| 2026-03-26 | `dreams_summary_questions_i18n` | Creates `dreams_summary_questions` table, inserts 4 questions × 4 languages into `content_translations` |
| 2026-03-25 | `inspiration_videos_lang_and_hindi` | Adds `lang` column to `inspiration_sources`, inserts 3 videos × 4 languages (en/kn/ta/hi), recreates `get_inspiration_videos(p_lang)` RPC with language filter |

### Notable Schema Notes
- **Schools → States**: Renamed organizational unit to "state"
- **SQL Unicode rule**: All Kannada/Tamil/Hindi text in migrations must use PostgreSQL dollar-quoting (`$$...$$`)
- **Bulk question update (Mar 2026)**: `about_me_fields.question11` deleted, `role_models_questions` shifted by 1, `question19` removed
- **preferred_language (Mar 2026)**: Changed from enum to CHECK constraint to allow adding languages without migration complexity
- **assessment_responses unique constraint (Mar 2026)**: `UNIQUE (student_id, assessment_type)` — all writes must use `.upsert({ onConflict: 'student_id,assessment_type' })`
- **RLS on assessment_responses**: Enabled with 4 policies (`ar_select_student`, `ar_insert_student`, `ar_update_student`, `ar_select_teacher`) using `is_student_owned_by_auth()` function
- **inspiration_sources lang (Mar 2026)**: `lang` column added; `get_inspiration_videos(p_lang)` RPC replaces parameterless version; 3 videos per language (en/kn/ta/hi)
- **users email unique index (Mar 2026)**: `UNIQUE INDEX users_email_lower_unique ON users (LOWER(email))` prevents case-insensitive email duplicates. All emails normalized to lowercase on insert.
- **summary RPC key fix (Mar 2026)**: All 6 `get_*_summary_questions_i18n` RPCs updated to look up `'summary_question' || N` (was `'question' || N`) matching keys set by clean_slate + fix_content_key_formats migrations
- **RLS on public tables (Apr 2026)**: 18 content/question tables have RLS enabled with authenticated read-only policies. All `SECURITY DEFINER` RPCs continue to bypass RLS.

---

## 7. Supabase Configuration

### Auth
- Email + password; `localStorage`-based session with `persistSession: true`, `autoRefreshToken: true`
- Role stored in both `auth.users.user_metadata.role` and `public.users.role`

### Storage Buckets
| Bucket | Purpose |
|--------|---------|
| `audio-files` | Student voice recordings (RLS-protected) |
| `avatars` | Profile pictures (RLS-protected) |

### Key RPC Functions
- `get_assessment_template(p_assessment_type)` — fetch template + questions
- `get_inspiration_videos(p_lang)` — fetch inspiration videos filtered by language (en/kn/ta/hi)
- `get_assessment_media_sources(p_assessment_type)` — fetch media for assessment
- `get_student_assessment_responses(teacher_user_id, filter?)` — teacher access to responses
- `get_review_overview(teacher_user_id)` — summary counts for teacher dashboard
- `get_student_review_progress(teacher_user_id)` — per-student review progress
- `update_assessment_review(teacher_user_id, response_id, review)` — save review
- `get_or_create_chat_channel(p_student_id, p_teacher_id)` — chat channel upsert
- `create_notification_secure(p_user_id, p_type, p_title, p_message, p_link)` — create notification
- `get_all_assessment_templates()` / `update_assessment_template(...)` / `upsert_media_source(...)` — admin ops

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_GEMINI_API_KEY` | Google Gemini (AI summaries + chatbot) |
| `VITE_GOOGLE_SPEECH_API_KEY` | Google Cloud Speech-to-Text |
| `VITE_AZURE_SPEECH_KEY` | Azure Speech Services (optional fallback) |
| `VITE_AZURE_SPEECH_REGION` | Azure Speech region (optional) |
| `VITE_SARVAM_PROXY_URL` | Sarvam WebSocket proxy (default: `ws://127.0.0.1:8000/ws/stream`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Sheets API service account credentials (for `sync-questions`) |
| `GOOGLE_SHEET_ID` | Google Sheet ID for question sync |

---

## 8. API & Service Layer

### Communication Pattern
Frontend → Supabase directly (queries, RPCs, storage). AI/ML services are direct client-side API calls (`VITE_*` keys). Sarvam STT is the only server-mediated service (Python proxy).

### Service Summary
| Service File | Key Methods |
|-------------|-------------|
| `aiSummaryService.ts` | `generate*Summary()`, `detectLanguage()`, `generateProfileCardKeywords()`, `generateCareerDirection()` |
| `aiChatService.ts` | `sendMessage()`, `isConfigured()` |
| `speechToTextService.ts` | `transcribe()`, `transcribeAutoDetect()`, `transcribeLongRunningByUri()` |
| `sarvamStreamingService.ts` | `connect()`, `sendAudioChunk()`, `disconnect()` |
| `assessmentService.ts` | `getAssessmentTemplate()`, `getMediaSources()`, `getHollandCodeData()` |
| `summaryDatabaseService.ts` | `createAISummary()`, `approveSummary()`, `rejectSummary()`, `updateTeacherSummary()` |
| `notificationService.ts` | `getUnreadCount()`, `list()`, `markRead()`, `create()` |
| `audioResponseManager.ts` | `processAudioResponse()`, `syncOfflineQueue()` |
| `supabaseUploadService.ts` | `uploadFile()`, `queueUpload()`, `processQueue()` |

---

## 9. Auth & Role-Based Access

### Frontend
- **`ProtectedRoute.tsx`**: checks auth + role match; redirects to `/auth` or role dashboard
- Role-based redirects: admin → `/admin`, teacher → `/teacher`, student → `/student`
- Compass routes: `/student/profile-card`, `/student/career-roadmap`, `/student/things-interest-me`, `/teacher/student-profile-card/:studentId`, `/teacher/student-roadmap/:studentId`, `/teacher/student-interests/:studentId`

### Backend (RLS)
- Students: read/write own data only
- Teachers: access students in their state
- Admins: broader access
- RPC functions use `SECURITY DEFINER` where RLS bypass needed

---

## 10. State Management & Data Fetching

### Global Providers (`App.tsx`)
`ErrorBoundary → Router → AuthProvider → LangProvider → Routes + Toaster`
- **`AuthProvider`** (`useAuth.tsx`): `user`, `session`, `signIn`, `signUp`, `signOut`, `userProfile`
- **`LangProvider`** (`useLang.tsx`): language state, translation functions, language switching
- Most fetching uses `useEffect` + direct Supabase calls with local `useState` (TanStack React Query available)

---

## 11. Key Conventions & Patterns

### Naming
| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `MyInspirationAssessment.tsx` |
| Services | camelCase singleton | `aiSummaryService` |
| Hooks | `use` prefix | `useAuth`, `useLang` |
| DB tables | snake_case | `assessment_responses` |
| Environment vars | `VITE_` prefix + SCREAMING_SNAKE | `VITE_GEMINI_API_KEY` |

### Other Patterns
- **Forms**: React Hook Form + Zod + `@hookform/resolvers`
- **Logging**: All `console.*` routed through `src/lib/logger.ts` — silent in production (`import.meta.env.DEV` gate)
- **Error handling**: `utils/errorHandler.ts`, `ErrorBoundary` class component, `sonner` toasts
- **Assessment components**: always come in pairs — `*Assessment.tsx` (UI+logic) + `*AssessmentDB.tsx` (DB ops)
- **SQL Unicode**: All Kannada/Tamil/Hindi text in migrations must use PostgreSQL dollar-quoting (`$$...$$`)
- **assessment_responses writes**: ALWAYS use `.upsert({ ... }, { onConflict: 'student_id,assessment_type' })` — NEVER use bare `.insert()`. The table has a unique constraint and RLS policies that require upsert.
- **Bug fixes**: documented in git commit messages only — not in this file

---

## 12. Current Implementation Status

**Last verified build:** 2026-04-05

### Assessment Module Status
| Assessment | UI | DB Save | AI Summary | Teacher Approval | Fully Wired |
|------------|:--:|:-------:|:----------:|:----------------:|:-----------:|
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
> **API keys proxied**: Gemini API key moved to `gemini-proxy` Supabase Edge Function (Apr 2026). `VITE_GEMINI_API_KEY` and `VITE_GOOGLE_SPEECH_API_KEY` removed from client bundle.

> [!NOTE]
> **Holland Code & Career Guidance Tools**: No AI summary or teacher approval wired — intentional for now.

> [!NOTE]
> **Hindi content translations**: Summary questions have Hindi translations for all 6 assessments. Some `content_translations` rows for `hi` still pending ILP updating Google Sheet for non-summary content.

> [!NOTE]
> **Career roadmap milestone labels**: Hardcoded in English/Kannada/Tamil only — no Hindi support. Pending decision on DB migration.

> [!NOTE]
> **Sheet restructuring in progress**: Phases 2–3 (Google Sheets sync automation) paused until new sheet format is finalized by ILP.

> [!NOTE]
> **ResponseViewer duplicated**: `ResponseViewer` component exists in both `StudentSummary.tsx` and `TeacherStudentResponsesPage.tsx`. The `TeacherStudentResponsesPage` version is the correct one — it handles booleans as "Yes"/"No" explicitly. Extract to a shared component (e.g. `src/components/ui/ResponseViewer.tsx`) in a future cleanup pass.

> [!NOTE]
> **ProgressSection component unused**: `src/components/student/ProgressSection.tsx` is no longer rendered in StudentDashboard — can be deleted in a cleanup pass.

> [!NOTE]
> **Profile Card Holland Code section**: Google Sheet has "My Nature My Style (Holland Code)" with 2 questions, but not yet added to `content_translations` or `ProfileCardPage.tsx`. Deferred until Holland Code gets AI summary support.

> [!NOTE]
> **sync-questions**: `scripts/sync_questions.ts` and Google Sheets automation pending implementation.

> [!NOTE]
> **Phone-only auth (PR 2a, Apr 2026)**: Custom auth flow (mock session, `authenticate_student` RPC for email, `@internal.app` email generation, `customAuth` localStorage) has been removed. All sign-in now uses `supabase.auth.signInWithPassword({ phone, password })`. Teacher self-registration uses the `create-teacher` Edge Function. Student creation remains teacher-driven via `create-student` Edge Function. The `student_auth_credentials` table and `authenticate_student` RPC (phone-only) are kept temporarily for the 30 legacy NO students — to be removed after the backfill script runs.

> [!NOTE]
> **Legacy NO students**: 30 students created before PR 1 (create-student Edge Function) still use `student_auth_credentials` for authentication via the `authenticate_student` RPC (phone-only). A backfill script must be run to migrate them to real Supabase Auth accounts, after which `student_auth_credentials` and `authenticate_student` can be deleted.

### Completed Work (Mar–Apr 2026 Sessions)
| Phase | Description | Status |
|-------|-------------|--------|
| **0A** | Fix corrupted `question1` in School Learning summary questions | ✅ |
| **0B** | Create `get_role_models_assessment_template` RPC, fix 404 bug | ✅ |
| **1C** | Move summary section titles to DB (Inspiration, About Me, Dreams, School Learning) | ✅ |
| **1D** | Move About Me section titles to DB | ✅ |
| **1E** | Move School Learning method options to DB | ✅ |
| **4A** | Rename keyboard to IndicKeyboard, add Tamil + Hindi layouts, UX improvements (scroll compensation, touch targets, haptic feedback) | ✅ |
| **4B** | Add Hindi (`hi`) to `preferred_language` CHECK constraint | ✅ |
| **4C** | Hindi language support across all services and components (English fallback strings) | ✅ |
| **4D** | Remove unused `simple-keyboard` dependency | ✅ |
| **4E** | Full verification: `tsc`, `vite build`, dependency audit — all passing | ✅ |
| **5A** | Add `hi` to `SummaryTemplate` type, remove `(template as any)` casts | ✅ |
| **5B** | Fix Role Models `buildRoleModelsPrompt()` to read questions from DB template | ✅ |
| **5C** | Add Hindi `languageInstruction` blocks to all 12 prompt builders (6 assessments × primary + fallback) | ✅ |
| **5D** | Create `BASE_SYSTEM_PROMPT` constant — standardized career counsellor system prompt for all AI summaries (-115 lines duplication) | ✅ |
| **5E** | Profile card questions migration: 22 questions + 6 titles × 4 languages from Google Sheet → `content_translations` | ✅ |
| **5F** | Rewrite `generateProfileCardKeywords()`: fetches questions from DB, returns `{question1: "2-3 words", ...}` instead of generic keyword array | ✅ |
| **5G** | Rewrite `ProfileCardPage.tsx`: question label → answer display, clickable cards, Hindi support, deep-link to summary dialog | ✅ |
| **5H** | Student dashboard: auto-open `SummaryViewDialog` from URL params (`?assessment=X&tab=summary`) | ✅ |
| **5I** | Remove placeholder Assessment Progress Summary section from student dashboard | ✅ |
| **6A** | Clean slate content migration from restructured Google Sheets (about_me_fields, hobbies_questions updated) | ✅ |
| **6B** | Content key format fixes: role_models underscore removal, about_me section key alignment | ✅ |
| **6C** | Hobbies summary template key remapping (`question1-8` → `question1-10` to match new sheet) | ✅ |
| **6D** | Assessment type/title mismatches fixed (About Me, School Learning, Hobbies components) | ✅ |
| **6E** | Career roadmap: `midterm_9th` milestone added, auto-redirect on first assessment open | ✅ |
| **6F** | UI consistency fixes: Tamil strings, Hindi auth page, footer year, translation spinners, accessibility | ✅ |
| **6G** | Bug fixes — CRITICAL: API URL spaces, lang mismatch; HIGH: race conditions, error handling; MEDIUM: save guards, i18n, polling, timer cleanup | ✅ |
| **6H** | Add `UNIQUE (student_id, assessment_type)` constraint on `assessment_responses` + deduplicate existing rows | ✅ |
| **6I** | Convert ALL `.insert()` → `.upsert({ onConflict })` on `assessment_responses` across entire codebase (10 files, 0 bare inserts remain) | ✅ |
| **6J** | Drop stale RLS policy "Students can manage their own assessment responses" (caused 409 on upsert) | ✅ |
| **6K** | Re-enable RLS on `assessment_responses` with correct `ar_*` policies via `is_student_owned_by_auth()` | ✅ |
| **6L** | E2E backend test: 42/42 pass | ✅ |
| **7A** | "Things that Interest Me" page: editable table, compass menu entry, post-assessment redirect | ✅ |
| **7B** | Mobile keyboard fixes: overlap/interaction, backdrop, body scroll lock | ✅ |
| **7C** | Notification panel mobile alignment | ✅ |
| **7D** | Audio recording transcription message change | ✅ |
| **7E** | Lazy audio initialization: no page-load error banner, mic permission requested only on first record click, localized denial messages (en/kn/ta/hi) | ✅ |
| **7F** | Career roadmap midterm trigger moved from module 4 to module 5 | ✅ |
| **7G** | Remove Category/What I said labels from About Me AI summary prompt | ✅ |
| **8A** | Comprehensive i18n: 100+ hardcoded English strings translated to Hindi across all 6 assessment components (buttons, labels, toasts, errors, completion screens) | ✅ |
| **8B** | IndicKeyboard added to ThingsInterestMePage, Hindi added to ProfileDialog and ChatBubble keyboard conditions | ✅ |
| **8C** | Inspiration videos: `lang` column on `inspiration_sources`, 3 videos × 4 languages (en/kn/ta/hi), `get_inspiration_videos(p_lang)` RPC with language filter, Hindi video 3: `youtu.be/-9OGDxKtUMI` | ✅ |
| **8D** | SummaryApprovalCard notifications language-aware: fetches student's `preferred_language`, translates title/message to kn/ta/hi | ✅ |
| **8E** | AISummaryReview passes student's `preferred_language` to AI summary generators (teacher-triggered summaries now respect student language) | ✅ |
| **8F** | ThingsInterestMePage Hindi translations: all 17 strings translated from English fallback to proper Hindi | ✅ |
| **8G** | NotificationBell: dropdown closes on item click | ✅ |
| **8H** | Hobbies Hindi section names added to save-progress display (शौक और रुचियाँ, प्रतिभाएँ और अभ्यास, सहायता और करियर संबंध) | ✅ |
| **9A** | About Me: add mandatory asterisks (*) to Question/TripleInput/DoubleInput sub-components | ✅ |
| **9B** | Remove duplicate help text display (blue box + placeholder) across 4 assessments: About Me, Inspiration, Dreams, Role Models. Placeholder now generic translated prompt | ✅ |
| **9C** | CSV bulk import (`ImportStudentsDialog`): `.insert()` → `.upsert({ onConflict: 'user_id' })` on students/credentials, check existing user before creating | ✅ |
| **9D** | Case-insensitive email matching: `.eq('email')` → `.ilike('email')` in signUp, handleAddStudent, CSV import. Emails normalized to lowercase on insert. Migration: `UNIQUE INDEX users_email_lower_unique ON users (LOWER(email))` | ✅ |
| **9E** | Bruno account merge: deleted duplicate user/student records created by case-sensitive email mismatch (`Bruno@gmail.com` vs `bruno@gmail.com`), normalized email to lowercase | ✅ |
| **9F** | Summary RPC key mismatch: all 6 summary question RPCs updated from `'question' || N` → `'summary_question' || N` to match actual `content_translations` keys (clean_slate + fix_content_key_formats migration chain) | ✅ |
| **9G** | NotificationBell: mobile full-width positioning (`fixed top-14 left-2 right-2` on mobile, `absolute right-0` on sm+) | ✅ |
| **9H** | Teacher review: Hindi language detection in `detectLangKeyFromResponses` (U+0900-097F), Hindi translations loaded for all question fetch functions | ✅ |
| **9I** | Teacher review: `renderSummaryTabSection` shows actual translated summary question text instead of raw "Q1"/"Q2" labels. Handles flat summary keys (`summary_qN`, `summary_N`) for Dreams/Hobbies/Role Models | ✅ |
| **9J** | Teacher review: Inspiration questions translated via `get_inspiration_questions_i18n(p_lang)`, Dreams/About Me fallback branches show "Question N" instead of raw key names | ✅ |
| **10A** | Teacher dashboard: Performance column → Language column, actions menu with View Career Roadmap / View Things That Interest Me / Review Profile Card | ✅ |
| **10B** | New pages: `TeacherStudentRoadmapPage` (read-only roadmap view), `TeacherStudentInterestsPage` (read-only interests view) | ✅ |
| **10C** | Profile card approval workflow: pending/approved/rejected states, keywords hidden until teacher approves, keywords reset to pending on student response update | ✅ |
| **10D** | Student can change preferred language from ProfileDialog | ✅ |
| **10E** | Mobile button layout fix: safe-area padding, prevent text wrapping and bottom cut-off | ✅ |
| **10F** | Analytics tab removed from teacher dashboard | ✅ |
| **10G** | RLS enabled on 18 public content/question tables with authenticated read-only policies | ✅ |
| **11A** | Fix language change bug: `fetchUserProfile` had guard making `refreshUserProfile()` a no-op; `derivedLang` in `useLang.tsx` reverted to stale `preferred_language` after `setLang()`. Fix: added `forceRefresh` param, reordered `refreshUserProfile()` before `setLang()` in `ProfileDialog.tsx`, removed 500ms delay. Language priority: URL param → `userProfile.preferred_language` → `localStorage.lang` → `'en'` | ✅ |
| **11B** | Fix Tamil button overflow in MyInspirationAssessment bottom nav: removed `whitespace-nowrap` from all 4 buttons (Previous, Save, Next, Submit). Layout (`flex-col-reverse sm:flex-row`, `w-full sm:w-auto`) unchanged | ✅ |
| **11C** | Fix teacher career roadmap empty: `TeacherStudentRoadmapPage` was querying `career_roadmap` with `students.id` but `career_roadmap.student_id` references `users.id`. Fix: use `student.user_id` instead of URL param `studentId` | ✅ |
| **11D** | Fix teacher interests empty: same `student_id` mismatch in `TeacherStudentInterestsPage`. Fix: use `student.user_id` for `things_that_interest_me` query | ✅ |
| **11E** | Fix logout not working for custom-auth students: `supabase.auth.signOut()` fails for custom-auth (no real session), gating state clearing inside success branch meant localStorage/React state never cleared. Fix: moved all state clearing outside success gate — runs unconditionally. `supabase.auth.signOut()` now best-effort only. Removed duplicate success toast from `signOut()` | ✅ |
| **PR 2a** | Phone-only auth migration: `create-teacher` Edge Function, `signIn` via `signInWithPassword({ phone })`, remove custom auth path + mock sessions + `@internal.app` emails, `authenticate_student` RPC phone-only, `search_students` RPC email branch removed + mobile partial match, all email display → mobile across 5 files | ✅ |
| **PR 2a-fix** | Profile card cache FK fix: `ProfileCardPage.tsx` + `StudentModals.tsx` + teacher view — all `profile_card_cache` queries/upserts now use `users.id` (not `students.id`); teacher view resolves `students.id → user_id` internally; `StudentModals.tsx` URL param convention corrected (`selectedStudent.id` → `selectedStudent.user_id`) | ✅ |
| **PR 2b-temp** | Temp: show generated password in teacher toast for testing — `create-student` Edge Function returns `tempPassword` in response; `TeacherDashboard.tsx` success toast shows it; `ImportStudentsDialog.tsx` lists it per created student. All locations marked `// TEMP: remove in PR 2b` | ✅ |
| **PR 2b-reg** | Re-enable student self-registration: new `create-student-self-register` Edge Function (`supabase/functions/create-student-self-register/index.ts`) — `auth.admin.createUser({ phone_confirm: true })`, inserts into `users` + `students` (`teacher_id: null`, `enrollment_status: pending`), no `student_auth_credentials` entry. `AuthPage.tsx`: role toggle (“I am a Teacher” / “I am a Student”), grade picker (static Class 8–12), student path calls new Edge Function then auto-signs in | ✅ |
| **12A** | `TeacherStudentResponsesPage` (`/teacher/student-responses/:studentId`): 8-tab read-only view of all assessment responses. Generic `ResponseViewer` for inspiration/about_me/dreams/school_learning/career_guidance_tools (booleans → Yes/No). Custom renderers for hobbies (hobby cards), role_models (role model cards), personality/Holland Code (code + RIASEC score bars, raw answers hidden). “View Responses” added to student actions menu in StudentsTab after “Review Profile Card”. Student responses always display in the student's own language — no transformation applied. | ✅ |
| **12B** | Fix Hindi detection in `SummaryApprovalCard.detectLangKeyFromSummary()`: added Devanagari range `/[\u0900-\u097F]/` check before English fallback. Return type widened to `'en' \| 'ta' \| 'kn' \| 'hi'`. Hindi summaries now load `questions.hi` template block. | ✅ |
| **2–3** | Google Sheets sync automation | ⏸�� Paused — sheet restructuring in progress |