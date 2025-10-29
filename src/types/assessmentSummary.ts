// Types for Assessment Summary Approval Workflow

export type SummaryApprovalStatus = 
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export type SummaryType = 
  | 'ai_generated'
  | 'teacher_edited'
  | 'student_edited';

export interface SummaryQuestions {
  question1: string; // List the things that inspired you
  question2: string; // Behaviors you should avoid
  question3: string; // Similarities between video characters and real-life inspirations
}

export interface AssessmentSummary {
  id: string;
  assessment_response_id: string;
  
  // Summary content
  ai_summary: SummaryQuestions;
  student_edited_summary: SummaryQuestions | null;
  teacher_edited_summary: SummaryQuestions | null;
  
  // Metadata
  summary_type: SummaryType;
  approval_status: SummaryApprovalStatus;
  version: number;
  
  // Approval tracking
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  
  // Timestamps
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSummaryParams {
  assessment_response_id: string;
  ai_summary: SummaryQuestions;
  student_user_id: string;
}

export interface ApproveSummaryParams {
  summary_id: string;
  teacher_user_id: string;
}

export interface RejectSummaryParams {
  summary_id: string;
  teacher_user_id: string;
  rejection_reason: string;
}

export interface UpdateTeacherSummaryParams {
  summary_id: string;
  teacher_user_id: string;
  teacher_edited_summary: SummaryQuestions;
}

export interface UpdateStudentSummaryParams {
  summary_id: string;
  student_user_id: string;
  student_edited_summary: SummaryQuestions;
}

export interface GetSummaryParams {
  assessment_response_id: string;
  user_id: string;
}

export interface PendingSummaryForTeacher {
  summary_id: string;
  assessment_response_id: string;
  student_name: string;
  student_class: string;
  assessment_title: string;
  ai_summary: SummaryQuestions;
  teacher_edited_summary: SummaryQuestions | null;
  approval_status: SummaryApprovalStatus;
  generated_at: string;
  rejection_reason: string | null;
}

export interface TeacherSummaryOverview {
  total_summaries: number;
  pending_approval: number;
  approved: number;
  rejected: number;
  student_edited: number;
}

// For displaying the summary - prioritizes student edits, then teacher edits, then AI
export function getDisplaySummary(summary: AssessmentSummary): SummaryQuestions {
  if (summary.student_edited_summary) {
    return summary.student_edited_summary;
  }
  if (summary.teacher_edited_summary) {
    return summary.teacher_edited_summary;
  }
  return summary.ai_summary;
}

// Check if student can edit the summary
export function canStudentEdit(summary: AssessmentSummary): boolean {
  return summary.approval_status === 'approved';
}

// Check if teacher can approve the summary
export function canTeacherApprove(summary: AssessmentSummary): boolean {
  return summary.approval_status === 'pending_approval' || 
         summary.approval_status === 'revision_requested';
}

// Get summary status badge color
export function getSummaryStatusColor(status: SummaryApprovalStatus): string {
  switch (status) {
    case 'pending_approval':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'revision_requested':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Get human-readable status label
export function getSummaryStatusLabel(status: SummaryApprovalStatus): string {
  switch (status) {
    case 'pending_approval':
      return 'Pending Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'revision_requested':
      return 'Revision Requested';
    default:
      return 'Unknown';
  }
}

