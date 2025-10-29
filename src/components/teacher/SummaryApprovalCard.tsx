// SummaryApprovalCard - Teacher component to review and approve AI-generated summaries

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Save, 
  X, 
  Lightbulb,
  AlertCircle,
  Users,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  AssessmentSummary, 
  SummaryQuestions, 
  getDisplaySummary,
  getSummaryStatusColor,
  getSummaryStatusLabel
} from '@/types/assessmentSummary';
import { summaryDatabaseService } from '@/services/summaryDatabaseService';
import { notificationService } from '@/services/notificationService';
import { aiSummaryService } from '@/services/aiSummaryService';

interface SummaryApprovalCardProps {
  summary: AssessmentSummary;
  studentResponses: any; // Raw assessment responses from student
  teacherUserId: string;
  studentName: string;
  onSummaryUpdated?: () => void;
}

export default function SummaryApprovalCard({
  summary,
  studentResponses,
  teacherUserId,
  studentName,
  onSummaryUpdated
}: SummaryApprovalCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showStudentResponses, setShowStudentResponses] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editedSummary, setEditedSummary] = useState<SummaryQuestions>({
    question1: '',
    question2: '',
    question3: ''
  });

  // Load summary content when it changes
  useEffect(() => {
    const displaySummary = getDisplaySummary(summary);
    setEditedSummary({
      question1: displaySummary.question1,
      question2: displaySummary.question2,
      question3: displaySummary.question3
    });
    setIsEditing(false);
  }, [summary]);

  const handleApprove = async () => {
    setSaving(true);
    try {
      // If teacher has edited, save those edits first
      if (isEditing && summary.teacher_edited_summary) {
        await summaryDatabaseService.updateTeacherSummary(
          summary.id,
          teacherUserId,
          editedSummary
        );
      }

      // Approve the summary
      const result = await summaryDatabaseService.approveSummary(
        summary.id,
        teacherUserId
      );

      if (result.success) {
        toast({
          title: "Summary Approved! ✅",
          description: `${studentName}'s reflection summary is now visible to them.`
        });
        // Notify student (best-effort)
        try {
          await notificationService.create({
            userId: summary.student_user_id,
            type: 'summary_approved',
            title: 'Inspiration summary approved',
            message: 'Your mentor approved your AI summary. Tap to view.',
            link: '/student'
          });
        } catch {}
        setIsEditing(false);
        onSummaryUpdated?.();
      } else {
        throw new Error(result.error || 'Failed to approve summary');
      }
    } catch (error) {
      console.error('Error approving summary:', error);
      toast({
        title: "Error",
        description: "Failed to approve summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const result = await summaryDatabaseService.rejectSummary(
        summary.id,
        teacherUserId,
        rejectionReason
      );

      if (result.success) {
        toast({
          title: "Summary Rejected",
          description: "The summary will be regenerated automatically."
        });
        setShowRejectDialog(false);
        setRejectionReason('');
        
        // Trigger regeneration
        await handleRegenerate();
      } else {
        throw new Error(result.error || 'Failed to reject summary');
      }
    } catch (error) {
      console.error('Error rejecting summary:', error);
      toast({
        title: "Error",
        description: "Failed to reject summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      // Generate new AI summary
      const summaryResult = await aiSummaryService.generateInspirationSummary(studentResponses);

      if (summaryResult.success && summaryResult.summary) {
        // This will be saved through the RPC which handles regeneration
        toast({
          title: "Summary Regenerated! 🔄",
          description: "A new AI summary has been generated for review."
        });
        onSummaryUpdated?.();
      } else {
        throw new Error(summaryResult.error || 'Failed to regenerate summary');
      }
    } catch (error) {
      console.error('Error regenerating summary:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    setSaving(true);
    try {
      const result = await summaryDatabaseService.updateTeacherSummary(
        summary.id,
        teacherUserId,
        editedSummary
      );

      if (result.success) {
        toast({
          title: "Edits Saved! ✏️",
          description: "Your changes have been saved. You can now approve the summary."
        });
        setIsEditing(false);
        onSummaryUpdated?.();
      } else {
        throw new Error(result.error || 'Failed to save edits');
      }
    } catch (error) {
      console.error('Error saving edits:', error);
      toast({
        title: "Error",
        description: "Failed to save edits. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    const displaySummary = getDisplaySummary(summary);
    setEditedSummary({
      question1: displaySummary.question1,
      question2: displaySummary.question2,
      question3: displaySummary.question3
    });
    setIsEditing(false);
  };

  const displaySummary = getDisplaySummary(summary);
  const isPending = summary.approval_status === 'pending_approval' || summary.approval_status === 'revision_requested';

  return (
    <div className="space-y-4">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">AI-Generated Reflection Summary</h3>
            <p className="text-sm text-gray-600">Review and approve for {studentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getSummaryStatusColor(summary.approval_status)}>
            {getSummaryStatusLabel(summary.approval_status)}
          </Badge>
          {summary.summary_type === 'teacher_edited' && (
            <Badge variant="outline" className="bg-purple-50">
              <Edit3 className="h-3 w-3 mr-1" />
              You Edited This
            </Badge>
          )}
        </div>
      </div>

      {/* Student Responses (Collapsible) */}
      <Collapsible>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded">
                <div className="flex items-center gap-2">
                  {showStudentResponses ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <CardTitle className="text-base">Student's Original Responses</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowStudentResponses(!showStudentResponses)}
                >
                  {showStudentResponses ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
                {Object.keys(studentResponses).map((videoKey) => {
                  const videoData = studentResponses[videoKey];
                  if (!videoData || typeof videoData !== 'object') return null;
                  
                  return (
                    <div key={videoKey} className="border-l-2 border-blue-300 pl-3 py-1">
                      <p className="font-medium text-gray-700">
                        {videoData.videoTitle || videoKey}
                      </p>
                      <div className="text-gray-600 space-y-1 mt-1">
                        {Object.entries(videoData.responses || {}).map(([qKey, answer]) => (
                          <p key={qKey}>
                            <span className="font-medium">{qKey}:</span> {String(answer)}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Summary Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            1. What Inspired You?
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedSummary.question1}
              onChange={(e) => setEditedSummary({ ...editedSummary, question1: e.target.value })}
              className="min-h-[120px]"
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question1}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            2. Behaviors to Avoid
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedSummary.question2}
              onChange={(e) => setEditedSummary({ ...editedSummary, question2: e.target.value })}
              className="min-h-[120px]"
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question2}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            3. Similarities Between Inspirations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedSummary.question3}
              onChange={(e) => setEditedSummary({ ...editedSummary, question3: e.target.value })}
              className="min-h-[120px]"
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{displaySummary.question3}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-2">
          {isPending && (
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={regenerating || saving}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate AI Summary
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdits} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Edits
              </Button>
            </>
          ) : (
            <>
              {isPending && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={saving}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Summary
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={saving}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? 'Approving...' : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rejection Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Summary</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this summary. A new AI summary will be automatically generated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="rejection-reason">Reason for Rejection</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Summary doesn't capture the student's voice, needs more specific examples..."
              className="mt-2 min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim() || saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? 'Rejecting...' : 'Reject & Regenerate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

