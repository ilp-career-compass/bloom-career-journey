const fs = require('fs');
const files = [
  'src/components/assessments/AboutMeAssessment.tsx',
  'src/components/assessments/MySchoolLearningAssessment.tsx'
];
files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8').split('\n');
  const idx = code.findIndex(l => l.includes('{/* Mobile Sticky Header */}'));
  console.log(`\n--- ${f} ---`);
  for(let i = Math.max(0, idx - 10); i < Math.min(code.length, idx + 5); i++) {
    console.log(code[i]);
  }
});
