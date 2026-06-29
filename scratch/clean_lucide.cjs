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

  // Clean up the mangled lucide-react import closures
  // Example bad state:
  // }   ArrowLeft,
  // }   ArrowRight,
  // } from 'lucide-react';
  
  // Let's just find the entire block that closes lucide-react and normalize it
  code = code.replace(/\}\s*ArrowLeft,\s*\}\s*ArrowRight,\s*\}\s*from\s*'lucide-react';/g, "  ArrowLeft,\n  ArrowRight\n} from 'lucide-react';");
  code = code.replace(/\}\s*ArrowLeft,\s*\}\s*from\s*'lucide-react';/g, "  ArrowLeft\n} from 'lucide-react';");
  code = code.replace(/\}\s*ArrowRight,\s*\}\s*from\s*'lucide-react';/g, "  ArrowRight\n} from 'lucide-react';");
  
  // also check if there are duplicate Arrows
  code = code.replace(/ArrowLeft,\s*ArrowLeft,/g, 'ArrowLeft,');
  code = code.replace(/ArrowRight,\s*ArrowRight,/g, 'ArrowRight,');

  fs.writeFileSync(file, code);
  console.log('Cleaned lucide imports in', file);
});
