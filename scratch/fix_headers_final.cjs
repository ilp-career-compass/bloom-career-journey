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

  // We know that we accidentally placed BOTH Mobile Sticky Header and Sticky Header inside the `if (loading)` block.
  // The `if (loading)` block looks like this:
  // return (
  //   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
  //     {/* Mobile Sticky Header */}
  //     ...
  //     {/* Sticky Header */}
  //     ...
  //     <div className="text-center">
  //       <div className="animate-spin ...
  
  const mobileHeaderIdx = code.indexOf('{/* Mobile Sticky Header */}');
  if (mobileHeaderIdx === -1) {
      console.log("No Mobile Sticky Header found in", file);
      return;
  }
  
  const mainReturnIdx = code.indexOf('lang={lang} dir="auto">');
  if (mainReturnIdx === -1) {
      console.log("Could not find lang={lang} in", file);
      return;
  }
  
  if (mobileHeaderIdx > mainReturnIdx) {
      console.log(file, "is already correct (headers are after main return).");
      return; // Already correct!
  }

  // It's before the main return! Let's extract it.
  // We need to extract from `{/* Mobile Sticky Header */}` up to just before `<div className="text-center">` (which is the next part of the loading block)
  // OR, if it was injected into the main block but we are confused? No, if it's before main return, it's definitely in loading block.
  
  const textCenterIdx = code.indexOf('<div className="text-center">', mobileHeaderIdx);
  
  if (textCenterIdx !== -1) {
      // Extract the headers
      const headersBlock = code.substring(mobileHeaderIdx, textCenterIdx);
      
      // Remove it from the loading block
      code = code.substring(0, mobileHeaderIdx) + code.substring(textCenterIdx);
      
      // Inject it right after `lang={lang} dir="auto">`
      const injectionPoint = code.indexOf('lang={lang} dir="auto">') + 'lang={lang} dir="auto">'.length;
      
      code = code.substring(0, injectionPoint) + '\n\n      ' + headersBlock + code.substring(injectionPoint);
      
      fs.writeFileSync(file, code);
      console.log("Fixed headers in", file);
  } else {
      console.log("Could not find text-center after headers in", file);
  }
});
