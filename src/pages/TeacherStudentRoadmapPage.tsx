import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLang } from '@/hooks/useLang';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Lock, AlertCircle } from 'lucide-react';
import { MilestoneKey, MilestoneConfig, MILESTONES, COLUMN_LABELS, RoadmapRow, getMilestoneLabel } from '@/utils/roadmapConfig';

const PAGE_TITLE: Record<string, string> = {
  en: 'Career Roadmap',
  kn: 'ವೃತ್ತಿ ರೋಡ್‌ಮ್ಯಾಪ್',
  ta: 'தொழில் வழிகாட்டி',
  hi: 'करियर रोडमैप',
};

const FETCH_ERROR_MSG: Record<string, string> = {
  en: 'Could not load roadmap data.',
  kn: 'ರೋಡ್‌ಮ್ಯಾಪ್ ಡೇಟಾ ಲೋಡ್ ಆಗಲಿಲ್ಲ.',
  ta: 'வழிகாட்டி தரவை ஏற்ற முடியவில்லை.',
  hi: 'रोडमैप डेटा लोड नहीं हो सका।',
};

const NO_DATA_MSG: Record<string, string> = {
  en: "Student hasn't filled in their career plans yet.",
  kn: 'ವಿದ್ಯಾರ್ಥಿ ಇನ್ನೂ ತಮ್ಮ ವೃತ್ತಿ ಯೋಜನೆಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿಲ್ಲ.',
  ta: 'மாணவர் இன்னும் தங்கள் தொழில் திட்டங்களை நிரப்பவில்லை.',
  hi: 'छात्र ने अभी तक अपनी करियर योजनाएं नहीं भरी हैं।',
};

export default function TeacherStudentRoadmapPage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { lang: currentLang } = useLang();
  const teacherLang = (currentLang || 'en') as string;

  const [rows, setRows] = useState<Record<MilestoneKey, RoadmapRow>>(() => {
    const init: Record<string, RoadmapRow> = {};
    for (const m of MILESTONES) init[m.key] = { plan_a: '', plan_b: '', plan_c: '' };
    return init as Record<MilestoneKey, RoadmapRow>;
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentLang, setStudentLang] = useState<string>('en');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [milestoneUpdatedAt, setMilestoneUpdatedAt] = useState<Partial<Record<MilestoneKey, string>>>({});

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const { data: student, error: studentError } = await supabase
          .from('students').select('user_id, users:user_id(full_name, preferred_language)')
          .eq('id', studentId).maybeSingle();

        if (studentError) {
          setFetchError(true);
          setLoading(false);
          return;
        }

        setStudentName((student as any)?.users?.full_name || 'Student');
        setStudentLang((student as any)?.users?.preferred_language || 'en');

        // career_roadmap.student_id references users.id, not students.id
        const userId = (student as any)?.user_id;
        if (!userId) { setFetchError(true); setLoading(false); return; }

        const { data, error: roadmapError } = await supabase
          .from('career_roadmap')
          .select('milestone, plan_a, plan_b, plan_c, updated_at')
          .eq('student_id', userId);

        if (roadmapError) {
          setFetchError(true);
          setLoading(false);
          return;
        }

        if (data) {
          let maxUpdated: string | null = null;
          const perMilestone: Partial<Record<MilestoneKey, string>> = {};
          for (const row of data) {
            if (row.updated_at && (!maxUpdated || row.updated_at > maxUpdated)) maxUpdated = row.updated_at;
            if (row.updated_at) perMilestone[row.milestone as MilestoneKey] = row.updated_at;
          }
          if (maxUpdated) setLastUpdated(maxUpdated);
          setMilestoneUpdatedAt(perMilestone);
          setRows(prev => {
            const next = { ...prev };
            for (const row of data) {
              const key = row.milestone as MilestoneKey;
              if (next[key]) next[key] = { plan_a: row.plan_a || '', plan_b: row.plan_b || '', plan_c: row.plan_c || '' };
            }
            return next;
          });
        }
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const hasAnyData = MILESTONES.some(m => rows[m.key].plan_a || rows[m.key].plan_b || rows[m.key].plan_c);

  // Column headers in teacher's own language; milestone labels in student's language
  const cols = COLUMN_LABELS[teacherLang] || COLUMN_LABELS['en'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => navigate(`/teacher?lang=${teacherLang}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{PAGE_TITLE[teacherLang] || PAGE_TITLE.en}</h1>
              <p className="text-white/70 text-sm">{studentName}</p>
              {lastUpdated && (
                <p className="text-white/50 text-xs">
                  {new Date(lastUpdated).toLocaleDateString(teacherLang === 'en' ? 'en-IN' : teacherLang, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        {fetchError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-gray-700 text-sm">{FETCH_ERROR_MSG[teacherLang] || FETCH_ERROR_MSG.en}</p>
          </div>
        )}
        {!fetchError && !hasAnyData && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-500 text-sm italic">{NO_DATA_MSG[teacherLang] || NO_DATA_MSG.en}</p>
          </div>
        )}
        <div className="overflow-x-auto rounded-xl shadow-sm bg-white border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left px-6 py-4 font-semibold rounded-tl-xl w-48">{cols.milestone}</th>
                <th className="text-left px-6 py-4 font-semibold">{cols.planA}</th>
                <th className="text-left px-6 py-4 font-semibold">{cols.planB}</th>
                <th className="text-left px-6 py-4 font-semibold rounded-tr-xl">{cols.planC}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MILESTONES.map(m => {
                const row = rows[m.key];
                return (
                  <tr key={m.key} className={m.editable ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-gray-200 bg-gray-50'}>
                    <td className="px-6 py-4 bg-gray-50 font-medium text-gray-800 align-top w-48">
                      <div className="flex items-center gap-2">
                        {!m.editable && <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                        <div>
                          <span className={!m.editable ? 'text-gray-500' : ''}>{getMilestoneLabel(m, studentLang)}</span>
                          {milestoneUpdatedAt[m.key] && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(milestoneUpdatedAt[m.key]!).toLocaleDateString(teacherLang === 'en' ? 'en-IN' : teacherLang, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {(['plan_a', 'plan_b', 'plan_c'] as const).map(field => (
                      <td key={field} className="px-4 py-3 align-top">
                        <div className="p-2 text-sm text-gray-700 min-h-[40px]">
                          {row[field] || <span className="text-gray-400 italic">—</span>}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
