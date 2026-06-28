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
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Update the outer container
  content = content.replace(
    /<div className="container mx-auto flex flex-row justify-between items-center gap-2 sm:gap-4">/g,
    '<div className="container mx-auto flex flex-row w-full gap-2 px-1 sm:px-0">'
  );

  // 2. Update the inner container
  content = content.replace(
    /<div className="flex flex-row gap-1 sm:gap-2 w-auto">/g,
    '<div className="flex-\[2\] flex flex-row gap-2">'
  );
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated footer layout in ${file}`);
  }
});
