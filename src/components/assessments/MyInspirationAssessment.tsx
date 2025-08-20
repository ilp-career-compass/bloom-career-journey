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
  Youtube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // 6 inspirational videos from the worksheet
  const defaultVideos: InspirationVideo[] = useMemo(() => [
    {
      id: 1,
      title: "Inspirational Video 1",
      url: "https://youtu.be/U7-HIfpvQIA",
      youtubeId: "U7-HIfpvQIA"
    },
    {
      id: 2,
      title: "Inspirational Video 2", 
      url: "https://youtu.be/xqb1hfgfcl8",
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
      url: "https://youtu.be/X9wViEY5tPQ",
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
      url: "https://youtu.be/ZgRLkpSA3IQ",
      youtubeId: "ZgRLkpSA3IQ"
    }
  ], []);

  useEffect(() => {
    setInspirationVideos(defaultVideos);
    setLoading(false);
  }, [defaultVideos]);

  const checkExistingResponse = useCallback(async () => {
    if (!userProfile) return;

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

    try {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('student_id', studentId)
        .eq('assessment_type', 'inspiration')
        .eq('assessment_title', 'My Inspiration')
        .maybeSingle();

      if (data && !error) {
        setIsCompleted(true);
        setResponses(data.responses || responses);
      }
    } catch (error) {
      // No existing response found, which is fine
    }
  }, [userProfile, responses]);

  // Call checkExistingResponse when userProfile changes
  useEffect(() => {
    if (userProfile) {
      checkExistingResponse();
    }
  }, [userProfile, checkExistingResponse]);

  const handleResponseChange = (videoKey: keyof AssessmentResponse, questionKey: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [videoKey]: {
        ...prev[videoKey],
        [questionKey]: value
      }
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
    return Object.values(responses).every(video => 
      Object.values(video as Record<string, string>).every((v: string) => v.trim() !== '')
    );
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your inspiration assessment...</p>
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
                    onClick={() => (window.location.href = '/student')}
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">✨ My Inspiration</h1>
          <p className="text-blue-600 text-lg">
            Watch inspirational videos and reflect on their impact on your life and career journey
          </p>
          <p className="text-gray-600 mt-2">
            Answer the questions after watching each video to discover what inspires you most
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Your Progress</h2>
              <Badge variant="secondary">{Math.round(getProgressPercentage())}% Complete</Badge>
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
              Navigate between inspirational videos to complete your assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {inspirationVideos.map((video, index) => (
                <Button
                  key={video.id}
                  variant={currentVideoIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentVideoIndex(index)}
                  className={currentVideoIndex === index ? "bg-blue-600" : ""}
                >
                  Video {index + 1}
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Reflection Questions</h3>
              
              {/* Question 1 */}
              <div className="border-l-4 border-blue-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-blue-500" />
                  1. Which parts of this video/audio did you like most / find most inspirational?
                </label>
                <Textarea
                  placeholder="Describe the specific parts that resonated with you and why they were inspirational..."
                  value={getCurrentVideoResponses().question1}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question1', e.target.value)}
                  rows={4}
                  className="border-blue-200 focus:border-blue-400 text-base"
                />
              </div>

              {/* Question 2 */}
              <div className="border-l-4 border-green-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-green-500" />
                  2. What can you learn from this video/audio?
                </label>
                <Textarea
                  placeholder="Share the key lessons and insights you gained from watching this video..."
                  value={getCurrentVideoResponses().question2}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question2', e.target.value)}
                  rows={4}
                  className="border-green-200 focus:border-green-400 text-base"
                />
              </div>

              {/* Question 3 */}
              <div className="border-l-4 border-purple-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-500" />
                  3. Which parts of this video/audio would you want to adopt in your personal life?
                </label>
                <Textarea
                  placeholder="Identify specific behaviors, attitudes, or approaches you'd like to incorporate into your life..."
                  value={getCurrentVideoResponses().question3}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question3', e.target.value)}
                  rows={4}
                  className="border-purple-200 focus:border-purple-400 text-base"
                />
              </div>

              {/* Question 4 */}
              <div className="border-l-4 border-orange-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  4. What changes will the contents of this video/audio bring in your life?
                </label>
                <Textarea
                  placeholder="Reflect on how this video might change your perspective, goals, or actions..."
                  value={getCurrentVideoResponses().question4}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question4', e.target.value)}
                  rows={4}
                  className="border-orange-200 focus:border-orange-400 text-base"
                />
              </div>

              {/* Question 5 */}
              <div className="border-l-4 border-pink-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                  5. Which qualities of the characters in this video/audio do you identify in yourself?
                </label>
                <Textarea
                  placeholder="Think about the traits, strengths, or characteristics you share with the people in the video..."
                  value={getCurrentVideoResponses().question5}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question5', e.target.value)}
                  rows={4}
                  className="border-pink-200 focus:border-pink-400 text-base"
                />
              </div>

              {/* Question 6 */}
              <div className="border-l-4 border-indigo-400 pl-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Play className="w-5 h-5 text-indigo-500" />
                  6. What would your reaction be if you were in the situation depicted in the video/audio?
                </label>
                <Textarea
                  placeholder="Imagine yourself in the same circumstances and describe how you would respond..."
                  value={getCurrentVideoResponses().question6}
                  onChange={(e) => handleResponseChange(getCurrentVideoKey(), 'question6', e.target.value)}
                  rows={4}
                  className="border-indigo-200 focus:border-indigo-400 text-base"
                />
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
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      currentVideoIndex === index 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCurrentVideoIndex(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentVideoIndex === index 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">Video {index + 1}</h4>
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
