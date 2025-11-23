import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
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
  completed_at: string | null;
  updated_at?: string | null;
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
  const [dreamsQuestions, setDreamsQuestions] = useState<any[]>([]);
  const [aboutMeFields, setAboutMeFields] = useState<any[]>([]);
  const [schoolLearningQuestions, setSchoolLearningQuestions] = useState<any[]>([]);
  const [hobbiesQuestions, setHobbiesQuestions] = useState<any[]>([]);
  const [roleModelsQuestions, setRoleModelsQuestions] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchInspirationQuestions();
    fetchDreamsQuestions();
    fetchAboutMeFields();
    fetchSchoolLearningQuestions();
    fetchHobbiesQuestions();
    fetchRoleModelsQuestions();
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

  const fetchDreamsQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_dreams_questions');
      if (error) {
        console.error('Error fetching dreams questions:', error);
        return;
      }
      console.log('✅ Loaded dreams questions:', data);
      setDreamsQuestions(data || []);
    } catch (error) {
      console.error('Error loading dreams questions:', error);
    }
  };

  const fetchAboutMeFields = async () => {
    try {
      const { data, error } = await supabase.rpc('get_about_me_fields');
      if (error) {
        console.error('Error fetching about me fields:', error);
        return;
      }
      console.log('✅ Loaded about me fields:', data);
      setAboutMeFields(data || []);
    } catch (error) {
      console.error('Error loading about me fields:', error);
    }
  };

  const fetchSchoolLearningQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_school_learning_questions');
      if (error) {
        console.error('Error fetching school learning questions:', error);
        return;
      }
      console.log('✅ Loaded school learning questions:', data);
      setSchoolLearningQuestions(data || []);
    } catch (error) {
      console.error('Error loading school learning questions:', error);
    }
  };

  const fetchHobbiesQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_hobbies_questions');
      if (error) {
        console.error('Error fetching hobbies questions:', error);
        return;
      }
      console.log('✅ Loaded hobbies questions:', data);
      setHobbiesQuestions(data || []);
    } catch (error) {
      console.error('Error loading hobbies questions:', error);
    }
  };

  const fetchRoleModelsQuestions = async () => {
    try {
      const { data, error } = await supabase.rpc('get_role_models_questions');
      if (error) {
        console.error('Error fetching role models questions:', error);
        return;
      }
      console.log('✅ Loaded role models questions:', data);
      setRoleModelsQuestions(data || []);
    } catch (error) {
      console.error('Error loading role models questions:', error);
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
        .select('id, assessment_type, assessment_title, responses, completed_at, updated_at, review_status')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      console.log('✅ Fetched all assessments:', data);

      // Get only the LATEST submission for each assessment type
      // Use completed_at if available, otherwise use updated_at for comparison
      const uniqueAssessments: Assessment[] = [];
      const latestByType: Record<string, any> = {};

      (data || []).forEach((assessment: any) => {
        const type = assessment.assessment_type;
        const existing = latestByType[type];
        
        if (!existing) {
          latestByType[type] = assessment;
          return;
        }
        
        // Compare dates - prefer completed_at, fallback to updated_at
        const existingDate = new Date(existing.completed_at || existing.updated_at || 0).getTime();
        const currentDate = new Date(assessment.completed_at || assessment.updated_at || 0).getTime();
        
        if (currentDate > existingDate) {
          latestByType[type] = assessment;
        }
      });
      
      // Convert to array
      const sortedAssessments = Object.values(latestByType);

      console.log('✅ Unique assessments (latest only):', sortedAssessments);
      console.log('📅 Assessment dates:', sortedAssessments.map((a: any) => ({
        type: a.assessment_type,
        completed_at: a.completed_at,
        updated_at: a.updated_at,
        hasDate: !!(a.completed_at || a.updated_at)
      })));
      setAssessments(sortedAssessments);
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
                  {/* Render each question dynamically - show ALL questions for ALL videos */}
                  {(() => {
                    // Always show all questions from the database (should be 9 questions)
                    // but also include any additional answers that were persisted even if the template changed
                    const questionCount = inspirationQuestions.length || 9; // Default to 9 if not loaded
                    
                    // Generate array of question numbers from the template (1..questionCount)
                    const templateQuestionNumbers = Array.from({ length: questionCount }, (_, i) => i + 1);

                    // Include any question numbers that exist in the stored responses to avoid hiding answers
                    const answeredQuestionNumbers = Object.keys(videoData || {})
                      .filter((key) => /^question\d+$/.test(key))
                      .map((key) => parseInt(key.replace('question', ''), 10))
                      .filter((num) => Number.isFinite(num));

                    const questionNumbers = Array.from(
                      new Set<number>([...templateQuestionNumbers, ...answeredQuestionNumbers])
                    ).sort((a, b) => a - b);
                    
                    return questionNumbers.map((questionNum) => {
                      const questionKey = `question${questionNum}`;
                      
                      // Get the actual question text from database
                      const questionData = inspirationQuestions[questionNum - 1];
                      const questionText = questionData?.question_text || questionData?.help_text || `Question ${questionNum}`;
                      
                      // Get the answer from database - check videoData directly
                      // The student saves data as: question1, question2, etc.
                      // This will get answers for questions 1-9 for all videos (1-5 and 6)
                      const textResponse = videoData && typeof videoData === 'object' 
                        ? videoData[questionKey] 
                        : null;
                      
                      // Handle both string and other types
                      const responseText = textResponse 
                        ? (typeof textResponse === 'string' ? textResponse : String(textResponse))
                        : '';
                      
                      // Audio is stored separately in audio_responses table, 
                      // check audioResponsesMap with key like "video1_question3"
                      const audioKey = `${videoKey}_${questionKey}`;
                      const audioUrl = videoData && typeof videoData === 'object'
                        ? videoData[`${questionKey}_audio`] 
                        : null; // Check if audio URL is stored in responses
                      
                      console.log(`  Q${questionNum}: questionKey="${questionKey}", videoKey="${videoKey}", hasText=${!!responseText}, responseLength=${responseText.length}, audioUrl=${!!audioUrl}`);
                      
                      // Show ALL questions for ALL videos (1-9)
                      // Display answers from database if they exist
                      // Show "No response provided" if the answer doesn't exist in database
                    
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
                          {responseText && responseText.trim() ? (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {responseText}
                              </p>
                            </div>
                          ) : audioUrl ? (
                            <div className="flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-gray-400" />
                              <audio controls className="flex-1 max-w-md">
                                <source src={audioUrl} type="audio/webm" />
                                <source src={audioUrl} type="audio/mp4" />
                                <source src={audioUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                              <p className="text-sm text-gray-400 italic">
                                No response provided
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    });
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Check if it's the Dreams assessment (has part structure)
    if (assessment.assessment_type === 'dreams' && responses) {
      console.log('💭 Rendering Dreams assessment responses');
      console.log('📊 Dreams responses structure:', responses);
      console.log('📊 Dreams responses keys:', Object.keys(responses || {}));
      console.log('📋 Dreams questions:', dreamsQuestions);
      console.log('📋 Dreams questions count:', dreamsQuestions.length);

      // Dreams responses can have two structures:
      // 1. Old structure: { questionId1: "answer", questionId2: "answer", ... }
      // 2. New structure: { part1: { question1: "answer", ... }, part2: { ... }, ... }
      
      // Check if it's the new structure (has "part" keys)
      const hasPartStructure = Object.keys(responses).some(key => key.startsWith('part'));
      
      if (hasPartStructure) {
        // New structure: { part1: { question1: "...", question2: "..." }, part2: {...} }
        const parts = Object.keys(responses).filter(key => key.startsWith('part')).sort();
        
        if (parts.length === 0) {
      return (
        <div className="text-sm text-gray-500">No responses recorded</div>
      );
    }

        // Group questions by section
        const questionsBySection: Record<string, any[]> = {};
        dreamsQuestions.forEach(q => {
          const section = q.section || 'section1';
          if (!questionsBySection[section]) {
            questionsBySection[section] = [];
          }
          questionsBySection[section].push(q);
        });

        // If questions are not loaded, render from response structure
        if (dreamsQuestions.length === 0) {
          console.log('⚠️ Dreams questions not loaded, rendering from response structure');
          return (
            <div className="space-y-6">
              {parts.map((partKey) => {
                const partResponses = responses[partKey] || {};
                const questionKeys = Object.keys(partResponses).filter(key => 
                  key.startsWith('question')
                ).sort((a, b) => {
                  const numA = parseInt(a.replace('question', ''), 10) || 0;
                  const numB = parseInt(b.replace('question', ''), 10) || 0;
                  return numA - numB;
                });

                const sectionTitles: Record<string, string> = {
                  'part1': 'Section 1: Your Dreams & Future Goals',
                  'part2': 'Section 2: Career & Life Aspirations',
                  'part3': 'Section 3: Making Dreams Reality'
                };

                return (
                  <div key={partKey} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-4">
                      {sectionTitles[partKey] || partKey}
                    </h4>
                    
                    <div className="space-y-4">
                      {questionKeys.map((questionKey, questionIndex) => {
                        const responseText = partResponses[questionKey];
                        const displayText = typeof responseText === 'string' ? responseText : String(responseText || '');
                        const questionNum = parseInt(questionKey.replace('question', ''), 10) || (questionIndex + 1);

                        return (
                          <div key={questionKey} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Q{questionNum}
                              </span>
                              <p className="text-sm font-medium text-gray-700 flex-1">
                                {questionKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                            </div>
                            
                            <div className="ml-8">
                              {displayText && displayText.trim() ? (
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {displayText}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                                  <p className="text-sm text-gray-400 italic">
                                    No response provided
                                  </p>
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

        return (
          <div className="space-y-6">
            {parts.map((partKey) => {
              const partResponses = responses[partKey] || {};
              // Map part1 -> section1, part2 -> section2, part3 -> section3
              const partNumber = parseInt(partKey.replace('part', ''), 10);
              const sectionKey = `section${partNumber}`;
              const sectionQuestions = questionsBySection[sectionKey] || [];
              
              // Sort questions by sequence_number (this is the order they were shown to the student)
              const sortedQuestions = [...sectionQuestions].sort((a, b) => 
                (a.sequence_number || 0) - (b.sequence_number || 0)
              );

              const sectionTitles: Record<string, string> = {
                'section1': 'Section 1: Your Dreams & Future Goals',
                'section2': 'Section 2: Career & Life Aspirations',
                'section3': 'Section 3: Making Dreams Reality'
              };

              return (
                <div key={partKey} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    {sectionTitles[sectionKey] || partKey}
                  </h4>
                  
                  <div className="space-y-4">
                    {sortedQuestions.length > 0 ? (
                      sortedQuestions.map((question) => {
                        // The response key is question1, question2, etc. based on position within the part
                        // We need to find the position of this question in the sorted list
                        const questionIndex = sortedQuestions.findIndex(q => q.id === question.id);
                        const questionKey = `question${questionIndex + 1}`;
                        const responseText = partResponses[questionKey];
                        const displayText = typeof responseText === 'string' ? responseText : String(responseText || '');
                        
                        // Use sequence_number for display (this is what the student saw)
                        const displayQuestionNum = question.sequence_number || (questionIndex + 1);
                        
                        console.log(`  Part ${partKey}, Seq ${question.sequence_number}, Q${questionIndex + 1}: questionKey="${questionKey}", hasResponse=${!!responseText}, responseLength=${displayText.length}`);
                        
                        return (
                          <div key={question.id || questionIndex} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Q{displayQuestionNum}
                              </span>
                              <p className="text-sm font-medium text-gray-700 flex-1">
                                {question.question_text}
                              </p>
                            </div>
                            
                            <div className="ml-8">
                              {displayText && displayText.trim() ? (
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {displayText}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                                  <p className="text-sm text-gray-400 italic">
                                    No response provided
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Fallback: render from response keys if questions not found
                      Object.keys(partResponses).filter(key => key.startsWith('question')).sort((a, b) => {
                        const numA = parseInt(a.replace('question', ''), 10) || 0;
                        const numB = parseInt(b.replace('question', ''), 10) || 0;
                        return numA - numB;
                      }).map((questionKey) => {
                        const responseText = partResponses[questionKey];
                        const displayText = typeof responseText === 'string' ? responseText : String(responseText || '');
                        const questionNum = parseInt(questionKey.replace('question', ''), 10);

                        return (
                          <div key={questionKey} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Q{questionNum}
                              </span>
                              <p className="text-sm font-medium text-gray-700 flex-1">
                                {questionKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                            </div>
                            
                            <div className="ml-8">
                              {displayText && displayText.trim() ? (
                                <div className="bg-white p-3 rounded border border-gray-200">
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {displayText}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                                  <p className="text-sm text-gray-400 italic">
                                    No response provided
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      } else {
        // Old structure: { questionId1: "answer", questionId2: "answer", ... }
        // Map question IDs to question text
        const questionMap = new Map(dreamsQuestions.map(q => [q.id, q]));
        
        return (
          <div className="space-y-4">
            {Object.entries(responses).map(([questionId, answer], index) => {
              const question = questionMap.get(questionId);
              const questionText = question?.question_text || questionId;
              const responseText = typeof answer === 'string' ? answer : String(answer || '');
              
              return (
                <div key={questionId} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Q{question?.sequence_number || index + 1}
                    </span>
                    <p className="text-sm font-medium text-gray-700 flex-1">
                      {questionText}
                    </p>
                  </div>
                  
                  <div className="ml-8">
                    {responseText && responseText.trim() ? (
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {responseText}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                        <p className="text-sm text-gray-400 italic">
                          No response provided
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }

    // Check if it's About Me assessment
    if (assessment.assessment_type === 'personality' && assessment.assessment_title === 'About Me' && responses) {
      console.log('👤 Rendering About Me assessment responses');
      console.log('📊 About Me responses:', responses);
      console.log('📊 About Me responses keys:', Object.keys(responses || {}));
      console.log('📋 About Me fields:', aboutMeFields);
      console.log('📋 About Me fields count:', aboutMeFields.length);

      // About Me responses are stored as { question1: "...", question2: "...", ... }
      // Sort fields by sequence_number
      const sortedFields = [...aboutMeFields].sort((a, b) => 
        (a.sequence_number || 0) - (b.sequence_number || 0)
      );

      // If fields are not loaded yet, try to render from response keys directly
      if (sortedFields.length === 0) {
        console.log('⚠️ About Me fields not loaded, rendering from response keys');
        const responseKeys = Object.keys(responses).filter(key => 
          key.startsWith('question') || /^question\d+$/.test(key)
        ).sort((a, b) => {
          const numA = parseInt(a.replace('question', ''), 10) || 0;
          const numB = parseInt(b.replace('question', ''), 10) || 0;
          return numA - numB;
        });

        return (
          <div className="space-y-4">
            {responseKeys.map((key, index) => {
              const responseText = responses[key];
              const displayText = typeof responseText === 'string' ? responseText : 
                                 Array.isArray(responseText) ? responseText.join(', ') : 
                                 String(responseText || '');

              return (
                <div key={key} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Q{index + 1}
                    </span>
                    <p className="text-sm font-medium text-gray-700 flex-1">
                      {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                  
                  <div className="ml-8">
                    {displayText && displayText.trim() ? (
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {displayText}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                        <p className="text-sm text-gray-400 italic">
                          No response provided
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {sortedFields.map((field) => {
            // About Me responses are stored as question1, question2, etc. based on global sequence_number
            // The sequence_number from the database is the global order (1-20)
            const questionNum = field.sequence_number;
            const questionKey = `question${questionNum}`;
            
            // Try questionN format first (most common), then field_key
            const responseText = responses[questionKey] || responses[field.field_key] || '';
            const displayText = typeof responseText === 'string' ? responseText : 
                               Array.isArray(responseText) ? responseText.join(', ') : 
                               String(responseText || '');

            console.log(`  Seq ${questionNum}, Q${questionNum}: questionKey="${questionKey}", fieldKey="${field.field_key}", hasResponse=${!!responseText}, responseLength=${displayText.length}, questionText="${field.question_text?.substring(0, 50)}..."`);

            return (
              <div key={field.field_key || questionNum} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Q{questionNum}
                  </span>
                  <p className="text-sm font-medium text-gray-700 flex-1">
                    {field.question_text}
                  </p>
                </div>
                
                <div className="ml-8">
                  {displayText && displayText.trim() ? (
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {displayText}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                      <p className="text-sm text-gray-400 italic">
                        No response provided
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Check if it's School Learning assessment
    if (assessment.assessment_type === 'school_learning' && responses) {
      console.log('📚 Rendering School Learning assessment responses');
      console.log('📊 School Learning responses:', responses);
      console.log('📋 School Learning questions:', schoolLearningQuestions);

      // School Learning responses have structure: { part1: { question1: "...", ... }, part2: {...}, ... }
      const hasPartStructure = Object.keys(responses).some(key => key.startsWith('part'));
      
      if (hasPartStructure) {
        const parts = Object.keys(responses).filter(key => key.startsWith('part')).sort();
        
        if (parts.length === 0) {
        return (
            <div className="text-sm text-gray-500">No responses recorded</div>
          );
        }

        // Group questions by section
        const questionsBySection: Record<string, any[]> = {};
        schoolLearningQuestions.forEach(q => {
          const section = q.section || 'part1';
          if (!questionsBySection[section]) {
            questionsBySection[section] = [];
          }
          questionsBySection[section].push(q);
        });

        return (
          <div className="space-y-6">
            {parts.map((partKey) => {
              const partResponses = responses[partKey] || {};
              const sectionQuestions = questionsBySection[partKey] || [];
              
              // Sort questions by sequence_number
              const sortedQuestions = [...sectionQuestions].sort((a, b) => 
                (a.sequence_number || 0) - (b.sequence_number || 0)
              );

              const sectionTitles: Record<string, string> = {
                'part1': 'Section 1: Subjects & Learning Preferences',
                'part2': 'Section 2: Academic Performance & Learning Methods',
                'part3': 'Section 3: School Relationships & Experiences',
                'part4': 'Section 4: Additional Information',
                'part5': 'Section 5: Future Plans'
              };

              return (
                <div key={partKey} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    {sectionTitles[partKey] || partKey}
                  </h4>
                  
                  <div className="space-y-4">
                    {sortedQuestions.map((question, questionIndex) => {
                      const questionKey = `question${questionIndex + 1}`;
                      const responseValue = partResponses[questionKey];
                      
                      // Handle checkbox responses (object with boolean values)
                      let responseText = '';
                      if (typeof responseValue === 'string') {
                        responseText = responseValue;
                      } else if (typeof responseValue === 'object' && responseValue !== null) {
                        // For checkbox questions, show selected options
                        const selectedOptions = Object.entries(responseValue)
                          .filter(([_, value]) => value === true)
                          .map(([key, _]) => key);
                        responseText = selectedOptions.length > 0 ? selectedOptions.join(', ') : '';
                      }

                      return (
                        <div key={question.id || questionIndex} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              Q{questionIndex + 1}
                            </span>
                            <p className="text-sm font-medium text-gray-700 flex-1">
                              {question.question_text}
                            </p>
              </div>
                          
                          <div className="ml-8">
                            {responseText && responseText.trim() ? (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {responseText}
                                </p>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                                <p className="text-sm text-gray-400 italic">
                                  No response provided
                                </p>
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
    }

    // Check if it's Hobbies assessment
    if (assessment.assessment_type === 'hobbies' && responses) {
      console.log('🎨 Rendering Hobbies assessment responses');
      console.log('📊 Hobbies responses:', responses);
      console.log('📋 Hobbies questions:', hobbiesQuestions);

      // Hobbies responses can have structure: { question1: "...", question2: "...", ... }
      // or section-based structure
      const sortedQuestions = [...hobbiesQuestions].sort((a, b) => 
        (a.sequence_number || 0) - (b.sequence_number || 0)
      );

      if (sortedQuestions.length === 0) {
        return (
          <div className="text-sm text-gray-500">No questions found</div>
        );
      }

      return (
        <div className="space-y-4">
          {sortedQuestions.map((question, index) => {
            const questionKey = `question${index + 1}`;
            const responseText = responses[questionKey] || '';
            const displayText = typeof responseText === 'string' ? responseText : String(responseText || '');

            return (
              <div key={question.id || index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Q{index + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-700 flex-1">
                    {question.question_text}
                  </p>
              </div>
                
                <div className="ml-8">
                  {displayText && displayText.trim() ? (
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {displayText}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                      <p className="text-sm text-gray-400 italic">
                        No response provided
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        );
      }

    // Check if it's Role Models assessment
    if (assessment.assessment_type === 'role_models' && responses) {
      console.log('👥 Rendering Role Models assessment responses');
      console.log('📊 Role Models responses:', responses);
      console.log('📋 Role Models questions:', roleModelsQuestions);

      // Role Models responses have structure: { roleModels: [{ name: "...", ... }, ...] }
      const roleModels = responses.roleModels || (Array.isArray(responses) ? responses : []);
      
      if (!Array.isArray(roleModels) || roleModels.length === 0) {
        return (
          <div className="text-sm text-gray-500">No role models recorded</div>
        );
      }

      const sortedQuestions = [...roleModelsQuestions].sort((a, b) => 
        (a.sequence_number || 0) - (b.sequence_number || 0)
      );

      return (
        <div className="space-y-6">
          {roleModels.map((roleModel: any, roleIndex: number) => (
            <div key={roleIndex} className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-800 mb-4">
                Role Model {roleIndex + 1}: {roleModel.name || 'Unnamed'}
              </h4>
              
              <div className="space-y-4">
                {sortedQuestions.map((question, questionIndex) => {
                  // Map question keys to role model fields
                  const questionKeyMap: Record<number, string> = {
                    0: 'name',
                    1: 'whyAdmire',
                    2: 'qualities',
                    3: 'incorporatePlan'
                  };
                  
                  const fieldKey = questionKeyMap[questionIndex] || `field${questionIndex}`;
                  const responseText = roleModel[fieldKey] || '';
                  const displayText = typeof responseText === 'string' ? responseText : String(responseText || '');

                  return (
                    <div key={question.id || questionIndex} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Q{questionIndex + 1}
                        </span>
                        <p className="text-sm font-medium text-gray-700 flex-1">
                          {question.question_text}
                        </p>
                      </div>
                      
                      <div className="ml-8">
                        {displayText && displayText.trim() ? (
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {displayText}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                            <p className="text-sm text-gray-400 italic">
                              No response provided
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // For other assessments, render all responses dynamically in Q&A format
    if (!responses || typeof responses !== 'object') {
      return (
        <div className="text-sm text-gray-500">No responses recorded</div>
      );
    }

    // Generic Q&A format for any other assessment type
    const responseEntries = Object.entries(responses);

    return (
      <div className="space-y-4">
        {responseEntries.map(([key, value], index) => {
          // Format response value
          let responseText = '';
          if (typeof value === 'string') {
            responseText = value;
          } else if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              responseText = value.join(', ');
            } else {
              // For objects, show key-value pairs
              responseText = Object.entries(value)
                .filter(([_, v]) => v === true || (typeof v === 'string' && v.trim()))
                .map(([k, v]) => typeof v === 'string' ? `${k}: ${v}` : k)
                .join(', ');
            }
          } else {
            responseText = String(value || '');
          }

          return (
          <div key={key} className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Q{index + 1}
              </span>
                <p className="text-sm font-medium text-gray-700 flex-1">
                  {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                </p>
            </div>
              
            <div className="ml-8">
                {responseText && responseText.trim() ? (
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {responseText}
                    </p>
            </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                    <p className="text-sm text-gray-400 italic">
                      No response provided
                    </p>
          </div>
                )}
              </div>
            </div>
          );
        })}
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
                              {(() => {
                                // Use completed_at if available and valid, otherwise try updated_at
                                const dateToUse = assessment.completed_at || assessment.updated_at;
                                
                                if (!dateToUse) {
                                  return 'Not completed';
                                }
                                
                                // Check if it's a valid date (not epoch, not null, not empty string)
                                const dateObj = new Date(dateToUse);
                                const isValidDate = !isNaN(dateObj.getTime()) && 
                                                   dateObj.getFullYear() > 1970 &&
                                                   dateToUse !== '1970-01-01T00:00:00.000Z' &&
                                                   dateToUse !== '1970-01-01T00:00:00Z';
                                
                                if (isValidDate) {
                                  return dateObj.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  });
                                }
                                
                                return 'Not completed';
                              })()}
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
