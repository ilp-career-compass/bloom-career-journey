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

  // Fix the missing comma for ArrowRight
  code = code.replace(/([a-zA-Z]+)\s+ArrowRight/g, '$1, ArrowRight');
  code = code.replace(/([a-zA-Z]+)\s+ArrowLeft/g, '$1, ArrowLeft');
  
  // just in case we have multiple commas
  code = code.replace(/,,\s*/g, ', ');

  fs.writeFileSync(file, code);
  console.log('Fixed', file);
});
