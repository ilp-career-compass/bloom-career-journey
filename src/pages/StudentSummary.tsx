import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type AssessmentType = 'inspiration' | 'about_me' | 'dreams' | 'school_learning' | 'hobbies' | 'role_models';

type AssessmentRecord = {
  assessment_type: AssessmentType;
  assessment_title: string;
  completed_at: string;
  responses: any;
};

// Helper to recursive format responses
const ResponseViewer = ({ data, level = 0 }: { data: any, level?: number }) => {
  if (data === null || data === undefined) return <span className="text-gray-400 italic">No answer</span>;

  // Primitives
  if (typeof data !== 'object') {
    return <div className="text-gray-800 whitespace-pre-wrap">{String(data)}</div>;
  }

  // Empty object/array
  if (Object.keys(data).length === 0) {
    return <span className="text-gray-400 italic">Empty</span>;
  }

  // Arrays/Objects
  return (
    <div className={`space-y-4 ${level > 0 ? 'mt-2' : ''}`}>
      {Object.entries(data).map(([key, value]) => {
        // Format common keys
        let label = key;
        if (/^video\d+$/.test(key)) label = key.replace('video', 'Video ');
        else if (/^question\d+$/.test(key)) label = key.replace('question', 'Q'); // Q1, Q2 etc is cleaner
        else if (/^part\d+$/.test(key)) label = key.replace('part', 'Part ');
        else label = label.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Visual distinction for sections vs questions
        const isSection = /^video\d+$/.test(key) || /^part\d+$/.test(key);

        return (
          <div key={key} className={`${isSection ? 'bg-gray-50 p-3 rounded-md border border-gray-100' : ''}`}>
            <div className={`text-xs font-semibold text-gray-500 uppercase mb-1 ${isSection ? 'text-blue-600 mb-3' : ''}`}>
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

export default function StudentSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [records, setRecords] = useState<AssessmentRecord[]>([]);

  const latestByType = useMemo(() => {
    const map: Partial<Record<AssessmentType, AssessmentRecord>> = {};
    for (const r of records) {
      const t = r.assessment_type;
      if (!map[t] || new Date(r.completed_at) > new Date(map[t]!.completed_at)) {
        map[t] = r;
      }
    }
    return map;
  }, [records]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // student basics
        const { data: student, error: sErr } = await supabase
          .from('students')
          .select('id, users:users(full_name, email), classes:classes(name)')
          .eq('id', id)
          .single();
        if (!sErr && student) {
          setStudentName((student as any).users?.full_name || 'Student');
          setStudentEmail((student as any).users?.email || '');
          setClassName((student as any).classes?.name || '');
        }

        // assessment records
        const { data: assessments } = await supabase
          .from('assessment_responses')
          .select('assessment_type, assessment_title, completed_at, responses')
          .eq('student_id', id)
          .order('completed_at', { ascending: false });
        setRecords(assessments || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const printPage = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Preparing student summary…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b print:hidden shadow-sm">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Student Summary</h1>
            <p className="text-sm text-gray-500 hidden sm:block">Printable report for records and review</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex-1 sm:flex-none">Close</Button>
            <Button className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none" size="sm" onClick={printPage}>Print</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 print:py-0">
        {/* Student Header */}
        <Card className="border shadow-sm print:border-none print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">{studentName}</CardTitle>
            <CardDescription>Class: {className || '—'} {studentEmail ? `• ${studentEmail}` : ''}</CardDescription>
          </CardHeader>
        </Card>

        {/* Completion Overview */}
        <Card className="border shadow-sm print:border-none print:shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Assessment Completion</CardTitle>
            <CardDescription>Latest status across the journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-3">
              {(['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'] as AssessmentType[]).map(t => {
                const rec = latestByType[t];
                const label = t.replace('_', ' ');
                return (
                  <div key={t} className="p-3 border rounded-md bg-gray-50 print:bg-white print:border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="font-medium capitalize">{label}</div>
                      <Badge variant={rec ? 'default' : 'secondary'} className="print:border print:border-gray-900">{rec ? 'Completed' : 'Not yet'}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{rec ? new Date(rec.completed_at).toLocaleString() : '—'}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Latest Answers Snapshot */}
        <Card className="border shadow-sm print:border-none print:shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Latest Answers Snapshot</CardTitle>
            <CardDescription>Most recent submission per assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {(['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'] as AssessmentType[]).map(t => {
              const rec = latestByType[t];
              if (!rec) return null;

              return (
                <div key={t} className="break-inside-avoid">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="text-lg font-bold capitalize text-blue-900 border-b-2 border-blue-100 pb-1 pr-4 w-full sm:w-auto">
                      {rec.assessment_title}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(rec.completed_at).toLocaleString()}</div>
                  </div>

                  <div className="bg-white rounded-md">
                    <ResponseViewer data={rec.responses} />
                  </div>

                  <Separator className="my-8 print:hidden" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


