const fs = require('fs');

const path = 'src/components/assessments/MySchoolLearningAssessment.tsx';
let content = fs.readFileSync(path, 'utf8');

// First, remove the stray </> across the whole file
content = content.replace(
  /<\/div>\s*<\/>\s*\);\s*\}\)\(\)\}/g,
  `</div>
      );
    })()}`
);

// If there's any `<>\n        <div id="field_question` left over, revert them
content = content.replace(
  /return \( <>\n\s*<div id="field_question/g,
  'return (\n        <div id="field_question'
);

// Now apply the correct `<>` wrapping ONLY for field_question12
content = content.replace(
  /return \(\n\s*<div id="field_question12"/g,
  'return ( <>\n        <div id="field_question12"'
);

// And apply the closing `</>` only after question 12's validation error message
content = content.replace(
  /value=\{responses\.section3\.question12\}([\s\S]*?)\{isInvalid && <p className="text-red-500 text-sm mt-1">\{lang === 'kn' \? 'ಈ ಕ್ಷೇತ್ರ ಕಡ್ಡಾಯವಾಗಿದೆ' : lang === 'ta' \? 'இந்த புலம் கட்டாயமாகும்' : lang === 'hi' \? 'यह फ़ील्ड आवश्यक है' : 'This field is required'\}<\/p>\}\s*<\/div>\s*\);\s*\}\)\(\)\}/,
  `value={responses.section3.question12}$1{isInvalid && <p className="text-red-500 text-sm mt-1">{lang === 'kn' ? 'ಈ ಕ್ಷೇತ್ರ ಕಡ್ಡಾಯವಾಗಿದೆ' : lang === 'ta' ? 'இந்த புலம் கட்டாயமாகும்' : lang === 'hi' ? 'यह फ़ील्ड आवश्यक है' : 'This field is required'}</p>}
        </div>
      </>
      );
    })()}`
);

fs.writeFileSync(path, content);
console.log('Fixed MySchoolLearningAssessment.tsx');

const path2 = 'src/components/assessments/MyHobbiesAssessment.tsx';
let content2 = fs.readFileSync(path2, 'utf8');

// For MyHobbiesAssessment.tsx, we previously added TWO </div> instead of ONE!
// I'll just restore the correct number of closing divs for the footer.
content2 = content2.replace(
  /<\/div>\s*<\/div>\s*<\/CardContent>\s*<\/Card>\s*<\/div>\s*\);\s*\}\)\}/g,
  `</div>
                </CardContent>
              </Card>
            </div>
          );
        })}`
);

fs.writeFileSync(path2, content2);
console.log('Fixed MyHobbiesAssessment.tsx');
