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
  BookOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { AudioRecorder } from '@/components/ui/AudioRecorder';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssessmentService, MediaSource, AssessmentQuestion } from '@/services/assessmentService';
import { aiSummaryService } from '@/services/aiSummaryService';
import { summaryDatabaseService } from '@/services/summaryDatabaseService';

interface InspirationVideo {
  id: string;
  title: string;
  url: string;
  youtubeId: string;
}

interface AssessmentResponse {
  [key: string]: {
    [key: string]: string;
  };
}

interface VideoProgress {
  videoId: string;
  responses: { [key: string]: string };
  isComplete: boolean;
  savedAt?: string;
}

export default function MyInspirationAssessmentDB() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { lang } = useLang();
  const [inspirationVideos, setInspirationVideos] = useState<InspirationVideo[]>([]);
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [helpTexts, setHelpTexts] = useState<{ [key: string]: string }>({});
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
  const [searchParams] = useSearchParams();
  const readOnlyView = ['1', 'true'].includes((searchParams.get('readonly') || searchParams.get('view') || '').toLowerCase());
  const [assessmentRecordId, setAssessmentRecordId] = useState<string | null>(null);
  const [resolvedStudentId, setResolvedStudentId] = useState<string | null>(null);
  const [audioResponsesMap, setAudioResponsesMap] = useState<Record<string, any>>({});
  const [audioAnswered, setAudioAnswered] = useState<Record<string, boolean>>({});
  const [transcribedPrefill, setTranscribedPrefill] = useState<Record<string, boolean>>({});

  const helpKey = (q: string) => `${getCurrentVideoKey()}_${q}`;
  const toggleHelp = (k: string) => setHelpOpen(prev => ({ ...prev, [k]: !prev[k] }));

  // Load assessment data from database
  useEffect(() => {
    const loadAssessmentData = async () => {
      try {
        setDataLoading(true);
        const data = await AssessmentService.getInspirationAssessmentData();

        if (data) {
          // Convert media sources to inspiration videos
          const videos: InspirationVideo[] = data.videos.map((video, index) => ({
            id: video.id,
            title: video.title,
            url: video.url,
            youtubeId: extractYouTubeId(video.url)
          }));

          setInspirationVideos(videos);
          setAssessmentQuestions(data.questions);
          setHelpTexts(data.helpTexts);

          // Initialize responses structure
          const initialResponses: AssessmentResponse = {};
          videos.forEach((_, index) => {
            const videoKey = `video${index + 1}`;
            initialResponses[videoKey] = {};
            data.questions.forEach((_, qIndex) => {
              initialResponses[videoKey][`question${qIndex + 1}`] = '';
            });
          });
          setResponses(initialResponses);

          // Initialize video progress
          const initialProgress = videos.map(video => ({
            videoId: video.id,
            responses: {},
            isComplete: false,
            savedAt: undefined
          }));
          setVideoProgress(initialProgress);
        }
      } catch (error) {
        logger.error('Error loading assessment data:', error);
        toast({
          title: "Error",
          description: "Failed to load assessment data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setDataLoading(false);
        setLoading(false);
      }
    };

    loadAssessmentData();
  }, []);

  // Extract YouTube ID from URL
  const extractYouTubeId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const getCurrentVideoKey = () => `video${currentVideoIndex + 1}`;
  const getCurrentVideo = () => inspirationVideos[currentVideoIndex];

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
        logger.error('Failed to ensure assessment record for audio responses:', e);
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
      } catch { }
    }, 800);
    return () => clearTimeout(t);
  }, [responses, loading, isCompleted, userProfile]);

  // Check for existing responses on load
  useEffect(() => {
    const checkExistingResponse = async () => {
      if (!userProfile || loading) return;

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
        if (!studentId) return;

        const { data: existing } = await supabase
          .from('assessment_responses')
          .select('responses, completed_at')
          .eq('student_id', studentId)
          .eq('assessment_type', 'inspiration')
          .eq('assessment_title', 'My Inspiration')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          if (existing.responses) {
            setResponses(existing.responses);
          }
          if (existing.completed_at) {
            setIsCompleted(true);
          }
        }
      } catch (error) {
        logger.error('Error checking existing response:', error);
      }
    };

    checkExistingResponse();
  }, [userProfile, loading]);

  const handleResponseChange = (videoKey: string, questionKey: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [videoKey]: {
        ...prev[videoKey],
        [questionKey]: value
      }
    }));
  };

  const handleAudioResponse = useCallback(async (questionKey: string, audioBlob: Blob | null) => {
    if (!audioBlob || !assessmentRecordId) return;

    const audioKey = `${getCurrentVideoKey()}_${questionKey}`;
    setAudioResponses(prev => ({ ...prev, [audioKey]: audioBlob }));

    try {
      const fileName = `${assessmentRecordId}_${audioKey}_${Date.now()}.webm`;
      const filePath = `audio-responses/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('audio-responses')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio-responses')
        .getPublicUrl(filePath);

      // Store audio response metadata
      const { error: insertError } = await supabase
        .from('audio_files')
        .upsert({
          student_id: resolvedStudentId,
          assessment_id: assessmentRecordId,
          question_id: audioKey,
          file_path: filePath,
          file_url: urlData.publicUrl,
          file_size: audioBlob.size,
          duration_ms: 0, // Will be updated after transcription
          mime_type: 'audio/webm',
          upload_status: 'completed'
        });

      if (insertError) throw insertError;

      setAudioAnswered(prev => ({ ...prev, [audioKey]: true }));

      toast({
        title: "Audio Saved",
        description: "Your audio response has been saved successfully.",
      });
    } catch (error) {
      logger.error('Error saving audio response:', error);
      toast({
        title: "Error",
        description: "Failed to save audio response. Please try again.",
        variant: "destructive",
      });
    }
  }, [assessmentRecordId, resolvedStudentId, getCurrentVideoKey]);

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

      // Save assessment responses
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'inspiration',
          assessment_title: 'My Inspiration',
          responses,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Show success message for assessment submission
      toast({
        title: "Assessment Completed! âœ¨",
        description: "Generating your reflection summary...",
      });

      // Generate AI summary in the background
      try {
        if (aiSummaryService.isConfigured()) {
          const summaryResult = await aiSummaryService.generateInspirationSummary(responses, lang);

          if (summaryResult.success && summaryResult.summary) {
            // Save summary to database
            const saveResult = await summaryDatabaseService.createAISummary(
              assessmentData.id,
              summaryResult.summary,
              userProfile.id
            );

            if (saveResult.success) {
              toast({
                title:
                  lang === 'kn'
                    ? 'à²¸à²¾à²°à²¾à²‚à²¶ à²¸à²¿à²¦à³à²§à²µà²¾à²—à²¿à²¦à³†! ðŸ“'
                    : lang === 'ta'
                      ? 'à®šà¯à®°à¯à®•à¯à®•à®®à¯ à®‰à®°à¯à®µà®¾à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯! ðŸ“'
                      : 'Summary Generated! ðŸ“',
                description:
                  lang === 'kn'
                    ? 'à²¨à³€à²µà³ à²¬à²°à³†à²¦ à²šà²¿à²‚à²¤à²¨à³†à²—à²³ à²¸à²¾à²°à²¾à²‚à²¶à²µà²¨à³à²¨à³ à²¨à²¿à²®à³à²® à²¶à²¿à²•à³à²·à²•à²°à³ à²ªà²°à²¿à²¶à³€à²²à²¿à²¸à²²à²¿à²¦à³à²¦à²¾à²°à³†.'
                    : lang === 'ta'
                      ? 'à®¨à¯€à®™à¯à®•à®³à¯ à®Žà®´à¯à®¤à®¿à®¯ à®šà®¿à®¨à¯à®¤à®©à¯ˆà®šà¯ à®šà¯à®°à¯à®•à¯à®•à®¤à¯à®¤à¯ˆ à®‰à®™à¯à®•à®³à¯ à®†à®šà®¿à®°à®¿à®¯à®¾à¯ à®µà®¿à®°à¯ˆà®µà®¿à®²à¯ à®ªà®¾à®°à¯à®µà¯ˆà®¯à®¿à®Ÿà¯à®µà®¾à®°à¯.'
                      : 'Your teacher will review your reflection summary.',
              });
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
          logger.warn('Gemini API not configured, skipping summary generation');
        }
      } catch (summaryError) {
        logger.error('Error in summary generation:', summaryError);
        // Don't fail the entire submission if summary generation fails
      }

      setIsCompleted(true);
    } catch (error) {
      logger.error('Error submitting assessment:', error);
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
      setCurrentVideoIndex(prev => prev + 1);
    }
  };

  const prevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
    }
  };

  const isCurrentVideoComplete = () => {
    const videoKey = getCurrentVideoKey();
    const videoResponses = responses[videoKey] || {};
    return Object.values(videoResponses).every(response => response.trim() !== '');
  };

  const totalProgress = useMemo(() => {
    const totalVideos = inspirationVideos.length;
    const completedVideos = videoProgress.filter(vp => vp.isComplete).length;
    return totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;
  }, [videoProgress, inspirationVideos.length]);

  if (loading || dataLoading) {
    const loadingText =
      lang === 'kn'
        ? 'à²®à³Œà²²à³à²¯à²®à²¾à²ªà²¨à²µà²¨à³à²¨à³ à²²à³‹à²¡à³ à²®à²¾à²¡à²²à²¾à²—à³à²¤à³à²¤à²¿à²¦à³†...'
        : lang === 'ta'
          ? 'à®®à®¤à®¿à®ªà¯à®ªà¯€à®Ÿà¯ à®à®±à¯à®±à®ªà¯à®ªà®Ÿà¯à®•à®¿à®±à®¤à¯...'
          : 'Loading assessment...';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (isCompleted && !readOnlyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4 max-w-4xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Completed!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for completing the Inspiration Assessment. Your responses have been saved.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('readonly', '1');
                  navigate(`/student/assessment/inspiration?${params.toString()}`);
                }}
              >
                View My Answers
              </Button>
              <Button onClick={() => navigate('/student-dashboard')} className="bg-blue-600 hover:bg-blue-700">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentVideo = getCurrentVideo();
  if (!currentVideo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No videos available for this assessment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/student-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Inspiration Assessment</h1>
              <p className="text-gray-600 mt-2">
                Watch inspirational videos and reflect on their messages
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              Video {currentVideoIndex + 1} of {inspirationVideos.length}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {currentVideo.title}
              </CardTitle>
              <CardDescription>
                Watch this inspirational video and reflect on its message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <iframe
                  src={`https://www.youtube.com/embed/${currentVideo.youtubeId}`}
                  title={currentVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <Button
                variant="outline"
                onClick={() => window.open(currentVideo.url, '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in YouTube
              </Button>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Reflection Questions
              </CardTitle>
              <CardDescription>
                Answer these questions thoughtfully after watching the video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {assessmentQuestions.map((question, index) => {
                const questionKey = `question${index + 1}`;
                const videoKey = getCurrentVideoKey();
                const responseKey = `${videoKey}_${questionKey}`;
                const currentResponse = responses[videoKey]?.[questionKey] || '';
                const helpKeyValue = helpKey(questionKey);
                const isHelpOpen = helpOpen[helpKeyValue];

                return (
                  <div key={question.id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {question.question_text}
                      </label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleHelp(helpKeyValue)}
                              className="h-6 w-6 p-0"
                            >
                              <Lightbulb className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click for help text</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {isHelpOpen && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">{question.help_text}</p>
                      </div>
                    )}

                    <Textarea
                      value={currentResponse}
                      onChange={(e) => handleResponseChange(videoKey, questionKey, e.target.value)}
                      placeholder="Share your thoughts..."
                      className="min-h-[100px]"
                    />

                    {/* Audio Response */}
                    <div className="flex items-center gap-2">
                      <AudioRecorder
                        onRecordingComplete={(audioBlob) => handleAudioResponse(questionKey, audioBlob)}
                        questionId={responseKey}
                      />
                      {audioAnswered[responseKey] && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Audio Recorded
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevVideo}
                  disabled={currentVideoIndex === 0}
                >
                  Previous Video
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSaving(true)}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>

                  {currentVideoIndex === inspirationVideos.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !isCurrentVideoComplete()}
                    >
                      {submitting ? 'Submitting...' : 'Complete Assessment'}
                    </Button>
                  ) : (
                    <Button
                      onClick={nextVideo}
                      disabled={!isCurrentVideoComplete()}
                    >
                      Next Video
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
