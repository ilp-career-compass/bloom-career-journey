const fs = require('fs');

// 1. Update index.css with safe area utilities
const indexCssPath = 'src/index.css';
let indexCss = fs.readFileSync(indexCssPath, 'utf8');
if (!indexCss.includes('.pb-safe')) {
  indexCss += `
/* Safe area utilities for mobile */
@layer utilities {
  .pb-safe {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  .pt-safe {
    padding-top: max(1rem, env(safe-area-inset-top));
  }
  .mb-safe {
    margin-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}
`;
  fs.writeFileSync(indexCssPath, indexCss);
  console.log('Updated index.css');
}

// 2. Update Assessments
const assessments = [
  'src/components/assessments/AboutMeAssessment.tsx',
  'src/components/assessments/MyDreamsAssessment.tsx',
  'src/components/assessments/MyHobbiesAssessment.tsx',
  'src/components/assessments/MyInspirationAssessment.tsx',
  'src/components/assessments/MyRoleModelsAssessment.tsx',
  'src/components/assessments/MySchoolLearningAssessment.tsx',
  'src/components/assessments/HollandCodeAssessment.tsx',
  'src/components/assessments/CareerGuidanceToolsAssessment.tsx'
];

assessments.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // -- UPDATE STICKY FOOTER --
  // We want to change the footer to use pb-safe and a better layout.
  // We have various forms of the footer in different files.
  // The common wrapper for the sticky footer we recently added is:
  // <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-2 sm:p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
  
  content = content.replace(
    /<div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-2 sm:p-4 shadow-\[0_-4px_6px_-1px_rgba\(0,0,0,0\.1\)\]">/g,
    '<div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 sm:p-4 pb-safe shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)]">'
  );

  // We want to make the "Next" / "Submit" button stand out as primary if it's the last one, 
  // but they are already styled as primary/green mostly. Let's make sure the buttons have consistent heights.
  // "h-auto sm:h-10" -> "min-h-[44px] h-auto sm:h-10" for touch targets
  content = content.replace(
    /className="(.*?)h-auto sm:h-10(.*?)"/g,
    'className="$1min-h-[44px] h-auto sm:h-10$2"'
  );

  // Update inputs and textareas to have min-h-[44px]
  content = content.replace(
    /<Input\s/g,
    '<Input className="min-h-[44px] rounded-xl" '
  );
  content = content.replace(
    /<Textarea\s/g,
    '<Textarea className="min-h-[44px] rounded-xl" '
  );

  // Remove border-l-4 and use Card style for fields if possible, or at least rounded corners
  // Wait, replacing border-l-4 directly might be risky, but we can replace the padding to be more spacious.
  content = content.replace(
    /border-l-4 pl-3 md:pl-4 py-2/g,
    'border-l-4 pl-4 md:pl-5 py-3 md:py-4 bg-white rounded-r-xl shadow-sm'
  );

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated mobile UI in ${file}`);
  }
});
