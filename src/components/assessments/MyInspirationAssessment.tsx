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
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  };
  video2: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
  };
  video3: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
  };
  video4: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
  };
  video5: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
  };
  video6: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
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
  const [inspirationVideos, setInspirationVideos] = useState<InspirationVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse>({
    video1: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' },
    video2: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' },
    video3: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' },
    video4: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' },
    video5: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' },
    video6: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' }
  });
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const navigate = useNavigate();

  // 6 inspirational videos from the worksheet
  const defaultVideos: InspirationVideo[] = useMemo(() => [
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
  ], []);

  useEffect(() => {
    setInspirationVideos(defaultVideos);
    setLoading(false);
  }, [defaultVideos]);

  // Initialize video progress
  useEffect(() => {
    const initialProgress = defaultVideos.map(video => ({
      videoId: video.id,
      responses: {
        question1: '',
        question2: '',
        question3: '',
        question4: '',
        question5: '',
        question6: ''
      },
      isComplete: false,
      savedAt: undefined
    }));
    setVideoProgress(initialProgress);
  }, [defaultVideos]);

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
        
        // Update video progress from saved data
        if (data.responses) {
          const savedResponses = data.responses as AssessmentResponse;
          console.log('Loading saved responses:', savedResponses);
          setResponses(savedResponses);
          
          const updatedProgress = defaultVideos.map(video => {
            const videoKey = `video${video.id}` as keyof AssessmentResponse;
            const videoResponses = savedResponses[videoKey];
            const isComplete = Object.values(videoResponses).every((v: string) => v.trim() !== '');
            // Only mark as saved if the video has actual content (not just empty strings)
            const hasContent = Object.values(videoResponses).some((v: string) => v.trim() !== '');
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
              
              const updatedProgress = defaultVideos.map(video => {
                const videoKey = `video${video.id}` as keyof AssessmentResponse;
                const videoResponses = keepRecord.responses[videoKey];
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

  // Note: We removed the automatic sync between videoProgress and responses
  // to prevent conflicts. The responses state is now the single source of truth.

  const handleResponseChange = (videoKey: keyof AssessmentResponse, questionKey: string, value: string) => {
    // Update responses state
    const updatedResponses = {
      ...responses,
      [videoKey]: {
        ...responses[videoKey],
        [questionKey]: value
      }
    };
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

  const getProgressPercentage = () => {
    const totalQuestions = 6 * 6; // 6 videos × 6 questions
    const answeredQuestions = Object.values(responses).reduce((total, video) => {
      return total + Object.values(video as Record<string, string>).filter((v: string) => v.trim() !== '').length;
    }, 0);
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const canSubmit = () => {
    return videoProgress.every(video => video.isComplete);
  };

  const isVideoComplete = (videoIndex: number) => {
    const video = videoProgress.find(v => v.videoId === videoIndex + 1);
    return video?.isComplete || false;
  };

  const isVideoSaved = (videoIndex: number) => {
    const video = videoProgress.find(v => v.videoId === videoIndex + 1);
    // A video is considered saved if it has a savedAt timestamp AND has actual content
    return !!(video?.savedAt && video.isComplete);
  };

  const getCurrentVideoCompletionStatus = () => {
    const video = videoProgress.find(v => v.videoId === currentVideoIndex + 1);
    const totalQuestions = 6;
    const answeredQuestions = video ? Object.values(video.responses).filter((v: string) => v.trim() !== '').length : 0;
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
        description: "Please complete all 6 questions for this video before saving.",
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
      const existingResponses = existingData?.responses as AssessmentResponse || {
        video1: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' },
        video2: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' },
        video3: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' },
        video4: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' },
        video5: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' },
        video6: { question1: '', question2: '', question3: '', question4: '', question5: '', question6: '' }
      };

      console.log('Existing responses from database:', existingResponses);

      const updatedResponses = {
        ...existingResponses,
        [videoKey]: video.responses
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
      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          student_id: studentId,
          assessment_type: 'inspiration',
          assessment_title: 'My Inspiration',
          responses: responses,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Inspiration Assessment Completed! ✨",
        description: "Your reflections on inspirational videos have been captured successfully!",
      });

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
              Watch inspirational videos and reflect on their impact on your life and career journey
            </p>
            <p className="text-gray-600 mt-2">
              Answer the questions after watching each video to discover what inspires you most
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
                    <span>{videoProgress.filter(v => v.savedAt && v.isComplete).length} saved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{videoProgress.filter(v => v.isComplete).length} complete</span>
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
              
              {/* Question 1 */}
              <div className={`border-l-4 pl-6 ${getCurrentVideoResponses().question1.trim() ? 'border-blue-400' : 'border-red-400'}`}>
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-blue-500" />
                  1. Which parts of this video/audio did you like most / find most inspirational?
                  <span className="text-red-500 text-sm">*</span>
                </label>
                <Textarea
                  placeholder="Describe the specific parts that resonated with you and why they were inspirational..."
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
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-green-500" />
                  2. What can you learn from this video/audio?
                  <span className="text-red-500 text-sm">*</span>
                </label>
                <Textarea
                  placeholder="Share the key lessons and insights you gained from watching this video..."
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
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-500" />
                  3. Which parts of this video/audio would you want to adopt in your personal life?
                  <span className="text-red-500 text-sm">*</span>
                </label>
                <Textarea
                  placeholder="Identify specific behaviors, attitudes, or approaches you'd like to incorporate into your life..."
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
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  4. What changes will the contents of this video/audio bring in your life?
                  <span className="text-red-500 text-sm">*</span>
                </label>
                <Textarea
                  placeholder="Reflect on how this video might change your perspective, goals, or actions..."
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
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                  5. Which qualities of the characters in this video/audio do you identify in yourself?
                  <span className="text-red-500 text-sm">*</span>
                </label>
                <Textarea
                  placeholder="Think about the traits, strengths, or characteristics you share with the people in the video..."
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
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Play className="w-5 h-5 text-indigo-500" />
                  6. What would your reaction be if you were in the situation depicted in the video/audio?
                  <span className="text-red-500 text-sm">*</span>
                </label>
                <Textarea
                  placeholder="Imagine yourself in the same circumstances and describe how you would respond..."
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
            </div>

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
