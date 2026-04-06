import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, User, Calendar, CheckCircle, XCircle, Edit3, Search, RefreshCw, ArrowLeft } from 'lucide-react';
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
  assessment_type: string;
  assessment_title: string;
  responses: any;
  student_user_id?: string | null;
}

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  class_name: string;
  summary_count: number;
}

interface AISummaryReviewProps {
  selectedStudentId?: string; // Optional: filter by student ID
}

export default function AISummaryReview({ selectedStudentId }: AISummaryReviewProps = {}) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<SummaryData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [assessmentsWithoutSummaries, setAssessmentsWithoutSummaries] = useState<any[]>([]);

  // Only these assessment types should ever have AI summaries.
  // NOTE: Holland Code (personality) and Career Guidance Tools are intentionally excluded.
  const SUMMARY_SUPPORTED_TYPES = [
    'inspiration',
    'about_me',
    'dreams',
    'school_learning',
    'hobbies',
    'role_models'
  ];

  useEffect(() => {
    fetchStudents();
    if (selectedStudentId) {
      // Find and select the student if ID is provided
      fetchStudents().then(() => {
        const student = students.find(s => s.id === selectedStudentId);
        if (student) {
          handleStudentClick(student);
        }
      });
    }
  }, []);

  const fetchStudents = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      logger.log('📡 Fetching students for AI summaries...');

      // Get teacher ID
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();

      if (teacherError || !teacherData) {
        logger.warn('Teacher profile not found');
        setStudents([]);
        return;
      }

      // Get students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          users!inner(full_name),
          classes(name)
        `)
        .eq('teacher_id', teacherData.id);

      if (studentsError) throw studentsError;

      // Get summary counts for each student (only latest assessment per type)
      const studentsWithCounts = await Promise.all(
        (studentsData || []).map(async (student: any) => {
          // Get all assessment responses for this student
          const { data: assessments } = await supabase
            .from('assessment_responses')
            .select('id, assessment_type, completed_at, updated_at')
            .eq('student_id', student.id)
            .order('completed_at', { ascending: false });

          // Get only the latest assessment per type (prefer most recent completed_at, then updated_at)
          const latestAssessments = new Map<string, any>();
          (assessments || []).forEach((assessment: any) => {
            // Skip assessments that should not have AI summaries (e.g. Holland Code, Career Guidance Tools)
            if (!SUMMARY_SUPPORTED_TYPES.includes(assessment.assessment_type)) {
              return;
            }

            const existing = latestAssessments.get(assessment.assessment_type);
            const assessmentTimestamp = new Date(assessment.completed_at || assessment.updated_at || 0).getTime();
            const isCompleted = !!assessment.completed_at;

            if (!existing) {
              latestAssessments.set(assessment.assessment_type, assessment);
              return;
            }

            const existingTimestamp = new Date(existing.completed_at || existing.updated_at || 0).getTime();
            const isExistingCompleted = !!existing.completed_at;

            // Prioritize completed assessments over drafts
            if (isCompleted && !isExistingCompleted) {
              latestAssessments.set(assessment.assessment_type, assessment);
            } else if (!isCompleted && isExistingCompleted) {
              // Keep the existing completed one
              return;
            } else {
              // Both are completed or both are drafts - take the latest
              if (assessmentTimestamp > existingTimestamp) {
                latestAssessments.set(assessment.assessment_type, assessment);
              }
            }
          });

          // Get summaries for these latest assessment responses
          const assessmentResponseIds = Array.from(latestAssessments.values()).map((assessment: any) => assessment.id);
          const { data: summaries } = await supabase
            .from('assessment_summaries')
            .select('id')
            .in('assessment_response_id', assessmentResponseIds);

          return {
            id: student.id,
            user_id: student.user_id,
            full_name: student.users?.full_name || 'Unknown',
            class_name: student.classes?.name || 'No class',
            summary_count: summaries?.length || 0
          };
        })
      );

      logger.log('✅ Fetched students:', studentsWithCounts);
      setStudents(studentsWithCounts);
    } catch (error: any) {
      logger.error('❌ Error fetching students:', error);
      toast({
        title: 'Error',
        description: `Failed to load students: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaries = async (studentId: string) => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      logger.log('📡 Fetching AI summaries for student:', studentId);

      // Get all assessment responses for this student
      const { data: assessmentResponses, error: arError } = await supabase
        .from('assessment_responses')
        .select('id, student_id, assessment_type, assessment_title, responses, completed_at, updated_at')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false });

      if (arError) throw arError;

      // Get only the LATEST submission for each assessment type
      const uniqueAssessments: Record<string, any> = {};
      (assessmentResponses || []).forEach((assessment: any) => {
        // Skip assessments that should not have AI summaries (e.g. Holland Code, Career Guidance Tools)
        if (!SUMMARY_SUPPORTED_TYPES.includes(assessment.assessment_type)) {
          return;
        }

        // We assume one active version per assessment type
        // The logic below ensures we prioritize COMPLETED assessments over drafts
        // This aligns with Student Dashboard which locks onto the completed one
        const key = assessment.assessment_type;

        const existing = uniqueAssessments[key];
        const assessmentTimestamp = new Date(assessment.completed_at || assessment.updated_at || 0).getTime();
        const isCompleted = !!assessment.completed_at;

        if (!existing) {
          uniqueAssessments[key] = assessment;
          return;
        }

        const existingTimestamp = new Date(existing.completed_at || existing.updated_at || 0).getTime();
        const isExistingCompleted = !!existing.completed_at;

        // Prioritize completed assessments over drafts
        if (isCompleted && !isExistingCompleted) {
          uniqueAssessments[key] = assessment;
        } else if (!isCompleted && isExistingCompleted) {
          return;
        } else {
          // Both are completed or both are drafts - take the latest
          if (assessmentTimestamp > existingTimestamp) {
            uniqueAssessments[key] = assessment;
          }
        }
      });

      const latestAssessmentIds = Object.values(uniqueAssessments).map((a: any) => a.id);

      // If there are no supported assessments, clear state and exit early
      if (latestAssessmentIds.length === 0) {
        setSummaries([]);
        setAssessmentsWithoutSummaries([]);
        return;
      }

      // Get summaries for these latest assessment responses
      const { data: summariesData, error: summariesError } = await supabase
        .from('assessment_summaries')
        .select('*')
        .in('assessment_response_id', latestAssessmentIds)
        .order('generated_at', { ascending: false });

      if (summariesError) {
        logger.error('❌ Error fetching summaries:', summariesError);
        throw summariesError;
      }

      // Get student info
      const { data: studentData } = await supabase
        .from('students')
        .select('id, user_id, users!inner(full_name, preferred_language)')
        .eq('id', studentId)
        .maybeSingle();

      logger.log('🔍 Debug student fetch:', { studentId, studentData });

      if (!studentData?.user_id) {
        logger.error('❌ Student user_id missing for:', studentId, studentData);
        toast({
          title: 'Student Data Warning',
          description: 'Could not find user ID for this student. Summary generation may fail.',
          variant: 'destructive'
        });
      }

      // Combine data
      const enrichedSummaries = (summariesData || [])
        .map((summary: any) => {
          const assessmentResponse = Object.values(uniqueAssessments).find(
            (ar: any) => ar.id === summary.assessment_response_id
          );

          // If we can't find a matching supported assessment (e.g. legacy Holland summary), drop it
          if (!assessmentResponse) return null;

          return {
            ...summary,
            student_name: (studentData as any)?.users?.full_name || 'Unknown',
            student_id: studentId,
            assessment_type: assessmentResponse.assessment_type || 'unknown',
            assessment_title: assessmentResponse.assessment_title || 'Unknown Assessment',
            responses: assessmentResponse.responses || {},
            student_user_id: studentData?.user_id || null
          };
        })
        // Filter out any nulls and any non-supported assessment types just in case
        .filter((s: any) => s && SUMMARY_SUPPORTED_TYPES.includes(s.assessment_type));

      logger.log('✅ Fetched AI summaries:', enrichedSummaries);
      setSummaries(enrichedSummaries);

      // Find assessments without summaries
      const assessmentsWithSummaries = new Set(summariesData?.map(s => s.assessment_response_id) || []);
      const assessmentsNeedingSummaries = Object.values(uniqueAssessments)
        .filter((ar: any) => !assessmentsWithSummaries.has(ar.id) && ar.responses)
        .map((ar: any) => ({
          ...ar,
          student_id: studentId,
          student_name: (studentData as any)?.users?.full_name || 'Unknown',
          student_user_id: studentData?.user_id || null,
          student_preferred_language: (studentData as any)?.users?.preferred_language || null
        }));

      logger.log('⚠️ Assessments without summaries:', assessmentsNeedingSummaries.length);
      setAssessmentsWithoutSummaries(assessmentsNeedingSummaries);
    } catch (error: any) {
      logger.error('❌ Error fetching summaries:', error);
      toast({
        title: 'Error',
        description: `Failed to load AI summaries: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setSelectedSummary(null);
    fetchSummaries(student.id);
  };

  const generateMissingSummaries = async () => {
    if (!aiSummaryService.isConfigured()) {
      toast({
        title: 'API Not Configured',
        description: 'AI summary service is not available. Please try again later.',
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
          // Validate student_user_id before attempting generation
          if (!assessment.student_user_id) {
            logger.error(`❌ Missing student_user_id for ${assessment.student_name}. Skipping.`);
            failCount++;
            continue;
          }

          logger.log(`🤖 Generating summary for ${assessment.student_name} (${assessment.assessment_type})...`);

          // Determine which summary generator to use based on assessment type
          const studentLang = assessment.student_preferred_language || undefined;
          let summaryResult;
          if (assessment.assessment_type === 'about_me') {
            summaryResult = await aiSummaryService.generateAboutMeSummary(assessment.responses, studentLang);
          } else if (assessment.assessment_type === 'dreams') {
            summaryResult = await aiSummaryService.generateDreamsSummary(assessment.responses, studentLang);
          } else if (assessment.assessment_type === 'school_learning') {
            summaryResult = await aiSummaryService.generateSchoolLearningSummary(assessment.responses, studentLang);
          } else if (assessment.assessment_type === 'hobbies') {
            summaryResult = await aiSummaryService.generateHobbiesSummary(assessment.responses, studentLang);
          } else if (assessment.assessment_type === 'role_models') {
            summaryResult = await aiSummaryService.generateRoleModelsSummary(assessment.responses, studentLang);
          } else {
            // Default to inspiration summary
            summaryResult = await aiSummaryService.generateInspirationSummary(assessment.responses, studentLang);
          }

          if (summaryResult.success && summaryResult.summary) {
            const saveResult = await summaryDatabaseService.createAISummary(
              assessment.id,
              summaryResult.summary,
              // RPC expects student_user_id, not students.id
              assessment.student_user_id || ''
            );

            if (saveResult.success) {
              successCount++;
              logger.log(`✅ Generated summary for ${assessment.student_name}`);
            } else {
              failCount++;
              logger.error(`❌ Failed to save summary for ${assessment.student_name}:`, saveResult.error);
            }
          } else {
            failCount++;
            logger.error(`❌ Failed to generate summary for ${assessment.student_name}:`, summaryResult.error);
          }
        } catch (error) {
          failCount++;
          logger.error(`❌ Exception for ${assessment.student_name}:`, error);
        }
      }

      toast({
        title: 'Summary Generation Complete',
        description: `✅ ${successCount} successful, ❌ ${failCount} failed`,
      });

      // Refresh summaries list
      if (selectedStudent) {
        fetchSummaries(selectedStudent.id);
      }
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

  const pendingCount = summaries.filter(s => s.approval_status === 'pending_approval').length;
  const approvedCount = summaries.filter(s => s.approval_status === 'approved').length;
  const rejectedCount = summaries.filter(s => s.approval_status === 'rejected').length;

  if (loading && !selectedStudent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading students...</div>
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
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Summaries List
        </Button>
        <SummaryApprovalCard
          summary={selectedSummary as any}
          studentResponses={selectedSummary.responses}
          teacherUserId={userProfile.id}
          studentName={selectedSummary.student_name}
          assessmentType={selectedSummary.assessment_type}
          onSummaryUpdated={(updatedData) => {
            if (selectedStudent) {
              fetchSummaries(selectedStudent.id);
            }
            if (updatedData) {
              setSelectedSummary(prev => prev ? ({ ...prev, ...updatedData } as any) : null);
            } else {
              setSelectedSummary(null);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Panel: Students List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Students ({students.length})
            </CardTitle>
            <CardDescription>Click on a student to view their AI summaries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {students.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">
                No students assigned to you yet
              </div>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentClick(student)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedStudent?.id === student.id
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className="font-medium text-gray-900">{student.full_name}</div>
                  <div className="text-xs text-gray-500">{student.class_name}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {student.summary_count} {student.summary_count !== 1 ? 'summaries' : 'summary'}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Summaries */}
      <div className="lg:col-span-2">
        {!selectedStudent ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a student to view their AI summaries</p>
              </div>
            </CardContent>
          </Card>
        ) : (
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

            {/* Summaries List */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(null);
                        setSummaries([]);
                        setSelectedSummary(null);
                      }}
                      className="w-fit"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="truncate">{selectedStudent.full_name}'s Summaries</span>
                    </CardTitle>
                  </div>
                  {assessmentsWithoutSummaries.length > 0 && (
                    <Button
                      onClick={generateMissingSummaries}
                      disabled={generating}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                      {generating ? 'Generating...' : `Generate ${assessmentsWithoutSummaries.length}`}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading summaries...</div>
                ) : summaries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No AI summaries found for this student</p>
                    {assessmentsWithoutSummaries.length > 0 && (
                      <p className="text-sm mt-2">Click "Generate Missing" to create summaries</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {summaries.map((summary) => (
                      <div
                        key={summary.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedSummary(summary)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {summary.assessment_title}
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
        )}
      </div>
    </div>
  );
}
