// Assessment Unlock Utility
// Checks if an assessment is unlocked based on prerequisite completion

import { supabase } from '@/integrations/supabase/client';

export type AssessmentType =
  | 'inspiration'
  | 'about_me'
  | 'dreams'
  | 'school_learning'
  | 'hobbies'
  | 'role_models'
  | 'holland_code'
  | 'career_guidance_tools';

interface UnlockCheckResult {
  isUnlocked: boolean;
  missingPrerequisites: string[];
}

/**
 * Get the required prerequisites for an assessment
 */
export function getRequiredPrerequisites(assessmentType: AssessmentType): AssessmentType[] {
  switch (assessmentType) {
    case 'inspiration':
      return []; // Always unlocked
    case 'about_me':
      return ['inspiration'];
    case 'dreams':
      return ['inspiration', 'about_me'];
    case 'school_learning':
      return ['inspiration', 'about_me', 'dreams'];
    case 'hobbies':
      return ['inspiration', 'about_me', 'dreams', 'school_learning'];
    case 'role_models':
      return ['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies'];
    case 'holland_code':
      return ['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'];
    case 'career_guidance_tools':
      return ['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models', 'holland_code'];
    default:
      return [];
  }
}

/**
 * Get assessment title for display
 */
export function getAssessmentTitle(assessmentType: AssessmentType): string {
  const titles: Record<AssessmentType, string> = {
    inspiration: 'My Inspiration',
    about_me: 'About Me',
    dreams: 'My Dreams',
    school_learning: 'My School, My Learning and I',
    hobbies: 'My Talents and Hobbies',
    role_models: 'My Role Models',
    holland_code: 'Holland Code (RIASEC) Test',
    career_guidance_tools: 'Exploring Career Guidance Tools'
  };
  return titles[assessmentType] || assessmentType;
}

/**
 * Get assessment type from database assessment_type value
 */
export function getAssessmentTypeFromDB(assessmentType: string): AssessmentType | null {
  const mapping: Record<string, AssessmentType> = {
    'inspiration': 'inspiration',
    'about_me': 'about_me',
    'dreams': 'dreams',
    'school_learning': 'school_learning',
    'hobbies': 'hobbies',
    'role_models': 'role_models',
    'personality': 'holland_code', // Holland Code uses 'personality' in DB
    'career_guidance_tools': 'career_guidance_tools'
  };
  return mapping[assessmentType] || null;
}

/**
 * Check if an assessment is unlocked for a student
 */
// Check if an assessment is unlocked for a student
export async function checkAssessmentUnlock(
  studentId: string,
  assessmentType: AssessmentType
): Promise<UnlockCheckResult> {
  // TESTING: Temporarily unlock all assessments based on user request
  return {
    isUnlocked: true,
    missingPrerequisites: []
  };

  /* Original Logic:
  // Inspiration is always unlocked
  if (assessmentType === 'inspiration') {
    return {
      isUnlocked: true,
      missingPrerequisites: []
    };
  }

  // Get required prerequisites
  const prerequisites = getRequiredPrerequisites(assessmentType);
  if (prerequisites.length === 0) {
    return {
      isUnlocked: true,
      missingPrerequisites: []
    };
  }

  // Map assessment types to database values
  const dbTypeMapping: Record<AssessmentType, { type: string; title: string }> = {
    inspiration: { type: 'inspiration', title: 'My Inspiration' },
    about_me: { type: 'about_me', title: 'About Me' },
    dreams: { type: 'dreams', title: 'My Dreams' },
    school_learning: { type: 'school_learning', title: 'My School, My Learning and I' },
    hobbies: { type: 'hobbies', title: 'My Talents and Hobbies' },
    role_models: { type: 'role_models', title: 'My Role Models' },
    holland_code: { type: 'personality', title: 'Holland Code (RIASEC) Test' },
    career_guidance_tools: { type: 'career_guidance_tools', title: 'Exploring Career Guidance Tools' }
  };

  // Check each prerequisite
  const missingPrerequisites: string[] = [];

  for (const prereq of prerequisites) {
    const dbMapping = dbTypeMapping[prereq];
    if (!dbMapping) continue;

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('completed_at')
        .eq('student_id', studentId)
        .eq('assessment_type', dbMapping.type)
        .eq('assessment_title', dbMapping.title)
        .not('completed_at', 'is', null)
        .maybeSingle();

      if (error || !data || !data.completed_at) {
        missingPrerequisites.push(getAssessmentTitle(prereq));
      }
    } catch (error) {
      console.error(`Error checking prerequisite ${prereq}:`, error);
      missingPrerequisites.push(getAssessmentTitle(prereq));
    }
  }

  return {
    isUnlocked: missingPrerequisites.length === 0,
    missingPrerequisites
  };
  */
}

