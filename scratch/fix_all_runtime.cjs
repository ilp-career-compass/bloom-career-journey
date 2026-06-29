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

const progressBlock = `  const isSectionComplete = (sectionTitle: string) => {
    if (sectionTitle === 'Summary') return isSummaryComplete();
    const fields = fieldsBySection[sectionTitle] || [];
    if (fields.length === 0) return false;
    return fields.every(field => {
      const value = responses[field.field_key];
      if (field.field_type === 'triple' || field.field_type === 'double') {
        if (!Array.isArray(value)) return false;
        return value.every(v => strFor(v) !== '');
      }
      return strFor(value) !== '';
    });
  };

  const hasSectionStarted = (sectionTitle: string) => {
    if (sectionTitle === 'Summary') {
      const summary = (responses['summary'] as any) || {};
      const sCount = summaryQuestions.length > 0 ? summaryQuestions.length : 3;
      for(let i=1; i<=sCount; i++) {
        if ((summary[\`question\${i}\`] || '').trim() !== '') return true;
      }
      return false;
    }
    const fields = fieldsBySection[sectionTitle] || [];
    return fields.some(field => {
      const value = responses[field.field_key];
      if (Array.isArray(value)) return value.some(v => strFor(v) !== '');
      return strFor(value) !== '';
    });
  };

  const getSectionStatus = (sectionTitle: string) => {
    if (sectionTitle === currentSection) return 'current';
    if (isSectionComplete(sectionTitle)) return 'completed';
    if (attemptedSubmit || hasSectionStarted(sectionTitle)) return 'error';
    return 'pending';
  };`;

// We also need to construct a flexible regex to remove the block because spaces might have shifted slightly
const removeRegex = /const isSectionComplete = \(sectionTitle: string\) => \{[\s\S]*?return 'pending';\s*\};/;

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  let original = code;

  // 1. Add ArrowLeft and ArrowRight
  if (code.includes("from 'lucide-react';") || code.includes("} from 'lucide-react';")) {
      if (!code.includes('ArrowLeft,')) code = code.replace(/from 'lucide-react';/, "  ArrowLeft,\n} from 'lucide-react';");
      if (!code.includes('ArrowRight,')) code = code.replace(/from 'lucide-react';/, "  ArrowRight,\n} from 'lucide-react';");
  } else if (code.includes('lucide-react')) {
      // maybe on one line?
      if (!code.includes('ArrowLeft,')) code = code.replace(/} from 'lucide-react';/, ", ArrowLeft } from 'lucide-react';");
      if (!code.includes('ArrowRight,')) code = code.replace(/} from 'lucide-react';/, ", ArrowRight } from 'lucide-react';");
  }

  // 2. Fix getSectionStatus position
  if (removeRegex.test(code)) {
      // Remove it from current bad location
      code = code.replace(removeRegex, '');
      
      // Inject it right before the final return statement or right before the component ends.
      // Easiest is to inject before `return (` which starts the JSX.
      // But there might be multiple `return (`. We want the one that renders the component container.
      // All these components render `<div className="min-h-screen bg-gradient`
      if (code.includes('<div className="min-h-screen')) {
          code = code.replace(/(\s*return\s*\(\s*<div className="min-h-screen)/, `\n\n${progressBlock}\n$1`);
      } else {
          console.warn("Could not find injection point in", file);
      }
  }

  if (code !== original) {
      fs.writeFileSync(file, code);
      console.log('Fixed', file);
  }
});
