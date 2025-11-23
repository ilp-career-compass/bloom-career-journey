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
          setStudentName(student.users?.full_name || 'Student');
          setStudentEmail(student.users?.email || '');
          setClassName(student.classes?.name || '');
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
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Student Summary</h1>
            <p className="text-sm text-gray-500">Printable report for records and review</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Close</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={printPage}>Print</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Student Header */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{studentName}</CardTitle>
            <CardDescription>Class: {className || '—'} {studentEmail ? `• ${studentEmail}` : ''}</CardDescription>
          </CardHeader>
        </Card>

        {/* Completion Overview */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Assessment Completion</CardTitle>
            <CardDescription>Latest status across the journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(['inspiration','about_me','dreams','school_learning','hobbies','role_models'] as AssessmentType[]).map(t => {
                const rec = latestByType[t];
                const label = t.replace('_',' ');
                return (
                  <div key={t} className="p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="font-medium capitalize">{label}</div>
                      <Badge variant={rec ? 'default' : 'secondary'}>{rec ? 'Completed' : 'Not yet'}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{rec ? new Date(rec.completed_at).toLocaleString() : '—'}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Latest Answers Snapshot */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Latest Answers Snapshot</CardTitle>
            <CardDescription>Most recent submission per assessment</CardDescription>
          </CardHeader>
          <CardContent>
            {(['inspiration','about_me','dreams','school_learning','hobbies','role_models'] as AssessmentType[]).map(t => {
              const rec = latestByType[t];
              if (!rec) return (
                <div key={t} className="mb-4">
                  <div className="font-medium capitalize">{t.replace('_',' ')}</div>
                  <div className="text-sm text-gray-500">No submission yet.</div>
                  <Separator className="my-3" />
                </div>
              );
              return (
                <div key={t} className="mb-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">{rec.assessment_title}</div>
                    <div className="text-xs text-gray-500">{new Date(rec.completed_at).toLocaleString()}</div>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-md border">{JSON.stringify(rec.responses, null, 2)}</pre>
                  <Separator className="my-3" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


