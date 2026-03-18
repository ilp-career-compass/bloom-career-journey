import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { supabase } from '@/integrations/supabase/client';
import { aiSummaryService } from '@/services/aiSummaryService';
import { getDisplaySummary, AssessmentSummary } from '@/types/assessmentSummary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Loader2, Play, User, Star,
  BookOpen, Heart, Users, Compass
} from 'lucide-react';
import { useStudentStrings } from '@/components/student/studentStrings';

type ModuleConfig = {
  key: string;
  assessmentType: string;
  titleKey: string;
  stripColor: string;
  dotColor: string;
  titleColor: string;
  icon: React.ComponentType<{ className?: string }>;
};

const MODULES: ModuleConfig[] = [
  { key: 'inspiration', assessmentType: 'inspiration', titleKey: 'assessment_inspiration', stripColor: 'bg-indigo-500', dotColor: 'bg-indigo-400', titleColor: 'text-indigo-700', icon: Play },
  { key: 'about_me', assessmentType: 'about_me', titleKey: 'assessment_about_me', stripColor: 'bg-blue-500', dotColor: 'bg-blue-400', titleColor: 'text-blue-700', icon: User },
  { key: 'dreams', assessmentType: 'dreams', titleKey: 'assessment_dreams', stripColor: 'bg-purple-500', dotColor: 'bg-purple-400', titleColor: 'text-purple-700', icon: Star },
  { key: 'school_learning', assessmentType: 'school_learning', titleKey: 'assessment_school_learning', stripColor: 'bg-green-500', dotColor: 'bg-green-400', titleColor: 'text-green-700', icon: BookOpen },
  { key: 'hobbies', assessmentType: 'hobbies', titleKey: 'assessment_hobbies', stripColor: 'bg-orange-500', dotColor: 'bg-orange-400', titleColor: 'text-orange-700', icon: Heart },
  { key: 'role_models', assessmentType: 'role_models', titleKey: 'assessment_role_models', stripColor: 'bg-rose-500', dotColor: 'bg-rose-400', titleColor: 'text-rose-700', icon: Users },
];

const PAGE_TITLE: Record<string, string> = {
  en: 'My Career Compass',
  kn: 'ನನ್ನ ವೃತ್ತಿ ದಿಕ್ಸೂಚಿ',
  ta: 'என் தொழில் திசைகாட்டி',
  hi: 'मेरा करियर कम्पास',
};

const CAREER_DIR_TITLE: Record<string, string> = {
  en: 'My Career Direction',
  kn: 'ನನ್ನ ವೃತ್ತಿ ದಿಕ್ಕು',
  ta: 'என் தொழில் திசை',
  hi: 'मेरी करियर दिशा',
};

const SECTIONS_COMPLETE: Record<string, (n: number) => string> = {
  en: (n) => `${n} of 6 modules complete`,
  kn: (n) => `6 ರಲ್ಲಿ ${n} ಮಾಡ್ಯೂಲ್‌ಗಳು ಪೂರ್ಣ`,
  ta: (n) => `6 இல் ${n} பிரிவுகள் முடிந்தது`,
  hi: (n) => `6 में से ${n} मॉड्यूल पूरे`,
};

type ProfileCardAnswers = Record<string, string>;
type ProfileCardQuestionLabels = { key: string; label: string }[];

interface ProfileCardPageProps {
  studentIdOverride?: string;
  readOnly?: boolean;
}

export default function ProfileCardPage({ studentIdOverride, readOnly }: ProfileCardPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLang();
  const params = useParams<{ studentId?: string }>();

  const studentId = studentIdOverride || params.studentId || user?.id || '';
  const lang = (language || 'en') as 'en' | 'kn' | 'ta' | 'hi';
  const { t } = useStudentStrings(lang);

  const [summaries, setSummaries] = useState<Record<string, AssessmentSummary | null>>({});
  const [answers, setAnswers] = useState<Record<string, ProfileCardAnswers>>({});
  const [questionLabels, setQuestionLabels] = useState<Record<string, ProfileCardQuestionLabels>>({});
  const [careerDirection, setCareerDirection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generatingKeys, setGeneratingKeys] = useState<Set<string>>(new Set());
  const [generatingDirection, setGeneratingDirection] = useState(false);
  const [studentName, setStudentName] = useState('');

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', studentId)
        .single();
      if (profile) setStudentName(profile.full_name || '');

      const summaryMap: Record<string, AssessmentSummary | null> = {};
      for (const mod of MODULES) {
        const { data: resp } = await supabase
          .from('assessment_responses')
          .select('id')
          .eq('student_id', studentId)
          .eq('assessment_type', mod.assessmentType)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (resp) {
          const { data: summary } = await supabase
            .from('assessment_summaries')
            .select('*')
            .eq('assessment_response_id', resp.id)
            .eq('approval_status', 'approved')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          summaryMap[mod.key] = summary as AssessmentSummary | null;
        } else {
          summaryMap[mod.key] = null;
        }
      }
      setSummaries(summaryMap);

      // Fetch cached profile card answers
      const { data: cachedRows } = await supabase
        .from('profile_card_cache')
        .select('assessment_type, keywords, generated_at')
        .eq('student_id', studentId);

      const answerMap: Record<string, ProfileCardAnswers> = {};
      if (cachedRows) {
        for (const row of cachedRows) {
          if (row.assessment_type === 'career_direction') {
            const kw = row.keywords as any;
            if (typeof kw === 'object' && kw.direction) {
              setCareerDirection(kw.direction);
            }
          } else {
            const kw = row.keywords as any;
            if (kw && typeof kw === 'object' && !Array.isArray(kw) && kw.question1) {
              answerMap[row.assessment_type] = kw as ProfileCardAnswers;
            }
          }
        }
      }
      setAnswers(answerMap);

      // Fetch profile card question labels from content_translations
      const labelMap: Record<string, ProfileCardQuestionLabels> = {};
      for (const mod of MODULES) {
        const resourceType = `profile_card_${mod.assessmentType}`;
        const questionKeys = Array.from({ length: 10 }, (_, i) => `question${i + 1}`);
        const { data: qRows } = await supabase
          .from('content_translations')
          .select('resource_key,text')
          .eq('resource_type', resourceType)
          .eq('lang', lang)
          .in('resource_key', questionKeys);

        if (qRows && qRows.length > 0) {
          labelMap[mod.key] = qRows
            .sort((a, b) => {
              const aNum = parseInt(a.resource_key.replace('question', ''));
              const bNum = parseInt(b.resource_key.replace('question', ''));
              return aNum - bNum;
            })
            .map(r => ({ key: r.resource_key, label: r.text }));
        }
      }
      setQuestionLabels(labelMap);
    } catch (err) {
      logger.error('Error fetching profile card data:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, lang]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (loading || readOnly) return;
    for (const mod of MODULES) {
      const summary = summaries[mod.key];
      if (summary && summary.approval_status === 'approved' && !answers[mod.key]) {
        regenerateAnswers(mod.key, summary);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, summaries]);

  const regenerateAnswers = async (assessmentType: string, summary: AssessmentSummary) => {
    if (generatingKeys.has(assessmentType)) return;
    setGeneratingKeys(prev => new Set(prev).add(assessmentType));
    try {
      const display = getDisplaySummary(summary);
      const text = Object.values(display).filter(v => typeof v === 'string' && v.trim()).join('\n');
      const result = await aiSummaryService.generateProfileCardKeywords(assessmentType, text, lang);
      if (result.success && result.keywords) {
        setAnswers(prev => ({ ...prev, [assessmentType]: result.keywords! }));
        await supabase.from('profile_card_cache').upsert({
          student_id: studentId,
          assessment_type: assessmentType,
          keywords: result.keywords,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'student_id,assessment_type' });
      }
    } catch (err) {
      logger.error('Profile card answer generation failed for', assessmentType, err);
    } finally {
      setGeneratingKeys(prev => { const s = new Set(prev); s.delete(assessmentType); return s; });
    }
  };

  const completedCount = MODULES.filter(m => summaries[m.key]?.approval_status === 'approved').length;
  const allComplete = completedCount === 6;
  const progressPercent = Math.round((completedCount / 6) * 100);

  useEffect(() => {
    if (!allComplete || careerDirection || generatingDirection || loading || readOnly) return;
    generateDirection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete, careerDirection, loading]);

  const generateDirection = async () => {
    setGeneratingDirection(true);
    try {
      const dreamsAns = answers['dreams'] || {};
      const hobbiesAns = answers['hobbies'] || {};
      const roleModelsAns = answers['role_models'] || {};
      const result = await aiSummaryService.generateCareerDirection(
        dreamsAns, hobbiesAns, roleModelsAns, studentName, lang
      );
      if (result.success && result.direction) {
        setCareerDirection(result.direction);
        await supabase.from('profile_card_cache').upsert({
          student_id: studentId,
          assessment_type: 'career_direction',
          keywords: { direction: result.direction },
          generated_at: new Date().toISOString(),
        }, { onConflict: 'student_id,assessment_type' });
      }
    } catch (err) {
      logger.error('Career direction generation failed:', err);
    } finally {
      setGeneratingDirection(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-center">
            <Compass className="h-12 w-12 mx-auto mb-3 opacity-90" />
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{PAGE_TITLE[lang] || PAGE_TITLE.en}</h1>
            <p className="text-indigo-200 text-sm mb-2">{t('compass_subtitle')}</p>
            <p className="text-xl font-semibold mt-3">{studentName}</p>

            {/* Progress bar */}
            <div className="mt-5 max-w-xs mx-auto">
              <div className="flex items-center justify-between text-xs text-indigo-200 mb-1.5">
                <span>{(SECTIONS_COMPLETE[lang] || SECTIONS_COMPLETE.en)(completedCount)}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden" role="progressbar" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={6} aria-label="Profile completion progress">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module cards grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map(mod => {
            const summary = summaries[mod.key];
            const isComplete = summary?.approval_status === 'approved';
            const ans = answers[mod.key];
            const labels = questionLabels[mod.key] || [];
            const isGenerating = generatingKeys.has(mod.key);
            const IconComp = mod.icon;

            return (
              <Card
                key={mod.key}
                className="rounded-xl shadow-md hover:shadow-lg border border-gray-100 bg-white transition-all duration-200 overflow-hidden cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/student?assessment=${mod.assessmentType}&tab=summary`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/student?assessment=${mod.assessmentType}&tab=summary`); } }}
              >
                {/* Colored top strip */}
                <div className={`h-1 ${mod.stripColor}`} />
                <CardContent className="p-6">
                  {/* Icon + Title */}
                  <div className={`flex items-center gap-2.5 mb-3 ${mod.titleColor}`}>
                    <IconComp className="h-5 w-5" />
                    <h3 className="font-semibold text-base">{t(mod.titleKey)}</h3>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 mb-3" />

                  {/* Content: question label → answer */}
                  {isComplete ? (
                    isGenerating ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('generating_keywords')}</span>
                      </div>
                    ) : ans && labels.length > 0 ? (
                      <dl className="space-y-2.5">
                        {labels.map(({ key, label }) => (
                          <div key={key}>
                            <dt className="text-xs text-gray-400 leading-snug">{label}</dt>
                            <dd className="text-sm font-medium text-gray-700 mt-0.5">
                              {ans[key] || '—'}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-gray-400 italic">{t('generating_keywords')}</p>
                    )
                  ) : (
                    <>
                      {labels.length > 0 && (
                        <dl className="space-y-2 mb-3">
                          {labels.map(({ key, label }) => (
                            <div key={key}>
                              <dt className="text-xs text-gray-400 leading-snug">{label}</dt>
                              <dd className="text-sm text-gray-300 mt-0.5">—</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <p className="text-xs text-gray-400 italic mt-2">
                        {t('complete_module_nudge')}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 7th card — My Career Direction — always visible */}
        <div className="mt-8">
          <Card className="rounded-xl shadow-md hover:shadow-lg border border-gray-100 bg-white overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardContent className="p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <Compass className={`h-6 w-6 ${allComplete ? 'text-indigo-600' : 'text-gray-400 animate-pulse'}`} />
                <h3 className={`text-lg font-bold ${allComplete ? 'text-indigo-800' : 'text-gray-500'}`}>
                  {CAREER_DIR_TITLE[lang] || CAREER_DIR_TITLE.en}
                </h3>
              </div>

              <div className="border-t border-gray-100 mb-4" />

              {allComplete ? (
                generatingDirection ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('generating_direction')}</span>
                  </div>
                ) : careerDirection ? (
                  <blockquote className="border-l-4 border-indigo-400 pl-4 text-gray-700 leading-relaxed italic">
                    {careerDirection}
                  </blockquote>
                ) : (
                  <p className="text-sm text-gray-400 italic">{t('generating_direction')}</p>
                )
              ) : (
                <div className="text-center py-4">
                  <Compass className="h-8 w-8 mx-auto text-gray-300 animate-pulse mb-3" />
                  <p className="text-sm text-gray-400">
                    {t('career_direction_motivational')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
