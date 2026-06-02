import { ResourceLink } from '@/utils/driveLinks';

// ── Localised item labels ─────────────────────────────────────────────────────
type Lang = 'en' | 'kn' | 'ta' | 'hi';

interface LabeledLink extends ResourceLink {
  labelKn?: string;
  labelTa?: string;
  labelHi?: string;
}

/** Return the item label localised for the given language. */
export const localizeLabel = (item: LabeledLink, lang: string): string => {
  if (lang === 'kn' && item.labelKn) return item.labelKn;
  if (lang === 'ta' && item.labelTa) return item.labelTa;
  if (lang === 'hi' && item.labelHi) return item.labelHi;
  return item.label; // English fallback
};

// ── Career Planner ────────────────────────────────────────────────────────────
export const CAREER_PLANNER: LabeledLink[] = [
  {
    id: 'cp-en',
    label:    'Career Planner in English',
    labelKn:  'ವೃತ್ತಿ ಯೋಜಕ (ಇಂಗ್ಲಿಷ್)',
    labelTa:  'தொழில் திட்டமிடல் (ஆங்கிலம்)',
    labelHi:  'करियर प्लानर (अंग्रेज़ी)',
    fileId: '1cYOjRcQansby4zdb3tpn3ZH2ZqY37iH9',
  },
  {
    id: 'cp-hi',
    label:    'Career Planner in Hindi',
    labelKn:  'ವೃತ್ತಿ ಯೋಜಕ (ಹಿಂದಿ)',
    labelTa:  'தொழில் திட்டமிடல் (இந்தி)',
    labelHi:  'करियर प्लानर (हिंदी)',
    fileId: '1_riiStkpap1jpYfvQ8OoGgBv750CAiaD',
  },
  {
    id: 'cp-kn',
    label:    'Career Planner in Kannada',
    labelKn:  'ವೃತ್ತಿ ಯೋಜಕ (ಕನ್ನಡ)',
    labelTa:  'தொழில் திட்டமிடல் (கன்னடம்)',
    labelHi:  'करियर प्लानर (कन्नड़)',
    fileId: '1O3VEpTKVoE_S9BfFDgc3kveMhizWtDQ-',
  },
  {
    id: 'cp-or',
    label:    'Career Planner in Odiya',
    labelKn:  'ವೃತ್ತಿ ಯೋಜಕ (ಒಡಿಯಾ)',
    labelTa:  'தொழில் திட்டமிடல் (ஒடியா)',
    labelHi:  'करियर प्लानर (ओडिया)',
    fileId: '1SbhHDUoX0LnWKu_uJDjNnXazNllf5lfw',
  },
  {
    id: 'cp-ta',
    label:    'Career Planner in Tamil',
    labelKn:  'ವೃತ್ತಿ ಯೋಜಕ (ತಮಿಳು)',
    labelTa:  'தொழில் திட்டமிடல் (தமிழ்)',
    labelHi:  'करियर प्लानर (तमिल)',
    fileId: '1hrD3rEGtmUD3xQhR-qIrFKo9L3djJESJ',
  },
  {
    id: 'cp-te',
    label:    'Career Planner in Telugu',
    labelKn:  'ವೃತ್ತಿ ಯೋಜಕ (ತೆಲುಗು)',
    labelTa:  'தொழில் திட்டமிடல் (தெலுங்கு)',
    labelHi:  'करियर प्लानर (तेलुगु)',
    fileId: '1fbyUy36vmKdPCC5CMun6YcLews2rp6xI',
  },
  {
    id: 'cp-ur',
    label:    'Career Planner in Urdu',
    labelKn:  'ವೃತ್ತಿ ಯೋಜಕ (ಉರ್ದು)',
    labelTa:  'தொழில் திட்டமிடல் (உருது)',
    labelHi:  'करियर प्लानर (उर्दू)',
    fileId: '1Qp5fbAybF4VNUJz0WHi84PWgM4n-3oXJ',
  },
];

// ── Course Guidance Chart ─────────────────────────────────────────────────────
export const COURSE_GUIDANCE_CHART: LabeledLink[] = [
  {
    id: 'cgc-ka',
    label:    'Course Guidance Chart for Karnataka',
    labelKn:  'ಕರ್ನಾಟಕದ ಕೋರ್ಸ್ ಮಾರ್ಗದರ್ಶನ ಚಾರ್ಟ್',
    labelTa:  'கர்நாடகாவுக்கான படிப்பு வழிகாட்டல் அட்டவணை',
    labelHi:  'कर्नाटक के लिए कोर्स मार्गदर्शन चार्ट',
    fileId: '1n1YOW7lUvFG2LXhWIYHecTUL3EQfdGBo',
  },
  {
    id: 'cgc-hi',
    label:    'Course Guidance Chart in Hindi',
    labelKn:  'ಕೋರ್ಸ್ ಮಾರ್ಗದರ್ಶನ ಚಾರ್ಟ್ (ಹಿಂದಿ)',
    labelTa:  'படிப்பு வழிகாட்டல் அட்டவணை (இந்தி)',
    labelHi:  'कोर्स मार्गदर्शन चार्ट (हिंदी)',
    externalUrl: 'https://csm.ilpnet.org/wp-content/uploads/2020/09/ILP_Career_Guidance_Chart_Hindi-1.pdf',
  },
  {
    id: 'cgc-or',
    label:    'Course Guidance Chart for Odisha',
    labelKn:  'ಒಡಿಶಾ ಕೋರ್ಸ್ ಮಾರ್ಗದರ್ಶನ ಚಾರ್ಟ್',
    labelTa:  'ஒடிசாவுக்கான படிப்பு வழிகாட்டல் அட்டவணை',
    labelHi:  'ओडिशा के लिए कोर्स मार्गदर्शन चार्ट',
    externalUrl: 'https://csm.ilpnet.org/wp-content/uploads/2020/09/Odia-career-Chart.pdf',
  },
  {
    id: 'cgc-te',
    label:    'Course Guidance Chart for Andhra/Telangana in Telugu',
    labelKn:  'ಆಂಧ್ರ/ತೆಲಂಗಾಣ ಕೋರ್ಸ್ ಮಾರ್ಗದರ್ಶನ ಚಾರ್ಟ್ (ತೆಲುಗು)',
    labelTa:  'ஆந்திரா/தெலங்கானாவுக்கான படிப்பு வழிகாட்டல் அட்டவணை (தெலுங்கு)',
    labelHi:  'आंध्र/तेलंगाना के लिए कोर्स मार्गदर्शन चार्ट (तेलुगु)',
    externalUrl: 'https://csm.ilpnet.org/wp-content/uploads/2018/05/ILP_Careerchart_Telugu.jpg',
  },
  {
    id: 'cgc-ta',
    label:    'Course Guidance Chart for Tamil Nadu',
    labelKn:  'ತಮಿಳುನಾಡು ಕೋರ್ಸ್ ಮಾರ್ಗದರ್ಶನ ಚಾರ್ಟ್',
    labelTa:  'தமிழ்நாட்டுக்கான படிப்பு வழிகாட்டல் அட்டவணை',
    labelHi:  'तमिलनाडु के लिए कोर्स मार्गदर्शन चार्ट',
    fileId: '1l9VwM60apNcWZtdq5tLIUjy7c6CpT9ii',
  },
];

// ── Career Details ────────────────────────────────────────────────────────────
export const CAREER_DETAILS: LabeledLink[] = [
  {
    id: 'cd-main',
    label:    'Career Details Document',
    labelKn:  'ವೃತ್ತಿ ವಿವರಗಳ ದಾಖಲೆ',
    labelTa:  'தொழில் விவர ஆவணம்',
    labelHi:  'करियर विवरण दस्तावेज़',
    externalUrl: '/JDs_Final_PDF.pdf',
  },
];
