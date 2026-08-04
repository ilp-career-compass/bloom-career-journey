const fs = require('fs');

let content = fs.readFileSync('src/pages/StudentSummary.tsx', 'utf8');

// 1. Change getDisplaySummaryData to return rec.responses
content = content.replace(
  /const getDisplaySummaryData = \(rec: AssessmentRecord\) => \{[\s\S]*?return null;\n  \};/,
  `const getDisplaySummaryData = (rec: AssessmentRecord) => {
    return rec.responses || null;
  };`
);

// 2. Generic render function template
const genericRender = (name) => `const ${name} = (summaryData: any) => {
    if (!summaryData) return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;
    
    // Find all summary keys (summary_q1, summary_question1, etc.)
    const summaryKeys = Object.keys(summaryData)
      .filter(k => k.startsWith('summary_'))
      .sort();
      
    if (summaryKeys.length === 0) return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;

    return (
      <div className="space-y-4 mt-3">
        {summaryKeys.map((key, index) => (
          <div key={key} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/30 hover:bg-slate-50 transition-colors">
            <div className="text-xs font-bold text-indigo-600 uppercase mb-1.5">
              Summary Question {index + 1}
            </div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {String(summaryData[key])}
            </div>
          </div>
        ))}
      </div>
    );
  };`;

// Replace each render function
const renderNames = ['renderDreamsPortfolio', 'renderHobbiesPortfolio', 'renderSchoolLearning', 'renderAboutMe', 'renderInspiration', 'renderRoleModels', 'renderCareerTools', 'renderHollandCode'];

renderNames.forEach(name => {
  const regex = new RegExp(`const ${name} = \\(summaryData: any\\) => \\{[\\s\\S]*?\\n  \\};`);
  content = content.replace(regex, genericRender(name));
});

fs.writeFileSync('src/pages/StudentSummary.tsx', content);
