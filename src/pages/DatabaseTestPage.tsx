import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DatabaseValidator } from '@/utils/databaseValidator';

export default function DatabaseTestPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    const runDatabaseTests = async () => {
      const results: Record<string, any> = {};

      // Test 1: Check database function status
      try {
        const functionStatus = await DatabaseValidator.getDatabaseStatus();
        results.databaseStatus = { 
          success: functionStatus.status === 'healthy', 
          status: functionStatus.status,
          existingFunctions: functionStatus.existingFunctions,
          totalFunctions: functionStatus.totalFunctions,
          missingFunctions: functionStatus.missingFunctions
        };
      } catch (err) {
        results.databaseStatus = { success: false, error: err };
      }

      // Test 2: Check if Holland Code questions table exists
      try {
        const { data, error } = await supabase.rpc('get_holland_code_questions');
        results.hollandCodeQuestions = { success: !error, data: data?.length || 0, error };
      } catch (err) {
        results.hollandCodeQuestions = { success: false, error: err };
      }

      // Test 3: Check if Inspiration questions table exists
      try {
        const { data, error } = await supabase.rpc('get_inspiration_questions');
        results.inspirationQuestions = { success: !error, data: data?.length || 0, error };
      } catch (err) {
        results.inspirationQuestions = { success: false, error: err };
      }

      // Test 4: Check inspiration videos for all 4 languages
      try {
        const langs = ['en', 'kn', 'ta', 'hi'] as const;
        const counts: Record<string, number> = {};
        let anyError: any = null;
        for (const lang of langs) {
          const { data, error } = await supabase.rpc('get_inspiration_videos', { p_lang: lang });
          if (error) { anyError = error; break; }
          counts[lang] = data?.length || 0;
        }
        const allHaveVideos = !anyError && Object.values(counts).every(n => n > 0);
        results.inspirationVideos = { success: allHaveVideos, counts, error: anyError };
      } catch (err) {
        results.inspirationVideos = { success: false, error: err };
      }

      // Test 5: Check if Dreams questions table exists
      try {
        const { data, error } = await supabase.rpc('get_dreams_questions');
        results.dreamsQuestions = { success: !error, data: data?.length || 0, error };
      } catch (err) {
        results.dreamsQuestions = { success: false, error: err };
      }

      // Test 6: Check if School Learning questions table exists
      try {
        const { data, error } = await supabase.rpc('get_school_learning_questions');
        results.schoolLearningQuestions = { success: !error, data: data?.length || 0, error };
      } catch (err) {
        results.schoolLearningQuestions = { success: false, error: err };
      }

      setTestResults(results);
    };

    runDatabaseTests();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="space-y-4">
        {Object.entries(testResults).map(([key, result]) => (
          <div key={key} className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h3>
            <div className={`p-2 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <strong>Status:</strong> {result.success ? '✅ SUCCESS' : '❌ FAILED'}
            </div>
            {result.data !== undefined && (
              <div className="mt-2">
                <strong>Data Count:</strong> {result.data}
              </div>
            )}
            {result.counts !== undefined && (
              <div className="mt-2">
                <strong>Counts:</strong> {Object.entries(result.counts).map(([l, n]) => `${l}:${n}`).join(', ')}
              </div>
            )}
            {result.error && (
              <div className="mt-2">
                <strong>Error:</strong> 
                <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-100 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>If you see "❌ FAILED" errors, run: <code className="bg-gray-200 px-1 rounded">supabase db push</code></li>
          <li>If data count is 0, the tables are empty and need to be populated</li>
          <li>If all tests show "✅ SUCCESS" with data &gt; 0, the database is working correctly</li>
        </ol>
      </div>
    </div>
  );
}
