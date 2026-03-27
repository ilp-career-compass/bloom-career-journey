import { FileText } from 'lucide-react';
import StudentAssessmentReview from './StudentAssessmentReview';
// AI Summary Review tab hidden — may re-enable later
// import AISummaryReview from './AISummaryReview';

interface AssessmentResponsesViewProps {
  onReviewUpdate?: () => void;
}

export default function AssessmentResponsesView({ onReviewUpdate }: AssessmentResponsesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-800">Student Assessment Review</h2>
      </div>
      <StudentAssessmentReview onReviewUpdate={onReviewUpdate} />
    </div>
  );
}
