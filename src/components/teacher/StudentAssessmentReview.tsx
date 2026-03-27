import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, CheckCircle, AlertCircle, Eye, Volume2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  class_name: string;
  assessment_count: number;
}

interface Assessment {
  id: string;
  assessment_type: string;
  assessment_title: string;
  responses: any;
  completed_at: string | null;
  updated_at?: string | null;
  review_status: string;
}

interface StudentAssessmentReviewProps {
  onReviewUpdate?: () => void;
}

export default function StudentAssessmentReview({ onReviewUpdate }: StudentAssessmentReviewProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [inspirationQuestions, setInspirationQuestions] = useState<any[]>([]);
  const [dreamsQuestions, setDreamsQuestions] = useState<any[]>([]);
  const [aboutMeFields, setAboutMeFields] = useState<any[]>([]);
  const [aboutMeFieldsByLang, setAboutMeFieldsByLang] = useState<Record<string, any[]>>({});
  const [dreamsQuestionTextByLang, setDreamsQuestionTextByLang] = useState<Record<string, Record<string, string>>>({});
  const [schoolQuestionTextByLang, setSchoolQuestionTextByLang] = useState<Record<string, Record<string, string>>>({});
  const [hobbiesQuestionTextByLang, setHobbiesQuestionTextByLang] = useState<Record<string, Record<string, string>>>({});
  const [roleModelsQuestionTextByLang, setRoleModelsQuestionTextByLang] = useState<Record<string, Record<string, string>>>({});
  const [schoolLearningQuestions, setSchoolLearningQuestions] = useState<any[]>([]);
  const [hobbiesQuestions, setHobbiesQuestions] = useState<any[]>([]);
  const [roleModelsQuestions, setRoleModelsQuestions] = useState<any[]>([]);
  const [hollandQuestions, setHollandQuestions] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchInspirationQuestions();
    fetchDreamsQuestions();
    fetchAboutMeFields();
    fetchSchoolLearningQuestions();
    fetchHobbiesQuestions();
    fetchRoleModelsQuestions();
    fetchHollandQuestions();
  }, []);

  const fetchInspirationQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_inspiration_questions');
      if (error) {
        logger.error('Error fetching inspiration questions:', error);
        return;
      }
      logger.log('✅ Loaded inspiration questions:', data);
      setInspirationQuestions(data || []);
    } catch (error) {
      logger.error('Error loading inspiration questions:', error);
    }
  };

  const fetchDreamsQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_dreams_questions');
      if (error) {
        logger.error('Error fetching dreams questions:', error);
        return;
      }
      const baseQuestions = Array.isArray(data) ? data : [];
      logger.log('✅ Loaded dreams questions:', baseQuestions);
      setDreamsQuestions(baseQuestions);

      // Build language-specific question text maps so teacher sees questions in student's answer language
      const textByLang: Record<string, Record<string, string>> = {};

      // English from base questions
      const enMap: Record<string, string> = {};
      baseQuestions.forEach((q: any) => {
        if (q?.sequence_number != null && q.question_text) {
          enMap[`question${q.sequence_number}`] = q.question_text;
        }
      });
      textByLang.en = enMap;

      // Tamil and Kannada translations from i18n RPC
      const langs: Array<'ta' | 'kn'> = ['ta', 'kn'];
      for (const lang of langs) {
        try {
          const { data: i18nData } = await supabase.rpc('get_dreams_questions_i18n', { p_lang: lang } as any);
          const langMap: Record<string, string> = {};
          const rows: any[] = Array.isArray(i18nData)
            ? i18nData
            : (i18nData as any)?.data && Array.isArray((i18nData as any).data)
              ? (i18nData as any).data
              : [];
          rows.forEach((row: any) => {
            if (row?.key && row?.text) {
              langMap[row.key] = row.text;
            }
          });
          logger.log(`✅ Loaded Dreams i18n for ${lang}:`, Object.keys(langMap).length);
          textByLang[lang] = langMap;
        } catch (i18nError) {
          logger.warn(`⚠️ Error loading Dreams i18n for lang=${lang}:`, i18nError);
        }
      }

      setDreamsQuestionTextByLang(textByLang);
    } catch (error) {
      logger.error('Error loading dreams questions:', error);
    }
  };

  const fetchAboutMeFields = async () => {
    try {
      logger.log('📥 Fetching About Me fields for all languages...');
      const langs: Array<'en' | 'ta' | 'kn'> = ['en', 'ta', 'kn'];
      const fieldsByLang: Record<string, any[]> = {};

      for (const lang of langs) {
        try {
          let rows: any[] | null = null;
          try {
            const { data: i18nData } = await supabase.rpc('get_about_me_fields_i18n', { p_lang: lang } as any);
            if (Array.isArray(i18nData)) rows = i18nData as any[];
            if (i18nData && !Array.isArray(i18nData)) rows = (i18nData as any) as any[];
            if (rows && typeof rows === 'object' && !Array.isArray(rows)) {
              const maybe = (rows as any).data;
              if (Array.isArray(maybe)) rows = maybe;
            }
          } catch (err) {
            logger.warn(`About Me: get_about_me_fields_i18n failed for lang=${lang}`, err);
          }

          if (!rows && lang === 'en') {
            const { data, error } = await supabase.rpc('get_about_me_fields');
            if (error) {
              logger.error('Error fetching about me fields (fallback en):', error);
              continue;
            }
            rows = data as any[];
          }

          if (rows && Array.isArray(rows)) {
            logger.log(`✅ Loaded About Me fields for ${lang}:`, rows.length);
            fieldsByLang[lang] = rows;
          } else {
            logger.warn(`⚠️ No About Me fields returned for lang=${lang}`);
          }
        } catch (innerError) {
          logger.error(`Error loading about me fields for lang=${lang}:`, innerError);
        }
      }

      // Set default English fields for backwards compatibility
      if (fieldsByLang.en && fieldsByLang.en.length > 0) {
        setAboutMeFields(fieldsByLang.en);
      } else {
        // If we somehow didn't get English, but have some other lang, pick first
        const firstLang = Object.keys(fieldsByLang)[0];
        if (firstLang) {
          setAboutMeFields(fieldsByLang[firstLang]);
        } else {
          setAboutMeFields([]);
        }
      }
      setAboutMeFieldsByLang(fieldsByLang);
    } catch (error) {
      logger.error('Error loading about me fields:', error);
    }
  };

  const fetchSchoolLearningQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_school_learning_questions');
      if (error) {
        logger.error('Error fetching school learning questions:', error);
        return;
      }
      const baseQuestions = Array.isArray(data) ? data : [];
      logger.log('✅ Loaded school learning questions:', baseQuestions);
      setSchoolLearningQuestions(baseQuestions);

      // Build language-specific maps for question text (en from base, ta/kn from i18n RPC)
      const textByLang: Record<string, Record<string, string>> = {};

      const enMap: Record<string, string> = {};
      baseQuestions.forEach((q: any) => {
        if (q?.sequence_number != null && q.question_text) {
          enMap[`question${q.sequence_number}`] = q.question_text;
        }
      });
      textByLang.en = enMap;

      const langs: Array<'ta' | 'kn'> = ['ta', 'kn'];
      for (const lang of langs) {
        try {
          const { data: i18nData } = await supabase.rpc('get_school_learning_questions_i18n', { p_lang: lang } as any);
          const langMap: Record<string, string> = {};
          const rows: any[] = Array.isArray(i18nData)
            ? i18nData
            : (i18nData as any)?.data && Array.isArray((i18nData as any).data)
              ? (i18nData as any).data
              : [];
          rows.forEach((row: any) => {
            if (row?.key && row?.text) {
              langMap[row.key] = row.text;
            }
          });
          logger.log(`✅ Loaded School Learning i18n for ${lang}:`, Object.keys(langMap).length);
          textByLang[lang] = langMap;
        } catch (i18nError) {
          logger.warn(`⚠️ Error loading School Learning i18n for lang=${lang}:`, i18nError);
        }
      }

      setSchoolQuestionTextByLang(textByLang);
    } catch (error) {
      logger.error('Error loading school learning questions:', error);
    }
  };

  const fetchHobbiesQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_hobbies_questions');
      if (error) {
        logger.error('Error fetching hobbies questions:', error);
        return;
      }
      const baseQuestions = Array.isArray(data) ? data : [];
      logger.log('✅ Loaded hobbies questions:', baseQuestions);
      setHobbiesQuestions(baseQuestions);

      const textByLang: Record<string, Record<string, string>> = {};

      const enMap: Record<string, string> = {};
      baseQuestions.forEach((q: any) => {
        if (q?.sequence_number != null && q.question_text) {
          enMap[`question${q.sequence_number}`] = q.question_text;
        }
      });
      textByLang.en = enMap;

      const langs: Array<'ta' | 'kn'> = ['ta', 'kn'];
      for (const lang of langs) {
        try {
          const { data: i18nData } = await supabase.rpc('get_hobbies_questions_i18n', { p_lang: lang } as any);
          const langMap: Record<string, string> = {};
          const rows: any[] = Array.isArray(i18nData)
            ? i18nData
            : (i18nData as any)?.data && Array.isArray((i18nData as any).data)
              ? (i18nData as any).data
              : [];
          rows.forEach((row: any) => {
            if (row?.key && row?.text) {
              langMap[row.key] = row.text;
            }
          });
          logger.log(`✅ Loaded Hobbies i18n for ${lang}:`, Object.keys(langMap).length);
          textByLang[lang] = langMap;
        } catch (i18nError) {
          logger.warn(`⚠️ Error loading Hobbies i18n for lang=${lang}:`, i18nError);
        }
      }

      setHobbiesQuestionTextByLang(textByLang);
    } catch (error) {
      logger.error('Error loading hobbies questions:', error);
    }
  };

  const fetchRoleModelsQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_role_models_questions');
      if (error) {
        logger.error('Error fetching role models questions:', error);
        return;
      }
      const baseQuestions = Array.isArray(data) ? data : [];
      logger.log('✅ Loaded role models questions:', baseQuestions);
      setRoleModelsQuestions(baseQuestions || []);

      const textByLang: Record<string, Record<string, string>> = {};

      // We don't strictly need an English map because base question_text is already English,
      // but we include it for completeness.
      const enMap: Record<string, string> = {};
      baseQuestions.forEach((q: any, index: number) => {
        const key = `rm_q${(q as any).sequence_number || index + 1}`;
        if (q?.question_text) {
          enMap[key] = q.question_text;
        }
      });
      textByLang.en = enMap;

      const langs: Array<'ta' | 'kn'> = ['ta', 'kn'];
      for (const lang of langs) {
        try {
          const { data: i18nData } = await supabase.rpc('get_role_models_questions_i18n', { p_lang: lang } as any);
          const langMap: Record<string, string> = {};
          const rows: any[] = Array.isArray(i18nData)
            ? i18nData
            : (i18nData as any)?.data && Array.isArray((i18nData as any).data)
              ? (i18nData as any).data
              : [];
          rows.forEach((row: any) => {
            if (row?.key && row?.text) {
              langMap[row.key] = row.text;
            }
          });
          logger.log(`✅ Loaded Role Models i18n for ${lang}:`, Object.keys(langMap).length);
          textByLang[lang] = langMap;
        } catch (i18nError) {
          logger.warn(`⚠️ Error loading Role Models i18n for lang=${lang}:`, i18nError);
        }
      }

      setRoleModelsQuestionTextByLang(textByLang);
    } catch (error) {
      logger.error('Error loading role models questions:', error);
    }
  };

  const fetchHollandQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_holland_code_questions');
      if (error) {
        logger.error('Error fetching Holland Code questions:', error);
        return;
      }
      if (data && Array.isArray(data)) {
        const sorted = [...data].sort(
          (a: any, b: any) => (a.sequence_number || 0) - (b.sequence_number || 0)
        );
        logger.log('✅ Loaded Holland Code questions:', sorted.length);
        setHollandQuestions(sorted);
      } else {
        setHollandQuestions([]);
      }
    } catch (error) {
      logger.error('Error loading Holland Code questions:', error);
      setHollandQuestions([]);
    }
  };

  const updateReviewStatus = async (assessmentId: string, status: 'reviewed' | 'needs_revision' | 'flagged') => {
    setUpdatingStatus(assessmentId);

    try {
      const { error } = await supabase
        .from('assessment_responses')
        .update({
          review_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId);

      if (error) throw error;

      // Update local state
      setAssessments(prev => prev.map(assessment =>
        assessment.id === assessmentId
          ? { ...assessment, review_status: status }
          : assessment
      ));

      toast({
        title: "Status Updated",
        description: `Assessment marked as ${status.replace('_', ' ')}`,
      });

      // Refresh the overview stats in the parent component
      if (onReviewUpdate) {
        onReviewUpdate();
      }
    } catch (error) {
      logger.error('❌ Error updating review status:', error);
      toast({
        title: "Error",
        description: "Failed to update review status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const fetchStudents = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      logger.log('📡 Fetching students...');

      // Get teacher ID
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();

      if (teacherError || !teacherData) {
        logger.warn('Teacher profile not found');
        setStudents([]);
        return;
      }

      // Get students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          users!inner(full_name),
          classes(name)
        `)
        .eq('teacher_id', teacherData.id);

      if (studentsError) throw studentsError;

      // Get assessment counts for each student (unique assessment types only)
      const studentsWithCounts = await Promise.all(
        (studentsData || []).map(async (student: any) => {
          // Get all assessments for this student
          const { data: assessments } = await supabase
            .from('assessment_responses')
            .select('assessment_type')
            .eq('student_id', student.id);

          // Count unique assessment types
          const uniqueTypes = new Set((assessments || []).map(a => a.assessment_type));

          return {
            id: student.id,
            user_id: student.user_id,
            full_name: student.users?.full_name || 'Unknown',
            class_name: student.classes?.name || 'No class',
            assessment_count: uniqueTypes.size
          };
        })
      );

      logger.log('✅ Fetched students:', studentsWithCounts);
      setStudents(studentsWithCounts);
    } catch (error: any) {
      logger.error('❌ Error fetching students:', error);
      toast({
        title: 'Error',
        description: `Failed to load students: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async (studentId: string) => {
    try {
      setLoadingAssessments(true);
      logger.log('📡 Fetching assessments for student:', studentId);

      const { data, error } = await supabase
        .from('assessment_responses')
        .select('id, assessment_type, assessment_title, responses, completed_at, updated_at, review_status')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      logger.log('✅ Fetched all assessments:', data);

      // Get only the LATEST submission for each unique assessment (type + title).
      // Prefer completed submissions over drafts, and then use timestamp comparison.
      const latestByKey: Record<string, any> = {};

      (data || []).forEach((assessment: any) => {
        const key = `${assessment.assessment_type}::${assessment.assessment_title}`;
        const existing = latestByKey[key];

        if (!existing) {
          latestByKey[key] = assessment;
          return;
        }

        const existingCompleted = !!existing.completed_at;
        const currentCompleted = !!assessment.completed_at;

        // Always prefer a completed submission over a draft
        if (currentCompleted && !existingCompleted) {
          latestByKey[key] = assessment;
          return;
        }
        if (!currentCompleted && existingCompleted) {
          return;
        }

        // If both are completed or both are drafts, compare timestamps
        const existingDate = new Date(existing.completed_at || existing.updated_at || 0).getTime();
        const currentDate = new Date(assessment.completed_at || assessment.updated_at || 0).getTime();

        if (currentDate > existingDate) {
          latestByKey[key] = assessment;
        }
      });

      // Convert to array
      const sortedAssessments = Object.values(latestByKey);

      logger.log('✅ Unique assessments (latest only):', sortedAssessments);
      logger.log('📅 Assessment dates:', sortedAssessments.map((a: any) => ({
        type: a.assessment_type,
        completed_at: a.completed_at,
        updated_at: a.updated_at,
        hasDate: !!(a.completed_at || a.updated_at)
      })));
      setAssessments(sortedAssessments);
    } catch (error: any) {
      logger.error('❌ Error fetching assessments:', error);
      toast({
        title: 'Error',
        description: `Failed to load assessments: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setExpandedAssessment(null);
    fetchAssessments(student.id);
  };

  const toggleAssessmentExpand = (assessmentId: string) => {
    setExpandedAssessment(expandedAssessment === assessmentId ? null : assessmentId);
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'needs_revision':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const detectLangKeyFromResponses = (responses: any): 'en' | 'ta' | 'kn' => {
    const stack: any[] = [responses];
    const tamilRegex = /[\u0B80-\u0BFF]/;
    const kannadaRegex = /[\u0C80-\u0CFF]/;

    while (stack.length) {
      const value = stack.pop();
      if (!value) continue;
      if (typeof value === 'string') {
        if (tamilRegex.test(value)) return 'ta';
        if (kannadaRegex.test(value)) return 'kn';
      } else if (Array.isArray(value)) {
        for (const v of value) stack.push(v);
      } else if (typeof value === 'object') {
        for (const v of Object.values(value)) stack.push(v);
      }
    }
    return 'en';
  };

  const countNonEmptyResponses = (responses: any): number => {
    if (!responses || typeof responses !== 'object') return 0;
    return Object.values(responses).reduce((count: number, value: any) => {
      if (typeof value === 'string') {
        return value.trim() ? count + 1 : count;
      }
      if (Array.isArray(value)) {
        const hasContent = value.some(v => (v ?? '').toString().trim());
        return hasContent ? count + 1 : count;
      }
      if (value && typeof value === 'object') {
        const hasContent = Object.values(value).some(inner => {
          if (typeof inner === 'string') return inner.trim().length > 0;
          if (Array.isArray(inner)) return inner.some(v => (v ?? '').toString().trim());
          return false;
        });
        return hasContent ? count + 1 : count;
      }
      return count;
    }, 0);
  };

  const renderSummaryTabSection = (summaryResponses: Record<string, any>) => {
    const entries = Object.entries(summaryResponses).filter(([_, v]) => typeof v === 'string' && v.trim());
    if (entries.length === 0) return null;
    return (
      <div className="mt-6 border-t pt-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-600" />
          Summary Tab Responses
        </h4>
        <div className="space-y-3">
          {entries.map(([key, value], index) => (
            <div key={key} className="border-l-4 border-purple-400 pl-4">
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                {key.replace(/question/, 'Q')}
              </span>
              <div className="mt-1 bg-white p-3 rounded border border-gray-200">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{String(value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAssessmentResponses = (assessment: Assessment) => {
    const responses = assessment.responses;

    logger.log('🔍 Rendering assessment:', assessment.assessment_type);
    logger.log('📊 Responses data:', responses);
    logger.log('📊 Responses JSON:', JSON.stringify(responses, null, 2));
    logger.log('📋 Inspiration questions:', inspirationQuestions);

    // Check if it's the Inspiration assessment (has video structure)
    if (assessment.assessment_type === 'inspiration' && responses) {
      // Inspiration assessment has structure: { video1: {...}, video2: {...}, ... }
      const videoKeys = Object.keys(responses).filter(key => key.startsWith('video'));

      logger.log('🎥 Video keys found:', videoKeys);

      if (videoKeys.length === 0) {
        logger.warn('⚠️ No video keys found in responses');
        return (
          <div className="text-sm text-gray-500">No responses recorded</div>
        );
      }

      return (
        <div className="space-y-6">
          {videoKeys.map((videoKey, index) => {
            const videoData = responses[videoKey];

            logger.log(`🎬 Processing ${videoKey}:`, videoData);
            logger.log(`   Keys in ${videoKey}:`, Object.keys(videoData));
            logger.log(`   Full ${videoKey} structure:`, JSON.stringify(videoData, null, 2));

            if (!videoData) {
              logger.warn(`⚠️ No data for ${videoKey}`);
              return null;
            }

            return (
              <div key={videoKey} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Video {index + 1}
                </h4>

                <div className="space-y-4">
                  {/* Render each question dynamically - show ALL questions for ALL videos */}
                  {(() => {
                    // Always show all questions from the database (should be 9 questions)
                    // but also include any additional answers that were persisted even if the template changed
                    // Always show exactly 10 questions as per requirement
                    const questionCount = 10;

                    // Generate array of question numbers from the template (1..10)
                    const templateQuestionNumbers = Array.from({ length: questionCount }, (_, i) => i + 1);

                    // Include any question numbers that exist in the stored responses to avoid hiding answers
                    // BUT strictly filter to keep only <= 10 as per user requirement
                    const answeredQuestionNumbers = Object.keys(videoData || {})
                      .filter((key) => /^question\d+$/.test(key))
                      .map((key) => parseInt(key.replace('question', ''), 10))
                      .filter((num) => Number.isFinite(num));

                    const questionNumbers = Array.from(
                      new Set<number>([...templateQuestionNumbers, ...answeredQuestionNumbers])
                    )
                      .filter(num => num <= 10) // STRICT FILTER: Never show > 10
                      .sort((a, b) => a - b);

                    return questionNumbers.map((questionNum) => {
                      const questionKey = `question${questionNum}`;

                      // Get the actual question text from database
                      const questionData = inspirationQuestions[questionNum - 1];
                      const questionText = questionData?.question_text || questionData?.help_text || `Question ${questionNum}`;

                      // Get the answer from database - check videoData directly
                      // The student saves data as: question1, question2, etc.
                      // This will get answers for questions 1-9 for all videos (1-5 and 6)
                      const textResponse = videoData && typeof videoData === 'object'
                        ? videoData[questionKey]
                        : null;

                      // Handle both string and other types
                      const responseText = textResponse
                        ? (typeof textResponse === 'string' ? textResponse : String(textResponse))
                        : '';

                      // Audio is stored separately in audio_responses table, 
                      // check audioResponsesMap with key like "video1_question3"
                      const audioKey = `${videoKey}_${questionKey}`;
                      const audioUrl = videoData && typeof videoData === 'object'
                        ? videoData[`${questionKey}_audio`]
                        : null; // Check if audio URL is stored in responses

                      logger.log(`  Q${questionNum}: questionKey="${questionKey}", videoKey="${videoKey}", hasText=${!!responseText}, responseLength=${responseText.length}, audioUrl=${!!audioUrl}`);

                      // Show ALL questions for ALL videos (1-9)
                      // Display answers from database if they exist
                      // Show "No response provided" if the answer doesn't exist in database

                      return (
                        <div key={questionNum} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Q{questionNum}
                            </span>
                            <p className="text-sm font-medium text-gray-700 flex-1">
                              {questionText}
                            </p>
                          </div>

                          <div className="space-y-2 ml-8">
                            {responseText && responseText.trim() ? (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {responseText}
                                </p>
                              </div>
                            ) : audioUrl ? (
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-gray-400" />
                                <audio controls className="flex-1 max-w-md">
                                  <source src={audioUrl} type="audio/webm" />
                                  <source src={audioUrl} type="audio/mp4" />
                                  <source src={audioUrl} type="audio/mpeg" />
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                                <p className="text-sm text-gray-400 italic">
                                  No response provided
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Check if it's the Dreams assessment (has part structure)
    if (assessment.assessment_type === 'dreams' && responses) {
      logger.log('💭 Rendering Dreams assessment responses');
      logger.log('📊 Dreams responses structure:', responses);
      logger.log('📊 Dreams responses keys:', Object.keys(responses || {}));
      logger.log('📋 Dreams questions:', dreamsQuestions);
      logger.log('📋 Dreams questions count:', dreamsQuestions.length);

      // Dreams responses can have two structures:
      // 1. Old structure: { questionId1: "answer", questionId2: "answer", ... }
      // 2. New structure: { part1: { question1: "answer", ... }, part2: { ... }, ... }

      // Check if it's the new structure (has "part" keys)
      const hasPartStructure = Object.keys(responses).some(key => key.startsWith('part'));

      const dreamsLangKey = detectLangKeyFromResponses(responses);
      const dreamsLangMap =
        dreamsQuestionTextByLang[dreamsLangKey] ||
        dreamsQuestionTextByLang.en ||
        {};

      if (hasPartStructure) {
        // New structure: { part1: { question1: "...", question2: "..." }, part2: {...} }
        const parts = Object.keys(responses).filter(key => key.startsWith('part')).sort();

        if (parts.length === 0) {
          return (
            <div className="text-sm text-gray-500">No responses recorded</div>
          );
        }

        // Group questions by section
        const questionsBySection: Record<string, any[]> = {};
        dreamsQuestions.forEach(q => {
          const section = q.section || 'section1';
          if (!questionsBySection[section]) {
            questionsBySection[section] = [];
          }
          questionsBySection[section].push(q);
        });

        // If questions are not loaded, render from response structure
        if (dreamsQuestions.length === 0) {
          logger.log('⚠️ Dreams questions not loaded, rendering from response structure');
          return (
            <div className="space-y-6">
              {parts.map((partKey) => {
                const partResponses = responses[partKey] || {};
                const questionKeys = Object.keys(partResponses).filter(key =>
                  key.startsWith('question')
                ).sort((a, b) => {
                  const numA = parseInt(a.replace('question', ''), 10) || 0;
                  const numB = parseInt(b.replace('question', ''), 10) || 0;
                  return numA - numB;
                });

                const sectionTitles: Record<string, string> = {
                  'part1': 'Section 1: Your Dreams & Future Goals',
                  'part2': 'Section 2: Career & Life Aspirations',
                  'part3': 'Section 3: Making Dreams Reality'
                };

                return (
                  <div key={partKey} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-4">
                      {sectionTitles[partKey] || partKey}
                    </h4>

                    <div className="space-y-4">
                      {questionKeys.map((questionKey, questionIndex) => {
                        const responseText = partResponses[questionKey];
                        const displayText = typeof responseText === 'string' ? responseText : String(responseText || '');
                        const questionNum = parseInt(questionKey.replace('question', ''), 10) || (questionIndex + 1);

                        return (
                          <div key={questionKey} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Q{questionNum}
                              </span>
                              <p className="text-sm font-medium text-gray-700 flex-1">
                                {questionKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                            </div>

                            <div className="ml-8">
                              {displayText && displayText.trim() ? (
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {displayText}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                                  <p className="text-sm text-gray-400 italic">
                                    No response provided
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {parts.map((partKey) => {
              const partResponses = responses[partKey] || {};
              // Map part1 -> section1, part2 -> section2, part3 -> section3
              const partNumber = parseInt(partKey.replace('part', ''), 10);
              const sectionKey = `section${partNumber}`;
              const sectionQuestions = questionsBySection[sectionKey] || [];

              // Sort questions by sequence_number (this is the order they were shown to the student)
              const sortedQuestions = [...sectionQuestions].sort((a, b) =>
                (a.sequence_number || 0) - (b.sequence_number || 0)
              );

              const sectionTitles: Record<string, string> = {
                'section1': 'Section 1: Your Dreams & Future Goals',
                'section2': 'Section 2: Career & Life Aspirations',
                'section3': 'Section 3: Making Dreams Reality'
              };

              return (
                <div key={partKey} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    {sectionTitles[sectionKey] || partKey}
                  </h4>

                  <div className="space-y-4">
                    {sortedQuestions.length > 0 ? (
                      sortedQuestions.map((question) => {
                        // The response key is question1, question2, etc. based on position within the part
                        // We need to find the position of this question in the sorted list
                        const questionIndex = sortedQuestions.findIndex(q => q.id === question.id);
                        const questionKey = `question${questionIndex + 1}`;
                        const responseText = partResponses[questionKey];
                        const displayText = typeof responseText === 'string' ? responseText : String(responseText || '');

                        // Display questions in simple sequential order within this section (Q1, Q2, Q3...)
                        // regardless of underlying global sequence_number to keep things easy to read.
                        const displayQuestionNum = questionIndex + 1;

                        logger.log(`  Part ${partKey}, Seq ${question.sequence_number}, Q${questionIndex + 1}: questionKey="${questionKey}", hasResponse=${!!responseText}, responseLength=${displayText.length}`);

                        const seqNum = question.sequence_number || questionIndex + 1;
                        const translationKey = `question${seqNum}`;
                        const questionText =
                          dreamsLangMap[translationKey] ||
                          question.question_text ||
                          `Question ${seqNum}`;

                        return (
                          <div key={question.id || questionIndex} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Q{displayQuestionNum}
                              </span>
                              <p className="text-sm font-medium text-gray-700 flex-1">
                                {questionText}
                              </p>
                            </div>

                            <div className="ml-8">
                              {displayText && displayText.trim() ? (
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {displayText}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                                  <p className="text-sm text-gray-400 italic">
                                    No response provided
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Fallback: render from response keys if questions not found
                      Object.keys(partResponses).filter(key => key.startsWith('question')).sort((a, b) => {
                        const numA = parseInt(a.replace('question', ''), 10) || 0;
                        const numB = parseInt(b.replace('question', ''), 10) || 0;
                        return numA - numB;
                      }).map((questionKey) => {
                        const responseText = partResponses[questionKey];
                        const displayText = typeof responseText === 'string' ? responseText : String(responseText || '');
                        const questionNum = parseInt(questionKey.replace('question', ''), 10);

                        return (
                          <div key={questionKey} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Q{questionNum}
                              </span>
                              <p className="text-sm font-medium text-gray-700 flex-1">
                                {questionKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                            </div>

                            <div className="ml-8">
                              {displayText && displayText.trim() ? (
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {displayText}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                                  <p className="text-sm text-gray-400 italic">
                                    No response provided
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      } else {
        // Old structure: { questionId1: "answer", questionId2: "answer", ... }
        // Map question IDs to question text and ensure ordering matches what student saw
        const questionMap = new Map(dreamsQuestions.map(q => [q.id, q]));

        // Build an array of {question, answer} and sort by sequence_number
        const qaList = Object.entries(responses as any)
          .map(([questionId, answer]) => {
            const question = questionMap.get(questionId);
            if (!question) return null;
            return { question, answer };
          })
          .filter(Boolean) as { question: any; answer: any }[];

        qaList.sort((a, b) => (a.question.sequence_number || 0) - (b.question.sequence_number || 0));

        return (
          <div className="space-y-4">
            {qaList.map(({ question, answer }, index) => {
              const seqNum = question.sequence_number || index + 1;
              const translationKey = `question${seqNum}`;
              const questionText =
                dreamsLangMap[translationKey] || question.question_text || `Question ${index + 1}`;
              const responseText = typeof answer === 'string' ? answer : String(answer || '');

              return (
                <div key={question.id || index} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {/* Display contiguous numbering (Q1, Q2, Q3...) like the student view */}
                      Q{index + 1}
                    </span>
                    <p className="text-sm font-medium text-gray-700 flex-1">
                      {questionText}
                    </p>
                  </div>

                  <div className="ml-8">
                    {responseText && responseText.trim() ? (
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {responseText}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                        <p className="text-sm text-gray-400 italic">
                          No response provided
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }

    // Check if it's About Me assessment
    // NOTE: Historically this used assessment_type = 'personality', but it is now stored as 'about_me'.
    // We support BOTH to ensure all legacy and new records render correctly.
    if (
      (assessment.assessment_type === 'about_me' || assessment.assessment_type === 'personality') &&
      assessment.assessment_title === 'About Me' &&
      responses
    ) {
      logger.log('👤 Rendering About Me assessment responses');
      logger.log('📊 About Me responses:', responses);
      logger.log('📊 About Me responses keys:', Object.keys(responses || {}));
      logger.log('📋 About Me fields (default):', aboutMeFields);
      logger.log('📋 About Me fields count:', aboutMeFields.length);

      // Detect language of the student's answers so we can show questions in same language
      const langKey = detectLangKeyFromResponses(responses);
      const localizedFields =
        (langKey === 'ta' || langKey === 'kn') && aboutMeFieldsByLang[langKey]?.length
          ? aboutMeFieldsByLang[langKey]
          : aboutMeFields;

      logger.log('🌐 Using About Me fields for lang:', langKey, 'count:', localizedFields.length);

      // About Me responses are stored as { question1: "...", question2: "...", ... }
      // Sort fields by sequence_number
      const sortedFields = [...localizedFields].sort((a, b) =>
        (a.sequence_number || 0) - (b.sequence_number || 0)
      );

      // If fields are not loaded yet, try to render from response keys directly
      if (sortedFields.length === 0) {
        logger.log('⚠️ About Me fields not loaded, rendering from response keys');
        const responseKeys = Object.keys(responses).filter(key =>
          key.startsWith('question') || /^question\d+$/.test(key)
        ).sort((a, b) => {
          const numA = parseInt(a.replace('question', ''), 10) || 0;
          const numB = parseInt(b.replace('question', ''), 10) || 0;
          return numA - numB;
        });

        return (
          <div className="space-y-4">
            {responseKeys.map((key, index) => {
              const responseText = responses[key];
              const displayText = typeof responseText === 'string' ? responseText :
                Array.isArray(responseText) ? responseText.join(', ') :
                  String(responseText || '');

              return (
                <div key={key} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Q{index + 1}
                    </span>
                    <p className="text-sm font-medium text-gray-700 flex-1">
                      {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>

                  <div className="ml-8">
                    {displayText && displayText.trim() ? (
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {displayText}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                        <p className="text-sm text-gray-400 italic">
                          No response provided
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {sortedFields.map((field) => {
            // About Me responses are stored as question1, question2, etc. based on global sequence_number
            // The sequence_number from the database is the global order (1-20)
            const questionNum = field.sequence_number;
            const questionKey = `question${questionNum}`;

            // Try questionN format first (most common), then field_key
            const responseText = responses[questionKey] || responses[field.field_key] || '';
            const displayText = typeof responseText === 'string' ? responseText :
              Array.isArray(responseText) ? responseText.join(', ') :
                String(responseText || '');

            logger.log(`  Seq ${questionNum}, Q${questionNum}: questionKey="${questionKey}", fieldKey="${field.field_key}", hasResponse=${!!responseText}, responseLength=${displayText.length}, questionText="${field.question_text?.substring(0, 50)}..."`);

            return (
              <div key={field.field_key || questionNum} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Q{questionNum}
                  </span>
                  <p className="text-sm font-medium text-gray-700 flex-1">
                    {field.question_text}
                  </p>
                </div>

                <div className="ml-8">
                  {displayText && displayText.trim() ? (
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {displayText}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                      <p className="text-sm text-gray-400 italic">
                        No response provided
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Check if it's School Learning assessment
    if (assessment.assessment_type === 'school_learning' && responses) {
      logger.log('📚 Rendering School Learning assessment responses (normalized)');
      logger.log('📊 Raw School Learning responses:', responses);
      logger.log('📋 School Learning questions:', schoolLearningQuestions);

      // Normalize responses into the same structure used by MySchoolLearningAssessment
      const raw = responses as any;
      const norm = {
        section1: {
          question1: raw.section1?.question1 ?? raw.part1?.question1 ?? '',
          question2: raw.section1?.question2 ?? raw.part1?.question2 ?? '',
          question3: raw.section1?.question3 ?? raw.part1?.question3 ?? '',
          question4: raw.section1?.question4 ?? raw.part1?.question4 ?? '',
        },
        section2: {
          question5: raw.section2?.question5 ?? raw.part2?.question5 ?? '',
          question6: raw.section2?.question6 ?? raw.part2?.question6 ?? '',
          question7: raw.section2?.question7 ?? raw.part2?.question7 ?? '',
          question8: raw.section2?.question8 ?? raw.part2?.question8 ?? '',
        },
        section3: {
          question9: raw.section3?.question9 ?? raw.part2?.question9 ?? '',
          question10: raw.section3?.question10 ?? raw.part2?.question10 ?? '',
          question11: raw.section3?.question11 ?? raw.part2?.question11 ?? {},
          question12: raw.section3?.question12 ?? raw.part2?.question12 ?? '',
        },
        section4: {
          question13: raw.section4?.question13 ?? raw.part3?.question13 ?? '',
          question14: raw.section4?.question14 ?? raw.part3?.question14 ?? '',
          question15: raw.section4?.question15 ?? raw.part3?.question15 ?? '',
          question16: raw.section4?.question16 ?? raw.part3?.question16 ?? '',
        },
        section5: {
          question17: raw.section5?.question17 ?? raw.part3?.question17 ?? '',
          question18: raw.section5?.question18 ?? raw.part3?.question18 ?? '',
          question19: raw.section5?.question19 ?? raw.part3?.question19 ?? '',
          question20: raw.section5?.question20 ?? raw.part3?.question20 ?? '',
          question21: raw.section5?.question21 ?? raw.part3?.question21 ?? '',
        },
      } as any;

      // Helper to get answer by global question number
      const getAnswer = (qNum: number): any => {
        if (qNum >= 1 && qNum <= 4) return norm.section1[`question${qNum}`];
        if (qNum >= 5 && qNum <= 8) return norm.section2[`question${qNum}`];
        if (qNum >= 9 && qNum <= 12) return norm.section3[`question${qNum}`];
        if (qNum >= 13 && qNum <= 16) return norm.section4[`question${qNum}`];
        if (qNum >= 17 && qNum <= 21) return norm.section5[`question${qNum}`];
        return '';
      };

      // Index questions by sequence_number for easy lookup
      const questionsByNumber = new Map<number, any>();
      (schoolLearningQuestions || []).forEach((q: any) => {
        if (q.sequence_number != null) {
          questionsByNumber.set(q.sequence_number, q);
        }
      });

      const sections = [
        { id: 'section1', title: 'Section 1: Subjects & Learning Preferences', questions: [1, 2, 3, 4] },
        { id: 'section2', title: 'Section 2: Subjects & Learning Preferences', questions: [5, 6, 7, 8] },
        { id: 'section3', title: 'Section 3: Academic Performance & Learning Methods', questions: [9, 10, 11, 12] },
        { id: 'section4', title: 'Section 4: School Relationships & Experiences', questions: [13, 14, 15, 16] },
        { id: 'section5', title: 'Section 5: Additional Information & Future Plans', questions: [17, 18, 19, 20, 21] },
      ];

      const schoolLangKey = detectLangKeyFromResponses(responses);
      const schoolLangMap =
        schoolQuestionTextByLang[schoolLangKey] ||
        schoolQuestionTextByLang.en ||
        {};

      return (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-800 mb-4">{section.title}</h4>

              <div className="space-y-4">
                {section.questions.map((qNum, idx) => {
                  const question = questionsByNumber.get(qNum);
                  const rawAnswer = getAnswer(qNum);

                  // Convert answer to display text (handle checkbox object for Q11)
                  let responseText = '';
                  if (typeof rawAnswer === 'string') {
                    responseText = rawAnswer;
                  } else if (rawAnswer && typeof rawAnswer === 'object') {
                    // For checkbox question (11), show selected options
                    const selectedOptions = Object.entries(rawAnswer)
                      .filter(([_, v]) => v === true || (typeof v === 'string' && v.trim()))
                      .map(([k]) => k);
                    responseText = selectedOptions.join(', ');
                  }

                  const translationKey = `question${qNum}`;
                  const questionText =
                    schoolLangMap[translationKey] ||
                    question?.question_text ||
                    `Question ${qNum}`;

                  return (
                    <div key={qNum} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Q{idx + 1}
                        </span>
                        <p className="text-sm font-medium text-gray-700 flex-1">
                          {questionText}
                        </p>
                      </div>

                      <div className="ml-8">
                        {responseText && responseText.trim() ? (
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{responseText}</p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                            <p className="text-sm text-gray-400 italic">No response provided</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Check if it's Hobbies assessment
    if (assessment.assessment_type === 'hobbies' && responses) {
      logger.log('🎨 Rendering Hobbies assessment responses');
      logger.log('📊 Hobbies responses:', responses);
      logger.log('📋 Hobbies questions:', hobbiesQuestions);

      // In the new Hobbies assessment, responses are stored by question ID (UUID),
      // e.g. { "<questionId1>": "answer", "<questionId2>": "answer", ... }.
      // We render questions in sequence_number order and look up by question.id.

      const sortedQuestions = [...hobbiesQuestions].sort(
        (a, b) => (a.sequence_number || 0) - (b.sequence_number || 0)
      );

      if (sortedQuestions.length === 0) {
        return <div className="text-sm text-gray-500">No questions found</div>;
      }

      const hobbiesLangKey = detectLangKeyFromResponses(responses);
      const hobbiesLangMap =
        hobbiesQuestionTextByLang[hobbiesLangKey] ||
        hobbiesQuestionTextByLang.en ||
        {};

      return (
        <div className="space-y-4">
          {sortedQuestions.map((question, index) => {
            const raw = (responses as any)[question.id] ?? '';
            const displayText =
              typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join(', ') : String(raw || '');

            const seqNum = question.sequence_number || index + 1;
            const translationKey = `question${seqNum}`;
            const questionText =
              hobbiesLangMap[translationKey] || question.question_text || `Question ${index + 1}`;

            return (
              <div key={question.id || index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Q{index + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-700 flex-1">{questionText}</p>
                </div>

                <div className="ml-8">
                  {displayText && displayText.trim() ? (
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{displayText}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                      <p className="text-sm text-gray-400 italic">No response provided</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Check if it's Role Models assessment
    if (assessment.assessment_type === 'role_models' && responses) {
      logger.log('👥 Rendering Role Models assessment responses');
      logger.log('📊 Role Models responses:', responses);
      logger.log('📋 Role Models questions:', roleModelsQuestions);

      // Role Models responses in the new assessment are stored as:
      // {
      //   roleModel1: { name, relationship, admirationReasons, ... },
      //   roleModel2: { ... },
      //   roleModel3: { ... },
      //   question12: "...",
      //   question13: "..."
      // }
      // We adapt that into an array for display.

      const roleModelsSource: any[] = [];
      if ((responses as any).roleModel1 || (responses as any).roleModel2 || (responses as any).roleModel3) {
        if ((responses as any).roleModel1) roleModelsSource.push((responses as any).roleModel1);
        if ((responses as any).roleModel2) roleModelsSource.push((responses as any).roleModel2);
        if ((responses as any).roleModel3) roleModelsSource.push((responses as any).roleModel3);
      } else if ((responses as any).roleModels && Array.isArray((responses as any).roleModels)) {
        // Backwards compatibility with any older array-based structure
        roleModelsSource.push(...(responses as any).roleModels);
      }

      const roleModels = roleModelsSource;

      if (!Array.isArray(roleModels) || roleModels.length === 0) {
        return (
          <div className="text-sm text-gray-500">No role models recorded</div>
        );
      }

      const sortedQuestions = [...roleModelsQuestions].sort(
        (a, b) => (a.sequence_number || 0) - (b.sequence_number || 0)
      );

      const roleModelsLangKey = detectLangKeyFromResponses(responses);
      const roleModelsLangMap =
        roleModelsQuestionTextByLang[roleModelsLangKey] ||
        roleModelsQuestionTextByLang.en ||
        {};

      return (
        <div className="space-y-6">
          {roleModels.map((roleModel: any, roleIndex: number) => (
            <div key={roleIndex} className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-800 mb-4">
                Role Model {roleIndex + 1}: {roleModel.name || 'Unnamed'}
              </h4>

              <div className="space-y-4">
                {sortedQuestions.map((question, questionIndex) => {
                  // Map question IDs/sequence to fields on RoleModel
                  // We support the current field names from MyRoleModelsAssessment.
                  const fieldMapping: Record<string, string> = {
                    // approximate mapping by semantic keys used in i18n and component
                    name: 'name',
                    relationship: 'relationship',
                    admirationReasons: 'admirationReasons',
                    profession: 'profession',
                    desiredQualities: 'desiredQualities',
                    careerDiscussed: 'careerDiscussed',
                    opinion: 'opinion',
                    willingToHelp: 'willingToHelp',
                    helpLookingFor: 'helpLookingFor',
                    similarities: 'similarities',
                    incorporatePlan: 'incorporatePlan'
                  };

                  // First try by explicit field key if present on question
                  let fieldKey = (question as any).field_key as string | undefined;
                  if (!fieldKey) {
                    // Fallback: map by known order if field_key isn't available
                    const orderFallback: string[] = [
                      'name',
                      'relationship',
                      'admirationReasons',
                      'profession',
                      'desiredQualities',
                      'careerDiscussed',
                      'opinion',
                      'willingToHelp',
                      'helpLookingFor',
                      'similarities',
                      'incorporatePlan'
                    ];
                    fieldKey = orderFallback[questionIndex] || '';
                  }

                  const roleField = fieldMapping[fieldKey] || fieldKey;
                  const responseText = roleModel[roleField] || '';
                  const displayText =
                    typeof responseText === 'string' ? responseText : String(responseText || '');

                  const translationKey = `rm_q${questionIndex + 1}`;
                  const questionText =
                    roleModelsLangMap[translationKey] ||
                    question.question_text ||
                    `Question ${questionIndex + 1}`;

                  return (
                    <div key={question.id || questionIndex} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Q{questionIndex + 1}
                        </span>
                        <p className="text-sm font-medium text-gray-700 flex-1">
                          {questionText}
                        </p>
                      </div>

                      <div className="ml-8">
                        {displayText && displayText.trim() ? (
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {displayText}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                            <p className="text-sm text-gray-400 italic">
                              No response provided
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Check if it's Holland Code (RIASEC) Test
    if (
      assessment.assessment_type === 'personality' &&
      assessment.assessment_title === 'Holland Code (RIASEC) Test' &&
      responses
    ) {
      logger.log('🧭 Rendering Holland Code assessment responses');
      logger.log('📊 Holland responses:', responses);
      logger.log('📋 Holland questions:', hollandQuestions);

      const sortedQuestions = [...hollandQuestions].sort(
        (a: any, b: any) => (a.sequence_number || 0) - (b.sequence_number || 0)
      );

      return (
        <div className="space-y-6">
          {/* Q&A for each Holland question */}
          <div className="space-y-4">
            {sortedQuestions.map((question, index) => {
              const questionNum = index + 1;
              const questionKey = `question${questionNum}`;
              const rawValue = (responses as any)[questionKey];

              let answerText = '';
              if (typeof rawValue === 'boolean') {
                answerText = rawValue ? 'Yes' : 'No';
              } else if (typeof rawValue === 'string') {
                answerText = rawValue;
              } else if (rawValue != null) {
                answerText = String(rawValue);
              }

              return (
                <div key={question.id || questionNum} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Q{question.sequence_number || questionNum}
                    </span>
                    <p className="text-sm font-medium text-gray-700 flex-1">
                      {question.question_text}
                    </p>
                  </div>

                  <div className="ml-8">
                    {answerText && answerText.trim() ? (
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {answerText}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                        <p className="text-sm text-gray-400 italic">No response provided</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary section: top types, scores, reflection */}
          {(responses.topTwoTypes || responses.scores || responses.reflection) && (
            <div className="border rounded-lg p-4 bg-white">
              <h4 className="font-semibold text-gray-800 mb-3">Summary</h4>

              {responses.topTwoTypes && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Top Two Personality Types</p>
                  <p className="text-sm text-gray-600 mt-1">{responses.topTwoTypes}</p>
                </div>
              )}

              {responses.scores && typeof responses.scores === 'object' && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Scores</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {Object.entries(responses.scores as any)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(' • ')}
                  </p>
                </div>
              )}

              {responses.reflection && typeof responses.reflection === 'string' && responses.reflection.trim() && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Student Reflection</p>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                    {responses.reflection}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Check for summary section in any assessment type
    const summarySection = responses?.summary;
    if (summarySection && typeof summarySection === 'object') {
      return (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 italic">No structured renderer for this assessment type.</div>
          {renderSummaryTabSection(summarySection)}
        </div>
      );
    }

    // For other assessments, render all responses dynamically in Q&A format
    if (!responses || typeof responses !== 'object') {
      return (
        <div className="text-sm text-gray-500">No responses recorded</div>
      );
    }

    // Generic Q&A format for any other assessment type
    const responseEntries = Object.entries(responses);

    return (
      <div className="space-y-4">
        {responseEntries.map(([key, value], index) => {
          // Format response value
          let responseText = '';
          if (typeof value === 'string') {
            responseText = value;
          } else if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              responseText = value.join(', ');
            } else {
              // For objects, show key-value pairs
              responseText = Object.entries(value)
                .filter(([_, v]) => v === true || (typeof v === 'string' && v.trim()))
                .map(([k, v]) => typeof v === 'string' ? `${k}: ${v}` : k)
                .join(', ');
            }
          } else {
            responseText = String(value || '');
          }

          return (
            <div key={key} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Q{index + 1}
                </span>
                <p className="text-sm font-medium text-gray-700 flex-1">
                  {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>

              <div className="ml-8">
                {responseText && responseText.trim() ? (
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {responseText}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                    <p className="text-sm text-gray-400 italic">
                      No response provided
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel: Students List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Students ({students.length})
            </CardTitle>
            <CardDescription>Click on a student to view their assessments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {students.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No students assigned to you yet
              </div>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentClick(student)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedStudent?.id === student.id
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className="font-medium text-gray-900">{student.full_name}</div>
                  <div className="text-xs text-gray-500">{student.class_name}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {student.assessment_count} assessment{student.assessment_count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Assessments */}
      <div className="lg:col-span-2">
        {!selectedStudent ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a student to view their assessments</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedStudent.full_name}'s Assessments
              </CardTitle>
              <CardDescription>{selectedStudent.class_name}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssessments ? (
                <div className="text-center py-8 text-gray-500">Loading assessments...</div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>This student hasn't completed any assessments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg overflow-hidden">
                      <div
                        className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleAssessmentExpand(assessment.id)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {assessment.assessment_title}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {(() => {
                                // Use completed_at if available and valid, otherwise try updated_at
                                const dateToUse = assessment.completed_at || assessment.updated_at;

                                if (!dateToUse) {
                                  return 'Not completed';
                                }

                                // Check if it's a valid date (not epoch, not null, not empty string)
                                const dateObj = new Date(dateToUse);
                                const isValidDate = !isNaN(dateObj.getTime()) &&
                                  dateObj.getFullYear() > 1970 &&
                                  dateToUse !== '1970-01-01T00:00:00.000Z' &&
                                  dateToUse !== '1970-01-01T00:00:00Z';

                                if (isValidDate) {
                                  return dateObj.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  });
                                }

                                return 'Not completed';
                              })()}
                            </div>
                            <Badge className={getReviewStatusColor(assessment.review_status || 'unreviewed')}>
                              {(assessment.review_status || 'unreviewed').replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {expandedAssessment === assessment.id ? 'Hide' : 'View'} Responses
                        </Button>
                      </div>

                      {expandedAssessment === assessment.id && (
                        <div className="p-4 bg-white border-t">
                          {renderAssessmentResponses(assessment)}
                          {assessment.responses?.summary && renderSummaryTabSection(assessment.responses.summary)}
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateReviewStatus(assessment.id, 'reviewed')}
                              disabled={updatingStatus === assessment.id}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {updatingStatus === assessment.id ? 'Updating...' : 'Mark as Reviewed'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReviewStatus(assessment.id, 'needs_revision')}
                              disabled={updatingStatus === assessment.id}
                            >
                              Needs Revision
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReviewStatus(assessment.id, 'flagged')}
                              disabled={updatingStatus === assessment.id}
                            >
                              Flag for Follow-up
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
