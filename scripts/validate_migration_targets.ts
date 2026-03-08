import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath, override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  console.error('Set them as environment variables or in .env / .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ValidationResult {
  table: string;
  column: string;
  expected: string[];
  found: string[];
  missing: string[];
}

const results: ValidationResult[] = [];
let totalExpected = 0;
let totalFound = 0;
let totalMissing = 0;

async function validateTable(
  table: string,
  column: string,
  expectedValues: string[],
  label: string
): Promise<void> {
  console.log(`\nChecking ${label}...`);
  console.log(`  Table: ${table}, Column: ${column}`);
  console.log(`  Expected rows: ${expectedValues.length}`);

  const { data, error } = await supabase
    .from(table)
    .select(column)
    .in(column, expectedValues);

  if (error) {
    console.error(`  ERROR querying ${table}: ${error.message}`);
    console.error(`  Code: ${error.code}, Details: ${error.details}`);
    results.push({ table, column, expected: expectedValues, found: [], missing: expectedValues });
    totalExpected += expectedValues.length;
    totalMissing += expectedValues.length;
    return;
  }

  const foundValues = (data || []).map((row: any) => String(row[column]));
  const missing = expectedValues.filter(v => !foundValues.includes(v));

  results.push({ table, column, expected: expectedValues, found: foundValues, missing });
  totalExpected += expectedValues.length;
  totalFound += foundValues.length;
  totalMissing += missing.length;

  if (missing.length === 0) {
    console.log(`  ✅ All ${expectedValues.length} rows found`);
  } else {
    console.log(`  ⚠️  Found: ${foundValues.length}/${expectedValues.length}`);
    console.log(`  ❌ Missing ${column} values: ${missing.join(', ')}`);
  }
}

async function validateContentTranslationsTable(): Promise<void> {
  console.log(`\nChecking content_translations table exists...`);

  const { data, error } = await supabase
    .from('content_translations')
    .select('resource_type, resource_key, lang')
    .limit(1);

  if (error) {
    console.error(`  ERROR: ${error.message}`);
    console.error(`  The content_translations table may not exist or is not accessible.`);
    return;
  }
  console.log(`  ✅ Table exists and is accessible`);

  const resourceTypes = [
    'inspiration_question', 'inspiration_help',
    'about_me_question', 'about_me_help',
    'dreams_question', 'dreams_help',
    'school_learning_question', 'school_learning_help',
    'school_learning_option',
    'hobbies_question', 'hobbies_help',
    'role_models_question', 'role_models_help',
  ];

  console.log(`\n  Checking existing resource_type values in content_translations:`);
  for (const rt of resourceTypes) {
    const { count, error: cErr } = await supabase
      .from('content_translations')
      .select('*', { count: 'exact', head: true })
      .eq('resource_type', rt);

    if (cErr) {
      console.log(`    ${rt}: ERROR - ${cErr.message}`);
    } else {
      const status = (count ?? 0) > 0 ? '✅' : '🆕';
      console.log(`    ${status} ${rt}: ${count ?? 0} existing rows (UPSERTs will create/update)`);
    }
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('MIGRATION DRY-RUN VALIDATION');
  console.log('Migration: 20260308000001_update_assessment_questions_from_excel.sql');
  console.log('='.repeat(70));

  // 1. inspiration_questions — sequence_number 1..10
  await validateTable(
    'inspiration_questions',
    'sequence_number',
    Array.from({ length: 10 }, (_, i) => String(i + 1)),
    'inspiration_questions (10 rows, sequence_number 1-10)'
  );

  // 2. about_me_fields — field_key question1..question19
  await validateTable(
    'about_me_fields',
    'field_key',
    Array.from({ length: 19 }, (_, i) => `question${i + 1}`),
    'about_me_fields (19 rows, field_key question1-question19)'
  );

  // 3. dreams_questions — sequence_number 1..18
  await validateTable(
    'dreams_questions',
    'sequence_number',
    Array.from({ length: 18 }, (_, i) => String(i + 1)),
    'dreams_questions (18 rows, sequence_number 1-18)'
  );

  // 4. school_learning_questions — sequence_number 1..21
  await validateTable(
    'school_learning_questions',
    'sequence_number',
    Array.from({ length: 21 }, (_, i) => String(i + 1)),
    'school_learning_questions (21 rows, sequence_number 1-21)'
  );

  // 5. school_learning_options — option_value
  await validateTable(
    'school_learning_options',
    'option_value',
    [
      'visual', 'reading', 'audio', 'experimenting', 'discuss',
      'groupDiscussions', 'writing', 'memorizing', 'teaching', 'other'
    ],
    'school_learning_options (10 checkbox options)'
  );

  // 6. hobbies_questions — sequence_number 1..14
  await validateTable(
    'hobbies_questions',
    'sequence_number',
    Array.from({ length: 14 }, (_, i) => String(i + 1)),
    'hobbies_questions (14 rows, sequence_number 1-14)'
  );

  // 7. role_models_questions — key question1..question19
  await validateTable(
    'role_models_questions',
    'key',
    Array.from({ length: 19 }, (_, i) => `question${i + 1}`),
    'role_models_questions (19 rows, key question1-question19)'
  );

  // 8. assessment_summary_templates — assessment_type
  await validateTable(
    'assessment_summary_templates',
    'assessment_type',
    ['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies'],
    'assessment_summary_templates (5 assessment types)'
  );

  // 9. content_translations — UPSERT target (just verify table & resource types)
  await validateContentTranslationsTable();

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total target rows checked: ${totalExpected}`);
  console.log(`  Found:   ${totalFound}`);
  console.log(`  Missing: ${totalMissing}`);
  console.log();

  if (totalMissing === 0) {
    console.log('✅ ALL target rows exist. Migration is safe to apply.');
  } else {
    console.log('⚠️  Some target rows are MISSING. Review the details above.');
    console.log('   Missing rows will result in UPDATE statements that affect 0 rows.');
    console.log('   The migration will not error, but those questions won\'t be updated.');
  }

  console.log('\nPer-table breakdown:');
  for (const r of results) {
    const icon = r.missing.length === 0 ? '✅' : '❌';
    console.log(`  ${icon} ${r.table} (${r.column}): ${r.found.length}/${r.expected.length} found`);
    if (r.missing.length > 0) {
      console.log(`     Missing: ${r.missing.join(', ')}`);
    }
  }
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
