import { logger } from '@/lib/logger';
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { safeObjectEntries, handleDatabaseError, validateApiResponse } from '@/utils/errorHandler';
import { getTranslatedHollandQuestionByText } from '@/utils/hollandTranslations';

type CategoryKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

const CATEGORY_LABELS: Record<'en' | 'kn' | 'ta' | 'hi', Record<CategoryKey, string>> = {
  en: {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional',
  },
  kn: {
    R: 'ವಾಸ್ತವಿಕ',
    I: 'ವಿಚಾರಣಾತ್ಮಕ',
    A: 'ಕಲಾತ್ಮಕ',
    S: 'ಸಾಮಾಜಿಕ',
    E: 'ಉದ್ಯಮಶೀಲ',
    C: 'ಸಾಂಪ್ರದಾಯಿಕ',
  },
  ta: {
    R: 'நடைமுறை வேலைகள்',
    I: 'ஆராயும் வேலைகள்',
    A: 'கலை சார்ந்த வேலைகள்',
    S: 'மக்களுக்கு உதவும் வேலைகள்',
    E: 'வியாபாரம் / தலைமை வேலைகள்',
    C: 'அலுவலக வேலைகள்',
  },
  hi: {
    R: 'व्यावहारिक',
    I: 'विश्लेषणात्मक',
    A: 'कलात्मक',
    S: 'सामाजिक',
    E: 'उद्यमशील',
    C: 'पारंपरिक',
  },
};

export default function HollandCodeTest({ onCompleted }: { onCompleted?: (code: string) => void }) {
  const { userProfile } = useAuth();
  const { t, lang } = useLang();
  // checkbox for like/interest => true/false
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // Load questions from database
  const [QUESTIONS, setQUESTIONS] = useState<Record<CategoryKey, string[]>>({
    R: [
      'I like to fix a car',
      'I like to build things',
      'I like to take care of animals',
      'I like working outdoors',
      'I like to play a sport',
      'I like to paint a room',
      'I like to cook',
    ],
    I: [
      'I like to do experiments',
      'I like to figure out how things work',
      'I am good with numbers and charts',
      'I enjoy science',
      'I like to do puzzles',
      'I like to analyze things (problems/solutions)',
      'I like to evaluate a crime scene',
    ],
    A: [
      'I like acting in a play',
      'I like to sing or play an instrument',
      'I like to draw',
      'I like to design stage sets',
      'I like to take photographs',
      'I enjoy creative writing',
      'I like to read about art and music',
    ],
    S: [
      'I like to get into discussions about issues',
      'I like trying to help people solve their problems',
      'I like helping people',
      'I like to teach or train people',
      'I like to meet new people',
      'I like to volunteer for a charity',
      'I like to work in teams',
    ],
    E: [
      'I like selling things',
      'I like to start a club',
      'I like to take charge',
      'I like to manage money',
      'I like to lead',
      'I would like to start my own business',
      'I like to give speeches',
    ],
    C: [
      'I follow a recipe',
      'I like to organize things (files, desks/offices)',
      'I like to create a budget',
      'I like to follow instructions',
      'I like to be a bank teller',
      'I would like to work in an office',
      'I am good at keeping records of my work',
    ],
  });

  // Load questions from database
  useEffect(() => {
    const loadQuestionsFromDatabase = async () => {
      try {
        logger.log('🔄 Loading Holland Code questions from database...');
        const { data, error } = await supabase.rpc('get_holland_code_questions');
        
        if (error) {
          handleDatabaseError(error, 'HollandCodeTest');
          throw error;
        }
        
        if (validateApiResponse(data, 'HollandCodeTest')) {
          logger.log('✅ Database questions loaded:', data);
          // Organize questions by category
          const newQuestions: Record<CategoryKey, string[]> = {
            R: [], I: [], A: [], S: [], E: [], C: []
          };
          
          data.forEach((q: any) => {
            if (newQuestions[q.category as CategoryKey]) {
              newQuestions[q.category as CategoryKey].push(q.question_text);
            }
          });
          
          setQUESTIONS(newQuestions);
        } else {
          logger.log('⚠️ No questions found in database, using fallback');
        }
      } catch (error) {
        handleDatabaseError(error, 'HollandCodeTest');
        logger.log('🔄 Using hardcoded fallback questions');
        // Keep default questions if database fails
      }
    };
    
    loadQuestionsFromDatabase();
  }, []);

  const handleToggle = (key: string, val: boolean) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const scores = useMemo(() => {
    const base: Record<CategoryKey, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    (Object.keys(QUESTIONS) as CategoryKey[]).forEach(cat => {
      QUESTIONS[cat].forEach((_, idx) => {
        const k = `${cat}-${idx}`;
        if (answers[k]) base[cat] += 1;
      });
    });
    return base;
  }, [answers]);

  const hollandCode = useMemo(() => {
    const entries = Object.entries(scores) as Array<[CategoryKey, number]>;
    entries.sort((a, b) => b[1] - a[1]);
    return entries.map(e => e[0]).join('').slice(0, 3);
  }, [scores]);

  const reset = () => {
    setAnswers({});
    setResult(null);
  };

  const submit = async () => {
    if (!userProfile?.id) return;
    setSubmitting(true);
    try {
      // Resolve student_id
      let studentId = userProfile.studentProfile?.id as string | undefined;
      if (!studentId) {
        const { data: row } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
        studentId = row?.id;
      }
      if (!studentId) throw new Error('Student profile not found');

      const payload = {
        student_id: studentId,
        test_type: 'holland',
        holland_code: hollandCode,
        raw_scores: scores as any,
        completed_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('psychometric_results')
        .upsert(payload, { onConflict: 'student_id,test_type' as any });
      if (error) throw error;
      setResult(hollandCode);
      onCompleted?.(hollandCode);
    } catch (e) {
      // noop; caller can surface toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg" lang={lang} dir="auto">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-2xl font-bold text-blue-800">
          {lang === 'kn'
            ? '🧭 ಮಾನಸಿಕ ಪರೀಕ್ಷೆಗಳು – ಹಾಲೆಂಡ್ ಕೋಡ್ ಅಸೆಸ್ಮೆಂಟ್'
            : lang === 'ta'
              ? '🧭 மனப்பாங்கு சோதனை – ஹால்லண்ட் கோட் தேர்வு'
              : lang === 'hi'
                ? '🧭 मनोवैज्ञानिक परीक्षण - हॉलैंड कोड मूल्यांकन'
                : '🧭 Psychometric Tests – Holland Code Assessment'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Intro text */}
        <div className="mb-6 text-gray-700 text-sm leading-relaxed">
          <p className="mb-2">
            {lang === 'kn'
              ? 'ಈ ಪ್ರಶ್ನೋತ್ತರಿ ನಿಮ್ಮ ಆಸಕ್ತಿಗಳು, ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಸಾಮರ್ಥ್ಯಕ್ಕೆ ಸೂಕ್ತವಾದ ಉದ್ಯೋಗಗಳನ್ನು ತೋರಿಸಲು ವೈಜ್ಞಾನಿಕ ಹಾಲೆಂಡ್ ಕೋಡ್ ಮಾದರಿಯನ್ನು ಬಳಸುತ್ತದೆ.'
              : lang === 'ta'
                ? 'இந்த சோதனை ஹால்லண்ட் கோட் முறையை பயன்படுத்துகிறது. இது உங்களுக்கு எந்த வகை வேலைகள் பொருத்தம் என்று எளிய முறையில் காட்டும்.'
                : lang === 'hi'
                  ? 'यह प्रश्नोत्तरी आपकी रुचियों, प्रतिभाओं और योग्यता के अनुकूल नौकरियों को दिखाने के लिए वैज्ञानिक हॉलैंड कोड मॉडल का उपयोग करती है।'
                  : 'This quiz uses the scientific Holland Code model to show you which jobs will suit your interests, talents, and aptitude.'}
          </p>
          <p className="mb-2">
            {lang === 'kn'
              ? 'ನೀವು ಚಟುವಟಿಕೆಯನ್ನು ಮಾಡಲು ಕೌಶಲ್ಯಗಳು ಅಥವಾ ತರಬೇತಿ ಹೊಂದಿದ್ದೀರಾ ಎಂಬುದರ ಬಗ್ಗೆ ಅಥವಾ ನೀವು ಎಷ್ಟು ಹಣವನ್ನು ಗಳಿಸಬಹುದು ಎಂಬುದರ ಬಗ್ಗೆ ಚಿಂತಿಸಬೇಡಿ. ನೀವು ಚಟುವಟಿಕೆಯನ್ನು ಮಾಡಲು ಆನಂದಿಸುತ್ತೀರೋ ಅಥವಾ ಇಲ್ಲವೋ ಎಂದು ಯೋಚಿಸಿ.'
              : lang === 'ta'
                ? 'இந்த செயலை செய்ய உங்களிடம் திறமை இருக்கிறதா, எவ்வளவு சம்பளம் கிடைக்கும் என்று யோசிக்க வேண்டாம். அந்த செயலை செய்ய உங்களுக்கு பிடிக்குமா என்று மட்டும் நினைக்கவும்.'
                : lang === 'hi'
                  ? 'इस बात की चिंता न करें कि आपके पास किसी गतिविधि को करने के लिए कौशल या प्रशिक्षण है या नहीं, या आप कितना पैसा कमा सकते हैं। सोचें कि क्या आपको गतिविधि करने में मज़ा आएगा या नहीं।'
                  : 'Do not worry about whether you have the skills or training to do an activity, or how much money you might make. Think whether you would enjoy doing the activity or not.'}
          </p>
          <p className="mb-2">
            {lang === 'kn'
              ? 'ಈ ಪ್ರಶ್ನೋತ್ತರಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸುವುದು ನಿಮಗೆ ಹೆಚ್ಚಿನ ಆಸಕ್ತಿ ಮತ್ತು ಹೆಚ್ಚಿನ ತೃಪ್ತಿಯನ್ನು ಪಡೆಯುವ ಉದ್ಯೋಗಗಳನ್ನು ಗುರುತಿಸಲು ಸಹಾಯ ಮಾಡಬಹುದು ಮತ್ತು ಇದು ನಿಮ್ಮ ವೃತ್ತಿ ಅನ್ವೇಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಲು ಒಂದು ಸ್ಥಳವನ್ನು ನಿಮಗೆ ನೀಡುತ್ತದೆ.'
              : lang === 'ta'
                ? 'இந்த சோதனையை முடித்தால், எந்த வகை வேலைகள் உங்களுக்கு மிகவும் சுவாரஸ்யமாகவும், திருப்தியாகவும் இருக்கும் என்று தெரிந்துகொள்ளலாம். இது உங்கள் தொழில் பற்றி யோசிக்க ஒரு நல்ல தொடக்கம் தரும்.'
                : lang === 'hi'
                  ? 'इस प्रश्नोत्तरी को पूरा करने से आपको उन व्यवसायों के प्रकारों की पहचान करने में मदद मिल सकती है जिनमें आपकी सबसे अधिक रुचि होगी और सबसे अधिक संतुष्टि मिलेगी, और यह आपको अपने करियर की खोज शुरू करने के लिए एक जगह देगा।'
                  : 'Completing this quiz might help you identify the types of occupations in which you would have the most interest and get the most satisfaction, and it will give you a place to start your career exploration.'}
          </p>
          <p className="mt-1">
            {lang === 'kn'
              ? 'ದಯವಿಟ್ಟು ಈ ಗುಂಪುಗಳಲ್ಲಿ ನೀವು ಇಷ್ಟಪಡುವ ಅಥವಾ ಆಸಕ್ತಿ ಹೊಂದಿರುವ ಎಲ್ಲಾ ಚಟುವಟಿಕೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.'
              : lang === 'ta'
                ? 'ஒவ்வொரு குழுவிலும் உங்களுக்கு பிடிக்கும் அல்லது சுவாரஸ்யமாக இருக்கும் செயல்களை எல்லாம் குறி வையுங்கள்.'
                : lang === 'hi'
                  ? 'कृपया इन समूहों में से उन सभी गतिविधियों का चयन करें जिन्हें आप पसंद करते हैं या जिनमें आपकी रुचि है।'
                  : 'Please select all activities that you like or are interested in from each of these groups.'}
          </p>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                <div className="text-sm text-green-800">
                  {lang === 'kn'
                    ? '✅ ನಿಮ್ಮ ಹಾಲೆಂಡ್ ಕೋಡ್'
                    : lang === 'ta'
                      ? '✅ உங்கள் ஹால்லண்ட் கோட்'
                      : lang === 'hi'
                        ? '✅ आपका हॉलैंड कोड'
                        : '✅ Your Holland Code'}
                </div>
              <div className="text-3xl font-bold text-green-900">{result}</div>
            </div>
            <Button variant="outline" onClick={reset} className="border-blue-200 text-blue-700 hover:bg-blue-50">
              {lang === 'kn'
                ? '↻ ಪರೀಕ್ಷೆಯನ್ನು ಮತ್ತೆ ತೆಗೆದುಕೊಳ್ಳಿ'
                : lang === 'ta'
                  ? '↻ சோதனையை மீண்டும் செய்யவும்'
                  : lang === 'hi'
                    ? '↻ परीक्षण पुनः लें'
                    : '↻ Retake Test'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {(Object.keys(QUESTIONS) as CategoryKey[]).map(cat => (
              <div key={cat} className="p-4 bg-white rounded-lg border shadow-sm">
                <div className="text-xl font-semibold mb-2 text-blue-800">
                  {(CATEGORY_LABELS[lang as 'en' | 'kn' | 'ta' | 'hi'] || CATEGORY_LABELS.en)[cat]} ({cat})
                </div>
                <div className="space-y-2">
                  {QUESTIONS[cat].map((q, idx) => {
                    const k = `${cat}-${idx}`;
                    const v = !!answers[k];
                    return (
                      <div key={k} className="flex items-center gap-3 p-3 bg-white rounded border hover:border-blue-200 transition-colors">
                        <input id={k} type="checkbox" checked={v} onChange={(e)=> handleToggle(k, e.target.checked)} className="w-4 h-4" />
                        <label htmlFor={k} className="text-base text-gray-800 cursor-pointer select-none">{getTranslatedHollandQuestionByText(q, lang)}</label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <Button onClick={submit} disabled={submitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                {lang === 'kn' ? '✨ ಸಲ್ಲಿಸಿ' : lang === 'ta' ? '✨ சமர்ப்பிக்கவும்' : lang === 'hi' ? '✨ सबमिट करें' : '✨ Submit'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


