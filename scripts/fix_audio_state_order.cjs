const fs = require('fs');
const path = require('path');

const TARGETS = [
    "AboutMeAssessment.tsx",
    "CareerGuidanceToolsAssessment.tsx",
    "HollandCodeAssessment.tsx",
    "MyDreamsAssessment.tsx",
    "MyHobbiesAssessment.tsx",
    "MyRoleModelsAssessment.tsx",
    "MySchoolLearningAssessment.tsx"
];

const BASE_DIR = path.join('d:', 'ilp', 'career_compass', 'bloom-career-journey', 'src', 'components', 'assessments');

function processFile(fileName) {
    const filePath = path.join(BASE_DIR, fileName);
    let content = fs.readFileSync(filePath, 'utf8');

    const startIndex = content.indexOf('  // Audio state');
    if (startIndex === -1) {
        console.log(`Block not found in ${fileName}`);
        return;
    }

    const endString = '  };\n';
    let endIndex = content.indexOf(endString, startIndex);
    if (endIndex === -1) {
        console.log(`End string not found in ${fileName}`);
        return;
    }
    endIndex += endString.length;

    const block = content.substring(startIndex, endIndex);
    
    // Remove the block
    content = content.substring(0, startIndex) + content.substring(endIndex);

    // Find insertion point
    const useAuthMatch = content.match(/const\s+\{.*?userProfile.*?\}\s*=\s*useAuth\(\)\s*;/);
    let insertIndex;
    if (useAuthMatch) {
        insertIndex = useAuthMatch.index + useAuthMatch[0].length;
    } else {
        const useLangMatch = content.match(/const\s+\{.*?lang.*?\}\s*=\s*useLang\(\)\s*;/);
        if (useLangMatch) {
            insertIndex = useLangMatch.index + useLangMatch[0].length;
        } else {
            console.log(`No insertion point found for ${fileName}`);
            return;
        }
    }

    content = content.substring(0, insertIndex) + '\n' + block + content.substring(insertIndex);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${fileName}`);
}

TARGETS.forEach(processFile);
