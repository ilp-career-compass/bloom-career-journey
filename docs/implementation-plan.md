## Complete Final Implementation Plan — Bloom Career Journey Content Migration

---

## WHAT NOT TO DO (read before starting every session)
- Never run multiple migrations without verifying each one first
- Never use `git add .` — always stage specific files explicitly
- Never fix bugs discovered during testing — log them and continue
- Never apply a sync migration without reading the full diff report first
- Never run Phase 2 before Phase 1 is fully verified and vite build passes
- Never wrap `ALTER TYPE ... ADD VALUE` inside a BEGIN/COMMIT block
- Never insert English rows into `content_translations` — English comes from RPC/fallback only
- Never apply a diff you have not fully read and approved
- Never overwrite JSONB columns without preserving existing English values
- Never delete keys from `content_translations` before confirming component renders only DB-returned keys

---

## Architectural Decisions (locked — do not change during implementation)

| Decision | Choice | Reason |
|----------|--------|--------|
| summary_title/subtitle storage | `content_translations` | Consistent with all other display labels |
| Fetch pattern for new keys | `fetchTranslations()` from `translationService.ts` | Standardize across all 6 components |
| About Me section keys | Generic `section_a_title` through `section_d_title` | Matches A./B./C./D. prefix matching in component |
| English rows in DB | Never insert | English comes from RPC/fallback only |
| Missing Hindi content | No row = natural fallback | Never insert placeholder rows |
| Keyboard architecture | Single `IndicKeyboard` component | Supports kn/ta/hi — no separate components per language |
| Keyboard layouts | Fully custom — no simple-keyboard dependency | Existing Kannada layout is already custom |
| Tamil virtual keyboard | Build alongside Hindi | Consistent with Kannada and Hindi keyboards |
| State initialization for DB-fetched strings | Always `null` not `''` | Ensures `\|\|` fallback triggers correctly on missing translations |
| sync-report-latest.md | `.gitignore` it — only commit dated reports | Prevents constant unstaged change noise |
| Sync script tab handling | Fewer than 6 tabs = error not warning | Prevents silent assessment skips |
| Sync script mapping | Explicit DB keys not row position | Safe against question deletions and sheet reordering |

---

## Pre-Phase 0 — Database Backup

**Before running any migration:**

```bash
# Export current state of affected tables
npx tsx scripts/export_db_snapshot.ts
```

Create `scripts/export_db_snapshot.ts` that exports:
- All rows from `assessment_summary_templates`
- All rows from `content_translations`
- All rows from `school_learning_option`

Save to `scripts/db_backup_[YYYY-MM-DD].json`

This file is the source of truth for rollbacks. Keep it. Never delete it.

**Rollback template (use this if any migration needs reverting):**

For `content_translations` upserts:
```sql
-- Compensating rollback
DELETE FROM content_translations
WHERE resource_type = '[type]'
AND resource_key = '[key]'
AND lang IN ('kn', 'ta');
```

For `assessment_summary_templates` updates:
```sql
-- Restore from backup JSON values
UPDATE assessment_summary_templates
SET summary_questions = '[original_jsonb_value_from_backup]'::jsonb
WHERE assessment_type = '[type]';
```

---

## Phase 0 — Fix Critical Bugs (sequential — 0A must complete before 0B)

### Step 0A — School Learning Summary Questions

**Pre-flight:**
- Confirm `assessment_summary_templates` row exists for `school_learning`:
  ```sql
  SELECT assessment_type, summary_questions
  FROM assessment_summary_templates
  WHERE assessment_type = 'school_learning';
  ```
- If row does not exist → use UPSERT not UPDATE
- Read current English questions from this row — save them
- These English values must be included unchanged in the migration

**Source:** Sheet tab `9.4_My School, Learnings and I` → first summary block only → 6 questions

**Migration instructions:**
- Table: `assessment_summary_templates`
- Use `jsonb_build_object()` full replacement — not JSONB merge (`||`)
- Include current English values unchanged in `en` key
- Only update `kn` and `ta` values
- Hindi: comment out as `-- TODO: Hindi pending from ILP`
- Dollar-quoting for all kn/ta strings
- BEGIN/COMMIT wrapper

**You review migration file carefully before applying**

**Apply:** `supabase db push`

**If migration fails:** check Supabase dashboard → restore from `scripts/db_backup_[date].json` → fix SQL → retry

**Post-migration verification:**
```sql
-- Confirm English values unchanged
SELECT
  summary_questions->'en' AS english_after
FROM assessment_summary_templates
WHERE assessment_type = 'school_learning';
```
Compare against backup. If English values changed → rollback immediately using rollback template above.

**Browser verification:**
- Open School Learning assessment as student
- Navigate to Summary tab
- Confirm all 6 questions appear correctly in kn and ta
- Only proceed to 0B after fully verified

**Git checkpoint:**
```
git add supabase/migrations/[timestamp]_seed_school_learning_summary_questions.sql
git commit -m "fix: seed School Learning summary questions (kn/ta)"
```

---

### Step 0B — Role Models Summary RPC + Questions + Component Wire

**Pre-flight:**
- Confirm `assessment_summary_templates` row exists for `role_models`:
  ```sql
  SELECT assessment_type, summary_questions
  FROM assessment_summary_templates
  WHERE assessment_type = 'role_models';
  ```
- If row does not exist → use UPSERT not UPDATE
- Read current English questions — save them
- Identify which component file currently attempts to call the missing RPC and causes the 404
  - Run: `grep -r 'role_models_summary\|get_role_models_summary' src/`
  - This will show the exact file and line causing the 404

**Source:** Sheet tab `9.6_My Role Models` → summary section only

**Migration instructions:**
- Create `get_role_models_summary_questions_i18n(p_lang text)` RPC
- RPC must use `SECURITY DEFINER`
- Table: `assessment_summary_templates`
- Use `jsonb_build_object()` full replacement
- Include English values unchanged
- Only insert/update `kn` and `ta` rows
- Hindi: comment out as `-- TODO: Hindi pending from ILP`
- Dollar-quoting for all kn/ta strings
- BEGIN/COMMIT wrapper

**You review migration file carefully before applying**

**Apply:** `supabase db push`

**If migration fails:** check Supabase dashboard → restore from backup → fix SQL → retry

**Post-migration verification:**
```sql
SELECT summary_questions->'en' AS english_after
FROM assessment_summary_templates
WHERE assessment_type = 'role_models';
```
Compare against backup. If English values changed → rollback immediately.

**Component wire (this step is required — migration alone does not fix the 404):**
- Update the file identified in pre-flight grep
- Replace broken RPC call with correct call to `get_role_models_summary_questions_i18n(lang)`
- `npx tsc --noEmit` → zero errors

**Browser verification:**
- Open Role Models assessment as student
- Navigate to Summary tab
- Confirm no 404 error
- Confirm summary questions appear in kn and ta
- Verify using student auth token — not service role

**Post-verification cleanup:**
- Update `task.md` to reflect Role Models 404 bug is fixed
- Remove Role Models 404 from CLAUDE.md Known Issues section

**Git checkpoint:**
```
git add supabase/migrations/[timestamp]_role_models_summary_rpc.sql
git add src/components/assessments/[file identified in grep]
git add task.md
git add CLAUDE.md
git commit -m "fix: Role Models summary RPC + questions + component wire, fixes 404 bug"
```

---

## Phase 1 — Move Hardcoded Content to DB

### Pre-flight checks (complete all before any Phase 1 migration)

**Check 1 — RLS on `content_translations`:**
- Verify current RLS policy allows authenticated student reads
- Run a test query using a student auth token
- If students cannot read → add `SELECT` policy for authenticated users
- Migration for RLS fix (if needed): review → apply → verify → continue
- Do not proceed until confirmed

**Check 2 — `assessmentService.ts` conflict:**
- Confirmed via audit: `assessmentService.ts` does not return `summary_title` or `summary_subtitle`
- No conflict — no action needed

**Check 3 — `translationService.ts` lang type:**
- Confirmed: lang type is currently `'en' | 'kn' | 'ta'` — missing `'hi'`
- Do not fix now — will be fixed in Phase 4C step 0
- Note it and continue

**Check 4 — career_roadmap milestone labels:**
- Run: `grep -r 'milestone\|roadmap' src/components/ --include="*.tsx" -l`
- Check if milestone labels are hardcoded or DB-driven
- If hardcoded → add to CLAUDE.md Known Issues: "Career roadmap milestone labels: English only, Hindi not supported — pending decision on DB migration"
- If DB-driven → add a Hindi seed migration to Phase 4B
- Document finding before proceeding

**Check 5 — about_me question11 sheet state:**
- The March 2026 migration deleted `about_me_fields.question11`
- Confirm the Google Sheet reflects this post-deletion state
- Run: count questions in About Me sheet tab — must match DB count of 19
- If sheet still has old numbering → flag to ILP to update sheet before sync script is built
- The sync script will map by explicit DB keys not row position — but sheet and DB counts must match

**Check 6 — `fetchTranslations()` import in all 6 components:**
- Run: `grep -r 'fetchTranslations' src/components/assessments/`
- Note which of the 6 components already import it and which do not
- Components that do not import it will need the import added in Phase 1C

---

### Step 1C — Summary Titles/Subtitles

**Pre-flight:**
- `sync_sheet.ts` does not exist yet — cannot read sheet programmatically
- Print current hardcoded `summary_title` and `summary_subtitle` values from each of the 6 components
- You manually confirm or correct each value against the sheet
- Wait for explicit confirmation before writing any SQL

**Migration:**
- Only insert `kn` and `ta` rows — never `en` rows
- Only create `summary_subtitle` key where subtitle exists in sheet — do not create key if no subtitle
- resource_type: `{type}_module`
- resource_keys: `summary_title`, `summary_subtitle`
- Dollar-quoting for all kn/ta strings
- BEGIN/COMMIT wrapper

**You review migration — confirm values match pre-flight confirmation**

**Apply:** `supabase db push`

**If migration fails:** restore from backup → fix SQL → retry

**Component updates — uniform pattern for all 6 (one at a time):**

For each component:
- If `fetchTranslations` not already imported → add import: `import { fetchTranslations } from '@/services/translationService'`
- Extend existing `fetchModuleContent` useEffect to also fetch `summary_title` and `summary_subtitle`
- Add language to useEffect dependency array — confirm language change triggers re-fetch
- Add two new state variables initialized as `null`: `dbSummaryTitle` and `dbSummarySubtitle`
- Render title as: `{dbSummaryTitle || t('summaryReflection')}`
- Render subtitle as: `{dbSummarySubtitle && <p>{dbSummarySubtitle}</p>}`
- Add loading skeleton while fetch is in progress — do not flash English then translated text
- Remove all hardcoded summary title/subtitle ternaries

**Order:**

1. `MyInspirationAssessment.tsx`
   - `npx tsc --noEmit` → zero errors
   - Verify in browser: Summary tab shows correct title and subtitle
   - Switch language mid-session → titles update without page reload
   - If fails → `git checkout src/components/assessments/MyInspirationAssessment.tsx`

2. `AboutMeAssessment.tsx`
   - `npx tsc --noEmit` → zero errors
   - Verify in browser + language switch
   - If fails → `git checkout src/components/assessments/AboutMeAssessment.tsx`

3. `MyDreamsAssessment.tsx`
   - `npx tsc --noEmit` → zero errors
   - Verify in browser + language switch
   - If fails → `git checkout src/components/assessments/MyDreamsAssessment.tsx`

4. `MySchoolLearningAssessment.tsx`
   - `npx tsc --noEmit` → zero errors
   - Verify in browser + language switch
   - If fails → `git checkout src/components/assessments/MySchoolLearningAssessment.tsx`

5. `MyHobbiesAssessment.tsx`
   - `npx tsc --noEmit` → zero errors
   - Verify in browser + language switch
   - If fails → `git checkout src/components/assessments/MyHobbiesAssessment.tsx`

6. `MyRoleModelsAssessment.tsx`
   - `npx tsc --noEmit` → zero errors
   - Verify in browser + language switch
   - If fails → `git checkout src/components/assessments/MyRoleModelsAssessment.tsx`

**Dead code cleanup:**
- Run `grep -r 'summaryReflection' src/`
- If no longer referenced → remove from `studentStrings.ts`
- `npx tsc --noEmit` → zero errors after removal

Only proceed to 1D after all 6 verified and dead code cleanup done.

---

### Step 1D — About Me Section Titles

**Pre-flight:**
- Run `grep -r 'getLocalizedSectionTitle' src/` — confirm only in `AboutMeAssessment.tsx`
- If found elsewhere → do not delete, refactor carefully
- Print the 4 section titles found in component — wait for explicit confirmation before writing SQL
- Verify fetched titles will contain expected prefixes (A./B./C./D.) — if not, decouple grouping logic from title text before proceeding

**Migration:**
- Only insert `kn` and `ta` rows — never `en` rows
- resource_type: `about_me_module`
- resource_keys: `section_a_title`, `section_b_title`, `section_c_title`, `section_d_title`
- Dollar-quoting for all kn/ta strings
- BEGIN/COMMIT wrapper

**You review migration — confirm values match pre-flight confirmation**

**Apply:** `supabase db push`

**If migration fails:** restore from backup → fix SQL → retry

**Component update:**
- `AboutMeAssessment.tsx`
- If `fetchTranslations` not already imported → add import
- Remove `getLocalizedSectionTitle()` function
- Extend existing `fetchModuleContent` useEffect
- Add 4 new state variables initialized as `null`: `dbSectionATitle`, `dbSectionBTitle`, `dbSectionCTitle`, `dbSectionDTitle`
- Add language to useEffect dependency array
- Post-fetch verification: confirm fetched titles contain A./B./C./D. prefixes — log warning if any are missing
- Section grouping must match current implementation exactly
- `npx tsc --noEmit` → zero errors
- Verify in browser: all 4 sections visible with correct titles in kn and ta
- Switch language → sections update correctly
- If fails → `git checkout src/components/assessments/AboutMeAssessment.tsx`

Only proceed to 1E after verified.

---

### Step 1E — School Learning Method Options (highest risk step)

**Pre-flight:**
- Run `grep -r 'getLearningMethodOption' src/` — confirm only in `MySchoolLearningAssessment.tsx`
- Verify exact option count: 8 checkbox options + 1 other free text = 9 total keys
- Query existing responses:
  ```sql
  SELECT DISTINCT jsonb_object_keys(
    (response_data->'section3'->'question11')
  ) AS option_key
  FROM assessment_responses
  WHERE assessment_type = 'school_learning';
  ```
- Print all keys found in saved responses
- Confirm keys match: `visual, audio, experimenting, discuss, groupDiscussions, presentation, rolePlay, teaching, other`
- If `reading`, `writing`, or `memorizing` appear in any saved response → STOP — do not delete those keys — design a data migration strategy first
- If zero responses contain those keys → safe to delete
- Check existing `school_learning_option` rows in DB (kn=12, ta=10)
- Print existing values and compare against sheet values

**Confirm component renders only DB-returned keys (not hardcoded list):**
- If component uses hardcoded key list → refactor to render only keys returned from DB fetch before deleting anything
- This must be verified before deletion is safe

**Migration — three distinct actions in this order:**

1. UPDATE kn/ta labels for 7 matching keys using `ON CONFLICT ... DO UPDATE`:
   `visual`, `audio`, `experimenting`, `discuss`, `groupDiscussions`, `teaching`, `other`

2. INSERT kn/ta labels for 2 missing keys:
   `presentation`, `rolePlay`

3. DELETE 3 stale keys (only after confirming zero responses contain them):
   `reading`, `writing`, `memorizing`

- resource_type: `school_learning_option`
- Keys are `visual`, `audio` etc. — never `option_visual` etc.
- Only insert/update `kn` and `ta` rows — never `en` rows
- Dollar-quoting for all kn/ta strings
- BEGIN/COMMIT wrapper

**You review migration — confirm DELETE targets are confirmed safe from pre-flight query**

**Apply:** `supabase db push`

**If migration fails:** restore from backup → fix SQL → retry

**Component update:**
- Remove `getLearningMethodOption()` function
- Fetch all 9 option labels from `school_learning_option` using `fetchTranslations()`
- Component must render only keys returned from DB — not a hardcoded list
- Add language to useEffect dependency array
- Response JSON keys stay completely unchanged
- Only display labels change — checkbox and free text behavior unchanged
- `npx tsc --noEmit` → zero errors
- Verify in browser: all 9 options visible with updated labels
- Select 2-3 checkboxes → save → reload → reopen → confirm checkboxes still checked
- Switch language → labels update correctly
- If fails → `git checkout src/components/assessments/MySchoolLearningAssessment.tsx`

**End of Phase 1 checkpoint:**
- `npx vite build` → must succeed — fix before proceeding to Phase 2
- Generate new `/test-plan` for full assessment flow
- Create `scripts/clear_test_cache.sql`:
  ```sql
  DELETE FROM profile_card_cache
  WHERE student_id IN (
    SELECT id FROM students WHERE teacher_id = '[test_teacher_id]'
  );
  ```
- Run: `psql [connection_string] -f scripts/clear_test_cache.sql`
- Add `docs/sync-report-latest.md` to `.gitignore`

**Session boundary note:** If this is a session boundary → run `/wrap-up` before ending. Do not start Phase 2 in a new session without CLAUDE.md reflecting current state.

**Git checkpoint:**
```
git add supabase/migrations/[timestamp]_summary_titles.sql
git add supabase/migrations/[timestamp]_about_me_section_titles.sql
git add supabase/migrations/[timestamp]_school_learning_options.sql
git add src/components/assessments/MyInspirationAssessment.tsx
git add src/components/assessments/AboutMeAssessment.tsx
git add src/components/assessments/MyDreamsAssessment.tsx
git add src/components/assessments/MySchoolLearningAssessment.tsx
git add src/components/assessments/MyHobbiesAssessment.tsx
git add src/components/assessments/MyRoleModelsAssessment.tsx
git add src/components/student/studentStrings.ts
git add scripts/clear_test_cache.sql
git add .gitignore
git commit -m "refactor: move hardcoded content to DB — summary titles, section titles, learning options"
```

---

## Phase 2 — Build Sync Scripts + Update Command

### Step 2A — Build `scripts/sync_sheet.ts` (diff only, no SQL generated)

**Authentication:**
- `GOOGLE_SERVICE_ACCOUNT_JSON` is a raw JSON string in `.env.local` — not a file path
- Parse with `JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)`
- Document this explicitly in script header and CLAUDE.md

**Header row validation (first run):**
- Before reading any data rows: read the header row of each tab
- Main questions header is row 1; summary sections have their own header row
- Sync script must read summary header row per-tab using actual column letters — never assume fixed layout
- Column positions confirmed by pre-flight audit on 2026-03-12
- If any header is wrong or columns have shifted → exit code 1 with clear message showing expected vs actual headers
- This prevents silent wrong-column reads if ILP ever reorders columns

**Column mapping — Main questions section (all 6 tabs, consistent):**
| Column | Field |
|--------|-------|
| C | Kannada Question |
| D | Tamil Question |
| E | English Question |
| F | Hindi Question |

**Column mapping — Summary sections (all 6 tabs, shifted left by 1 column):**
| Column | Field |
|--------|-------|
| B | Kannada Question |
| C | Tamil Question |
| D | English Question |
| E | Hindi Question |

**Exception:** 9.2_About Me summary has Col B=Kannada, Col C=English, Col D=Tamil (Tamil and English are swapped vs all other tabs).

**Row mapping:**
| Row | Field | DB key |
|-----|-------|--------|
| 1 | Module Title | `title` |
| 2 | Title Text | `title` (via `{type}_module`) |
| 3 | SubTitle Text | `intro` (via `{type}_module`) |
| 4+ | Questions | explicit DB keys — never positional |
| Bottom | Summary section (first block only) | summary question keys |

**Question mapping — explicit DB keys not row position:**
- Map questions by matching English text against DB English values
- Never assume row N = question N
- If a question cannot be matched to a DB key → flag as UNMATCHED, exclude from diff
- This is safe against question deletions (like about_me question11) and sheet reordering

**Exact tab names:**
| Tab | Assessment type |
|-----|----------------|
| `9.1_My Inspiration` | `inspiration` |
| `9.2_About Me` | `about_me` |
| `9.3_My Dreams` | `dreams` |
| `9.4_My School, Learnings and I` | `school_learning` |
| `9.5_My Talents and Hobbies` | `hobbies` |
| `9.6_My Role Models` | `role_models` |

**Tab processing rule:**
- If fewer than 6 tabs are successfully processed → exit code 1
- Print exactly which tabs were found and which were missing
- Never treat a missing assessment tab as acceptable

**Skip rules:**
- Any cell containing "Not sure if we need this" → skip entirely
- Any cell containing "Deleted the help texts" → skip entirely
- Summary questions → never read help text column
- Second summary block → skip entirely
- Empty Hindi cell → flag as `HINDI_TODO`
- Non-empty Hindi cell with zero Devanagari characters (U+0900–U+097F) → flag as `ENCODING_WARNING` — exclude from migration

**Update rules:**
- en → never read from sheet for DB updates
- kn/ta → `UPDATE` only, never `INSERT` new questions
- hi → `INSERT` allowed

**Snapshot JSON structure:**
```json
{
  "schema_version": 1,
  "generated_at": "[ISO timestamp]",
  "last_applied": null,
  "assessments": { ... }
}
```

**Output:**
- `scripts/questions_snapshot.json`
- `docs/sync-report-[YYYY-MM-DD].md` — committed
- `docs/sync-report-latest.md` — gitignored, never committed
- Terminal summary

**Network failure handling:**
- All 6 tab fetches must succeed before writing snapshot
- If any tab fetch fails mid-run → discard all fetched data → exit code 1
- Never write a partial snapshot

**Error handling:**
- Google Sheets API auth error → print exact env var name → exit code 1
- Supabase connection error → print clear message → exit code 1
- Fewer than 6 tabs → exit code 1, list missing tabs
- Question count mismatch → print warning per assessment
- Always print explicit success or failure summary

---

### Step 2B — Build `scripts/sync_sheet_apply.ts` (apply only)

**Guards:**
- If `scripts/questions_snapshot.json` does not exist → print "Run npm run sync-sheet first" → exit code 1
- Print snapshot `generated_at` and `last_applied` timestamps before proceeding
- If `last_applied` is not null → print warning "This snapshot was already applied on [date]. Generate a new snapshot first." → ask for confirmation before continuing
- After successful apply → update `last_applied` in snapshot JSON

**Usage:**
```
npm run sync-sheet                           # diff only
npm run sync-sheet:apply                     # all changed
npm run sync-sheet:apply inspiration         # one assessment
npm run sync-sheet:apply inspiration,dreams  # specific ones
```

**Timestamp generation:**
- Find highest existing timestamp in `supabase/migrations/`
- Add minimum gap of 60 seconds after the last Phase 0/1 timestamp
- Increment by 1 second per new file
- Verify no conflicts before writing

**Migration structure per file:**
```sql
-- ============================================================
-- Sync Migration: [type]
-- Generated: [date]
-- Changed fields: [N]
-- Hindi TODO fields: [N]
-- Encoding warnings excluded: [N]
-- ============================================================
-- ⚠️ UNICODE REMINDER: dollar-quoting for ALL kn/ta/hi strings
-- ⚠️ NEVER insert 'en' rows

BEGIN;

INSERT INTO content_translations (resource_type, resource_key, lang, value)
VALUES ('[type]', '[key]', 'kn', $$[kn value]$$),
       ('[type]', '[key]', 'ta', $$[ta value]$$)
-- TODO: Hindi pending from ILP
-- ('[type]', '[key]', 'hi', $$[hi value]$$)
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET value = EXCLUDED.value;

COMMIT;
```

**Safety:**
- Never insert `en` rows
- Dollar-quote ALL kn/ta/hi strings
- Read back each file after writing — verify sample strings match originals
- Only update `last_applied` in snapshot if ALL files succeeded
- File write error → delete partial file → exit code 1
- Unicode verification failure → delete file → print which field failed → exit code 1

---

### Step 2C — Update `/sync-sheet` command

Update `.claude/commands/sync-sheet.md` with:
- Column mapping
- Row mapping
- Question mapping: explicit DB keys not row position
- Skip rules with exact cell text patterns
- HINDI_TODO and ENCODING_WARNING flag behavior
- English never inserted into DB
- Two-script architecture
- Exact tab names
- Tab count rule: fewer than 6 = error not warning
- `GOOGLE_SERVICE_ACCOUNT_JSON` is raw JSON string
- `docs/sync-report-latest.md` is gitignored — never commit it

---

### Step 2D — Add to `package.json` and verify

```json
"sync-sheet": "npx tsx scripts/sync_sheet.ts",
"sync-sheet:apply": "npx tsx scripts/sync_sheet_apply.ts"
```

- Test `npm run sync-sheet:apply` in PowerShell immediately
- If colon fails → rename to `sync-sheet_apply` everywhere

**Session boundary note:** If this is a session boundary → run `/wrap-up` before ending.

**Git checkpoint:**
```
git add scripts/sync_sheet.ts
git add scripts/sync_sheet_apply.ts
git add .claude/commands/sync-sheet.md
git add package.json
git commit -m "feat: add sync-sheet scripts and update /sync-sheet command"
```

---

## Phase 3 — Run First Sync

**Pre-flight:**
- Confirm Phase 1 `npx vite build` passed
- Review all 6 generated migration files before applying any
- Check for shared keys across assessments — apply only after confirming no cross-dependencies
- If diffs were clean and SQL reviewed → apply all 6 then verify all 6
- Per-assessment application only needed if any diff was borderline or ambiguous

**Run sync:**
```
npm run sync-sheet
```

**Post-run:**
- Confirm `scripts/questions_snapshot.json` was created — check timestamp is current
- Open `docs/sync-report-latest.md` — read every line

**Verify zero changes for already-seeded fields:**
- Summary questions (0A, 0B) → must show no changes
- Summary titles/subtitles (1C) → must show no changes
- About Me section titles (1D) → must show no changes
- School Learning options (1E) → must show no changes
- If any of these show CHANGED → investigate mismatch → do not apply until understood

**Apply (in this order — all 6 if diffs are clean, one at a time if any were ambiguous):**
1. `inspiration` → review → apply → log in as `student_kn` → verify question text matches approved diff → repeat as `student_ta`
2. `about_me` → review → apply → verify as `student_kn` and `student_ta`
3. `dreams` → review → apply → verify as `student_kn` and `student_ta`
4. `school_learning` → review → apply → verify as `student_kn` and `student_ta`
5. `hobbies` → review → apply → verify as `student_kn` and `student_ta`
6. `role_models` → review → apply → verify as `student_kn` and `student_ta`

If any migration fails → restore from backup → fix SQL → retry

**Post-sync:**
- Run: `psql [connection_string] -f scripts/clear_test_cache.sql`
- Verify updated question text appears correctly for kn and ta in browser

**Session boundary note:** If this is a session boundary → run `/wrap-up` before ending.

**Git checkpoint:**
```
git add supabase/migrations/[all 6 sync migration files]
git add scripts/questions_snapshot.json
git add docs/sync-report-[YYYY-MM-DD].md
git commit -m "feat: first content sync from Google Sheet (kn/ta)"
```

---

## Phase 4 — Language Consistency

### Step 4A-i — Keyboard rename (mechanical — zero behavior change)

**Rename files:**
- `useKannadaKeyboard.ts` → `useIndicKeyboard.ts`
- `KannadaKeyboard.tsx` → `IndicKeyboard.tsx`
- `KannadaKeyboardInput.tsx` → `IndicKeyboardInput.tsx`

**Update all 11 consumer files:**
- Run: `grep -r 'KannadaKeyboard\|useKannadaKeyboard' src/`
- Replace all imports and JSX references
- `<KannadaKeyboard` → `<IndicKeyboard`
- `useKannadaKeyboard` → `useIndicKeyboard`
- Zero behavior change — purely mechanical rename
- `npx tsc --noEmit` → zero errors

**Git checkpoint:**
```
git add src/hooks/useIndicKeyboard.ts
git add src/components/keyboard/IndicKeyboard.tsx
git add src/components/keyboard/IndicKeyboardInput.tsx
git add src/components/assessments/[files from grep]
git add src/components/StudentDashboard.tsx
git commit -m "refactor: rename KannadaKeyboard to IndicKeyboard (mechanical rename, no behavior change)"
```

---

### Step 4A-ii — Add Tamil and Hindi layouts

**Before writing any layout:**
- Create `docs/indic-keyboard-layouts.md` with exact character sets:
  - Kannada: list all characters currently in `KANNADA_LAYOUT` (reference for verification)
  - Tamil: document exact 47 Tamil characters to include
  - Hindi: document exact Devanagari characters to include
- This file is the reference for Step 4E verification — verification is testable not subjective

**Update `useIndicKeyboard.ts`:**
- Add `HINDI_LAYOUT` following exact same structure as `KANNADA_LAYOUT`
- Add `TAMIL_LAYOUT` following exact same structure as `KANNADA_LAYOUT`
- Update `isSupported` check to include `'ta'` and `'hi'`
- Add Hindi toggle button label: `कीबोर्ड`
- Add Tamil toggle button label: `விசைப்பலகை`

**Fix `StudentDashboard.tsx` Tamil and Hindi gap:**
- Find: `{resolvedLang === 'kn' && <IndicKeyboard lang={resolvedLang} />}`
- Replace with: `{(resolvedLang === 'kn' || resolvedLang === 'ta' || resolvedLang === 'hi') && <IndicKeyboard lang={resolvedLang} />}`

- `npx tsc --noEmit` → zero errors
- Verify in browser: Kannada keyboard still works (regression), Tamil keyboard appears for ta users, Hindi keyboard appears for hi users

**Git checkpoint:**
```
git add src/hooks/useIndicKeyboard.ts
git add src/components/StudentDashboard.tsx
git add docs/indic-keyboard-layouts.md
git commit -m "feat: add Tamil and Hindi layouts to IndicKeyboard"
```

---

### Step 4A-iii — UX improvements

**All changes in `IndicKeyboard.tsx`:**

Scroll compensation:
- When keyboard opens: apply `paddingBottom` equal to keyboard height (40vh) to main page scroll container, then scroll focused element into view
- When keyboard closes: remove padding
- Test at 360px screen width — active input must never be hidden behind keyboard

Toggle button simplification:
- Remove floating toggle button when keyboard is open
- Keep only X dismiss button in keyboard header when open
- When keyboard is closed: floating toggle button remains

Touch targets:
- Add `min-w-[44px]` to all key button classes
- Ensures 44px minimum touch target width on all keys

Layout fit:
- Verify all characters fit within 40vh without scroll on 360px screen
- If any layout requires scroll → reorganize rows, reduce gap to `gap-0.5`

Haptic feedback:
```javascript
// navigator.vibrate() is not supported on iOS Safari — this is intentional and expected.
// The try/catch handles it gracefully. Do not debug this on iPhone.
try { navigator.vibrate(10); } catch (e) { /* not supported */ }
```
Add on each keypress.

- `npx tsc --noEmit` → zero errors
- Test at 360px: no scroll inside keyboard, inputs never covered, touch targets work
- Verify haptic on Android device (expected no-op on iOS)

**Git checkpoint:**
```
git add src/components/keyboard/IndicKeyboard.tsx
git commit -m "feat: keyboard UX improvements — scroll compensation, touch targets, haptic feedback"
```

---

### Step 4B — Migration (Hindi enum only)

```sql
-- MUST be outside BEGIN/COMMIT — PostgreSQL requirement
-- ALTER TYPE cannot run inside a transaction block
-- IF NOT EXISTS is intentional — safe to retry
-- If migration fails: check Supabase connectivity and permissions, not the enum
ALTER TYPE preferred_language ADD VALUE IF NOT EXISTS 'hi';
```

- No INSERT block — no placeholder rows
- Hindi content inserted by sync script when ILP provides it

**You review — confirm `ALTER TYPE` is before any BEGIN block**

**Apply:** `supabase db push`

**Post-migration smoke test:**
- Confirm existing en/kn/ta users can still log in
- Confirm each dashboard loads correctly
- Confirm en/kn/ta users can still save responses
- This catches unexpected RLS or trigger side effects from the enum change

**⚠️ Important dependency:** Do not allow any Hindi user to generate summaries until Phase 4C step 5 (`aiSummaryService.ts`) is also complete. The enum and detection update must be in the same session without interruption between them.

---

### Step 4C — Language support files (one file at a time, `npx tsc --noEmit` after each)

**0. `translationService.ts` (must be first)**
- Add `'hi'` to lang union type: `lang: 'en' | 'kn' | 'ta' | 'hi'`
- `npx tsc --noEmit` → zero errors

**1. `useLang.tsx`**
- Add `hi` to supported languages array
- Add Hindi string keys (English as fallback — component-level, not DB rows)
- After updating: verify en/kn/ta still work before testing hi:
  - Switch to Kannada → verify
  - Switch to Tamil → verify
  - Switch to English → verify
  - Only then test Hindi

**2. `LanguageSelectionDialog.tsx`**
- Add हिन्दी option after Tamil, value: `hi`

**3. `studentStrings.ts`**
- Add `hi` key to every string entry, English text as fallback
- Add comment: `// TODO: Hindi translation pending from ILP`
- After updating: count hi keys — must equal count of en keys
- If ta or kn entries are missing → log gap but do not block

**4. `teacherStrings.ts`**
- Same as studentStrings.ts
- Count hi keys — must equal count of en keys

**5. `aiSummaryService.ts` (complete immediately after 4B — no interruption)**
- Add `containsHindi()` with range `\u0900-\u097F`
- Add `hi` to `detectLanguage()` following exact same pattern as `containsKannada()` and `containsTamil()`
- Do not add Hindi-specific prompts to `generate*` methods — falls back to English prompts until ILP provides Hindi templates

**6. `speechToTextService.ts`**
- Add `hi-IN` following exact same pattern as `kn-IN` and `ta-IN`

**7. All assessment components — language ternaries**
- Run `grep -r 'useIndicKeyboard' src/components/assessments/`
- Only update components in grep results
- Add `hi` to all language ternaries (English fallback)
- `npx tsc --noEmit` after each component

---

### Step 4D — Remove simple-keyboard if present

```bash
grep -r 'simple-keyboard' src/
```
- If imports found in `src/` → do not uninstall, investigate first

```bash
cat package.json | grep simple-keyboard
```
- If listed AND no imports in `src/` → `npm uninstall simple-keyboard`
- `npx vite build` → confirm passes and bundle size decreases
- If not in `package.json` → skip entirely

---

### Step 4E — Final verification

**Language regression (in this exact order):**
1. English → no keyboard anywhere, full UI works, no broken strings
2. Kannada → keyboard appears on input focus, all characters in `docs/indic-keyboard-layouts.md` present, typing works
3. Tamil → keyboard appears including StudentDashboard CareerChat, all 47 Tamil characters from `docs/indic-keyboard-layouts.md` present, typing works
4. Hindi → keyboard appears, all Devanagari characters from `docs/indic-keyboard-layouts.md` present, typing works, English fallback shown where Hindi content pending
5. Switch languages mid-session → keyboard switches correctly
6. Keyboard never covers active input (test at 360px)
7. Existing en/kn/ta student data unchanged — open a saved response in each language and confirm it loads correctly

**Build check:**
- `npx tsc --noEmit` → zero errors
- `npx vite build` → successful

**Session boundary note:** If this is a session boundary → run `/wrap-up` before ending.

**Git checkpoint:**
```
git add src/services/translationService.ts
git add src/hooks/useLang.tsx
git add src/components/LanguageSelectionDialog.tsx
git add src/components/student/studentStrings.ts
git add src/components/teacher/teacherStrings.ts
git add src/services/aiSummaryService.ts
git add src/services/speechToTextService.ts
git add src/components/assessments/[only files changed by grep]
git add supabase/migrations/[timestamp]_add_hindi_language.sql
git commit -m "feat: Hindi language support + Tamil and Hindi virtual keyboards + Indic keyboard refactor"
```

---

## Phase 5 — Final Verification + Wrap-up

### Runtime regression test
Before running `/ship`:
- Log in as student (en) → dashboard loads → open one assessment → save a response
- Log in as student (kn) → dashboard loads → open one assessment → save a response
- Log in as student (ta) → dashboard loads → open one assessment → save a response
- Log in as teacher → dashboard loads → view student summary
- Log in as admin → dashboard loads
- All 5 role/language combinations must pass

### Run `/ship`
- `npx tsc --noEmit` + `npx vite build` must both pass
- Updates "Last verified build" date in CLAUDE.md
- Review staged files before committing

### Run `/wrap-up`

Confirm CLAUDE.md implementation status table reflects:

| Feature | Status |
|---------|--------|
| School Learning summary questions | ✅ seeded |
| Role Models summary RPC + 404 fix | ✅ |
| All 6 assessments fully DB-driven | ✅ |
| Sync script (`sync_sheet.ts`) | ✅ |
| Sync apply script (`sync_sheet_apply.ts`) | ✅ |
| First content sync from sheet | ✅ |
| Hindi enum | ✅ |
| Indic keyboard (kn/ta/hi) | ✅ |
| Hindi UI strings | ⚠️ English fallback, pending ILP |
| Hindi content translations | ⚠️ pending ILP via sync-sheet |
| Hindi STT | ✅ hi-IN added |
| API keys in client bundle | 🔴 Must resolve before production rollout beyond pilot schools |

Confirm `/sync-sheet` command updated with all Phase 2C knowledge.

Add to CLAUDE.md Known Issues:
- "Hindi UI translations: English fallback — pending ILP providing Hindi strings"
- "Hindi content translations: no rows yet — pending ILP updating Google Sheet"
- "API key exposure: VITE_* keys in client bundle — must resolve before production rollout beyond pilot schools"
- Career roadmap milestone labels: [result of Pre-1 Check 4 — add appropriate note]

### Final commit
```
git add CLAUDE.md .claude/commands/sync-sheet.md
git commit -m "chore: wrap-up — content migration + language consistency complete"
```

---

## Summary Table

| Step | What | Migration | Files touched | Verification |
|------|------|-----------|---------------|--------------|
| Pre-0 | DB backup | — | scripts/export_db_snapshot.ts | Backup file exists |
| 0A | School Learning summary questions | 1 | — | English unchanged + browser kn/ta |
| 0B | Role Models RPC + component wire | 1 | 1 component | English unchanged + browser, no 404, student token |
| Pre-1 | RLS + career_roadmap + question11 + fetchTranslations audit | 0 or 1 | maybe 1 | Student reads confirmed |
| 1C | Summary titles/subtitles | 1 | 6 components + maybe studentStrings.ts | tsc + browser + language switch each |
| 1D | About Me section titles | 1 | 1 component | tsc + browser + prefix verification |
| 1E | School Learning options | 1 | 1 component | tsc + browser + reload test + response keys safe |
| End of 1 | Build + test-plan + cache script + gitignore | — | .gitignore, scripts/ | vite build passes |
| 2A | `sync_sheet.ts` | — | 1 new script | Header validation + 6 tabs + snapshot created |
| 2B | `sync_sheet_apply.ts` | — | 1 new script | Guard check + idempotency warning |
| 2C | `/sync-sheet` command | — | 1 command file | Manual review |
| 2D | `package.json` + PowerShell | — | `package.json` | Works in PowerShell |
| 3 | First sync | 6 | snapshot + docs | Zero changes for Phase 0/1 fields + browser kn/ta |
| 4A-i | Keyboard rename | — | 3 renamed + 11 consumers | tsc zero errors |
| 4A-ii | Tamil + Hindi layouts | — | useIndicKeyboard + StudentDashboard + docs | tsc + browser all 3 keyboards |
| 4A-iii | Keyboard UX | — | IndicKeyboard.tsx | 360px scroll + touch + haptic |
| 4B | Hindi enum | 1 | — | Smoke test en/kn/ta users unaffected |
| 4C | Language files + detection | — | translationService + useLang + 5 more + components | tsc each + all 4 languages |
| 4D | Remove simple-keyboard | — | package.json | vite build + bundle size |
| 4E | Final language verification | — | — | All 4 languages + keyboard + 360px + saved data |
| 5 | Runtime regression + ship + wrap-up | — | CLAUDE.md | All 5 role/language combos + /ship + status table |

---

