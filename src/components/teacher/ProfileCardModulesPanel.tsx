import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { aiSummaryService } from '@/services/aiSummaryService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileCardModulesPanelProps {
  studentId: string;    // students.id — used to fetch assessment_responses
  cacheUserId: string;  // users.id — used for profile_card_cache queries + notifications
  teacherUserId: string; // teacher's users.id — for approved_by field
}

const PROFILE_CARD_MODULES = [
  { key: 'inspiration',     label: 'My Inspiration' },
  { key: 'about_me',        label: 'About Me' },
  { key: 'dreams',          label: 'My Dreams' },
  { key: 'school_learning', label: 'School & Learning' },
  { key: 'hobbies',         label: 'Talents & Hobbies' },
  { key: 'role_models',     label: 'My Role Models' },
] as const;

type ModuleKey = typeof PROFILE_CARD_MODULES[number]['key'];

type CacheRow = {
  keywords: Record<string, string> | null;
  approval_status: string;
  rejection_reason: string | null;
};

type QuestionLabel = { key: string; label: string };

const buildProfileCardApprovedNotif = (lang: string) => {
  if (lang === 'kn') return { title: 'ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ಮಾಡ್ಯೂಲ್ ಅನುಮೋದಿಸಲಾಗಿದೆ', message: 'ನಿಮ್ಮ ಶಿಕ್ಷಕರು ನಿಮ್ಮ ಕರಿಯರ್ ಕಾಂಪಾಸ್‌ನಲ್ಲಿ ಒಂದು ವಿಭಾಗವನ್ನು ಅನುಮೋದಿಸಿದ್ದಾರೆ.' };
  if (lang === 'ta') return { title: 'சுயவிவர அட்டை தொகுதி அனுமதிக்கப்பட்டது', message: 'உங்கள் ஆசிரியர் உங்கள் கரியர் காம்பஸ்ஸில் ஒரு பகுதியை அனுமதித்துள்ளார்.' };
  if (lang === 'hi') return { title: 'प्रोफाइल कार्ड मॉड्यूल अनुमोदित', message: 'आपके शिक्षक ने आपके करियर कम्पास में एक मॉड्यूल अनुमोदित किया है।' };
  return { title: 'Profile card module approved', message: 'Your teacher has approved a module in your Career Compass.' };
};

const buildProfileCardRejectedNotif = (lang: string) => {
  if (lang === 'kn') return { title: 'ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ಮಾಡ್ಯೂಲ್ ಪರಿಷ್ಕರಣೆ ಅಗತ್ಯವಿದೆ', message: 'ನಿಮ್ಮ ಶಿಕ್ಷಕರು ನಿಮ್ಮ ಕರಿಯರ್ ಕಾಂಪಾಸ್‌ನಲ್ಲಿ ಒಂದು ವಿಭಾಗದಲ್ಲಿ ಬದಲಾವಣೆ ಕೋರಿದ್ದಾರೆ. ಪ್ರತಿಕ್ರಿಯೆ ನೋಡಲು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಕಾರ್ಡ್ ನೋಡಿ.' };
  if (lang === 'ta') return { title: 'சுயவிவர அட்டை தொகுதி திருத்தம் தேவை', message: 'உங்கள் ஆசிரியர் உங்கள் கரியர் காம்பஸ்ஸில் ஒரு பகுதியில் மாற்றம் கோரியுள்ளார். கருத்துக்களை பார்க்க உங்கள் சுயவிவர அட்டையை பார்வையிடுங்கள்.' };
  if (lang === 'hi') return { title: 'प्रोफाइल कार्ड मॉड्यूल में संशोधन आवश्यक', message: 'आपके शिक्षक ने आपके करियर कम्पास में एक मॉड्यूल में बदलाव का अनुरोध किया है। कृपया अपना प्रोफाइल कार्ड देखें।' };
  return { title: 'Profile card module needs revision', message: 'Your teacher has requested changes to a module in your Career Compass. Please visit your profile card to see the feedback.' };
};

export default function ProfileCardModulesPanel({
  studentId,
  cacheUserId,
  teacherUserId,
}: ProfileCardModulesPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cacheRows, setCacheRows] = useState<Partial<Record<ModuleKey, CacheRow>>>({});
  const [questionLabels, setQuestionLabels] = useState<Partial<Record<ModuleKey, QuestionLabel[]>>>({});
  const [rejectingModule, setRejectingModule] = useState<ModuleKey | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [savingApproval, setSavingApproval] = useState(false);
  const [studentLang, setStudentLang] = useState<string>('en');

  useEffect(() => {
    if (!cacheUserId) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheUserId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profile_card_cache rows for this student
      const { data: cacheData } = await supabase
        .from('profile_card_cache')
        .select('assessment_type, keywords, approval_status, rejection_reason')
        .eq('student_id', cacheUserId);

      const rowMap: Partial<Record<ModuleKey, CacheRow>> = {};
      for (const row of (cacheData || [])) {
        const key = row.assessment_type as ModuleKey;
        const kw = row.keywords as any;
        rowMap[key] = {
          keywords: (kw && typeof kw === 'object' && !Array.isArray(kw) && Object.keys(kw).length > 0)
            ? kw as Record<string, string>
            : null,
          approval_status: (row as any).approval_status || 'pending',
          rejection_reason: (row as any).rejection_reason || null,
        };
      }

      // 2. Fetch completed assessment responses for fallback / status sync
      const { data: completedResps } = await supabase
        .from('assessment_responses')
        .select('assessment_type, responses, review_status')
        .eq('student_id', studentId)
        .not('completed_at', 'is', null);

      const completedMap: Record<string, any> = {};
      const responseStatusMap: Record<string, string> = {};
      (completedResps || []).forEach(r => {
        completedMap[r.assessment_type] = r.responses;
        responseStatusMap[r.assessment_type] = r.review_status || 'unreviewed';
      });

      for (const mod of PROFILE_CARD_MODULES) {
        if (completedMap[mod.key]) {
          const rStatus = responseStatusMap[mod.key];
          let mappedStatus = 'pending';
          if (rStatus === 'reviewed') {
            mappedStatus = 'approved';
          } else if (rStatus === 'needs_revision' || rStatus === 'flagged') {
            mappedStatus = 'rejected';
          }

          if (!rowMap[mod.key]) {
            rowMap[mod.key] = {
              keywords: null,
              approval_status: mappedStatus,
              rejection_reason: null
            };
          } else if (rowMap[mod.key]!.approval_status === 'pending') {
            // Sync status with assessment review if cache is pending and review is already completed
            if (rStatus === 'reviewed') {
              rowMap[mod.key]!.approval_status = 'approved';
            } else if (rStatus === 'needs_revision' || rStatus === 'flagged') {
              rowMap[mod.key]!.approval_status = 'rejected';
            }
          }

          // Build fallback keywords if not present in cache
          if (!rowMap[mod.key]!.keywords) {
            const rawResp = completedMap[mod.key];
            const fallbackAns: Record<string, string> = {};

            if (mod.key === 'inspiration') {
              const videoKeys = Object.keys(rawResp).filter(k => k.startsWith('video')).sort();
              if (videoKeys.length > 0) {
                const firstVid = rawResp[videoKeys[0]] || {};
                fallbackAns.question1 = firstVid.question1 || firstVid.question2 || firstVid.question3 || '';
                fallbackAns.question2 = firstVid.question4 || firstVid.question5 || '';
                fallbackAns.question3 = firstVid.question6 || firstVid.question7 || firstVid.question8 || '';
              }
            } else if (mod.key === 'about_me') {
              fallbackAns.question1 = rawResp.question1 || rawResp.question2 || rawResp.question3 || '';
              fallbackAns.question2 = rawResp.question12 || rawResp.question13 || '';
              fallbackAns.question3 = rawResp.question14 || rawResp.question11 || '';
            } else if (mod.key === 'dreams') {
              fallbackAns.question1 = rawResp.summary_q1 || '';
              fallbackAns.question2 = rawResp.summary_q2 || '';
              fallbackAns.question3 = rawResp.summary_q3 || '';

              if (!fallbackAns.question1 || !fallbackAns.question2 || !fallbackAns.question3) {
                const partKeys = Object.keys(rawResp).filter(k => k.startsWith('part')).sort();
                if (partKeys.length > 0) {
                  const firstPart = rawResp[partKeys[0]] || {};
                  fallbackAns.question1 = fallbackAns.question1 || firstPart.question1 || '';
                  fallbackAns.question2 = fallbackAns.question2 || firstPart.question3 || '';
                  fallbackAns.question3 = fallbackAns.question3 || firstPart.question5 || '';
                }
              }
            } else if (mod.key === 'school_learning') {
              const p1 = rawResp.part1 || {};
              const p2 = rawResp.part2 || {};
              const p3 = rawResp.part3 || {};
              fallbackAns.question1 = p1.question1 || '';
              fallbackAns.question2 = p2.question1 || '';
              fallbackAns.question3 = p3.question2 || '';
            } else if (mod.key === 'hobbies') {
              const p1 = rawResp.part1 || {};
              const p2 = rawResp.part2 || {};

              const hobbies: string[] = [];
              const talents: string[] = [];

              Object.keys(p1).forEach(k => {
                const item = p1[k] || {};
                if (item.question1) hobbies.push(item.question1);
              });
              Object.keys(p2).forEach(k => {
                const item = p2[k] || {};
                if (item.question1) talents.push(item.question1);
              });

              fallbackAns.question1 = hobbies.join(', ') || '—';
              fallbackAns.question2 = talents.join(', ') || '—';
              fallbackAns.question3 = p1.hobby1?.question3 || p2.talent1?.question3 || '—';
            } else if (mod.key === 'role_models') {
              const p1 = rawResp.part1 || {};
              const questions: string[] = [];
              Object.keys(p1).forEach(k => {
                const item = p1[k] || {};
                if (item.question3) questions.push(item.question3);
              });
              fallbackAns.question1 = questions.slice(0, 2).join('\n') || '—';
            }

            if (Object.keys(fallbackAns).length > 0) {
              rowMap[mod.key]!.keywords = fallbackAns;
            }
          }
        }
      }

      setCacheRows(rowMap);

      // 3. Fetch student's preferred language for regen calls and label display
      const { data: userData } = await supabase
        .from('users')
        .select('preferred_language')
        .eq('id', cacheUserId)
        .maybeSingle();
      const lang = userData?.preferred_language || 'en';
      setStudentLang(lang);

      // 4. Fetch question labels in student's language
      const resourceTypes = PROFILE_CARD_MODULES.map(m => `profile_card_${m.key}`);
      const { data: labelRows } = await supabase
        .from('content_translations')
        .select('resource_type, resource_key, text')
        .in('resource_type', resourceTypes)
        .eq('lang', lang);

      const labelMap: Partial<Record<ModuleKey, QuestionLabel[]>> = {};
      for (const row of (labelRows || [])) {
        if (!/^question\d+$/.test(row.resource_key)) continue;
        const assessmentType = row.resource_type.replace('profile_card_', '') as ModuleKey;
        if (!labelMap[assessmentType]) labelMap[assessmentType] = [];
        labelMap[assessmentType]!.push({ key: row.resource_key, label: row.text });
      }
      for (const key of Object.keys(labelMap) as ModuleKey[]) {
        labelMap[key]!.sort((a, b) => {
          const aNum = parseInt(a.key.replace('question', '')) || 0;
          const bNum = parseInt(b.key.replace('question', '')) || 0;
          return aNum - bNum;
        });
      }
      setQuestionLabels(labelMap);
    } catch (err) {
      logger.error('ProfileCardModulesPanel fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (assessmentType: ModuleKey) => {
    if (!teacherUserId) return;
    setSavingApproval(true);
    try {
      const { error } = await supabase
        .from('profile_card_cache')
        .upsert({
          student_id: cacheUserId,
          assessment_type: assessmentType,
          approval_status: 'approved',
          approved_by: teacherUserId,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
          keywords: cacheRows[assessmentType]?.keywords || null,
        } as any, { onConflict: 'student_id,assessment_type' });
      if (error) throw error;

      setCacheRows(prev => ({
        ...prev,
        [assessmentType]: { ...prev[assessmentType]!, approval_status: 'approved' },
      }));
      toast({ title: 'Module approved' });

      // Fire-and-forget: notify the student in their preferred language
      const approvedNotif = buildProfileCardApprovedNotif(studentLang);
      supabase.rpc('create_notification_secure', {
        p_user_id: cacheUserId,
        p_type: 'profile_card_approved',
        p_title: approvedNotif.title,
        p_message: approvedNotif.message,
        p_link: '/student/profile-card',
      }).then(({ error: notifError }) => {
        if (notifError) logger.error('Profile card approval notification error:', notifError);
      });
    } catch (err) {
      toast({ title: 'Approval failed', variant: 'destructive' });
    } finally {
      setSavingApproval(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!rejectingModule || !teacherUserId) return;
    setSavingApproval(true);
    const moduleBeingRejected = rejectingModule;
    try {
      const feedback = rejectReason.trim() || 'Changes requested';

      const { error } = await supabase
        .from('profile_card_cache')
        .upsert({
          student_id: cacheUserId,
          assessment_type: moduleBeingRejected,
          approval_status: 'rejected',
          approved_by: teacherUserId,
          approved_at: new Date().toISOString(),
          rejection_reason: feedback,
          keywords: cacheRows[moduleBeingRejected]?.keywords || null,
        } as any, { onConflict: 'student_id,assessment_type' });
      if (error) throw error;

      setCacheRows(prev => ({
        ...prev,
        [moduleBeingRejected]: {
          ...prev[moduleBeingRejected]!,
          approval_status: 'rejected',
          rejection_reason: feedback,
        },
      }));
      setRejectingModule(null);
      setRejectReason('');
      toast({ title: 'Feedback submitted — student will be asked to revise' });

      // Fire-and-forget: notify the student in their preferred language
      const rejectedNotif = buildProfileCardRejectedNotif(studentLang);
      supabase.rpc('create_notification_secure', {
        p_user_id: cacheUserId,
        p_type: 'profile_card_rejected',
        p_title: rejectedNotif.title,
        p_message: rejectedNotif.message,
        p_link: '/student/profile-card',
      }).then(({ error: notifError }) => {
        if (notifError) logger.error('Profile card rejection notification error:', notifError);
      });
    } catch (err) {
      toast({ title: 'Failed to submit feedback', variant: 'destructive' });
    } finally {
      setSavingApproval(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading profile card data...</span>
      </div>
    );
  }

  const hasAnyData = PROFILE_CARD_MODULES.some(m => !!cacheRows[m.key]);

  if (!hasAnyData) {
    return (
      <p className="text-sm text-gray-400 italic py-4">
        No profile card data yet — student needs to complete assessments first.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROFILE_CARD_MODULES.map(mod => {
          const row = cacheRows[mod.key];
          const labels = questionLabels[mod.key] || [];
          const status = row?.approval_status || 'pending';
          const keywords = row?.keywords;

          return (
            <Card
              key={mod.key}
              className={`border shadow-sm ${status === 'rejected' ? 'border-red-200' : 'border-gray-200'}`}
            >
              <CardContent className="p-4">
                {/* Module name + status badge */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-800">{mod.label}</h3>
                  {row ? (
                    status === 'approved' ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1" />Approved
                      </Badge>
                    ) : status === 'rejected' ? (
                      <Badge className="bg-red-100 text-red-700 text-[10px]">
                        <XCircle className="h-3 w-3 mr-1" />Revision Requested
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">
                        <Clock className="h-3 w-3 mr-1" />Pending Review
                      </Badge>
                    )
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 text-[10px]">Not started</Badge>
                  )}
                </div>

                <div className="border-t border-gray-100 mb-3" />

                {/* Keywords or placeholder */}
                {row ? (
                  keywords && Object.keys(keywords).length > 0 ? (
                    <dl className="space-y-2 mb-3">
                      {labels.length > 0
                        ? labels.map(({ key, label }) => (
                          <div key={key}>
                            <dt className="text-xs text-gray-400 leading-snug">{label}</dt>
                            <dd className="text-sm font-medium text-gray-700 mt-0.5">
                              {keywords[key] || '—'}
                            </dd>
                          </div>
                        ))
                        : Object.entries(keywords).filter(([, v]) => v && String(v).trim()).map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-xs text-gray-400 leading-snug capitalize">{key.replace(/_/g, ' ')}</dt>
                            <dd className="text-sm font-medium text-gray-700 mt-0.5">{String(value)}</dd>
                          </div>
                        ))
                      }
                    </dl>
                  ) : (
                    <p className="text-xs text-gray-400 italic mb-3">Keywords not yet generated.</p>
                  )
                ) : (
                  <p className="text-xs text-gray-400 italic mb-3">Assessment not completed.</p>
                )}

                {/* Approve / Request Changes — only when keywords have been generated */}
                {row && row.keywords && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {status !== 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
                        onClick={() => handleApprove(mod.key)}
                        disabled={savingApproval}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />Approve
                      </Button>
                    )}
                    {status !== 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                        onClick={() => setRejectingModule(mod.key)}
                      >
                        <XCircle className="h-3 w-3 mr-1" />Request Changes
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inline rejection reason dialog */}
      {rejectingModule && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => { setRejectingModule(null); setRejectReason(''); }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Changes</h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide feedback for the student on what to improve.
            </p>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Please provide more specific answers..."
              rows={3}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setRejectingModule(null); setRejectReason(''); }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRequestChanges}
                disabled={savingApproval}
              >
                {savingApproval ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
