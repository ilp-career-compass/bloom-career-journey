import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AssessmentService } from '@/services/assessmentService';
import { Badge } from '@/components/ui/badge';

export default function AssessmentTestPage() {
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    const runTests = async () => {
      try {
        setLoading(true);
        const results: any = {};

        // Test 1: Get Inspiration Assessment Template
        logger.log('Testing Inspiration Assessment Template...');
        const inspirationTemplate = await AssessmentService.getAssessmentTemplate('inspiration');
        results.inspirationTemplate = inspirationTemplate ? 'SUCCESS' : 'FAILED';
        logger.log('Inspiration Template:', inspirationTemplate);

        // Test 2: Get Inspiration Media Sources
        logger.log('Testing Inspiration Media Sources...');
        const inspirationMedia = await AssessmentService.getMediaSources('inspiration');
        results.inspirationMedia = inspirationMedia.length > 0 ? 'SUCCESS' : 'FAILED';
        logger.log('Inspiration Media:', inspirationMedia);

        // Test 3: Get Holland Code Data
        logger.log('Testing Holland Code Data...');
        const hollandData = await AssessmentService.getHollandCodeData();
        results.hollandData = hollandData ? 'SUCCESS' : 'FAILED';
        logger.log('Holland Code Data:', hollandData);

        // Test 4: Get Dreams Assessment Template
        logger.log('Testing Dreams Assessment Template...');
        const dreamsTemplate = await AssessmentService.getAssessmentTemplate('dreams');
        results.dreamsTemplate = dreamsTemplate ? 'SUCCESS' : 'FAILED';
        logger.log('Dreams Template:', dreamsTemplate);

        // Test 5: Get School Learning Assessment Template
        logger.log('Testing School Learning Assessment Template...');
        const schoolTemplate = await AssessmentService.getAssessmentTemplate('school_learning');
        results.schoolTemplate = schoolTemplate ? 'SUCCESS' : 'FAILED';
        logger.log('School Template:', schoolTemplate);

        // Test 6: Get All Assessment Templates
        logger.log('Testing All Assessment Templates...');
        const allTemplates = await AssessmentService.getAllAssessmentTemplates();
        results.allTemplates = allTemplates.length > 0 ? 'SUCCESS' : 'FAILED';
        logger.log('All Templates:', allTemplates);

        setTestResults(results);
      } catch (error) {
        logger.error('Test error:', error);
        setTestResults({ error: 'Test failed with error' });
      } finally {
        setLoading(false);
      }
    };

    runTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Running database tests...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    if (status === 'SUCCESS') return 'bg-green-100 text-green-800';
    if (status === 'FAILED') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Database Migration Test</CardTitle>
            <p className="text-gray-600">
              This page tests the database migration for assessment data.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(testResults).map(([test, result]) => (
                <div key={test} className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium capitalize">
                    {test.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <Badge className={getStatusColor(result as string)}>
                    {result}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Test Summary</h3>
              <p className="text-blue-800 text-sm">
                All tests should show "SUCCESS" if the database migration worked correctly.
                Check the browser console for detailed logs of the data being fetched.
              </p>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Run Tests Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
