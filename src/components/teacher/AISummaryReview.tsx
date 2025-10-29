import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, User, Calendar, CheckCircle, XCircle, Edit3, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SummaryApprovalCard from './SummaryApprovalCard';
import { aiSummaryService } from '@/services/aiSummaryService';
import { summaryDatabaseService } from '@/services/summaryDatabaseService';

interface SummaryData {
  id: string;
  assessment_response_id: string;
  ai_summary: any;
  approval_status: string;
  generated_at: string;
  student_name: string;
  student_id: string;
  responses: any;
}

export default function AISummaryReview() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSummary, setSelectedSummary] = useState<SummaryData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [assessmentsWithoutSummaries, setAssessmentsWithoutSummaries] = useState<any[]>([]);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      console.log('📡 Fetching AI summaries...');

      // Get teacher ID
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();

      if (teacherError || !teacherData) {
        throw new Error('Teacher profile not found');
      }

      // Get students for this teacher
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, user_id, users!inner(full_name)')
        .eq('teacher_id', teacherData.id);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        console.log('ℹ️ No students found');
        setSummaries([]);
        return;
      }

      const studentIds = students.map(s => s.id);

      // Get assessment responses for these students
      const { data: assessmentResponses, error: arError } = await supabase
        .from('assessment_responses')
        .select('id, student_id, assessment_type, responses, completed_at')
        .in('student_id', studentIds);

      if (arError) throw arError;

      if (!assessmentResponses || assessmentResponses.length === 0) {
        console.log('ℹ️ No assessment responses found');
        setSummaries([]);
        return;
      }

      // Filter to keep only the latest unique assessment per student per type
      const uniqueAssessmentsMap = new Map<string, typeof assessmentResponses[0]>();
      
      // Sort by completed_at descending (newest first)
      const sortedAssessments = [...assessmentResponses].sort((a, b) => {
        const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return dateB - dateA;
      });

      sortedAssessments.forEach(assessment => {
        const key = `${assessment.student_id}_${assessment.assessment_type || 'unknown'}`;
        // Only keep the first one (latest due to sorting)
        if (!uniqueAssessmentsMap.has(key)) {
          uniqueAssessmentsMap.set(key, assessment);
        }
      });

      const uniqueAssessments = Array.from(uniqueAssessmentsMap.values());
      console.log(`📊 Total assessments: ${assessmentResponses.length}, Unique assessments: ${uniqueAssessments.length}`);

      const responseIds = uniqueAssessments.map(ar => ar.id);

      // Get summaries for these assessment responses
      console.log('🔍 Looking for summaries for response IDs:', responseIds);
      
      const { data: summariesData, error: summariesError } = await supabase
        .from('assessment_summaries')
        .select('*')
        .in('assessment_response_id', responseIds)
        .order('generated_at', { ascending: false });

      if (summariesError) {
        console.error('❌ Error fetching summaries:', summariesError);
        throw summariesError;
      }

      console.log('📊 Found summaries:', summariesData?.length || 0);

      // Combine data
      const enrichedSummaries = (summariesData || []).map((summary: any) => {
        const assessmentResponse = assessmentResponses.find(ar => ar.id === summary.assessment_response_id);
        const student = students.find(s => s.id === assessmentResponse?.student_id);

        return {
          ...summary,
          student_name: student?.users?.full_name || 'Unknown',
          student_id: assessmentResponse?.student_id || '',
          responses: assessmentResponse?.responses || {}
        };
      });

      // Find assessments without summaries (only completed ones from unique set)
      const assessmentsWithSummaries = new Set(summariesData?.map(s => s.assessment_response_id) || []);
      const assessmentsNeedingSummaries = uniqueAssessments.filter(ar => 
        !assessmentsWithSummaries.has(ar.id) && ar.responses // Only if has responses
      ).map(ar => {
        const student = students.find(s => s.id === ar.student_id);
        return {
          ...ar,
          student_name: student?.users?.full_name || 'Unknown',
          student_user_id: student?.user_id || null
        };
      });

      console.log('⚠️ Assessments without summaries:', assessmentsNeedingSummaries.length);
      setAssessmentsWithoutSummaries(assessmentsNeedingSummaries);

      console.log('✅ Fetched AI summaries:', enrichedSummaries);
      setSummaries(enrichedSummaries);
    } catch (error: any) {
      console.error('❌ Error fetching summaries:', error);
      toast({
        title: 'Error',
        description: `Failed to load AI summaries: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMissingSummaries = async () => {
    if (!aiSummaryService.isConfigured()) {
      toast({
        title: 'API Not Configured',
        description: 'Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.',
        variant: 'destructive'
      });
      return;
    }

    if (assessmentsWithoutSummaries.length === 0) {
      toast({
        title: 'No Missing Summaries',
        description: 'All assessments already have AI summaries!',
      });
      return;
    }

    setGenerating(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const assessment of assessmentsWithoutSummaries) {
        try {
          console.log(`🤖 Generating summary for ${assessment.student_name}...`);
          
          const summaryResult = await aiSummaryService.generateInspirationSummary(assessment.responses);

          if (summaryResult.success && summaryResult.summary) {
            const saveResult = await summaryDatabaseService.createAISummary(
              assessment.id,
              summaryResult.summary,
              // RPC expects student_user_id, not students.id
              assessment.student_user_id || ''
            );

            if (saveResult.success) {
              successCount++;
              console.log(`✅ Generated summary for ${assessment.student_name}`);
            } else {
              failCount++;
              console.error(`❌ Failed to save summary for ${assessment.student_name}:`, saveResult.error);
            }
          } else {
            failCount++;
            console.error(`❌ Failed to generate summary for ${assessment.student_name}:`, summaryResult.error);
          }
        } catch (error) {
          failCount++;
          console.error(`❌ Exception for ${assessment.student_name}:`, error);
        }
      }

      toast({
        title: 'Summary Generation Complete',
        description: `✅ ${successCount} successful, ❌ ${failCount} failed`,
      });

      // Refresh summaries list
      fetchSummaries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to generate summaries: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSummaries = summaries.filter(summary =>
    summary.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = summaries.filter(s => s.approval_status === 'pending_approval').length;
  const approvedCount = summaries.filter(s => s.approval_status === 'approved').length;
  const rejectedCount = summaries.filter(s => s.approval_status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading AI summaries...</div>
      </div>
    );
  }

  if (selectedSummary) {
    return (
      <div>
        <Button
          variant="outline"
          onClick={() => setSelectedSummary(null)}
          className="mb-4"
        >
          ← Back to Summaries List
        </Button>
        <SummaryApprovalCard
          summary={selectedSummary as any}
          studentResponses={selectedSummary.responses}
          teacherUserId={userProfile.id}
          studentName={selectedSummary.student_name}
          onSummaryUpdated={() => {
            fetchSummaries();
            setSelectedSummary(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                <div className="text-sm text-gray-600">Pending Approval</div>
              </div>
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Generated Summaries ({summaries.length})
            </CardTitle>
            {assessmentsWithoutSummaries.length > 0 && (
              <Button 
                onClick={generateMissingSummaries} 
                disabled={generating}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating...' : `Generate ${assessmentsWithoutSummaries.length} Missing`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredSummaries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No AI summaries found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSummaries.map((summary) => (
                <div
                  key={summary.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedSummary(summary)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {summary.student_name}
                        </span>
                        <Badge className={getStatusColor(summary.approval_status)}>
                          {summary.approval_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Generated: {new Date(summary.generated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Review →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

