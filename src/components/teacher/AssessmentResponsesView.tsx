import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Sparkles } from 'lucide-react';
import StudentAssessmentReview from './StudentAssessmentReview';
import AISummaryReview from './AISummaryReview';

interface AssessmentResponsesViewProps {
  onReviewUpdate?: () => void;
}

export default function AssessmentResponsesView({ onReviewUpdate }: AssessmentResponsesViewProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="student-review" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="student-review" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Student Assessment Review
          </TabsTrigger>
          <TabsTrigger value="ai-summary" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Summary Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student-review" className="mt-6">
          <StudentAssessmentReview onReviewUpdate={onReviewUpdate} />
        </TabsContent>

        <TabsContent value="ai-summary" className="mt-6">
          <AISummaryReview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
