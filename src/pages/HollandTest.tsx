import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/hooks/useLang';
import HollandCodeTest from '@/components/HollandCodeTest';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function HollandTest() {
  const { toast } = useToast();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8" lang={lang} dir="auto">
      <div className="container mx-auto px-4">
        {/* Header with Back Button - matching assessment pages */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              onClick={() => navigate(`/student?lang=${lang}`)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 sm:px-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {lang === 'kn' ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : lang === 'ta' ? 'முதல் பக்கத்திற்கு திரும்பு' : 'Back to Dashboard'}
            </Button>
          </div>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">
              {lang === 'kn'
                ? '🧭 ಮಾನಸಿಕ ಪರೀಕ್ಷೆಗಳು – ಹಾಲೆಂಡ್ ಕೋಡ್ ಅಸೆಸ್ಮೆಂಟ್'
                : lang === 'ta'
                  ? '🧭 மனப்பாங்கு சோதனை – ஹால்லண்ட் கோட் மதிப்பீடு'
                  : '🧭 Psychometric Tests – Holland Code Assessment'}
            </h1>
            <p className="text-blue-600 text-lg">
              {lang === 'kn'
                ? 'ನಿಮ್ಮ ಹಾಲೆಂಡ್ ಕೋಡ್ פרೊಫೈಲ್ ಅನ್ನು ಕಂಡುಹಿಡಿಯಲು ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ಪ್ರಾಮಾಣಿಕವಾಗಿ ಉತ್ತರಿಸಿ.'
                : lang === 'ta'
                  ? 'உங்கள் ஹால்லண்ட் கோட் (RIASEC) வகையை அறிய, எல்லா கேள்விகளுக்கும் நியாயமாக, உண்மையாக பதில் சொல்லுங்கள்.'
                  : 'Answer all questions honestly to discover your Holland Code profile.'}
            </p>
            <p className="text-gray-600 mt-2">
              {lang === 'kn'
                ? 'ನಿಮ್ಮ RIASEC ಪ್ರಕಾರವನ್ನು ಬಹಿರಂಗಪಡಿಸಲು ಪ್ರತಿ ಗುಂಪಿನಲ್ಲಿ ನೀವು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.'
                : lang === 'ta'
                  ? 'ஒவ்வொரு குழுவிலும் உங்களுக்கு பிடித்த செயல்பாடுகளைத் தேர்வு செய்யுங்கள். அதன் அடிப்படையில் உங்கள் RIASEC வகை தெரிய வரும்.'
                  : 'Select activities you enjoy across each group to reveal your RIASEC type.'}
            </p>
          </div>
          <div className="w-20"></div>
        </div>
        <HollandCodeTest
          onCompleted={(code) =>
            toast({
              title: lang === 'kn'
                ? 'ಹಾಲೆಂಡ್ ಕೋಡ್ ಉಳಿಸಲಾಗಿದೆ'
                : lang === 'ta'
                  ? 'ஹால்லண்ட் கோட் சேமிக்கப்பட்டது'
                  : 'Holland Code Saved',
              description: lang === 'kn'
                ? `ನಿಮ್ಮ ಕೋಡ್: ${code}`
                : lang === 'ta'
                  ? `உங்கள் கோட்: ${code}`
                  : `Your code: ${code}`,
            })
          }
        />
      </div>
    </div>
  );
}


