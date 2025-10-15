import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type CategoryKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

// Question sets adapted to match the ILP Holland test content
const QUESTIONS: Record<CategoryKey, string[]> = {
  R: [
    'I like to fix a car',
    'I like to build things',
    'I like to take care of animals',
    'I like working outdoors',
    'I like to play a sport',
    'I like to paint a room',
    'I like to cook',
  ],
  I: [
    'I like to do experiments',
    'I like to figure out how things work',
    'I am good with numbers and charts',
    'I enjoy science',
    'I like to do puzzles',
    'I like to analyze things (problems/solutions)',
    'I like to evaluate a crime scene',
  ],
  A: [
    'I like acting in a play',
    'I like to sing or play an instrument',
    'I like to draw',
    'I like to design stage sets',
    'I like to take photographs',
    'I enjoy creative writing',
    'I like to read about art and music',
  ],
  S: [
    'I like to get into discussions about issues',
    'I like trying to help people solve their problems',
    'I like helping people',
    'I like to teach or train people',
    'I like to meet new people',
    'I like to volunteer for a charity',
    'I like to work in teams',
  ],
  E: [
    'I like selling things',
    'I like to start a club',
    'I like to take charge',
    'I like to manage money',
    'I like to lead',
    'I would like to start my own business',
    'I like to give speeches',
  ],
  C: [
    'I follow a recipe',
    'I like to organize things (files, desks/offices)',
    'I like to create a budget',
    'I like to follow instructions',
    'I like to be a bank teller',
    'I would like to work in an office',
    'I am good at keeping records of my work',
  ],
};

export default function HollandCodeTest({ onCompleted }: { onCompleted?: (code: string) => void }) {
  const { userProfile } = useAuth();
  // checkbox for like/interest => true/false
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleToggle = (key: string, val: boolean) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const scores = useMemo(() => {
    const base: Record<CategoryKey, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    (Object.keys(QUESTIONS) as CategoryKey[]).forEach(cat => {
      QUESTIONS[cat].forEach((_, idx) => {
        const k = `${cat}-${idx}`;
        if (answers[k]) base[cat] += 1;
      });
    });
    return base;
  }, [answers]);

  const hollandCode = useMemo(() => {
    const entries = Object.entries(scores) as Array<[CategoryKey, number]>;
    entries.sort((a, b) => b[1] - a[1]);
    return entries.map(e => e[0]).join('').slice(0, 3);
  }, [scores]);

  const reset = () => {
    setAnswers({});
    setResult(null);
  };

  const submit = async () => {
    if (!userProfile?.id) return;
    setSubmitting(true);
    try {
      // Resolve student_id
      let studentId = userProfile.studentProfile?.id as string | undefined;
      if (!studentId) {
        const { data: row } = await supabase.from('students').select('id').eq('user_id', userProfile.id).maybeSingle();
        studentId = row?.id;
      }
      if (!studentId) throw new Error('Student profile not found');

      const payload = {
        student_id: studentId,
        test_type: 'holland',
        holland_code: hollandCode,
        raw_scores: scores as any,
        completed_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('psychometric_results')
        .upsert(payload, { onConflict: 'student_id,test_type' as any });
      if (error) throw error;
      setResult(hollandCode);
      onCompleted?.(hollandCode);
    } catch (e) {
      // noop; caller can surface toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-2xl font-bold text-blue-800">🧭 Psychometric Tests – Holland Code Assessment</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Intro text */}
        <div className="mb-6 text-gray-700 text-sm leading-relaxed">
          <p className="mb-2">This quiz uses the scientific Holland Code model to show you which jobs will suit your interests, talents, and aptitude.</p>
          <p className="mb-2">Do not worry about whether you have the skills or training to do an activity, or how much money you might make. Think whether you would enjoy doing the activity or not.</p>
          <p className="mb-2">Completing this quiz might help you identify the types of occupations in which you would have the most interest and get the most satisfaction, and it will give you a place to start your career exploration.</p>
          <p className="mt-1">Please select all activities that you like or are interested in from each of these groups.</p>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm">
              <div className="text-sm text-green-800">✅ Your Holland Code</div>
              <div className="text-3xl font-bold text-green-900">{result}</div>
            </div>
            <Button variant="outline" onClick={reset} className="border-blue-200 text-blue-700 hover:bg-blue-50">↻ Retake Test</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {(Object.keys(QUESTIONS) as CategoryKey[]).map(cat => (
              <div key={cat} className="p-4 bg-white rounded-lg border shadow-sm">
                <div className="text-xl font-semibold mb-2 text-blue-800">{CATEGORY_LABELS[cat]} ({cat})</div>
                <div className="space-y-2">
                  {QUESTIONS[cat].map((q, idx) => {
                    const k = `${cat}-${idx}`;
                    const v = !!answers[k];
                    return (
                      <div key={k} className="flex items-center gap-3 p-3 bg-white rounded border hover:border-blue-200 transition-colors">
                        <input id={k} type="checkbox" checked={v} onChange={(e)=> handleToggle(k, e.target.checked)} className="w-4 h-4" />
                        <label htmlFor={k} className="text-base text-gray-800 cursor-pointer select-none">{q}</label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <Button onClick={submit} disabled={submitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">✨ Submit</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


