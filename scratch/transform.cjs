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

  // Simple string replacements for the footer container classes to avoid JSX parsing bugs
  code = code.replace(
    /className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-2 sm:p-4 shadow-\[0_-4px_6px_-1px_rgba\(0,0,0,0\.1\)\]"/g,
    'className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 sm:p-4 pb-safe shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)]"'
  );
  
  code = code.replace(
    /className="container mx-auto flex flex-row justify-between items-center gap-2 sm:gap-4"/g,
    'className="container mx-auto flex flex-row w-full gap-2 px-1 sm:px-0"'
  );

  code = code.replace(
    /className="flex flex-row gap-1 sm:gap-2 w-auto"/g,
    'className="flex-[2] flex flex-row gap-2"'
  );

  // Button class updates
  code = code.replace(
    /className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto sm:h-10 border-blue-200 text-blue-700 hover:bg-blue-50"/g,
    'className="flex-1 text-xs sm:text-sm px-2 py-2 min-h-[44px] h-auto sm:h-10 border-blue-200 text-blue-700 hover:bg-blue-50"'
  );
  code = code.replace(
    /className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-auto sm:h-10 bg-blue-600 hover:bg-blue-700"/g,
    'className="flex-1 text-xs sm:text-sm px-2 py-2 min-h-[44px] h-auto sm:h-10 bg-blue-600 hover:bg-blue-700 text-white"'
  );

  // Update header classes
  code = code.replace(
    /className="sticky top-0 z-50 bg-white\/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm mb-6"/g,
    'className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm mb-6 pt-safe"'
  );
  
  // Header left button
  code = code.replace(
    /className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 -ml-2"/g,
    'className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-10 h-10 rounded-full"'
  );
  // Header Title center
  code = code.replace(
    /className="text-center flex-1"/g,
    'className="text-center flex-1 flex flex-col items-center"'
  );
  // Spacer to Help button
  code = code.replace(
    /<div className="w-10 sm:w-24"><\/div> \{\/\* Spacer \*\/\}/g,
    '<Button variant="ghost" className="text-blue-600 hover:bg-blue-50 text-sm font-medium px-2 rounded-full"><HelpCircle className="w-4 h-4 mr-1" />Help</Button>'
  );

  // Header Target/Icon wrapper (wrap title in a flex container)
  code = code.replace(
    /<h1 className="text-lg md:text-xl font-bold text-blue-800 line-clamp-1">/g,
    '<h1 className="text-lg md:text-xl font-bold text-blue-900 line-clamp-1 flex items-center gap-2">'
  );

  if (!code.includes('HelpCircle')) {
    code = code.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { HelpCircle, $1 } from 'lucide-react';");
  }

  fs.writeFileSync(file, code);
  console.log(`Successfully updated ${file}`);
});
