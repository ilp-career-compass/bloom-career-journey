import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ClipboardList, FileText } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AssessmentType =
  | 'inspiration'
  | 'about_me'
  | 'dreams'
  | 'school_learning'
  | 'hobbies'
  | 'role_models'
  | 'personality'
  | 'career_guidance_tools';

interface AssessmentRecord {
  assessment_type: string;
  responses: any;
  completed_at: string | null;
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { key: AssessmentType; label: string }[] = [
  { key: 'inspiration', label: 'My Inspiration' },
  { key: 'about_me', label: 'About Me' },
  { key: 'dreams', label: 'My Dreams' },
  { key: 'school_learning', label: 'School & Learning' },
  { key: 'hobbies', label: 'Talents & Hobbies' },
  { key: 'role_models', label: 'My Role Models' },
  { key: 'personality', label: 'Holland Code' },
  { key: 'career_guidance_tools', label: 'Career Guidance' },
];

// ─── Audio URL detection ──────────────────────────────────────────────────────
function isAudioUrl(value: string): boolean {
  if (!value.startsWith('http')) return false;
  return /audio-files/.test(value) || /\.(webm|mp3|wav|ogg|m4a)(\?|$)/i.test(value);
}

// ─── Generic ResponseViewer ───────────────────────────────────────────────────
// Recursively renders JSONB. Booleans → Yes/No. Audio URLs → <audio> player.

const ResponseViewer = ({ data, level = 0 }: { data: any; level?: number }) => {
  if (data === null || data === undefined) {
    return <span className="text-gray-400 italic">No answer</span>;
  }

  if (typeof data === 'boolean') {
    return (
      <span className={data ? 'text-green-700 font-medium' : 'text-gray-500'}>
        {data ? 'Yes' : 'No'}
      </span>
    );
  }

  if (typeof data !== 'object') {
    const str = String(data);
    if (isAudioUrl(str)) {
      return (
        <audio controls className="w-full mt-1 rounded">
          <source src={str} />
          <a href={str} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">Download audio</a>
        </audio>
      );
    }
    return <div className="text-gray-800 whitespace-pre-wrap">{str}</div>;
  }

  const isUuid = (k: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k);

  const entries = Array.isArray(data)
    ? data.map((v, i) => [String(i), v] as [string, any])
    : Object.entries(data);

  if (entries.length === 0) {
    return <span className="text-gray-400 italic">Empty</span>;
  }

  // Pre-calculate sequential labels for any UUID keys at this level
  let uuidCounter = 0;
  const uuidLabelMap: Record<string, string> = {};
  entries.forEach(([k]) => {
    if (isUuid(k)) {
      uuidCounter++;
      uuidLabelMap[k] = `Q${uuidCounter}`;
    }
  });

  return (
    <div className={`space-y-4 ${level > 0 ? 'mt-2' : ''}`}>
      {entries.map(([key, value]) => {
        let label = key;
        if (isUuid(key)) {
          label = uuidLabelMap[key];
        } else if (/^video\d+$/.test(key)) {
          label = key.replace('video', 'Video ');
        } else if (/^question\d+$/.test(key)) {
          label = key.replace('question', 'Q');
        } else if (/^part\d+$/.test(key)) {
          label = key.replace('part', 'Part ');
        } else {
          label = label.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        const isSection = /^video\d+$/.test(key) || /^part\d+$/.test(key);

        return (
          <div key={key} className={isSection ? 'bg-gray-50 p-3 rounded-md border border-gray-100' : ''}>
            <div className={`text-xs font-semibold uppercase mb-1 ${isSection ? 'text-blue-600 mb-3' : 'text-gray-500'}`}>
              {label}
            </div>
            <div className={isSection ? '' : 'pl-2 border-l-2 border-gray-200'}>
              <ResponseViewer data={value} level={level + 1} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Hobbies renderer ─────────────────────────────────────────────────────────
// Hobbies are stored as { [questionId: string]: string } — use the generic viewer.
const HobbiesRenderer = ({ responses }: { responses: any }) => {
  if (!responses || Object.keys(responses).length === 0) {
    return <p className="text-gray-500 italic">No hobbies recorded.</p>;
  }
  return <ResponseViewer data={responses} />;
};

// ─── Role Models renderer ─────────────────────────────────────────────────────
// Stored as { roleModel1: {...}, roleModel2: {...}, roleModel3: {...}, question12, question13 }

const ROLE_MODEL_FIELDS: { key: string; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'relationship', label: 'Relationship' },
  { key: 'admirationReasons', label: 'Why I admire them' },
  { key: 'profession', label: 'Profession' },
  { key: 'desiredQualities', label: 'Qualities I want to develop' },
  { key: 'careerDiscussed', label: 'Career discussed' },
  { key: 'opinion', label: 'Their opinion' },
  { key: 'willingToHelp', label: 'Willing to help' },
  { key: 'helpLookingFor', label: 'Help I am looking for' },
  { key: 'similarities', label: 'Similarities' },
  { key: 'incorporatePlan', label: 'How I will incorporate their qualities' },
];

const RoleModelsRenderer = ({ responses }: { responses: any }) => {
  if (!responses) return <p className="text-gray-500 italic">No role models recorded.</p>;

  const roleModelKeys = ['roleModel1', 'roleModel2', 'roleModel3'].filter(k => responses[k]);
  if (roleModelKeys.length === 0) {
    return <p className="text-gray-500 italic">No role models recorded.</p>;
  }

  return (
    <div className="space-y-4">
      {roleModelKeys.map((key, i) => {
        const rm = responses[key];
        return (
          <Card key={key} className="border border-gray-200">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-purple-700">
                Role Model {i + 1}{rm.name ? ` — ${rm.name}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2 text-sm">
              {ROLE_MODEL_FIELDS.map(({ key: field, label }) =>
                rm[field] ? (
                  <div key={field}>
                    <span className="font-medium text-gray-600 mr-2">{label}:</span>
                    <span className="text-gray-800">{rm[field]}</span>
                  </div>
                ) : null
              )}
            </CardContent>
          </Card>
        );
      })}
      {(responses.question12 || responses.question13) && (
        <Card className="border border-purple-100">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-purple-700">Reflection</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2 text-sm">
            {responses.question12 && (
              <div>
                <span className="font-medium text-gray-600 mr-2">Similarities between role models:</span>
                <span className="text-gray-800">{responses.question12}</span>
              </div>
            )}
            {responses.question13 && (
              <div>
                <span className="font-medium text-gray-600 mr-2">How to cultivate these qualities:</span>
                <span className="text-gray-800">{responses.question13}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Holland Code renderer ────────────────────────────────────────────────────

const RIASEC_LABELS: Record<string, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

const RIASEC_COLORS: Record<string, string> = {
  R: 'bg-orange-500',
  I: 'bg-blue-500',
  A: 'bg-pink-500',
  S: 'bg-green-500',
  E: 'bg-yellow-500',
  C: 'bg-purple-500',
};

const HollandCodeRenderer = ({ responses }: { responses: any }) => {
  const hollandCode: string = responses?.holland_code || '';
  const scores: Record<string, number> = responses?.scores || {};

  if (!hollandCode) {
    return <p className="text-gray-500 italic">Holland Code data not available.</p>;
  }

  const maxScore = Math.max(7, ...Object.values(scores));

  return (
    <div className="space-y-6">
      {/* Code display */}
      <div className="flex flex-col items-center py-6 bg-indigo-50 rounded-xl border border-indigo-100">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">Holland Code</p>
        <div className="text-5xl font-bold text-indigo-700 tracking-widest">{hollandCode}</div>
        <div className="mt-3 flex gap-2 flex-wrap justify-center">
          {hollandCode.split('').map(letter => (
            <Badge key={letter} className="text-sm px-3 py-1 bg-indigo-600 text-white">
              {letter} — {RIASEC_LABELS[letter] || letter}
            </Badge>
          ))}
        </div>
      </div>

      {/* Score bars */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category Scores</p>
        <div className="space-y-3">
          {Object.entries(RIASEC_LABELS).map(([letter, name]) => {
            const score = scores[letter] ?? 0;
            const pct = Math.round((score / maxScore) * 100);
            const colorClass = RIASEC_COLORS[letter] || 'bg-gray-400';
            return (
              <div key={letter} className="flex items-center gap-3">
                <div className="w-6 text-center font-bold text-gray-700 text-sm">{letter}</div>
                <div className="w-28 text-sm text-gray-600">{name}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-all ${colorClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-semibold text-gray-700">
                  {score}/{maxScore}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const NotCompleted = ({ inProgress = false }: { inProgress?: boolean }) => (
  <div className="py-12 text-center text-gray-500">
    <ClipboardList className={`w-10 h-10 mx-auto mb-3 ${inProgress ? 'opacity-60 text-yellow-500' : 'opacity-20'}`} />
    <p>{inProgress
      ? 'Student has started this assessment but not yet submitted it.'
      : 'Student has not completed this assessment yet.'
    }</p>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeacherStudentResponsesPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { lang } = useLang();
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['inspiration','about_me','dreams','school_learning','hobbies','role_models','personality','career_guidance_tools'];
  const activeTab = validTabs.includes(searchParams.get('tab') ?? '') ? searchParams.get('tab')! : 'inspiration';
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [responseMap, setResponseMap] = useState<Partial<Record<AssessmentType, AssessmentRecord>>>({});
  const [inProgressSet, setInProgressSet] = useState<Set<AssessmentType>>(new Set());

  // G39: Role guard — only teachers may view this page
  useEffect(() => {
    if (userProfile && userProfile.role !== 'teacher') navigate('/', { replace: true });
  }, [userProfile]);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);

      // G40: Two-step query — avoids silent FK join failure
      const { data: studentRow } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', studentId)
        .maybeSingle();
      if (studentRow?.user_id) {
        const { data: userRow } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', studentRow.user_id)
          .maybeSingle();
        setStudentName(userRow?.full_name || 'Student');
      }

      // Fetch all assessment responses (student_id references students.id)
      const { data: records } = await supabase
        .from('assessment_responses')
        .select('assessment_type, responses, completed_at')
        .eq('student_id', studentId);

      // Build map: latest completed record per type; separately track in-progress
      const map: Partial<Record<AssessmentType, AssessmentRecord>> = {};
      const inProgress = new Set<AssessmentType>();
      for (const rec of (records || [])) {
        const type = rec.assessment_type as AssessmentType;
        if (!rec.completed_at) {
          inProgress.add(type);
          continue;
        }
        const existing = map[type];
        if (!existing || new Date(rec.completed_at) > new Date(existing.completed_at!)) {
          map[type] = rec as AssessmentRecord;
        }
      }
      // G37: Only mark in-progress when there is no completed version
      inProgress.forEach(t => { if (map[t]) inProgress.delete(t); });
      setResponseMap(map);
      setInProgressSet(inProgress);
      setLoading(false);
    })();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const completedCount = TABS.filter(t => !!responseMap[t.key]).length;
  const inProgressCount = inProgressSet.size;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 text-white">
        <div className="container mx-auto px-4 py-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => navigate(`/teacher?lang=${lang}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-white/10 text-teal-200 border-teal-300/30 uppercase tracking-wider font-bold text-xs" variant="outline">
                  Detailed Responses Log
                </Badge>
              </div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-5 w-5" /> Assessment Responses
              </h1>
              <p className="text-white/70 text-sm">
                {studentName} &mdash; {completedCount} of {TABS.length} assessments completed
                {inProgressCount > 0 && `, ${inProgressCount} in progress`}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="bg-white text-teal-800 hover:bg-teal-50 shadow-sm border border-teal-100 font-semibold self-stretch sm:self-auto"
            onClick={() => navigate(`/student/${studentId}/summary?lang=${lang}`)}
          >
            <FileText className="w-4 h-4 mr-2 text-teal-600" />
            View Summary Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={tab => setSearchParams({ tab }, { replace: true })}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-white border border-gray-200 shadow-sm p-1 rounded-xl">
            {TABS.map(tab => {
              const done = !!responseMap[tab.key];
              const started = !done && inProgressSet.has(tab.key);
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                >
                  {tab.label}
                  {done && (
                    <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" title="Completed" />
                  )}
                  {started && (
                    <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" title="Started but not submitted" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* inspiration */}
          <TabsContent value="inspiration">
            <TabCard title="My Inspiration" record={responseMap['inspiration']} inProgress={inProgressSet.has('inspiration')}>
              <ResponseViewer data={responseMap['inspiration']?.responses} />
            </TabCard>
          </TabsContent>

          {/* about_me */}
          <TabsContent value="about_me">
            <TabCard title="About Me" record={responseMap['about_me']} inProgress={inProgressSet.has('about_me')}>
              <ResponseViewer data={responseMap['about_me']?.responses} />
            </TabCard>
          </TabsContent>

          {/* dreams */}
          <TabsContent value="dreams">
            <TabCard title="My Dreams" record={responseMap['dreams']} inProgress={inProgressSet.has('dreams')}>
              <ResponseViewer data={responseMap['dreams']?.responses} />
            </TabCard>
          </TabsContent>

          {/* school_learning */}
          <TabsContent value="school_learning">
            <TabCard title="School & Learning" record={responseMap['school_learning']} inProgress={inProgressSet.has('school_learning')}>
              <ResponseViewer data={responseMap['school_learning']?.responses} />
            </TabCard>
          </TabsContent>

          {/* hobbies */}
          <TabsContent value="hobbies">
            <TabCard title="Talents & Hobbies" record={responseMap['hobbies']} inProgress={inProgressSet.has('hobbies')}>
              <HobbiesRenderer responses={responseMap['hobbies']?.responses} />
            </TabCard>
          </TabsContent>

          {/* role_models */}
          <TabsContent value="role_models">
            <TabCard title="My Role Models" record={responseMap['role_models']} inProgress={inProgressSet.has('role_models')}>
              <RoleModelsRenderer responses={responseMap['role_models']?.responses} />
            </TabCard>
          </TabsContent>

          {/* personality / Holland Code */}
          <TabsContent value="personality">
            <TabCard title="Holland Code (RIASEC)" record={responseMap['personality']} inProgress={inProgressSet.has('personality')}>
              <HollandCodeRenderer responses={responseMap['personality']?.responses} />
            </TabCard>
          </TabsContent>

          {/* career_guidance_tools */}
          <TabsContent value="career_guidance_tools">
            <TabCard title="Career Guidance Tools" record={responseMap['career_guidance_tools']} inProgress={inProgressSet.has('career_guidance_tools')}>
              <ResponseViewer data={responseMap['career_guidance_tools']?.responses} />
            </TabCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Shared tab card wrapper ──────────────────────────────────────────────────

function TabCard({
  title,
  record,
  inProgress = false,
  children,
}: {
  title: string;
  record: AssessmentRecord | undefined;
  inProgress?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-800">{title}</CardTitle>
          {record?.completed_at && (
            <span className="text-xs text-gray-500">
              Completed {new Date(record.completed_at).toLocaleDateString()}
            </span>
          )}
          {!record && inProgress && (
            <span className="text-xs text-yellow-600 font-medium">In progress</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {record ? children : <NotCompleted inProgress={inProgress} />}
      </CardContent>
    </Card>
  );
}
