import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  BookOpen,
  GraduationCap,
  Users,
  Lightbulb,
  ArrowLeft,
  Save,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssessmentService, AssessmentTemplate } from '@/services/assessmentService';

interface SchoolLearningAssessmentResponse {
  [key: string]: {
    [key: string]: string | { [key: string]: boolean };
  };
}

export default function MySchoolLearningAssessmentDB() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const readOnlyView = ['1','true'].includes((searchParams.get('readonly')||searchParams.get('view')||'').toLowerCase());
  const [assessmentTemplate, setAssessmentTemplate] = useState<AssessmentTemplate | null>(null);
  const [responses, setResponses] = useState<SchoolLearningAssessmentResponse>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const helpKey = (sectionIndex: number, questionIndex: number) => `section${sectionIndex}_question${questionIndex}`;
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));

  // Load assessment data from database
  useEffect(() => {
    const loadAssessmentData = async () => {
      try {
        setLoading(true);
        const template = await AssessmentService.getAssessmentTemplate('school_learning');
        
        if (template) {
          setAssessmentTemplate(template);
          
          // Initialize responses structure
          const initialResponses: SchoolLearningAssessmentResponse = {};
          template.sections.forEach((section, sectionIndex) => {
            const sectionKey = `part${sectionIndex + 1}`;
            initialResponses[sectionKey] = {};
            section.questions.forEach((question, questionIndex) => {
              const questionKey = `question${questionIndex + 1}`;
              
              // Initialize learning methods question with checkboxes
              if (question.question_text === 'How do you like to learn?') {
                initialResponses[sectionKey][questionKey] = {
                  lookingAtPictures: false,
                  reading: false,
                  listening: false,
                  experiment: false,
                  discussions: false,
                  practice: false,
                  groupSessions: false,
                  others: ''
                };
              } else {
                initialResponses[sectionKey][questionKey] = '';
              }
            });
          });
          setResponses(initialResponses);
        }
      } catch (error) {
        console.error('Error loading assessment data:', error);
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
          .eq('assessment_type', 'school_learning')
          .eq('assessment_title', 'My School Learning')
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
        console.error('Error checking existing response:', error);
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
          assessment_type: 'school_learning',
          assessment_title: 'My School Learning',
          responses,
          updated_at: new Date().toISOString(),
          completed_at: null
        });
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [responses, loading, isCompleted, userProfile]);

  const handleResponseChange = (sectionKey: string, questionKey: string, value: string) => {
    if (readOnlyView) return;
    setResponses(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [questionKey]: value
      }
    }));
  };

  const handleCheckboxChange = (sectionKey: string, questionKey: string, optionKey: string, checked: boolean) => {
    if (readOnlyView) return;
    setResponses(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [questionKey]: {
          ...(prev[sectionKey]?.[questionKey] as { [key: string]: boolean }) || {},
          [optionKey]: checked
        }
      }
    }));
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
        assessment_type: 'school_learning',
        assessment_title: 'My School Learning',
        responses,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setIsCompleted(true);
      toast({
        title: "Assessment Completed",
        description: "Your school learning assessment has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextSection = () => {
    if (currentSection < (assessmentTemplate?.sections.length || 0) - 1) {
      setCurrentSection(prev => prev + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  const isCurrentSectionComplete = () => {
    if (!assessmentTemplate) return false;
    const currentSectionData = assessmentTemplate.sections[currentSection];
    const sectionKey = `part${currentSection + 1}`;
    const sectionResponses = responses[sectionKey] || {};
    
    return currentSectionData.questions.every((question, questionIndex) => {
      const questionKey = `question${questionIndex + 1}`;
      const response = sectionResponses[questionKey];
      
      if (question.question_type === 'checkbox') {
        // For checkbox questions, check if at least one option is selected
        if (typeof response === 'object' && response !== null) {
          return Object.values(response).some(value => value === true);
        }
        return false;
      } else {
        return response && response.toString().trim() !== '';
      }
    });
  };

  const areAllSectionsComplete = () => {
    if (!assessmentTemplate) return false;
    
    // Check all sections are complete
    return assessmentTemplate.sections.every((section, sectionIndex) => {
      const sectionKey = `part${sectionIndex + 1}`;
      const sectionResponses = responses[sectionKey] || {};
      
      return section.questions.every((question, questionIndex) => {
        const questionKey = `question${questionIndex + 1}`;
        const response = sectionResponses[questionKey];
        
        if (question.question_type === 'checkbox') {
          // For checkbox questions, check if at least one option is selected
          if (typeof response === 'object' && response !== null) {
            return Object.values(response).some(value => value === true);
          }
          return false;
        } else {
          return response && response.toString().trim() !== '';
        }
      });
    });
  };

  const totalProgress = assessmentTemplate ? 
    ((currentSection + 1) / assessmentTemplate.sections.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
              Thank you for completing the School Learning Assessment. Your responses have been saved.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('readonly', '1');
                  navigate(`/student/assessment/school-learning?${params.toString()}`);
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

  const currentSectionData = assessmentTemplate.sections[currentSection];

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
              <h1 className="text-3xl font-bold text-gray-900">🏫 My School, My Learning and I</h1>
              {/* Description Text */}
              <div className="max-w-3xl space-y-3 text-gray-700 mt-4">
                <p className="text-base leading-relaxed">
                  In this practice section, we would like you to think about what you like about your school, what you like learning, what you don't, how you learn and more. Understanding what you enjoy learning and how you enjoy learning will help you figure out what you might like to pursue as a higher education and what careers might be good for you.
                </p>
                <p className="text-base leading-relaxed">
                  <strong>Note:</strong> Keeping track of things you like or enjoy is not a one-time activity; it's something to keep in mind on an ongoing basis. As you discover new things you like in the future, you can record them on the 'My Interests' page at the end of this book. This will help you understand the kinds of things you enjoy, so you can tailor your career choices to match those interests.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Section {currentSection + 1} of {assessmentTemplate.sections.length}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {currentSectionData.title}
              </CardTitle>
              <CardDescription>
                {currentSectionData.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentSectionData.questions.map((question, questionIndex) => {
                const questionKey = `question${questionIndex + 1}`;
                const sectionKey = `part${currentSection + 1}`;
                const currentResponse = responses[sectionKey]?.[questionKey] || '';
                const helpKeyValue = helpKey(currentSection, questionIndex);
                const isHelpOpen = helpOpen[helpKeyValue];

                return (
                  <div key={question.id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {question.question_text}
                      </label>
                      {question.help_text && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleHelp(helpKeyValue)}
                                className="h-6 w-6 p-0"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Click for help text</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    {isHelpOpen && question.help_text && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">{question.help_text}</p>
                      </div>
                    )}

                    {question.question_type === 'checkbox' ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          {question.options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${questionKey}_${option.option_value}`}
                                checked={(currentResponse as { [key: string]: boolean })?.[option.option_value] || false}
                                onCheckedChange={(checked) => 
                                  handleCheckboxChange(sectionKey, questionKey, option.option_value, checked as boolean)
                                }
                              />
                              <label 
                                htmlFor={`${questionKey}_${option.option_value}`}
                                className="text-sm text-gray-700 cursor-pointer"
                              >
                                {option.option_text}
                              </label>
                            </div>
                          ))}
                        </div>
                        {/* Others text input */}
                        <Textarea
                          value={(currentResponse as { [key: string]: any })?.others || ''}
                          onChange={(e) => handleCheckboxChange(sectionKey, questionKey, 'others', e.target.value)}
                          readOnly={readOnlyView}
                          placeholder="If others, please specify..."
                          className="min-h-[60px]"
                        />
                      </div>
                    ) : (
                      <Textarea
                        value={currentResponse.toString()}
                        onChange={(e) => handleResponseChange(sectionKey, questionKey, e.target.value)}
                        readOnly={readOnlyView}
                        placeholder="Share your thoughts..."
                        className="min-h-[100px]"
                      />
                    )}
                  </div>
                );
              })}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevSection}
                  disabled={currentSection === 0}
                >
                  Previous Section
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => toast({ title: "Draft Saved", description: "Your progress has been saved." })}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  
                  {currentSection === assessmentTemplate.sections.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !areAllSectionsComplete() || readOnlyView}
                    >
                      {submitting ? 'Submitting...' : 'Complete Assessment'}
                    </Button>
                  ) : (
                    <Button
                      onClick={nextSection}
                      disabled={!isCurrentSectionComplete()}
                    >
                      Next Section
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
                      Next Section
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
