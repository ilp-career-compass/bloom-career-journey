import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useLang } from '@/hooks/useLang';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  CheckCircle,
  Heart,
  Music,
  Palette,
  BookOpen,
  Gamepad2,
  Camera,
  Dumbbell,
  ArrowLeft,
  Save,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssessmentService, AssessmentTemplate } from '@/services/assessmentService';

interface Hobby {
  id: string;
  name: string;
  description: string;
  timeSpent: string;
  enjoyment: string;
  skills: string;
}

interface HobbiesAssessmentResponse {
  hobbies: Hobby[];
}

export default function MyHobbiesAssessmentDB() {
  const { userProfile } = useAuth();
  const { lang } = useLang();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const readOnlyView = ['1', 'true'].includes((searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase());
  const [assessmentTemplate, setAssessmentTemplate] = useState<AssessmentTemplate | null>(null);
  const [responses, setResponses] = useState<HobbiesAssessmentResponse>({
    hobbies: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});

  const helpKey = (questionIndex: number) => `question${questionIndex}`;
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));

  // Load assessment data from database
  useEffect(() => {
    const loadAssessmentData = async () => {
      try {
        setLoading(true);
        const template = await AssessmentService.getAssessmentTemplate('hobbies');

        if (template) {
          setAssessmentTemplate(template);

          // Initialize with one empty hobby
          setResponses({
            hobbies: [{
              id: '1',
              name: '',
              description: '',
              timeSpent: '',
              enjoyment: '',
              skills: ''
            }]
          });
        }
      } catch (error) {
        logger.error('Error loading assessment data:', error);
        toast({
          title: "Error",
          description: "Failed to load assessment data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAssessmentData();
  }, []);

  // Check for existing responses on load
  useEffect(() => {
    const checkExistingResponse = async () => {
      if (!userProfile || loading) return;

      try {
        let studentId = userProfile.studentProfile?.id as string | undefined;
        if (!studentId) {
          const { data: studentRow } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', userProfile.id)
            .maybeSingle();
          studentId = studentRow?.id;
        }
        if (!studentId) return;

        const { data: existing } = await supabase
          .from('assessment_responses')
          .select('responses, completed_at')
          .eq('student_id', studentId)
          .eq('assessment_type', 'hobbies')
          .eq('assessment_title', 'My Talents and Hobbies')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          if (existing.responses) {
            setResponses(existing.responses);
          }
          if (existing.completed_at) {
            setIsCompleted(true);
          }
        }
      } catch (error) {
        logger.error('Error checking existing response:', error);
      }
    };

    checkExistingResponse();
  }, [userProfile, loading]);

  // Auto-save draft on changes (debounced)
  useEffect(() => {
    if (loading || isCompleted) return;
    const t = setTimeout(async () => {
      try {
        if (!userProfile?.id) return;
        let studentId = userProfile.studentProfile?.id as string | undefined;
        if (!studentId) {
          const { data: studentRow } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', userProfile.id)
            .maybeSingle();
          studentId = studentRow?.id;
        }
        if (!studentId) return;
        await supabase.from('assessment_responses').upsert({
          student_id: studentId,
          assessment_type: 'hobbies',
          assessment_title: 'My Talents and Hobbies',
          responses,
          updated_at: new Date().toISOString(),
          completed_at: null
        }, { onConflict: 'student_id,assessment_type' });
      } catch { }
    }, 800);
    return () => clearTimeout(t);
  }, [responses, loading, isCompleted, userProfile]);

  const handleHobbyChange = (index: number, field: keyof Hobby, value: string) => {
    setResponses(prev => ({
      ...prev,
      hobbies: prev.hobbies.map((hobby, i) =>
        i === index ? { ...hobby, [field]: value } : hobby
      )
    }));
  };

  const addHobby = () => {
    setResponses(prev => ({
      ...prev,
      hobbies: [...prev.hobbies, {
        id: Date.now().toString(),
        name: '',
        description: '',
        timeSpent: '',
        enjoyment: '',
        skills: ''
      }]
    }));
  };

  const removeHobby = (index: number) => {
    if (responses.hobbies.length > 1) {
      setResponses(prev => ({
        ...prev,
        hobbies: prev.hobbies.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async () => {
    if (!userProfile) return;

    setSubmitting(true);
    try {
      let studentId = userProfile.studentProfile?.id as string | undefined;
      if (!studentId) {
        const { data: studentRow } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userProfile.id)
          .maybeSingle();
        studentId = studentRow?.id;
      }
      if (!studentId) throw new Error('Student ID not found');

      await supabase.from('assessment_responses').upsert({
        student_id: studentId,
        assessment_type: 'hobbies',
        assessment_title: 'My Talents and Hobbies',
        responses,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id,assessment_type' });

      setIsCompleted(true);
      toast({
        title: "Assessment Completed",
        description: "Your hobbies assessment has been submitted successfully.",
      });
    } catch (error) {
      logger.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isComplete = () => {
    return responses.hobbies.every(hobby =>
      hobby.name.trim() !== '' &&
      hobby.description.trim() !== '' &&
      hobby.timeSpent.trim() !== '' &&
      hobby.enjoyment.trim() !== '' &&
      hobby.skills.trim() !== ''
    );
  };

  const getHobbyIcon = (hobbyName: string) => {
    const name = hobbyName.toLowerCase();
    if (name.includes('music') || name.includes('sing') || name.includes('dance')) return <Music className="h-5 w-5" />;
    if (name.includes('art') || name.includes('draw') || name.includes('paint')) return <Palette className="h-5 w-5" />;
    if (name.includes('read') || name.includes('book')) return <BookOpen className="h-5 w-5" />;
    if (name.includes('game') || name.includes('play')) return <Gamepad2 className="h-5 w-5" />;
    if (name.includes('photo') || name.includes('camera')) return <Camera className="h-5 w-5" />;
    if (name.includes('sport') || name.includes('exercise') || name.includes('gym')) return <Dumbbell className="h-5 w-5" />;
    return <Heart className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (isCompleted && !readOnlyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Completed!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for completing the Hobbies Assessment. Your responses have been saved.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('readonly', '1');
                  navigate(`/student/assessment/hobbies?${params.toString()}`);
                }}
              >
                View My Answers
              </Button>
              <Button onClick={() => navigate('/student-dashboard')} className="bg-blue-600 hover:bg-blue-700">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessmentTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load assessment data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/student-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {lang === 'kn'
                  ? '🎨 ನನ್ನ ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹವ್ಯಾಸಗಳು'
                  : lang === 'ta'
                    ? '🎨 என் திறமைகள் மற்றும் பொழுதுபோக்குகள்'
                    : '🎨 My Talents and Hobbies'}
              </h1>
              {/* Description Text */}
              <div className="max-w-3xl space-y-4 text-gray-700 mt-4">
                <p className="text-base leading-relaxed">
                  In this practice section, we delve into your interests, hobbies, pastimes, and activities that bring you joy, exploring the depths of your creativity. By delving into your hobbies and interests, you can not only find happiness but also identify your unique learning style and potential professions aligned with your passions.
                </p>
                <p className="text-base leading-relaxed">
                  Through this activity, you will explore your talents, hobbies, and the work/activities that bring you joy. This will help you understand your interests, hobbies, and areas of talent, and guide you in identifying careers that suit your personality, interests, and passions.
                </p>
                <p className="text-base leading-relaxed italic text-orange-700 font-medium">
                  "Hobbies bring out our talents and inspire us to pursue our dreams."
                </p>

                {/* Definitions Section */}
                <div className="mt-6 space-y-4 text-left bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">
                      {lang === 'kn'
                        ? 'ಭಾಗ I: ಹವ್ಯಾಸ (Hobby) ಎಂದರೆ ಏನು?'
                        : lang === 'ta'
                          ? 'பகுதி I: பொழுதுபோக்கு (Hobby) என்றால் என்ன?'
                          : 'Section I: What is a hobby?'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      {lang === 'kn' ? (
                        <>
                          <li>ನಾವು ನಮ್ಮ ಖುಷಿಗಾಗಿ, ನಮ್ಮ ದೈನಂದಿನ ಕೆಲಸಗಳ ಜೊತೆಗೆ ಮಾಡುವ ಚಟುವಟಿಕೆ.</li>
                          <li>ಸಮಯ ಕಳೆಯಲು ಅಥವಾ ಮನಸ್ಸಿಗೆ ಸಂತೋಷ ನೀಡಲು ಮಾಡುವ ಕೆಲಸ.</li>
                          <li>ಹವ್ಯಾಸ ಕಲಿತು ಬೆಳೆಯಬಹುದು.</li>
                        </>
                      ) : lang === 'ta' ? (
                        <>
                          <li>நமது மகிழ்ச்சிக்காக, தினசரி வேலைகளுடன் சேர்த்து செய்யப்படும் செயல்கள்.</li>
                          <li>நேரத்தை பயனுள்ளதாக கழிக்க அல்லது மனதிற்கு மகிழ்ச்சி தர செய்யப்படும் செயல்கள்.</li>
                          <li>பொழுதுபோக்கை கற்றுக்கொண்டு வளர்த்துக்கொள்ளலாம்.</li>
                        </>
                      ) : (
                        <>
                          <li>It is an activity that we do for fun, after our daily chores.</li>
                          <li>Work done to pass the time or to give pleasure to the mind.</li>
                          <li>A hobby is something that can be learnt and developed over time.</li>
                        </>
                      )}
                    </ul>
                    <p className="mt-2 text-gray-600">
                      <strong>
                        {lang === 'kn' ? 'ಉದಾಹರಣೆಗಳು:' : lang === 'ta' ? 'உதாரணங்கள்:' : 'Examples:'}
                      </strong>{' '}
                      {lang === 'kn'
                        ? 'ಚಿತ್ರ ಬಿಡಿಸುವುದು, ಹಾಡು ಹಾಡುವುದು, ಓದು, ನೃತ್ಯ, ಟಿವಿಯನ್ನು ನೋಡುವುದು, ತೋಟಗಾರಿಕೆ ಇತ್ಯಾದಿ.'
                        : lang === 'ta'
                          ? 'வரைதல், பாடுதல், வாசித்தல், நடனம் ஆடுதல், பறவைகளைப் பார்ப்பது, தோட்டப் பணி செய்வது போன்றவை.'
                          : 'Drawing, singing, reading, dancing, bird watching, gardening, etc.'}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold text-orange-800 mb-2">
                      {lang === 'kn'
                        ? 'ಭಾಗ II: ಪ್ರತಿಭೆ (Talent) ಎಂದರೆ ಏನು?'
                        : lang === 'ta'
                          ? 'பகுதி II: திறமை (Talent) என்றால் என்ன?'
                          : 'Section II: What is talent?'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      {lang === 'kn' ? (
                        <>
                          <li>ಹುಟ್ಟಿನಿಂದಲೇ ನಮಗೆ ಇರುವ ಒಂದು ನೈಸರ್ಗಿಕ ಸಾಮರ್ಥ್ಯ.</li>
                          <li>ಹೆಚ್ಚು ಅಭ್ಯಾಸ ಮಾಡದೆ ಸಹ ಸುಲಭವಾಗಿ ಮಾಡಬಹುದಾದ ಕೌಶಲ್ಯ.</li>
                          <li>ಇದನ್ನು ಇನ್ನಷ್ಟು ಅಭ್ಯಾಸದಿಂದ ಅಪಾರ ಸಾಧನೆಗೆ ದಾರಿ ಮಾಡಬಹುದು.</li>
                        </>
                      ) : lang === 'ta' ? (
                        <>
                          <li>பிறப்பிலிருந்தே நமக்கு உள்ள இயற்கையான திறன்.</li>
                          <li>அதிக பயிற்சி இல்லாமலேயே எளிதாக செய்யக்கூடிய திறமை.</li>
                          <li>இதை மேலும் பயிற்சி செய்வதன் மூலம் பெரிய சாதனைகளை அடையலாம்.</li>
                        </>
                      ) : (
                        <>
                          <li>A natural ability that we are born with.</li>
                          <li>A skill that can be done easily without much practice.</li>
                          <li>This can lead to immense achievement with more practice.</li>
                        </>
                      )}
                    </ul>
                    <p className="mt-2 text-gray-600">
                      <strong>
                        {lang === 'kn' ? 'ಉದಾಹರಣೆಗಳು:' : lang === 'ta' ? 'உதாரணங்கள்:' : 'Examples:'}
                      </strong>{' '}
                      {lang === 'kn'
                        ? 'ಸುಲಭವಾಗಿ ಹಾಡುವಂತಹುದು, ಸ್ಪಷ್ಟವಾಗಿ ಭಾಷಣ ಮಾಡುವಂತಹುದು, ಗಣಿತದಲ್ಲಿ ವೇಗವಾಗಿ ಉತ್ತರ ನೀಡುವಂತಹುದು, ತ್ವರಿತವಾಗಿ ಕಲಿಯುವ ಸಾಮರ್ಥ್ಯ ಇತ್ಯಾದಿ.'
                        : lang === 'ta'
                          ? 'எளிதாக பாடும் திறன், தெளிவாக பேசும் திறன், கணிதத்தில் வேகமாக விடை அளிக்கும் திறன், விரைவாக கற்றுக்கொள்ளும் திறன் போன்றவை.'
                          : 'The ability to sing naturally, communicate clearly, answer questions quickly in math, learn quickly, etc.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {responses.hobbies.length} Hobb{responses.hobbies.length !== 1 ? 'ies' : 'y'}
            </Badge>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {responses.hobbies.map((hobby, index) => (
            <Card key={hobby.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getHobbyIcon(hobby.name)}
                    Hobby {index + 1}
                  </CardTitle>
                  {responses.hobbies.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHobby(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Name of the hobby/activity
                    </label>
                    <Input
                      value={hobby.name}
                      onChange={(e) => handleHobbyChange(index, 'name', e.target.value)}
                      placeholder="e.g., Playing guitar, Reading, Painting"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      How much time do you spend on this hobby?
                    </label>
                    <Input
                      value={hobby.timeSpent}
                      onChange={(e) => handleHobbyChange(index, 'timeSpent', e.target.value)}
                      placeholder="e.g., 2 hours daily, 5 hours weekly"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Describe this hobby/activity
                  </label>
                  <Textarea
                    value={hobby.description}
                    onChange={(e) => handleHobbyChange(index, 'description', e.target.value)}
                    placeholder="Describe what you do in this hobby..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    What do you enjoy most about this hobby?
                  </label>
                  <Textarea
                    value={hobby.enjoyment}
                    onChange={(e) => handleHobbyChange(index, 'enjoyment', e.target.value)}
                    placeholder="What makes this hobby enjoyable for you?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    What skills have you developed through this hobby?
                  </label>
                  <Textarea
                    value={hobby.skills}
                    onChange={(e) => handleHobbyChange(index, 'skills', e.target.value)}
                    placeholder="What skills or abilities have you gained?"
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Hobby Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={addHobby}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Hobby
            </Button>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => toast({ title: "Draft Saved", description: "Your progress has been saved." })}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>


              <Button
                onClick={handleSubmit}
                disabled={submitting || !isComplete()}
                size="lg"
              >
                {submitting ? 'Submitting...' : 'Complete Assessment'}
              </Button>
            </div >
          </div >
        </div >
      </div >
    </div >
  );
}
