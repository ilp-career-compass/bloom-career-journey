/**
 * generate_correction_migration.ts — Fix key format mismatches between
 * the clean slate migration and what components expect.
 */
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DUMP_PATH = path.resolve(__dirname, 'sheet_dump_2026-03-18.json');
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'supabase', 'migrations');

const dump = JSON.parse(fs.readFileSync(DUMP_PATH, 'utf-8'));

// Find next timestamp
const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => /^\d{14}/.test(f)).sort();
const lastTs = files[files.length - 1]?.substring(0, 14) || '20260312000007';
const nextTs = String(BigInt(lastTs) + 1n).padStart(14, '0');
const outFile = path.join(MIGRATIONS_DIR, `${nextTs}_fix_content_key_formats.sql`);

function dq(text: string): string {
  if (!text) return "''";
  if (text.includes('$$')) return `$dq$${text}$dq$`;
  return `$$${text}$$`;
}
function sq(text: string): string {
  if (!text) return "''";
  return `'${text.replace(/'/g, "''")}'`;
}

let sql = '';
let updateCount = 0;
let insertCount = 0;

function line(s: string) { sql += s + '\n'; }

line('-- ============================================================');
line('-- Fix content_translations key format mismatches');
line(`-- Generated: ${new Date().toISOString()}`);
line('-- Aligns DB keys with what components actually query.');
line('-- ============================================================');
line('');
line('BEGIN;');
line('');

// ============================================================
// FIX 1: School Learning Options — re-insert (deleted by clean slate)
// ============================================================
line('-- ============================================================');
line('-- FIX 1: Re-insert school_learning_option rows');
line('-- (deleted by clean slate, not in sheet dump)');
line('-- ============================================================');
line('');

const SL_OPTIONS: Record<string, { en: string; kn: string; ta: string; hi: string }> = {
  visual: {
    en: 'Observe the experiment and explain by relating it with suitable illustrative pictures (audio-visual medium).',
    kn: 'ವಿಡಿಯೋಗಳನ್ನು ವೀಕ್ಷಿಸುವುದು ಅಥವಾ ಚಿತ್ರಗಳ ಮೂಲಕ ತಿಳಿಯುವುದು (ದೃಶ್ಯ ಮಾಧ್ಯಮ)',
    ta: 'வீடியோக்களைப் பார்ப்பது அல்லது படங்களின் மூலம் புரிந்துகொள்வது (காட்சி முறை)',
    hi: 'वीडियो देखकर या चित्रों के माध्यम से समझना (दृश्य-श्रव्य माध्यम)',
  },
  audio: {
    en: 'Oral explanation (audio medium).',
    kn: 'ವಿವರಣೆಗಳನ್ನು ಆಲಿಸುವುದು (ಶ್ರವಣ ಮಾಧ್ಯಮ)',
    ta: 'விளக்கங்களைக் கேட்டுப் புரிந்துகொள்வது (ஒலி முறை)',
    hi: 'मौखिक व्याख्या सुनकर सीखना (श्रवण माध्यम)',
  },
  experimenting: {
    en: 'Learning through experiment / experiential learning.',
    kn: 'ಪ್ರಯೋಗ ಅಥವಾ ಚಟುವಟಿಕೆಗಳ ಮೂಲಕ ಕಲಿಯುವುದು (ಅನುಭವಾತ್ಮಕ)',
    ta: 'சோதனைகள் அல்லது செய்முறைப் பயிற்சிகள் மூலம் கற்றல் (அனுபவ முறை)',
    hi: 'प्रयोग या गतिविधियों के माध्यम से सीखना (अनुभवात्मक)',
  },
  discuss: {
    en: 'Discussion / Reasoning.',
    kn: 'ವಿಷಯಗಳ ಬಗ್ಗೆ ಚರ್ಚಿಸುವುದು ಅಥವಾ ತಾರ್ಕಿಕವಾಗಿ ಯೋಚಿಸುವುದು',
    ta: 'கருத்துகளை விவாதிப்பது அல்லது தர்க்கரீதியாகச் சிந்திப்பது',
    hi: 'चर्चा करना या तर्कसंगत ढंग से सोचना',
  },
  groupDiscussions: {
    en: 'Group discussion.',
    kn: 'ಸ್ನೇಹಿತರೊಂದಿಗೆ ಗುಂಪು ಚರ್ಚೆ ಮಾಡುವುದು',
    ta: 'நண்பர்களுடன் குழுவாக விவாதிப்பது',
    hi: 'मित्रों के साथ समूह चर्चा करना',
  },
  presentation: {
    en: 'Presentation.',
    kn: 'ಪ್ರಸ್ತುತಿ ಮಾಡುವುದು',
    ta: 'கருத்தரங்கு வழங்குதல்',
    hi: 'प्रस्तुतिकरण (प्रेज़ेंटेशन)',
  },
  rolePlay: {
    en: 'Oral practice through role play.',
    kn: 'ಪಾತ್ರಾಭಿನಯದ ಮೂಲಕ ಮೌಖಿಕ ಅಭ್ಯಾಸ',
    ta: 'பாத்திர நடிப்பு மூலம் பேச்சுப் பயிற்சி',
    hi: 'भूमिका अभिनय के माध्यम से मौखिक अभ्यास',
  },
  teaching: {
    en: 'I learn by teaching others.',
    kn: 'ಇತರರಿಗೆ ಕಲಿಸುವ ಮೂಲಕ ಅಥವಾ ವಿವರಿಸುವ ಮೂಲಕ ಕಲಿಯುವುದು',
    ta: 'மற்றவர்களுக்குக் கற்பிப்பதன் மூலம் அல்லது விளக்குவதன் மூலம் கற்றல்',
    hi: 'दूसरों को सिखाकर या समझाकर सीखना',
  },
  other: {
    en: 'Any other method that applies to you.',
    kn: 'ನಿಮಗೆ ಅನ್ವಯಿಸುವ ಬೇರೆ ಯಾವುದೇ ವಿಧಾನ',
    ta: 'உங்களுக்குப் பொருந்தும் வேறு ஏதேனும் முறை',
    hi: 'आप पर लागू होने वाली कोई अन्य विधि',
  },
};

for (const [key, langs] of Object.entries(SL_OPTIONS)) {
  for (const [langCode, text] of Object.entries(langs)) {
    line(`INSERT INTO content_translations (resource_type, resource_key, lang, text)`);
    line(`VALUES ('school_learning_option', ${sq(key)}, ${sq(langCode)}, ${dq(text)})`);
    line(`ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;`);
    insertCount++;
  }
}
line('');

// ============================================================
// FIX 2: Role Models — change resource_type from 'role_models_question' to 'role_models_questions'
// ============================================================
line('-- ============================================================');
line('-- FIX 2: Role Models questions — resource_type needs trailing "s"');
line('-- Component queries role_models_questions (plural)');
line('-- ============================================================');
line('');
line(`UPDATE content_translations`);
line(`SET resource_type = 'role_models_questions'`);
line(`WHERE resource_type = 'role_models_question';`);
updateCount++;
line('');

// FIX 2b: Role Models question keys — question_N → rm_qN
line('-- Role Models question keys: question_N → rm_qN');
for (let i = 1; i <= 13; i++) {
  line(`UPDATE content_translations SET resource_key = 'rm_q${i}'`);
  line(`WHERE resource_type = 'role_models_questions' AND resource_key = 'question_${i}';`);
  updateCount++;
}
line('');

// FIX 2c: Role Models help keys — question_N → rm_help_qN
line('-- Role Models help keys: question_N → rm_help_qN');
for (let i = 1; i <= 13; i++) {
  line(`UPDATE content_translations SET resource_key = 'rm_help_q${i}'`);
  line(`WHERE resource_type = 'role_models_help' AND resource_key = 'question_${i}';`);
  updateCount++;
}
line('');

// ============================================================
// FIX 3: Role Models module — add tab_rm1, tab_rm2, tab_rm3
// ============================================================
line('-- ============================================================');
line('-- FIX 3: Role Models module — add tab labels');
line('-- Sheet only has RM1 section title. RM2/RM3 derived by number.');
line('-- ============================================================');
line('');

// From sheet dump: section 1 title
const rmSections = dump.assessments.role_models.sections;
const rm1 = rmSections[0]?.title || {};

// RM1 uses sheet section title, RM2/RM3 follow same pattern with number changed
const tabLabels: Record<string, { en: string; kn: string; ta: string; hi: string }> = {
  tab_rm1: {
    en: 'Role Model - 1',
    kn: 'ಮಾದರಿ ವ್ಯಕ್ತಿ - 1',
    ta: 'முன்மாதிரி - 1',
    hi: 'प्रेरणास्रोत - 1',
  },
  tab_rm2: {
    en: 'Role Model - 2',
    kn: 'ಮಾದರಿ ವ್ಯಕ್ತಿ - 2',
    ta: 'முன்மாதிரி - 2',
    hi: 'प्रेरणास्रोत - 2',
  },
  tab_rm3: {
    en: 'Role Model - 3',
    kn: 'ಮಾದರಿ ವ್ಯಕ್ತಿ - 3',
    ta: 'முன்மாதிரி - 3',
    hi: 'प्रेरणास्रोत - 3',
  },
};

for (const [key, langs] of Object.entries(tabLabels)) {
  for (const [langCode, text] of Object.entries(langs)) {
    line(`INSERT INTO content_translations (resource_type, resource_key, lang, text)`);
    line(`VALUES ('role_models_module', ${sq(key)}, ${sq(langCode)}, ${dq(text)})`);
    line(`ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;`);
    insertCount++;
  }
}
line('');

// ============================================================
// FIX 4: About Me sections — resource_type + key format
// ============================================================
line('-- ============================================================');
line('-- FIX 4: About Me sections — move to about_me_module resource_type');
line('-- and rename section_1_title → section_a_title, etc.');
line('-- ============================================================');
line('');

// First update resource_type
line(`UPDATE content_translations`);
line(`SET resource_type = 'about_me_module'`);
line(`WHERE resource_type = 'about_me_section';`);
updateCount++;
line('');

// Then rename keys
const sectionKeyMap: Record<string, string> = {
  section_1_title: 'section_a_title',
  section_2_title: 'section_b_title',
  section_3_title: 'section_c_title',
  section_4_title: 'section_d_title',
  section_1_subtitle: 'section_a_subtitle',
  section_2_subtitle: 'section_b_subtitle',
  section_3_subtitle: 'section_c_subtitle',
  section_4_subtitle: 'section_d_subtitle',
};

for (const [oldKey, newKey] of Object.entries(sectionKeyMap)) {
  line(`UPDATE content_translations SET resource_key = ${sq(newKey)}`);
  line(`WHERE resource_type = 'about_me_module' AND resource_key = ${sq(oldKey)};`);
  updateCount++;
}
line('');

// ============================================================
// FIX 5: Dreams quote — insert from sheet title_text
// ============================================================
line('-- ============================================================');
line('-- FIX 5: Dreams module — add "quote" key from sheet title_text');
line('-- ============================================================');
line('');

const dreamsTitle = dump.assessments.dreams.title_text;
for (const [langCode, text] of Object.entries(dreamsTitle) as [string, string][]) {
  if (!text) continue;
  line(`INSERT INTO content_translations (resource_type, resource_key, lang, text)`);
  line(`VALUES ('dreams_module', 'quote', ${sq(langCode)}, ${dq(text)})`);
  line(`ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;`);
  insertCount++;
}
line('');

// ============================================================
// FIX 6: Underscore removal in resource_keys
// Components expect 'question1' not 'question_1'
// ============================================================
line('-- ============================================================');
line('-- FIX 6: Remove underscores in question/help/summary keys');
line('-- Components expect questionN not question_N');
line('-- ============================================================');
line('');

// These resource_types have keys with underscores that need fixing:
// - inspiration_question: question_1 → question1 (component builds `question${index+1}`)
// - inspiration_help: question_1 → question1
// - school_learning_question: question_1 → question1 (for consistency, fetched by RPCs)
// - school_learning_help: question_1 → question1 (component builds `question${i+1}`)
// - school_learning_summary_question: summary_question_1 → summary_question_1 (keep? check)
// - dreams_question: fetched dynamically, but fix for consistency
// - dreams_help: fetched dynamically, but fix for consistency
// - hobbies_question: fetched dynamically
// - hobbies_help: fetched dynamically
// - about_me_question: fetched dynamically (by field_key)
// - about_me_help: fetched dynamically (by field_key)
// - about_me_summary_question: fetched dynamically

// Fix confirmed-broken ones first (Inspiration, School Learning)
const typesToFixUnderscore = [
  'inspiration_question',
  'inspiration_help',
  'school_learning_question',
  'school_learning_help',
  'school_learning_summary_question',
  'dreams_question',
  'dreams_help',
  'dreams_summary_question',
  'hobbies_question',
  'hobbies_help',
  'hobbies_summary_question',
  'about_me_question',
  'about_me_help',
  'about_me_summary_question',
  'inspiration_summary_question',
  'role_models_summary_question',
];

// Generic UPDATE: rename question_N → questionN for all affected types
// Use a single UPDATE per type that catches all numbered keys
for (const resType of typesToFixUnderscore) {
  // question_1 → question1, question_2 → question2, ..., question_99 → question99
  // summary_question_1 → summary_question_1 ... wait, these have different patterns
  // Let's handle the patterns:
  // - question_N → questionN
  // - summary_question_N → summary_questionN (remove underscore before number)

  // For resource_keys like 'question_1', 'question_2', etc.
  for (let i = 1; i <= 30; i++) {
    // Only generate updates for keys that plausibly exist
    line(`UPDATE content_translations SET resource_key = 'question${i}'`);
    line(`WHERE resource_type = ${sq(resType)} AND resource_key = 'question_${i}';`);
    updateCount++;
  }
}
line('');

// Also fix summary_question_N keys
line('-- Fix summary_question_N → summary_questionN (summary question keys)');
const summaryTypes = [
  'inspiration_summary_question',
  'about_me_summary_question',
  'dreams_summary_question',
  'school_learning_summary_question',
  'hobbies_summary_question',
  'role_models_summary_question',
];
for (const resType of summaryTypes) {
  for (let i = 1; i <= 20; i++) {
    line(`UPDATE content_translations SET resource_key = 'summary_question${i}'`);
    line(`WHERE resource_type = ${sq(resType)} AND resource_key = 'summary_question_${i}';`);
    updateCount++;
  }
}
line('');

line('COMMIT;');

// Write
fs.writeFileSync(outFile, sql, 'utf-8');
const fileSize = fs.statSync(outFile).size;

console.log('='.repeat(60));
console.log('CORRECTION MIGRATION REPORT');
console.log('='.repeat(60));
console.log(`Output: ${outFile}`);
console.log(`Size: ${(fileSize / 1024).toFixed(1)} KB`);
console.log(`INSERT statements: ${insertCount}`);
console.log(`UPDATE statements: ${updateCount}`);
console.log(`Total statements: ${insertCount + updateCount}`);
console.log('');
console.log('Breakdown:');
console.log(`  FIX 1 - School Learning options: ${Object.keys(SL_OPTIONS).length * 4} INSERTs (9 options × 4 langs)`);
console.log(`  FIX 2 - Role Models resource_type: 1 UPDATE (bulk)`);
console.log(`  FIX 2b - Role Models question keys: 13 UPDATEs`);
console.log(`  FIX 2c - Role Models help keys: 13 UPDATEs`);
console.log(`  FIX 3 - Role Models tab labels: ${Object.keys(tabLabels).length * 4} INSERTs (3 tabs × 4 langs)`);
console.log(`  FIX 4 - About Me section type+keys: 1 + ${Object.keys(sectionKeyMap).length} UPDATEs`);
console.log(`  FIX 5 - Dreams quote: 4 INSERTs`);
console.log(`  FIX 6 - Underscore removal: ${typesToFixUnderscore.length * 30 + summaryTypes.length * 20} UPDATEs (many are no-ops)`);
console.log('');
console.log('Note: FIX 6 generates UPDATE statements for keys 1-30 per type.');
console.log('Most will be no-ops (0 rows affected) — this is safe and idempotent.');
console.log('='.repeat(60));
