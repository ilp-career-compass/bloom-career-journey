// Example component showing how to integrate AudioRecorder
// into the Inspiration Assessment

import React, { useState } from 'react';
import { AudioRecorder } from '@/components/ui/AudioRecorder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Type, CheckCircle } from 'lucide-react';

interface AudioResponseExampleProps {
  questionId: string;
  questionText: string;
  studentId: string;
  assessmentId: string;
  assessmentType: string;
  assessmentTitle: string;
  onResponseChange: (questionId: string, textResponse: string, audioBlob?: Blob) => void;
}

export function AudioResponseExample({
  questionId,
  questionText,
  studentId,
  assessmentId,
  assessmentType,
  assessmentTitle,
  onResponseChange,
}: AudioResponseExampleProps) {
  const [responseMode, setResponseMode] = useState<'text' | 'audio' | 'both'>('text');
  const [textResponse, setTextResponse] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');

  const handleAudioComplete = (blob: Blob, transcript?: string) => {
    setAudioBlob(blob);
    setTranscription(transcript || '');
    
    // Update parent with audio response
    onResponseChange(questionId, transcript || '', blob);
  };

  const handleTextChange = (value: string) => {
    setTextResponse(value);
    onResponseChange(questionId, value, audioBlob || undefined);
  };

  const hasResponse = textResponse.trim() !== '' || audioBlob !== null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{questionText}</span>
          {hasResponse && <CheckCircle className="w-5 h-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Choose how you'd like to respond to this question
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Response Mode Selector */}
        <div className="flex gap-2">
          <Button
            variant={responseMode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setResponseMode('text')}
            className="flex items-center gap-2"
          >
            <Type className="w-4 h-4" />
            Text Only
          </Button>
          <Button
            variant={responseMode === 'audio' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setResponseMode('audio')}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Audio Only
          </Button>
          <Button
            variant={responseMode === 'both' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setResponseMode('both')}
            className="flex items-center gap-2"
          >
            <Type className="w-4 h-4" />
            <Mic className="w-4 h-4" />
            Both
          </Button>
        </div>

        {/* Text Response */}
        {(responseMode === 'text' || responseMode === 'both') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Response
            </label>
            <Textarea
              placeholder="Type your response here..."
              value={textResponse}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>
        )}

        {/* Audio Response */}
        {(responseMode === 'audio' || responseMode === 'both') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio Response
            </label>
            <AudioRecorder
              questionId={questionId}
              onRecordingComplete={handleAudioComplete}
              studentId={studentId}
              assessmentId={assessmentId}
              assessmentType={assessmentType}
              assessmentTitle={assessmentTitle}
              enableTranscription={true}
              enableOfflineMode={true}
              maxDuration={120000} // 2 minutes
              language="en-IN"
            />
          </div>
        )}

        {/* Transcription Display */}
        {transcription && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Transcription:</h4>
            <p className="text-blue-700">{transcription}</p>
          </div>
        )}

        {/* Response Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={hasResponse ? "default" : "outline"}>
              {hasResponse ? "Response Complete" : "No Response"}
            </Badge>
            {audioBlob && (
              <Badge variant="secondary">
                Audio: {(audioBlob.size / 1024).toFixed(1)} KB
              </Badge>
            )}
            {transcription && (
              <Badge variant="secondary">
                Transcribed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AudioResponseExample;
