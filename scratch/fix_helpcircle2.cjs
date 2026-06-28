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
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  let newLines = [];
  let inLogger = false;
  let inLucide = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if we are in logger block
    if (line.includes("from '@/lib/logger';") || line.includes("import { logger } from '@/lib/logger';")) {
        // if this was single line, we don't care
    }
    
    if (line.includes('HelpCircle,')) {
        // If it's the very first few lines (like < 10), it's probably the logger block
        if (i < 10) {
            continue; // delete this line
        }
    }
    
    if (line.includes("from 'lucide-react';")) {
        // We found lucide-react closing
        // Add HelpCircle if it's not already there
        let hasHelpCircle = false;
        // check previous 30 lines for HelpCircle
        for (let j = Math.max(0, newLines.length - 30); j < newLines.length; j++) {
            if (newLines[j].includes('HelpCircle')) {
                hasHelpCircle = true;
                break;
            }
        }
        if (!hasHelpCircle) {
            newLines.push("  HelpCircle,");
        }
    }
    
    // Clean up empty lines at start if any were left by deleting HelpCircle
    if (i < 5 && line.trim() === '' && lines[i+1] && lines[i+1].includes('logger }')) {
        continue;
    }
    
    newLines.push(line);
  }

  // Final pass to fix logger import if it looks like `import {\n logger }`
  let finalStr = newLines.join('\n');
  finalStr = finalStr.replace(/import\s*\{\s*logger\s*\}\s*from\s*'@\/lib\/logger';/g, "import { logger } from '@/lib/logger';");
  
  fs.writeFileSync(file, finalStr);
  console.log('Fixed', file);
});
