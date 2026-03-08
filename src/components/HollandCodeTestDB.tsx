import { logger } from '@/lib/logger';
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AssessmentService } from '@/services/assessmentService';

type CategoryKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

interface HollandCodeData {
  categories: { [key: string]: string };
  questions: { [key: string]: string[] };
}

export default function HollandCodeTestDB({ onCompleted }: { onCompleted?: (code: string) => void }) {
  const { userProfile } = useAuth();
  const [hollandData, setHollandData] = useState<HollandCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  // checkbox for like/interest => true/false
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Load Holland Code data from database
  useEffect(() => {
    const loadHollandData = async () => {
      try {
        setLoading(true);
        const data = await AssessmentService.getHollandCodeData();
        if (data) {
          setHollandData(data);
        }
      } catch (error) {
        logger.error('Error loading Holland Code data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHollandData();
  }, []);

  const handleToggle = (key: string, val: boolean) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const scores = useMemo(() => {
    if (!hollandData) return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    
    const base: Record<CategoryKey, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    (Object.keys(hollandData.questions) as CategoryKey[]).forEach(cat => {
      hollandData.questions[cat].forEach((_, idx) => {
        const k = `${cat}-${idx}`;
        if (answers[k]) base[cat] += 1;
      });
    });
    return base;
  }, [answers, hollandData]);

  const hollandCode = useMemo(() => {
    const entries = Object.entries(scores) as Array<[CategoryKey, number]>;
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 3).map(([cat]) => cat).join('');
  }, [scores]);

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

      // Save Holland Code results
      await supabase.from('assessment_responses').upsert({
        student_id: studentId,
        assessment_type: 'personality',
        assessment_title: 'Holland Code Test',
        responses: {
          answers,
          scores,
          holland_code: hollandCode
        },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      setResult(hollandCode);
      onCompleted?.(hollandCode);
    } catch (error) {
      logger.error('Error submitting Holland Code test:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Holland Code Test...</p>
        </div>
      </div>
    );
  }

  if (!hollandData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Failed to load Holland Code Test data.</p>
      </div>
    );
  }

  if (result) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Your Holland Code Results</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-bold text-blue-600 mb-4">{result}</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(scores).map(([category, score]) => (
              <div key={category} className="flex justify-between">
                <span>{hollandData.categories[category]}:</span>
                <span className="font-medium">{score}</span>
              </div>
            ))}
          </div>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Take Test Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Holland Code Interest Assessment</CardTitle>
        <p className="text-gray-600">
          Please indicate your level of interest in each activity by checking the box if you like or are interested in it.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {Object.entries(hollandData.questions).map(([category, questions]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {hollandData.categories[category]} ({category})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {questions.map((question, index) => {
                const key = `${category}-${index}`;
                return (
                  <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={key}
                      checked={answers[key] || false}
                      onChange={(e) => handleToggle(key, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={key} className="text-sm text-gray-700 cursor-pointer flex-1">
                      {question}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        <div className="flex justify-center pt-6">
          <Button 
            onClick={handleSubmit}
            disabled={submitting}
            size="lg"
            className="px-8"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
