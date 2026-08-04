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

def fix_file(file_name):
    path = os.path.join(BASE_DIR, file_name)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    start_str = "  // Audio state"
    end_str = "  };\n"
    end_str_win = "  };\r\n"
    
    start_idx = content.find(start_str)
    if start_idx == -1:
        print(f"Block not found in {file_name}")
        return
        
    end_idx = content.find(end_str, start_idx)
    if end_idx == -1:
        end_idx = content.find(end_str_win, start_idx)
        if end_idx == -1:
            print(f"End string not found in {file_name}")
            return
        end_idx += len(end_str_win)
    else:
        end_idx += len(end_str)

    # Make sure we got the actual handleAudioResponse end, by checking if we have "const handleAudioResponse" in the block
    # Actually, there's only one "  };\n" in that block, let's just use string search for "const handleAudioResponse"
    block_pattern = re.compile(r"(  // Audio state.*?const handleAudioResponse.*?\}\;[\r\n]+)", re.DOTALL)
    match = block_pattern.search(content)
    if not match:
        print(f"Regex Block not found in {file_name}")
        return
        
    block_text = match.group(1)
    
    # Remove block
    content = content.replace(block_text, "")
    
    # Find insertion point
    use_auth_match = re.search(r"const\s+\{.*?userProfile.*?\}\s*=\s*useAuth\(\)\s*;", content)
    if use_auth_match:
        insert_idx = use_auth_match.end()
    else:
        # Fallback to useLang
        use_lang_match = re.search(r"const\s+\{.*?lang.*?\}\s*=\s*useLang\(\)\s*;", content)
        if use_lang_match:
            insert_idx = use_lang_match.end()
        else:
            print(f"Insertion point not found for {file_name}")
            return
            
    content = content[:insert_idx] + "\n" + block_text + content[insert_idx:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
        print(f"Fixed {file_name}")

for t in TARGETS:
    fix_file(t)

