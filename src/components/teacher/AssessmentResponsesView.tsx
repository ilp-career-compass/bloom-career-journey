import { FileText } from 'lucide-react';
import { useLang } from '@/hooks/useLang';
import StudentAssessmentReview from './StudentAssessmentReview';
// AI Summary Review tab hidden — may re-enable later
// import AISummaryReview from './AISummaryReview';

interface AssessmentResponsesViewProps {
  onReviewUpdate?: () => void;
}

export default function AssessmentResponsesView({ onReviewUpdate }: AssessmentResponsesViewProps) {
  const { lang } = useLang();

  const heading =
    lang === 'kn' ? 'ವಿದ್ಯಾರ್ಥಿ ಮೌಲ್ಯಮಾಪನ ವಿಮರ್ಶೆ'
    : lang === 'ta' ? 'மாணவர் மதிப்பீட்டு மதிப்பாய்வு'
    : lang === 'hi' ? 'छात्र मूल्यांकन समीक्षा'
    : 'Student Assessment Review';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-800">{heading}</h2>
      </div>
      <StudentAssessmentReview onReviewUpdate={onReviewUpdate} />
    </div>
  );
}
