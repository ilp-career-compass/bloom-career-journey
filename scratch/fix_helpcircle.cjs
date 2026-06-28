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
  let original = code;

  // 1. Remove HelpCircle from logger import if it was accidentally put there
  code = code.replace(/import\s*\{\s*HelpCircle,\s*logger\s*\}\s*from\s*'@\/lib\/logger';/g, "import { logger } from '@/lib/logger';");
  
  // 2. Also check if HelpCircle is in any other wrong import that doesn't end with lucide-react
  // Actually, we can just remove all HelpCircle imports and put it exactly in lucide-react.
  code = code.replace(/HelpCircle,\s*/g, '');
  
  // 3. Now safely add HelpCircle to lucide-react import
  // Find the exact lucide-react block
  const lucideRegex = /import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];/;
  if (lucideRegex.test(code)) {
    code = code.replace(lucideRegex, (match, inner) => {
      // Don't add twice
      if (inner.includes('HelpCircle')) return match;
      return `import {\n  HelpCircle,\n${inner}} from 'lucide-react';`;
    });
  }

  // Also replace <HelpCircle> in code if somehow it got deleted? No, we only replaced HelpCircle, 
  
  // Wait, step 2 `code = code.replace(/HelpCircle,\s*/g, '');` could break `<HelpCircle className...`?
  // No, JSX is `<HelpCircle `. It doesn't have a comma.
  // BUT wait! It might break `import { HelpCircle }` or something.
  // Let's do it safer.

  let safeCode = original;
  
  // Remove HelpCircle from ANY non-lucide-react import.
  // Actually, the easiest way is to just find the broken logger import.
  safeCode = safeCode.replace(/import\s*\{\s*HelpCircle,\s*logger\s*\}\s*from\s*'@\/lib\/logger';/, "import { logger } from '@/lib/logger';");
  
  // And the `useAuth` import? Just in case.
  
  // Just find `lucide-react` and add HelpCircle.
  if (lucideRegex.test(safeCode)) {
    safeCode = safeCode.replace(lucideRegex, (match, inner) => {
      if (inner.includes('HelpCircle')) return match;
      return `import {\n  HelpCircle,\n${inner}} from 'lucide-react';`;
    });
  }

  if (safeCode !== original) {
    fs.writeFileSync(file, safeCode);
    console.log(`Fixed HelpCircle in ${file}`);
  }
});
