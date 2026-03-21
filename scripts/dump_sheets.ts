/**
 * dump_sheets.ts — Read all 6 assessment sheet tabs and dump to JSON.
 * No SQL generation. No code modification. Just read and report.
 *
 * Usage: npx tsx scripts/dump_sheets.ts
 *
 * Env: GOOGLE_SERVICE_ACCOUNT_JSON (raw JSON string), GOOGLE_SHEET_ID
 */
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SA_JSON = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);

interface LangText {
  kn: string;
  ta: string;
  en: string;
  hi: string;
}

interface Question {
  sno: number;
  section: string;
  question: LangText;
  help_text: LangText;
  input_type: string;
  display_type: string;
  remark: string;
}

interface SectionInfo {
  title: LangText;
  subtitle: LangText;
}

interface SummaryQuestion {
  sno: number;
  question: LangText;
  input_type: string;
  display_type: string;
  remark: string;
}

interface SubHeader {
  row_index: number;
  section: string;
  text: LangText;
  type: 'section_title' | 'section_subtitle';
}

interface AssessmentDump {
  tab_name: string;
  assessment_type: string;
  module_title: LangText;
  title_text: LangText;
  subtitle_text: LangText;
  question_header: string[];
  sections: SectionInfo[];
  sub_headers: SubHeader[];
  questions: Question[];
  summary: {
    title: LangText;
    subtitle: LangText;
    header: string[];
    questions: SummaryQuestion[];
  };
  empty_cells: { location: string; field: string; lang: string }[];
}

const TABS: { tab: string; type: string }[] = [
  { tab: '9.1_My Inspiration', type: 'inspiration' },
  { tab: '9.2_About Me', type: 'about_me' },
  { tab: '9.3_My Dreams', type: 'dreams' },
  { tab: '9.4_My School, Learnings and I', type: 'school_learning' },
  { tab: '9.5_My Talents and Hobbies', type: 'hobbies' },
  { tab: '9.6_My Role Models', type: 'role_models' },
];

function cell(row: any[], idx: number): string {
  return (row?.[idx] || '').toString().trim();
}

function langFromModuleRow(row: any[]): LangText {
  // Module header rows: A=label, B=kn, C=ta, D=en, E=hi
  return { kn: cell(row, 1), ta: cell(row, 2), en: cell(row, 3), hi: cell(row, 4) };
}

function langFromQuestionRow(row: any[]): { question: LangText; help: LangText } {
  // Question rows: B=kn_q, C=kn_help, D=ta_q, E=ta_help, F=en_q, G=en_help, H=hi_q, I=hi_help
  return {
    question: { kn: cell(row, 1), ta: cell(row, 3), en: cell(row, 5), hi: cell(row, 7) },
    help: { kn: cell(row, 2), ta: cell(row, 4), en: cell(row, 6), hi: cell(row, 8) },
  };
}

function langFromSectionTitleRow(row: any[]): LangText {
  // Section title rows: B=kn, D=ta, F=en, H=hi (skip help text cols)
  return { kn: cell(row, 1), ta: cell(row, 3), en: cell(row, 5), hi: cell(row, 7) };
}

function langFromSummaryRow(row: any[], isAboutMe: boolean): LangText {
  // Summary rows: B=kn, C=ta, D=en, E=hi
  // Exception: About Me summary has C=en, D=ta (swapped)
  if (isAboutMe) {
    return { kn: cell(row, 1), ta: cell(row, 3), en: cell(row, 2), hi: cell(row, 4) };
  }
  return { kn: cell(row, 1), ta: cell(row, 2), en: cell(row, 3), hi: cell(row, 4) };
}

function parseTab(tabName: string, assessmentType: string, rows: any[][]): AssessmentDump {
  const isAboutMe = assessmentType === 'about_me';
  const emptyCells: { location: string; field: string; lang: string }[] = [];

  // Helper to flag empty cells in a LangText
  function flagEmpty(lt: LangText, location: string, field: string) {
    for (const lang of ['kn', 'ta', 'en', 'hi'] as const) {
      if (!lt[lang]) {
        emptyCells.push({ location, field, lang });
      }
    }
  }

  // Rows 2-4 (0-indexed: 1-3): module title, title text, subtitle text
  const moduleTitle = langFromModuleRow(rows[1] || []);
  const titleText = langFromModuleRow(rows[2] || []);
  const subtitleText = langFromModuleRow(rows[3] || []);
  flagEmpty(moduleTitle, 'Row 2', 'module_title');
  flagEmpty(titleText, 'Row 3', 'title_text');
  // subtitle can legitimately be empty
  if (subtitleText.en) flagEmpty(subtitleText, 'Row 4', 'subtitle_text');

  // Row 6 (0-indexed: 5): question header
  const questionHeader = (rows[5] || []).map((c: any) => (c || '').toString().trim());

  // Parse question rows starting at row 7 (0-indexed: 6)
  const sections: SectionInfo[] = [];
  const subHeaders: SubHeader[] = [];
  const questions: Question[] = [];
  let currentSection = '';
  let currentSectionSubtitle: LangText = { kn: '', ta: '', en: '', hi: '' };
  let summaryStartIdx = -1;

  for (let i = 6; i < rows.length; i++) {
    const row = rows[i] || [];
    const colA = cell(row, 0);

    // Detect summary marker
    if (colA.toLowerCase() === 'summary') {
      summaryStartIdx = i;
      break;
    }

    // Empty row — skip
    if (row.length === 0 || (row.length === 1 && !colA)) continue;

    if (colA === 'Section Title') {
      const titleLang = langFromSectionTitleRow(row);
      currentSection = titleLang.en || titleLang.kn || `Section_${sections.length + 1}`;
      currentSectionSubtitle = { kn: '', ta: '', en: '', hi: '' };
      subHeaders.push({
        row_index: i + 1,
        section: currentSection,
        text: titleLang,
        type: 'section_title',
      });
      flagEmpty(titleLang, `Row ${i + 1}`, `section_title [${currentSection}]`);
      continue;
    }

    if (colA === 'Section Subtitle') {
      currentSectionSubtitle = langFromSectionTitleRow(row);
      subHeaders.push({
        row_index: i + 1,
        section: currentSection,
        text: currentSectionSubtitle,
        type: 'section_subtitle',
      });
      // Push section with both title and subtitle
      // Find last section title sub_header
      const lastTitleSH = subHeaders.filter(s => s.type === 'section_title').slice(-1)[0];
      sections.push({
        title: lastTitleSH?.text || { kn: '', ta: '', en: '', hi: '' },
        subtitle: currentSectionSubtitle,
      });
      continue;
    }

    // Numbered question row
    const sno = parseInt(colA);
    if (!isNaN(sno)) {
      const { question, help } = langFromQuestionRow(row);
      const inputType = cell(row, 9);
      const displayType = cell(row, 10);
      const remark = cell(row, 11);

      questions.push({
        sno,
        section: currentSection,
        question,
        help_text: help,
        input_type: inputType,
        display_type: displayType,
        remark,
      });
      flagEmpty(question, `Row ${i + 1} Q${sno}`, 'question');
      // Help text can legitimately be empty, but flag Hindi specifically
      if (!help.hi && (help.en || help.kn || help.ta)) {
        emptyCells.push({ location: `Row ${i + 1} Q${sno}`, field: 'help_text', lang: 'hi' });
      }
    }
  }

  // Handle case where Section Title found but no Section Subtitle row followed
  // (some tabs have Section Subtitle row but empty)
  const titlesInSubHeaders = subHeaders.filter(s => s.type === 'section_title').length;
  if (titlesInSubHeaders > sections.length) {
    // There's a section title without a subtitle row — add it
    const lastTitle = subHeaders.filter(s => s.type === 'section_title').slice(-1)[0];
    if (lastTitle && !sections.find(s => s.title.en === lastTitle.text.en)) {
      sections.push({
        title: lastTitle.text,
        subtitle: { kn: '', ta: '', en: '', hi: '' },
      });
    }
  }

  // Parse summary section
  const summaryTitle: LangText = { kn: '', ta: '', en: '', hi: '' };
  const summarySubtitle: LangText = { kn: '', ta: '', en: '', hi: '' };
  const summaryQuestions: SummaryQuestion[] = [];
  let summaryHeader: string[] = [];

  if (summaryStartIdx >= 0) {
    // Summary header row is summaryStartIdx + 1
    const hdrRow = rows[summaryStartIdx + 1] || [];
    summaryHeader = hdrRow.map((c: any) => (c || '').toString().trim());

    // Parse rows after header
    for (let i = summaryStartIdx + 2; i < rows.length; i++) {
      const row = rows[i] || [];
      const colA = cell(row, 0);

      if (row.length === 0) continue;

      if (colA === 'Title') {
        const lt = langFromSummaryRow(row, isAboutMe);
        Object.assign(summaryTitle, lt);
        flagEmpty(lt, `Row ${i + 1}`, 'summary_title');
        continue;
      }

      if (colA === 'Subtitle' || colA === 'Sutbtitle') {
        const lt = langFromSummaryRow(row, isAboutMe);
        Object.assign(summarySubtitle, lt);
        if (lt.en) flagEmpty(lt, `Row ${i + 1}`, 'summary_subtitle');
        continue;
      }

      const sno = parseInt(colA);
      if (!isNaN(sno)) {
        const lt = langFromSummaryRow(row, isAboutMe);
        summaryQuestions.push({
          sno,
          question: lt,
          input_type: cell(row, 5),
          display_type: cell(row, 6),
          remark: cell(row, 7) || '',
        });
        flagEmpty(lt, `Row ${i + 1} SQ${sno}`, 'summary_question');
      }
    }
  }

  return {
    tab_name: tabName,
    assessment_type: assessmentType,
    module_title: moduleTitle,
    title_text: titleText,
    subtitle_text: subtitleText,
    question_header: questionHeader,
    sections,
    sub_headers: subHeaders,
    questions,
    summary: {
      title: summaryTitle,
      subtitle: summarySubtitle,
      header: summaryHeader,
      questions: summaryQuestions,
    },
    empty_cells: emptyCells,
  };
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: SA_JSON,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const results: Record<string, AssessmentDump> = {};
  let allSuccess = true;

  for (const { tab, type } of TABS) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${tab}'!A1:L200`,
      });
      const rows = res.data.values || [];
      results[type] = parseTab(tab, type, rows);
    } catch (err: any) {
      console.error(`FAILED to read tab "${tab}": ${err.message}`);
      allSuccess = false;
    }
  }

  if (!allSuccess || Object.keys(results).length < 6) {
    console.error(`\nERROR: Only ${Object.keys(results).length}/6 tabs read. Aborting.`);
    process.exit(1);
  }

  // Check About Me summary column swap by inspecting actual data
  const aboutMe = results['about_me'];
  if (aboutMe) {
    const st = aboutMe.summary.title;
    // Verify: kn should contain Kannada chars, en should contain English
    const hasKannadaInKn = /[\u0C80-\u0CFF]/.test(st.kn);
    const hasEnglishInEn = /[a-zA-Z]/.test(st.en);
    const hasTamilInTa = /[\u0B80-\u0BFF]/.test(st.ta);
    if (!hasKannadaInKn || !hasEnglishInEn || !hasTamilInTa) {
      console.warn(`\nWARNING: About Me summary column swap detection may be wrong!`);
      console.warn(`  kn="${st.kn.substring(0, 40)}" hasKannada=${hasKannadaInKn}`);
      console.warn(`  en="${st.en.substring(0, 40)}" hasEnglish=${hasEnglishInEn}`);
      console.warn(`  ta="${st.ta.substring(0, 40)}" hasTamil=${hasTamilInTa}`);
    }
  }

  // Save
  const today = new Date().toISOString().split('T')[0];
  const outPath = path.resolve(__dirname, `sheet_dump_${today}.json`);
  const dump = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    sheet_id: SHEET_ID,
    assessments: results,
  };
  fs.writeFileSync(outPath, JSON.stringify(dump, null, 2), 'utf-8');
  const fileSize = fs.statSync(outPath).size;

  // Report
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SHEET DUMP REPORT — ${today}`);
  console.log('='.repeat(60));
  console.log(`File: ${outPath}`);
  console.log(`Size: ${(fileSize / 1024).toFixed(1)} KB`);

  let totalEmpty = 0;
  for (const { type } of TABS) {
    const a = results[type];
    const hindiEmpty = a.empty_cells.filter(e => e.lang === 'hi').length;
    const otherEmpty = a.empty_cells.filter(e => e.lang !== 'hi').length;
    totalEmpty += a.empty_cells.length;

    console.log(`\n--- ${a.tab_name} (${type}) ---`);
    console.log(`  Sections: ${a.sections.length}`);
    console.log(`  Questions: ${a.questions.length}`);
    console.log(`  Summary questions: ${a.summary.questions.length}`);
    console.log(`  Summary title: ${a.summary.title.en || '(empty)'}`);
    console.log(`  Summary subtitle: ${a.summary.subtitle.en || '(none)'}`);
    console.log(`  Empty cells: ${a.empty_cells.length} (Hindi: ${hindiEmpty}, Other: ${otherEmpty})`);

    if (otherEmpty > 0) {
      console.log(`  ⚠ Non-Hindi empty cells:`);
      for (const e of a.empty_cells.filter(e => e.lang !== 'hi')) {
        console.log(`    ${e.location} | ${e.field} | ${e.lang}`);
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TOTALS`);
  console.log(`  Assessments: ${Object.keys(results).length}`);
  console.log(`  Total questions: ${Object.values(results).reduce((s, a) => s + a.questions.length, 0)}`);
  console.log(`  Total summary questions: ${Object.values(results).reduce((s, a) => s + a.summary.questions.length, 0)}`);
  console.log(`  Total sections: ${Object.values(results).reduce((s, a) => s + a.sections.length, 0)}`);
  console.log(`  Total empty cells: ${totalEmpty}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
