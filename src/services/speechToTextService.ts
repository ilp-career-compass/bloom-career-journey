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
      
      // Prepare request for Google Speech-to-Text API (v1 compatible payload)
      // Add domain phrase hints to improve recognition for assessment context
      const PHRASE_HINTS = [
        // General assessment words
        'inspiration', 'inspirational', 'motivated', 'motivation', 'values', 'qualities', 'characters', 'yourself',
        'video', 'audio', 'lesson', 'learn', 'learning', 'habit', 'action', 'thoughts', 'situation',
        'answer', 'response', 'question', 'record', 'speak clearly',
        // Prompts phrasing
        'which parts did you like most', 'find most inspirational',
        'what can you learn from this video or audio',
        'what actions or habits will you try',
        'how will this change the way you think feel or behave',
        'which qualities of the characters do you identify in yourself',
        // Common confusions (bias the correct words)
        'this', 'that', 'they', 'them', 'with', 'the', 'you', 'your', 'identify', 'qualities', 'characters'
      ];

      const config: any = {
        encoding: options.encoding,
        sampleRateHertz: options.sampleRateHertz,
        languageCode: options.language,
        enableAutomaticPunctuation: options.enableAutomaticPunctuation,
        enableWordTimeOffsets: options.enableWordTimeOffsets,
        maxAlternatives: 3,
        speechContexts: [
          {
            phrases: PHRASE_HINTS,
            boost: 15.0,
          },
        ],
      };

      // Do not set model/useEnhanced; many languages (e.g., en-IN) aren't supported by enhanced models

      // Google v1 expects sampleRateHertz to either be omitted or match the file header.
      // Our recorder uses WEBM OPUS @ 48000 Hz; when using WEBM_OPUS, omit sampleRateHertz.
      if (options.encoding === 'WEBM_OPUS') {
        delete config.sampleRateHertz;
      }

      const requestBody = {
        config,
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

      // Flatten alternatives across results and pick the best by confidence, then by length
      let bestAlt: any = null;
      for (const res of data.results) {
        for (const alt of (res.alternatives || [])) {
          if (!bestAlt) {
            bestAlt = alt;
            continue;
          }
          const bestScore = (bestAlt.confidence || 0) + ((bestAlt.transcript?.length || 0) / 10000);
          const altScore = (alt.confidence || 0) + ((alt.transcript?.length || 0) / 10000);
          if (altScore > bestScore) {
            bestAlt = alt;
          }
        }
      }

      return {
        transcript: this.postProcessTranscript(bestAlt?.transcript || '', bestAlt?.confidence || 0, options.language),
        confidence: bestAlt?.confidence || 0,
        words: bestAlt?.words?.map((word: any) => ({
          word: word.word,
          startTime: word.startTime,
          endTime: word.endTime,
          confidence: word.confidence || 0,
        })),
        languageCode: options.language,
        alternativeTranscripts: (data.results?.[0]?.alternatives || [])
          .map((alt: any) => alt.transcript)
          .filter(Boolean),
      };

    } catch (error) {
      console.error('Google Speech-to-Text error:', error);
      throw error;
    }
  }

  /**
   * Light post-processing for common Indian-English phonetic spellings.
   * Only replaces whole-word matches to avoid overcorrection.
   */
  private postProcessTranscript(text: string, confidence: number, language: string): string {
    if (!text || language !== 'en-IN') return text;
    const MAP: Record<string, string> = {
      'dis': 'this',
      'dat': 'that',
      'dey': 'they',
      'dem': 'them',
      'wid': 'with',
      'wit': 'with',
      'wiv': 'with',
      'da': 'the',
      'd': 'the',
      'aur': 'or',
      'u': 'you',
      'ur': 'your',
      'abt': 'about',
      'rite': 'write',
      'ryt': 'write',
      'med': 'made',
    };

    const parts = text.split(/(\b)/);
    const fixed = parts.map(part => {
      const low = part.toLowerCase();
      if (!/^[A-Za-z]+$/.test(part)) return part;
      const rep = MAP[low];
      if (!rep) return part;
      if (part[0] === part[0].toUpperCase() && part.slice(1) === part.slice(1).toLowerCase()) {
        return rep.charAt(0).toUpperCase() + rep.slice(1);
      }
      return rep;
    }).join('');

    return fixed;
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
      model: 'latest_short',
      useEnhanced: false,
      sampleRateHertz: 48000,
      encoding: 'WEBM_OPUS',
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Try Google first, then Azure if enabled
    try {
      return await this.transcribeWithGoogle(audioBlob, finalOptions);
    } catch (googleError) {
      console.warn('Google transcription failed, trying Azure:', googleError);
      
      if (this.config.fallbackEnabled && this.config.azureKey && this.config.azureRegion) {
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
   * Long-running transcription using Google v1 operations API with a URI.
   * Expects a gs:// or public https URL. Suitable for >60s audio.
   */
  async transcribeLongRunningByUri(
    fileUri: string,
    options: Partial<TranscriptionOptions> = {}
  ): Promise<TranscriptionResult> {
    if (!this.config.googleApiKey) {
      throw new Error('Google API key not configured');
    }
    if (!this.isOnline) {
      throw new Error('Offline mode - transcription not available');
    }

    const finalOptions: TranscriptionOptions = {
      language: 'en-IN',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      model: 'latest_short',
      useEnhanced: false,
      sampleRateHertz: 48000,
      encoding: 'WEBM_OPUS',
      ...options,
    };

    // Kick off operation
    const startBody: any = {
      config: {
        encoding: finalOptions.encoding,
        languageCode: finalOptions.language,
        enableAutomaticPunctuation: finalOptions.enableAutomaticPunctuation,
        enableWordTimeOffsets: finalOptions.enableWordTimeOffsets,
        maxAlternatives: 3,
        speechContexts: [
          {
            phrases: [
              'inspiration','motivated','values','qualities','characters','identify','yourself','video','audio','question','response','answer','learn','learning'
            ],
            boost: 15.0,
          },
        ],
      },
      audio: {
        uri: fileUri,
      },
    };

    const startResp = await fetch(`https://speech.googleapis.com/v1/speech:longrunningrecognize?key=${this.config.googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(startBody),
      }
    );

    if (!startResp.ok) {
      const err = await startResp.text();
      throw new Error(`Failed to start long-running recognize: ${err}`);
    }
    const startData = await startResp.json();
    const operationName = startData?.name;
    if (!operationName) throw new Error('No operation name returned by Google STT');

    // Poll operation until done (simple polling with backoff)
    const pollUrl = `https://speech.googleapis.com/v1/operations/${operationName}?key=${this.config.googleApiKey}`;
    const startTime = Date.now();
    let delay = 1000;
    while (true) {
      await new Promise(r => setTimeout(r, delay));
      const pollResp = await fetch(pollUrl);
      const op = await pollResp.json();
      if (op?.done) {
        const data = op.response;
        if (!data?.results || data.results.length === 0) {
          throw new Error('No transcription results received');
        }
        // Pick best alternative across results
        let bestAlt: any = null;
        for (const res of data.results) {
          for (const alt of (res.alternatives || [])) {
            if (!bestAlt) { bestAlt = alt; continue; }
            const bestScore = (bestAlt.confidence || 0) + ((bestAlt.transcript?.length || 0) / 10000);
            const altScore = (alt.confidence || 0) + ((alt.transcript?.length || 0) / 10000);
            if (altScore > bestScore) bestAlt = alt;
          }
        }
        return {
          transcript: this.postProcessTranscript(bestAlt?.transcript || '', bestAlt?.confidence || 0, finalOptions.language),
          confidence: bestAlt?.confidence || 0,
          languageCode: finalOptions.language,
          alternativeTranscripts: (data.results?.[0]?.alternatives || []).map((a: any) => a.transcript).filter(Boolean),
        };
      }
      // increase delay up to 5s, timeout after 60s
      delay = Math.min(delay + 500, 5000);
      if (Date.now() - startTime > 60000) {
        throw new Error('Transcription operation timed out');
      }
    }
  }

  /**
   * Auto-detect between multiple Indian languages by trying each and choosing best by confidence/length
   */
  async transcribeAutoDetect(audioBlob: Blob): Promise<TranscriptionResult> {
    const candidateLanguages: Array<'en-IN' | 'hi-IN' | 'ta-IN' | 'te-IN' | 'kn-IN'> = [
      'en-IN', 'hi-IN', 'ta-IN', 'te-IN', 'kn-IN'
    ];

    let best: TranscriptionResult | null = null;
    let bestScore = -1;

    for (const lang of candidateLanguages) {
      try {
        const res = await this.transcribeWithGoogle(audioBlob, {
          language: lang,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          model: 'latest_short',
          useEnhanced: false,
          sampleRateHertz: 48000,
          encoding: 'WEBM_OPUS',
        });

        const score = (res.confidence ?? 0) + ((res.transcript?.length ?? 0) / 10000);
        if (score > bestScore) {
          best = res;
          bestScore = score;
        }
      } catch (e) {
        // Continue with next language
      }
    }

    if (!best) {
      throw new Error('No transcription available for any candidate language');
    }
    return best;
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

