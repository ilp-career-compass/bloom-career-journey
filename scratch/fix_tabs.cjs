const fs = require('fs');

const files = [
  'src/components/assessments/MyInspirationAssessment.tsx',
  'src/components/assessments/AboutMeAssessment.tsx',
  'src/components/assessments/MyDreamsAssessment.tsx',
  'src/components/assessments/MySchoolLearningAssessment.tsx',
  'src/components/assessments/MyRoleModelsAssessment.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Find something like: <div className="flex flex-wrap gap-3 mb-6"> for the tabs
  content = content.replace(
    /<div className="flex flex-wrap gap-([0-9]) mb-([0-9])">/g,
    '<div className="flex overflow-x-auto pb-2 gap-$1 mb-$2 hide-scrollbar">'
  );

  // MyRoleModelsAssessment has: <div className="flex justify-center mb-6 gap-2 flex-wrap">
  content = content.replace(
    /<div className="flex justify-center mb-6 gap-2 flex-wrap">/g,
    '<div className="flex overflow-x-auto pb-2 mb-6 gap-2 hide-scrollbar w-full sm:justify-center">'
  );
  
  // MySchoolLearningAssessment has: <div className="flex flex-wrap gap-2 mb-8">
  content = content.replace(
    /<div className="flex flex-wrap gap-2 mb-8">/g,
    '<div className="flex overflow-x-auto pb-2 gap-2 mb-8 hide-scrollbar">'
  );

  fs.writeFileSync(file, content);
}
console.log('Fixed tabs');
