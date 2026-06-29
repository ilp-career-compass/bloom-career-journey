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

  // 1. Remove line-clamp-1 and truncate from Desktop Sticky Header
  code = code.replace(/text-lg md:text-xl font-bold([^<]*?)line-clamp-1/g, 'text-base md:text-lg font-bold$1 leading-tight');
  code = code.replace(/text-lg md:text-xl font-bold([^<]*?)truncate/g, 'text-base md:text-lg font-bold$1 leading-tight');
  
  // 2. Extract Mobile Sticky Header block
  const mobileHeaderRegex = /\s*\{\/\* Mobile Sticky Header \*\/\}\s*<div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm md:hidden">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  
  let mobileHeaderBlock = '';
  const match = code.match(mobileHeaderRegex);
  if (match) {
      mobileHeaderBlock = match[0];
      // delete it from where it currently is
      code = code.replace(mobileHeaderRegex, '');
  }

  // If we couldn't extract it, let's just log and skip the move step (we still updated the title classes)
  if (!mobileHeaderBlock) {
      console.warn("Could not find Mobile Sticky Header to move in", file);
  } else {
      // Find the main return block. All of them have:
      // return (
      //   <div className="min-h-screen bg-gradient-to-br from-... pb-24" lang={lang} dir="auto">
      // OR
      //   <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-24" lang={lang} dir="auto">
      
      const mainReturnRegex = /(return\s*\(\s*<div className="min-h-screen[^>]*pb-24"[^>]*>)/;
      if (mainReturnRegex.test(code)) {
          code = code.replace(mainReturnRegex, `$1\n${mobileHeaderBlock}`);
          console.log("Successfully moved Mobile Sticky Header in", file);
      } else {
          console.warn("Could not find main return block in", file);
          // Put it back if we couldn't place it
          code = original;
      }
  }

  if (code !== original) {
      fs.writeFileSync(file, code);
  }
});
