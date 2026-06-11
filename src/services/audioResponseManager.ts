import { logger } from '@/lib/logger';

// Audio Response Manager
// Integrates audio recording, transcription, and storage
// Handles offline queuing and sync for rural students

import { supabase } from '@/integrations/supabase/client';
import { speechToTextService } from './speechToTextService';
import { supabaseUploadService } from './supabaseUploadService';
import { transcriptCleanupService } from './transcriptCleanupService';

export interface AudioResponseData {
  questionId: string;
  audioBlob: Blob;
  transcription?: string;
  confidence?: number;
  languageDetected?: string;
  duration: number;
  fileSize: number;
  contextPhrases?: string[];
  queuedAt?: number;
}

export interface AudioResponseResult {
  success: boolean;
  audioUrl?: string;
  transcription?: string;
  confidence?: number;
  languageDetected?: string;
  error?: string;
  metadata?: {
    duration: number;
    fileSize: number;
    uploadedAt: string;
  };
}

export interface AudioResponseConfig {
  studentId: string;
  assessmentId: string;
  assessmentType: string;
  assessmentTitle: string;
  enableTranscription: boolean;
  enableOfflineMode: boolean;
  language?: string; // Language code for transcription (e.g., 'en-IN', 'kn-IN', 'auto')
}

class AudioResponseManager {
  private config: AudioResponseConfig | null = null;
  private offlineQueue: AudioResponseData[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Initialize the manager with configuration
   */
  initialize(config: AudioResponseConfig): void {
    this.config = config;
  }

  /**
   * Process audio response (record, transcribe, upload, save)
   */
  async processAudioResponse(
    audioData: AudioResponseData,
    onProgress?: (progress: number) => void
  ): Promise<AudioResponseResult> {
    if (!this.config) {
      throw new Error('AudioResponseManager not initialized');
    }

    try {
      onProgress?.(10);

      // Step 1: Upload audio file
      const uploadResult = await this.uploadAudioFile(audioData, (progress) => {
        onProgress?.(10 + (progress * 0.4)); // 10-50% for upload
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      onProgress?.(50);

      // Step 2: Transcribe audio if enabled and online
      let transcription = audioData.transcription;
      let confidence = audioData.confidence;
      let languageDetected = audioData.languageDetected;
      let cleanedTranscription: string | undefined;

      if (this.config.enableTranscription && this.isOnline && !transcription) {
        try {
          // Determine transcription language
          // Support Kannada (kn-IN), Hindi (hi-IN), English (en-IN), or auto-detect
          let transcriptionLanguage: 'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'te-IN' | 'auto' = 'en-IN';
          if (this.config.language) {
            if (this.config.language === 'kn-IN' || this.config.language === 'kn') {
              transcriptionLanguage = 'kn-IN'; // Use Kannada for Kannada audio
            } else if (this.config.language === 'hi-IN' || this.config.language === 'hi') {
              transcriptionLanguage = 'hi-IN';
            } else if (this.config.language === 'ta-IN' || this.config.language === 'ta') {
              transcriptionLanguage = 'ta-IN';
            } else if (this.config.language === 'te-IN' || this.config.language === 'te') {
              transcriptionLanguage = 'te-IN';
            } else if (this.config.language === 'auto') {
              transcriptionLanguage = 'auto';
            } else {
              transcriptionLanguage = 'en-IN'; // Default to English
            }
          }

          let transcriptionResult;
          // If over 60s, use long-running recognize with the uploaded URL
          if (audioData.duration > 60000) {
            try {
              // Use the public URL we just uploaded
              logger.log('🎤 Starting long-running transcription for audio > 60s:', {
                url: uploadResult.url,
                duration: audioData.duration,
                language: transcriptionLanguage
              });
              transcriptionResult = await speechToTextService.transcribeLongRunningByUri(
                uploadResult.url!,
                {
                  language: transcriptionLanguage,
                  contextPhrases: audioData.contextPhrases
                }
              );
            } catch (longRunError) {
              logger.warn('⚠️ Long-running transcription failed, attempting Gemini fallback:', longRunError);
              // Fallback to Gemini directly, which handles larger context/files well
              transcriptionResult = await speechToTextService.transcribeWithGemini(
                audioData.audioBlob,
                {
                  language: transcriptionLanguage,
                  enableAutomaticPunctuation: true,
                  enableWordTimeOffsets: true,
                  model: 'latest_long', // Gemini doesn't use this but satisfying the interface
                  useEnhanced: true,
                  sampleRateHertz: 48000,
                  encoding: 'WEBM_OPUS'
                }
              );
            }
          } else {
            logger.log('🎤 Starting standard transcription:', {
              blobSize: audioData.audioBlob.size,
              blobType: audioData.audioBlob.type,
              duration: audioData.duration,
              language: transcriptionLanguage
            });
            transcriptionResult = await speechToTextService.transcribe(
              audioData.audioBlob,
              {
                language: transcriptionLanguage,
                contextPhrases: audioData.contextPhrases
              }
            );
          }

          logger.log('✅ Transcription completed:', {
            transcriptLength: transcriptionResult.transcript?.length || 0,
            confidence: transcriptionResult.confidence,
            languageCode: transcriptionResult.languageCode,
            preview: transcriptionResult.transcript?.substring(0, 100) || 'empty'
          });

          transcription = transcriptionResult.transcript;
          confidence = transcriptionResult.confidence;
          languageDetected = transcriptionResult.languageCode;

          // Optional AI cleanup using Gemini (non-blocking fallback to raw on error)
          try {
            const cleaned = await transcriptCleanupService.clean(
              transcription || '',
              languageDetected || 'en-IN'
            );
            cleanedTranscription = cleaned.cleanedText?.trim() || transcription || undefined;
          } catch { }

          onProgress?.(80);
        } catch (error) {
          logger.error('❌ Transcription failed:', error);

          // Log helpful error message for missing API keys
          if (error instanceof Error) {
            if (error.message.includes('Batch STT not available') || error.message.includes('Transcription failed')) {
              logger.error('❌ Transcription Error: Batch STT not available — use Sarvam streaming for real-time transcription.');
            } else {
              // Log other transcription errors with full details
              logger.error('❌ Transcription Error Details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
              });
            }
          } else {
            logger.error('❌ Unknown transcription error:', error);
          }

          // Continue without transcription - don't fail the entire audio save process
          // The audio will still be saved, just without transcription
        }
      }

      // Step 3: Save to database
      const dbResult = await this.saveAudioResponse({
        questionId: audioData.questionId,
        audioUrl: uploadResult.url!,
        transcription: cleanedTranscription || transcription,
        confidence,
        languageDetected,
        duration: audioData.duration,
        fileSize: audioData.fileSize,
      });

      if (!dbResult.success) {
        logger.warn('Database save failed, but continuing:', dbResult.error);
        // Don't throw error for RLS policy issues, just log it
        if (dbResult.error?.includes('row-level security policy')) {
          logger.log('RLS policy error ignored - continuing without database save');
        } else {
          throw new Error(dbResult.error || 'Database save failed');
        }
      }

      onProgress?.(100);

      return {
        success: true,
        audioUrl: uploadResult.url,
        transcription: cleanedTranscription || transcription, // Use cleaned transcription if available
        confidence,
        languageDetected,
        metadata: {
          duration: audioData.duration,
          fileSize: audioData.fileSize,
          uploadedAt: new Date().toISOString(),
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Queue on any failure when offline mode is enabled — not just when
      // the device reports offline, so transient network blips are also retried.
      if (this.config.enableOfflineMode) {
        this.queueOfflineResponse(audioData);

        return {
          success: true,
          error: 'Queued for retry',
          metadata: {
            duration: audioData.duration,
            fileSize: audioData.fileSize,
            uploadedAt: new Date().toISOString(),
          },
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload audio file to Supabase Storage
   */
  private async uploadAudioFile(
    audioData: AudioResponseData,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const filePath = `audio-responses/${this.config!.studentId}/${this.config!.assessmentId}/${audioData.questionId}_${Date.now()}.webm`;

    try {
      const result = await supabaseUploadService.uploadFile({
        bucket: 'audio-files',
        path: filePath,
        file: audioData.audioBlob,
        chunkSize: 512 * 1024, // 512KB chunks for audio
        maxRetries: 3,
        onProgress,
        onError: (error) => {
          logger.error('Upload error:', error);
        },
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Save audio response to database
   */
  private async saveAudioResponse(data: {
    questionId: string;
    audioUrl: string;
    transcription?: string;
    confidence?: number;
    languageDetected?: string;
    duration: number;
    fileSize: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // For testing, skip database save if using test data
      logger.log('saveAudioResponse called with studentId:', this.config!.studentId);
      if (this.config!.studentId === 'test-student-123') {
        logger.log('Test mode: Skipping database save for audio file');
        return { success: true };
      }

      // Update assessment_responses.audio_responses if the column exists
      try {
        const audioResponseData = {
          [data.questionId]: {
            text: data.transcription || '',
            audio_url: data.audioUrl,
            audio_duration: data.duration,
            file_size: data.fileSize,
            language_detected: data.languageDetected,
            confidence_score: data.confidence,
            uploaded_at: new Date().toISOString(),
          },
        };

        // For testing, skip assessment_responses update if using test data
        if (this.config!.assessmentId === 'test-assessment-456') {
          logger.log('Test mode: Skipping assessment_responses update');
          return { success: true };
        }

        // Try selecting the column; if it doesn't exist, PostgREST returns undefined_column
        const { data: existingData, error: fetchError } = await supabase
          .from('assessment_responses')
          .select('audio_responses')
          .eq('id', this.config!.assessmentId)
          .single();

        // If column missing, skip gracefully
        if (fetchError && (fetchError.code === '42703' || (fetchError.message || '').includes('audio_responses'))) {
          logger.warn('audio_responses column missing, skipping column update');
          return { success: true };
        }

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        const existingAudioResponses = existingData?.audio_responses || {};
        const updatedAudioResponses = {
          ...existingAudioResponses,
          ...audioResponseData,
        };

        const { error: updateError } = await supabase
          .from('assessment_responses')
          .update({
            audio_responses: updatedAudioResponses,
            updated_at: new Date().toISOString(),
          })
          .eq('id', this.config!.assessmentId);

        // If column missing on update, skip gracefully
        if (updateError && (updateError.code === '42703' || (updateError.message || '').includes('audio_responses'))) {
          logger.warn('audio_responses column missing on update, skipping');
        } else if (updateError) {
          throw updateError;
        }
      } catch (colError: any) {
        // Do not fail the whole save for column-related issues
        if (!(colError?.code === '42703' || (colError?.message || '').includes('audio_responses'))) {
          throw colError;
        }
        logger.warn('Skipping audio_responses update due to column error:', colError);
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database save failed',
      };
    }
  }

  /**
   * Queue audio response for offline sync
   */
  private queueOfflineResponse(audioData: AudioResponseData): void {
    this.offlineQueue.push({ ...audioData, queuedAt: Date.now() });
    // Blobs cannot be serialized to localStorage — queue is in-memory only.
    // Items survive connectivity blips within a session but not page reloads.
  }

  /**
   * Load offline queue from localStorage
   */
  loadOfflineQueue(): void {
    if (!this.config) return;
    // Remove any stale serialized queue entries written by the old (broken) code,
    // which serialized Blob fields as {} and would fail silently on sync.
    localStorage.removeItem(`audio_queue_${this.config.studentId}`);
  }

  /**
   * Sync offline queue when online
   */
  async syncOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    logger.log(`Syncing ${this.offlineQueue.length} offline audio responses...`);

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const audioData of queue) {
      try {
        await this.processAudioResponse(audioData);
        logger.log(`Synced audio response: ${audioData.questionId}`);
      } catch (error) {
        logger.error(`Failed to sync audio response ${audioData.questionId}:`, error);
        // Re-queue failed items
        this.offlineQueue.push(audioData);
      }
    }

    // Queue is in-memory only (Blobs can't serialize); clear any stale localStorage entry.
    localStorage.removeItem(`audio_queue_${this.config!.studentId}`);
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus(): {
    count: number;
    totalSize: number;
    oldestItem?: string;
  } {
    const totalSize = this.offlineQueue.reduce((sum, item) => sum + item.fileSize, 0);
    const oldestItem = this.offlineQueue.length > 0
      ? new Date(Math.min(...this.offlineQueue.map(item => item.queuedAt ?? Date.now()))).toISOString()
      : undefined;

    return {
      count: this.offlineQueue.length,
      totalSize,
      oldestItem,
    };
  }

  /**
   * Get audio response statistics for a student
   */
  async getAudioResponseStats(): Promise<{
    totalResponses: number;
    totalDuration: number;
    avgConfidence: number;
    languagesUsed: string[];
    uploadSuccessRate: number;
  } | null> {
    if (!this.config) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_audio_response_stats', { student_uuid: this.config.studentId });

      if (error) throw error;

      return data[0] || {
        total_responses: 0,
        total_duration_ms: 0,
        avg_confidence_score: 0,
        languages_used: [],
        upload_success_rate: 0,
      };
    } catch (error) {
      logger.error('Failed to get audio response stats:', error);
      return null;
    }
  }

  /**
   * Get audio summary for an assessment
   */
  async getAssessmentAudioSummary(): Promise<Array<{
    questionId: string;
    hasAudio: boolean;
    audioDuration: number;
    transcription: string;
    confidence: number;
    languageDetected: string;
  }> | null> {
    if (!this.config) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_assessment_audio_summary', { assessment_uuid: this.config.assessmentId });

      if (error) throw error;

      return data.map((item: any) => ({
        questionId: item.question_id,
        hasAudio: item.has_audio,
        audioDuration: item.audio_duration_ms,
        transcription: item.transcription,
        confidence: item.confidence_score,
        languageDetected: item.language_detected,
      }));
    } catch (error) {
      logger.error('Failed to get assessment audio summary:', error);
      return null;
    }
  }
}

// Create singleton instance
export const audioResponseManager = new AudioResponseManager();

export default audioResponseManager;
