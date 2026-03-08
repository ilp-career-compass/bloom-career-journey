import { logger } from '@/lib/logger';

// Summary Database Service - Handles database operations for assessment summaries

import { supabase } from '@/integrations/supabase/client';
import {
  AssessmentSummary,
  SummaryQuestions,
  PendingSummaryForTeacher,
  TeacherSummaryOverview
} from '@/types/assessmentSummary';

class SummaryDatabaseService {
  /**
   * Create or update AI summary in database
   */
  async createAISummary(
    assessmentResponseId: string,
    aiSummary: SummaryQuestions,
    studentUserId: string
  ): Promise<{ success: boolean; summaryId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_ai_summary', {
        p_assessment_response_id: assessmentResponseId,
        p_ai_summary: aiSummary,
        p_student_user_id: studentUserId
      });

      if (error) {
        logger.error('Error creating AI summary:', error);
        return { success: false, error: error.message };
      }

      return { success: true, summaryId: data };
    } catch (error) {
      logger.error('Exception creating AI summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Approve a summary (teacher action)
   */
  async approveSummary(
    summaryId: string,
    teacherUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.log('✅ Approving summary:', {
        summaryId,
        teacherUserId
      });

      const { data, error } = await supabase.rpc('approve_summary', {
        p_summary_id: summaryId,
        p_teacher_user_id: teacherUserId
      });

      if (error) {
        logger.error('❌ Error approving summary:', error);
        return { success: false, error: error.message };
      }

      logger.log('✅ Summary approval RPC completed successfully');

      // Verify the approval by fetching the updated summary
      const { data: verifyData, error: verifyError } = await supabase
        .from('assessment_summaries')
        .select('id, approval_status, approved_at, approved_by')
        .eq('id', summaryId)
        .maybeSingle();

      if (verifyError) {
        logger.error('❌ Error verifying approval:', verifyError);
      } else if (verifyData) {
        logger.log('📊 Verification - Summary status after approval:', {
          id: verifyData.id,
          approval_status: verifyData.approval_status,
          approved_at: verifyData.approved_at,
          approved_by: verifyData.approved_by
        });

        if (verifyData.approval_status !== 'approved') {
          logger.error('❌ Approval failed - status is still:', verifyData.approval_status);
          return { 
            success: false, 
            error: `Approval failed - status is still ${verifyData.approval_status}` 
          };
        }
      }

      return { success: true };
    } catch (error) {
      logger.error('❌ Exception approving summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reject a summary (teacher action)
   */
  async rejectSummary(
    summaryId: string,
    teacherUserId: string,
    rejectionReason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('reject_summary', {
        p_summary_id: summaryId,
        p_teacher_user_id: teacherUserId,
        p_rejection_reason: rejectionReason
      });

      if (error) {
        logger.error('Error rejecting summary:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Exception rejecting summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update teacher-edited summary (before approval)
   */
  async updateTeacherSummary(
    summaryId: string,
    teacherUserId: string,
    teacherEditedSummary: SummaryQuestions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('update_teacher_summary', {
        p_summary_id: summaryId,
        p_teacher_user_id: teacherUserId,
        p_teacher_edited_summary: teacherEditedSummary
      });

      if (error) {
        logger.error('Error updating teacher summary:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Exception updating teacher summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update student-edited summary (after approval)
   */
  async updateStudentSummary(
    summaryId: string,
    studentUserId: string,
    studentEditedSummary: SummaryQuestions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('update_student_summary', {
        p_summary_id: summaryId,
        p_student_user_id: studentUserId,
        p_student_edited_summary: studentEditedSummary
      });

      if (error) {
        logger.error('Error updating student summary:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Exception updating student summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get summary by assessment response ID
   */
  async getSummaryByAssessment(
    assessmentResponseId: string,
    userId: string
  ): Promise<{ success: boolean; summary?: AssessmentSummary; error?: string }> {
    try {
      logger.log('🔍 Calling get_summary_by_assessment RPC:', {
        assessmentResponseId,
        userId
      });

      const { data, error } = await supabase.rpc('get_summary_by_assessment', {
        p_assessment_response_id: assessmentResponseId,
        p_user_id: userId
      });

      if (error) {
        logger.error('❌ RPC Error getting summary:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return { success: false, error: error.message };
      }

      logger.log('📊 RPC Response:', {
        dataLength: data?.length || 0,
        data: data
      });

      if (!data || data.length === 0) {
        logger.warn('⚠️ No summary found for assessment:', {
          assessmentResponseId,
          userId,
          data: data
        });
        
        // Try direct query to see if summary exists
        const { data: directData, error: directError } = await supabase
          .from('assessment_summaries')
          .select('id, assessment_response_id, approval_status')
          .eq('assessment_response_id', assessmentResponseId)
          .maybeSingle();
        
        logger.log('🔍 Direct query result:', {
          directData,
          directError: directError?.message
        });
        
        return { success: false, error: 'Summary not found' };
      }

      const summary = data[0] as AssessmentSummary;
      logger.log('📊 Summary fetched:', {
        id: summary.id,
        assessment_response_id: summary.assessment_response_id,
        approval_status: summary.approval_status,
        summary_type: summary.summary_type,
        approved_at: summary.approved_at,
        updated_at: summary.updated_at
      });

      return { success: true, summary };
    } catch (error) {
      logger.error('Exception getting summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get pending summaries for a teacher
   */
  async getPendingSummariesForTeacher(
    teacherUserId: string
  ): Promise<{ success: boolean; summaries?: PendingSummaryForTeacher[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_pending_summaries_for_teacher', {
        p_teacher_user_id: teacherUserId
      });

      if (error) {
        logger.error('Error getting pending summaries:', error);
        return { success: false, error: error.message };
      }

      return { success: true, summaries: data as PendingSummaryForTeacher[] };
    } catch (error) {
      logger.error('Exception getting pending summaries:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get teacher summary overview (counts)
   */
  async getTeacherSummaryOverview(
    teacherUserId: string
  ): Promise<{ success: boolean; overview?: TeacherSummaryOverview; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_teacher_summary_overview', {
        p_teacher_user_id: teacherUserId
      });

      if (error) {
        logger.error('Error getting summary overview:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          overview: {
            total_summaries: 0,
            pending_approval: 0,
            approved: 0,
            rejected: 0,
            student_edited: 0
          }
        };
      }

      return { success: true, overview: data[0] as TeacherSummaryOverview };
    } catch (error) {
      logger.error('Exception getting summary overview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if summary exists for assessment
   */
  async checkSummaryExists(assessmentResponseId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('assessment_summaries')
        .select('id')
        .eq('assessment_response_id', assessmentResponseId)
        .maybeSingle();

      return !error && !!data;
    } catch (error) {
      logger.error('Error checking summary existence:', error);
      return false;
    }
  }
}

// Export singleton instance
export const summaryDatabaseService = new SummaryDatabaseService();

