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
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. HEADER UPDATE
  // We want to replace the sticky header block.
  // The block starts with `<div className="sticky top-0 z-50` and ends with `</div>\n        </div>` (two divs).
  // Because it contains translations, let's capture the title part and the step part to inject them back.
  const headerRegex = /<div className="sticky top-0 z-50[\s\S]*?<div className="w-10 sm:w-24"><\/div> \{\/\* Spacer \*\/\}\s*<\/div>\s*<\/div>/;
  
  const match = content.match(headerRegex);
  if (match) {
    const headerBlock = match[0];
    
    // Extract title (h1 content)
    let titleContent = '';
    const h1Match = headerBlock.match(/<h1 className="[^"]+">([\s\S]*?)<\/h1>/);
    if (h1Match) {
      titleContent = h1Match[1].trim();
    }

    // Extract step
    let stepContent = '';
    const stepMatch = headerBlock.match(/<div className="text-xs md:text-sm text-(?:blue|green)-600 font-medium">(.*?)<\/div>/);
    if (stepMatch) {
      stepContent = stepMatch[1];
    }
    
    // Reconstruct the new header matching the image
    // Find what color to use based on the file. AboutMe is blue, School is green, etc.
    const isGreen = content.includes('border-green-200');
    const color = isGreen ? 'green' : 'blue';
    const textDark = isGreen ? 'text-green-900' : 'text-blue-900';
    const textLight = isGreen ? 'text-green-600' : 'text-blue-600';

    const newHeader = `<div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm mb-6">
          <div className="container mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/student')}
              className="${textLight} hover:text-${color}-700 hover:bg-${color}-50 w-10 h-10 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center flex-1 flex flex-col items-center">
              <h1 className="text-lg md:text-xl font-bold ${textDark} line-clamp-1 flex items-center justify-center gap-2">
                ${titleContent.replace(/className="[^"]*w-[0-9]+[^"]*"/, 'className="w-5 h-5"')}
              </h1>
              <div className="text-xs md:text-sm ${textLight} font-medium">${stepContent}</div>
            </div>
            <Button
              variant="ghost"
              className="${textLight} hover:text-${color}-700 hover:bg-${color}-50 text-sm font-medium px-2 rounded-full"
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Help
            </Button>
          </div>
        </div>`;
    
    content = content.replace(headerRegex, newHeader);
  }

  // 2. FOOTER FIXES
  // Change "Previous Section" to "Previous" and add ArrowLeft if not present
  content = content.replace(
    /(<Button[\s\S]*?onClick=\{[\s\S]*?setCurrentSection[\s\S]*?>)\s*(?:\{lang === 'kn'[\s\S]*?:\s*'Previous Section'\})/g,
    '$1\n              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2 inline" />\n              <span className="hidden sm:inline">{lang === \'kn\' ? \'ಹಿಂದಿನ\' : lang === \'ta\' ? \'முந்தைய\' : lang === \'hi\' ? \'पिछला\' : \'Previous Section\'}</span><span className="sm:hidden">{lang === \'kn\' ? \'ಹಿಂದೆ\' : lang === \'ta\' ? \'பின்\' : lang === \'hi\' ? \'पीछे\' : \'Previous\'}</span>'
  );

  // Add ArrowRight to "Next Section" or "Summary"
  content = content.replace(
    /(<Button[\s\S]*?onClick=\{[\s\S]*?nextSection[\s\S]*?>)\s*(\{sections\[sections\.indexOf\(currentSection\) \+ 1\] === 'Summary'[\s\S]*?: \(lang === 'kn' \? 'ಮುಂದಿನ ಭಾಗ' : lang === 'ta' \? 'அடுத்த பகுதி' : lang === 'hi' \? 'अगला भाग' : 'Next Section'\)\})/g,
    '$1\n                  <span className="hidden sm:inline">$2</span><span className="sm:hidden">{sections[sections.indexOf(currentSection) + 1] === \'Summary\' ? \'Summary\' : \'Next\'}</span>\n                  <ArrowRight className="w-4 h-4 ml-1 sm:ml-2 inline" />'
  );

  // For School/Inspiration which use `sectionOrder` instead of `sections`
  content = content.replace(
    /(<Button[\s\S]*?onClick=\{[\s\S]*?nextSection[\s\S]*?>)\s*(\{sectionOrder\[sectionOrder\.indexOf\(currentSection\) \+ 1\] === 'section6'[\s\S]*?return nextSec === 'section6' \? t\('viewSummary'\) : t\('nextSection'\);\s*\}\)\(\)\})/g,
    '$1\n                  <span className="hidden sm:inline">$2</span><span className="sm:hidden">Next</span>\n                  <ArrowRight className="w-4 h-4 ml-1 sm:ml-2 inline" />'
  );

  // Make sure HelpCircle is imported
  if (content !== original && !content.includes('HelpCircle')) {
    content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { HelpCircle, $1 } from 'lucide-react';");
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated header/footer in ${file}`);
  }
});
