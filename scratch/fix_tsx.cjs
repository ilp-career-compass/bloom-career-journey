const fs = require('fs');

const path = 'src/components/assessments/MySchoolLearningAssessment.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /return \(\s*<div id="field_question12"/g,
  'return ( <>\n        <div id="field_question12"'
);

content = content.replace(
  /\{isInvalid && <p className="text-red-500 text-sm mt-1">\{lang === 'kn' \? 'ಈ ಕ್ಷೇತ್ರ ಕಡ್ಡಾಯವಾಗಿದೆ' : lang === 'ta' \? 'இந்த புலம் கட்டாயமாகும்' : lang === 'hi' \? 'यह फ़ील्ड आवश्यक है' : 'This field is required'\}<\/p>\}\s*<\/div>\s*\);\s*\}\)\(\)\}/g,
  `{isInvalid && <p className="text-red-500 text-sm mt-1">{lang === 'kn' ? 'ಈ ಕ್ಷೇತ್ರ ಕಡ್ಡಾಯವಾಗಿದೆ' : lang === 'ta' ? 'இந்த புலம் கட்டாயமாகும்' : lang === 'hi' ? 'यह फ़ील्ड आवश्यक है' : 'This field is required'}</p>}
        </div>
      </>
      );
    })()}`
);

fs.writeFileSync(path, content);
console.log('Fixed MySchoolLearningAssessment.tsx');

const path2 = 'src/components/assessments/MyHobbiesAssessment.tsx';
let content2 = fs.readFileSync(path2, 'utf8');

// The issue in MyHobbiesAssessment is missing closing tags because we replaced a single <div> with <div class="fixed..."><div class="container...">
// Let's find: </CardContent>\n              </Card>\n            </div>
// And prepend two </div>
content2 = content2.replace(
  /<\/CardContent>\s*<\/Card>\s*<\/div>\s*\);\s*\}\)\}/,
  `  </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}`
);

fs.writeFileSync(path2, content2);
console.log('Fixed MyHobbiesAssessment.tsx');
