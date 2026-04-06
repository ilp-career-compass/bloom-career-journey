import { logger } from '@/lib/logger';

// Speech-to-Text Service
// Google Cloud STT, Azure STT, and Gemini STT paths removed.
// Real-time transcription is handled exclusively by Sarvam streaming (sarvamStreamingService.ts).

export interface TranscriptionOptions {
  language: 'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'te-IN' | 'auto';
  enableAutomaticPunctuation: boolean;
  enableWordTimeOffsets: boolean;
  model: 'latest_long' | 'latest_short';
  useEnhanced: boolean;
  sampleRateHertz: number;
  encoding: 'WEBM_OPUS' | 'LINEAR16' | 'MP3' | 'FLAC';
  contextPhrases?: string[];
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words?: Array<{
    word: string;
    startTime: string;
    endTime: string;
    confidence: number;
  }>;
  languageCode: string;
  alternativeTranscripts?: string[];
}

class SpeechToTextService {
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => { this.isOnline = true; });
    window.addEventListener('offline', () => { this.isOnline = false; });
    logger.log('[SpeechToText] Sarvam-only mode — batch STT paths removed');
  }

  isGoogleConfigured(): boolean {
    return false; // Batch Google STT removed — use Sarvam streaming
  }

  isAzureConfigured(): boolean {
    return false; // Azure STT removed — use Sarvam streaming
  }

  isAvailable(): boolean {
    return false; // Batch STT removed — use Sarvam streaming
  }

  getStatus() {
    return {
      online: this.isOnline,
      googleAvailable: false,
      azureAvailable: false,
      fallbackEnabled: false,
    };
  }

  async transcribe(
    _audioBlob: Blob,
    _options: Partial<TranscriptionOptions> = {}
  ): Promise<TranscriptionResult> {
    throw new Error('Batch STT not available — use Sarvam streaming (sarvamStreamingService)');
  }

  async transcribeWithGemini(
    _audioBlob: Blob,
    _options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    throw new Error('Batch STT not available — use Sarvam streaming (sarvamStreamingService)');
  }

  async transcribeLongRunningByUri(
    _fileUri: string,
    _options: Partial<TranscriptionOptions> = {}
  ): Promise<TranscriptionResult> {
    throw new Error('Batch STT not available — use Sarvam streaming (sarvamStreamingService)');
  }
}

export const speechToTextService = new SpeechToTextService();
