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
  code = code.replace(/text-lg md:text-xl font-bold([^<]*?)line-clamp-1/g, 'text-base md:text-lg lg:text-xl font-bold$1 leading-tight');
  code = code.replace(/text-lg md:text-xl font-bold([^<]*?)truncate/g, 'text-base md:text-lg lg:text-xl font-bold$1 leading-tight');
  
  // 2. Extract Mobile Sticky Header block (up to its closing div, there are 3 nested divs)
  // The structure is:
  // {/* Mobile Sticky Header */}
  // <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm md:hidden">
  //   <div className="flex ...">
  //     <Button>...</Button>
  //     <h1>...</h1>
  //     <div ...></div>
  //   </div>
  // </div>
  
  // Actually, the regex I used before had `<\/div>\s*<\/div>\s*<\/div>`. 
  // Wait! The Mobile Sticky Header only has TWO closing divs!
  // <div sticky>
  //   <div flex>
  //     <Button /> <h1 /> <div />
  //   </div>
  // </div>
  
  const mobileHeaderRegex = /\s*\{\/\* Mobile Sticky Header \*\/\}\s*<div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm md:hidden">[\s\S]*?<\/div>\s*<\/div>/;
  
  let mobileHeaderBlock = '';
  const match = code.match(mobileHeaderRegex);
  if (match) {
      mobileHeaderBlock = match[0];
      code = code.replace(mobileHeaderRegex, '');
  }

  if (!mobileHeaderBlock) {
      console.warn("Could not find Mobile Sticky Header to move in", file);
  } else {
      // Find the main return block. We know it starts with `return (` and then `<div ...>` and then `{/* Sticky Header */}`
      const mainReturnRegex = /(return\s*\(\s*<div className="min-h-screen[^>]*>\s*)\{\/\* Sticky Header \*\/\}/;
      if (mainReturnRegex.test(code)) {
          code = code.replace(mainReturnRegex, `$1${mobileHeaderBlock}\n\n      {/* Sticky Header */}`);
          console.log("Successfully moved Mobile Sticky Header in", file);
      } else {
          console.warn("Could not find main return block in", file);
          code = original;
      }
  }

  if (code !== original) {
      fs.writeFileSync(file, code);
  }
});
