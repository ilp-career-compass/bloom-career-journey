const fs = require('fs');

const fixLocalizedTitle = (file) => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    if (file.includes('HollandCodeAssessment')) {
        code = code.replace(/localizedTitle \|\| /g, "t('assessment_holland_code') || ");
    } else if (file.includes('CareerGuidanceToolsAssessment')) {
        code = code.replace(/localizedTitle \|\| /g, "t('assessment_career_guidance') || ");
    }
    
    fs.writeFileSync(file, code);
};

fixLocalizedTitle('src/components/assessments/HollandCodeAssessment.tsx');
fixLocalizedTitle('src/components/assessments/CareerGuidanceToolsAssessment.tsx');
