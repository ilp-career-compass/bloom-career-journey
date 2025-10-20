import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Heart,
  Star,
  Target,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AssessmentResponse {
  assessment_response_id: string;
  student_name: string;
  student_class: string;
  assessment_title: string;
  responses: Array<{
    videoId: string;
    videoTitle: string;
    responses: {
      question1: string;
      question2: string;
      question3: string;
      question4: string;
    };
  }>;
  completed_at: string;
  review_status?: 'unreviewed' | 'in_review' | 'reviewed' | 'needs_revision' | 'flagged';
  reviewed_at?: string | null;
  needs_follow_up?: boolean;
  follow_up_due_at?: string | null;
  follow_up_status?: 'pending' | 'contacted' | 'resolved' | null;
  reviewer_name?: string | null;
}

export default function AssessmentResponsesView() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<string>('all');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string>('all');
  const [selectedFollowUp, setSelectedFollowUp] = useState<string>('all');
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [overview, setOverview] = useState<{ unreviewed_count: number; reviewed_count: number; needs_revision_count: number; flagged_count: number; followups_due_this_week: number }>({ unreviewed_count: 0, reviewed_count: 0, needs_revision_count: 0, flagged_count: 0, followups_due_this_week: 0 });

  useEffect(() => {
    fetchAssessmentResponses();
  }, []);

  const fetchAssessmentResponses = async () => {
    if (!userProfile?.teacherProfile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_student_assessment_responses', {
          teacher_user_id: userProfile.id,
          assessment_type_filter: 'inspiration'
        });
      if (error) throw error;
      setResponses(data || []);
      const { data: ov } = await supabase.rpc('get_review_overview', { teacher_user_id: userProfile.id });
      if (ov && ov[0]) setOverview(ov[0] as any);
    } catch (error) {
      console.error('Error fetching assessment responses:', error);
      toast({ title: 'Error', description: 'Failed to load assessment responses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredResponses = responses.filter(response => {
    const matchesSearch = response.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || response.student_class === selectedClass;
    const matchesAssessment = selectedAssessment === 'all' || response.assessment_title === selectedAssessment;
    const matchesReview = selectedReviewStatus === 'all' || (response.review_status || 'unreviewed') === selectedReviewStatus;
    const matchesFollowUp = selectedFollowUp === 'all' || (response.follow_up_status || (response.needs_follow_up ? 'pending' : null)) === selectedFollowUp;
    return matchesSearch && matchesClass && matchesAssessment && matchesReview && matchesFollowUp;
  });

  const getUniqueClasses = () => ['all', ...Array.from(new Set(responses.map(r => r.student_class)))] as string[];
  const getUniqueAssessments = () => ['all', ...Array.from(new Set(responses.map(r => r.assessment_title)))] as string[];

  const getResponseStats = () => {
    const totalStudents = responses.length;
    const completedToday = responses.filter(r => new Date(r.completed_at).toDateString() === new Date().toDateString()).length;
    const totalVideos = responses.reduce((total, r) => total + r.responses.length, 0);
    const averageVideosPerStudent = totalStudents > 0 ? (totalVideos / totalStudents).toFixed(1) : 0;
    return { totalStudents, completedToday, totalVideos, averageVideosPerStudent };
  };

  const exportResponses = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspiration_assessment_responses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: 'Export Successful', description: 'Assessment responses have been exported to CSV' });
  };

  const generateCSV = () => {
    const headers = [
      'Student Name','Class','Assessment Title','Video Title',
      'Question 1','Question 2','Question 3','Question 4','Completed At','Review Status','Reviewed At'
    ];
    const rows = responses.flatMap(response =>
      response.responses.map(videoResponse => [
        response.student_name,
        response.student_class,
        response.assessment_title,
        videoResponse.videoTitle,
        videoResponse.responses.question1,
        videoResponse.responses.question2,
        videoResponse.responses.question3,
        videoResponse.responses.question4,
        new Date(response.completed_at).toLocaleDateString(),
        response.review_status || 'unreviewed',
        response.reviewed_at ? new Date(response.reviewed_at).toLocaleDateString() : ''
      ])
    );
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const toggleResponseExpansion = (responseId: string) => setExpandedResponse(expandedResponse === responseId ? null : responseId);

  const markReviewed = async (assessmentResponseId: string) => {
    if (!userProfile?.id) return;
    try {
      setSavingId(assessmentResponseId);
      // Optimistic UI
      setResponses(prev => prev.map(r => r.assessment_response_id === assessmentResponseId ? { ...r, review_status: 'reviewed', reviewed_at: new Date().toISOString() } : r));
      const { error } = await supabase.rpc('update_assessment_review', {
        teacher_user_id: userProfile.id,
        assessment_response_id: assessmentResponseId,
        review: { review_status: 'reviewed' }
      } as any);
      if (error) throw error;
      toast({ title: 'Marked as reviewed' });
    } catch (err) {
      console.error('Review update failed:', err);
      toast({ title: 'Failed to update review', variant: 'destructive' });
      // Reload to re-sync
      fetchAssessmentResponses();
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading assessment responses...</p>
        </div>
      </div>
    );
  }

  const stats = getResponseStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">📊 Assessment Responses</h1>
          <p className="text-green-600 text-lg">Review and analyze your students' self-discovery assessments</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Students</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalStudents}</p>
                </div>
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Completed Today</p>
                  <p className="text-2xl font-bold text-green-700">{stats.completedToday}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Videos</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.totalVideos}</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Avg. Videos/Student</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.averageVideosPerStudent}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Overview Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Unreviewed</div>
              <div className="text-2xl font-bold text-gray-800">{overview.unreviewed_count}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Reviewed</div>
              <div className="text-2xl font-bold text-blue-700">{overview.reviewed_count}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Needs Revision</div>
              <div className="text-2xl font-bold text-yellow-600">{overview.needs_revision_count}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-gray-600">Follow-ups Due This Week</div>
              <div className="text-2xl font-bold text-red-600">{overview.followups_due_this_week}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search students by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
              </div>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  {getUniqueClasses().map(className => (
                    <SelectItem key={className} value={className}>
                      {className === 'all' ? 'All Classes' : className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedReviewStatus} onValueChange={setSelectedReviewStatus}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Review status" />
                </SelectTrigger>
                <SelectContent>
                  {['all','unreviewed','reviewed','needs_revision','flagged'].map(s => (
                    <SelectItem key={s} value={s}>{s === 'all' ? 'All Reviews' : s.replace('_',' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFollowUp} onValueChange={setSelectedFollowUp}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Follow-up status" />
                </SelectTrigger>
                <SelectContent>
                  {['all','pending','contacted','resolved'].map(s => (
                    <SelectItem key={s} value={s}>{s === 'all' ? 'All Follow-ups' : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by assessment" />
                </SelectTrigger>
                <SelectContent>
                  {getUniqueAssessments().map(assessment => (
                    <SelectItem key={assessment} value={assessment}>
                      {assessment === 'all' ? 'All Assessments' : assessment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={exportResponses} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Responses List */}
        <div className="space-y-6">
          {filteredResponses.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No assessment responses found</p>
                <p className="text-gray-500">Students need to complete assessments first</p>
              </CardContent>
            </Card>
          ) : (
            filteredResponses.map((response, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-blue-800">{response.student_name}</CardTitle>
                      <CardDescription className="text-blue-600">{response.student_class} • {response.assessment_title}</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      {response.review_status && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                className={
                                  response.review_status === 'reviewed' ? 'bg-blue-600 text-white' :
                                  response.review_status === 'needs_revision' ? 'bg-yellow-500 text-white' :
                                  response.review_status === 'flagged' ? 'bg-red-600 text-white' :
                                  'bg-gray-200 text-gray-800'
                                }
                              >
                                {response.review_status.replace('_',' ')}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <div>Reviewer: {response.reviewer_name || '—'}</div>
                                <div>Reviewed: {response.reviewed_at ? new Date(response.reviewed_at).toLocaleString() : '—'}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Badge variant="secondary">{response.responses.length} videos completed</Badge>
                      <Badge variant="outline">{new Date(response.completed_at).toLocaleDateString()}</Badge>
                      <Button variant="outline" size="sm" onClick={() => toggleResponseExpansion(`${response.student_name}-${index}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        {expandedResponse === `${response.student_name}-${index}` ? 'Hide' : 'View'}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => markReviewed(response.assessment_response_id)}
                        disabled={savingId === response.assessment_response_id || response.review_status === 'reviewed'}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {savingId === response.assessment_response_id ? 'Saving…' : (response.review_status === 'reviewed' ? 'Reviewed' : 'Mark Reviewed')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expandedResponse === `${response.student_name}-${index}` && (
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {response.responses.map((videoResponse, videoIndex) => (
                        <div key={videoIndex} className="border rounded-lg p-4 bg-gray-50">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            {videoResponse.videoTitle}
                          </h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-500" />
                                Most Inspirational Parts
                              </h5>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded border">{videoResponse.responses.question1 || 'No response provided'}</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500" />
                                What Can Be Learned
                              </h5>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded border">{videoResponse.responses.question2 || 'No response provided'}</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Star className="w-4 h-4 text-purple-500" />
                                What to Adopt
                              </h5>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded border">{videoResponse.responses.question3 || 'No response provided'}</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                Life Changes
                              </h5>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded border">{videoResponse.responses.question4 || 'No response provided'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
