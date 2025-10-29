import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { handleDatabaseError, validateApiResponse } from '@/utils/errorHandler';

interface AboutMeField {
  field_key: string;
  question_text: string;
  help_text: string;
  field_type: 'text' | 'textarea' | 'triple' | 'double';
  section: string;
  sequence_number: number;
}

type Triple = [string, string, string];
type Double = [string, string];

interface AboutMeResponses {
  profile_family: string;
  profile_other: string;
  home_work: string;
  fav_job_school: string;
  fav_job_after_school: string;
  solo_activities: string;
  with_friends_tasks: string;
  diff_at_school: string;
  diff_after_school: string;
  dont_like_but_do: string;
  not_natural_jobs: string;
  like_about_me: Triple; // three inputs
  others_like_about_me: Triple; // three inputs
  praised_for: Triple; // three inputs
  change_in_self: Double; // two inputs
  aspire_like_someone: string;
  about_me_brief: string;
}

const defaultResponses: AboutMeResponses = {
  profile_family: '',
  profile_other: '',
  home_work: '',
  fav_job_school: '',
  fav_job_after_school: '',
  solo_activities: '',
  with_friends_tasks: '',
  diff_at_school: '',
  diff_after_school: '',
  dont_like_but_do: '',
  not_natural_jobs: '',
  like_about_me: ['', '', ''],
  others_like_about_me: ['', '', ''],
  praised_for: ['', '', ''],
  change_in_self: ['', ''],
  aspire_like_someone: '',
  about_me_brief: ''
};

const HELP = {
  profile_family: 'Write the name or relation of the person (mother, father, sister, etc.) with whom you feel most comfortable sharing your thoughts.',
  profile_other: 'Mention a friend, teacher, or another person you trust and can talk to openly.',
  home_work: 'Write about the kind of work or help you give at home every day or sometimes.',
  fav_job_school: 'Write about a school activity or subject you are good at and enjoy doing.',
  fav_job_after_school: 'Write about something you do at home or outside school that you do well and like doing.',
  solo_activities: 'Write about things you like doing alone — for example reading, drawing, singing, or gardening.',
  with_friends_tasks: 'Mention the fun or helpful activities you enjoy doing with your friends.',
  diff_at_school: 'Write about something at school that feels hard for you to do.',
  diff_after_school: 'Mention a task outside school that you find difficult.',
  dont_like_but_do: 'Write about tasks you don’t enjoy but still do because they are needed.',
  not_natural_jobs: 'Write about tasks that you struggle with or take time to learn.',
  like_about_me: 'Write about your good habits, strengths, or anything that makes you proud of yourself.',
  others_like_about_me: 'Write what others appreciate about you — kindness, helpfulness, honesty, etc.',
  praised_for: 'Mention any time you were appreciated or got good comments — at home, school, or anywhere.',
  change_in_self: 'Write about something you want to improve or learn to do better.',
  aspire_like_someone: 'Write the name of a person you admire or the kind of work/life you wish to have.',
  about_me_brief: 'Write a few lines about who you are — your likes, hobbies, family, or dreams.'
} as const;

export default function AboutMeAssessment() {
  const { userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const readOnlyView = ['1','true'].includes((searchParams.get('readonly')||searchParams.get('view')||'').toLowerCase());
  const { toast } = useToast();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<AboutMeResponses>(defaultResponses);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});
  const [aboutMeFields, setAboutMeFields] = useState<AboutMeField[]>([]);
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));
  
  const getProgressPercentage = () => {
    const values: string[] = [
      responses.profile_family,
      responses.profile_other,
      responses.home_work,
      responses.fav_job_school,
      responses.fav_job_after_school,
      responses.solo_activities,
      responses.with_friends_tasks,
      responses.diff_at_school,
      responses.diff_after_school,
      responses.dont_like_but_do,
      responses.not_natural_jobs,
      responses.aspire_like_someone,
      responses.about_me_brief,
      ...responses.like_about_me,
      ...responses.others_like_about_me,
      ...responses.praised_for,
      ...responses.change_in_self,
    ];
    const total = values.length;
    const answered = values.filter(v => (v || '').trim() !== '').length;
    return total > 0 ? (answered / total) * 100 : 0;
  };

  const setField = (key: keyof AboutMeResponses, value: any) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const studentIdPromise = useMemo(async () => {
    if (!userProfile) return null;
    if (userProfile.studentProfile?.id) return userProfile.studentProfile.id as string;
    const { data } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
    return data?.id || null;
  }, [userProfile]);

  // Load About Me fields from database
  useEffect(() => {
    const loadFields = async () => {
      try {
        console.log('🔄 Loading About Me fields from database...');
        const { data, error } = await supabase.rpc('get_about_me_fields');
        
        if (error) {
          handleDatabaseError(error, 'AboutMeAssessment - Fields');
          throw error;
        }
        
        if (validateApiResponse(data, 'AboutMeAssessment - Fields')) {
          console.log('✅ Database fields loaded:', data.length, 'fields');
          setAboutMeFields(data);
        } else {
          console.log('⚠️ No fields found in database, using fallback');
        }
      } catch (error) {
        handleDatabaseError(error, 'AboutMeAssessment - Fields');
        console.log('🔄 Using hardcoded fallback fields');
        // Keep using hardcoded HELP object as fallback
      }
    };
    
    loadFields();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!userProfile) return setLoading(false);
      const studentId = await studentIdPromise;
      if (!studentId) return setLoading(false);
      const { data } = await supabase
        .from('assessment_responses')
        .select('responses, completed_at')
        .eq('student_id', studentId)
        .eq('assessment_type', 'about_me')
        .eq('assessment_title', 'About Me')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.responses) {
        const r = data.responses as Partial<AboutMeResponses>;
        setResponses({
          ...defaultResponses,
          ...r,
          like_about_me: (r.like_about_me as any) || ['', '', ''],
          others_like_about_me: (r.others_like_about_me as any) || ['', '', ''],
          praised_for: (r.praised_for as any) || ['', '', ''],
          change_in_self: (r.change_in_self as any) || ['', '']
        });
        if (data.completed_at) {
          setIsCompleted(true);
        }
      }
      setLoading(false);
    };
    load();
  }, [userProfile, studentIdPromise]);

  const save = async (complete: boolean) => {
    if (readOnlyView) return;
    if (!userProfile) return;
    const studentId = await studentIdPromise;
    if (!studentId) return;
    setSubmitting(true);
    try {
      const payload = {
        student_id: studentId,
        assessment_type: 'about_me',
        assessment_title: 'About Me',
        responses,
        completed_at: complete ? new Date().toISOString() : null
      } as any;
      const { error } = await supabase.from('assessment_responses').upsert({ ...payload, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast({ title: complete ? 'Submitted!' : 'Saved', description: complete ? 'About Me submitted successfully.' : 'Progress saved.' });
      if (complete) setIsCompleted(true);
    } catch (e) {
      toast({ title: 'Error', description: 'Unable to save. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (isCompleted && !readOnlyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <User className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-blue-800">About Me Assessment Completed! ✨</CardTitle>
              <CardDescription className="text-blue-600">
                You've successfully reflected about yourself
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for completing the About Me assessment! Your reflections have been saved and your teacher can now review them to help guide your career journey.
                </p>
                <div className="flex justify-center gap-4">
                  
                  <Button 
                    onClick={() => navigate('/student')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading About Me...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header - match My Dreams */}
        <div className="text-center mb-8">
          <div className="text-left mb-2">
            <Button variant="ghost" onClick={() => navigate('/student')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-blue-800 mb-2">🧑 About Me Assessment</h1>
          <p className="text-blue-600 text-lg">In this module you will think about yourself — what are things you do well and need help with?</p>
        </div>

        {/* Progress Bar - match style */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Your Progress</h2>
              <Badge variant="secondary">{Math.round(getProgressPercentage())}% Complete</Badge>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Single module</span>
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl text-blue-800 flex items-center gap-2"><User className="w-5 h-5" /> About Me</CardTitle>
            <CardDescription className="text-blue-600">Answer the questions. Use the bubble for help.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <TooltipProvider>
              {/* A. Your Profile */}
              <SectionTitle title="A. Your Profile" />
              <Question
                label="1. With which family member are you able to share your opinions and feelings freely without fear or reserve?"
                help={HELP.profile_family}
                helpKey="profile_family"
                open={!!helpOpen['profile_family']}
                onToggle={() => toggleHelp('profile_family')}
                value={responses.profile_family}
                onChange={(v) => setField('profile_family', v)}
              />
              <Question
                label="2. Other than your family members, with whom are you able to share your opinions and feelings freely without fear or reserve?"
                help={HELP.profile_other}
                helpKey="profile_other"
                open={!!helpOpen['profile_other']}
                onToggle={() => toggleHelp('profile_other')}
                value={responses.profile_other}
                onChange={(v) => setField('profile_other', v)}
              />
              <Question
                label="3. What work do you do at home? (eg: help in farming activities, buying vegetables, taking care of cattle, filling water, etc.)"
                help={HELP.home_work}
                helpKey="home_work"
                open={!!helpOpen['home_work']}
                onToggle={() => toggleHelp('home_work')}
                value={responses.home_work}
                onChange={(v) => setField('home_work', v)}
                area
              />

              {/* B. Favourite Work */}
              <SectionTitle title="B. What is your favourite work?" subtitle="You can have the same answer for more than one question." />
              <div className="space-y-4">
                <Question label="1a. The job that you do well and are happy to do - at school" help={HELP.fav_job_school} helpKey="fav_job_school" open={!!helpOpen['fav_job_school']} onToggle={() => toggleHelp('fav_job_school')} value={responses.fav_job_school} onChange={(v) => setField('fav_job_school', v)} />
                <Question label="1b. The job that you do well and are happy to do - after school" help={HELP.fav_job_after_school} helpKey="fav_job_after_school" open={!!helpOpen['fav_job_after_school']} onToggle={() => toggleHelp('fav_job_after_school')} value={responses.fav_job_after_school} onChange={(v) => setField('fav_job_after_school', v)} />
              </div>
              <Question label="2. The activities that you like to do on your own (Practically doing it alone)" help={HELP.solo_activities} helpKey="solo_activities" open={!!helpOpen['solo_activities']} onToggle={() => toggleHelp('solo_activities')} value={responses.solo_activities} onChange={(v) => setField('solo_activities', v)} area />
              <Question label="3. The tasks that you like to do with your friends" help={HELP.with_friends_tasks} helpKey="with_friends_tasks" open={!!helpOpen['with_friends_tasks']} onToggle={() => toggleHelp('with_friends_tasks')} value={responses.with_friends_tasks} onChange={(v) => setField('with_friends_tasks', v)} area />

              {/* C. Difficult Jobs */}
              <SectionTitle title="C. The job that you find difficult to carry out" />
              <Question label="1. At school" help={HELP.diff_at_school} helpKey="diff_at_school" open={!!helpOpen['diff_at_school']} onToggle={() => toggleHelp('diff_at_school')} value={responses.diff_at_school} onChange={(v) => setField('diff_at_school', v)} />
              <Question label="2. After school" help={HELP.diff_after_school} helpKey="diff_after_school" open={!!helpOpen['diff_after_school']} onToggle={() => toggleHelp('diff_after_school')} value={responses.diff_after_school} onChange={(v) => setField('diff_after_school', v)} />
              <Question label="3. The jobs that you don’t like to do but have to do" help={HELP.dont_like_but_do} helpKey="dont_like_but_do" open={!!helpOpen['dont_like_but_do']} onToggle={() => toggleHelp('dont_like_but_do')} value={responses.dont_like_but_do} onChange={(v) => setField('dont_like_but_do', v)} area />
              <Question label="4. The jobs that don’t come naturally to you" help={HELP.not_natural_jobs} helpKey="not_natural_jobs" open={!!helpOpen['not_natural_jobs']} onToggle={() => toggleHelp('not_natural_jobs')} value={responses.not_natural_jobs} onChange={(v) => setField('not_natural_jobs', v)} area />

              {/* D. More About You */}
              <SectionTitle title="D. Answer the below questions to share more information about yourself" />
              <TripleInput
                label="1. The things that you like about yourself"
                help={HELP.like_about_me}
                helpKey="like_about_me"
                open={!!helpOpen['like_about_me']}
                onToggle={() => toggleHelp('like_about_me')}
                values={responses.like_about_me}
                onChange={(vals) => setField('like_about_me', vals as Triple)}
              />
              <TripleInput
                label="2. What do others like about you? (You could ask your parents/guardians, teachers, friends etc.)"
                help={HELP.others_like_about_me}
                helpKey="others_like_about_me"
                open={!!helpOpen['others_like_about_me']}
                onToggle={() => toggleHelp('others_like_about_me')}
                values={responses.others_like_about_me}
                onChange={(vals) => setField('others_like_about_me', vals as Triple)}
              />
              <TripleInput
                label="3. Things for which you were praised."
                help={HELP.praised_for}
                helpKey="praised_for"
                open={!!helpOpen['praised_for']}
                onToggle={() => toggleHelp('praised_for')}
                values={responses.praised_for}
                onChange={(vals) => setField('praised_for', vals as Triple)}
              />
              <DoubleInput
                label="4. What would you like to change in yourself."
                help={HELP.change_in_self}
                helpKey="change_in_self"
                open={!!helpOpen['change_in_self']}
                onToggle={() => toggleHelp('change_in_self')}
                values={responses.change_in_self}
                onChange={(vals) => setField('change_in_self', vals as Double)}
              />
              <Question label="5. If you had the chance to be like somebody or be someone, who would you aspire to be or what would you aspire to do?" help={HELP.aspire_like_someone} helpKey="aspire_like_someone" open={!!helpOpen['aspire_like_someone']} onToggle={() => toggleHelp('aspire_like_someone')} value={responses.aspire_like_someone} onChange={(v) => setField('aspire_like_someone', v)} />
              <Question label="6. Write about yourself in brief" help={HELP.about_me_brief} helpKey="about_me_brief" open={!!helpOpen['about_me_brief']} onToggle={() => toggleHelp('about_me_brief')} value={responses.about_me_brief} onChange={(v) => setField('about_me_brief', v)} area />
            </TooltipProvider>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => save(false)} disabled={submitting} className="border-blue-200 text-blue-700 hover:bg-blue-50">Save Progress</Button>
              <Button onClick={() => save(true)} disabled={submitting || readOnlyView} className="bg-blue-600 hover:bg-blue-700">Submit About Me</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
      <h3 className="text-lg font-semibold text-blue-800">{title}</h3>
      {subtitle && <p className="text-sm text-blue-600">{subtitle}</p>}
    </div>
  );
}

function Question({ label, help, value, onChange, area, helpKey, open, onToggle }: { label: string; help: string; value: string; onChange: (v: string) => void; area?: boolean; helpKey: string; open: boolean; onToggle: () => void }) {
  return (
    <div>
      <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
        {label}
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Help" className="text-blue-600 hover:text-blue-700" onClick={onToggle}>💬</button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{help}</TooltipContent>
        </Tooltip>
      </label>
      {open && (
        <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">{help}</div>
      )}
      {area ? (
        <Textarea 
          value={value} 
          readOnly={readOnlyView as any}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v);
            if (open && v.trim().length > 0) onToggle();
          }} 
          rows={4} 
          placeholder={help} 
        />
      ) : (
        <Input 
          value={value} 
          readOnly={readOnlyView as any}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v);
            if (open && v.trim().length > 0) onToggle();
          }} 
          placeholder={help} 
        />
      )}
    </div>
  );
}

function TripleInput({ label, help, values, onChange, helpKey, open, onToggle }: { label: string; help: string; values: Triple; onChange: (v: Triple) => void; helpKey: string; open: boolean; onToggle: () => void }) {
  const [a, b, c] = values;
  return (
    <div>
      <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
        {label}
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Help" className="text-blue-600 hover:text-blue-700" onClick={onToggle}>💬</button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{help}</TooltipContent>
        </Tooltip>
      </label>
      {open && (
        <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">{help}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input value={a} onChange={(e) => { const v = e.target.value; onChange([v, b, c]); if (open && v.trim().length > 0) onToggle(); }} placeholder="Answer 1" />
        <Input value={b} onChange={(e) => { const v = e.target.value; onChange([a, v, c]); if (open && v.trim().length > 0) onToggle(); }} placeholder="Answer 2" />
        <Input value={c} onChange={(e) => { const v = e.target.value; onChange([a, b, v]); if (open && v.trim().length > 0) onToggle(); }} placeholder="Answer 3" />
      </div>
    </div>
  );
}

function DoubleInput({ label, help, values, onChange, helpKey, open, onToggle }: { label: string; help: string; values: Double; onChange: (v: Double) => void; helpKey: string; open: boolean; onToggle: () => void }) {
  const [a, b] = values;
  return (
    <div>
      <label className="block text-base font-medium text-gray-800 mb-2 flex items-center gap-2">
        {label}
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Help" className="text-blue-600 hover:text-blue-700" onClick={onToggle}>💬</button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{help}</TooltipContent>
        </Tooltip>
      </label>
      {open && (
        <div className="mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">{help}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input value={a} onChange={(e) => { const v = e.target.value; onChange([v, b]); if (open && v.trim().length > 0) onToggle(); }} placeholder="Answer 1" />
        <Input value={b} onChange={(e) => { const v = e.target.value; onChange([a, v]); if (open && v.trim().length > 0) onToggle(); }} placeholder="Answer 2" />
      </div>
    </div>
  );
}


