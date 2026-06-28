const fs = require('fs');
const babel = require('@babel/parser');

const path = 'src/components/assessments/MySchoolLearningAssessment.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert a </div> before the final `);`
content = content.replace(
  /<\/div >\s*<\/div >\s*\);\s*\}/,
  '</div >\n      </div >\n    </div >\n  );\n}'
);

try {
  babel.parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log('Parsed successfully with 1 extra div!');
  fs.writeFileSync(path, content);
} catch (e) {
  console.error('Parse failed:', e.message);
  
  // What if we need 2 extra divs?
  let content2 = content.replace(
    /<\/div >\s*<\/div >\s*<\/div >\s*\);\s*\}/,
    '</div >\n      </div >\n      </div >\n    </div >\n  );\n}'
  );
  try {
    babel.parse(content2, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
    console.log('Parsed successfully with 2 extra divs!');
    fs.writeFileSync(path, content2);
  } catch (e2) {
    console.error('Parse failed again:', e2.message);
  }
}
