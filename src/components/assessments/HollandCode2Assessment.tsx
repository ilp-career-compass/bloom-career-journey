import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, ArrowLeft, Lock, HelpCircle, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/hooks/useLang';
import { logger } from '@/lib/logger';
import {
  HOLLAND2_QUESTIONS,
  HOLLAND2_MODULE_TITLE,
  HOLLAND2_TITLE_TEXT,
  HOLLAND2_SUBTITLE_TEXT,
  CATEGORY_LABELS_2,
  CategoryKey,
  LangKey,
  Holland2Question,
  HOLLAND2_WHEEL_DATA,
  WheelSectorData
} from '@/data/hollandCode2Data';

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeSector(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", r, r, 0, largeArcFlag, 1, end.x, end.y,
    "Z"
  ].join(" ");
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArcFlag, 1, end.x, end.y
  ].join(" ");
}

export default function HollandCode2Assessment() {
  const { lang } = useLang();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const resolvedLang = (['en', 'kn', 'ta', 'hi'].includes(lang) ? lang : 'en') as LangKey;
  const readOnlyView = ['1', 'true'].includes((searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase());

  // Wizard States
  const [currentStep, setCurrentStep] = useState(0); // 0 for intro, 1 to 6 for wizard, 7 for reflection/submit
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [reflection, setReflection] = useState('');
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('R');

  const isReadOnly = readOnlyView || !!completedAt;

  // Load progress from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('holland_code_2_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.reflection) setReflection(parsed.reflection);
        if (parsed.completed_at) setCompletedAt(parsed.completed_at);
        if (parsed.currentStep && !parsed.completed_at) {
          setCurrentStep(parsed.currentStep);
        }
        logger.log('Loaded Holland Code 2 draft progress:', parsed);
      }
    } catch (e) {
      logger.error('Failed to load Holland Code 2 progress from LocalStorage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save progress draft to LocalStorage when answers/reflection changes
  useEffect(() => {
    if (loading || isReadOnly) return;
    try {
      const payload = {
        answers,
        reflection,
        completed_at: completedAt,
        currentStep,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('holland_code_2_progress', JSON.stringify(payload));
    } catch (e) {
      logger.error('Failed to save Holland Code 2 progress draft:', e);
    }
  }, [answers, reflection, completedAt, currentStep, loading, isReadOnly]);

  // Calculate Scores
  const scores = useMemo(() => {
    const categoryScores: Record<CategoryKey, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    HOLLAND2_QUESTIONS.forEach((q) => {
      if (answers[q.sequenceNumber] === true) {
        categoryScores[q.category] += 1;
      }
    });
    return categoryScores;
  }, [answers]);

  // Calculate Top Three Categories
  const topThreeTypes = useMemo(() => {
    const entries = Object.entries(scores) as Array<[CategoryKey, number]>;
    // Sort descending by score. If equal, category ordering R-I-A-S-E-C resolves
    entries.sort((a, b) => b[1] - a[1]);
    const topThree = entries.slice(0, 3);
    if (topThree.length === 0 || (topThree[0][1] === 0 && topThree[1][1] === 0 && topThree[2][1] === 0)) return '';
    return topThree.map(([key]) => key).join(', ');
  }, [scores]);

  // Get localized categories list for the top types display
  const topThreeTypesFullNames = useMemo(() => {
    if (!topThreeTypes) return '';
    const keys = topThreeTypes.split(', ') as CategoryKey[];
    const labels = CATEGORY_LABELS_2[resolvedLang];
    return keys.map(k => `${labels[k]} (${k})`).join(' & ');
  }, [topThreeTypes, resolvedLang]);

  // Get top three category keys as an array
  const topThreeKeys = useMemo((): CategoryKey[] => {
    if (!topThreeTypes) return [];
    return topThreeTypes.split(', ') as CategoryKey[];
  }, [topThreeTypes]);

  // Set activeCategory to the top match initially when showing Step 7 summary
  useEffect(() => {
    if (currentStep === 7 && topThreeKeys.length > 0) {
      setActiveCategory(topThreeKeys[0]);
    }
  }, [currentStep, topThreeKeys]);

  // Handle Question toggle answers
  const handleAnswerToggle = (sequenceNumber: number) => {
    if (isReadOnly) return;
    setAnswers(prev => ({ ...prev, [sequenceNumber]: !prev[sequenceNumber] }));
  };

  // With direct image click selection, any unselected image is considered "No" by default.
  // Hence, the step is always complete and users can proceed by clicking Next at any time.
  const isCurrentStepComplete = true;

  // Handle Next step transition
  const handleNext = () => {
    if (currentStep < 7 && (isCurrentStepComplete || isReadOnly)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Back step transition
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Submit
  const handleSubmit = () => {
    if (isReadOnly) return;
    try {
      const timestamp = new Date().toISOString();
      const payload = {
        answers,
        reflection,
        completed_at: timestamp,
        currentStep: 7,
        updated_at: timestamp
      };
      localStorage.setItem('holland_code_2_progress', JSON.stringify(payload));
      setCompletedAt(timestamp);
      toast({
        title: resolvedLang === 'kn' ? 'ಹಾಲೆಂಡ್ ಕೋಡ್ 2 ಪೂರ್ಣಗೊಂಡಿದೆ! 🧭' : resolvedLang === 'ta' ? 'ஹாலண்ட் குறியீடு 2 முடிந்தது! 🧭' : resolvedLang === 'hi' ? 'हॉलैंड कोड 2 पूरा हुआ! 🧭' : 'Holland Code 2 Completed! 🧭',
        description: resolvedLang === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!' : resolvedLang === 'ta' ? 'உங்கள் பதில்கள் வெற்றிகரமாக சேமிக்கப்பட்டன!' : resolvedLang === 'hi' ? 'आपके उत्तर सफलतापूर्वक सहेज लिए गए हैं!' : 'Your responses have been successfully saved!',
      });
      navigate(`/student?lang=${resolvedLang}`);
    } catch (e) {
      logger.error('Failed to submit Holland Code 2:', e);
      toast({
        title: 'Error',
        description: 'Failed to save assessment responses.',
        variant: 'destructive'
      });
    }
  };

  const handleRetake = () => {
    if (!window.confirm(resolvedLang === 'kn' ? 'ನೀವು ಈ ಪರೀಕ್ಷೆಯನ್ನು ಮತ್ತೆ ತೆಗೆದುಕೊಳ್ಳಲು ಬಯಸುವಿರಾ? ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಪ್ರಗತಿ ಅಳಿಸಿಹೋಗುತ್ತದೆ.' : resolvedLang === 'ta' ? 'இந்த சோதனையை மீண்டும் செய்ய விரும்புகிறீர்களா? உங்கள் தற்போதைய பதில்கள் அழிக்கப்படும்.' : resolvedLang === 'hi' ? 'क्या आप इस परीक्षा को पुनः लेना चाहते हैं? आपकी वर्तमान प्रगति हटा दी जाएगी।' : 'Are you sure you want to retake this test? Your current progress will be reset.')) return;
    try {
      localStorage.removeItem('holland_code_2_progress');
      setAnswers({});
      setReflection('');
      setCompletedAt(null);
      setCurrentStep(1);
      toast({
        description: resolvedLang === 'kn' ? 'ಪರೀಕ್ಷೆಯನ್ನು ಮರುಹೊಂದಿಸಲಾಗಿದೆ.' : resolvedLang === 'ta' ? 'சோதனை மீட்டமைக்கப்பட்டது.' : resolvedLang === 'hi' ? 'परीक्षण रीसेट कर दिया गया है।' : 'Test has been reset.'
      });
    } catch (e) {
      logger.error('Retake reset failed:', e);
    }
  };

  // Get questions for the current wizard step (1 to 6)
  const currentStepQuestions = useMemo(() => {
    if (currentStep > 6) return [];
    const stepStart = (currentStep - 1) * 6 + 1;
    const stepEnd = currentStep * 6;
    return HOLLAND2_QUESTIONS.filter(
      q => q.sequenceNumber >= stepStart && q.sequenceNumber <= stepEnd
    );
  }, [currentStep]);

  const progressPercentage = useMemo(() => {
    // 6 steps total. Step 7 is summary.
    return Math.min(((currentStep - 1) / 6) * 100, 100);
  }, [currentStep]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading Holland Code 2...</p>
        </div>
      </div>
    );
  }

  // Multilingual labels mapping
  const backLabel = resolvedLang === 'kn' ? 'ಹಿಂದೆ' : resolvedLang === 'ta' ? 'முன்னால்' : resolvedLang === 'hi' ? 'पीछे' : 'Back';
  const nextLabel = resolvedLang === 'kn' ? 'ಮುಂದೆ' : resolvedLang === 'ta' ? 'அடுத்து' : resolvedLang === 'hi' ? 'आगे' : 'Next';
  const submitLabel = resolvedLang === 'kn' ? 'ಸಲ್ಲಿಸಿ' : resolvedLang === 'ta' ? 'சமர்ப்பிக்கவும்' : resolvedLang === 'hi' ? 'जमा करें' : 'Submit';
  const dashboardLabel = resolvedLang === 'kn' ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : resolvedLang === 'ta' ? 'முதல் பக்கத்திற்கு திரும்பு' : resolvedLang === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard';
  const retakeLabel = resolvedLang === 'kn' ? 'ಪರೀಕ್ಷೆಯನ್ನು ಮತ್ತೆ ತೆಗೆದುಕೊಳ್ಳಿ' : resolvedLang === 'ta' ? 'சோதனையை மீண்டும் செய்யவும்' : resolvedLang === 'hi' ? 'परीक्षण पुनः लें' : 'Retake Test';
  
  const yesLabel = resolvedLang === 'kn' ? 'ಹೌದು (✔)' : resolvedLang === 'ta' ? 'ஆம் (✔)' : resolvedLang === 'hi' ? 'हाँ (✔)' : 'Yes (✔)';
  const noLabel = resolvedLang === 'kn' ? 'ಇಲ್ಲ (✗)' : resolvedLang === 'ta' ? 'இல்லை (✗)' : resolvedLang === 'hi' ? 'नहीं (✗)' : 'No (✗)';

  const answersNotCompleteWarning = resolvedLang === 'kn' ? 'ಮುಂದುವರೆಯಲು ಎಲ್ಲಾ 6 ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ' : resolvedLang === 'ta' ? 'தொடர அனைத்து 6 கேள்விகளுக்கும் பதிலளிக்கவும்' : resolvedLang === 'hi' ? 'आगे बढ़ने के लिए सभी 6 प्रश्नों के उत्तर दें' : 'Answer all 6 questions to proceed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8" lang={resolvedLang} dir="auto">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header Back Button */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/student?lang=${resolvedLang}`)}
            className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {dashboardLabel}
          </Button>
          {completedAt && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {resolvedLang === 'kn' ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : resolvedLang === 'ta' ? 'முடிந்தது' : resolvedLang === 'hi' ? 'पूर्ण' : 'Completed'}
            </Badge>
          )}
        </div>

        {/* Title Block */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-900 mb-4 tracking-tight leading-snug md:text-4xl">
            🧭 {HOLLAND2_MODULE_TITLE[resolvedLang]}
          </h1>
          <p className="text-blue-700 text-lg max-w-3xl mx-auto mb-6">
            {HOLLAND2_TITLE_TEXT[resolvedLang]}
          </p>

          {currentStep === 0 && (
            <div className="text-left bg-white/70 backdrop-blur-sm border border-blue-100 rounded-xl p-8 shadow-sm max-w-3xl mx-auto text-gray-700 text-sm leading-relaxed whitespace-pre-line space-y-4">
              <p className="font-semibold text-blue-800 text-base mb-1">
                {resolvedLang === 'kn' ? 'ಪರಿಚಯ ಮತ್ತು ವಿವರಗಳು:' : resolvedLang === 'ta' ? 'அறிமுகம் & விளக்கம்:' : resolvedLang === 'hi' ? 'परिचय और विवरण:' : 'Introduction & Explanation:'}
              </p>
              <div className="text-gray-700">
                {HOLLAND2_SUBTITLE_TEXT[resolvedLang]}
              </div>
              
              <div className="mt-8 pt-4 flex justify-center border-t border-blue-50/50">
                <Button 
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-bold rounded-full shadow-md transition-transform hover:scale-105"
                >
                  {resolvedLang === 'kn' ? 'ಮೌಲ್ಯಮಾಪನ ಪ್ರಾರಂಭಿಸಿ' : resolvedLang === 'ta' ? 'மதிப்பீட்டைத் தொடங்கவும்' : resolvedLang === 'hi' ? 'मूल्यांकन शुरू करें' : 'Start Assessment'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Tracker (Steps 1 to 6) */}
        {currentStep >= 1 && currentStep <= 6 && (
          <Card className="mb-8 border-0 shadow-md bg-white/90 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-800">
                  {resolvedLang === 'kn' ? `ಹಂತ ${currentStep} / 6` : resolvedLang === 'ta' ? `படி ${currentStep} / 6` : resolvedLang === 'hi' ? `चरण ${currentStep} / 6` : `Step ${currentStep} of 6`}
                </span>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                  {Math.round(progressPercentage)}% {resolvedLang === 'kn' ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : resolvedLang === 'ta' ? 'முடிந்தது' : resolvedLang === 'hi' ? 'पूर्ण' : 'Complete'}
                </Badge>
              </div>
              <Progress value={progressPercentage} className="h-2.5 bg-blue-100" />
            </CardContent>
          </Card>
        )}

        {/* Wizard Step Questionnaire (Steps 1 to 6) */}
        {currentStep >= 1 && currentStep <= 6 && (
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentStepQuestions.map((q) => {
                const isSelected = answers[q.sequenceNumber] === true;

                return (
                  <Card
                    key={q.sequenceNumber}
                    onClick={() => handleAnswerToggle(q.sequenceNumber)}
                    className={`border transition-all duration-300 overflow-hidden flex flex-col justify-between select-none ${
                      isReadOnly 
                        ? '' 
                        : 'cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:border-blue-400'
                    } ${
                      isSelected 
                        ? 'border-green-500 ring-2 ring-green-100 bg-green-50/20 shadow-md scale-[1.01]' 
                        : 'border-gray-200'
                    }`}
                  >
                    {/* Card Image */}
                    <div className="relative h-44 w-full bg-gray-100 flex-shrink-0">
                      <img
                        src={`/holland_code_images/${q.image}`}
                        alt={`Question ${q.sequenceNumber}`}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-102"
                        onError={(e) => {
                          // Fallback if image fails to load
                          logger.error(`Failed to load image: /holland_code_images/${q.image}`);
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=400&auto=format&fit=crop&q=60';
                        }}
                      />
                      
                      {/* Selection Checkmark Overlay */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10 bg-green-600 text-white rounded-full p-1 shadow-md flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 fill-white text-green-600" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-gray-700 shadow-sm border font-bold">
                          Q{q.sequenceNumber}
                        </Badge>
                      </div>
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-3 flex-grow flex flex-col justify-center">
                      <div>
                        {/* Question Text */}
                        <p className="text-sm font-medium text-gray-800 leading-snug">
                          {q.question[resolvedLang]}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Step Navigation Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="px-4 py-2 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                {backLabel}
              </Button>

              {!isReadOnly && (
                <span className="text-xs text-blue-700 font-medium flex items-center gap-1 text-center px-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>
                    {resolvedLang === 'kn' ? 'ಆಯ್ಕೆ ಮಾಡಲು/ರದ್ದುಗೊಳಿಸಲು ಚಿತ್ರಗಳ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ 👆' :
                     resolvedLang === 'ta' ? 'கார்டுகளைத் தேர்ந்தெடுக்க/நீக்க அவற்றைக் கிளிக் செய்யவும் 👆' :
                     resolvedLang === 'hi' ? 'चुनने या हटाने के लिए कार्डों पर क्लिक करें 👆' :
                     'Click directly on cards to select or deselect activities 👆'}
                  </span>
                </span>
              )}

              <Button
                onClick={handleNext}
                className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 flex items-center gap-1.5"
              >
                {nextLabel}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 7: Scoreboard Summary & Reflection Page */}
        {currentStep === 7 && (
          <div className="space-y-6 mb-8">
            
            {/* Scoreboard Table */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                  📊 {resolvedLang === 'kn' ? 'ಅಂಕಪಟ್ಟಿ - ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗಳು' : resolvedLang === 'ta' ? 'மதிப்பெண் பலகை - உங்கள் பதில்கள்' : resolvedLang === 'hi' ? 'स्कोरबोर्ड - आपकी प्रतिक्रियाएँ' : 'Scoreboard - Your Responses'}
                </CardTitle>
                <CardDescription className="text-blue-700 text-sm">
                  {resolvedLang === 'kn' ? 'ಪ್ರತಿ ವರ್ಗಕ್ಕೆ "ಹೌದು" ಪ್ರತಿಕ್ರಿಯೆಗಳ ಒಟ್ಟು ಸಂಖ್ಯೆ' : resolvedLang === 'ta' ? 'ஒவ்வொரு வகைக்கும் "ஆம்" பதில்களின் மொத்த எண்ணிக்கை' : resolvedLang === 'hi' ? 'प्रत्येक श्रेणी के लिए "हाँ" प्रतिक्रियाओं की कुल संख्या' : 'Total number of "Yes" responses for each personality category'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-50/50">
                        <th className="border-b border-blue-100 p-3 text-left font-semibold text-blue-800">
                          {resolvedLang === 'kn' ? 'ವ್ಯಕ್ತಿತ್ವದ ಪ್ರಕಾರ (RIASEC)' : resolvedLang === 'ta' ? 'ஆளுமை வகை (RIASEC)' : resolvedLang === 'hi' ? 'व्यक्तित्व प्रकार (RIASEC)' : 'Personality Type (RIASEC)'}
                        </th>
                        <th className="border-b border-blue-100 p-3 text-center font-semibold text-blue-800">
                          {resolvedLang === 'kn' ? 'ಪ್ರಶ್ನೆ ಸಂಖ್ಯೆಗಳು' : resolvedLang === 'ta' ? 'கேள்வி எண்கள்' : resolvedLang === 'hi' ? 'प्रश्न संख्या' : 'Question Numbers'}
                        </th>
                        <th className="border-b border-blue-100 p-3 text-center font-semibold text-blue-800">
                          {resolvedLang === 'kn' ? 'ಒಟ್ಟು ಅಂಕಗಳು' : resolvedLang === 'ta' ? 'மொத்த மதிப்பெண்கள்' : resolvedLang === 'hi' ? 'कुल अंक' : 'Total Yes Marks'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['R', 'I', 'A', 'S', 'E', 'C'] as CategoryKey[]).map((category) => {
                        const questionNums = HOLLAND2_QUESTIONS.filter(q => q.category === category).map(q => q.sequenceNumber);
                        const score = scores[category];
                        const categoryLabel = CATEGORY_LABELS_2[resolvedLang][category];
                        return (
                          <tr key={category} className="hover:bg-blue-50/30 transition-colors">
                            <td className="border-b border-gray-100 p-3 font-medium text-gray-800">{categoryLabel} ({category})</td>
                            <td className="border-b border-gray-100 p-3 text-center text-gray-500 text-sm">
                              {questionNums.join(', ')}
                            </td>
                            <td className="border-b border-gray-100 p-3 text-center">
                              <div className="font-bold text-lg text-blue-800 bg-blue-50 px-2 py-0.5 rounded inline-block min-w-[32px]">
                                {score}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Computed Top Personality Types */}
                {topThreeTypes && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                      🌟 {resolvedLang === 'kn' ? 'ನಿಮ್ಮ ಉನ್ನತ ಮೂರು ವ್ಯಕ್ತಿತ್ವ ಪ್ರಕಾರಗಳು:' : resolvedLang === 'ta' ? 'உங்கள் சிறந்த மூன்று ஆளுமை வகைகள்:' : resolvedLang === 'hi' ? 'आपके शीर्ष तीन व्यक्तित्व प्रकार:' : 'Your Top Three Personality Types:'}
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {topThreeTypesFullNames}
                    </p>
                    <p className="text-xs text-blue-600/80 mt-1">
                      {resolvedLang === 'kn' ? 'ಹಾಲೆಂಡ್ ಕೋಡ್ ಸಿದ್ಧಾಂತದ ಪ್ರಕಾರ ಇವು ನಿಮ್ಮ ಪ್ರಮುಖ ಆಸಕ್ತಿಯ ವಲಯಗಳಾಗಿವೆ.' : resolvedLang === 'ta' ? 'ஹாலண்ட் கோட்பாட்டின் படி இவை உங்கள் முக்கிய ஆர்வமுள்ள துறைகள்.' : resolvedLang === 'hi' ? 'हॉलैंड सिद्धांत के अनुसार ये आपके मुख्य रुचि के क्षेत्र हैं।' : 'According to Holland theory, these represent your primary fields of occupational interest.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interactive RIASEC Career Interest Wheel */}
            <Card className="border-0 shadow-md overflow-hidden bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-50/50">
                <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                  🧭 {resolvedLang === 'kn' ? 'ನಿಮ್ಮ ವೃತ್ತಿ ಆಸಕ್ತಿ ಚಕ್ರ (RIASEC)' : resolvedLang === 'ta' ? 'உங்கள் தொழில் ஆர்வச் சக்கரம் (RIASEC)' : resolvedLang === 'hi' ? 'आपका करियर रुचि चक्र (RIASEC)' : 'Your Career Interest Wheel (RIASEC)'}
                </CardTitle>
                <CardDescription className="text-blue-700 text-sm">
                  {resolvedLang === 'kn' ? 'ಚಕ್ರದ ಭಾಗಗಳ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಸ್ಪರ್ಶಿಸಿ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಪಡೆಯಿರಿ. ನಕ್ಷತ್ರ ಚಿಹ್ನೆಗಳು ನಿಮ್ಮ ಪ್ರಮುಖ ಆಸಕ್ತಿಗಳನ್ನು ಸೂಚಿಸುತ್ತವೆ.' :
                   resolvedLang === 'ta' ? 'அதிக விவரங்களைக் காண சக்கரத்தின் பகுதிகளைத் தொடவும்/கிளிக் செய்யவும். நட்சத்திரங்கள் உங்களின் முதன்மை ஆர்வங்களைக் காட்டுகின்றன.' :
                   resolvedLang === 'hi' ? 'अधिक विवरण देखने के लिए चक्र के क्षेत्रों पर क्लिक या स्पर्श करें। सितारे आपकी प्राथमिक रुचियों को दर्शाते हैं।' :
                   'Hover or click on the wheel segments to explore. Stars indicate your top personality matches.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                
                {/* Embed custom styles for keyframes & animations */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes pulse-highlight {
                    0% {
                      filter: drop-shadow(0 0 2px rgba(234, 179, 8, 0.45)) brightness(1.01);
                    }
                    50% {
                      filter: drop-shadow(0 0 10px rgba(234, 179, 8, 0.85)) brightness(1.05);
                    }
                    100% {
                      filter: drop-shadow(0 0 2px rgba(234, 179, 8, 0.45)) brightness(1.01);
                    }
                  }
                  .pulse-sector-top {
                    animation: pulse-highlight 2.5s infinite ease-in-out;
                  }
                  .wheel-spin-in {
                    animation: wheel-spin-in-key 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                  }
                  @keyframes wheel-spin-in-key {
                    0% {
                      transform: rotate(-90deg) scale(0.9);
                      opacity: 0;
                    }
                    100% {
                      transform: rotate(0deg) scale(1);
                      opacity: 1;
                    }
                  }
                ` }} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Wheel Column */}
                  <div className="lg:col-span-7 flex flex-col items-center justify-center">
                    <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center p-2 bg-gradient-to-br from-white to-gray-50/50 rounded-full border border-gray-100 shadow-inner">
                      
                      {/* SVG Canvas */}
                      <svg
                        viewBox="0 0 500 500"
                        className="w-full h-full wheel-spin-in select-none"
                        style={{ transformOrigin: 'center center' }}
                      >
                        {/* Define curved paths for outer arrow texts */}
                        <defs>
                          {HOLLAND2_WHEEL_DATA.map((sector, idx) => {
                            const startAngle = idx * 60;
                            const endAngle = (idx + 1) * 60;
                            
                            // Define path for outer label text curvature (Radius = 203)
                            const pathD = describeArc(250, 250, 203, startAngle + 6, endAngle - 10);
                            return (
                              <path
                                key={`arc-path-${sector.category}`}
                                id={`arc-path-${sector.category}`}
                                d={pathD}
                                fill="none"
                              />
                            );
                          })}
                        </defs>

                        {/* 1. DRAW INNER SECTORS (PIE CHART) */}
                        {HOLLAND2_WHEEL_DATA.map((sector, idx) => {
                          const startAngle = idx * 60;
                          const endAngle = (idx + 1) * 60;
                          const bisectorAngle = (startAngle + endAngle) / 2;
                          const isHovered = activeCategory === sector.category;
                          
                          // Check if this sector is one of the top matches
                          const isPrimaryMatch = topThreeKeys[0] === sector.category;
                          const isSecondaryMatch = topThreeKeys[1] === sector.category;
                          const isTertiaryMatch = topThreeKeys[2] === sector.category;
                          const isTopMatch = isPrimaryMatch || isSecondaryMatch || isTertiaryMatch;
                          
                          return (
                            <g
                              key={`sector-group-${sector.category}`}
                              onClick={() => setActiveCategory(sector.category)}
                              className={`cursor-pointer transition-all duration-300 ${isTopMatch ? 'pulse-sector-top' : ''}`}
                              style={{
                                transformOrigin: '250px 250px',
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                filter: isHovered ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.18))' : 'none',
                                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease'
                              }}
                            >
                              {/* Sector Slice */}
                              <path
                                d={describeSector(250, 250, 175, startAngle, endAngle)}
                                fill={sector.color}
                                fillOpacity={isHovered ? 0.95 : 0.82}
                                stroke="#FFFFFF"
                                strokeWidth="4"
                                className="transition-all duration-300"
                              />

                              {/* Sector Text Labels */}
                              <g transform={`translate(250, 250) rotate(${bisectorAngle})`}>
                                {/* Category Code (e.g. REALISTIC) */}
                                <text
                                  x="0"
                                  y="-140"
                                  textAnchor="middle"
                                  fill="#1e293b"
                                  fontWeight="800"
                                  fontSize="9"
                                  className="tracking-wider"
                                >
                                  {sector.category === 'R' ? 'REALISTIC' :
                                   sector.category === 'I' ? 'INVESTIGATIVE' :
                                   sector.category === 'A' ? 'ARTISTIC' :
                                   sector.category === 'S' ? 'SOCIAL' :
                                   sector.category === 'E' ? 'ENTERPRISING' : 'CONVENTIONAL'}
                                </text>

                                {/* Sample Jobs Bracket */}
                                <text
                                  x="0"
                                  y="-126"
                                  textAnchor="middle"
                                  fill="#475569"
                                  fontWeight="700"
                                  fontSize="6.5"
                                  opacity="0.85"
                                >
                                  (Sample Jobs)
                                </text>

                                {/* Sample Jobs List inside slice */}
                                {sector.jobs.en.slice(0, 3).map((job, jobIdx) => (
                                  <text
                                    key={jobIdx}
                                    x="0"
                                    y={-112 + jobIdx * 12}
                                    textAnchor="middle"
                                    fill="#0f172a"
                                    fontWeight="500"
                                    fontSize="7.5"
                                  >
                                    {job}
                                  </text>
                                ))}

                                {/* Match indicator Star inside slice */}
                                {isTopMatch && (
                                  <text
                                    x="0"
                                    y="-70"
                                    textAnchor="middle"
                                    fill={isPrimaryMatch ? '#d97706' : '#b45309'}
                                    fontSize="12"
                                    fontWeight="bold"
                                    className="animate-bounce"
                                  >
                                    ⭐
                                  </text>
                                )}
                              </g>
                            </g>
                          );
                        })}

                        {/* 2. DRAW OUTER BANNERS & LABELS (THE CURVED ARROWS) */}
                        {HOLLAND2_WHEEL_DATA.map((sector, idx) => {
                          const startAngle = idx * 60;
                          const endAngle = (idx + 1) * 60;
                          const isHovered = activeCategory === sector.category;

                          // Compute outer banners geometry (Radius = 205)
                          const arcBannerD = describeArc(250, 250, 205, startAngle + 3, endAngle - 8);

                          // Arrow head polygon at the clockwise end
                          const tip = polarToCartesian(250, 250, 205, endAngle - 1);
                          const baseInner = polarToCartesian(250, 250, 205 - 10, endAngle - 7);
                          const baseOuter = polarToCartesian(250, 250, 205 + 10, endAngle - 7);

                          const labelColor = sector.category === 'I' ? '#78350F' : '#FFFFFF';

                          return (
                            <g
                              key={`outer-banner-${sector.category}`}
                              onClick={() => setActiveCategory(sector.category)}
                              className="cursor-pointer"
                              style={{
                                transformOrigin: '250px 250px',
                                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                                transition: 'transform 0.3s ease'
                              }}
                            >
                              {/* Curved ribbon banner */}
                              <path
                                d={arcBannerD}
                                fill="none"
                                stroke={sector.color}
                                strokeWidth="18"
                                className="transition-opacity duration-300"
                                strokeOpacity={isHovered ? 1 : 0.85}
                              />

                              {/* Arrow Head polygon */}
                              <polygon
                                points={`${tip.x},${tip.y} ${baseInner.x},${baseInner.y} ${baseOuter.x},${baseOuter.y}`}
                                fill={sector.color}
                                fillOpacity={isHovered ? 1 : 0.85}
                              />

                              {/* Curved Text inside banner */}
                              <text
                                fill={labelColor}
                                fontSize={resolvedLang === 'en' ? '10' : '8'}
                                fontWeight="800"
                                letterSpacing="0.5"
                              >
                                <textPath
                                  href={`#arc-path-${sector.category}`}
                                  startOffset="50%"
                                  textAnchor="middle"
                                >
                                  {sector.synonym[resolvedLang]}
                                </textPath>
                              </text>
                            </g>
                          );
                        })}

                        {/* Central Hub Circle (White core) */}
                        <circle
                          cx="250"
                          cy="250"
                          r="18"
                          fill="#FFFFFF"
                          stroke="#E2E8F0"
                          strokeWidth="2"
                        />
                        <circle
                          cx="250"
                          cy="250"
                          r="6"
                          fill="#64748B"
                        />
                      </svg>
                    </div>

                    {/* Quick Selection Buttons below the wheel */}
                    <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-md">
                      {HOLLAND2_WHEEL_DATA.map((sector) => {
                        const isSelected = activeCategory === sector.category;
                        const isTop = topThreeKeys.includes(sector.category);
                        const label = CATEGORY_LABELS_2[resolvedLang][sector.category];
                        
                        return (
                          <Button
                            key={sector.category}
                            type="button"
                            variant="outline"
                            onClick={() => setActiveCategory(sector.category)}
                            className="h-8 px-2.5 text-xs flex items-center gap-1 rounded-full transition-all"
                            style={{
                              borderColor: isSelected ? sector.borderColor : '#E2E8F0',
                              backgroundColor: isSelected ? sector.bgColor : '#FFFFFF',
                              color: isSelected ? sector.borderColor : '#475569',
                              fontWeight: isSelected ? '700' : '500',
                              boxShadow: isSelected ? `0 0 10px ${sector.bgColor}` : 'none'
                            }}
                          >
                            <span>{label}</span>
                            {isTop && <span className="text-[10px] text-amber-500">★</span>}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details Column */}
                  <div className="lg:col-span-5">
                    {(() => {
                      const selectedSector = HOLLAND2_WHEEL_DATA.find(s => s.category === activeCategory)!;
                      const score = scores[activeCategory];
                      const isPrimary = topThreeKeys[0] === activeCategory;
                      const isSecondary = topThreeKeys[1] === activeCategory;
                      const isTertiary = topThreeKeys[2] === activeCategory;
                      const isTop = isPrimary || isSecondary || isTertiary;
                      const label = CATEGORY_LABELS_2[resolvedLang][activeCategory];

                      return (
                        <div
                          className="rounded-2xl p-6 border transition-all duration-300 relative overflow-hidden"
                          style={{
                            borderColor: `${selectedSector.color}30`,
                            backgroundColor: selectedSector.bgColor,
                            boxShadow: `0 10px 25px -5px ${selectedSector.color}08`
                          }}
                        >
                          {/* Top Highlight Badge */}
                          {isTop && (
                            <div className="absolute top-4 right-4">
                              <Badge
                                className="text-xs border-0 text-white shadow-sm flex items-center gap-1"
                                style={{
                                  backgroundColor: isPrimary ? '#d97706' : isSecondary ? '#b45309' : '#92400e'
                                }}
                              >
                                🌟 {isPrimary ? 
                                    (resolvedLang === 'kn' ? 'ಪ್ರಮುಖ ಹೊಂದಾಣಿಕೆ' : resolvedLang === 'ta' ? 'முதன்மை பொருத்தம்' : resolvedLang === 'hi' ? 'मुख्य मिलान' : 'Primary Match') :
                                    isSecondary ?
                                    (resolvedLang === 'kn' ? 'ದ್ವಿತೀಯ ಹೊಂದಾಣಿಕೆ' : resolvedLang === 'ta' ? 'இரண்டாம் பொருத்தம்' : resolvedLang === 'hi' ? 'द्वितीयक मिलान' : 'Secondary Match') :
                                    (resolvedLang === 'kn' ? 'ತೃತೀಯ ಹೊಂದಾಣಿಕೆ' : resolvedLang === 'ta' ? 'மூன்றாம் பொருத்தம்' : resolvedLang === 'hi' ? 'तृतीयक मिलान' : 'Tertiary Match')
                                   }
                              </Badge>
                            </div>
                          )}

                          {/* Category Header */}
                          <div className="mb-4">
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded tracking-wide text-white inline-block mb-1 shadow-sm"
                              style={{ backgroundColor: selectedSector.color }}
                            >
                              {selectedSector.category}
                            </span>
                            <h3
                              className="text-2xl font-extrabold tracking-tight"
                              style={{ color: selectedSector.borderColor }}
                            >
                              {label}
                            </h3>
                            <p className="text-sm font-semibold text-gray-500 uppercase mt-0.5 tracking-wider">
                              {selectedSector.synonym[resolvedLang]}
                            </p>
                          </div>

                          {/* Score Bar */}
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100 shadow-sm mb-4">
                            <div className="flex justify-between items-center mb-1 text-xs font-bold text-gray-600">
                              <span>{resolvedLang === 'kn' ? 'ನಿಮ್ಮ ಅಂಕಗಳು:' : resolvedLang === 'ta' ? 'உங்கள் மதிப்பெண்:' : resolvedLang === 'hi' ? 'आपका स्कोर:' : 'Your Mark Score:'}</span>
                              <span style={{ color: selectedSector.borderColor }}>{score} / 6</span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${(score / 6) * 100}%`,
                                  backgroundColor: selectedSector.color
                                }}
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-gray-700 text-sm leading-relaxed mb-6 bg-white/40 p-3.5 rounded-xl border border-white/50 backdrop-blur-sm">
                            {selectedSector.description[resolvedLang]}
                          </p>

                          {/* Sample Occupations List */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                              💼 {resolvedLang === 'kn' ? 'ಉದಾಹರಣೆ ಉದ್ಯೋಗಗಳು:' : resolvedLang === 'ta' ? 'உதாரண தொழில்கள்:' : resolvedLang === 'hi' ? 'उदाहरण नौकरियां:' : 'Sample Occupations:'}
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedSector.jobs[resolvedLang].map((job, jIdx) => (
                                <span
                                  key={jIdx}
                                  className="text-xs bg-white text-gray-700 font-medium px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm hover:scale-105 transition-transform"
                                >
                                  {job}
                                </span>
                              ))}
                            </div>
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                </div>

              </CardContent>
            </Card>

            {/* Reflection Text Area */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-xl text-blue-900">
                  💭 {resolvedLang === 'kn' ? 'ವಿದ್ಯಾರ್ಥಿ ಪ್ರತಿಫಲನ' : resolvedLang === 'ta' ? 'மாணவர் சிந்தனைப் பிரதிபலிப்பு' : resolvedLang === 'hi' ? 'छात्र विचार-मंथन' : 'Student Reflection'}
                </CardTitle>
                <CardDescription className="text-blue-700 text-sm">
                  {resolvedLang === 'kn' ? 'ನಿಮ್ಮ ಫಲಿತಾಂಶದ ಬಗ್ಗೆ ಯೋಚಿಸಿ ಮತ್ತು ಉತ್ತರಿಸಿ' : resolvedLang === 'ta' ? 'உங்கள் முடிவுகள் குறித்து யோசித்து எழுதவும்' : resolvedLang === 'hi' ? 'अपने परिणामों पर विचार करें और लिखें' : 'Think about your results and share your opinion'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  {resolvedLang === 'kn'
                    ? 'ನಿಮ್ಮ ಉನ್ನತ ವ್ಯಕ್ತಿತ್ವ ಪ್ರಕಾರಗಳನ್ನು ನೀವು ಒಪ್ಪುತ್ತೀರಾ? ಹಾಗಿದ್ದರೆ, ಏಕೆ? ಇಲ್ಲದಿದ್ದರೆ, ಏಕೆ ಇಲ್ಲ?'
                    : resolvedLang === 'ta'
                      ? 'உங்கள் சிறந்த ஆளுமை வகைகளை நீங்கள் ஒப்புக்கொள்கிறீர்களா? ஆம் என்றால், ஏன்? இல்லையென்றால், ஏன் இல்லை?'
                      : resolvedLang === 'hi'
                        ? 'क्या आप अपने शीर्ष व्यक्तित्व प्रकारों से सहमत हैं? यदि हाँ, तो क्यों? यदि नहीं, तो क्यों नहीं?'
                        : 'Do you agree with your top personality types? If so, why? If not, why not?'}
                </label>
                <Textarea
                  value={reflection}
                  onChange={(e) => { if (!isReadOnly) setReflection(e.target.value); }}
                  disabled={isReadOnly}
                  placeholder={
                    resolvedLang === 'kn' ? 'ನಿಮ್ಮ ಚಿಂತನೆಗಳನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...' :
                    resolvedLang === 'ta' ? 'உங்கள் கருத்தை இங்கே எழுதவும்...' :
                    resolvedLang === 'hi' ? 'अपने विचार यहाँ लिखें...' :
                    'Write your reflection here...'
                  }
                  rows={4}
                  className="text-base border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-100"
                />
              </CardContent>
            </Card>

            {/* Back, Retake, and Submit Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrev}
                className="px-4 py-2 flex items-center gap-1.5 w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                {backLabel}
              </Button>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-end">
                {completedAt && (
                  <Button
                    variant="destructive"
                    onClick={handleRetake}
                    className="px-4 py-2 flex items-center gap-1.5 w-full sm:w-auto"
                  >
                    {retakeLabel}
                  </Button>
                )}

                {!isReadOnly && (
                  <Button
                    onClick={handleSubmit}
                    disabled={!reflection.trim()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-2.5 text-base flex items-center justify-center gap-1.5 w-full sm:w-auto shadow-md"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {submitLabel}
                  </Button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
