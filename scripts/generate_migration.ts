/**
 * generate_migration.ts — Reads sheet_dump JSON and generates clean-slate migration SQL.
 *
 * Usage: npx tsx scripts/generate_migration.ts
 * Output: supabase/migrations/[timestamp]_clean_slate_content_migration.sql
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DUMP_PATH = path.resolve(__dirname, 'sheet_dump_2026-03-18.json');
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'supabase', 'migrations');

interface LangText { kn: string; ta: string; en: string; hi: string; }

// Read dump
const dump = JSON.parse(fs.readFileSync(DUMP_PATH, 'utf-8'));
const assessments = dump.assessments as Record<string, any>;

// Find next migration timestamp
const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => /^\d{14}/.test(f)).sort();
const lastTs = files[files.length - 1]?.substring(0, 14) || '20260312000006';
// Parse last timestamp and add 1 second
const nextTs = String(BigInt(lastTs) + 1n).padStart(14, '0');
const outFile = path.join(MIGRATIONS_DIR, `${nextTs}_clean_slate_content_migration.sql`);

// All resource_types we need to clean
const RESOURCE_TYPES_TO_DELETE = [
  // Per-assessment types
  ...['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'].flatMap(t => [
    `${t}_module`, `${t}_question`, `${t}_help`, `${t}_summary_question`, `${t}_section`,
  ]),
  // Additional known types
  'role_models_questions',
  'school_learning_option',
  'school_learning_summary_help',
  'school_help',
  'school_question',
  'inspiration_summary_question',
];
// Deduplicate
const uniqueResourceTypes = [...new Set(RESOURCE_TYPES_TO_DELETE)];

const ASSESSMENT_TYPES = ['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'];

// Dollar-quote a string (handles strings that might contain $$ by using tagged quotes)
function dq(text: string): string {
  if (!text) return "''";
  // Check if text contains $$ — use tagged dollar quote if so
  if (text.includes('$$')) {
    return `$dq$${text}$dq$`;
  }
  return `$$${text}$$`;
}

// Quote English text normally (single quotes with escaping)
function sq(text: string): string {
  if (!text) return "''";
  return `'${text.replace(/'/g, "''")}'`;
}

// For clean slate, we use dollar-quoting for ALL languages for safety
function quote(text: string): string {
  if (!text) return "''";
  // Use dollar-quoting for everything to be safe with Unicode
  if (text.includes('$$')) {
    return `$dq$${text}$dq$`;
  }
  return `$$${text}$$`;
}

let sql = '';
let insertCount = 0;
let skippedRows: string[] = [];
let breakdownByAssessment: Record<string, number> = {};

function addLine(line: string) { sql += line + '\n'; }

function insertCT(resourceType: string, resourceKey: string, lang: LangText, label: string) {
  for (const [langCode, text] of Object.entries(lang) as [string, string][]) {
    if (!text) {
      skippedRows.push(`${label} | lang=${langCode} | reason=empty cell`);
      continue;
    }
    addLine(`INSERT INTO content_translations (resource_type, resource_key, lang, text)`);
    addLine(`VALUES (${sq(resourceType)}, ${sq(resourceKey)}, ${sq(langCode)}, ${quote(text)})`);
    addLine(`ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;`);
    addLine('');
    insertCount++;
    breakdownByAssessment[resourceType.split('_')[0]] = (breakdownByAssessment[resourceType.split('_')[0]] || 0) + 1;
  }
}

// Track per-assessment inserts
const perAssessment: Record<string, { ct: number; summary: number }> = {};
for (const t of ASSESSMENT_TYPES) {
  perAssessment[t] = { ct: 0, summary: 0 };
}

function countCT(type: string) { perAssessment[type].ct++; }

// Start building SQL
addLine('-- ============================================================');
addLine('-- Clean Slate Content Migration');
addLine(`-- Generated: ${new Date().toISOString()}`);
addLine(`-- Source: scripts/sheet_dump_2026-03-18.json`);
addLine('-- ============================================================');
addLine('-- This migration wipes and re-inserts ALL content_translations');
addLine('-- and assessment_summary_templates for the 6 core assessments.');
addLine('-- Safe for test environments only.');
addLine('-- ============================================================');
addLine('');
addLine('BEGIN;');
addLine('');

// Step 1: DELETE existing content
addLine('-- ============================================================');
addLine('-- STEP 1: DELETE existing content');
addLine('-- ============================================================');
addLine('');
addLine(`DELETE FROM content_translations WHERE resource_type IN (`);
addLine(`  ${uniqueResourceTypes.map(t => sq(t)).join(',\n  ')}`);
addLine(`);`);
addLine('');
addLine(`DELETE FROM assessment_summary_templates WHERE assessment_type IN (`);
addLine(`  ${ASSESSMENT_TYPES.map(t => sq(t)).join(', ')}`);
addLine(`);`);
addLine('');

// Step 2: INSERT content_translations per assessment
addLine('-- ============================================================');
addLine('-- STEP 2: INSERT content_translations');
addLine('-- ============================================================');

for (const type of ASSESSMENT_TYPES) {
  const a = assessments[type];
  if (!a) { skippedRows.push(`${type} | reason=missing from dump`); continue; }

  addLine('');
  addLine(`-- ------------------------------------------------------------`);
  addLine(`-- ${a.tab_name} (${type})`);
  addLine(`-- ------------------------------------------------------------`);
  addLine('');

  // Module title
  addLine(`-- Module title`);
  insertCT(`${type}_module`, 'title', a.module_title, `${type} module title`);

  // Title text (intro)
  addLine(`-- Title text (intro)`);
  insertCT(`${type}_module`, 'intro', a.title_text, `${type} title text`);

  // Subtitle text
  if (a.subtitle_text.en || a.subtitle_text.kn || a.subtitle_text.ta || a.subtitle_text.hi) {
    addLine(`-- Subtitle text`);
    insertCT(`${type}_module`, 'subtitle', a.subtitle_text, `${type} subtitle text`);
  }

  // Summary title
  if (a.summary.title.en || a.summary.title.kn) {
    addLine(`-- Summary title`);
    insertCT(`${type}_module`, 'summary_title', a.summary.title, `${type} summary title`);
  }

  // Summary subtitle
  if (a.summary.subtitle.en || a.summary.subtitle.kn) {
    addLine(`-- Summary subtitle`);
    insertCT(`${type}_module`, 'summary_subtitle', a.summary.subtitle, `${type} summary subtitle`);
  }

  // Section titles and subtitles
  const sections = a.sections as any[];
  if (sections.length > 0) {
    addLine(`-- Section titles`);
    sections.forEach((sec: any, idx: number) => {
      const sectionNum = idx + 1;
      if (sec.title.en || sec.title.kn) {
        insertCT(`${type}_section`, `section_${sectionNum}_title`, sec.title, `${type} section ${sectionNum} title`);
      }
      if (sec.subtitle.en || sec.subtitle.kn) {
        insertCT(`${type}_section`, `section_${sectionNum}_subtitle`, sec.subtitle, `${type} section ${sectionNum} subtitle`);
      }
    });
  }

  // Questions and help texts
  // Questions have section-local sno (resets per section). We need to generate a global sequential number.
  const questions = a.questions as any[];
  if (questions.length > 0) {
    addLine(`-- Questions (${questions.length} total)`);
    let globalQ = 0;
    let currentSection = '';
    for (const q of questions) {
      globalQ++;
      const key = `question_${globalQ}`;

      // Add section marker comment when section changes
      if (q.section !== currentSection) {
        currentSection = q.section;
        addLine(`-- Section: ${currentSection}`);
      }

      insertCT(`${type}_question`, key, q.question, `${type} Q${globalQ} (sheet sno=${q.sno})`);

      // Help text — only insert if at least one language has content
      const hasHelp = q.help_text.en || q.help_text.kn || q.help_text.ta || q.help_text.hi;
      if (hasHelp) {
        insertCT(`${type}_help`, key, q.help_text, `${type} Q${globalQ} help`);
      }
    }
  }

  // Summary questions
  const summaryQs = a.summary.questions as any[];
  if (summaryQs.length > 0) {
    addLine(`-- Summary questions (${summaryQs.length} total)`);

    // For hobbies: two sub-tables with sno reset. Use global sequential numbering.
    let globalSQ = 0;
    for (const sq of summaryQs) {
      globalSQ++;

      // Skip School Learning SQ7 note row (input_type: None)
      if (type === 'school_learning' && sq.input_type === 'None') {
        skippedRows.push(`${type} SQ${globalSQ} (sheet sno=${sq.sno}) | reason=note row (input_type=None): "${sq.question.en?.substring(0, 60)}..."`);
        continue;
      }

      const key = `summary_question_${globalSQ}`;
      insertCT(`${type}_summary_question`, key, sq.question, `${type} SQ${globalSQ} (sheet sno=${sq.sno})`);
    }
  }
}

// Step 3: INSERT assessment_summary_templates
addLine('');
addLine('-- ============================================================');
addLine('-- STEP 3: INSERT assessment_summary_templates');
addLine('-- ============================================================');
addLine('');

for (const type of ASSESSMENT_TYPES) {
  const a = assessments[type];
  if (!a) continue;

  let summaryQs = a.summary.questions as any[];

  // Filter out note rows for school_learning
  if (type === 'school_learning') {
    summaryQs = summaryQs.filter((sq: any) => sq.input_type !== 'None');
  }

  if (summaryQs.length === 0) continue;

  // Build JSONB: { en: { question1: "...", question2: "..." }, kn: {...}, ta: {...}, hi: {...} }
  const langs: Record<string, Record<string, string>> = { en: {}, kn: {}, ta: {}, hi: {} };
  let globalSQ = 0;

  for (const sq of summaryQs) {
    globalSQ++;
    const qKey = `question${globalSQ}`;
    for (const lang of ['en', 'kn', 'ta', 'hi'] as const) {
      if (sq.question[lang]) {
        langs[lang][qKey] = sq.question[lang];
      }
    }
  }

  // Build the JSONB using jsonb_build_object for clean formatting
  addLine(`-- ${a.tab_name} summary template`);
  addLine(`INSERT INTO assessment_summary_templates (assessment_type, summary_questions)`);
  addLine(`VALUES (${sq(type)}, `);

  // Build JSON string directly for readability
  const jsonObj: Record<string, Record<string, string>> = {};
  for (const lang of ['en', 'kn', 'ta', 'hi']) {
    if (Object.keys(langs[lang]).length > 0) {
      jsonObj[lang] = langs[lang];
    }
  }

  // Use dollar-quoting for the entire JSON to handle Unicode safely
  const jsonStr = JSON.stringify(jsonObj, null, 2);
  addLine(`$$${jsonStr}$$::jsonb`);
  addLine(`)`);
  addLine(`ON CONFLICT (assessment_type) DO UPDATE SET summary_questions = EXCLUDED.summary_questions;`);
  addLine('');
  perAssessment[type].summary = globalSQ;
  insertCount++; // count the summary template insert
}

// COMMIT
addLine('COMMIT;');

// Write file
fs.writeFileSync(outFile, sql, 'utf-8');
const fileSize = fs.statSync(outFile).size;

// Report
console.log('='.repeat(60));
console.log('MIGRATION GENERATION REPORT');
console.log('='.repeat(60));
console.log(`Output: ${outFile}`);
console.log(`Size: ${(fileSize / 1024).toFixed(1)} KB`);
console.log(`Total INSERT statements: ${insertCount}`);
console.log('');

// Count per assessment
console.log('Breakdown by assessment:');
for (const type of ASSESSMENT_TYPES) {
  const a = assessments[type];
  const sections = a.sections.length;
  const questions = a.questions.length;
  const summaryQs = type === 'school_learning'
    ? a.summary.questions.filter((sq: any) => sq.input_type !== 'None').length
    : a.summary.questions.length;

  // Count actual CT inserts for this assessment
  // Module: title + intro + subtitle(?) + summary_title(?) + summary_subtitle(?)
  let ctCount = 0;
  // Count from the SQL by regex matching resource_type
  const typeRegex = new RegExp(`'${type}_`, 'g');
  const matches = sql.match(typeRegex);
  ctCount = matches ? matches.length : 0;

  console.log(`  ${type}:`);
  console.log(`    Sections: ${sections}, Questions: ${questions}, Summary Qs: ${summaryQs}`);
  console.log(`    content_translations INSERTs: ~${ctCount / 2} rows`); // divide by 2 because resource_type appears in both INSERT and ON CONFLICT
  console.log(`    assessment_summary_templates: 1 row (${summaryQs} questions × 4 langs)`);
}

console.log('');
if (skippedRows.length > 0) {
  console.log(`Skipped rows (${skippedRows.length}):`);
  for (const s of skippedRows) {
    console.log(`  - ${s}`);
  }
} else {
  console.log('Skipped rows: 0');
}
console.log('='.repeat(60));
