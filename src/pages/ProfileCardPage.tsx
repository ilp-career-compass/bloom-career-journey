import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { supabase } from '@/integrations/supabase/client';
import { aiSummaryService } from '@/services/aiSummaryService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Loader2, Play, User, Star,
  BookOpen, Heart, Users, Compass, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useStudentStrings } from '@/components/student/studentStrings';
import { useToast } from '@/hooks/use-toast';

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
  const { user, userProfile } = useAuth();
  const { lang: currentLang } = useLang();
  const params = useParams<{ studentId?: string }>();

  // assessment_responses.student_id → students(id)
  // profile_card_cache.student_id → users(id)
  // These are different FKs, so we need separate IDs for each table.
  const studentId = studentIdOverride || params.studentId || userProfile?.studentProfile?.id || '';
  const userId = user?.id || '';
  const lang = (currentLang || 'en') as 'en' | 'kn' | 'ta' | 'hi';
  const { t } = useStudentStrings(lang);

  // cacheUserId is the users.id used for all profile_card_cache operations.
  // Student view: userId (= user?.id = users.id) is available directly.
  // Teacher view: resolved from students table in fetchData.
  const [cacheUserId, setCacheUserId] = useState<string>('');
  const [completedModules, setCompletedModules] = useState<Record<string, { responses: any; updated_at: string } | null>>({});
  const [answers, setAnswers] = useState<Record<string, ProfileCardAnswers>>({});
  const [questionLabels, setQuestionLabels] = useState<Record<string, ProfileCardQuestionLabels>>({});
  const [careerDirection, setCareerDirection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generatingKeys, setGeneratingKeys] = useState<Set<string>>(new Set());
  const [generatingDirection, setGeneratingDirection] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [rejectingModule, setRejectingModule] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [savingApproval, setSavingApproval] = useState(false);
  const [regeneratingModules, setRegeneratingModules] = useState<Set<string>>(new Set());
  const [rejectionCounts, setRejectionCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const [studentName, setStudentName] = useState('');
  const [cacheTimestamps, setCacheTimestamps] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      // Resolve users.id for profile_card_cache and student name
      let resolvedCacheUserId = '';
      if (studentIdOverride || params.studentId) {
        // Teacher view: params.studentId is students.id — resolve to users.id
        const { data: stu } = await supabase.from('students').select('user_id').eq('id', studentId).maybeSingle();
        if (!stu?.user_id) { setLoading(false); return; }
        resolvedCacheUserId = stu.user_id;
        const { data: u } = await supabase.from('users').select('full_name').eq('id', stu.user_id).single();
        if (u) setStudentName(u.full_name || '');
      } else {
        // Student view: userId is already users.id
        resolvedCacheUserId = userId;
        const { data: profile } = await supabase.from('users').select('full_name').eq('id', userId).single();
        if (profile) setStudentName(profile.full_name || '');
      }
      setCacheUserId(resolvedCacheUserId);

      const responseMap: Record<string, { responses: any; updated_at: string } | null> = {};
      for (const mod of MODULES) {
        const { data: resp } = await supabase
          .from('assessment_responses')
          .select('responses, updated_at')
          .eq('student_id', studentId)
          .eq('assessment_type', mod.assessmentType)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        responseMap[mod.key] = resp ? { responses: resp.responses, updated_at: resp.updated_at } : null;
      }
      setCompletedModules(responseMap);

      // Fetch cached profile card answers
      const { data: cachedRows } = await supabase
        .from('profile_card_cache')
        .select('assessment_type, keywords, generated_at, approval_status, rejection_reason')
        .eq('student_id', resolvedCacheUserId);

      const answerMap: Record<string, ProfileCardAnswers> = {};
      const tsMap: Record<string, string> = {};
      const statusMap: Record<string, string> = {};
      const reasonMap: Record<string, string> = {};
      if (cachedRows) {
        for (const row of cachedRows) {
          if (row.generated_at) {
            tsMap[row.assessment_type] = row.generated_at;
          }
          if ((row as any).approval_status) {
            statusMap[row.assessment_type] = (row as any).approval_status;
          }
          if ((row as any).rejection_reason) {
            reasonMap[row.assessment_type] = (row as any).rejection_reason;
          }
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
      setCacheTimestamps(tsMap);
      setApprovalStatus(statusMap);
      setRejectionReasons(reasonMap);

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
  }, [studentId, userId, lang]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (loading || readOnly) return;
    for (const mod of MODULES) {
      const completed = completedModules[mod.key];
      if (!completed) continue;

      const cachedAt = cacheTimestamps[mod.key];
      const responseUpdatedAt = completed.updated_at;

      // Skip if cache exists and is newer than the response update
      if (answers[mod.key] && cachedAt && responseUpdatedAt && new Date(cachedAt) >= new Date(responseUpdatedAt)) {
        continue;
      }

      // Regenerate: no cache, or response was updated after cache
      regenerateAnswers(mod.key, completed.responses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, completedModules, cacheTimestamps]);

  const flattenResponses = (responses: any): string => {
    if (!responses || typeof responses !== 'object') return '';
    const parts: string[] = [];
    const extract = (obj: any) => {
      for (const val of Object.values(obj)) {
        if (typeof val === 'string' && val.trim()) parts.push(val.trim());
        else if (typeof val === 'object' && val !== null) extract(val);
      }
    };
    extract(responses);
    return parts.join('\n');
  };

  const regenerateAnswers = async (assessmentType: string, responses: any, teacherFeedback?: string) => {
    if (generatingKeys.has(assessmentType)) return;
    setGeneratingKeys(prev => new Set(prev).add(assessmentType));
    try {
      const text = flattenResponses(responses);
      if (!text) return;
      const result = await aiSummaryService.generateProfileCardKeywords(assessmentType, text, lang, undefined, teacherFeedback);
      if (result.success && result.keywords) {
        const now = new Date().toISOString();
        setAnswers(prev => ({ ...prev, [assessmentType]: result.keywords! }));
        setCacheTimestamps(prev => ({ ...prev, [assessmentType]: now }));
        const { error } = await supabase.from('profile_card_cache').upsert({
          student_id: cacheUserId,
          assessment_type: assessmentType,
          keywords: result.keywords,
          generated_at: now,
          approval_status: 'pending',
          approved_by: null,
          approved_at: null,
          rejection_reason: null, // teacher feedback consumed by AI prompt, not persisted to DB
        } as any, { onConflict: 'student_id,assessment_type' });
        if (error) logger.error('Profile card cache upsert error:', error);
        setApprovalStatus(prev => ({ ...prev, [assessmentType]: 'pending' }));
      }
    } catch (err) {
      logger.error('Profile card answer generation failed for', assessmentType, err);
    } finally {
      setGeneratingKeys(prev => { const s = new Set(prev); s.delete(assessmentType); return s; });
    }
  };

  const completedCount = MODULES.filter(m => !!completedModules[m.key]).length;
  const allComplete = completedCount === 6;
  const progressPercent = Math.round((completedCount / 6) * 100);

  useEffect(() => {
    if (!allComplete || generatingDirection || loading || readOnly) return;

    const dirCachedAt = cacheTimestamps['career_direction'];
    const latestResponseUpdate = MODULES
      .map(m => completedModules[m.key]?.updated_at)
      .filter(Boolean)
      .sort()
      .pop();

    // Skip if cached direction exists and is newer than the latest response update
    if (careerDirection && dirCachedAt && latestResponseUpdate && new Date(dirCachedAt) >= new Date(latestResponseUpdate)) {
      return;
    }

    generateDirection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete, careerDirection, loading, cacheTimestamps]);

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
        const now = new Date().toISOString();
        setCareerDirection(result.direction);
        setCacheTimestamps(prev => ({ ...prev, career_direction: now }));
        const { error } = await supabase.from('profile_card_cache').upsert({
          student_id: cacheUserId,
          assessment_type: 'career_direction',
          keywords: { direction: result.direction },
          generated_at: now,
        }, { onConflict: 'student_id,assessment_type' });
        if (error) logger.error('Career direction cache upsert error:', error);
      }
    } catch (err) {
      logger.error('Career direction generation failed:', err);
    } finally {
      setGeneratingDirection(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingModule || !user?.id) return;
    setSavingApproval(true);
    try {
      const feedback = rejectReason || 'Changes requested';
      const moduleBeingRejected = rejectingModule;

      await supabase.from('profile_card_cache').update({
        approval_status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: feedback,
      } as any).eq('student_id', cacheUserId).eq('assessment_type', moduleBeingRejected);

      setApprovalStatus(prev => ({ ...prev, [moduleBeingRejected]: 'rejected' }));
      setRejectionReasons(prev => ({ ...prev, [moduleBeingRejected]: feedback }));
      setRejectingModule(null);
      setRejectReason('');

      const currentCount = rejectionCounts[moduleBeingRejected] || 0;
      if (currentCount >= 3) {
        toast({ title: 'Maximum feedback rounds reached — please approve or discuss with student directly' });
        return;
      }

      setRejectionCounts(prev => ({ ...prev, [moduleBeingRejected]: currentCount + 1 }));
      toast({ title: 'Feedback submitted — regenerating keywords with your input...' });

      const responses = completedModules[moduleBeingRejected]?.responses;
      if (responses) {
        setRegeneratingModules(prev => new Set(prev).add(moduleBeingRejected));
        regenerateAnswers(moduleBeingRejected, responses, feedback).finally(() => {
          setRegeneratingModules(prev => { const s = new Set(prev); s.delete(moduleBeingRejected); return s; });
        });
      }
    } catch (err) {
      toast({ title: 'Rejection failed', variant: 'destructive' });
    } finally {
      setSavingApproval(false);
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
            const isComplete = !!completedModules[mod.key];
            const ans = answers[mod.key];
            const labels = questionLabels[mod.key] || [];
            const isGenerating = generatingKeys.has(mod.key);
            const isRegenerating = regeneratingModules.has(mod.assessmentType);
            const IconComp = mod.icon;
            const status = approvalStatus[mod.key] || 'pending';
            const reason = rejectionReasons[mod.key];
            // Student view: show answers only if approved (or if readOnly teacher view)
            const showAnswers = readOnly || status === 'approved';

            return (
              <Card
                key={mod.key}
                className={`rounded-xl shadow-md hover:shadow-lg border bg-white transition-all duration-200 overflow-hidden ${!readOnly ? 'cursor-pointer' : ''} focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${status === 'rejected' ? 'border-red-200' : 'border-gray-100'}`}
                role={!readOnly ? 'button' : undefined}
                tabIndex={!readOnly ? 0 : undefined}
                onClick={!readOnly ? () => navigate(`/student?assessment=${mod.assessmentType}&tab=summary`) : undefined}
                onKeyDown={!readOnly ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/student?assessment=${mod.assessmentType}&tab=summary`); } } : undefined}
              >
                {/* Colored top strip */}
                <div className={`h-1 ${mod.stripColor}`} />
                <CardContent className="p-6">
                  {/* Icon + Title + Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-2.5 ${mod.titleColor}`}>
                      <IconComp className="h-5 w-5" />
                      <h3 className="font-semibold text-base">{t(mod.titleKey)}</h3>
                    </div>
                    {isComplete && ans && (
                      isRegenerating ? (
                        <Badge className="bg-blue-100 text-blue-700 text-[10px]"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Regenerating...</Badge>
                      ) : status === 'approved' ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
                      ) : status === 'rejected' ? (
                        <Badge className="bg-red-100 text-red-700 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Changes Requested</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 text-[10px]"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>
                      )
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 mb-3" />

                  {/* Rejection reason (student view) */}
                  {!readOnly && status === 'rejected' && reason && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <strong>Teacher feedback:</strong> {reason}
                    </div>
                  )}

                  {/* Student pending message */}
                  {!readOnly && isComplete && ans && status === 'pending' && (
                    <p className="text-xs text-yellow-600 italic mb-3">Your profile card is being reviewed by your teacher.</p>
                  )}

                  {/* Content: question label → answer */}
                  {isComplete ? (
                    isGenerating ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('generating_keywords')}</span>
                      </div>
                    ) : ans && labels.length > 0 ? (
                      showAnswers ? (
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
                        <dl className="space-y-2.5">
                          {labels.map(({ key, label }) => (
                            <div key={key}>
                              <dt className="text-xs text-gray-400 leading-snug">{label}</dt>
                              <dd className="text-sm text-gray-300 mt-0.5">—</dd>
                            </div>
                          ))}
                        </dl>
                      )
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

                  {/* Teacher: per-module reject button */}
                  {readOnly && isComplete && ans && status !== 'rejected' && !isRegenerating && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                        onClick={(e) => { e.stopPropagation(); setRejectingModule(mod.assessmentType); }}
                      >
                        <XCircle className="h-3 w-3 mr-1" /> Request Changes
                      </Button>
                    </div>
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

        {/* Rejection reason dialog (inline) */}
        {rejectingModule && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRejectingModule(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Changes</h3>
              <p className="text-sm text-gray-600 mb-4">Provide feedback for the student on what to improve.</p>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Please provide more specific answers..."
                rows={3}
                className="mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setRejectingModule(null); setRejectReason(''); }}>Cancel</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReject} disabled={savingApproval}>
                  {savingApproval ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
