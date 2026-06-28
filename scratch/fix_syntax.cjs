const fs = require('fs');

const files = [
  'src/components/assessments/AboutMeAssessment.tsx',
  'src/components/assessments/MyDreamsAssessment.tsx',
  'src/components/assessments/MyHobbiesAssessment.tsx',
  'src/components/assessments/MyInspirationAssessment.tsx',
  'src/components/assessments/MyRoleModelsAssessment.tsx',
  'src/components/assessments/MySchoolLearningAssessment.tsx',
  'src/components/assessments/HollandCodeAssessment.tsx',
  'src/components/assessments/CareerGuidanceToolsAssessment.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Find where HelpCircle was appended in lucide-react import
  // Example:
  // AlertTriangle
  // HelpCircle,
  // } from 'lucide-react';
  
  // Let's just fix missing commas before HelpCircle
  code = code.replace(/([a-zA-Z0-9_]+)\s*\n\s*HelpCircle,/g, '$1,\n  HelpCircle,');
  
  fs.writeFileSync(file, code);
  console.log('Fixed syntax in', file);
});
