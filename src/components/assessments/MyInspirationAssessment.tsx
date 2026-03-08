import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  ExternalLink,
  CheckCircle,
  Clock,
  Lightbulb,
  Heart,
  Star,
  Target,
  TrendingUp,
  Video,
  Youtube,
  ArrowLeft,
  Save,
  BookOpen,
  Sparkles,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { safeObjectEntries, handleDatabaseError, validateApiResponse } from '@/utils/errorHandler';
import { AudioRecorder } from '@/components/ui/AudioRecorder';

import { aiSummaryService } from '@/services/aiSummaryService';
import { summaryDatabaseService } from '@/services/summaryDatabaseService';
import { notificationService } from '@/services/notificationService';
import { KannadaKeyboard } from '@/components/ui/KannadaKeyboard';

interface InspirationVideo {
  id: number;
  title: string;
  url: string;
  youtubeId: string;
}

// Dynamic assessment response based on number of questions
interface AssessmentResponse {
  [videoKey: string]: {
    [questionKey: string]: string;
  };
}

// New interface for individual video progress
interface VideoProgress {
  videoId: number;
  responses: {
    [questionKey: string]: string;
  };
  isComplete: boolean;
  savedAt?: string;
}

export default function MyInspirationAssessment() {
  const { userProfile } = useAuth();
  const { t, lang } = useLang();
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('readonly') || searchParams.get('view');
  const readOnlyView = viewParam === '1' || viewParam === 'true';
  const { toast } = useToast();
  const [helpTexts, setHelpTexts] = useState<{ [key: string]: string }>({});
  const [questionTexts, setQuestionTexts] = useState<{ [key: string]: string }>({});
  const [questionCount, setQuestionCount] = useState(0); // Track number of questions from database
  const [dbTitle, setDbTitle] = useState<string>('');
  const [dbIntro, setDbIntro] = useState<string>('');
  const [summaryQuestions, setSummaryQuestions] = useState<any[]>([]);

  // Fetch module title and intro from database
  useEffect(() => {
    const fetchModuleTexts = async () => {
      try {
        const { data } = await supabase
          .from('content_translations')
          .select('resource_key, text')
          .eq('resource_type', 'inspiration_module')
          .eq('lang', lang)
          .in('resource_key', ['title', 'intro']);

        if (data) {
          const titleText = data.find(item => item.resource_key === 'title')?.text;
          const introText = data.find(item => item.resource_key === 'intro')?.text;
          if (titleText) setDbTitle(titleText);
          if (introText) setDbIntro(introText);
        }
      } catch (error) {
        logger.error('Error fetching module texts:', error);
      }
    };
    fetchModuleTexts();
  }, [lang]);

  // Load help texts from database using lang-aware RPC; fallback to base RPC
  useEffect(() => {
    const loadHelpTextsFromDatabase = async () => {
      try {
        logger.log('🔄 Loading help texts from database...');
        let list: any[] | null = null;
        try {
          const { data: i18nData } = await supabase.rpc('get_inspiration_questions_i18n', { p_lang: lang } as any);
          if (Array.isArray(i18nData)) list = i18nData as any[];
          if (i18nData && !Array.isArray(i18nData)) list = (i18nData as any) as any[];
          const maybe = (list as any)?.data;
          if (maybe && Array.isArray(maybe)) list = maybe;
        } catch { }
        if (!list) {
          const { data, error } = await supabase.rpc('get_inspiration_questions');
          if (error) throw error;
          list = data as any[];
        }

        if (validateApiResponse(list, 'InspirationAssessment - Help Texts')) {
          logger.log('✅ Database help texts loaded:', list);

          // Fetch help text translations from content_translations
          let helpTranslations: Record<string, string> = {};
          try {
            const { data: helpData } = await supabase
              .from('content_translations')
              .select('resource_key, text')
              .eq('resource_type', 'inspiration_help')
              .eq('lang', lang);

            if (helpData && Array.isArray(helpData)) {
              helpData.forEach((item: any) => {
                if (item?.resource_key && item?.text) {
                  helpTranslations[item.resource_key] = item.text;
                }
              });
            }
          } catch (e) {
            logger.warn('Could not load help text translations, using default:', e);
          }

          // Fetch question text translations from content_translations (manual override to ensure latest migration applies)
          let questionTranslations: Record<string, string> = {};
          try {
            const { data: qData } = await supabase
              .from('content_translations')
              .select('resource_key, text')
              .eq('resource_type', 'inspiration_question')
              .eq('lang', lang);

            if (qData && Array.isArray(qData)) {
              qData.forEach((item: any) => {
                if (item?.resource_key && item?.text) {
                  questionTranslations[item.resource_key] = item.text;
                }
              });
            }
          } catch (e) {
            logger.warn('Could not load question text translations:', e);
          }

          const newHelpTexts: { [key: string]: string } = {};
          const newQuestionTexts: { [key: string]: string } = {};
          (list as any[]).forEach((row: any, index: number) => {
            const key = `question${index + 1}`;
            // Use translated help text if available, otherwise use default
            newHelpTexts[key] = helpTranslations[key] || row.help_text || '';

            // Use translated question text if available
            const prefix = `${index + 1}. `;
            const baseText = row.question_text || '';
            const translatedText = questionTranslations[key];
            if (translatedText) {
              // If translation already has a number prefix, don't double add it
              newQuestionTexts[key] = (translatedText.startsWith(prefix) || translatedText.match(/^\d+\./))
                ? translatedText
                : `${prefix}${translatedText}`;
            } else {
              newQuestionTexts[key] = baseText.startsWith(prefix) ? baseText : `${prefix}${baseText}`;
            }
          });
          setHelpTexts(newHelpTexts);
          setQuestionTexts(newQuestionTexts);
          setQuestionCount((list as any[]).length);

          // Initialize responses dynamically based on question count
          const videoCount = inspirationVideos.length || 3; // Default to 3 if not loaded yet
          const initialResponses: AssessmentResponse = {};
          for (let v = 1; v <= videoCount; v++) {
            const videoKey = `video${v}`;
            initialResponses[videoKey] = {};
            for (let q = 1; q <= (list as any[]).length; q++) {
              initialResponses[videoKey][`question${q}`] = '';
            }
          }
          setResponses(prev => {
            // Merge with existing responses if any
            const merged: AssessmentResponse = { ...initialResponses };
            Object.keys(prev).forEach(videoKey => {
              if (merged[videoKey]) {
                Object.keys(prev[videoKey] || {}).forEach(qKey => {
                  if (merged[videoKey][qKey] !== undefined) {
                    merged[videoKey][qKey] = prev[videoKey][qKey] || '';
                  }
                });
              }
            });
            return merged;
          });
        } else {
          logger.log('⚠️ No help texts found in database, using fallback');
        }
      } catch (error) {
        handleDatabaseError(error, 'InspirationAssessment - Help Texts');
        logger.log('🔄 Using hardcoded fallback help texts');
        // Keep default help texts if database fails
      }
    };

    loadHelpTextsFromDatabase();
  }, [lang]);

  // Keep URL ?lang in sync without re-rendering
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const current = url.searchParams.get('lang');
      if (current !== lang) {
        url.searchParams.set('lang', lang);
        const next = `${url.pathname}?${url.searchParams.toString()}${url.hash}`;
        const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (next !== now) window.history.replaceState(window.history.state, '', next);
      }
    } catch { }
  }, [lang]);
  const [inspirationVideos, setInspirationVideos] = useState<InspirationVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse>({});
  const [audioResponses, setAudioResponses] = useState<{ [key: string]: Blob | null }>({});
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [helpOpen, setHelpOpen] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const [assessmentRecordId, setAssessmentRecordId] = useState<string | null>(null);
  const [resolvedStudentId, setResolvedStudentId] = useState<string | null>(null);
  const [audioResponsesMap, setAudioResponsesMap] = useState<Record<string, any>>({});
  const [audioAnswered, setAudioAnswered] = useState<Record<string, boolean>>({});
  const [transcribedPrefill, setTranscribedPrefill] = useState<Record<string, boolean>>({});
  const [teacherUserId, setTeacherUserId] = useState<string | null>(null);
  const resolveTeacherUserId = useCallback(async () => {
    if (teacherUserId) return teacherUserId;
    if (!userProfile?.id) return null;

    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          teacher_id,
          teachers:teacher_id(user_id)
        `)
        .eq('user_id', userProfile.id)
        .maybeSingle();

      if (error) {
        logger.error('Error resolving teacher user id:', error);
        return null;
      }

      const resolvedTeacherUserId = (data as any)?.teachers?.user_id || null;
      if (resolvedTeacherUserId) {
        setTeacherUserId(resolvedTeacherUserId);
      }
      return resolvedTeacherUserId;
    } catch (err) {
      logger.error('Failed to resolve teacher user id:', err);
      return null;
    }
  }, [teacherUserId, userProfile?.id]);

  useEffect(() => {
    resolveTeacherUserId();
  }, [resolveTeacherUserId]);

  const helpKey = (q: string) => `${getCurrentVideoKey()}_${q}`;
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));

  // Color theme for questions (cycles through colors for dynamic questions)
  const questionColors = [
    { border: 'border-blue-400', icon: Star, iconColor: 'text-blue-500', text: 'text-blue-600', hover: 'hover:text-blue-700', bg: 'bg-blue-50', bgBorder: 'border-blue-200', bgText: 'text-blue-800', inputBorder: 'border-blue-200', inputFocus: 'focus:border-blue-400' },
    { border: 'border-green-400', icon: Lightbulb, iconColor: 'text-green-500', text: 'text-green-600', hover: 'hover:text-green-700', bg: 'bg-green-50', bgBorder: 'border-green-200', bgText: 'text-green-800', inputBorder: 'border-green-200', inputFocus: 'focus:border-green-400' },
    { border: 'border-purple-400', icon: Heart, iconColor: 'text-purple-500', text: 'text-purple-600', hover: 'hover:text-purple-700', bg: 'bg-purple-50', bgBorder: 'border-purple-200', bgText: 'text-purple-800', inputBorder: 'border-purple-200', inputFocus: 'focus:border-purple-400' },
    { border: 'border-orange-400', icon: Target, iconColor: 'text-orange-500', text: 'text-orange-600', hover: 'hover:text-orange-700', bg: 'bg-orange-50', bgBorder: 'border-orange-200', bgText: 'text-orange-800', inputBorder: 'border-orange-200', inputFocus: 'focus:border-orange-400' },
    { border: 'border-pink-400', icon: TrendingUp, iconColor: 'text-pink-500', text: 'text-pink-600', hover: 'hover:text-pink-700', bg: 'bg-pink-50', bgBorder: 'border-pink-200', bgText: 'text-pink-800', inputBorder: 'border-pink-200', inputFocus: 'focus:border-pink-400' },
    { border: 'border-indigo-400', icon: Play, iconColor: 'text-indigo-500', text: 'text-indigo-600', hover: 'hover:text-indigo-700', bg: 'bg-indigo-50', bgBorder: 'border-indigo-200', bgText: 'text-indigo-800', inputBorder: 'border-indigo-200', inputFocus: 'focus:border-indigo-400' },
    { border: 'border-teal-400', icon: BookOpen, iconColor: 'text-teal-500', text: 'text-teal-600', hover: 'hover:text-teal-700', bg: 'bg-teal-50', bgBorder: 'border-teal-200', bgText: 'text-teal-800', inputBorder: 'border-teal-200', inputFocus: 'focus:border-teal-400' },
    { border: 'border-cyan-400', icon: Sparkles, iconColor: 'text-cyan-500', text: 'text-cyan-600', hover: 'hover:text-cyan-700', bg: 'bg-cyan-50', bgBorder: 'border-cyan-200', bgText: 'text-cyan-800', inputBorder: 'border-cyan-200', inputFocus: 'focus:border-cyan-400' },
    { border: 'border-amber-400', icon: Video, iconColor: 'text-amber-500', text: 'text-amber-600', hover: 'hover:text-amber-700', bg: 'bg-amber-50', bgBorder: 'border-amber-200', bgText: 'text-amber-800', inputBorder: 'border-amber-200', inputFocus: 'focus:border-amber-400' },
  ];

  const getQuestionColor = (index: number) => questionColors[index % questionColors.length];

  // Load videos from database
  const [defaultVideos, setDefaultVideos] = useState<InspirationVideo[]>([]);

  useEffect(() => {
    const loadVideosFromDatabase = async () => {
      try {
        // Pass language to RPC
        const { data, error } = await supabase.rpc('get_inspiration_videos', { p_lang: lang === 'kn' ? 'kn' : lang === 'ta' ? 'ta' : 'en' });

        if (error) {
          handleDatabaseError(error, 'InspirationAssessment - Videos');
          throw error;
        }

        if (validateApiResponse(data, 'InspirationAssessment - Videos')) {
          logger.log('✅ Database videos loaded:', data.length, 'videos');
          logger.log('📊 Raw database data:', data);

          // Remove duplicates based on URL to prevent duplicate videos
          const uniqueVideos = data.filter((video: any, index: number, self: any[]) =>
            index === self.findIndex((v: any) => v.url === video.url)
          );

          logger.log('🔍 After deduplication:', uniqueVideos.length, 'unique videos');

          const videos: InspirationVideo[] = uniqueVideos.map((video: any, index: number) => ({
            id: index + 1,
            title: video.title,
            url: video.url,
            youtubeId: video.youtube_id || extractYouTubeId(video.url)
          }));
          logger.log('🔄 Setting default videos:', videos.length);
          setDefaultVideos(videos);
        } else {
          logger.log('⚠️ No videos found in database, using fallback');
          throw new Error('No videos found');
        }
      } catch (error) {
        handleDatabaseError(error, 'InspirationAssessment - Videos');
        logger.log('🔄 Using hardcoded fallback videos');
        // Fallback to hardcoded videos if database fails (4 videos)
        // Fallback to hardcoded videos if database fails
        const kVideos = {
          'ta': [
            { id: 1, title: "Tamil Video 1", url: "https://youtu.be/U7-HlfpvQIA?si=_gakjQozpgbZC2aQ", youtubeId: "U7-HlfpvQIA" },
            { id: 2, title: "Tamil Video 2", url: "https://www.youtube.com/watch?v=xqb1hfgfcl8", youtubeId: "xqb1hfgfcl8" },
            { id: 3, title: "Tamil Video 3", url: "https://youtu.be/G87ylRECJzY?si=HyhMM4-ggplVLO2i", youtubeId: "G87ylRECJzY" }
          ],
          'kn': [
            { id: 1, title: "Kannada Video 1", url: "https://youtu.be/U7-HlfpvQIA?si=_gakjQozpgbZC2aQ", youtubeId: "U7-HlfpvQIA" },
            { id: 2, title: "Kannada Video 2", url: "https://www.youtube.com/watch?v=xqb1hfgfcl8", youtubeId: "xqb1hfgfcl8" },
            { id: 3, title: "Kannada Video 3", url: "https://www.youtube.com/watch?v=z3PYJ9MfMH4", youtubeId: "z3PYJ9MfMH4" }
          ],
          'en': [
            { id: 1, title: "English Video 1", url: "https://youtu.be/U7-HlfpvQIA?si=_gakjQozpgbZC2aQ", youtubeId: "U7-HlfpvQIA" },
            { id: 2, title: "English Video 2", url: "https://www.youtube.com/watch?v=xqb1hfgfcl8", youtubeId: "xqb1hfgfcl8" },
            { id: 3, title: "English Video 3", url: "https://youtu.be/G87ylRECJzY?si=HyhMM4-ggplVLO2i", youtubeId: "G87ylRECJzY" }
          ]
        };

        const targetLang = lang === 'kn' ? 'kn' : lang === 'ta' ? 'ta' : 'en';
        setDefaultVideos(kVideos[targetLang]);

      }
    };

    loadVideosFromDatabase();
  }, []);

  // Extract YouTube ID from URL
  const extractYouTubeId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  useEffect(() => {
    if (defaultVideos.length > 0) {
      logger.log('🔄 Setting inspiration videos:', defaultVideos.length);
      setInspirationVideos(defaultVideos);
      setLoading(false);

      // Initialize responses structure
      // Ensure all videos have corresponding response keys (merge with existing)
      setResponses(prev => {
        const next = { ...prev };
        defaultVideos.forEach((_, index) => {
          const videoKey = `video${index + 1}` as keyof AssessmentResponse;
          if (!next[videoKey]) {
            next[videoKey] = {
              question1: '',
              question2: '',
              question3: '',
              question4: '',
              question5: '',
              question6: '',
              question7: '',
              question8: '',
              question9: '',
              question10: ''
            };
          }
        });

        // Initialize summary responses
        if (!next['summary']) {
          next['summary'] = {
            question1: '',
            question2: '',
            question3: ''
          };
        }
        return next;
      });

      // Initialize video progress
      const initialProgress = defaultVideos.map(video => ({
        videoId: video.id,
        responses: {
          question1: '',
          question2: '',
          question3: '',
          question4: '',
          question5: '',
          question6: '',
          question7: '',
          question8: '',
          question9: '',
          question10: ''
        },
        isComplete: false,
        savedAt: undefined
      }));
      setVideoProgress(initialProgress);
    }
  }, [defaultVideos]);

  // Load summary questions from database
  useEffect(() => {
    const loadSummaryQuestions = async () => {
      try {
        const { data, error } = await supabase.rpc('get_inspiration_summary_questions_i18n', { p_lang: lang });
        if (error) throw error;
        if (data && Array.isArray(data)) {
          setSummaryQuestions(data);
          // If responses summary is empty or wrong size, initialize it
          setResponses(prev => {
            if (prev.summary) {
              const summary: Record<string, string> = { ...prev.summary };
              data.forEach((_, i) => {
                if (summary[`question${i + 1}`] === undefined) {
                  summary[`question${i + 1}`] = '';
                }
              });
              return { ...prev, summary };
            }
            const summary: Record<string, string> = {};
            data.forEach((_, i) => {
              summary[`question${i + 1}`] = '';
            });
            return { ...prev, summary };
          });
        }
      } catch (err) {
        logger.error('Error loading inspiration summary questions:', err);
      }
    };
    loadSummaryQuestions();
  }, [lang]);

  // Ensure an assessment_responses row exists and capture its id for audio uploads
  useEffect(() => {
    let mounted = true;

    const ensureAssessmentRecord = async () => {
      if (!userProfile || loading) return;

      // Resolve student_id from students table; do not fallback to users.id
      let studentId = userProfile.studentProfile?.id as string | undefined;
      if (!studentId) {
        const { data: studentRow } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userProfile.id)
          .maybeSingle();
        studentId = studentRow?.id;
      }

      if (!mounted) return;
      if (!studentId) {
        logger.warn('⚠️ Could not resolve student ID for audio setup');
        return;
      }

      setResolvedStudentId(studentId);

      try {
        // Try to find existing assessment record
        const { data: existing, error: selectError } = await supabase
          .from('assessment_responses')
          .select('id')
          .eq('student_id', studentId)
          .eq('assessment_type', 'inspiration')
          .eq('assessment_title', 'My Inspiration')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!mounted) return;

        if (existing && !selectError) {
          logger.log('✅ Found existing assessment record:', existing.id);
          setAssessmentRecordId(existing.id);
          return;
        }

        logger.log('📝 Creating new assessment record for audio...');
        // Create a new placeholder record to attach audio responses
        const { data: inserted, error: insertError } = await supabase
          .from('assessment_responses')
          .insert({
            student_id: studentId,
            assessment_type: 'inspiration',
            assessment_title: 'My Inspiration',
            responses: responses || {}, // Use current responses or empty object
            completed_at: null,
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (!mounted) return;
        if (insertError) throw insertError;

        logger.log('✅ Created new assessment record:', inserted.id);
        setAssessmentRecordId(inserted.id);
      } catch (e) {
        logger.error('❌ Failed to ensure assessment record for audio responses:', e);
        toast({
          title: t('error'),
          description: lang === 'kn' ? "ಆಡಿಯೊ ರೆಕಾರ್ಡಿಂಗ್‌ಗಾಗಿ ಸಿದ್ಧಪಡಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ." : "Could not initialize audio recording system.",
          variant: "destructive"
        });
      }
    };

    ensureAssessmentRecord();

    return () => { mounted = false; };
    // crucial: remove 'responses' from dependency to avoid infinite loops or unnecessary writes
  }, [userProfile, loading]);

  // Auto-save draft on changes (debounced)
  useEffect(() => {
    if (loading || isCompleted) return;
    const t = setTimeout(async () => {
      try {
        if (!userProfile?.id) return;
        let studentId = userProfile.studentProfile?.id as string | undefined;
        if (!studentId) {
          const { data: studentRow } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', userProfile.id)
            .maybeSingle();
          studentId = studentRow?.id;
        }
        if (!studentId) return;
        await supabase.from('assessment_responses').upsert({
          student_id: studentId,
          assessment_type: 'inspiration',
          assessment_title: 'My Inspiration',
          responses,
          updated_at: new Date().toISOString(),
          completed_at: null
        });
      } catch { }
    }, 800);
    return () => clearTimeout(t);
  }, [responses, loading, isCompleted, userProfile]);


  const checkExistingResponse = useCallback(async () => {
    if (!userProfile) return;

    logger.log('Loading existing response data...');
    setDataLoading(true);

    // Resolve student_id from students table; do not fallback to users.id
    let studentId = userProfile.studentProfile?.id as string | undefined;
    if (!studentId) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      studentId = studentRow?.id;
    }

    if (!studentId) {
      logger.log('No student ID found');
      setDataLoading(false);
      return;
    }

    try {
      logger.log('Querying database with studentId:', studentId);
      logger.log('Query parameters:', {
        student_id: studentId,
        assessment_type: 'inspiration',
        assessment_title: 'My Inspiration'
      });

      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'inspiration')
        .eq('assessment_title', 'My Inspiration')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      logger.log('Database query result:', { data, error });

      if (data && !error) {
        logger.log('Found existing data:', data);
        // Only set as completed if completed_at is not null
        setIsCompleted(!!data.completed_at);
        // Load audio_responses map and answered flags
        const audioRes = (data as any).audio_responses || {};
        setAudioResponsesMap(audioRes);
        const answered: Record<string, boolean> = {};
        Object.keys(audioRes).forEach((k) => { answered[k] = true; });
        setAudioAnswered(answered);

        // Update video progress from saved data
        if (data.responses) {
          const savedResponses = data.responses as Partial<AssessmentResponse>;
          const mergeVideo = (vr: any) => ({
            question1: vr?.question1 ?? '',
            question2: vr?.question2 ?? '',
            question3: vr?.question3 ?? '',
            question4: vr?.question4 ?? '',
            question5: vr?.question5 ?? '',
            question6: vr?.question6 ?? '',
            question7: vr?.question7 ?? '',
            question8: vr?.question8 ?? '',
            question9: vr?.question9 ?? '',
            question10: vr?.question10 ?? ''
          });
          // Build merged responses dynamically based on number of videos
          const mergedResponses: AssessmentResponse = {} as AssessmentResponse;
          const videoCount = defaultVideos.length || 3;
          for (let v = 1; v <= videoCount; v++) {
            const videoKey = `video${v}` as keyof AssessmentResponse;
            (mergedResponses as any)[videoKey] = mergeVideo((savedResponses as any)[videoKey] || {});
          }
          logger.log('Loading saved responses:', mergedResponses);
          setResponses(mergedResponses);

          const updatedProgress = defaultVideos.map(video => {
            const videoKey = `video${video.id}` as keyof AssessmentResponse;
            const videoResponses = mergedResponses[videoKey];
            const isComplete = Object.entries(videoResponses).every(([q, v]) => {
              const qId = `${videoKey}_${q}`;
              return (typeof v === 'string' && v.trim() !== '') || !!answered[qId];
            });
            // Only mark as saved if the video has actual content (not just empty strings)
            const hasContent = Object.entries(videoResponses).some(([q, v]) => {
              const qId = `${videoKey}_${q}`;
              return (typeof v === 'string' && v.trim() !== '') || !!answered[qId];
            });
            logger.log(`Video ${video.id}: hasContent=${hasContent}, isComplete=${isComplete}`);
            return {
              videoId: video.id,
              responses: videoResponses,
              isComplete,
              savedAt: hasContent ? data.updated_at : undefined
            };
          });
          setVideoProgress(updatedProgress);
          logger.log('Updated video progress:', updatedProgress);
        }
      } else {
        logger.log('No existing data found. Error:', error);

        // Let's also check if there are any records at all for this student
        const { data: allData, error: allError } = await supabase
          .from('assessment_responses')
          .select('*')
          .eq('student_id', studentId);

        logger.log('All assessment responses for this student:', { allData, allError });

        // If there are multiple records, clean them up by keeping only the most recent one
        if (allData && allData.length > 1) {
          logger.log(`Found ${allData.length} duplicate records, cleaning up...`);
          const sortedData = allData.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          const keepRecord = sortedData[0];
          const deleteIds = sortedData.slice(1).map(record => record.id);

          logger.log('Keeping record:', keepRecord.id);
          logger.log('Deleting records:', deleteIds);

          if (deleteIds.length > 0) {
            const { error: deleteError } = await supabase
              .from('assessment_responses')
              .delete()
              .in('id', deleteIds);

            if (deleteError) {
              logger.error('Error cleaning up duplicate records:', deleteError);
            } else {
              logger.log('Successfully cleaned up duplicate records');
              // Now load the kept record
              setResponses(keepRecord.responses);
              setIsCompleted(!!keepRecord.completed_at);

              const mergeVideo2 = (vr: any) => ({
                question1: vr?.question1 ?? '',
                question2: vr?.question2 ?? '',
                question3: vr?.question3 ?? '',
                question4: vr?.question4 ?? '',
                question5: vr?.question5 ?? '',
                question6: vr?.question6 ?? '',
                question7: vr?.question7 ?? '',
                question8: vr?.question8 ?? '',
                question9: vr?.question9 ?? '',
                question10: vr?.question10 ?? ''
              });
              const updatedProgress = defaultVideos.map(video => {
                const videoKey = `video${video.id}` as keyof AssessmentResponse;
                const videoResponses = mergeVideo2((keepRecord as any).responses[videoKey]);
                const isComplete = Object.values(videoResponses).every((v: string) => v.trim() !== '');
                const hasContent = Object.values(videoResponses).some((v: string) => v.trim() !== '');
                return {
                  videoId: video.id,
                  responses: videoResponses,
                  isComplete,
                  savedAt: hasContent ? keepRecord.updated_at : undefined
                };
              });
              setVideoProgress(updatedProgress);
            }
          }
        }
      }
    } catch (error) {
      // No existing response found, which is fine
      logger.log('Error loading existing response:', error);
    } finally {
      setDataLoading(false);
    }
  }, [userProfile, defaultVideos]);

  // Call checkExistingResponse when component mounts and userProfile is available
  useEffect(() => {
    if (userProfile && !loading) {
      logger.log('Component mounted, loading existing data...');
      checkExistingResponse();
    }
  }, [userProfile, loading, checkExistingResponse]);

  // Load audio summary for this assessment and mark audio-answered questions; prefill transcripts
  useEffect(() => {
    const loadAudioSummary = async () => {
      if (!resolvedStudentId || !assessmentRecordId) return;
      try {
        // Prefer direct table query to include file_url and created_at
        const { data: files, error: filesError } = await supabase
          .from('audio_files')
          .select('question_id, file_url, created_at, transcription, confidence_score')
          .eq('assessment_id', assessmentRecordId);

        if (filesError) {
          logger.warn('audio_files fetch failed:', filesError);
          return;
        }
        let list = files || [];

        // Fallback: if nothing found (older saves may have missing/placeholder assessment_id),
        // fetch latest per question for this student
        if (list.length === 0) {
          const { data: fallback } = await supabase
            .from('audio_files')
            .select('question_id, file_url, created_at, transcription, confidence_score')
            .eq('student_id', resolvedStudentId)
            .like('question_id', 'video%_question%')
            .order('created_at', { ascending: false });
          list = fallback || [];
        }

        const answeredMap: Record<string, boolean> = {};
        const newAudioMap: Record<string, any> = {};
        let didPrefill = false;
        // Build next responses dynamically based on number of videos
        const nextResponses: AssessmentResponse = {} as AssessmentResponse;
        const videoCount = inspirationVideos.length || 4;
        for (let v = 1; v <= videoCount; v++) {
          const videoKey = `video${v}` as keyof AssessmentResponse;
          (nextResponses as any)[videoKey] = { ...(responses[videoKey] || {}) };
        }
        const prefillFlags: Record<string, boolean> = {};

        list.forEach((item: any) => {
          const qId = item.question_id as string; // e.g., video1_question3
          answeredMap[qId] = true;
          newAudioMap[qId] = {
            url: item.file_url,
            savedAt: item.created_at,
            confidence: item.confidence_score,
            transcript: item.transcription,
          };

          // Prefill transcript into text area only if empty
          const [videoKey, questionKey] = qId.split('_') as [keyof AssessmentResponse, string];
          const current = (nextResponses as any)[videoKey]?.[questionKey];
          if (typeof current === 'string' && current.trim() === '' && item.transcription) {
            (nextResponses as any)[videoKey][questionKey] = item.transcription as string;
            prefillFlags[qId] = true;
            didPrefill = true;
          }
        });

        if (Object.keys(answeredMap).length > 0) {
          setAudioAnswered(prev => ({ ...prev, ...answeredMap }));
        }
        if (Object.keys(newAudioMap).length > 0) {
          setAudioResponsesMap(prev => ({ ...prev, ...newAudioMap }));
        }
        if (Object.keys(prefillFlags).length > 0) {
          setTranscribedPrefill(prev => ({ ...prev, ...prefillFlags }));
        }

        if (didPrefill) {
          setResponses(nextResponses);
        }
      } catch (e) {
        logger.warn('Failed to load assessment audio summary:', e);
      }
    };

    loadAudioSummary();
  }, [resolvedStudentId, assessmentRecordId]);

  // Note: We removed the automatic sync between videoProgress and responses
  // to prevent conflicts. The responses state is now the single source of truth.

  const handleResponseChange = (videoKey: string, questionKey: string, value: string) => {
    if (readOnlyView) return;

    setResponses(prev => {
      const currentVideoResponses = prev[videoKey] || {};
      return {
        ...prev,
        [videoKey]: {
          ...currentVideoResponses,
          [questionKey]: value
        }
      };
    });
  };

  const handleStreamTranscript = (videoKey: string, questionKey: string, text: string) => {
    setResponses(prev => {
      const currentVideoResponses = prev[videoKey] || {};
      return {
        ...prev,
        [videoKey]: {
          ...currentVideoResponses,
          [questionKey]: text
        }
      };
    });

    const contextKey = `${videoKey}_${questionKey}`;
    if (!transcribedPrefill[contextKey]) {
      setTranscribedPrefill(prev => ({
        ...prev,
        [contextKey]: true
      }));
    }
  };

  // Handle audio responses
  const handleAudioResponse = (videoKey: string, questionKey: string, audioBlob: Blob, transcription?: string) => {
    if (readOnlyView) return;

    logger.log('🎤 handleAudioResponse called:', {
      videoKey,
      questionKey,
      hasTranscription: !!transcription,
      transcriptionLength: transcription?.length || 0,
      transcriptionPreview: transcription?.substring(0, 50) || 'none'
    });

    // Store the audio blob
    const audioKey = `${videoKey}_${questionKey}`;
    setAudioResponses(prev => ({
      ...prev,
      [audioKey]: audioBlob
    }));

    // Ensure the text box reflects what was recorded for validation/progress
    // Prefer transcription; if unavailable, add a clear placeholder line
    const fallbackText =
      lang === 'kn'
        ? 'ಆಡಿಯೊ ರೆಕಾರ್ಡ್ ಮಾಡಲಾಗಿದೆ — ಬರಹ ಲಭ್ಯವಿಲ್ಲ.'
        : lang === 'ta'
          ? 'ஆடியோ பதிவு செய்யப்பட்டது — எழுத்து வடிவம் இல்லை.'
          : 'Audio recorded — transcription unavailable.';
    const textToSet = (transcription && transcription.trim()) ? transcription : fallbackText;

    logger.log('📝 Setting text in textarea:', {
      questionKey,
      textLength: textToSet.length,
      textPreview: textToSet.substring(0, 50)
    });

    handleResponseChange(videoKey, questionKey, textToSet);

    // Mark transcription as prefilled if we have a valid transcription
    if (transcription && transcription.trim() && transcription !== fallbackText) {
      setTranscribedPrefill(prev => ({
        ...prev,
        [`${String(videoKey)}_${questionKey}`]: true
      }));
    }

    // Mark this question as answered via audio for completion rules
    const qId = `${videoKey}_${questionKey}`;
    setAudioAnswered(prev => ({ ...prev, [qId]: true }));
  };

  const getProgressPercentage = () => {
    const videosCount = inspirationVideos.length || 3;
    const questionsPerVideo = questionCount || 0;
    const sCount = summaryQuestions.length > 0 ? summaryQuestions.length : 3;

    // Video questions
    const videosTotal = videosCount * questionsPerVideo;
    if (videosTotal === 0 && sCount === 0) return 0;

    const answeredVideos = Object.entries(responses).reduce((total, [videoKey, video]) => {
      if (!video || typeof video !== 'object' || videoKey === 'summary') {
        return total;
      }

      const answered = Object.entries(video as Record<string, string>).filter(([q, v]) => {
        const qId = `${videoKey}_${q}`;
        // Only count if it's one of the expected questions
        const qNum = parseInt(q.replace('question', ''));
        if (isNaN(qNum) || qNum > questionsPerVideo) return false;

        return (v?.trim?.() ?? '') !== '' || !!audioAnswered[qId];
      }).length;
      return total + answered;
    }, 0);

    // Summary questions
    const summaryResponses = (responses['summary'] as any) || {};
    let answeredSummary = 0;
    if (summaryQuestions.length > 0) {
      summaryQuestions.forEach((_, i) => {
        if (summaryResponses[`question${i + 1}`]?.trim()) answeredSummary++;
      });
    } else {
      ['question1', 'question2', 'question3'].forEach(q => {
        if (summaryResponses[q]?.trim()) answeredSummary++;
      });
    }

    const totalAnswered = answeredVideos + answeredSummary;
    const finalTotal = videosTotal + sCount;

    return finalTotal > 0 ? Math.round((totalAnswered / finalTotal) * 100) : 0;
  };

  const areAllVideosComplete = () => {
    const videoKeys = inspirationVideos.map((_, i) => `video${i + 1}`);
    if (videoKeys.length === 0 || questionCount === 0) return false;

    return videoKeys.every((vk) => {
      const questions = responses[vk];
      if (!questions || typeof questions !== 'object') return false;

      const expectedQuestions = Array.from({ length: questionCount }, (_, i) => `question${i + 1}`);
      return expectedQuestions.every(q => {
        const qId = `${vk}_${q}`;
        const answer = (questions as any)[q] || '';
        return answer.trim() !== '' || !!audioAnswered[qId];
      });
    });
  };

  const isSummaryComplete = () => {
    const summary = (responses['summary'] as any) || {};
    if (summaryQuestions.length > 0) {
      return summaryQuestions.every((_, i) => (summary[`question${i + 1}`] || '').trim() !== '');
    }
    return ['question1', 'question2', 'question3'].every(q => (summary[q] || '').trim() !== '');
  };

  const canSubmit = () => {
    return areAllVideosComplete() && isSummaryComplete();
  };

  const isVideoComplete = (videoIndex: number) => {
    const videoKey = `video${videoIndex + 1}`;
    const questions = responses[videoKey];

    // Check if questions exist and is an object
    if (!questions || typeof questions !== 'object') {
      return false;
    }

    // Check all expected questions are answered
    if (questionCount === 0) return false;
    const expectedQuestions = Array.from({ length: questionCount }, (_, i) => `question${i + 1}`);
    return expectedQuestions.every(q => {
      const qId = `${videoKey}_${q}`;
      const answer = questions[q] || '';
      return answer.trim() !== '' || !!audioAnswered[qId];
    });
  };

  const isVideoSaved = (videoIndex: number) => {
    const video = videoProgress.find(v => v.videoId === videoIndex + 1);
    // A video is considered saved if it has a savedAt timestamp AND has actual content
    return !!(video?.savedAt && video.isComplete);
  };

  const getCurrentVideoCompletionStatus = () => {
    const videoKey = getCurrentVideoKey();
    const totalQuestions = questionCount || 0;
    const videoResponses = responses[videoKey];

    if (!videoResponses || typeof videoResponses !== 'object' || totalQuestions === 0) {
      return { answered: 0, total: totalQuestions, isComplete: false };
    }

    // Count only expected questions
    const expectedQuestions = Array.from({ length: totalQuestions }, (_, i) => `question${i + 1}`);
    const answeredQuestions = expectedQuestions.filter(q => {
      const qId = `${videoKey}_${q}`;
      const answer = videoResponses[q] || '';
      return answer.trim() !== '' || !!audioAnswered[qId];
    }).length;
    return { answered: answeredQuestions, total: totalQuestions, isComplete: answeredQuestions === totalQuestions };
  };

  const saveVideoProgress = async (videoIndex: number) => {
    if (readOnlyView) return;
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    if (!isVideoComplete(videoIndex)) {
      toast({
        title: lang === 'kn' ? "ಇನ್ನೂ ಉಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ" : lang === 'ta' ? 'இப்போ சேமிக்க முடியாது' : "Cannot Save Yet",
        description:
          lang === 'kn'
            ? `ಉಳಿಸುವ ಮೊದಲು ಈ ವೀಡಿಯೊಗೆ ಎಲ್ಲಾ ${questionCount} ಪ್ರಶ್ನೆಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.`
            : lang === 'ta'
              ? `இந்த வீடியோவை சேமிக்க முன் இந்த வீடியோவுக்கான எல்லா ${questionCount} கேள்விகளுக்கும் பதில் எழுதுங்கள்.`
              : `Please complete all ${questionCount} questions for this video before saving.`,
        variant: "destructive",
      });
      return;
    }

    // Resolve student_id from students table; do not fallback to users.id
    let studentId = userProfile.studentProfile?.id as string | undefined;
    if (!studentId) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      studentId = studentRow?.id;
    }

    if (!studentId) {
      toast({
        title: t('errorSavingVideoProgress'),
        description: lang === 'kn' ? "ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಶಿಕ್ಷಕ ಅಥವಾ ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ." : "Student profile not found. Please contact your teacher or support.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      logger.log('Getting existing responses from database...');
      logger.log('Query parameters for existing data:', {
        student_id: studentId,
        assessment_type: 'inspiration',
        assessment_title: 'My Inspiration'
      });

      // Get existing responses from database
      const { data: existingData, error: existingError } = await supabase
        .from('assessment_responses')
        .select('responses')
        .eq('student_id', studentId)
        .eq('assessment_type', 'inspiration')
        .eq('assessment_title', 'My Inspiration')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      logger.log('Existing data query result:', { existingData, existingError });

      // Merge only the specific video's responses with existing data
      const videoKey = `video${videoIndex + 1}` as keyof AssessmentResponse;
      const existingResponses = (existingData?.responses as Partial<AssessmentResponse>) || {};
      const ensureShape = (vr: any) => ({
        question1: vr?.question1 ?? '',
        question2: vr?.question2 ?? '',
        question3: vr?.question3 ?? '',
        question4: vr?.question4 ?? '',
        question5: vr?.question5 ?? '',
        question6: vr?.question6 ?? '',
        question7: vr?.question7 ?? '',
        question8: vr?.question8 ?? '',
        question9: vr?.question9 ?? '',
        question10: vr?.question10 ?? ''
      });
      // Ensure shape for all videos dynamically
      const videoCount = inspirationVideos.length || 3;
      for (let v = 1; v <= videoCount; v++) {
        const vKey = `video${v}`;
        (existingResponses as any)[vKey] = ensureShape((existingResponses as any)[vKey] || {});
      }

      logger.log('Existing responses from database:', existingResponses);

      // Build a fully-typed AssessmentResponse object dynamically
      const updatedResponses: AssessmentResponse = {} as AssessmentResponse;
      for (let v = 1; v <= videoCount; v++) {
        const vKey = `video${v}` as keyof AssessmentResponse;
        (updatedResponses as any)[vKey] = (videoKey === vKey)
          ? responses[videoKey]
          : (existingResponses as any)[vKey];
      }

      logger.log('Saving video progress for video', videoIndex + 1);
      logger.log('Video responses to save:', responses[videoKey]);
      logger.log('Updated responses to save:', updatedResponses);

      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('assessment_responses')
        .update({
          responses: updatedResponses,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', studentId)
        .eq('assessment_type', 'inspiration')
        .eq('assessment_title', 'My Inspiration')
        .select();

      logger.log('Update result:', { updateData, updateError });

      let error = updateError;

      // If no rows were updated (no existing record), insert a new one
      if (!updateError && (!updateData || updateData.length === 0)) {
        logger.log('No existing record found, inserting new one...');
        const { error: insertError } = await supabase
          .from('assessment_responses')
          .insert({
            student_id: studentId,
            assessment_type: 'inspiration',
            assessment_title: 'My Inspiration',
            responses: updatedResponses,
            completed_at: null
          });
        error = insertError;
        logger.log('Insert result:', { insertError });
      }

      if (error) {
        logger.error('Error saving to database:', error);
        throw error;
      }

      logger.log('Successfully saved to database');

      // Update responses state with the merged data
      setResponses(updatedResponses);

      // Update video progress with saved timestamp and ensure responses are in sync
      setVideoProgress(prev => prev.map(v =>
        v.videoId === videoIndex + 1
          ? {
            ...v,
            responses: responses[videoKey],
            savedAt: new Date().toISOString()
          }
          : v
      ));

      const currentVideo = inspirationVideos[videoIndex];
      const videoLabel = currentVideo?.title || `Video ${videoIndex + 1}`;

      toast({
        title: t('videoProgressSaved'),
        description: `Your responses for ${videoLabel} have been saved.`,
      });
    } catch (error) {
      logger.error('Error saving video progress:', error);
      toast({
        title: t('errorSavingVideoProgress'),
        description: t('errorSavingVideoProgressDesc'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitAssessment = async () => {
    if (readOnlyView) return;
    if (!userProfile) {
      toast({
        title: t('errorSavingVideoProgress'),
        description: lang === 'kn' ? "ಬಳಕೆದಾರ ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಲಾಗಿನ್ ಮಾಡಿ." : "User profile not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    if (!canSubmit()) {
      const requiredVideos = inspirationVideos.length || defaultVideos.length || 3;
      toast({
        title: lang === 'kn' ? "ಇನ್ನೂ ಸಲ್ಲಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ" : "Cannot Submit Yet",
        description: lang === 'kn'
          ? `ಮೌಲ್ಯಮಾಪನವನ್ನು ಸಲ್ಲಿಸುವ ಮೊದಲು ಎಲ್ಲಾ ${requiredVideos} ವೀಡಿಯೊಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.`
          : `Please complete all ${requiredVideos} videos before submitting the assessment.`,
        variant: "destructive",
      });
      return;
    }

    // Resolve student_id from students table; do not fallback to users.id
    let studentId = userProfile.studentProfile?.id as string | undefined;
    if (!studentId) {
      const { data: studentRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      studentId = studentRow?.id;
    }

    if (!studentId) {
      toast({
        title: t('errorSavingVideoProgress'),
        description: lang === 'kn' ? "ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಶಿಕ್ಷಕ ಅಥವಾ ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ." : "Student profile not found. Please contact your teacher or support.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Save assessment responses and get the response ID
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'inspiration',
          assessment_title: 'My Inspiration',
          responses: responses,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Show success message for assessment submission
      toast({
        title: "Assessment Completed! ✨",
        description: "Generating your reflection summary...",
      });

      // Notify student (self) and teacher of submission (best-effort)
      try {
        const studentNotifResult = await notificationService.create({
          userId: userProfile.id,
          type: 'system',
          title: 'Inspiration submitted',
          message: 'Your Inspiration assessment has been submitted.',
          link: '/student'
        });
        if (!studentNotifResult.success) {
          logger.error('Failed to notify student:', studentNotifResult.error);
        }

        // find teacher for this student
        const teacherUserId = await resolveTeacherUserId();
        if (teacherUserId) {
          const teacherNotifResult = await notificationService.create({
            userId: teacherUserId,
            type: 'assessment_submitted',
            title: `${userProfile.full_name || 'Student'} submitted Inspiration`,
            message: 'A new Inspiration assessment is ready to review.',
            link: '/teacher#reviews'
          });
          if (!teacherNotifResult.success) {
            logger.error('Failed to notify teacher:', teacherNotifResult.error);
          } else {
            logger.log('✅ Notification sent to teacher:', teacherUserId);
          }
        }
      } catch (error) {
        logger.error('Error sending notifications:', error);
      }

      // Generate AI summary in the background
      try {
        if (aiSummaryService.isConfigured()) {
          logger.log('🤖 Generating AI summary for assessment:', assessmentData.id);

          // Filter out summary tab data before generating AI summary
          const videoResponsesOnly = { ...responses };
          delete (videoResponsesOnly as any).summary;

          const summaryResult = await aiSummaryService.generateInspirationSummary(videoResponsesOnly);

          if (summaryResult.success && summaryResult.summary) {
            // Save summary to database
            const saveResult = await summaryDatabaseService.createAISummary(
              assessmentData.id,
              summaryResult.summary,
              userProfile.id
            );

            if (saveResult.success) {
              logger.log('✅ AI summary saved successfully:', saveResult.summaryId);
              toast({
                title:
                  lang === 'kn'
                    ? 'ಸಾರಾಂಶ ಸಿದ್ಧವಾಗಿದೆ! 📝'
                    : lang === 'ta'
                      ? 'சுருக்கம் உருவாக்கப்பட்டது! 📝'
                      : 'Summary Generated! 📝',
                description:
                  lang === 'kn'
                    ? 'ನೀವು ಬರೆದ ಚಿಂತನೆಗಳ ಸಾರಾಂಶವನ್ನು ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಪರಿಶೀಲಿಸಲಿದ್ದಾರೆ.'
                    : lang === 'ta'
                      ? 'நீங்கள் எழுதிய சிந்தனைச் சுருக்கத்தை உங்கள் ஆசிரியா் விரைவில் பார்வையிடுவார்.'
                      : 'Your teacher will review your reflection summary.',
              });

              // Notify teacher that summary is ready for review
              try {
                const { notificationService } = await import('@/services/notificationService');

                // Find teacher for this student
                const teacherUserId = await resolveTeacherUserId();
                if (teacherUserId) {
                  const notifResult = await notificationService.create({
                    userId: teacherUserId,
                    type: 'assessment_submitted',
                    title: `${userProfile.full_name || 'Student'} completed My Inspiration assessment`,
                    message: 'A new My Inspiration assessment summary is ready for review.',
                    link: '/teacher/ai-summary-review'
                  });
                  if (!notifResult.success) {
                    logger.error('Failed to notify teacher:', notifResult.error);
                  } else {
                    logger.log('✅ Notification sent to teacher for summary review:', teacherUserId);
                  }
                }
              } catch (notifError) {
                logger.error('Error notifying teacher:', notifError);
                // Don't fail the whole submission if notification fails
              }
            } else {
              logger.error('Failed to save summary:', saveResult.error);
              toast({
                title: "Summary Generation Issue",
                description: "Your assessment is saved, but summary generation needs attention.",
                variant: "destructive",
              });
            }
          } else {
            logger.error('Failed to generate summary:', summaryResult.error);
            toast({
              title: "Summary Generation Issue",
              description: "Your assessment is saved. Summary will be generated later.",
              variant: "destructive",
            });
          }
        } else {
          logger.warn('⚠️ Gemini API not configured, skipping summary generation');
          toast({
            title: "Assessment Saved! ✨",
            description: "Your reflections have been captured successfully!",
          });
        }
      } catch (summaryError) {
        logger.error('Error in summary generation:', summaryError);
        // Don't fail the entire submission if summary generation fails
        toast({
          title: "Assessment Saved! ✨",
          description: "Your reflections have been captured successfully!",
        });
      }

      setIsCompleted(true);
    } catch (error) {
      logger.error('Error submitting assessment:', error);
      toast({
        title: t('errorSavingVideoProgress'),
        description: lang === 'kn' ? "ಮೌಲ್ಯಮಾಪನವನ್ನು ಸಲ್ಲಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ." : "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextVideo = () => {
    if (currentVideoIndex < inspirationVideos.length) {
      if (currentVideoIndex === inspirationVideos.length - 1 && !areAllVideosComplete()) {
        toast({
          title: lang === 'kn' ? 'ಸಾರಾಂಶ ಲಾಕ್ ಆಗಿದೆ' : lang === 'ta' ? 'சுருக்கம் பூட்டப்பட்டுள்ளது' : 'Summary Locked',
          description: lang === 'kn'
            ? 'ಸಾರಾಂಶವನ್ನು ವೀಕ್ಷಿಸಲು ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.'
            : lang === 'ta'
              ? 'சுருக்கத்தைப் பார்க்க அனைத்துக் கேள்விகளுக்கும் பதில் அளிக்கவும்.'
              : 'Please answer all core questions to unlock the summary.',
          variant: 'destructive',
        });
        return;
      }
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const previousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const getCurrentVideoKey = (): string => {
    if (currentVideoIndex === inspirationVideos.length) return 'summary';
    return `video${currentVideoIndex + 1}`;
  };

  const getCurrentVideoResponses = () => {
    return responses[getCurrentVideoKey()];
  };

  if (loading || dataLoading) {
    const loadingAssessmentText =
      lang === 'kn'
        ? 'ನಿಮ್ಮ ಪ್ರೇರಣೆ ಮೌಲ್ಯಮಾಪನವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? 'உங்கள் ஊக்கம் மதிப்பீடு ஏற்றப்படுகிறது...'
          : 'Loading your inspiration assessment...';

    const loadingProgressText =
      lang === 'kn'
        ? 'ನಿಮ್ಮ ಉಳಿಸಿದ ಪ್ರಗತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'
        : lang === 'ta'
          ? 'உங்கள் சேமிக்கப்பட்ட முன்னேற்றம் ஏற்றப்படுகிறது...'
          : 'Loading your saved progress...';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            {loading ? loadingAssessmentText : loadingProgressText}
          </p>
        </div>
      </div>
    );
  }

  if (isCompleted && !readOnlyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <Lightbulb className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-blue-800">
                {lang === 'kn'
                  ? 'ಪ್ರೇರಣೆ ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡಿದೆ! ✨'
                  : lang === 'ta'
                    ? 'ஊக்கம் செயல்பாடு முடிந்தது! ✨'
                    : 'Inspiration Assessment Completed! ✨'}
              </CardTitle>
              <CardDescription className="text-blue-600">
                {lang === 'kn'
                  ? 'ಎಲ್ಲಾ ಪ್ರೇರಣಾದಾಯಕ ವೀಡಿಯೊಗಳ ಬಗ್ಗೆ ನೀವು ಯಶಸ್ವಿಯಾಗಿ ಚಿಂತಿಸಿದ್ದಾರೆ.'
                  : lang === 'ta'
                    ? 'அனைத்து ஊக்கமான வீடியோக்கள் பற்றியும் நீங்கள் வெற்றிகரமாக சிந்தித்து எழுதியுள்ளீர்கள்.'
                    : "You've successfully reflected on all inspirational videos"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  {lang === 'kn'
                    ? 'ಪ್ರೇರಣೆ ಮೌಲ್ಯಮಾಪನವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಪ್ರೇರಣಾದಾಯಕ ವೀಡಿಯೊಗಳ ಬಗ್ಗೆ ಮಾಡಿದ ಬರಹಗಳನ್ನು ನಾವು ಉಳಿಸಿದ್ದೇವೆ. ಈಗ ನಿಮ್ಮ ಶಿಕ್ಷಕರು ಅವನ್ನು ಓದಿ, ನಿಮ್ಮ ವೃತ್ತಿ ಪ್ರಯಾಣಕ್ಕೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಲು ಬಳಸಬಹುದು.'
                    : lang === 'ta'
                      ? 'இந்த ஊக்கம் செயல்பாட்டை முழுமையாக முடித்ததற்கு நன்றி! இந்த வீடியோக்கள் பற்றி நீங்கள் எழுதிய சிந்தனைகள் அனைத்தும் பாதுகாக்கப்பட்டுள்ளன. இப்போது உங்கள் ஆசிரியர் அவற்றை படித்து, உங்கள் தொழில் பயணத்திற்கு வழிகாட்ட உதவ முடியும்.'
                      : 'Thank you for completing the inspiration assessment! Your reflections on the inspirational videos have been saved and your teacher can now review them to help guide your career journey.'}
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      if (!params.get('lang') && lang) {
                        params.set('lang', lang);
                      }
                      params.set('readonly', '1');
                      navigate(`/student/assessment/inspiration?${params.toString()}`);
                    }}
                  >
                    {lang === 'kn' ? 'ನನ್ನ ಉತ್ತರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : lang === 'ta' ? 'என் பதில்களை பார்' : 'View My Answers'}
                  </Button>
                  <Button
                    onClick={() => navigate('/student')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {lang === 'kn' ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : lang === 'ta' ? 'முதல் பக்கத்திற்கு போ' : 'Back to Dashboard'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentVideo = inspirationVideos[currentVideoIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8" lang={lang} dir="auto">
      <div className="container mx-auto px-4">
        {/* Header with Back Button */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 md:gap-0">
          <div className="w-full md:w-auto flex justify-start">
            <Button
              variant="ghost"
              onClick={() => navigate('/student')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToDashboard')}
            </Button>
          </div>
          <div className="text-center flex-1 w-full md:w-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2">{dbTitle || t('inspirationTitle')}</h1>
            <p className="text-blue-600 text-sm md:text-lg">{dbIntro || t('inspirationIntro')}</p>
          </div>
          <div className="hidden md:block w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('yourProgress')}</h2>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Badge variant="secondary">{Math.round(getProgressPercentage())}% {t('completeSuffix')}</Badge>
                <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{videoProgress?.filter(v => v.savedAt && v.isComplete).length || 0} {t('saved')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{videoProgress?.filter(v => v.isComplete).length || 0} {t('complete')}</span>
                  </div>
                </div>
              </div>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>
                {currentVideoIndex === inspirationVideos.length
                  ? t('summary')
                  : t('videoCounter', '', currentVideoIndex + 1, inspirationVideos.length)}
              </span>
              <span>{Math.round(getProgressPercentage())}% {t('completeSuffix')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Video Navigation */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl text-blue-800">{t('videoNavigation')}</CardTitle>
            <CardDescription className="text-blue-600">
              {t('clickAnyVideo')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {inspirationVideos.map((video, index) => (
                <Button
                  key={video.id}
                  onClick={() => setCurrentVideoIndex(index)}
                  variant={currentVideoIndex === index ? "default" : "outline"}
                  size="sm"
                  className={`${currentVideoIndex === index ? "bg-blue-600" : ""}`}
                >
                  {t('videoLabelN', '', index + 1)}
                  {isVideoComplete(index) && (
                    <CheckCircle className="w-3 h-3 ml-1 text-green-500" />
                  )}
                  {isVideoSaved(index) && (
                    <Save className="w-3 h-3 ml-1 text-blue-500" />
                  )}
                </Button>
              ))}
              <Button
                onClick={() => setCurrentVideoIndex(inspirationVideos.length)}
                variant={currentVideoIndex === inspirationVideos.length ? "default" : "outline"}
                size="sm"
                className={`${currentVideoIndex === inspirationVideos.length ? "bg-blue-600" : ""} border-blue-400`}
                disabled={!areAllVideosComplete()}
              >
                <Sparkles className="w-3 h-3 text-yellow-500 mr-1" />
                {t('summary')}
                {isSummaryComplete() && (
                  <CheckCircle className="w-3 h-3 ml-1 text-green-500" />
                )}
                {!areAllVideosComplete() && (
                  <Lock className="w-3 h-3 ml-1 opacity-70" />
                )}
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Current Video Section */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl text-blue-800">
              {currentVideoIndex === inspirationVideos.length
                ? t('summaryReflection')
                : `${t('videoLabelN', '', currentVideoIndex + 1)}: ${currentVideo?.title}`}
            </CardTitle>
            <CardDescription className="text-blue-600">
              {currentVideoIndex === inspirationVideos.length
                ? lang === 'kn' ? 'ಸಾರಾಂಶದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ' : lang === 'ta' ? 'சுருக்கமான கேள்விகளுக்கு பதிலளிக்கவும்' : 'Please answer these final summary questions'
                : t('watchAndAnswer')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Video Player - Only show if not on summary tab */}
            {currentVideoIndex < inspirationVideos.length && currentVideo && (
              <div className="mb-6">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${currentVideo.youtubeId}`}
                    title={currentVideo.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Youtube className="w-4 h-4 text-red-600" />
                  <a
                    href={currentVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {t('openInYouTube')} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Questions Header */}
              {currentVideoIndex < inspirationVideos.length && (
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{t('reflectionQuestions')}</h3>
                  <div className="text-sm text-gray-600">
                    {(() => {
                      const status = getCurrentVideoCompletionStatus();
                      return (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.isComplete
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {status.answered}/{status.total} questions answered
                        </span>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Render Questions (Summary or Video) */}
              {currentVideoIndex === inspirationVideos.length ? (
                // Summary Questions
                <div className="space-y-6">
                  {summaryQuestions.length > 0 ? (
                    summaryQuestions.map((sq, index) => {
                      const qKey = `question${index + 1}`;
                      const questionValue = (responses['summary'] as any)?.[qKey] || '';
                      const isAnswered = questionValue.trim() !== '';
                      const colors = getQuestionColor(index);
                      const IconComponent = colors.icon;

                      return (
                        <div key={sq.id || qKey} className={`border-l-4 pl-3 md:pl-6 ${isAnswered ? colors.border : 'border-red-400'} mb-6`}>
                          {sq.section_header && (
                            <div className="mb-4 pb-2 border-b border-gray-100">
                              <h4 className="text-md font-semibold text-blue-700">{sq.section_header}</h4>
                            </div>
                          )}
                          <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                            <IconComponent className={`w-5 h-5 ${colors.iconColor}`} />
                            {sq.question_text}
                            <span className="text-red-500 text-sm">*</span>
                          </label>
                          <Textarea
                            placeholder={t('typeYourAnswerHere', 'Type your answer here...')}
                            value={questionValue}
                            onChange={(e) => handleResponseChange('summary', qKey, e.target.value)}
                            readOnly={readOnlyView}
                            rows={4}
                            className={`text-base ${isAnswered
                              ? `${colors.inputBorder} ${colors.inputFocus}`
                              : 'border-red-300 focus:border-red-400 bg-red-50'
                              }`}
                            required
                          />
                        </div>
                      );
                    })
                  ) : (
                    // Fallback to t() keys if DB fetch fails or is pending
                    ['question1', 'question2', 'question3'].map((questionKey, index) => {
                      const questionLabelKey = `summaryQ${index + 1}`;
                      const questionText = t(questionLabelKey);
                      const questionValue = (responses['summary'] as any)?.[questionKey] || '';
                      const isAnswered = questionValue.trim() !== '';
                      const colors = getQuestionColor(index);
                      const IconComponent = colors.icon;

                      return (
                        <div key={questionKey} className={`border-l-4 pl-3 md:pl-6 ${isAnswered ? colors.border : 'border-red-400'} mb-6`}>
                          <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                            <IconComponent className={`w-5 h-5 ${colors.iconColor}`} />
                            {questionText}
                            <span className="text-red-500 text-sm">*</span>
                          </label>
                          <Textarea
                            placeholder={t('typeYourAnswerHere', 'Type your answer here...')}
                            value={questionValue}
                            onChange={(e) => handleResponseChange('summary', questionKey, e.target.value)}
                            readOnly={readOnlyView}
                            rows={4}
                            className={`text-base ${isAnswered
                              ? `${colors.inputBorder} ${colors.inputFocus}`
                              : 'border-red-300 focus:border-red-400 bg-red-50'
                              }`}
                            required
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                // Video Questions
                <>
                  {/* Recording Instructions for videos */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-lg">🎙️</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-800 mb-2">{t('audioRecordingInstructionsTitle')}</h3>
                        <p className="text-sm text-blue-700 mb-2">{t('audioInstructionsLead')}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-blue-600">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full"></span>{t('audioInstructionsBullet1')}</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full"></span>{t('audioInstructionsBullet2')}</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full"></span>{t('audioInstructionsBullet3')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {Array.from({ length: questionCount }, (_, index) => {
                    const questionNum = index + 1;
                    const questionKey = `question${questionNum}`;
                    const questionText = questionTexts[questionKey] || '';
                    const helpText = helpTexts[questionKey] || '';
                    const questionValue = getCurrentVideoResponses()[questionKey] || '';
                    const isAnswered = questionValue.trim() !== '' || !!audioAnswered[`${getCurrentVideoKey()}_${questionKey}`];
                    const colors = getQuestionColor(index);
                    const IconComponent = colors.icon;

                    return (
                      <div key={questionKey} className={`border-l-4 pl-3 md:pl-6 ${isAnswered ? colors.border : 'border-red-400'} mb-6`}>
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3 gap-3">
                          <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <IconComponent className={`w-5 h-5 ${colors.iconColor}`} />
                            {questionText}
                            <span className="text-red-500 text-sm">*</span>
                            <button
                              type="button"
                              className={`ml-2 ${colors.text} ${colors.hover}`}
                              onClick={() => toggleHelp(helpKey(questionKey))}
                            >
                              💬
                            </button>
                          </label>
                          {helpOpen[helpKey(questionKey)] && (
                            <div className={`mt-2 mb-2 p-3 rounded border ${colors.bg} ${colors.bgBorder} text-sm ${colors.bgText}`}>
                              {helpText}
                            </div>
                          )}
                          <div className="w-full md:w-auto md:ml-4 flex-shrink-0">
                            {(resolvedStudentId && assessmentRecordId) ? (
                              <AudioRecorder
                                key={`${getCurrentVideoKey()}_${questionKey}`}
                                questionId={`${getCurrentVideoKey()}_${questionKey}`}
                                onRecordingComplete={(audioBlob, transcription) => {
                                  handleAudioResponse(getCurrentVideoKey() as any, questionKey, audioBlob, transcription);
                                }}
                                maxDuration={120000}
                                language={lang === 'kn' ? 'kn-IN' : lang === 'ta' ? 'ta-IN' : 'en-IN'}
                                studentId={resolvedStudentId}
                                assessmentId={assessmentRecordId}
                                assessmentType="inspiration"
                                assessmentTitle="My Inspiration"
                                initialSavedAt={audioResponsesMap[`${getCurrentVideoKey()}_${questionKey}`]?.savedAt ?? null}
                                initialAudioUrl={audioResponsesMap[`${getCurrentVideoKey()}_${questionKey}`]?.url ?? null}
                                initialTranscription={audioResponsesMap[`${getCurrentVideoKey()}_${questionKey}`]?.transcript ?? null}
                                initialConfidence={audioResponsesMap[`${getCurrentVideoKey()}_${questionKey}`]?.confidence ?? null}
                                disabled={readOnlyView || isCompleted}
                                onStreamTranscript={(text) => handleStreamTranscript(getCurrentVideoKey(), questionKey, text)}
                                compact={true}
                              />
                            ) : (
                              <div className="text-sm text-gray-500">Loading...</div>
                            )}
                          </div>
                        </div>
                        <Textarea
                          placeholder={helpText}
                          value={questionValue}
                          onChange={(e) => handleResponseChange(getCurrentVideoKey(), questionKey, e.target.value)}
                          readOnly={readOnlyView}
                          rows={4}
                          className={`text-base ${isAnswered ? `${colors.inputBorder} ${colors.inputFocus}` : 'border-red-300 focus:border-red-400 bg-red-50'}`}
                          required
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={previousVideo}
            disabled={currentVideoIndex === 0}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            {lang === 'kn' ? 'ಹಿಂದಿನ ವೀಡಿಯೊ' : lang === 'ta' ? 'முந்தைய வீடியோ' : t('previousVideo')}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => saveVideoProgress(currentVideoIndex)}
              disabled={!isVideoComplete(currentVideoIndex) || saving || readOnlyView}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                  {t('saving')}
                </>
              ) : isVideoSaved(currentVideoIndex) ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Progress
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Progress
                </>
              )}
            </Button>

            {currentVideoIndex < inspirationVideos.length ? (
              <Button
                variant="outline"
                onClick={nextVideo}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {lang === 'kn' ? 'ಮುಂದಿನ ವೀಡಿಯೊ' : lang === 'ta' ? 'அடுத்த வீடியோ' : t('nextVideo')}
              </Button>
            ) : (
              <Button
                onClick={submitAssessment}
                disabled={!canSubmit() || submitting || readOnlyView}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    {t('submitInspiration')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>


      </div>
      <KannadaKeyboard lang={lang} />
    </div >
  );
}
