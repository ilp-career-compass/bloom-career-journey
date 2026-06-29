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

const removeRegex = /const isSectionComplete = \(sectionTitle: string\) => \{[\s\S]*?return 'pending';\s*\};/;

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  let original = code;

  // Extract the block
  const match = code.match(removeRegex);
  if (match) {
      const block = match[0];
      
      // Remove it from its current bad location (inside `if (loading)`)
      code = code.replace(removeRegex, '');
      
      // Now inject it right BEFORE `if (loading || dataLoading)` or `if (loading)`
      // Let's find a reliable injection point. 
      // The `if (loading` is common. Let's use string replacement.
      if (code.includes('if (loading || dataLoading) {')) {
          code = code.replace('if (loading || dataLoading) {', `${block}\n\n  if (loading || dataLoading) {`);
      } else if (code.includes('if (loading) {')) {
          code = code.replace('if (loading) {', `${block}\n\n  if (loading) {`);
      } else {
          console.warn('Could not find injection point in', file);
      }
      
      fs.writeFileSync(file, code);
      console.log('Fixed getSectionStatus scope in', file);
  } else {
      console.log('Block not found in', file);
  }
});
