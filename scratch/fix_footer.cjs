const fs = require('fs');

const files = [
  'src/components/assessments/MyInspirationAssessment.tsx',
  'src/components/assessments/AboutMeAssessment.tsx',
  'src/components/assessments/MyDreamsAssessment.tsx',
  'src/components/assessments/MySchoolLearningAssessment.tsx',
  'src/components/assessments/MyHobbiesAssessment.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Change footer paddings
  content = content.replace(
    /\{\/\* Sticky Footer Navigation \*\/\}\s*<div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 shadow-\[0_-4px_6px_-1px_rgba\(0,0,0,0\.1\)\]">/g,
    `{/* Sticky Footer Navigation */}\n        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-2 sm:p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">`
  );
  
  content = content.replace(
    /<div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">/g,
    `<div className="container mx-auto flex flex-row justify-between items-center gap-2 sm:gap-4">`
  );
  
  content = content.replace(
    /<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">/g,
    `<div className="flex flex-row gap-1 sm:gap-2 w-auto">`
  );

  // Change button classes to fit on one line
  content = content.replace(/className="w-full sm:w-auto /g, 'className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto sm:h-10 ');
  content = content.replace(/className="w-full sm:w-auto/g, 'className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto sm:h-10');

  // For Previous Section / Next Section text, add hidden sm:inline so on mobile it shows icons or just compact text
  // We can just hide the text and show icons, or since there are already icons, just hide text on mobile?
  // Let's leave text but it's now text-xs.

  fs.writeFileSync(file, content);
}
console.log('Fixed footers');
