import { useState, useEffect } from 'react';
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
  Users,
  Star,
  Heart,
  Target,
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

interface RoleModel {
  id: string;
  name: string;
  relationship: string;
  qualities: string;
  influence: string;
  incorporatePlan: string;
}

interface RoleModelsAssessmentResponse {
  roleModels: RoleModel[];
}

export default function MyRoleModelsAssessmentDB() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const readOnlyView = ['1','true'].includes((searchParams.get('readonly')||searchParams.get('view')||'').toLowerCase());
  const [assessmentTemplate, setAssessmentTemplate] = useState<AssessmentTemplate | null>(null);
  const [responses, setResponses] = useState<RoleModelsAssessmentResponse>({
    roleModels: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const helpKey = (questionIndex: number) => `question${questionIndex}`;
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));

  // Load assessment data from database
  useEffect(() => {
    const loadAssessmentData = async () => {
      try {
        setLoading(true);
        const template = await AssessmentService.getAssessmentTemplate('role_models');
        
        if (template) {
          setAssessmentTemplate(template);
          
          // Initialize with one empty role model
          setResponses({
            roleModels: [{
              id: '1',
              name: '',
              relationship: '',
              qualities: '',
              influence: '',
              incorporatePlan: ''
            }]
          });
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
          .eq('assessment_type', 'role_models')
          .eq('assessment_title', 'My Role Models')
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
          assessment_type: 'role_models',
          assessment_title: 'My Role Models',
          responses,
          updated_at: new Date().toISOString(),
          completed_at: null
        });
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [responses, loading, isCompleted, userProfile]);

  const handleRoleModelChange = (index: number, field: keyof RoleModel, value: string) => {
    if (readOnlyView) return;
    setResponses(prev => ({
      ...prev,
      roleModels: prev.roleModels.map((rm, i) => 
        i === index ? { ...rm, [field]: value } : rm
      )
    }));
  };

  const addRoleModel = () => {
    if (readOnlyView) return;
    setResponses(prev => ({
      ...prev,
      roleModels: [...prev.roleModels, {
        id: Date.now().toString(),
        name: '',
        relationship: '',
        qualities: '',
        influence: '',
        incorporatePlan: ''
      }]
    }));
  };

  const removeRoleModel = (index: number) => {
    if (readOnlyView) return;
    if (responses.roleModels.length > 1) {
      setResponses(prev => ({
        ...prev,
        roleModels: prev.roleModels.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async () => {
    if (readOnlyView) return;
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
        assessment_type: 'role_models',
        assessment_title: 'My Role Models',
        responses,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setIsCompleted(true);
      toast({
        title: "Assessment Completed",
        description: "Your role models assessment has been submitted successfully.",
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

  const isComplete = () => {
    return responses.roleModels.every(rm => 
      rm.name.trim() !== '' && 
      rm.relationship.trim() !== '' && 
      rm.qualities.trim() !== '' && 
      rm.influence.trim() !== '' && 
      rm.incorporatePlan.trim() !== ''
    );
  };

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
              Thank you for completing the Role Models Assessment. Your responses have been saved.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('readonly', '1');
                  navigate(`/student/assessment/role-models?${params.toString()}`);
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
              <h1 className="text-3xl font-bold text-purple-800 mb-4">🎯 6. My Role Models</h1>
              <div className="text-left max-w-4xl space-y-4 text-gray-700">
                <p className="text-base leading-relaxed">
                  In our lives, we often admire individuals for their personality traits, viewing them as role models. These individuals, be they influencers, inspiring figures, or those we know personally, contribute significantly to shaping our character.
                </p>
                <p className="text-base leading-relaxed">
                  In this segment of our reflection, we will delve into the influential figures who have played a significant role in shaping our personalities. These individuals have contributed immensely to our development. If you happen to know such people personally, it's advantageous as you can observe them closely. Alternatively, you can also consider inspirational personalities as a source of inspiration and learning.
                </p>
                <p className="text-purple-600 italic mt-4">
                  <strong>Suggestion:</strong> If possible, it might be beneficial to select a role model who has pursued the profession you're interested in. Their journey could provide valuable insights and inspiration for your own path.
                </p>
                <p className="text-gray-700 mt-3 font-medium">
                  When responding to the questions provided, focus on highlighting their qualities, traits, and talents.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {responses.roleModels.length} Role Model{responses.roleModels.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {responses.roleModels.map((roleModel, index) => (
            <Card key={roleModel.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Role Model {index + 1}
                  </CardTitle>
                  {responses.roleModels.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoleModel(index)}
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
                      Name of the person
                    </label>
                    <Input
                      value={roleModel.name}
                      readOnly={readOnlyView as any}
                      onChange={(e) => handleRoleModelChange(index, 'name', e.target.value)}
                      placeholder="Enter the person's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Relationship to you
                    </label>
                    <Input
                      value={roleModel.relationship}
                      readOnly={readOnlyView as any}
                      onChange={(e) => handleRoleModelChange(index, 'relationship', e.target.value)}
                      placeholder="e.g., Teacher, Parent, Friend"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    What qualities do you admire in this person?
                  </label>
                  <Textarea
                    value={roleModel.qualities}
                    readOnly={readOnlyView as any}
                    onChange={(e) => handleRoleModelChange(index, 'qualities', e.target.value)}
                    placeholder="Describe the qualities you admire..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    How has this person influenced you?
                  </label>
                  <Textarea
                    value={roleModel.influence}
                    readOnly={readOnlyView as any}
                    onChange={(e) => handleRoleModelChange(index, 'influence', e.target.value)}
                    placeholder="Describe their influence on you..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    How do you plan to incorporate their qualities into your life?
                  </label>
                  <Textarea
                    value={roleModel.incorporatePlan}
                    readOnly={readOnlyView as any}
                    onChange={(e) => handleRoleModelChange(index, 'incorporatePlan', e.target.value)}
                    placeholder="Describe your plan to incorporate their qualities..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Role Model Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={addRoleModel}
              disabled={readOnlyView}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Role Model
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
                disabled={submitting || !isComplete()}
                size="lg"
              >
                {submitting ? 'Submitting...' : 'Complete Assessment'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
