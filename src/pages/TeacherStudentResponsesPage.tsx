import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ClipboardList } from 'lucide-react';

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

// ─── Generic ResponseViewer ───────────────────────────────────────────────────
// Recursively renders JSONB. Booleans render as Yes/No.

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
    return <div className="text-gray-800 whitespace-pre-wrap">{String(data)}</div>;
  }

  const entries = Array.isArray(data)
    ? data.map((v, i) => [String(i), v] as [string, any])
    : Object.entries(data);

  if (entries.length === 0) {
    return <span className="text-gray-400 italic">Empty</span>;
  }

  return (
    <div className={`space-y-4 ${level > 0 ? 'mt-2' : ''}`}>
      {entries.map(([key, value]) => {
        let label = key;
        if (/^video\d+$/.test(key)) label = key.replace('video', 'Video ');
        else if (/^question\d+$/.test(key)) label = key.replace('question', 'Q');
        else if (/^part\d+$/.test(key)) label = key.replace('part', 'Part ');
        else label = label.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

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

const HobbiesRenderer = ({ responses }: { responses: any }) => {
  const hobbies: any[] = responses?.hobbies || [];
  if (hobbies.length === 0) {
    return <p className="text-gray-500 italic">No hobbies recorded.</p>;
  }
  return (
    <div className="space-y-4">
      {hobbies.map((hobby: any, i: number) => (
        <Card key={hobby.id ?? i} className="border border-gray-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-blue-700">Hobby {i + 1}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2 text-sm">
            {[
              { label: 'Name', value: hobby.name },
              { label: 'Description', value: hobby.description },
              { label: 'Time Spent', value: hobby.timeSpent },
              { label: 'Enjoyment', value: hobby.enjoyment },
              { label: 'Skills', value: hobby.skills },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="font-medium text-gray-600 mr-2">{label}:</span>
                <span className="text-gray-800">{value || <span className="text-gray-400 italic">—</span>}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ─── Role Models renderer ─────────────────────────────────────────────────────

const RoleModelsRenderer = ({ responses }: { responses: any }) => {
  const roleModels: any[] = responses?.roleModels || [];
  if (roleModels.length === 0) {
    return <p className="text-gray-500 italic">No role models recorded.</p>;
  }
  return (
    <div className="space-y-4">
      {roleModels.map((rm: any, i: number) => (
        <Card key={rm.id ?? i} className="border border-gray-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-purple-700">Role Model {i + 1}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2 text-sm">
            {[
              { label: 'Name', value: rm.name },
              { label: 'Relationship', value: rm.relationship },
              { label: 'Qualities', value: rm.qualities },
              { label: 'Influence', value: rm.influence },
              { label: 'Incorporate Plan', value: rm.incorporatePlan },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="font-medium text-gray-600 mr-2">{label}:</span>
                <span className="text-gray-800">{value || <span className="text-gray-400 italic">—</span>}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
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

  const maxScore = 7; // 7 questions per category

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

const NotCompleted = () => (
  <div className="py-12 text-center text-gray-500">
    <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
    <p>Student has not completed this assessment yet.</p>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeacherStudentResponsesPage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [responseMap, setResponseMap] = useState<Partial<Record<AssessmentType, AssessmentRecord>>>({});

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);

      // Fetch student name
      const { data: student } = await supabase
        .from('students')
        .select('user_id, users:user_id(full_name)')
        .eq('id', studentId)
        .maybeSingle();
      setStudentName((student as any)?.users?.full_name || 'Student');

      // Fetch all assessment responses (student_id references students.id)
      const { data: records } = await supabase
        .from('assessment_responses')
        .select('assessment_type, responses, completed_at')
        .eq('student_id', studentId);

      // Build map: keep only completed records, latest per type
      const map: Partial<Record<AssessmentType, AssessmentRecord>> = {};
      for (const rec of (records || [])) {
        if (!rec.completed_at) continue;
        const type = rec.assessment_type as AssessmentType;
        const existing = map[type];
        if (!existing || new Date(rec.completed_at) > new Date(existing.completed_at!)) {
          map[type] = rec as AssessmentRecord;
        }
      }
      setResponseMap(map);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-5 w-5" /> Assessment Responses
              </h1>
              <p className="text-white/70 text-sm">
                {studentName} &mdash; {completedCount} of {TABS.length} assessments completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="inspiration">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-white border border-gray-200 shadow-sm p-1 rounded-xl">
            {TABS.map(tab => {
              const done = !!responseMap[tab.key];
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
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* inspiration */}
          <TabsContent value="inspiration">
            <TabCard title="My Inspiration" record={responseMap['inspiration']}>
              <ResponseViewer data={responseMap['inspiration']?.responses} />
            </TabCard>
          </TabsContent>

          {/* about_me */}
          <TabsContent value="about_me">
            <TabCard title="About Me" record={responseMap['about_me']}>
              <ResponseViewer data={responseMap['about_me']?.responses} />
            </TabCard>
          </TabsContent>

          {/* dreams */}
          <TabsContent value="dreams">
            <TabCard title="My Dreams" record={responseMap['dreams']}>
              <ResponseViewer data={responseMap['dreams']?.responses} />
            </TabCard>
          </TabsContent>

          {/* school_learning */}
          <TabsContent value="school_learning">
            <TabCard title="School & Learning" record={responseMap['school_learning']}>
              <ResponseViewer data={responseMap['school_learning']?.responses} />
            </TabCard>
          </TabsContent>

          {/* hobbies */}
          <TabsContent value="hobbies">
            <TabCard title="Talents & Hobbies" record={responseMap['hobbies']}>
              <HobbiesRenderer responses={responseMap['hobbies']?.responses} />
            </TabCard>
          </TabsContent>

          {/* role_models */}
          <TabsContent value="role_models">
            <TabCard title="My Role Models" record={responseMap['role_models']}>
              <RoleModelsRenderer responses={responseMap['role_models']?.responses} />
            </TabCard>
          </TabsContent>

          {/* personality / Holland Code */}
          <TabsContent value="personality">
            <TabCard title="Holland Code (RIASEC)" record={responseMap['personality']}>
              <HollandCodeRenderer responses={responseMap['personality']?.responses} />
            </TabCard>
          </TabsContent>

          {/* career_guidance_tools */}
          <TabsContent value="career_guidance_tools">
            <TabCard title="Career Guidance Tools" record={responseMap['career_guidance_tools']}>
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
  children,
}: {
  title: string;
  record: AssessmentRecord | undefined;
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
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {record ? children : <NotCompleted />}
      </CardContent>
    </Card>
  );
}
