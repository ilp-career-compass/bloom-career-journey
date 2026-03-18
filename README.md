# Bloom Career Journey

A career guidance and self-assessment platform for rural students in India (grades 8-12), built for the **India Literacy Project (ILP)**.

Bloom bridges the career-guidance gap by combining structured self-reflection exercises with AI-powered summarization and teacher-guided mentoring — in English, Kannada, Tamil, and Hindi.

## Features

- **8 Assessment Modules** — Inspiration, About Me, Dreams, School Learning, Talents & Hobbies, Role Models, Holland Code (RIASEC), Career Guidance Tools
- **AI-Generated Summaries** — Google Gemini synthesizes student responses into concise, encouraging summaries
- **Teacher Approval Workflow** — teachers review, edit, approve, or request revisions on AI summaries
- **Multilingual Support** — English, Kannada, Tamil, Hindi with virtual keyboards (IndicKeyboard)
- **Voice Input** — Speech-to-Text via Google Cloud, Azure Speech, and Sarvam API (streaming)
- **Profile Card** — AI keyword summaries across all modules ("My Career Compass")
- **Career Roadmap** — milestone-based career planning tracker (grades 9-10)
- **AI Chatbot** — "Vidya Saathi" career guidance persona powered by Gemini

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend & DB | Supabase (Auth, PostgreSQL, Storage, RPC, RLS) |
| AI | Google Gemini API (2.0 Flash) |
| Speech-to-Text | Google Cloud STT, Azure Speech, Sarvam API |
| Routing | React Router 6 |
| State | TanStack React Query 5 |

## Getting Started

```sh
# Clone and install
git clone <repo-url>
cd bloom-career-journey
npm install

# Configure environment
cp .env.example .env.local
# Fill in:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY
#   VITE_GEMINI_API_KEY
#   VITE_GOOGLE_SPEECH_API_KEY (optional)
#   VITE_AZURE_SPEECH_KEY (optional)

# Start dev server
npm run dev
```

## Project Structure

```
src/
  pages/          — Route-level components (Student, Teacher, Admin dashboards)
  components/     — UI components organized by feature (assessments/, teacher/, student/, chat/, ui/)
  services/       — API & business logic (AI summaries, STT, assessments, notifications)
  hooks/          — React hooks (auth, i18n, keyboard)
  utils/          — Helpers (unlock logic, parsers, error handling)
server/           — FastAPI WebSocket proxy for Sarvam streaming STT
supabase/         — Migrations and config
scripts/          — Data seeding and migration generation tools
```

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## Deployment

- **Hosting**: Vercel (`vercel.json` configured for SPA routing)
- **Database**: Supabase (managed PostgreSQL with RLS)
- **AI Services**: Google Gemini API (client-side, to be proxied before production)

## License

Built by **Harshini Murugadoss** for **India Literacy Project (ILP)**.
