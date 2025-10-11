import React, { useState } from 'react';
import { AudioRecorder } from '@/components/ui/AudioRecorder';
import { AudioResponseExample } from '@/components/assessments/AudioResponseExample';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AudioTestPage() {
  const { userProfile } = useAuth();
  const [testResults, setTestResults] = useState<Array<{
    questionId: string;
    audioBlob: Blob | null;
    transcription: string;
    timestamp: string;
  }>>([]);

  const handleAudioComplete = (questionId: string, audioBlob: Blob, transcription?: string) => {
    setTestResults(prev => [...prev, {
      questionId,
      audioBlob,
      transcription: transcription || '',
      timestamp: new Date().toLocaleTimeString(),
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">🎙️ Audio Response Test</h1>
          <p className="text-blue-600 text-lg">
            Test the audio recording and transcription system
          </p>
          <p className="text-gray-600 mt-2">
            This page allows you to test the audio response functionality without needing a full assessment.
          </p>
        </div>

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Test Controls
            </CardTitle>
            <CardDescription>
              Test different audio recording scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
              <Badge variant="outline">
                {testResults.length} Test(s) Completed
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Basic AudioRecorder Test */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic AudioRecorder Test</CardTitle>
            <CardDescription>
              Test the core audio recording functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AudioRecorder
              questionId="test_question_1"
              onRecordingComplete={(audioBlob, transcription) => {
                handleAudioComplete('test_question_1', audioBlob, transcription);
              }}
              maxDuration={60000} // 1 minute for testing
              language="en-IN"
            />
          </CardContent>
        </Card>

        {/* Full AudioResponseExample Test */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Complete Audio Response Test</CardTitle>
            <CardDescription>
              Test the full audio response pipeline with text + audio options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AudioResponseExample
              questionId="test_question_2"
              questionText="What are your career aspirations? Please speak clearly about your dreams and goals."
              studentId={userProfile?.id || 'test-student-123'}
              assessmentId="test-assessment-456"
              assessmentType="inspiration"
              assessmentTitle="Test Inspiration Assessment"
              onResponseChange={(questionId, textResponse, audioBlob) => {
                if (audioBlob) {
                  handleAudioComplete(questionId, audioBlob, textResponse);
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Test Results
              </CardTitle>
              <CardDescription>
                Audio recordings and transcriptions from your tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Test #{index + 1} - {result.questionId}</h4>
                      <Badge variant="outline">{result.timestamp}</Badge>
                    </div>
                    
                    {result.audioBlob && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          Audio: {(result.audioBlob.size / 1024).toFixed(1)} KB
                        </p>
                        <audio controls className="w-full mt-2">
                          <source src={URL.createObjectURL(result.audioBlob)} type="audio/webm" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                    
                    {result.transcription && (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm font-medium text-blue-800 mb-1">Transcription:</p>
                        <p className="text-blue-700">{result.transcription}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Configuration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Google Speech API: Not configured (will show mock transcription)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Azure Speech API: Not configured (fallback disabled)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Audio Recording: Available (browser microphone)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Offline Mode: Enabled (local storage)</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This is a test environment. Audio will be recorded locally but 
                transcription will be simulated. To enable real transcription, configure the Google 
                Speech API key in your environment variables.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
