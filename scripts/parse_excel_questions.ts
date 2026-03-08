import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Types ──────────────────────────────────────────────────────────────────────

interface ParsedQuestion {
  questionNumber: number;
  en: string;
  enHelp: string;
  kn: string;
  knHelp: string;
  ta: string;
  taHelp: string;
}

interface ParsedSummaryQuestion {
  questionNumber: number;
  en: string;
  kn: string;
  ta: string;
}

interface ParsedSheet {
  sheetName: string;
  assessmentType: string;
  mainQuestions: ParsedQuestion[];
  summaryQuestions: ParsedSummaryQuestion[];
  checkboxOptions?: { key: string; en: string; kn: string; ta: string }[];
  tableHeadings?: { en: string; kn: string; ta: string; enHelp: string; knHelp: string; taHelp: string }[];
}

// ── Sheet → assessment_type mapping ────────────────────────────────────────────

const SHEET_MAP: Record<string, string> = {
  '9.1_My Inspiration': 'inspiration',
  '9.2_About Me': 'about_me',
  '9.3_My Dreams': 'dreams',
  '9.4_My School, Learnings and I': 'school_learning',
  '9.5_My Talents and Hobbies': 'hobbies',
  '9.6_My Role Models': 'role_models',
};

// DB resource_type mapping for content_translations
const RESOURCE_TYPES: Record<string, { question: string; help: string }> = {
  inspiration: { question: 'inspiration_question', help: 'inspiration_help' },
  about_me: { question: 'about_me_question', help: 'about_me_help' },
  dreams: { question: 'dreams_question', help: 'dreams_help' },
  school_learning: { question: 'school_learning_question', help: 'school_learning_help' },
  hobbies: { question: 'hobbies_question', help: 'hobbies_help' },
  role_models: { question: 'role_models_question', help: 'role_models_help' },
};

// Base question table names
const BASE_TABLES: Record<string, string> = {
  inspiration: 'inspiration_questions',
  about_me: 'about_me_fields',
  dreams: 'dreams_questions',
  school_learning: 'school_learning_questions',
  hobbies: 'hobbies_questions',
  role_models: 'role_models_questions',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function clean(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function dollarQuote(s: string): string {
  if (!s) return "''";
  // Use $txt$...$txt$ for multi-line or complex strings, $$...$$ for simple
  if (s.includes('$$')) {
    return `$txt$${s}$txt$`;
  }
  return `$$${s}$$`;
}

// ── Parse a sheet ──────────────────────────────────────────────────────────────

function parseSheet(ws: XLSX.WorkSheet, sheetName: string, assessmentType: string): ParsedSheet {
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Find main questions header row (has "Sno" in column A)
  let headerRow = -1;
  for (let i = 0; i < Math.min(data.length, 15); i++) {
    const firstCell = clean(data[i][0]);
    if (firstCell.toLowerCase() === 'sno') {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) {
    console.error(`  [${sheetName}] Could not find header row with "Sno"`);
    return { sheetName, assessmentType, mainQuestions: [], summaryQuestions: [] };
  }

  // Determine column layout from header row
  // Standard: Sno | Kannada Question | Kannada Help Text | Tamil Question | Tamil Help Text | English Question | English Help Text
  const headers = data[headerRow].map((h: any) => clean(h).toLowerCase());

  let colKnQ = 1, colKnH = 2, colTaQ = 3, colTaH = 4, colEnQ = 5, colEnH = 6;
  // Verify by checking header text
  if (headers[1]?.includes('kannada') && headers[3]?.includes('tamil') && headers[5]?.includes('english')) {
    // Standard layout confirmed
  }

  // Extract main questions
  const mainQuestions: ParsedQuestion[] = [];
  const checkboxOptions: { key: string; en: string; kn: string; ta: string }[] = [];
  const tableHeadings: { en: string; kn: string; ta: string; enHelp: string; knHelp: string; taHelp: string }[] = [];

  let questionNum = 0;
  let inCheckboxOptions = false;

  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    const sno = clean(row[0]);
    const knQ = clean(row[colKnQ]);
    const knH = clean(row[colKnH]);
    const taQ = clean(row[colTaQ]);
    const taH = clean(row[colTaH]);
    const enQ = clean(row[colEnQ]);
    const enH = clean(row[colEnH]);

    // Stop at Summary marker (handles "Summary", "Summary of my Interests", etc.)
    const snoLower = sno.toLowerCase();
    const col1Lower = clean(row[1]).toLowerCase();
    if (snoLower === 'summary' || snoLower.startsWith('summary of') ||
        knQ.toLowerCase() === 'summary' ||
        (sno === '' && col1Lower === 'summary')) {
      break;
    }

    // Skip empty rows
    if (!sno && !knQ && !enQ && !taQ) {
      if (inCheckboxOptions) {
        inCheckboxOptions = false;
      }
      continue;
    }

    // School learning Q11 checkbox options (a, b, c, ... j)
    if (assessmentType === 'school_learning' && /^[a-j]$/i.test(sno)) {
      inCheckboxOptions = true;
      const optionKeyMap: Record<string, string> = {
        a: 'visual', b: 'reading', c: 'audio', d: 'experimenting',
        e: 'discuss', f: 'groupDiscussions', g: 'writing',
        h: 'memorizing', i: 'teaching', j: 'other',
      };
      checkboxOptions.push({
        key: optionKeyMap[sno.toLowerCase()] || sno.toLowerCase(),
        en: enQ,
        kn: knQ,
        ta: taQ,
      });
      continue;
    }

    // Role models: "Table Heading" row and the 2 subsequent empty-SNo rows
    // (RM2/RM3 headings immediately follow the "Table Heading" RM1 row)
    if (assessmentType === 'role_models') {
      if (snoLower === 'table heading') {
        tableHeadings.push({ en: enQ, kn: knQ, ta: taQ, enHelp: enH, knHelp: knH, taHelp: taH });
        // Also grab the next 2 rows (RM2 and RM3) which have empty SNo
        for (let j = 1; j <= 2 && i + j < data.length; j++) {
          const nextRow = data[i + j];
          const nextSno = clean(nextRow[0]);
          if (nextSno === '' && (clean(nextRow[colKnQ]) || clean(nextRow[colEnQ]))) {
            tableHeadings.push({
              en: clean(nextRow[colEnQ]), kn: clean(nextRow[colKnQ]), ta: clean(nextRow[colTaQ]),
              enHelp: clean(nextRow[colEnH]), knHelp: clean(nextRow[colKnH]), taHelp: clean(nextRow[colTaH]),
            });
          }
        }
        i += 2; // Skip the 2 rows we already consumed
        continue;
      }
    }

    // Regular question row
    const num = parseInt(sno, 10);
    if (!isNaN(num) || (sno === '' && (knQ || enQ || taQ))) {
      questionNum++;
      mainQuestions.push({
        questionNumber: !isNaN(num) ? num : questionNum,
        en: enQ,
        enHelp: enH,
        kn: knQ,
        knHelp: knH,
        ta: taQ,
        taHelp: taH,
      });
    }
  }

  // Extract summary questions
  const summaryQuestions: ParsedSummaryQuestion[] = [];

  // Find summary section(s)
  let summaryStart = -1;
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    const sno = clean(row[0]);
    const col1 = clean(row[1]);
    if (sno.toLowerCase() === 'summary' || sno.toLowerCase().includes('summary of') ||
        col1.toLowerCase() === 'summary') {
      summaryStart = i;
      break;
    }
  }

  if (summaryStart >= 0) {
    // Find the summary questions header row (SNo or similar)
    let summaryHeaderRow = summaryStart;
    for (let i = summaryStart; i < Math.min(summaryStart + 5, data.length); i++) {
      const firstCell = clean(data[i][0]).toLowerCase();
      if (firstCell === 'sno' || firstCell === 'title' || firstCell === 'subtitle') {
        summaryHeaderRow = i;
        break;
      }
      // Check if next row has numbered questions starting with 1
      if (i + 1 < data.length && clean(data[i + 1][0]) === '1') {
        summaryHeaderRow = i;
        break;
      }
    }

    // Determine summary column layout
    // Different sheets have different layouts:
    // Inspiration: SNo | Kannada | Tamil | English
    // About Me: Sno | Kannada | English | Tamil
    // Dreams: (no SNo) | Kannada | Tamil | English
    // School Learning: (no SNo) | Kannada | Tamil | English
    // Hobbies: SNo | Kannada Question | Tamil Question | English Question
    // Role Models: varies

    const sumHeaders = data[summaryHeaderRow]?.map((h: any) => clean(h).toLowerCase()) || [];

    let sumColKn = 1, sumColTa = 2, sumColEn = 3;

    // Try to detect column order from headers
    for (let c = 0; c < sumHeaders.length; c++) {
      if (sumHeaders[c].includes('kannada')) sumColKn = c;
      if (sumHeaders[c].includes('tamil')) sumColTa = c;
      if (sumHeaders[c].includes('english')) sumColEn = c;
    }

    let summaryNum = 0;
    for (let i = summaryHeaderRow + 1; i < data.length; i++) {
      const row = data[i];
      const sno = clean(row[0]);
      const kn = clean(row[sumColKn]);
      const ta = clean(row[sumColTa]);
      const en = clean(row[sumColEn]);

      // Skip title/subtitle rows (both labeled and unlabeled)
      if (sno.toLowerCase() === 'title' || sno.toLowerCase() === 'subtitle') continue;
      // Skip unlabeled title rows that contain "Summary:" / "ಸಾರಾಂಶ" / "சுருக்கம்"
      if (!sno && (en.toLowerCase().startsWith('summary:') || kn.includes('ಸಾರಾಂಶ') || ta.includes('சுருக்கம்'))) continue;

      // Stop at empty rows (2 consecutive)
      if (!sno && !kn && !en && !ta) {
        // Check if next row is also empty or is another summary section
        if (i + 1 < data.length) {
          const nextRow = data[i + 1];
          const nextSno = clean(nextRow[0]);
          const nextCol1 = clean(nextRow[1]);
          if ((!nextSno && !nextCol1) || nextSno.toLowerCase() === 'summary') break;
        } else {
          break;
        }
        continue;
      }

      // Skip header-like rows
      if (sno.toLowerCase() === 'sno') continue;

      // Accept rows with content
      if (kn || en || ta) {
        summaryNum++;
        const num = parseInt(sno, 10);
        summaryQuestions.push({
          questionNumber: !isNaN(num) ? num : summaryNum,
          en,
          kn,
          ta,
        });
      }
    }

    // For School Learning, check for a SECOND summary section
    if (assessmentType === 'school_learning' || assessmentType === 'hobbies' || assessmentType === 'about_me') {
      // Look for additional summary sections after the first one
      for (let i = summaryStart + summaryQuestions.length + 3; i < data.length; i++) {
        const row = data[i];
        const sno = clean(row[0]);
        const col1 = clean(row[1]);
        if (sno.toLowerCase() === 'summary' || col1.toLowerCase().includes('summary')) {
          // Find header row for this second summary
          let secondHeaderRow = i;
          for (let j = i; j < Math.min(i + 5, data.length); j++) {
            const cell = clean(data[j][0]).toLowerCase();
            if (cell === 'sno' || cell === '1' || cell === 'a') {
              secondHeaderRow = j;
              break;
            }
            if (j + 1 < data.length && (clean(data[j + 1][0]) === '1' || clean(data[j + 1][0]) === 'a')) {
              secondHeaderRow = j;
              break;
            }
          }

          // Detect columns for second summary
          const secHeaders = data[secondHeaderRow]?.map((h: any) => clean(h).toLowerCase()) || [];
          let secColKn = 1, secColTa = 2, secColEn = 3;
          for (let c = 0; c < secHeaders.length; c++) {
            if (secHeaders[c].includes('kannada')) secColKn = c;
            if (secHeaders[c].includes('tamil')) secColTa = c;
            if (secHeaders[c].includes('english')) secColEn = c;
          }

          for (let j = secondHeaderRow + 1; j < data.length; j++) {
            const r = data[j];
            const s = clean(r[0]);
            const knVal = clean(r[secColKn]);
            const taVal = clean(r[secColTa]);
            const enVal = clean(r[secColEn]);
            if (!s && !knVal && !enVal && !taVal) break;
            if (s.toLowerCase() === 'sno' || s.toLowerCase() === 'title' || s.toLowerCase() === 'subtitle') continue;
            if (knVal || enVal || taVal) {
              summaryNum++;
              summaryQuestions.push({
                questionNumber: summaryNum,
                en: enVal,
                kn: knVal,
                ta: taVal,
              });
            }
          }
          break;
        }
      }
    }
  }

  const result: ParsedSheet = { sheetName, assessmentType, mainQuestions, summaryQuestions };
  if (checkboxOptions.length > 0) result.checkboxOptions = checkboxOptions;
  if (tableHeadings.length > 0) result.tableHeadings = tableHeadings;
  return result;
}

// ── SQL Generation ─────────────────────────────────────────────────────────────

function generateTranslationUpsert(
  resourceType: string,
  resourceKey: string,
  lang: string,
  text: string
): string {
  if (!text) return '';
  return `INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES (${dollarQuote(resourceType)}, ${dollarQuote(resourceKey)}, '${lang}', ${dollarQuote(text)})
ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text, updated_at = NOW();\n`;
}

function generateBaseTableUpdate(
  table: string,
  assessmentType: string,
  seqNum: number,
  enQuestion: string,
  enHelp: string
): string {
  const lines: string[] = [];

  // Base question tables do NOT have updated_at columns
  const setClauses = `question_text = ${dollarQuote(enQuestion)}${enHelp ? `, help_text = ${dollarQuote(enHelp)}` : ''}`;

  if (table === 'about_me_fields') {
    lines.push(`UPDATE ${table} SET ${setClauses} WHERE field_key = 'question${seqNum}';`);
  } else if (table === 'role_models_questions') {
    lines.push(`UPDATE ${table} SET ${setClauses} WHERE key = 'question${seqNum}';`);
  } else {
    lines.push(`UPDATE ${table} SET ${setClauses} WHERE sequence_number = ${seqNum};`);
  }

  return lines.join('\n') + '\n';
}

function generateSummaryTemplateUpdate(
  assessmentType: string,
  summaryQuestions: ParsedSummaryQuestion[]
): string {
  if (summaryQuestions.length === 0) return '';

  const en: Record<string, string> = {};
  const kn: Record<string, string> = {};
  const ta: Record<string, string> = {};

  for (const sq of summaryQuestions) {
    const key = `question${sq.questionNumber}`;
    if (sq.en) en[key] = sq.en;
    if (sq.kn) kn[key] = sq.kn;
    if (sq.ta) ta[key] = sq.ta;
  }

  const buildJsonBlock = (obj: Record<string, string>): string => {
    const entries = Object.entries(obj)
      .map(([k, v]) => `    ${dollarQuote(k)}: ${dollarQuote(v)}`)
      .join(',\n');
    return `{\n${entries}\n  }`;
  };

  let jsonb = `jsonb_build_object(\n`;
  const parts: string[] = [];
  if (Object.keys(en).length > 0) parts.push(`  'en', '${JSON.stringify(en).replace(/'/g, "''")}'::jsonb`);
  if (Object.keys(kn).length > 0) parts.push(`  'kn', '${JSON.stringify(kn).replace(/'/g, "''")}'::jsonb`);
  if (Object.keys(ta).length > 0) parts.push(`  'ta', '${JSON.stringify(ta).replace(/'/g, "''")}'::jsonb`);
  jsonb += parts.join(',\n');
  jsonb += `\n)`;

  return `UPDATE assessment_summary_templates
SET summary_questions = ${jsonb},
    updated_at = NOW()
WHERE assessment_type = '${assessmentType}';\n`;
}

// ── Main ───────────────────────────────────────────────────────────────────────

const buf = readFileSync(resolve(__dirname, '..', 'Updated_Qns.xlsx'));
const wb = XLSX.read(buf);

const parsedSheets: ParsedSheet[] = [];

for (const sheetName of wb.SheetNames) {
  const assessmentType = SHEET_MAP[sheetName];
  if (!assessmentType) {
    console.log(`Skipping unknown sheet: ${sheetName}`);
    continue;
  }

  console.log(`\nParsing: ${sheetName} → ${assessmentType}`);
  const ws = wb.Sheets[sheetName];
  const parsed = parseSheet(ws, sheetName, assessmentType);
  parsedSheets.push(parsed);

  console.log(`  Main questions: ${parsed.mainQuestions.length}`);
  console.log(`  Summary questions: ${parsed.summaryQuestions.length}`);
  if (parsed.checkboxOptions) console.log(`  Checkbox options: ${parsed.checkboxOptions.length}`);
  if (parsed.tableHeadings) console.log(`  Table headings: ${parsed.tableHeadings.length}`);
}

// Output parsed JSON for verification
writeFileSync(
  resolve(__dirname, '..', 'tmp', 'parsed_questions.json'),
  JSON.stringify(parsedSheets, null, 2),
  'utf-8'
);
console.log('\nParsed JSON saved to tmp/parsed_questions.json');

// Generate SQL migration
const timestamp = '20260308000001';
const migrationPath = resolve(__dirname, '..', 'supabase', 'migrations', `${timestamp}_update_assessment_questions_from_excel.sql`);

let sql = '';
sql += '-- Migration: Update assessment questions from Updated_Qns.xlsx\n';
sql += `-- Generated: ${new Date().toISOString()}\n`;
sql += '-- Assessments updated:\n';
for (const sheet of parsedSheets) {
  sql += `--   ${sheet.assessmentType}: ${sheet.mainQuestions.length} main questions, ${sheet.summaryQuestions.length} summary questions\n`;
}
sql += '--\n';
sql += '-- This migration uses UPSERT (INSERT ... ON CONFLICT DO UPDATE) for translations\n';
sql += '-- and UPDATE for base question tables. Safe to run multiple times.\n\n';
sql += 'BEGIN;\n\n';

for (const sheet of parsedSheets) {
  const { assessmentType, mainQuestions, summaryQuestions, checkboxOptions, tableHeadings } = sheet;
  const rt = RESOURCE_TYPES[assessmentType];
  const baseTable = BASE_TABLES[assessmentType];

  sql += `-- ${'='.repeat(76)}\n`;
  sql += `-- ${assessmentType.toUpperCase()} (${sheet.sheetName})\n`;
  sql += `-- ${mainQuestions.length} main questions, ${summaryQuestions.length} summary questions\n`;
  sql += `-- ${'='.repeat(76)}\n\n`;

  // ── Main questions ─────────────────────────────────────────────────────

  sql += `-- Main questions: base table updates (English) + translations (Kannada, Tamil)\n\n`;

  // For role_models, include table headings as questions 2-4 in the DB
  let dbQuestionNum = 0;

  if (assessmentType === 'role_models' && tableHeadings && tableHeadings.length > 0) {
    // Question 1 = intro question (first mainQuestion)
    // Questions 2-4 = table headings for RM1, RM2, RM3
    // Questions 5+ = the remaining numbered questions

    // First question
    if (mainQuestions.length > 0) {
      dbQuestionNum = 1;
      const q = mainQuestions[0];
      sql += generateBaseTableUpdate(baseTable, assessmentType, dbQuestionNum, q.en, q.enHelp);
      if (q.kn) sql += generateTranslationUpsert(rt.question, `question${dbQuestionNum}`, 'kn', q.kn);
      if (q.ta) sql += generateTranslationUpsert(rt.question, `question${dbQuestionNum}`, 'ta', q.ta);
      if (q.knHelp) sql += generateTranslationUpsert(rt.help, `question${dbQuestionNum}`, 'kn', q.knHelp);
      if (q.taHelp) sql += generateTranslationUpsert(rt.help, `question${dbQuestionNum}`, 'ta', q.taHelp);
      sql += '\n';
    }

    // Table headings → questions 2, 3, 4
    for (const th of tableHeadings) {
      dbQuestionNum++;
      sql += generateBaseTableUpdate(baseTable, assessmentType, dbQuestionNum, th.en, th.enHelp);
      if (th.kn) sql += generateTranslationUpsert(rt.question, `question${dbQuestionNum}`, 'kn', th.kn);
      if (th.ta) sql += generateTranslationUpsert(rt.question, `question${dbQuestionNum}`, 'ta', th.ta);
      if (th.knHelp) sql += generateTranslationUpsert(rt.help, `question${dbQuestionNum}`, 'kn', th.knHelp);
      if (th.taHelp) sql += generateTranslationUpsert(rt.help, `question${dbQuestionNum}`, 'ta', th.taHelp);
      sql += '\n';
    }

    // Remaining questions → 5, 6, 7, ...
    for (let i = 1; i < mainQuestions.length; i++) {
      dbQuestionNum++;
      const q = mainQuestions[i];
      sql += generateBaseTableUpdate(baseTable, assessmentType, dbQuestionNum, q.en, q.enHelp);
      if (q.kn) sql += generateTranslationUpsert(rt.question, `question${dbQuestionNum}`, 'kn', q.kn);
      if (q.ta) sql += generateTranslationUpsert(rt.question, `question${dbQuestionNum}`, 'ta', q.ta);
      if (q.knHelp) sql += generateTranslationUpsert(rt.help, `question${dbQuestionNum}`, 'kn', q.knHelp);
      if (q.taHelp) sql += generateTranslationUpsert(rt.help, `question${dbQuestionNum}`, 'ta', q.taHelp);
      sql += '\n';
    }
  } else {
    // Standard question numbering
    for (const q of mainQuestions) {
      dbQuestionNum++;
      const resourceKey = `question${dbQuestionNum}`;

      sql += generateBaseTableUpdate(baseTable, assessmentType, dbQuestionNum, q.en, q.enHelp);

      if (q.kn) sql += generateTranslationUpsert(rt.question, resourceKey, 'kn', q.kn);
      if (q.ta) sql += generateTranslationUpsert(rt.question, resourceKey, 'ta', q.ta);
      if (q.knHelp) sql += generateTranslationUpsert(rt.help, resourceKey, 'kn', q.knHelp);
      if (q.taHelp) sql += generateTranslationUpsert(rt.help, resourceKey, 'ta', q.taHelp);
      sql += '\n';
    }
  }

  // ── Checkbox options (school_learning Q11) ────────────────────────────

  if (checkboxOptions && checkboxOptions.length > 0) {
    sql += `-- Checkbox options for Q11\n\n`;
    for (const opt of checkboxOptions) {
      if (opt.kn) sql += generateTranslationUpsert('school_learning_option', opt.key, 'kn', opt.kn);
      if (opt.ta) sql += generateTranslationUpsert('school_learning_option', opt.key, 'ta', opt.ta);
      // Update base table option text (English)
      sql += `UPDATE school_learning_options SET option_text = ${dollarQuote(opt.en)} WHERE option_value = ${dollarQuote(opt.key)};\n`;
    }
    sql += '\n';
  }

  // ── Summary questions ──────────────────────────────────────────────────

  if (summaryQuestions.length > 0) {
    sql += `-- Summary questions (assessment_summary_templates JSONB)\n\n`;
    sql += generateSummaryTemplateUpdate(assessmentType, summaryQuestions);

    // Also update summary question translations in content_translations
    const summaryResourceType = `${assessmentType}_summary_question`;
    for (const sq of summaryQuestions) {
      const resourceKey = `question${sq.questionNumber}`;
      if (sq.kn) sql += generateTranslationUpsert(summaryResourceType, resourceKey, 'kn', sq.kn);
      if (sq.ta) sql += generateTranslationUpsert(summaryResourceType, resourceKey, 'ta', sq.ta);
      if (sq.en) sql += generateTranslationUpsert(summaryResourceType, resourceKey, 'en', sq.en);
    }
    sql += '\n';
  }
}

sql += 'COMMIT;\n';

writeFileSync(migrationPath, sql, 'utf-8');
console.log(`\nMigration SQL saved to: supabase/migrations/${timestamp}_update_assessment_questions_from_excel.sql`);
console.log(`Total size: ${(sql.length / 1024).toFixed(1)} KB`);
