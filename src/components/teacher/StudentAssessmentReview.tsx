import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, CheckCircle, AlertCircle, Eye, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  class_name: string;
  assessment_count: number;
}

interface Assessment {
  id: string;
  assessment_type: string;
  assessment_title: string;
  responses: any;
  completed_at: string;
  review_status: string;
}

interface StudentAssessmentReviewProps {
  onReviewUpdate?: () => void;
}

export default function StudentAssessmentReview({ onReviewUpdate }: StudentAssessmentReviewProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [inspirationQuestions, setInspirationQuestions] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchInspirationQuestions();
  }, []);

  const fetchInspirationQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_inspiration_questions');
      if (error) {
        console.error('Error fetching inspiration questions:', error);
        return;
      }
      console.log('✅ Loaded inspiration questions:', data);
      setInspirationQuestions(data || []);
    } catch (error) {
      console.error('Error loading inspiration questions:', error);
    }
  };

  const updateReviewStatus = async (assessmentId: string, status: 'reviewed' | 'needs_revision' | 'flagged') => {
    setUpdatingStatus(assessmentId);
    
    try {
      const { error } = await supabase
        .from('assessment_responses')
        .update({ 
          review_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId);

      if (error) throw error;

      // Update local state
      setAssessments(prev => prev.map(assessment => 
        assessment.id === assessmentId 
          ? { ...assessment, review_status: status }
          : assessment
      ));

      toast({
        title: "Status Updated",
        description: `Assessment marked as ${status.replace('_', ' ')}`,
      });

      // Refresh the overview stats in the parent component
      if (onReviewUpdate) {
        onReviewUpdate();
      }
    } catch (error) {
      console.error('❌ Error updating review status:', error);
      toast({
        title: "Error",
        description: "Failed to update review status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const fetchStudents = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      console.log('📡 Fetching students...');

      // Get teacher ID
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userProfile.id)
        .maybeSingle();

      if (teacherError || !teacherData) {
        throw new Error('Teacher profile not found');
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

      // Get assessment counts for each student (unique assessment types only)
      const studentsWithCounts = await Promise.all(
        (studentsData || []).map(async (student: any) => {
          // Get all assessments for this student
          const { data: assessments } = await supabase
            .from('assessment_responses')
            .select('assessment_type')
            .eq('student_id', student.id);

          // Count unique assessment types
          const uniqueTypes = new Set((assessments || []).map(a => a.assessment_type));

          return {
            id: student.id,
            user_id: student.user_id,
            full_name: student.users?.full_name || 'Unknown',
            class_name: student.classes?.name || 'No class',
            assessment_count: uniqueTypes.size
          };
        })
      );

      console.log('✅ Fetched students:', studentsWithCounts);
      setStudents(studentsWithCounts);
    } catch (error: any) {
      console.error('❌ Error fetching students:', error);
      toast({
        title: 'Error',
        description: `Failed to load students: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async (studentId: string) => {
    try {
      setLoadingAssessments(true);
      console.log('📡 Fetching assessments for student:', studentId);

      const { data, error } = await supabase
        .from('assessment_responses')
        .select('id, assessment_type, assessment_title, responses, completed_at, review_status')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Fetched all assessments:', data);

      // Get only the LATEST submission for each assessment type
      const uniqueAssessments: Assessment[] = [];
      const seenTypes = new Set<string>();

      (data || []).forEach((assessment: any) => {
        if (!seenTypes.has(assessment.assessment_type)) {
          uniqueAssessments.push(assessment);
          seenTypes.add(assessment.assessment_type);
        }
      });

      console.log('✅ Unique assessments (latest only):', uniqueAssessments);
      setAssessments(uniqueAssessments);
    } catch (error: any) {
      console.error('❌ Error fetching assessments:', error);
      toast({
        title: 'Error',
        description: `Failed to load assessments: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setExpandedAssessment(null);
    fetchAssessments(student.id);
  };

  const toggleAssessmentExpand = (assessmentId: string) => {
    setExpandedAssessment(expandedAssessment === assessmentId ? null : assessmentId);
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'needs_revision':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderAssessmentResponses = (assessment: Assessment) => {
    const responses = assessment.responses;

    console.log('🔍 Rendering assessment:', assessment.assessment_type);
    console.log('📊 Responses data:', responses);
    console.log('📊 Responses JSON:', JSON.stringify(responses, null, 2));
    console.log('📋 Inspiration questions:', inspirationQuestions);

    // Check if it's the Inspiration assessment (has video structure)
    if (assessment.assessment_type === 'inspiration' && responses) {
      // Inspiration assessment has structure: { video1: {...}, video2: {...}, ... }
      const videoKeys = Object.keys(responses).filter(key => key.startsWith('video'));
      
      console.log('🎥 Video keys found:', videoKeys);
      
      if (videoKeys.length === 0) {
        console.warn('⚠️ No video keys found in responses');
        return (
          <div className="text-sm text-gray-500">No responses recorded</div>
        );
      }

      return (
        <div className="space-y-6">
          {videoKeys.map((videoKey, index) => {
            const videoData = responses[videoKey];
            
            console.log(`🎬 Processing ${videoKey}:`, videoData);
            console.log(`   Keys in ${videoKey}:`, Object.keys(videoData));
            console.log(`   Full ${videoKey} structure:`, JSON.stringify(videoData, null, 2));
            
            if (!videoData) {
              console.warn(`⚠️ No data for ${videoKey}`);
              return null;
            }

            return (
              <div key={videoKey} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Video {index + 1}
                </h4>
                
                <div className="space-y-4">
                  {/* Render each question dynamically */}
                  {[1, 2, 3, 4, 5, 6, 7].map((questionNum) => {
                    const questionKey = `question${questionNum}`;
                    
                    // Get the actual question text from database
                    const questionData = inspirationQuestions[questionNum - 1];
                    const questionText = questionData?.help_text || `Question ${questionNum}`;
                    
                    // The student saves data as: question1, question2, etc. (not question1_text)
                    const textResponse = videoData[questionKey];
                    
                    // Audio is stored separately in audio_responses table, 
                    // check audioResponsesMap with key like "video1_question3"
                    const audioKey = `${videoKey}_${questionKey}`;
                    const audioUrl = videoData[`${questionKey}_audio`]; // Check if audio URL is stored in responses
                    
                    console.log(`  Q${questionNum}: questionKey="${questionKey}", hasText=${!!textResponse}, audioKey="${audioKey}", hasAudio=${!!audioUrl}`);
                    
                    // Skip if no response
                    if (!textResponse && !audioUrl) {
                      console.log(`  ⏭️ Skipping Q${questionNum} - no response`);
                      return null;
                    }
                    
                    return (
                      <div key={questionNum} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Q{questionNum}
                          </span>
                          <p className="text-sm font-medium text-gray-700 flex-1">
                            {questionText}
                          </p>
                        </div>
                        
                        <div className="space-y-2 ml-8">
                          {textResponse && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {textResponse}
                              </p>
                            </div>
                          )}
                          
                          {audioUrl && (
                            <div className="flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-gray-400" />
                              <audio controls className="flex-1 max-w-md">
                                <source src={audioUrl} type="audio/webm" />
                                <source src={audioUrl} type="audio/mp4" />
                                <source src={audioUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // For other assessments, show JSON for now
    return (
      <div className="prose max-w-none">
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(responses, null, 2)}
        </pre>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel: Students List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Students ({students.length})
            </CardTitle>
            <CardDescription>Click on a student to view their assessments</CardDescription>
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
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedStudent?.id === student.id
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium text-gray-900">{student.full_name}</div>
                  <div className="text-xs text-gray-500">{student.class_name}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {student.assessment_count} assessment{student.assessment_count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Assessments */}
      <div className="lg:col-span-2">
        {!selectedStudent ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a student to view their assessments</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedStudent.full_name}'s Assessments
              </CardTitle>
              <CardDescription>{selectedStudent.class_name}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssessments ? (
                <div className="text-center py-8 text-gray-500">Loading assessments...</div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>This student hasn't completed any assessments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg overflow-hidden">
                      <div
                        className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleAssessmentExpand(assessment.id)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {assessment.assessment_title}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {assessment.completed_at && assessment.completed_at !== '1970-01-01T00:00:00.000Z'
                                ? new Date(assessment.completed_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : 'Not completed'}
                            </div>
                            <Badge className={getReviewStatusColor(assessment.review_status || 'unreviewed')}>
                              {(assessment.review_status || 'unreviewed').replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {expandedAssessment === assessment.id ? 'Hide' : 'View'} Responses
                        </Button>
                      </div>

                      {expandedAssessment === assessment.id && (
                        <div className="p-4 bg-white border-t">
                          {renderAssessmentResponses(assessment)}
                          <div className="mt-4 flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateReviewStatus(assessment.id, 'reviewed')}
                              disabled={updatingStatus === assessment.id}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {updatingStatus === assessment.id ? 'Updating...' : 'Mark as Reviewed'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateReviewStatus(assessment.id, 'needs_revision')}
                              disabled={updatingStatus === assessment.id}
                            >
                              Needs Revision
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateReviewStatus(assessment.id, 'flagged')}
                              disabled={updatingStatus === assessment.id}
                            >
                              Flag for Follow-up
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

