import os
import re

TARGETS = [
    "AboutMeAssessment.tsx",
    "CareerGuidanceToolsAssessment.tsx",
    "HollandCodeAssessment.tsx",
    "MyDreamsAssessment.tsx",
    "MyHobbiesAssessment.tsx",
    "MyRoleModelsAssessment.tsx",
    "MySchoolLearningAssessment.tsx"
]

BASE_DIR = r"d:\ilp\career_compass\bloom-career-journey\src\components\assessments"

# Imports to add
AUDIO_RECORDER_IMPORT = "import { AudioRecorder } from '@/components/ui/AudioRecorder';\n"
USE_STATE_IMPORT = "useState"

def process_file(file_name):
    path = os.path.join(BASE_DIR, file_name)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add import
    if "import { AudioRecorder }" not in content:
        # Find last import
        imports_end = content.rfind("import ")
        newline = content.find("\n", imports_end)
        content = content[:newline+1] + AUDIO_RECORDER_IMPORT + content[newline+1:]

    # 2. Add State and handler
    # Find component declaration
    comp_match = re.search(r"export\s+default\s+function\s+[a-zA-Z]+\(\)\s*\{", content)
    if not comp_match:
        print(f"Skipping {file_name}: no default export component found")
        return
        
    start_idx = comp_match.end()
    
    # Check if audio state exists
    if "audioResponsesMap" not in content:
        # Insert state logic
        state_logic = """
  // Audio state
  const [audioResponsesMap, setAudioResponsesMap] = useState<Record<string, any>>({});
  const [assessmentRecordId, setAssessmentRecordId] = useState<string | null>(null);

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
  
  const handleAudioResponse = (qKey: string, audioBlob: Blob, transcription?: string) => {
    setAudioResponsesMap(prev => ({
        ...prev,
        [qKey]: { ...prev[qKey], url: URL.createObjectURL(audioBlob), transcript: transcription }
    }));
  };
""".replace('{type}', file_name.replace('Assessment.tsx', '').lower())
        content = content[:start_idx] + "\n" + state_logic + content[start_idx:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
        print(f"Processed {file_name}")

for t in TARGETS:
    process_file(t)

