const fs = require('fs');

let code = fs.readFileSync('src/components/assessments/MyRoleModelsAssessment.tsx', 'utf8');

const mobileHeaderRegex = /\s*\{\/\* Mobile Sticky Header \*\/\}\s*<div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm md:hidden">[\s\S]*?<\/div>\s*<\/div>/;

let mobileHeaderBlock = '';
const match = code.match(mobileHeaderRegex);
if (match) {
    mobileHeaderBlock = match[0];
    code = code.replace(mobileHeaderRegex, '');
}

mobileHeaderBlock = mobileHeaderBlock.replace(/line-clamp-1/g, 'leading-tight break-words px-1 text-sm sm:text-base');

const desktopHeaderBlock = `
      {/* Sticky Header */}
      <div className="hidden md:block sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm mb-6 pt-safe">
        <div className="container mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/student')}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 w-10 h-10 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('backToDashboard')}</span>
          </Button>
          <div className="text-center flex-1 flex flex-col items-center">
            <h1 className="text-base md:text-lg lg:text-xl font-bold text-purple-800 leading-tight break-words px-1">
              🌟 {dbTitle || (lang === 'kn' ? 'ನನ್ನ ಮಾದರಿ ವ್ಯಕ್ತಿಗಳು' : lang === 'ta' ? 'எனது முன்மாதிரிகள்' : lang === 'hi' ? 'मेरे आदर्श व्यक्ति' : 'My Role Models')}
            </h1>
            <div className="text-xs md:text-sm text-purple-600 font-medium">Step 5 of 8</div>
          </div>
          <div className="w-10 sm:w-24"></div>
        </div>
      </div>
`;

// In MyRoleModelsAssessment, the main return block starts with:
// return (
//   <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 pb-24" lang={lang} dir="auto">

const mainReturnRegex = /(return\s*\(\s*<div className="min-h-screen[^>]*>\s*)/;
if (mainReturnRegex.test(code)) {
    code = code.replace(mainReturnRegex, `$1${mobileHeaderBlock}\n${desktopHeaderBlock}`);
    // Also remove the old Back to Dashboard button
    code = code.replace(/<div className="mb-6">\s*<Button variant="ghost" onClick=\{\(\) => navigate\('\/student'\)\}[^>]*>[\s\S]*?<\/Button>\s*<\/div>/, '');
    fs.writeFileSync('src/components/assessments/MyRoleModelsAssessment.tsx', code);
    console.log("Success MyRoleModelsAssessment");
} else {
    console.log("Failed to find main return in MyRoleModelsAssessment");
}
