# CLAUDE.md — Bloom Career Journey: Project Context & Memory

## 1. Project Overview

**Bloom Career Journey** is a career guidance and self-assessment platform designed for rural students in India (grades 8–12), built by the India Literacy Project (ILP). The platform helps students discover their interests, strengths, dreams, and career aptitudes through a structured series of guided assessments.

### Core Purpose
Bridge the career-guidance gap for underserved students in rural India by combining structured self-reflection exercises with AI-powered summarization and teacher-guided mentoring.

### Target Users
| Role | Description |
|------|-------------|
| **Students** | Rural students (grades 8–12) completing self-assessment modules, recording voice responses, and building a career portfolio |
| **Teachers** | Counsellors/mentors who review AI-generated student summaries, approve/reject/edit them, manage student groups, and provide feedback |
| **Admins** | Platform administrators managing users, schools/states, assessment content, and system configuration |

### Regional/Language Context
- Supports **English (`en`)**, **Kannada (`kn`)**, and **Tamil (`ta`)**
- AI language detection at the Unicode level (Kannada: `0C80–0CFF`, Tamil: `0B80–0BFF`)
- Includes a **Kannada virtual keyboard** (`useKannadaKeyboard` hook + `simple-keyboard` library)
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
- `simple-keyboard` — Kannada virtual keyboard
- `react-resizable-panels` — resizable layouts
- `cmdk` — command palette
- `vaul` — drawer component
- `class-variance-authority` + `clsx` + `tailwind-merge` — styling utilities

### Dev Dependencies
- ESLint 9 with React Hooks + React Refresh plugins
- PostCSS + Autoprefixer
- `lovable-tagger` — build plugin (Lovable platform integration)
- `tsx` — TypeScript script runner
- `dotenv` — environment variable loading

---

## 3. Project Structure

```
bloom-career-journey/
├── src/
│   ├── App.tsx                    # Root component, all routes defined here
│   ├── main.tsx                   # Entry point, initializes speech services
│   ├── index.css                  # Global styles + Tailwind directives
│   ├── App.css                    # App-level styles
│   ├── components/
│   │   ├── assessments/           # 8 assessment components + DB variants + SummaryViewDialog
│   │   ├── teacher/               # Teacher dashboard sub-components (6 files: Header, StatsCards, StudentsTab, StudentModals, AnalyticsTab, teacherStrings)
│   │   ├── student/               # Student dashboard sub-components (5 files: Header, AssessmentGrid, ProgressSection, CareerChatSection, studentStrings)
│   │   ├── chat/                  # Chat UI components
│   │   ├── ui/                    # 53 shadcn/ui components
│   │   ├── ProtectedRoute.tsx     # Role-based route guard
│   │   ├── HollandCodeTest.tsx    # Psychometric test component
│   │   ├── ChatbotDialog.tsx      # AI chatbot ("Vidya Saathi")
│   │   ├── NotificationBell.tsx   # Notification dropdown
│   │   ├── ProfileDialog.tsx      # User profile editor
│   │   ├── LanguageSelectionDialog.tsx  # Language picker (en/kn/ta)
│   │   ├── ImportStudentsDialog.tsx     # Bulk student import
│   │   ├── ResourceManager.tsx    # Counselling resource manager
│   │   └── ...
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── AuthPage.tsx           # Login/Registration (18KB)
│   │   ├── StudentDashboard.tsx   # Student home (thin orchestrator → sub-components in components/student/)
│   │   ├── TeacherDashboard.tsx   # Teacher home (thin orchestrator → sub-components in components/teacher/)
│   │   ├── AdminDashboard.tsx     # Admin panel (31KB)
│   │   ├── HollandTest.tsx        # Standalone Holland test page
│   │   ├── CareersExplore.tsx     # Career exploration page
│   │   ├── ProfileCardPage.tsx    # My Career Compass — profile card with AI keywords (student + teacher read-only)
│   │   ├── CareerRoadmapPage.tsx  # Career Roadmap — milestone-based career choice tracker
│   │   ├── StudentSummary.tsx     # Teacher view of a student's summaries
│   │   └── *TestPage.tsx          # Audio, Assessment, Database test pages
│   ├── services/
│   │   ├── aiSummaryService.ts       # AI summary generation (2368 lines, 106KB)
│   │   ├── aiChatService.ts          # AI chatbot service (Gemini)
│   │   ├── speechToTextService.ts    # STT with Google/Azure/Gemini fallback
│   │   ├── sarvamStreamingService.ts # Sarvam WebSocket streaming STT
│   │   ├── assessmentService.ts      # Assessment templates & media via Supabase RPCs
│   │   ├── summaryDatabaseService.ts # Summary CRUD + approval workflow
│   │   ├── notificationService.ts    # Notification CRUD via Supabase RPC
│   │   ├── audioResponseManager.ts   # Audio recording, transcription, upload, offline queue
│   │   ├── supabaseUploadService.ts  # Resumable chunked uploads for poor connectivity
│   │   ├── transcriptCleanupService.ts # Post-processing for transcriptions
│   │   ├── translationService.ts     # Fetches translations from DB
│   ├── lib/
│   │   └── logger.ts                 # Centralized logger (dev-only output via import.meta.env.DEV)
│   ├── hooks/
│   │   ├── useAuth.tsx               # Auth context: signIn, signUp, signOut, profile management
│   │   ├── useLang.tsx               # i18n context (25KB): language + translation provider
│   │   ├── useKannadaKeyboard.ts     # Kannada virtual keyboard hook
│   │   ├── use-toast.tsx             # Toast notification hook
│   │   └── use-mobile.tsx            # Mobile detection hook
│   ├── integrations/supabase/
│   │   ├── client.ts                 # Supabase client initialization
│   │   └── types.ts                  # Generated Supabase types (887 lines)
│   ├── types/
│   │   └── assessmentSummary.ts      # Summary types + approval workflow types
│   ├── utils/
│   │   ├── assessmentUnlock.ts       # Sequential assessment unlock logic
│   │   ├── summaryParsers.ts         # Summary text parsers
│   │   ├── databaseValidator.ts      # DB validation utilities
│   │   ├── errorHandler.ts           # Error handling utilities
│   │   └── driveLinks.ts             # Google Drive link utilities
│   ├── config/
│   │   └── audioConfig.ts            # Audio recording configuration
│   ├── data/
│   │   └── resources.ts              # Static resource data
│   └── career_cards/                 # Career card assets
├── server/
│   ├── proxy_server.py               # FastAPI WebSocket proxy for Sarvam STT
│   └── requirements.txt              # Python deps (fastapi, websockets, uvicorn)
├── supabase/
│   ├── config.toml                   # Supabase local config
│   └── migrations/                   # 91+ SQL migration files (Jan 2025–Mar 2026)
├── scripts/                          # Utility scripts (includes parse_excel_questions.ts)
├── public/                           # Static assets (6 files)
├── docs/                             # Documentation (2 files)
├── *.sql                             # Ad-hoc SQL scripts (root level, ~40+ files)
├── *.md                              # Feature documentation (root level, ~25+ files)
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vercel.json                       # Vercel deployment config
└── components.json                   # shadcn/ui config
```

### Organization Pattern
**Hybrid layer-based + feature-based**: Top-level folders are organized by layer (`pages/`, `components/`, `services/`, `hooks/`, `utils/`), while components use feature-based subdirectories (`assessments/`, `teacher/`, `chat/`, `ui/`).

---

## 4. Core Features & Modules

### Student Dashboard
- **File**: `src/pages/StudentDashboard.tsx` (93KB — monolithic)
- Shows all 8 assessment modules with completion status
- Progress tracking per assessment (shows completed/pending)
- Language toggle (English/Kannada/Tamil)
- Assessment cards with sequential unlock progression
- Links to Career Explore page, Holland Code test, and AI Chatbot
- Profile management and notification bell

### Assessment Modules

Each assessment follows a similar pattern:
1. Student opens assessment → sees instructions/questions
2. Student answers questions (text, voice, selections)
3. On submit → responses saved to `assessment_responses` table
4. AI summary auto-generated via Gemini API → saved to `assessment_summaries` table
5. Teacher notified → reviews/approves/edits summary
6. Student can view approved summary in their portfolio

| # | Assessment | Type Key | Component | Description |
|---|-----------|----------|-----------|-------------|
| 1 | **My Inspiration** | `inspiration` | `MyInspirationAssessment.tsx` (88KB) | Watch inspirational videos, answer reflection questions about what inspired you |
| 2 | **About Me** | `about_me` | `AboutMeAssessment.tsx` (49KB) | Personal profile questions: family, interests, strengths, dreams, up to 16 questions |
| 3 | **My Dreams** | `dreams` | `MyDreamsAssessment.tsx` (53KB) | Document 3 dream careers with pathways, qualities needed, and prevention strategies |
| 4 | **My School, My Learning and I** | `school_learning` | `MySchoolLearningAssessment.tsx` (83KB) | Reflect on school experience, learning styles, favorite subjects, challenges |
| 5 | **My Talents and Hobbies** | `hobbies` | `MyHobbiesAssessment.tsx` (66KB) | Identify talents, hobbies, and skills; connect them to potential careers |
| 6 | **My Role Models** | `role_models` | `MyRoleModelsAssessment.tsx` (63KB) | Identify role models, analyze their qualities, draw parallels to own life |
| 7 | **Holland Code (RIASEC)** | `personality` | `HollandCodeAssessment.tsx` (29KB) | Psychometric test mapping to RIASEC categories (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) — 42 questions, 7 per category |
| 8 | **Career Guidance Tools** | `career_guidance_tools` | `CareerGuidanceToolsAssessment.tsx` (25KB) | Explore career resources, tools, and guidance materials |

**Assessment Unlock Order**: Each assessment requires completion of all preceding ones. This is defined in `src/utils/assessmentUnlock.ts`. **Note**: The unlock logic is currently **bypassed for testing** — `checkAssessmentUnlock()` returns `{ isUnlocked: true }` unconditionally (original prerequisite-checking logic is commented out).

Each assessment has a companion `*DB.tsx` component (e.g., `MyInspirationAssessmentDB.tsx`) that handles database interactions (saving/loading responses) separately from the UI.

**Response Storage**: All responses are saved as JSON in `assessment_responses.responses` column. Each assessment type has its own JSON structure.

### AI Summary System

**Service**: `src/services/aiSummaryService.ts` (2368 lines)

#### How Summaries Are Triggered
- On assessment submission, the AI summary is generated **automatically** via the `AISummaryService`
- Each assessment type has dedicated methods: `generateInspirationSummary()`, `generateDreamsSummary()`, `generateSchoolLearningSummary()`, `generateHobbiesSummary()`, `generateAboutMeSummary()`, `generateRoleModelsSummary()`

#### LLM Integration
- **API**: Google Gemini (primary: `gemini-2.0-flash-exp`, fallback: `gemini-exp-1206`, backup: `gemini-1.5-flash`)
- **Configuration**: `VITE_GEMINI_API_KEY` environment variable
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/...`

#### Prompt Structure
1. Fetches a **summary template** from the `summary_templates` table (cached in `templateCache`)
2. Templates store per-question prompt instructions in multiple languages (`en`, `kn`, `ta`)
3. If DB template fails, uses hardcoded **fallback prompts**
4. Each assessment type has its own `build*Prompt()` and `build*FallbackPrompt()` methods

#### Language Detection
- `detectLanguage(responses, preferredLanguage?)` → `'en' | 'kn' | 'ta'`
- Recursively scans response values for Kannada/Tamil Unicode characters
- If `preferredLanguage` is provided and supported, it takes precedence
- Summary is generated in the **detected language** of the student's responses

#### Word Limit and Tone
- Prompts instruct: 100–150 words per question summary
- Age-appropriate, encouraging, reflective tone
- Generates structured JSON output (`SummaryQuestions` type with question1, question2, etc.)

#### Storage
- Summaries stored in `assessment_summaries` table (via `summaryDatabaseService.ts`)
- Three versions tracked: `ai_summary`, `teacher_edited_summary`, `student_edited_summary`
- Display priority: student edits > teacher edits > AI original (`getDisplaySummary()`)

### Teacher Dashboard & Approval Workflow

**File**: `src/pages/TeacherDashboard.tsx` (98KB — monolithic)

#### Student Submission Viewing
- Teachers see all students in their state/class
- Can view student assessment responses and AI-generated summaries
- `StudentAssessmentReview.tsx` (80KB) — detailed review view

#### Notification System
- `NotificationService` creates notifications via `create_notification_secure` RPC
- Types: `summary_approved`, `teacher_message`, `assessment_submitted`, `system`
- `NotificationBell.tsx` shows unread count badge and dropdown list

#### Review/Approve Flow
- **`SummaryApprovalCard.tsx`** (75KB) — the main approval UI
- **`AISummaryReview.tsx`** (26KB) — AI summary review component
- Teachers can:
  - ✅ **Approve** a summary (sets `approval_status = 'approved'`)
  - ❌ **Reject** with reason (sets `approval_status = 'rejected'`)
  - ✏️ **Edit** the summary before approving (saves to `teacher_edited_summary`)
  - 🔄 **Request revision** (sets `approval_status = 'revision_requested'`)
- On approval, a notification is sent to the student
- `summaryDatabaseService.ts` handles all DB operations for this workflow

#### Review Status Tracking
- Statuses: `pending_approval` → `approved` | `rejected` | `revision_requested`
- RPC functions: `get_student_assessment_responses`, `get_review_overview`, `get_student_review_progress`, `update_assessment_review`

### Admin Dashboard

**File**: `src/pages/AdminDashboard.tsx` (31KB)
- User management (create/edit students, teachers)
- School/State management
- Assessment template management
- Resource management
- Bulk student import (`ImportStudentsDialog.tsx`)
- System overview and statistics

### Audio / Voice Features

#### Voice Recording
- `audioConfig.ts` defines recording parameters
- Audio captured via browser's `MediaRecorder` API
- Stored in `audio-files` Supabase storage bucket

#### Sarvam API Integration (Streaming STT)
- **`sarvamStreamingService.ts`**: WebSocket client connecting to a Python FastAPI proxy
- **`server/proxy_server.py`**: Backend proxy that relays audio chunks to Sarvam's streaming API
- Flow: Browser → WebSocket → FastAPI Proxy → Sarvam API → transcript response → Browser
- Sends PCM Int16 Base64 audio chunks
- Supports language codes for Indian languages
- Environment variable: `VITE_SARVAM_PROXY_URL` (defaults to `ws://127.0.0.1:8000/ws/stream`)

#### Google/Azure STT (Batch)
- **`speechToTextService.ts`**: Batch transcription with cascading fallback
  1. Google Cloud Speech-to-Text (v1 API, `VITE_GOOGLE_SPEECH_API_KEY`)
  2. Azure Speech Services (`VITE_AZURE_SPEECH_KEY`, `VITE_AZURE_SPEECH_REGION`)
  3. Gemini 1.5 Flash as ultimate fallback
- Supports: `en-IN`, `hi-IN`, `kn-IN`, `ta-IN`, `te-IN`, auto-detect
- `postProcessTranscript()` corrects common Indian-English phonetic spellings
- Long-running transcription support via `transcribeLongRunningByUri()` for audio > 60s

#### Audio Response Manager
- **`audioResponseManager.ts`**: Orchestrates record → transcribe → upload → save
- **Offline support**: Queues audio responses in `localStorage` when offline, syncs when online
- **Resumable uploads**: `supabaseUploadService.ts` supports chunked uploads with retry logic for poor connectivity

### AI Chatbot ("Vidya Saathi")
- **`aiChatService.ts`**: Chat service using Gemini API
- Persona: "Vidya Saathi" — empathetic career guidance counsellor for Indian students
- Keeps answers concise, simple, encouraging
- `ChatbotDialog.tsx` provides the UI
- Cascading model fallback: `gemini-2.0-flash-exp` → `gemini-exp-1206` → `gemini-1.5-flash`

### Chat/Messaging
- **`chat_channels`** and **`chat_messages`** tables for teacher-student communication
- `get_or_create_chat_channel` RPC function
- Components in `src/components/chat/`

### Career Exploration
- `CareersExplore.tsx` — career browsing page
- `CareerSpotlight.tsx` — featured career highlights
- Career card assets in `src/career_cards/`

### Counselling Activities & Resources
- `counselling_activities` table — structured activities with categories, difficulty levels, grade targets
- `student_activity_progress` table — tracks activity completion per student
- `counselling_resources` table — PDFs, videos, worksheets with download tracking
- `ResourceManager.tsx` — admin resource management UI

### Student Notes & Groups
- `student_notes` table — teacher observations, meeting notes, progress notes (typed: observation/meeting/progress/concern/achievement/follow_up)
- `student_groups` table — teacher-created groups within states/classes

### Contact ILP Dialog
- `ContactIlpDialog.tsx` — contact information for India Literacy Project

---

## 5. Data Models / Schema

### Core Tables

#### `users`
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK (matches `auth.users.id`) |
| password_hash | text | (managed by Supabase Auth) |
| role | enum: `admin`, `teacher`, `student` | NOT NULL |
| full_name | text | NOT NULL |
| mobile | text | nullable |
| email | text | NOT NULL |
| state_id | uuid | FK → `states.id`, nullable |
| school | text | nullable |
| preferred_language | enum: `en`, `kn`, `ta` | default `en` |
| bio, interests, career_goals, strengths, areas_for_growth | text | nullable |
| profile_picture_url | text | nullable |
| date_of_birth | date | nullable |
| gender | enum: `male`, `female`, `other`, `prefer_not_to_say` | nullable |
| address, emergency_contact, emergency_contact_relation | text | nullable |
| created_at, updated_at | timestamptz | auto-managed |

#### `students`
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → `users.id`, NOT NULL |
| class_id | uuid | FK → `classes.id`, NOT NULL |
| teacher_id | uuid | NOT NULL |
| enrollment_date | date | |
| enrollment_status | enum: `active`, `inactive`, `pending`, `graduated`, `transferred` | |
| previous_school, special_needs | text | nullable |
| parent_guardian_name/phone/email/occupation | text | nullable |
| family_income_range | enum: `below_50000`, `50000_100000`, `100000_200000`, `200000_500000`, `above_500000` | nullable |
| academic_performance | enum: `excellent`, `good`, `average`, `below_average`, `needs_improvement` | nullable |
| attendance_percentage | real | nullable |
| notes | text | nullable |
| created_at, updated_at | timestamptz | |

#### `teachers`
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → `users.id`, NOT NULL |
| state_id | uuid | FK → `states.id`, NOT NULL |
| specialization, qualification, bio | text | nullable |
| experience_years | integer | default 0 |
| contact_phone, contact_email | text | nullable |
| is_active | boolean | default true |
| joining_date | date | |
| created_at, updated_at | timestamptz | |

#### `orgs`
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK |
| name | text | NOT NULL |
| created_at | timestamptz | |

#### `states`
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK |
| state_name | text | NOT NULL |
| org_id | uuid | FK → `orgs.id`, NOT NULL |
| state_code | text | NOT NULL |
| created_at | timestamptz | |

#### `classes`
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK |
| name | text | NOT NULL |
| state_id | uuid | FK → `states.id`, NOT NULL |
| created_at | timestamptz | |

#### `assessment_responses`
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK |
| student_id | uuid | FK → `students.user_id` |
| assessment_type | enum: `inspiration`, `dreams`, `school_learning`, `role_models`, `hobbies`, `personality`, `career_aptitude` | NOT NULL |
| assessment_title | text | NOT NULL |
| responses | jsonb | NOT NULL — holds all answers |
| completed_at | timestamptz | nullable (null = in progress) |
| review_status | enum: `unreviewed`, `in_review`, `reviewed`, `needs_revision`, `flagged` | default `unreviewed` |
| reviewed_by | uuid | FK, nullable |
| reviewed_at | timestamptz | nullable |
| review_notes | text | nullable |
| review_rating | integer | nullable |
| needs_follow_up | bool | |
| follow_up_due_at | timestamptz | nullable |
| follow_up_status | enum: `pending`, `contacted`, `resolved` | nullable |
| created_at, updated_at | timestamptz | |

#### `inspiration_sources`
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK |
| title | text | NOT NULL |
| url | text | NOT NULL (video URL) |
| description | text | nullable |
| sequence_number | integer | |
| is_active | boolean | default true |
| created_at | timestamptz | |

### Activity & Resource Tables

#### `counselling_activities`
- Categories: `self_discovery`, `career_exploration`, `skill_assessment`, `goal_setting`, `action_planning`
- Difficulty: `beginner`, `intermediate`, `advanced`
- Target grade: `8`–`12` or `all`
- Includes `learning_objectives[]`, `prerequisites[]`, `resource_links`, `worksheet_url`

#### `student_activity_progress`
- Links students to activities with status: `not_started`, `assigned`, `in_progress`, `completed`, `on_hold`
- Tracks `completion_percentage`, `time_spent_minutes`, `difficulty_rating`, `enjoyment_rating`

#### `counselling_resources`
- Types: `pdf`, `video`, `chart`, `slides`, `worksheet`, `template`, `guide`
- Target audience: `students`, `teachers`, `parents`, `all`
- Tracks `download_count`

### Notes & Groups

#### `student_notes`
- Types: `observation`, `meeting`, `progress`, `concern`, `achievement`, `follow_up`
- Has `is_private` boolean and `tags[]`

#### `student_groups`
- Teacher-created student groups within a state/class
- Has `max_students` and `is_active` fields

### Compass Tables

#### `profile_card_cache`
- Caches AI-generated keyword summaries per assessment module per student
- `student_id` (FK → `users.id`), `assessment_type` (text), `keywords` (jsonb), `generated_at` (timestamptz)
- Unique constraint on `(student_id, assessment_type)`
- Special `assessment_type = 'career_direction'` stores a career direction paragraph in `keywords.direction`
- RLS: students own rows, teachers read via state join

#### `career_roadmap`
- Stores student career choices at 7 milestone points from 9th to final decision
- `student_id` (FK → `users.id`), `milestone` (text, CHECK constrained), `plan_a/b/c` (text), `updated_at`
- Unique constraint on `(student_id, milestone)`
- Milestones: `beginning_9th`, `end_9th`, `beginning_10th`, `midterm_10th`, `post_exam_10th`, `before_results_10th`, `final_decision`
- RLS: students own rows, teachers read via state join

### Chat Tables

#### `chat_channels`
- Links a `student_id` and `teacher_id`
- Tracks last-read timestamps for both parties

#### `chat_messages`
- Belongs to a `channel_id`
- Has `sender_user_id` and `content`

### Summary-Related Tables (from migrations/RPCs)

#### `assessment_summaries` (defined via migrations, used by `summaryDatabaseService`)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| assessment_response_id | uuid | FK → `assessment_responses.id` |
| ai_summary | jsonb | AI-generated summary |
| teacher_edited_summary | jsonb | nullable |
| student_edited_summary | jsonb | nullable |
| summary_type | text | `ai_generated`, `teacher_edited`, `student_edited` |
| approval_status | text | `pending_approval`, `approved`, `rejected`, `revision_requested` |
| version | integer | |
| approved_by, rejected_by | uuid | nullable |
| approved_at, rejected_at | timestamptz | nullable |
| rejection_reason | text | nullable |
| student_user_id | uuid | nullable |
| generated_at, created_at, updated_at | timestamptz | |

#### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → `users.id` |
| type | text | `summary_approved`, `teacher_message`, `assessment_submitted`, `system` |
| title, message | text | |
| link | text | nullable |
| created_at | timestamptz | |
| read_at | timestamptz | nullable (null = unread) |

#### `summary_templates` (used by `aiSummaryService`)
- Stores per-assessment-type prompt templates
- Multi-language blocks (`en`, `kn`, `ta`) with per-question instructions

#### `content_translations` (used by `translationService`)
- Stores UI text translations by `resource_type`, `resource_key`, and `lang`

### Relationships
```
orgs ──1:N──→ states ──1:N──→ classes
                     ──1:N──→ teachers (via state_id)
users ──1:1──→ students (via user_id)
      ──1:1──→ teachers (via user_id)
students ──N:1──→ classes (via class_id)
         ──N:1──→ teachers (via teacher_id)
         ──1:N──→ assessment_responses (via student_id)
assessment_responses ──1:1──→ assessment_summaries (via assessment_response_id)
users ──1:N──→ notifications (via user_id)
students ←──N:1──→ chat_channels ──1:N──→ chat_messages
teachers  ←──N:1──→ chat_channels
```

### Enums (from `types.ts`)
- `app_role`: `admin`, `teacher`, `student`
- `assessment_type`: `inspiration`, `dreams`, `school_learning`, `role_models`, `hobbies`, `personality`, `career_aptitude`
- `review_status`: `unreviewed`, `in_review`, `reviewed`, `needs_revision`, `flagged`
- `follow_up_status`: `pending`, `contacted`, `resolved`

---

## 6. Database Migrations

### Overview
- **Location**: `supabase/migrations/`
- **Count**: 90+ migration files
- **Timeline**: January 2025 – March 2026

### Migration History (Key Milestones)

| Date | Migration | What It Does |
|------|-----------|--------------|
| 2025-01-16 | `add_audio_responses` | Adds audio recording support |
| 2025-01-20 | `update_inspiration_videos_urls` | Updates video URLs, inspiration sources |
| 2025-01-21 | `rename_school_to_state` | Renames "schools" concept to "states" |
| 2025-01-21 | `create_storage_buckets` | Creates Supabase storage buckets |
| 2025-01-21 | `add_missing_user_columns` | Adds profile columns to users table |
| 2025-01-25 | `assessment_data_migration` | Major assessment structure migration |
| 2025-01-25 | `assessment_api_functions` | Creates assessment-related RPC functions |
| 2025-01-25 | `improved_assessment_structure` | Refines assessment schema |
| 2025-01-25 | `about_me_complete_structure` | About Me assessment schema |
| 2025-02-01 | `update_inspiration_questions` | Updates inspiration question content |
| 2025-02-01 | `add_*_summary_template` | Adds summary templates for all assessment types |
| 2025-02-01 | `update_holland_code_questions` | Holland Code psychometric test data |
| 2025-02-01 | `create_career_guidance_tools` | Career guidance tools assessment |
| 2025-02-01 | `get_approved_summary` | Function for fetching approved summaries |
| 2025-08-15 | `add_email_support` | Adds email-based auth support |
| 2025-08-15 | `add_inspiration_assessment` | Additional inspiration data |
| 2025-08-20 | `add_student_search_enroll` | Student search & enrollment functions |
| 2025-08-21 | `add_ilp_queries` | ILP-specific query functions |
| 2025-08-21 | `phase1_student_insert_policy` | Student RLS insert policies |
| 2025-08-21 | `fix_authentication_issues` | Authentication bug fixes |
| 2025-08-22 | `fix_infinite_recursion` | Fixes RLS policy infinite recursion |
| 2025-10-11 | `ilp_mentor_defaults` | ILP mentor configuration |
| 2025-10-11 | `ilp_mentor_rls` | RLS policies for mentors |
| 2025-10-11 | `users_teachers_rls` | Users and teachers RLS policies |
| 2025-10-17 | `fix_audio_files_rls` | Audio storage RLS policies |
| 2025-10-17 | `fix_audio_storage_rls` | Additional audio storage policy fixes |
| 2025-11-11 | `fix_avatars_storage_rls` | Avatar storage RLS policies |
| 2026-03-01 | `role_models_summary` | Role models summary template |
| 2026-03-08 | `update_assessment_questions_from_excel` | Bulk update of all assessment questions (main + summary) from `Updated_Qns.xlsx` across 6 assessments, 3 languages (en/kn/ta). Updates base question tables, `content_translations`, `assessment_summary_templates` JSONB, and `role_models_module` intro text. |
| 2026-03-08 | `add_compass_tables` | Creates `profile_card_cache` and `career_roadmap` tables for the "My Compass" feature. Both have RLS: students read/write own rows, teachers read students in their state. |

### Notable Schema Evolution
- **Schools → States**: Renamed the "school" organizational unit to "state" to better represent the ILP's state-based operational model
- **Email support**: Originally mobile-only auth, later added email-based authentication
- **Summary templates**: Added per-assessment-type prompt templates with multi-language support
- **Multiple RLS policy fixes**: Several migrations address infinite recursion issues and access control refinements
- **Bulk question update (March 2026)**: All 6 assessment modules' questions updated from `Updated_Qns.xlsx`. Covers base question tables (`inspiration_questions`, `about_me_fields`, `dreams_questions`, `school_learning_questions`, `hobbies_questions`, `role_models_questions`), `content_translations` (kn/ta), `assessment_summary_templates` (JSONB), and `role_models_module` intro. Notable fixes applied: `about_me_fields.question11` removed (row deleted in prior migration), `role_models_questions` shifted by 1 (Excel SNo 1 was an intro instruction, not a question), `question19` removed (only 18 rows exist in DB), intro text stored in `content_translations` as `role_models_module`/`intro`.

---

## 7. Supabase Configuration

### Auth Setup
- **Method**: Email + password (originally mobile-based, now supports email)
- **Session**: `localStorage`-based with `persistSession: true`, `autoRefreshToken: true`
- **Sign-up flow**: Creates `auth.users` record → triggers profile creation in `public.users` table with role, state, language preference
- **Role storage**: In `users.role` column and `auth.users.user_metadata.role`

### Storage Buckets
| Bucket | Purpose | Access |
|--------|---------|--------|
| `audio-files` | Student voice recordings | Private (RLS-protected) |
| `avatars` | Profile pictures | Private (RLS-protected) |

### RPC Functions (Key ones)
- `get_assessment_template(p_assessment_type)` — Get assessment template with questions
- `get_assessment_media_sources(p_assessment_type)` — Get media for assessments
- `get_student_assessment_responses(teacher_user_id, assessment_type_filter?)` — Teacher access to student responses
- `get_review_overview(teacher_user_id)` — Summary counts for teacher dashboard
- `get_student_review_progress(teacher_user_id)` — Per-student review progress
- `update_assessment_review(teacher_user_id, assessment_response_id, review)` — Update review
- `get_or_create_chat_channel(p_student_id, p_teacher_id)` — Chat channel upsert
- `create_notification_secure(p_user_id, p_type, p_title, p_message, p_link)` — Create notification
- `get_all_assessment_templates()` — Admin: all templates
- `update_assessment_template(...)` — Admin: update template
- `upsert_media_source(...)` — Admin: manage media

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_GEMINI_API_KEY` | Google Gemini API key (AI summaries + chatbot) |
| `VITE_GOOGLE_SPEECH_API_KEY` | Google Cloud Speech-to-Text API key |
| `VITE_AZURE_SPEECH_KEY` | Azure Speech Services key (optional fallback) |
| `VITE_AZURE_SPEECH_REGION` | Azure Speech region (optional) |
| `VITE_SARVAM_PROXY_URL` | Sarvam WebSocket proxy URL (optional, defaults to localhost) |

---

## 8. API & Service Layer

### Communication Pattern
The frontend talks to Supabase **directly** via the `@supabase/supabase-js` client. There is no separate REST API layer — all data access goes through:
1. **Direct table queries** (`supabase.from('table').select()/insert()/update()`)
2. **RPC functions** (`supabase.rpc('function_name', { params })`) for complex operations
3. **Storage API** (`supabase.storage.from('bucket').upload()`) for files

### AI/ML Services (External API Calls)
These are **direct client-side API calls** from the browser (API keys stored in `VITE_*` env vars):

| Service | File | External API |
|---------|------|-------------|
| AI Summaries | `aiSummaryService.ts` | Google Gemini REST API |
| AI Chatbot | `aiChatService.ts` | Google Gemini REST API |
| Speech-to-Text | `speechToTextService.ts` | Google Cloud Speech / Azure Speech REST APIs |

### Sarvam Streaming STT (Server-Mediated)
- `sarvamStreamingService.ts` → WebSocket → `server/proxy_server.py` (FastAPI) → Sarvam API
- This is the **only server-mediated service** — a Python proxy needed because Sarvam requires server-side credentials

### Service Summary

| Service File | Singleton | Key Methods |
|-------------|-----------|-------------|
| `aiSummaryService.ts` | `aiSummaryService` | `generate*Summary()`, `detectLanguage()`, `build*Prompt()` |
| `aiChatService.ts` | `aiChatService` | `sendMessage()`, `isConfigured()` |
| `speechToTextService.ts` | `speechToTextService` | `transcribe()`, `transcribeAutoDetect()`, `transcribeLongRunningByUri()` |
| `sarvamStreamingService.ts` | `sarvamStreamingService` | `connect()`, `sendAudioChunk()`, `disconnect()` |
| `assessmentService.ts` | (static class) | `getAssessmentTemplate()`, `getMediaSources()`, `getHollandCodeData()` |
| `summaryDatabaseService.ts` | `summaryDatabaseService` | `createAISummary()`, `approveSummary()`, `rejectSummary()`, `updateTeacherSummary()` |
| `notificationService.ts` | `notificationService` | `getUnreadCount()`, `list()`, `markRead()`, `create()` |
| `audioResponseManager.ts` | `audioResponseManager` | `processAudioResponse()`, `syncOfflineQueue()` |
| `supabaseUploadService.ts` | `supabaseUploadService` | `uploadFile()`, `queueUpload()`, `processQueue()` |
| `transcriptCleanupService.ts` | `transcriptCleanupService` | Post-processing for transcriptions |
| `translationService.ts` | (function export) | `fetchTranslations()` |

---

## 9. Auth & Role-Based Access

### Authentication Flow
1. User enters email + password on `AuthPage.tsx`
2. `useAuth.signIn()` calls `supabase.auth.signInWithPassword()`
3. On success, `fetchUserProfile()` loads the user's profile from `public.users`
4. On sign-up, `useAuth.signUp()`:
   - Creates `auth.users` record with metadata (`role`, `full_name`, `mobile`)
   - Creates `public.users` record with full profile
   - For students: creates `students` record linked to class/teacher
   - For teachers: creates `teachers` record linked to state

### Role Assignment
- Role is set at **sign-up time** and stored in:
  - `auth.users.user_metadata.role`
  - `public.users.role`
- Three roles: `admin`, `teacher`, `student`

### Frontend Access Control
- **`ProtectedRoute.tsx`**: Wrapper component that checks:
  1. Is user authenticated? If not → redirect to `/auth`
  2. Does user's role match `allowedRoles` prop? If not → redirect to their dashboard
- Routes are protected with `<ProtectedRoute allowedRoles={['student']}>`
- Role-based redirect: admin → `/admin`, teacher → `/teacher`, student → `/student`
- **My Compass routes**: `/student/profile-card` (student), `/student/career-roadmap` (student), `/teacher/student-profile-card/:studentId` (teacher, read-only)

### Backend Access Control (RLS)
- Row Level Security enforced on all tables
- Multiple migration files address RLS policies and fix recursion issues
- Key RLS patterns:
  - Students can only read/write their own data
  - Teachers access students in their state
  - Admins have broader access
  - RPC functions bypass RLS with `SECURITY DEFINER` where needed

---

## 10. State Management & Data Fetching

### Global Providers (in `App.tsx`)
```
ErrorBoundary
  └── Router (BrowserRouter)
        └── AuthProvider (useAuth context)
              └── LangProvider (useLang context)
                    └── Routes + Toaster
```

### Context Providers
| Provider | File | Provides |
|----------|------|----------|
| `AuthProvider` | `useAuth.tsx` | `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`, `userProfile`, `refreshUserProfile` |
| `LangProvider` | `useLang.tsx` | Language state, translation functions, language switching |

### Data Fetching Patterns
- **TanStack React Query** is in `package.json` but the large dashboard components appear to use **direct `useEffect` + Supabase calls** with local `useState` for most data fetching
- Services are **singleton instances** that encapsulate Supabase/API interactions
- No centralized state store (no Redux, Zustand, or Recoil)

---

## 11. Key Conventions & Patterns

### Naming Conventions
| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `MyInspirationAssessment.tsx` |
| Services | camelCase singleton | `aiSummaryService` |
| Hooks | `use` prefix | `useAuth`, `useLang` |
| DB tables | snake_case | `assessment_responses` |
| DB enums | snake_case | `school_learning` |
| CSS | Tailwind utility classes | |
| Types/Interfaces | PascalCase | `AssessmentSummary` |
| Environment vars | `VITE_` prefix, SCREAMING_SNAKE | `VITE_GEMINI_API_KEY` |

### Form Handling
- **React Hook Form** with **Zod** validation schemas
- `@hookform/resolvers` for Zod integration

### Logging
- **`lib/logger.ts`** — centralized logger utility; all `console.log/error/warn` calls routed through `logger.*`
- Logger output is **silenced in production** — only outputs when `import.meta.env.DEV` is true
- Usage: `import { logger } from '@/lib/logger'` → `logger.log(...)`, `logger.error(...)`, etc.

### Error Handling
- `utils/errorHandler.ts` — safe-access utilities + `handleDatabaseError` / `validateApiResponse`
- `ErrorBoundary` class component wrapping the entire app
- Toast notifications via `sonner` and `use-toast.tsx`

### Component Patterns
- **Page components** are very large monoliths (StudentDashboard 93KB, TeacherDashboard 98KB)
- **Assessment components** come in pairs: `*Assessment.tsx` (UI+logic) + `*AssessmentDB.tsx` (DB operations)
- **UI components** follow shadcn/ui patterns (in `components/ui/`)
- **Services** are singleton classes exported as instances
- **Hooks** serve as context providers or utility wrappers

### TypeScript
- Generated Supabase types in `integrations/supabase/types.ts`
- Custom types in `types/assessmentSummary.ts`
- Strict TypeScript mode enabled (`tsconfig.app.json`: `strict: true`)

---

## 12. Current Implementation Status

### Assessment Module Status

| Assessment | UI | DB Save | AI Summary | Teacher Approval | Fully Wired |
|------------|:--:|:-------:|:----------:|:----------------:|:-----------:|
| My Inspiration | ✅ | ✅ | ✅ | ✅ | ✅ |
| About Me | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Dreams | ✅ | ✅ | ✅ | ✅ | ✅ |
| My School, My Learning and I | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Talents and Hobbies | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Role Models | ✅ | ✅ | ✅ | ✅ | ✅ |
| Holland Code (RIASEC) | ✅ | ✅ | ❓ | ❓ | ⚠️ |
| Career Guidance Tools | ✅ | ✅ | ❓ | ❓ | ⚠️ |

### Known Issues & Flags

> [!WARNING]
> **Assessment unlock bypassed**: `checkAssessmentUnlock()` in `utils/assessmentUnlock.ts` is **hardcoded to return `true`** for testing. The original prerequisite-checking logic is commented out. This means all assessments are currently accessible regardless of completion order.

> [!TIP]
> **Logging gated behind dev flag**: All `console.*` calls are routed through `src/lib/logger.ts`, which only outputs when `import.meta.env.DEV` is true. Production builds produce zero console output.

> [!CAUTION]
> **API keys in client-side code**: `VITE_GEMINI_API_KEY`, `VITE_GOOGLE_SPEECH_API_KEY`, and other API keys are exposed in the browser bundle via `import.meta.env.VITE_*`. This is a security concern for production — these should ideally be proxied through a backend.

> [!IMPORTANT]
> **Monolithic page components**: `StudentDashboard.tsx` (93KB) and `TeacherDashboard.tsx` (98KB) are extremely large single-file components. These should be refactored into smaller modules for maintainability.

> [!NOTE]
> **Holland Code & Career Guidance Tools**: These assessments have UI and DB save, but it's unclear if they have AI summary generation and teacher approval fully wired up — there are no corresponding `generate*Summary()` methods in `aiSummaryService.ts` for these two.

### Other Observations
- Multiple SQL scripts at the project root (40+ files) appear to be ad-hoc queries and one-off fixes, not part of the formal migration system
- Several documentation `.md` files at root level document past debug/fix sessions
- `scripts/parse_excel_questions.ts` — Excel-to-SQL migration generator. Parses `Updated_Qns.xlsx` and outputs a Supabase migration file with UPSERTs for `content_translations` and UPDATEs for per-assessment base question tables + `assessment_summary_templates` JSONB. Uses the `xlsx` npm library.
- `Updated_Qns.xlsx` — Source Excel with assessment questions in 6 sheets (one per assessment), each containing main questions and summary questions in Kannada, Tamil, and English columns


---

## 13. How to Run the Project

### Prerequisites
- **Node.js** (v18+)
- **npm** (bundled with Node.js)
- **Python 3.x** (only needed for Sarvam proxy server)

### Install Dependencies
```bash
npm install
```

### Environment Variables
Create a `.env.local` file in the project root:
```env
# Required
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Features
VITE_GEMINI_API_KEY=your-gemini-api-key

# Speech-to-Text (optional)
VITE_GOOGLE_SPEECH_API_KEY=your-google-speech-key
VITE_AZURE_SPEECH_KEY=your-azure-key
VITE_AZURE_SPEECH_REGION=your-azure-region

# Sarvam Streaming STT (optional)
VITE_SARVAM_PROXY_URL=ws://127.0.0.1:8000/ws/stream
```

### Dev Server
```bash
npm run dev
```
This starts Vite dev server (default: `http://localhost:5173`)

### Sarvam Proxy (Optional)
```bash
pip install -r server/requirements.txt
npm run server
# or: uvicorn server.proxy_server:app --reload --port 8000
```

### Build for Production
```bash
npm run build
```

### Deployment
- Configured for **Vercel** (`vercel.json` present)
- Static SPA deployment with client-side routing

## Recent Bug Fixes

### AboutMeAssessment — Landing on Summary tab instead of first section
- **File**: `src/components/assessments/AboutMeAssessment.tsx`
- **Root cause**: The `sections` memo unconditionally appended `'Summary'` even when `aboutMeFields` was empty (initial load). This made `sections = ['Summary']`, and the useEffect set `currentSection = 'Summary'` before real sections loaded. Once fields loaded, `currentSection` was already truthy so the useEffect guard didn't reset it.
- **Fix**: Only append `'Summary'` when `sectionsList.length > 0` (i.e., real field sections exist). Now `sections` stays empty until fields load from DB, then initializes correctly to the first real section.

### MyInspirationAssessment — nextVideo() bypasses Summary lock
- **File**: `src/components/assessments/MyInspirationAssessment.tsx`
- **Root cause**: `nextVideo()` allowed navigating from the last video directly to the Summary tab without checking `areAllVideosComplete()`. The Summary tab button was correctly gated with `disabled={!areAllVideosComplete()}`, but the "Next Video" button provided a complete bypass.
- **Fix**: Added a guard in `nextVideo()` — when on the last video (`currentVideoIndex === inspirationVideos.length - 1`) and `areAllVideosComplete()` returns false, show a localized (en/kn/ta) destructive toast and return early instead of navigating.

### MyDreamsAssessment — Summary tab inaccessible in read-only mode
- **File**: `src/components/assessments/MyDreamsAssessment.tsx`
- **Root cause**: The Summary tab lock logic used `canSubmit()`, which returns `false` when `isReadOnly` is true. This meant students viewing completed assessments or teachers reviewing them could not access the Summary tab.
- **Fix**: Extracted a pure `areCoreSectionsComplete()` function that only checks whether all required fields are answered (no `isReadOnly` check). The Summary tab lock and "Next Section" navigation guard now use `areCoreSectionsComplete()`. `canSubmit()` is kept for the submit button only, delegating to `areCoreSectionsComplete()` after its own `isReadOnly` check. Also removed a dead `q.section === 'Summary'` guard that never triggered (summary questions are stored in a separate array).

### Student Dashboard — View Summary button moved from progress list to assessment grid cards
- **Files**: `src/components/student/AssessmentGrid.tsx`, `src/components/student/ProgressSection.tsx`, `src/pages/StudentDashboard.tsx`, `src/components/student/studentStrings.ts`
- **Change**: The "View Summary" button and ⟳ refresh button were removed from the Assessment Progress Summary list (`ProgressSection`). The progress list now shows only assessment name + status badge (clean rows, no extra buttons). The "View Summary ✨" button was added to the assessment grid cards (`AssessmentGrid`) — it appears in the card footer only for completed assessments with an approved summary. Completed assessments without an approved summary show a muted "Summary Pending..." text. The `AssessmentCardData` interface gained a `summaryState: SummaryState` field (`'approved' | 'pending' | 'none'`). The `ProgressRowData` interface was simplified to remove `summary`, `fetchSummary`, `setSummaryNull`, and `assessmentResponseId` fields. New localized string key `summary_pending_short` added for en/kn/ta. Tamil `view_summary` text updated to match spec.

### My Compass — Profile Card + Career Roadmap
- **New files**: `src/pages/ProfileCardPage.tsx`, `src/pages/CareerRoadmapPage.tsx`
- **Modified files**: `src/App.tsx` (new routes), `src/components/student/StudentDashboardHeader.tsx` (compass dropdown), `src/components/student/studentStrings.ts` (new localized keys), `src/services/aiSummaryService.ts` (new methods: `generateProfileCardKeywords`, `generateCareerDirection`), `src/components/teacher/StudentModals.tsx` (View Profile Card button)
- **Migration**: `supabase/migrations/20260308000002_add_compass_tables.sql` — creates `profile_card_cache` and `career_roadmap` tables with RLS
- **Profile Card Page** (`/student/profile-card`): Shows 6 module cards in a responsive grid. Completed modules display 3-5 AI-generated keyword phrases (cached in `profile_card_cache`). Incomplete modules show a grey locked state. A 7th "My Career Direction" card appears when all 6 modules are complete, containing an AI-generated career direction paragraph. Teachers can view a student's profile card at `/teacher/student-profile-card/:studentId` in read-only mode.
- **Career Roadmap Page** (`/student/career-roadmap`): Table with 7 milestone rows × 3 plan columns (A, B, C). Top 3 rows (9th–beginning 10th) are editable with 1-second debounced autosave. Bottom 4 rows are locked/greyed out. Data stored in `career_roadmap` table via UPSERT. Shows "Saved ✓" / "Save failed" status indicator.
- **Navigation**: Compass icon (🧭) dropdown added to student header between notification bell and profile dropdown, with links to both pages. Labels localized in en/kn/ta.
- **Teacher access**: "View Profile Card" button added to `StudentDetailsModal` in teacher dashboard, navigating to the read-only profile card view.

## Self-Update Rule
At the end of any session where files were added/removed or dependencies changed,
update the relevant sections of this file before finishing.