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
  BookOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { safeObjectEntries, handleDatabaseError, validateApiResponse } from '@/utils/errorHandler';
import { AudioRecorder } from '@/components/ui/AudioRecorder';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { aiSummaryService } from '@/services/aiSummaryService';
import { summaryDatabaseService } from '@/services/summaryDatabaseService';

interface InspirationVideo {
  id: number;
  title: string;
  url: string;
  youtubeId: string;
}

interface AssessmentResponse {
  video1: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
    question7: string;
  };
  video2: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
    question7: string;
  };
  video3: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
    question7: string;
  };
  video4: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
    question7: string;
  };
  video5: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
    question7: string;
  };
  video6: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
    question7: string;
  };
}

// New interface for individual video progress
interface VideoProgress {
  videoId: number;
  responses: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
  };
  isComplete: boolean;
  savedAt?: string;
}

export default function MyInspirationAssessment() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [helpTexts, setHelpTexts] = useState({
    question1: 'Write about the moments or messages you enjoyed or that made you feel motivated.',
    question2: 'Mention the main lessons or ideas you got from watching or listening.',
    question3: 'Say what actions, habits, or thoughts from the video you want to try in your own life.',
    question4: 'Write how this video might change the way you think, feel, or behave.',
    question5: 'Write about the good qualities or values in the characters that you also have.',
    question6: 'Describe what you would do or feel if you were in the same situation.',
    question7: 'Write about the part of the video/audio that motivated or inspired you the most.'
  });

  // Load help texts from database
  useEffect(() => {
    const loadHelpTextsFromDatabase = async () => {
      try {
        console.log('🔄 Loading help texts from database...');
        const { data, error } = await supabase.rpc('get_inspiration_questions');
        
        if (error) {
          handleDatabaseError(error, 'InspirationAssessment - Help Texts');
          throw error;
        }
        
        if (validateApiResponse(data, 'InspirationAssessment - Help Texts')) {
          console.log('✅ Database help texts loaded:', data);
          const newHelpTexts: { [key: string]: string } = {};
          data.forEach((question: any, index: number) => {
            newHelpTexts[`question${index + 1}`] = question.help_text || '';
          });
          setHelpTexts(newHelpTexts);
        } else {
          console.log('⚠️ No help texts found in database, using fallback');
        }
      } catch (error) {
        handleDatabaseError(error, 'InspirationAssessment - Help Texts');
        console.log('🔄 Using hardcoded fallback help texts');
        // Keep default help texts if database fails
      }
    };
    
    loadHelpTextsFromDatabase();
  }, []);
  const [inspirationVideos, setInspirationVideos] = useState<InspirationVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse>({
    video1: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '', question7: '' },
    video2: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '', question7: '' },
    video3: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '', question7: '' },
    video4: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '', question7: '' },
    video5: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '', question7: '' },
    video6: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '', question7: '' }
  });
  const [audioResponses, setAudioResponses] = useState<{[key: string]: Blob | null}>({});
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

  const helpKey = (q: keyof typeof helpTexts) => `${getCurrentVideoKey()}_${q}`;
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));

  // Load videos from database
  const [defaultVideos, setDefaultVideos] = useState<InspirationVideo[]>([]);
  
  useEffect(() => {
    const loadVideosFromDatabase = async () => {
      try {
        console.log('🔄 Loading videos from database...');
        const { data, error } = await supabase.rpc('get_inspiration_videos');
        
        if (error) {
          handleDatabaseError(error, 'InspirationAssessment - Videos');
          throw error;
        }
        
        if (validateApiResponse(data, 'InspirationAssessment - Videos')) {
          console.log('✅ Database videos loaded:', data.length, 'videos');
          console.log('📊 Raw database data:', data);
          
          // Remove duplicates based on URL to prevent duplicate videos
          const uniqueVideos = data.filter((video: any, index: number, self: any[]) => 
            index === self.findIndex((v: any) => v.url === video.url)
          );
          
          console.log('🔍 After deduplication:', uniqueVideos.length, 'unique videos');
          
          const videos: InspirationVideo[] = uniqueVideos.map((video: any, index: number) => ({
            id: index + 1,
            title: video.title,
            url: video.url,
            youtubeId: video.youtube_id || extractYouTubeId(video.url)
          }));
          console.log('🔄 Setting default videos:', videos.length);
          setDefaultVideos(videos);
        } else {
          console.log('⚠️ No videos found in database, using fallback');
          throw new Error('No videos found');
        }
      } catch (error) {
        handleDatabaseError(error, 'InspirationAssessment - Videos');
        console.log('🔄 Using hardcoded fallback videos');
        // Fallback to hardcoded videos if database fails
        setDefaultVideos([
          {
            id: 1,
            title: "Inspirational Video 1",
            url: "https://youtu.be/U7-HlfpvQIA?si=_gakjQozpgbZC2aQ",
            youtubeId: "U7-HlfpvQIA"
          },
          {
            id: 2,
            title: "Inspirational Video 2", 
            url: "https://www.youtube.com/watch?v=xqb1hfgfcl8",
            youtubeId: "xqb1hfgfcl8"
          },
          {
            id: 3,
            title: "Inspirational Video 3",
            url: "https://youtu.be/z3PYJ9MfMH4", 
            youtubeId: "z3PYJ9MfMH4"
          },
          {
            id: 4,
            title: "Inspirational Video 4",
            url: "https://youtu.be/X9wViEY5tPQ?si=qDOuMSUatButKwZk",
            youtubeId: "X9wViEY5tPQ"
          },
          {
            id: 5,
            title: "Inspirational Video 5",
            url: "https://youtu.be/PP-kmxMY1ts",
            youtubeId: "PP-kmxMY1ts"
          },
          {
            id: 6,
            title: "Inspirational Video 6",
            url: "https://youtu.be/GPeeZ6viNgY?si=sg4hFF33p3cF4X25",
            youtubeId: "GPeeZ6viNgY"
          }
        ]);
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
          console.log('🔄 Setting inspiration videos:', defaultVideos.length);
          
          // Ensure we don't exceed 6 videos (safety check)
          const limitedVideos = defaultVideos.slice(0, 6);
          if (limitedVideos.length !== defaultVideos.length) {
            console.warn('⚠️ Video count limited to 6 videos (was:', defaultVideos.length, ')');
          }
          
          setInspirationVideos(limitedVideos);
      setLoading(false);
      
      // Initialize responses structure if not already done
      if (Object.keys(responses).length === 0) {
        const initialResponses: AssessmentResponse = {};
        defaultVideos.forEach((_, index) => {
          const videoKey = `video${index + 1}` as keyof AssessmentResponse;
          initialResponses[videoKey] = {
            question1: '',
            question2: '',
            question3: '',
            question4: '',
            question5: '',
            question6: '',
            question7: ''
          };
        });
        setResponses(initialResponses);
      }
      
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
          question7: ''
        },
        isComplete: false,
        savedAt: undefined
      }));
      setVideoProgress(initialProgress);
    }
  }, [defaultVideos]);

  // Ensure an assessment_responses row exists and capture its id for audio uploads
  useEffect(() => {
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
      if (!studentId) return;

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

        if (existing && !selectError) {
          setAssessmentRecordId(existing.id);
          return;
        }

        // Create a new placeholder record to attach audio responses
        const { data: inserted, error: insertError } = await supabase
          .from('assessment_responses')
          .insert({
            student_id: studentId,
            assessment_type: 'inspiration',
            assessment_title: 'My Inspiration',
            responses,
            completed_at: null,
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        setAssessmentRecordId(inserted.id);
      } catch (e) {
        console.error('Failed to ensure assessment record for audio responses:', e);
      }
    };

    ensureAssessmentRecord();
  }, [userProfile, loading, responses]);

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
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [responses, loading, isCompleted, userProfile]);


  const checkExistingResponse = useCallback(async () => {
    if (!userProfile) return;

    console.log('Loading existing response data...');
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
      console.log('No student ID found');
      setDataLoading(false);
      return;
    }

    try {
      console.log('Querying database with studentId:', studentId);
      console.log('Query parameters:', {
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

      console.log('Database query result:', { data, error });

      if (data && !error) {
        console.log('Found existing data:', data);
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
            question7: vr?.question7 ?? ''
          });
          const mergedResponses: AssessmentResponse = {
            video1: mergeVideo((savedResponses as any).video1 || {}),
            video2: mergeVideo((savedResponses as any).video2 || {}),
            video3: mergeVideo((savedResponses as any).video3 || {}),
            video4: mergeVideo((savedResponses as any).video4 || {}),
            video5: mergeVideo((savedResponses as any).video5 || {}),
            video6: mergeVideo((savedResponses as any).video6 || {})
          };
          console.log('Loading saved responses:', mergedResponses);
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
            console.log(`Video ${video.id}: hasContent=${hasContent}, isComplete=${isComplete}`);
            return {
              videoId: video.id,
              responses: videoResponses,
              isComplete,
              savedAt: hasContent ? data.updated_at : undefined
            };
          });
          setVideoProgress(updatedProgress);
          console.log('Updated video progress:', updatedProgress);
        }
      } else {
        console.log('No existing data found. Error:', error);
        
        // Let's also check if there are any records at all for this student
        const { data: allData, error: allError } = await supabase
          .from('assessment_responses')
          .select('*')
          .eq('student_id', studentId);
        
        console.log('All assessment responses for this student:', { allData, allError });
        
        // If there are multiple records, clean them up by keeping only the most recent one
        if (allData && allData.length > 1) {
          console.log(`Found ${allData.length} duplicate records, cleaning up...`);
          const sortedData = allData.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          const keepRecord = sortedData[0];
          const deleteIds = sortedData.slice(1).map(record => record.id);
          
          console.log('Keeping record:', keepRecord.id);
          console.log('Deleting records:', deleteIds);
          
          if (deleteIds.length > 0) {
            const { error: deleteError } = await supabase
              .from('assessment_responses')
              .delete()
              .in('id', deleteIds);
            
            if (deleteError) {
              console.error('Error cleaning up duplicate records:', deleteError);
            } else {
              console.log('Successfully cleaned up duplicate records');
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
                question7: vr?.question7 ?? ''
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
      console.log('Error loading existing response:', error);
    } finally {
      setDataLoading(false);
    }
  }, [userProfile, defaultVideos]);

  // Call checkExistingResponse when component mounts and userProfile is available
  useEffect(() => {
    if (userProfile && !loading) {
      console.log('Component mounted, loading existing data...');
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
          console.warn('audio_files fetch failed:', filesError);
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
        const nextResponses: AssessmentResponse = {
          video1: { ...responses.video1 },
          video2: { ...responses.video2 },
          video3: { ...responses.video3 },
          video4: { ...responses.video4 },
          video5: { ...responses.video5 },
          video6: { ...responses.video6 },
        };
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
        console.warn('Failed to load assessment audio summary:', e);
      }
    };

    loadAudioSummary();
  }, [resolvedStudentId, assessmentRecordId]);

  // Note: We removed the automatic sync between videoProgress and responses
  // to prevent conflicts. The responses state is now the single source of truth.

  const handleResponseChange = (videoKey: keyof AssessmentResponse, questionKey: string, value: string) => {
    // Update responses state
    const updatedResponses: AssessmentResponse = {
      video1: { ...responses.video1 },
      video2: { ...responses.video2 },
      video3: { ...responses.video3 },
      video4: { ...responses.video4 },
      video5: { ...responses.video5 },
      video6: { ...responses.video6 },
    };
    (updatedResponses as any)[videoKey][questionKey] = value;
    setResponses(updatedResponses);

    // Update video progress to match responses state
    const videoId = parseInt(videoKey.replace('video', ''));
    const videoResponses = updatedResponses[videoKey];
    const isComplete = Object.values(videoResponses).every(v => v.trim() !== '');
    
    setVideoProgress(prev => prev.map(video => {
      if (video.videoId === videoId) {
        return {
          ...video,
          responses: videoResponses,
          isComplete
        };
      }
      return video;
    }));
  };

  // Handle audio responses
  const handleAudioResponse = (videoKey: keyof AssessmentResponse, questionKey: string, audioBlob: Blob, transcription?: string) => {
    // Store the audio blob
    const audioKey = `${videoKey}_${questionKey}`;
    setAudioResponses(prev => ({
      ...prev,
      [audioKey]: audioBlob
    }));

    // Ensure the text box reflects what was recorded for validation/progress
    // Prefer transcription; if unavailable, add a clear placeholder line
    const fallbackText = 'Audio recorded — transcription unavailable.';
    handleResponseChange(videoKey, questionKey, (transcription && transcription.trim()) ? transcription : fallbackText);

    // Mark this question as answered via audio for completion rules
    const qId = `${videoKey}_${questionKey}`;
    setAudioAnswered(prev => ({ ...prev, [qId]: true }));
  };

  const getProgressPercentage = () => {
    const totalQuestions = 6 * 7; // 6 videos × 7 questions
    const answeredQuestions = Object.entries(responses).reduce((total, [videoKey, video]) => {
      if (!video || typeof video !== 'object') {
        return total;
      }
      
      const answered = Object.entries(video as Record<string, string>).filter(([q, v]) => {
        const qId = `${videoKey}_${q}`;
        return (v?.trim?.() ?? '') !== '' || !!audioAnswered[qId];
      }).length;
      return total + answered;
    }, 0);
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    const videoKeys: (keyof AssessmentResponse)[] = ['video1','video2','video3','video4','video5','video6'];
    return videoKeys.every((vk) => {
      const questions = responses[vk];
      
      if (!questions || typeof questions !== 'object') {
        return false;
      }
      
      const answered = Object.entries(questions).every(([q, v]) => {
        const qId = `${vk}_${q}`;
        return (v as string).trim() !== '' || !!audioAnswered[qId];
      });
      return answered;
    });
  };

  const isVideoComplete = (videoIndex: number) => {
    const videoKey = (`video${videoIndex + 1}`) as keyof AssessmentResponse;
    const questions = responses[videoKey];
    
    // Check if questions exist and is an object
    if (!questions || typeof questions !== 'object') {
      return false;
    }
    
    return Object.entries(questions).every(([q, v]) => {
      const qId = `${videoKey}_${q}`;
      return (v as string).trim() !== '' || !!audioAnswered[qId];
    });
  };

  const isVideoSaved = (videoIndex: number) => {
    const video = videoProgress.find(v => v.videoId === videoIndex + 1);
    // A video is considered saved if it has a savedAt timestamp AND has actual content
    return !!(video?.savedAt && video.isComplete);
  };

  const getCurrentVideoCompletionStatus = () => {
    const videoKey = getCurrentVideoKey();
    const totalQuestions = 7;
    const videoResponses = responses[videoKey];
    
    if (!videoResponses || typeof videoResponses !== 'object') {
      return { answered: 0, total: totalQuestions, isComplete: false };
    }
    
    const answeredQuestions = Object.entries(videoResponses).filter(([q, v]) => {
      const qId = `${videoKey}_${q}`;
      return (v as string).trim() !== '' || !!audioAnswered[qId];
    }).length;
    return { answered: answeredQuestions, total: totalQuestions, isComplete: answeredQuestions === totalQuestions };
  };

  const saveVideoProgress = async (videoIndex: number) => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    const video = videoProgress.find(v => v.videoId === videoIndex + 1);
    if (!video || !video.isComplete) {
      toast({
        title: "Cannot Save Yet",
        description: "Please complete all 7 questions for this video before saving.",
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
        title: "Error",
        description: "Student profile not found. Please contact your teacher or support.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      console.log('Getting existing responses from database...');
      console.log('Query parameters for existing data:', {
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

      console.log('Existing data query result:', { existingData, existingError });

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
        question7: vr?.question7 ?? ''
      });
      (existingResponses as any).video1 = ensureShape((existingResponses as any).video1 || {});
      (existingResponses as any).video2 = ensureShape((existingResponses as any).video2 || {});
      (existingResponses as any).video3 = ensureShape((existingResponses as any).video3 || {});
      (existingResponses as any).video4 = ensureShape((existingResponses as any).video4 || {});
      (existingResponses as any).video5 = ensureShape((existingResponses as any).video5 || {});
      (existingResponses as any).video6 = ensureShape((existingResponses as any).video6 || {});

      console.log('Existing responses from database:', existingResponses);

      // Build a fully-typed AssessmentResponse object
      const updatedResponses: AssessmentResponse = {
        video1: (videoKey === 'video1') ? (video.responses as any) : (existingResponses as any).video1,
        video2: (videoKey === 'video2') ? (video.responses as any) : (existingResponses as any).video2,
        video3: (videoKey === 'video3') ? (video.responses as any) : (existingResponses as any).video3,
        video4: (videoKey === 'video4') ? (video.responses as any) : (existingResponses as any).video4,
        video5: (videoKey === 'video5') ? (video.responses as any) : (existingResponses as any).video5,
        video6: (videoKey === 'video6') ? (video.responses as any) : (existingResponses as any).video6,
      };

      console.log('Saving video progress for video', videoIndex + 1);
      console.log('Video responses to save:', video.responses);
      console.log('Updated responses to save:', updatedResponses);

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

      console.log('Update result:', { updateData, updateError });

      let error = updateError;
      
      // If no rows were updated (no existing record), insert a new one
      if (!updateError && (!updateData || updateData.length === 0)) {
        console.log('No existing record found, inserting new one...');
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
        console.log('Insert result:', { insertError });
      }

      if (error) {
        console.error('Error saving to database:', error);
        throw error;
      }

      console.log('Successfully saved to database');

      // Update responses state with the merged data
      setResponses(updatedResponses);

      // Update video progress with saved timestamp and ensure responses are in sync
      setVideoProgress(prev => prev.map(v => 
        v.videoId === videoIndex + 1 
          ? { 
              ...v, 
              responses: video.responses,
              savedAt: new Date().toISOString() 
            }
          : v
      ));

      toast({
        title: "Video Progress Saved! 💾",
        description: `Your responses for Video ${videoIndex + 1} have been saved.`,
      });
    } catch (error) {
      console.error('Error saving video progress:', error);
      toast({
        title: "Error",
        description: "Failed to save video progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitAssessment = async () => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    if (!canSubmit()) {
      toast({
        title: "Cannot Submit Yet",
        description: "Please complete all 6 videos before submitting the assessment.",
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
        title: "Error",
        description: "Student profile not found. Please contact your teacher or support.",
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

      // Generate AI summary in the background
      try {
        if (aiSummaryService.isConfigured()) {
          console.log('🤖 Generating AI summary for assessment:', assessmentData.id);
          const summaryResult = await aiSummaryService.generateInspirationSummary(responses);

          if (summaryResult.success && summaryResult.summary) {
            // Save summary to database
            const saveResult = await summaryDatabaseService.createAISummary(
              assessmentData.id,
              summaryResult.summary,
              userProfile.id
            );

            if (saveResult.success) {
              console.log('✅ AI summary saved successfully:', saveResult.summaryId);
              toast({
                title: "Summary Generated! 📝",
                description: "Your teacher will review your reflection summary.",
              });
            } else {
              console.error('Failed to save summary:', saveResult.error);
              toast({
                title: "Summary Generation Issue",
                description: "Your assessment is saved, but summary generation needs attention.",
                variant: "destructive",
              });
            }
          } else {
            console.error('Failed to generate summary:', summaryResult.error);
            toast({
              title: "Summary Generation Issue",
              description: "Your assessment is saved. Summary will be generated later.",
              variant: "destructive",
            });
          }
        } else {
          console.warn('⚠️ Gemini API not configured, skipping summary generation');
          toast({
            title: "Assessment Saved! ✨",
            description: "Your reflections have been captured successfully!",
          });
        }
      } catch (summaryError) {
        console.error('Error in summary generation:', summaryError);
        // Don't fail the entire submission if summary generation fails
        toast({
          title: "Assessment Saved! ✨",
          description: "Your reflections have been captured successfully!",
        });
      }

      setIsCompleted(true);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextVideo = () => {
    if (currentVideoIndex < inspirationVideos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const previousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const getCurrentVideoKey = () => {
    return `video${currentVideoIndex + 1}` as keyof AssessmentResponse;
  };

  const getCurrentVideoResponses = () => {
    return responses[getCurrentVideoKey()];
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            {loading ? 'Loading your inspiration assessment...' : 'Loading your saved progress...'}
          </p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-0 shadow-lg">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <Lightbulb className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-blue-800">Inspiration Assessment Completed! ✨</CardTitle>
              <CardDescription className="text-blue-600">
                You've successfully reflected on all inspirational videos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for completing the inspiration assessment! Your reflections on the inspirational videos have been saved and your teacher can now review them to help guide your career journey.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCompleted(false)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    Review My Responses
                  </Button>
                  <Button 
                    onClick={() => navigate('/student')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Back to Dashboard
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/student')}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">✨ My Inspiration</h1>
            <p className="text-blue-600 text-lg">
              Each of us is inspired by different things. What inspires us often reflects the qualities and values
              that we hold dear. By exploring these inspirations, we gain insight into the kind of person we
              aspire to become and the values we want to uphold in our future careers.
            </p>
          </div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Your Progress</h2>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{Math.round(getProgressPercentage())}% Complete</Badge>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{videoProgress?.filter(v => v.savedAt && v.isComplete).length || 0} saved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{videoProgress?.filter(v => v.isComplete).length || 0} complete</span>
                  </div>
                </div>
              </div>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Video {currentVideoIndex + 1} of {inspirationVideos.length}</span>
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
          </CardContent>
        </Card>

        {/* Video Navigation */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl text-blue-800">Video Navigation</CardTitle>
            <CardDescription className="text-blue-600">
              Click on any video to watch and answer questions - no specific order required!
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
                  Video {index + 1}
                  {isVideoComplete(index) && (
                    <CheckCircle className="w-3 h-3 ml-1 text-green-500" />
                  )}
                  {isVideoSaved(index) && (
                    <Save className="w-3 h-3 ml-1 text-blue-500" />
                  )}
                </Button>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <Button
                onClick={previousVideo}
                disabled={currentVideoIndex === 0}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                ← Previous Video
              </Button>
              <Button
                onClick={nextVideo}
                disabled={currentVideoIndex === inspirationVideos.length - 1}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Next Video →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Video Section */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl text-blue-800">
              Video {currentVideoIndex + 1}: {currentVideo.title}
            </CardTitle>
            <CardDescription className="text-blue-600">
              Watch this inspirational video and then answer the questions below
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Video Player */}
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
                  Open in YouTube <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Questions */}
            <TooltipProvider>
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Reflection Questions</h3>
                <div className="text-sm text-gray-600">
                  {(() => {
                    const status = getCurrentVideoCompletionStatus();
                    return (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        status.isComplete 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {status.answered}/{status.total} questions answered
                      </span>
                    );
                  })()}
                </div>
              </div>
              
              {/* Recording Instructions */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-lg">🎙️</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 mb-2">Audio Recording Instructions</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>You may either type or record your answer.</strong> If recording, speak clearly for up to 2 minutes. 
                      Recording will start when you click the 🎙️ Record button. Your answer will be saved automatically.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-blue-600">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        Speak clearly in your own words
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        You have 2 minutes per question
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        Recording is saved automatically
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question 1 */}
              <div className={`border-l-4 pl-6 ${getCurrentVideoResponses().question1.trim() ? 'border-blue-400' : 'border-red-400'}`}>
                <div className="flex items-start justify-between mb-3">
                  <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-500" />
                    1. Which parts of this video/audio did you like most / find most inspirational?
                    <span className="text-red-500 text-sm">*</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Help"
                          className="ml-2 text-blue-600 hover:text-blue-700"
                          onClick={() => toggleHelp(helpKey('question1'))}
                        >
                          💬
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{helpTexts.question1}</TooltipContent>
                    </Tooltip>
                  </label>
                  {helpOpen[helpKey('question1')] && (
                    <div className="mt-2 mb-2 p-3 rounded border bg-blue-50 border-blue-200 text-sm text-blue-800">
                      {helpTexts.question1}
                    </div>
                  )}
                  <div className="ml-4 flex-shrink-0">
                  {(resolvedStudentId && assessmentRecordId) ? (
                      <AudioRecorder
                        key={`${getCurrentVideoKey()}_question1`}
                        questionId={`${getCurrentVideoKey()}_question1`}
                        onRecordingComplete={(audioBlob, transcription) => {
                          handleAudioResponse(getCurrentVideoKey(), 'question1', audioBlob, transcription);
                        }}
                        maxDuration={120000} // 2 minutes
                        language="en-IN"
                      studentId={resolvedStudentId ?? userProfile.studentProfile.id}
                      assessmentId={assessmentRecordId ?? 'inspiration-assessment'}
                        assessmentType="inspiration"
                      assessmentTitle="My Inspiration"
                        initialSavedAt={audioResponsesMap[`${getCurrentVideoKey()}_question1`]?.savedAt ?? null}
                        initialAudioUrl={audioResponsesMap[`${getCurrentVideoKey()}_question1`]?.url ?? null}
                        initialTranscription={audioResponsesMap[`${getCurrentVideoKey()}_question1`]?.transcript ?? null}
                        initialConfidence={audioResponsesMap[`${getCurrentVideoKey()}_question1`]?.confidence ?? null}
                        compact={true}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">Loading audio recorder...</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {transcribedPrefill[`${getCurrentVideoKey()}_question1`] && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Transcribed</span>
                  )}
                </div>
                <Textarea
                  placeholder={helpTexts.question1}
                  value={getCurrentVideoResponses().question1}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question1', e.target.value)}
                  rows={4}
                  className={`text-base ${getCurrentVideoResponses().question1.trim() 
                    ? 'border-blue-200 focus:border-blue-400' 
                    : 'border-red-300 focus:border-red-400 bg-red-50'
                  }`}
                  required
                />
                {!getCurrentVideoResponses().question1.trim() && (
                  <p className="text-red-500 text-sm mt-1">This question is required</p>
                )}
              </div>

              {/* Question 2 */}
              <div className={`border-l-4 pl-6 ${getCurrentVideoResponses().question2.trim() ? 'border-green-400' : 'border-red-400'}`}>
                <div className="flex items-start justify-between mb-3">
                  <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-green-500" />
                    2. What can you learn from this video/audio?
                    <span className="text-red-500 text-sm">*</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Help"
                          className="ml-2 text-green-600 hover:text-green-700"
                          onClick={() => toggleHelp(helpKey('question2'))}
                        >
                          💬
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{helpTexts.question2}</TooltipContent>
                    </Tooltip>
                  </label>
                  {helpOpen[helpKey('question2')] && (
                    <div className="mt-2 mb-2 p-3 rounded border bg-green-50 border-green-200 text-sm text-green-800">
                      {helpTexts.question2}
                    </div>
                  )}
                  <div className="ml-4 flex-shrink-0">
                  {(resolvedStudentId && assessmentRecordId) ? (
                      <AudioRecorder
                        key={`${getCurrentVideoKey()}_question2`}
                        questionId={`${getCurrentVideoKey()}_question2`}
                        onRecordingComplete={(audioBlob, transcription) => {
                          handleAudioResponse(getCurrentVideoKey(), 'question2', audioBlob, transcription);
                        }}
                        maxDuration={120000} // 2 minutes
                        language="en-IN"
                        studentId={resolvedStudentId ?? userProfile.studentProfile.id}
                        assessmentId={assessmentRecordId ?? 'inspiration-assessment'}
                        assessmentType="inspiration"
                        assessmentTitle="My Inspiration"
                        initialSavedAt={audioResponsesMap[`${getCurrentVideoKey()}_question2`]?.savedAt ?? null}
                        initialAudioUrl={audioResponsesMap[`${getCurrentVideoKey()}_question2`]?.url ?? null}
                        initialTranscription={audioResponsesMap[`${getCurrentVideoKey()}_question2`]?.transcript ?? null}
                        initialConfidence={audioResponsesMap[`${getCurrentVideoKey()}_question2`]?.confidence ?? null}
                        compact={true}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">Loading...</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {transcribedPrefill[`${getCurrentVideoKey()}_question2`] && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Transcribed</span>
                  )}
                </div>
                <Textarea
                  placeholder={helpTexts.question2}
                  value={getCurrentVideoResponses().question2}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question2', e.target.value)}
                  rows={4}
                  className={`text-base ${getCurrentVideoResponses().question2.trim() 
                    ? 'border-green-200 focus:border-green-400' 
                    : 'border-red-300 focus:border-red-400 bg-red-50'
                  }`}
                  required
                />
                {!getCurrentVideoResponses().question2.trim() && (
                  <p className="text-red-500 text-sm mt-1">This question is required</p>
                )}
              </div>

              {/* Question 3 */}
              <div className={`border-l-4 pl-6 ${getCurrentVideoResponses().question3.trim() ? 'border-purple-400' : 'border-red-400'}`}>
                <div className="flex items-start justify-between mb-3">
                  <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-500" />
                    3. Which parts of this video/audio would you want to adopt in your personal life?
                    <span className="text-red-500 text-sm">*</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Help"
                          className="ml-2 text-purple-600 hover:text-purple-700"
                          onClick={() => toggleHelp(helpKey('question3'))}
                        >
                          💬
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{helpTexts.question3}</TooltipContent>
                    </Tooltip>
                  </label>
                  {helpOpen[helpKey('question3')] && (
                    <div className="mt-2 mb-2 p-3 rounded border bg-purple-50 border-purple-200 text-sm text-purple-800">
                      {helpTexts.question3}
                    </div>
                  )}
                  <div className="ml-4 flex-shrink-0">
                  {(resolvedStudentId && assessmentRecordId) ? (
                      <AudioRecorder
                        key={`${getCurrentVideoKey()}_question3`}
                        questionId={`${getCurrentVideoKey()}_question3`}
                        onRecordingComplete={(audioBlob, transcription) => {
                          handleAudioResponse(getCurrentVideoKey(), 'question3', audioBlob, transcription);
                        }}
                        maxDuration={120000} // 2 minutes
                        language="en-IN"
                        studentId={resolvedStudentId ?? userProfile.studentProfile.id}
                        assessmentId={assessmentRecordId ?? 'inspiration-assessment'}
                        assessmentType="inspiration"
                        assessmentTitle="My Inspiration"
                        initialSavedAt={audioResponsesMap[`${getCurrentVideoKey()}_question3`]?.savedAt ?? null}
                        initialAudioUrl={audioResponsesMap[`${getCurrentVideoKey()}_question3`]?.url ?? null}
                        initialTranscription={audioResponsesMap[`${getCurrentVideoKey()}_question3`]?.transcript ?? null}
                        initialConfidence={audioResponsesMap[`${getCurrentVideoKey()}_question3`]?.confidence ?? null}
                        compact={true}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">Loading...</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {transcribedPrefill[`${getCurrentVideoKey()}_question3`] && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Transcribed</span>
                  )}
                </div>
                <Textarea
                  placeholder={helpTexts.question3}
                  value={getCurrentVideoResponses().question3}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question3', e.target.value)}
                  rows={4}
                  className={`text-base ${getCurrentVideoResponses().question3.trim() 
                    ? 'border-purple-200 focus:border-purple-400' 
                    : 'border-red-300 focus:border-red-400 bg-red-50'
                  }`}
                  required
                />
                {!getCurrentVideoResponses().question3.trim() && (
                  <p className="text-red-500 text-sm mt-1">This question is required</p>
                )}
              </div>

              {/* Question 4 */}
              <div className={`border-l-4 pl-6 ${getCurrentVideoResponses().question4.trim() ? 'border-orange-400' : 'border-red-400'}`}>
                <div className="flex items-start justify-between mb-3">
                  <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-500" />
                    4. What changes will the contents of this video/audio bring in your life?
                    <span className="text-red-500 text-sm">*</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Help"
                          className="ml-2 text-orange-600 hover:text-orange-700"
                          onClick={() => toggleHelp(helpKey('question4'))}
                        >
                          💬
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{helpTexts.question4}</TooltipContent>
                    </Tooltip>
                  </label>
                  {helpOpen[helpKey('question4')] && (
                    <div className="mt-2 mb-2 p-3 rounded border bg-orange-50 border-orange-200 text-sm text-orange-800">
                      {helpTexts.question4}
                    </div>
                  )}
                  <div className="ml-4 flex-shrink-0">
                  {(resolvedStudentId && assessmentRecordId) ? (
                      <AudioRecorder
                        key={`${getCurrentVideoKey()}_question4`}
                        questionId={`${getCurrentVideoKey()}_question4`}
                        onRecordingComplete={(audioBlob, transcription) => {
                          handleAudioResponse(getCurrentVideoKey(), 'question4', audioBlob, transcription);
                        }}
                        maxDuration={120000} // 2 minutes
                        language="en-IN"
                        studentId={resolvedStudentId ?? userProfile.studentProfile.id}
                        assessmentId={assessmentRecordId ?? 'inspiration-assessment'}
                        assessmentType="inspiration"
                        assessmentTitle="My Inspiration"
                        initialSavedAt={audioResponsesMap[`${getCurrentVideoKey()}_question4`]?.savedAt ?? null}
                        initialAudioUrl={audioResponsesMap[`${getCurrentVideoKey()}_question4`]?.url ?? null}
                        initialTranscription={audioResponsesMap[`${getCurrentVideoKey()}_question4`]?.transcript ?? null}
                        initialConfidence={audioResponsesMap[`${getCurrentVideoKey()}_question4`]?.confidence ?? null}
                        compact={true}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">Loading...</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {transcribedPrefill[`${getCurrentVideoKey()}_question4`] && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Transcribed</span>
                  )}
                </div>
                <Textarea
                  placeholder={helpTexts.question4}
                  value={getCurrentVideoResponses().question4}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question4', e.target.value)}
                  rows={4}
                  className={`text-base ${getCurrentVideoResponses().question4.trim() 
                    ? 'border-orange-200 focus:border-orange-400' 
                    : 'border-red-300 focus:border-red-400 bg-red-50'
                  }`}
                  required
                />
                {!getCurrentVideoResponses().question4.trim() && (
                  <p className="text-red-500 text-sm mt-1">This question is required</p>
                )}
              </div>

              {/* Question 5 */}
              <div className={`border-l-4 pl-6 ${getCurrentVideoResponses().question5.trim() ? 'border-pink-400' : 'border-red-400'}`}>
                <div className="flex items-start justify-between mb-3">
                  <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-pink-500" />
                    5. Which qualities of the characters in this video/audio do you identify in yourself?
                    <span className="text-red-500 text-sm">*</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Help"
                          className="ml-2 text-pink-600 hover:text-pink-700"
                          onClick={() => toggleHelp(helpKey('question5'))}
                        >
                          💬
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{helpTexts.question5}</TooltipContent>
                    </Tooltip>
                  </label>
                  {helpOpen[helpKey('question5')] && (
                    <div className="mt-2 mb-2 p-3 rounded border bg-pink-50 border-pink-200 text-sm text-pink-800">
                      {helpTexts.question5}
                    </div>
                  )}
                  <div className="ml-4 flex-shrink-0">
                  {(resolvedStudentId && assessmentRecordId) ? (
                      <AudioRecorder
                        key={`${getCurrentVideoKey()}_question5`}
                        questionId={`${getCurrentVideoKey()}_question5`}
                        onRecordingComplete={(audioBlob, transcription) => {
                          handleAudioResponse(getCurrentVideoKey(), 'question5', audioBlob, transcription);
                        }}
                        maxDuration={120000} // 2 minutes
                        language="en-IN"
                        studentId={resolvedStudentId ?? userProfile.studentProfile.id}
                        assessmentId={assessmentRecordId ?? 'inspiration-assessment'}
                        assessmentType="inspiration"
                        assessmentTitle="My Inspiration"
                        initialSavedAt={audioResponsesMap[`${getCurrentVideoKey()}_question5`]?.savedAt ?? null}
                        initialAudioUrl={audioResponsesMap[`${getCurrentVideoKey()}_question5`]?.url ?? null}
                        initialTranscription={audioResponsesMap[`${getCurrentVideoKey()}_question5`]?.transcript ?? null}
                        initialConfidence={audioResponsesMap[`${getCurrentVideoKey()}_question5`]?.confidence ?? null}
                        compact={true}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">Loading...</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {transcribedPrefill[`${getCurrentVideoKey()}_question5`] && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Transcribed</span>
                  )}
                </div>
                <Textarea
                  placeholder={helpTexts.question5}
                  value={getCurrentVideoResponses().question5}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question5', e.target.value)}
                  rows={4}
                  className={`text-base ${getCurrentVideoResponses().question5.trim() 
                    ? 'border-pink-200 focus:border-pink-400' 
                    : 'border-red-300 focus:border-red-400 bg-red-50'
                  }`}
                  required
                />
                {!getCurrentVideoResponses().question5.trim() && (
                  <p className="text-red-500 text-sm mt-1">This question is required</p>
                )}
              </div>

              {/* Question 6 */}
              <div className={`border-l-4 pl-6 ${getCurrentVideoResponses().question6.trim() ? 'border-indigo-400' : 'border-red-400'}`}>
                <div className="flex items-start justify-between mb-3">
                  <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Play className="w-5 h-5 text-indigo-500" />
                    6. What would your reaction be if you were in the situation depicted in the video/audio?
                    <span className="text-red-500 text-sm">*</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Help"
                          className="ml-2 text-indigo-600 hover:text-indigo-700"
                          onClick={() => toggleHelp(helpKey('question6'))}
                        >
                          💬
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{helpTexts.question6}</TooltipContent>
                    </Tooltip>
                  </label>
                  {helpOpen[helpKey('question6')] && (
                    <div className="mt-2 mb-2 p-3 rounded border bg-indigo-50 border-indigo-200 text-sm text-indigo-800">
                      {helpTexts.question6}
                    </div>
                  )}
                  <div className="ml-4 flex-shrink-0">
                  {(resolvedStudentId && assessmentRecordId) ? (
                      <AudioRecorder
                        key={`${getCurrentVideoKey()}_question6`}
                        questionId={`${getCurrentVideoKey()}_question6`}
                        onRecordingComplete={(audioBlob, transcription) => {
                          handleAudioResponse(getCurrentVideoKey(), 'question6', audioBlob, transcription);
                        }}
                        maxDuration={120000} // 2 minutes
                        language="en-IN"
                        studentId={resolvedStudentId ?? userProfile.studentProfile.id}
                        assessmentId={assessmentRecordId ?? 'inspiration-assessment'}
                        assessmentType="inspiration"
                        assessmentTitle="My Inspiration"
                        initialSavedAt={audioResponsesMap[`${getCurrentVideoKey()}_question6`]?.savedAt ?? null}
                        initialAudioUrl={audioResponsesMap[`${getCurrentVideoKey()}_question6`]?.url ?? null}
                        initialTranscription={audioResponsesMap[`${getCurrentVideoKey()}_question6`]?.transcript ?? null}
                        initialConfidence={audioResponsesMap[`${getCurrentVideoKey()}_question6`]?.confidence ?? null}
                        compact={true}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">Loading...</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {transcribedPrefill[`${getCurrentVideoKey()}_question6`] && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Transcribed</span>
                  )}
                </div>
                <Textarea
                  placeholder={helpTexts.question6}
                  value={getCurrentVideoResponses().question6}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question6', e.target.value)}
                  rows={4}
                  className={`text-base ${getCurrentVideoResponses().question6.trim() 
                    ? 'border-indigo-200 focus:border-indigo-400' 
                    : 'border-red-300 focus:border-red-400 bg-red-50'
                  }`}
                  required
                />
                {!getCurrentVideoResponses().question6.trim() && (
                  <p className="text-red-500 text-sm mt-1">This question is required</p>
                )}
              </div>

              {/* Question 7 */}
              <div className={`border-l-4 pl-6 ${getCurrentVideoResponses().question7?.trim() ? 'border-teal-400' : 'border-red-400'}`}>
                <div className="flex items-start justify-between mb-3">
                  <label className="block text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-500" />
                    7. Write about the situation in this video/audio which you have seen, that inspired you.
                    <span className="text-red-500 text-sm">*</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Help"
                          className="ml-2 text-teal-600 hover:text-teal-700"
                          onClick={() => toggleHelp(helpKey('question7'))}
                        >
                          💬
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{helpTexts.question7}</TooltipContent>
                    </Tooltip>
                  </label>
                  {helpOpen[helpKey('question7')] && (
                    <div className="mt-2 mb-2 p-3 rounded border bg-teal-50 border-teal-200 text-sm text-teal-800">
                      {helpTexts.question7}
                    </div>
                  )}
                  <div className="ml-4 flex-shrink-0">
                  {(resolvedStudentId && assessmentRecordId) ? (
                      <AudioRecorder
                        key={`${getCurrentVideoKey()}_question7`}
                        questionId={`${getCurrentVideoKey()}_question7`}
                        onRecordingComplete={(audioBlob, transcription) => {
                          handleAudioResponse(getCurrentVideoKey(), 'question7', audioBlob, transcription);
                        }}
                        maxDuration={120000} // 2 minutes
                        language="en-IN"
                        studentId={resolvedStudentId ?? userProfile.studentProfile.id}
                        assessmentId={assessmentRecordId ?? 'inspiration-assessment'}
                        assessmentType="inspiration"
                        assessmentTitle="My Inspiration"
                        initialSavedAt={audioResponsesMap[`${getCurrentVideoKey()}_question7`]?.savedAt ?? null}
                        initialAudioUrl={audioResponsesMap[`${getCurrentVideoKey()}_question7`]?.url ?? null}
                        initialTranscription={audioResponsesMap[`${getCurrentVideoKey()}_question7`]?.transcript ?? null}
                        initialConfidence={audioResponsesMap[`${getCurrentVideoKey()}_question7`]?.confidence ?? null}
                        compact={true}
                      />
                    ) : (
                      <div className="text-sm text-gray-500">Loading...</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {transcribedPrefill[`${getCurrentVideoKey()}_question7`] && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Transcribed</span>
                  )}
                </div>
                <Textarea
                  placeholder="Describe the situation from the video/audio that inspired you..."
                  value={getCurrentVideoResponses().question7 || ''}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question7', e.target.value)}
                  rows={4}
                  className={`text-base ${getCurrentVideoResponses().question7?.trim() 
                    ? 'border-teal-200 focus:border-teal-400' 
                    : 'border-red-300 focus:border-red-400 bg-red-50'
                  }`}
                  required
                />
                {!getCurrentVideoResponses().question7?.trim() && (
                  <p className="text-red-500 text-sm mt-1">This question is required</p>
                )}
              </div>
            </div>
            </TooltipProvider>

            {/* Save Progress Button for Current Video */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {isVideoSaved(currentVideoIndex) ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Video {currentVideoIndex + 1} saved</span>
                    </div>
                  ) : isVideoComplete(currentVideoIndex) ? (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Video {currentVideoIndex + 1} complete - Ready to save</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span>Complete all questions to save this video</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => saveVideoProgress(currentVideoIndex)}
                  disabled={!isVideoComplete(currentVideoIndex) || saving || isVideoSaved(currentVideoIndex)}
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                      Saving...
                    </>
                  ) : isVideoSaved(currentVideoIndex) ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Video Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Video Progress
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={submitAssessment}
            disabled={!canSubmit() || submitting}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Submitting...
              </>
            ) : (
              <>
                <Lightbulb className="w-5 h-5 mr-3" />
                Submit Inspiration Assessment
              </>
            )}
          </Button>
        </div>

        {/* Video List */}
        <div className="mt-12">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="text-xl text-gray-800">All Inspirational Videos</CardTitle>
              <CardDescription className="text-gray-600">
                Complete all 6 videos to finish your inspiration assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inspirationVideos.map((video, index) => (
                  <div 
                    key={video.id}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      currentVideoIndex === index 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                    onClick={() => setCurrentVideoIndex(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentVideoIndex === index 
                          ? 'bg-blue-500 text-white' 
                          : isVideoSaved(index)
                          ? 'bg-green-500 text-white'
                          : isVideoComplete(index)
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800">Video {index + 1}</h4>
                          {isVideoSaved(index) && (
                            <div className="flex items-center gap-1 text-green-600 text-xs">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span>Saved</span>
                            </div>
                          )}
                          {!isVideoSaved(index) && isVideoComplete(index) && (
                            <div className="flex items-center gap-1 text-yellow-600 text-xs">
                              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                              <span>Complete</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{video.url}</p>
                      </div>
                      <Video className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
