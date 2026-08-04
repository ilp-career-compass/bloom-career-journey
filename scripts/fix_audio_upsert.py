import os
import re

TARGETS = {
    "AboutMeAssessment.tsx": ("about_me", "About Me"),
    "CareerGuidanceToolsAssessment.tsx": ("career_guidance_tools", "Career Guidance Tools"),
    "HollandCodeAssessment.tsx": ("personality", "Personality"),
    "MyDreamsAssessment.tsx": ("dreams", "My Dreams"),
    "MyHobbiesAssessment.tsx": ("hobbies", "My Hobbies"),
    "MyRoleModelsAssessment.tsx": ("role_models", "My Role Models"),
    "MySchoolLearningAssessment.tsx": ("school_learning", "My School Learning")
}

BASE_DIR = r"d:\ilp\career_compass\bloom-career-journey\src\components\assessments"

def fix_file(file_name, a_type, a_title):
    path = os.path.join(BASE_DIR, file_name)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # The existing fetchId logic we want to replace looks like this:
    '''
  useEffect(() => {
    // Attempt to load existing audio responses from local storage or DB
    // Just minimal state for AudioRecorder to bind to
    const fetchId = async () => {
        if (!userProfile?.id) return;
        const { data } = await supabase.from('assessment_responses').select('id').eq('student_id', userProfile.id).eq('assessment_type', '{type}').maybeSingle();
        if (data) setAssessmentRecordId(data.id);
    };
    fetchId();
  }, [userProfile?.id]);
    '''

    # We will search for the useEffect block related to fetchId
    pattern = re.compile(r"  useEffect\(\(\) => \{\s+// Attempt to load existing.*?fetchId\(\);\s+\}, \[userProfile\?\.id\]\);", re.DOTALL)
    
    replacement = f"""  useEffect(() => {{
    const ensureAssessmentRecord = async () => {{
      if (!userProfile?.id) return;
      try {{
        const {{ data: existing, error: selectError }} = await supabase
          .from('assessment_responses')
          .select('id')
          .eq('student_id', userProfile.id)
          .eq('assessment_type', '{a_type}')
          .order('updated_at', {{ ascending: false }})
          .limit(1)
          .maybeSingle();

        if (existing && !selectError) {{
          setAssessmentRecordId(existing.id);
          return;
        }}

        const {{ data: inserted, error: insertError }} = await supabase
          .from('assessment_responses')
          .upsert({{
            student_id: userProfile.id,
            assessment_type: '{a_type}',
            assessment_title: '{a_title}',
            responses: {{}},
            completed_at: null,
            updated_at: new Date().toISOString(),
          }}, {{ onConflict: 'student_id,assessment_type' }})
          .select('id')
          .single();

        if (inserted) setAssessmentRecordId(inserted.id);
      }} catch (e) {{
        console.error('Failed to ensure assessment record for audio', e);
      }}
    }};
    ensureAssessmentRecord();
  }}, [userProfile?.id]);"""

    match = pattern.search(content)
    if not match:
        print(f"fetchId block not found in {file_name}")
        return

    content = content[:match.start()] + replacement + content[match.end():]

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
        print(f"Fixed {file_name}")

for fname, (a_type, a_title) in TARGETS.items():
    fix_file(fname, a_type, a_title)
