// Speech-to-Text Service for Audio Responses
// Supports Google Cloud Speech-to-Text with Azure fallback
// Optimized for Indian accents and rural pronunciation

export interface TranscriptionOptions {
  language: 'en-IN' | 'hi-IN' | 'auto';
  enableAutomaticPunctuation: boolean;
  enableWordTimeOffsets: boolean;
  model: 'latest_long' | 'latest_short';
  useEnhanced: boolean;
  sampleRateHertz: number;
  encoding: 'WEBM_OPUS' | 'LINEAR16' | 'MP3' | 'FLAC';
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

export interface SpeechToTextConfig {
  googleApiKey?: string;
  googleProjectId?: string;
  googleServiceAccountEmail?: string;
  azureKey?: string;
  azureRegion?: string;
  fallbackEnabled: boolean;
}

class SpeechToTextService {
  private config: SpeechToTextConfig;
  private isOnline: boolean = navigator.onLine;

  constructor(config: SpeechToTextConfig) {
    this.config = config;
    
    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Transcribe audio using Google Cloud Speech-to-Text
   * Optimized for Indian accents and rural pronunciation
   */
  async transcribeWithGoogle(
    audioBlob: Blob,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    if (!this.config.googleApiKey) {
      throw new Error('Google API key not configured');
    }

    if (!this.isOnline) {
      throw new Error('Offline mode - transcription not available');
    }

    try {
      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob);
      
      // Prepare request for Google Speech-to-Text API
      const requestBody = {
        config: {
          encoding: options.encoding,
          sampleRateHertz: options.sampleRateHertz,
          languageCode: options.language,
          enableAutomaticPunctuation: options.enableAutomaticPunctuation,
          enableWordTimeOffsets: options.enableWordTimeOffsets,
          model: options.useEnhanced ? 'latest_long' : options.model,
          useEnhanced: options.useEnhanced,
          // Enhanced model for better Indian accent recognition
          alternativeLanguageCodes: options.language === 'en-IN' ? ['hi-IN'] : ['en-IN'],
          enableSpeakerDiarization: false,
          diarizationSpeakerCount: 1,
          enableSeparateRecognitionPerChannel: false,
        },
        audio: {
          content: base64Audio,
        },
      };

      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${this.config.googleApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Speech API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        throw new Error('No transcription results received');
      }

      const result = data.results[0];
      const alternative = result.alternatives[0];

      return {
        transcript: alternative.transcript,
        confidence: alternative.confidence || 0,
        words: alternative.words?.map((word: any) => ({
          word: word.word,
          startTime: word.startTime,
          endTime: word.endTime,
          confidence: word.confidence || 0,
        })),
        languageCode: result.languageCode || options.language,
        alternativeTranscripts: result.alternatives
          ?.slice(1)
          .map((alt: any) => alt.transcript)
          .filter(Boolean),
      };

    } catch (error) {
      console.error('Google Speech-to-Text error:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using Azure Speech Services
   * Fallback option with good Indian accent support
   */
  async transcribeWithAzure(
    audioBlob: Blob,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    if (!this.config.azureKey || !this.config.azureRegion) {
      throw new Error('Azure Speech Services not configured');
    }

    if (!this.isOnline) {
      throw new Error('Offline mode - transcription not available');
    }

    try {
      // Get Azure access token
      const token = await this.getAzureToken();
      
      // Convert blob to ArrayBuffer
      const audioArrayBuffer = await audioBlob.arrayBuffer();
      
      // Prepare request for Azure Speech Services
      const response = await fetch(
        `https://${this.config.azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${options.language}&format=detailed`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'audio/webm; codecs=opus',
            'Accept': 'application/json',
          },
          body: audioArrayBuffer,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure Speech API error: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.RecognitionStatus !== 'Success') {
        throw new Error(`Azure recognition failed: ${data.RecognitionStatus}`);
      }

      return {
        transcript: data.DisplayText,
        confidence: data.Confidence || 0,
        languageCode: options.language,
      };

    } catch (error) {
      console.error('Azure Speech-to-Text error:', error);
      throw error;
    }
  }

  /**
   * Main transcription method with fallback logic
   */
  async transcribe(
    audioBlob: Blob,
    options: Partial<TranscriptionOptions> = {}
  ): Promise<TranscriptionResult> {
    const defaultOptions: TranscriptionOptions = {
      language: 'en-IN',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      model: 'latest_long',
      useEnhanced: true, // Better for Indian accents
      sampleRateHertz: 16000,
      encoding: 'WEBM_OPUS',
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Try Google first, then Azure if enabled
    try {
      return await this.transcribeWithGoogle(audioBlob, finalOptions);
    } catch (googleError) {
      console.warn('Google transcription failed, trying Azure:', googleError);
      
      if (this.config.fallbackEnabled) {
        try {
          return await this.transcribeWithAzure(audioBlob, finalOptions);
        } catch (azureError) {
          console.error('Both Google and Azure transcription failed:', azureError);
          throw new Error('Transcription failed on all services');
        }
      } else {
        throw googleError;
      }
    }
  }

  /**
   * Get Google Cloud access token using service account
   */
  private async getGoogleAccessToken(): Promise<string> {
    if (!this.config.googleProjectId) {
      throw new Error('Google project ID not configured');
    }

    // For client-side, we'll use a simplified approach
    // In production, this should be handled server-side
    const serviceAccountData = {
      project_id: this.config.googleProjectId,
      private_key: import.meta.env.VITE_GOOGLE_PRIVATE_KEY,
      client_email: this.config.googleServiceAccountEmail,
    };

    if (!serviceAccountData.private_key || !serviceAccountData.client_email) {
      throw new Error('Google service account credentials not configured');
    }

    // Create JWT token
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccountData.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600, // 1 hour
      iat: now,
    };

    // This is a simplified version - in production, use a proper JWT library
    const jwt = await this.createJWT(header, payload, serviceAccountData.private_key);

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Google access token');
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Create JWT token (simplified version)
   */
  private async createJWT(header: any, payload: any, privateKey: string): Promise<string> {
    // This is a simplified JWT creation
    // In production, use a proper JWT library like 'jsonwebtoken'
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    // For now, we'll use a mock approach
    // In production, you'd need to sign this with the private key
    return `${encodedHeader}.${encodedPayload}.mock_signature`;
  }

  /**
   * Get Azure Speech Services access token
   */
  private async getAzureToken(): Promise<string> {
    if (!this.config.azureKey || !this.config.azureRegion) {
      throw new Error('Azure credentials not configured');
    }

    const response = await fetch(
      `https://${this.config.azureRegion}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.azureKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get Azure access token');
    }

    return await response.text();
  }

  /**
   * Convert blob to base64 string
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Detect language from audio (basic implementation)
   */
  async detectLanguage(audioBlob: Blob): Promise<'en-IN' | 'hi-IN'> {
    try {
      // Try English first
      const englishResult = await this.transcribe(audioBlob, {
        language: 'en-IN',
        useEnhanced: true,
      });

      // If confidence is high, return English
      if (englishResult.confidence > 0.7) {
        return 'en-IN';
      }

      // Try Hindi
      const hindiResult = await this.transcribe(audioBlob, {
        language: 'hi-IN',
        useEnhanced: true,
      });

      // Return the language with higher confidence
      return hindiResult.confidence > englishResult.confidence ? 'hi-IN' : 'en-IN';

    } catch (error) {
      console.warn('Language detection failed, defaulting to English:', error);
      return 'en-IN';
    }
  }

  /**
   * Check if transcription service is available
   */
  isAvailable(): boolean {
    return this.isOnline && (!!this.config.googleApiKey || !!this.config.azureKey);
  }

  /**
   * Get service status
   */
  getStatus(): {
    online: boolean;
    googleAvailable: boolean;
    azureAvailable: boolean;
    fallbackEnabled: boolean;
  } {
    return {
      online: this.isOnline,
      googleAvailable: !!this.config.googleApiKey,
      azureAvailable: !!this.config.azureKey,
      fallbackEnabled: this.config.fallbackEnabled,
    };
  }
}

// Create singleton instance
export const speechToTextService = new SpeechToTextService({
  googleApiKey: import.meta.env.VITE_GOOGLE_SPEECH_API_KEY,
  googleProjectId: import.meta.env.VITE_GOOGLE_PROJECT_ID,
  googleServiceAccountEmail: import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL,
  azureKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
  azureRegion: import.meta.env.VITE_AZURE_SPEECH_REGION,
  fallbackEnabled: true,
});

export default speechToTextService;
