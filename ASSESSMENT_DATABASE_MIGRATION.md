# Assessment Database Migration

This document outlines the migration of assessment questions, options, help text, and video links from hardcoded frontend values to a database-driven system.

## Overview

The migration moves all assessment data from the frontend code to the database, allowing for dynamic content management without code changes. This includes:

- Assessment questions and their structure
- Multiple choice options
- Help text for questions
- Video/audio sources
- Assessment metadata

## Database Schema

### New Tables Created

1. **assessment_templates** - Stores assessment metadata
   - `id` (UUID, Primary Key)
   - `assessment_type` (enum: inspiration, dreams, school_learning, role_models, hobbies, personality, career_aptitude)
   - `title` (TEXT)
   - `description` (TEXT)
   - `instructions` (TEXT)
   - `is_active` (BOOLEAN)

2. **assessment_sections** - Organizes questions into sections
   - `id` (UUID, Primary Key)
   - `assessment_template_id` (UUID, Foreign Key)
   - `title` (TEXT)
   - `description` (TEXT)
   - `sequence_number` (INTEGER)

3. **assessment_questions** - Individual questions
   - `id` (UUID, Primary Key)
   - `section_id` (UUID, Foreign Key)
   - `question_text` (TEXT)
   - `question_type` (enum: text, textarea, checkbox, radio, multiple_choice, rating, boolean)
   - `help_text` (TEXT)
   - `is_required` (BOOLEAN)
   - `sequence_number` (INTEGER)

4. **assessment_question_options** - Multiple choice options
   - `id` (UUID, Primary Key)
   - `question_id` (UUID, Foreign Key)
   - `option_text` (TEXT)
   - `option_value` (TEXT)
   - `sequence_number` (INTEGER)

5. **assessment_media_sources** - Videos, audio, and other media
   - `id` (UUID, Primary Key)
   - `assessment_template_id` (UUID, Foreign Key)
   - `media_type` (enum: video, audio, image, document)
   - `title` (TEXT)
   - `url` (TEXT)
   - `description` (TEXT)
   - `thumbnail_url` (TEXT)
   - `duration_seconds` (INTEGER)
   - `sequence_number` (INTEGER)

## API Functions

### Database Functions Created

1. **get_assessment_template(assessment_type)** - Fetches complete assessment structure
2. **get_assessment_media_sources(assessment_type)** - Fetches media sources for an assessment
3. **get_all_assessment_templates()** - Fetches all assessment templates (admin use)
4. **update_assessment_template(template_id, updates)** - Updates assessment template
5. **upsert_media_source(assessment_type, media_data)** - Adds/updates media sources

## Frontend Changes

### New Service: AssessmentService

Created `src/services/assessmentService.ts` with methods:
- `getAssessmentTemplate(assessmentType)` - Fetches assessment structure
- `getMediaSources(assessmentType)` - Fetches media sources
- `getHollandCodeData()` - Specialized method for Holland Code Test
- `getInspirationAssessmentData()` - Specialized method for Inspiration Assessment

### Updated Components

1. **MyInspirationAssessmentDB.tsx** - New database-driven version of Inspiration Assessment
2. **HollandCodeTestDB.tsx** - New database-driven version of Holland Code Test
3. **AssessmentTestPage.tsx** - Test page to verify migration

## Migration Benefits

1. **Dynamic Content Management** - Questions and media can be updated without code changes
2. **Centralized Data** - All assessment data in one place
3. **Version Control** - Database changes can be tracked and rolled back
4. **Scalability** - Easy to add new assessments and questions
5. **Consistency** - Standardized data structure across all assessments

## Data Migrated

### Inspiration Assessment
- 7 reflection questions with help text
- 6 inspirational videos with URLs
- Question structure and validation

### - 42 questions across 6 categories (R, I, A, S, E, C)
- Category labels and descriptions
- Question mapping to categories

### Dreams Assessment
- 16 questions across 2 sections
- Question text and help text
- Section organization

### School Learning Assessment
- 17 questions across 3 sections
- Learning method options (8 choices)
- Question structure and validation

## Usage

### For Developers

1. Use `AssessmentService` to fetch assessment data
2. Replace hardcoded assessment components with database-driven versions
3. Update existing components to use the new service

### For Administrators

1. Update assessment content directly in the database
2. Add new questions through database operations
3. Manage media sources through the API functions

## Testing

1. Run the migration scripts in order:
   - `20250125000000_assessment_data_migration.sql`
   - `20250125000001_assessment_api_functions.sql`

2. Visit `/assessment-test` to verify all data loads correctly

3. Test each assessment component to ensure functionality

## Future Enhancements

1. **Admin Interface** - Create UI for managing assessment content
2. **Versioning** - Track changes to assessment content over time
3. **A/B Testing** - Support multiple versions of questions
4. **Analytics** - Track question performance and completion rates
5. **Localization** - Support multiple languages for questions and help text

## Rollback Plan

If issues arise, the original hardcoded components can be restored by:
1. Reverting to the original component files
2. Removing the new database tables (if needed)
3. Updating imports to use original components

## Files Created/Modified

### New Files
- `supabase/migrations/20250125000000_assessment_data_migration.sql`
- `supabase/migrations/20250125000001_assessment_api_functions.sql`
- `src/services/assessmentService.ts`
- `src/components/assessments/MyInspirationAssessmentDB.tsx`
- `src/components/HollandCodeTestDB.tsx`
- `src/pages/AssessmentTestPage.tsx`
- `ASSESSMENT_DATABASE_MIGRATION.md`

### Modified Files
- None (original components preserved)

## Next Steps

1. **Complete Migration** - Update remaining assessment components
2. **Testing** - Comprehensive testing of all assessments
3. **Documentation** - Update user guides and admin documentation
4. **Training** - Train administrators on new content management system
5. **Monitoring** - Set up monitoring for database performance
