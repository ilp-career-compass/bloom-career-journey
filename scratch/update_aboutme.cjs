const fs = require('fs');

const file = 'src/components/assessments/AboutMeAssessment.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Inject Helper functions right before `return (`
const helperCode = `
  const isSectionComplete = (sectionTitle: string) => {
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
  };

  return (`;

code = code.replace(/return \(/, helperCode);

// 2. Replace Section Tabs with Breadcrumb Navigation
// The Section Tabs block starts with `{/* Section Tabs */}` and ends before `{/* Tab Contents */}`
const tabsRegex = /\{\/\* Section Tabs \*\/\}[\s\S]*?(?=\{\/\* Tab Contents \*\/\})/g;

const newBreadcrumbs = `{/* Compact Breadcrumb Navigation */}
              {sections.length > 0 && (
                <div className="w-full flex flex-col items-center justify-center mb-8 space-y-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    {currentSection === 'Summary' ? t('summary') : currentSection}
                  </h2>
                  <div className="flex items-center justify-center gap-4">
                    {sections.map((sectionTitle) => {
                      const status = getSectionStatus(sectionTitle);
                      const isLocked = sectionTitle === 'Summary' && !isReadOnly && !loading && !areCoreSectionsComplete();
                      
                      return (
                        <button
                          key={sectionTitle}
                          onClick={() => !isLocked && setCurrentSection(sectionTitle)}
                          disabled={isLocked && !isReadOnly}
                          className={\`relative flex items-center justify-center transition-transform hover:scale-110 \${isLocked ? 'opacity-50 cursor-not-allowed' : ''}\`}
                          title={sectionTitle}
                        >
                          {status === 'current' && <div className="w-4 h-4 rounded-full bg-blue-600 shadow-md ring-4 ring-blue-100" />}
                          {status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500 drop-shadow-sm" />}
                          {status === 'error' && <AlertTriangle className="w-5 h-5 text-red-500 drop-shadow-sm" />}
                          {status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-gray-300" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              `;

code = code.replace(tabsRegex, newBreadcrumbs);

fs.writeFileSync(file, code);
console.log('Successfully updated', file);
