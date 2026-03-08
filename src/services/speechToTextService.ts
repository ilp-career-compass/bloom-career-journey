import { logger } from '@/lib/logger';

// Speech-to-Text Service for Audio Responses
// Supports Google Cloud Speech-to-Text with Azure fallback
// Optimized for Indian accents and rural pronunciation

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
  private geminiKey?: string;

  constructor(config?: SpeechToTextConfig) {
    // If no config provided, load from environment variables (same pattern as Gemini)
    if (!config) {
      // Read environment variables directly (same as Gemini does)
      const googleApiKey = (import.meta.env as any).VITE_GOOGLE_SPEECH_API_KEY;
      const azureKey = (import.meta.env as any).VITE_AZURE_SPEECH_KEY;

      // Log immediately when constructor runs
      logger.log('🔑 [SpeechToText] Constructor called - Loading API keys from environment');
      logger.log('🔑 [SpeechToText] Environment check:', {
        googleApiKey: googleApiKey ? `${String(googleApiKey).substring(0, 15)}...` : '❌ NOT SET',
        googleApiKeyLength: googleApiKey?.length || 0,
        azureKey: azureKey ? 'SET' : 'NOT SET',
        allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('GOOGLE') || k.includes('SPEECH')),
      });

      this.config = {
        googleApiKey: googleApiKey ? String(googleApiKey).trim() : undefined,
        googleProjectId: (import.meta.env as any).VITE_GOOGLE_PROJECT_ID,
        googleServiceAccountEmail: (import.meta.env as any).VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL,
        azureKey: azureKey ? String(azureKey).trim() : undefined,
        azureRegion: (import.meta.env as any).VITE_AZURE_SPEECH_REGION,
        fallbackEnabled: true,
      };

      // Load Gemini key for fallback
      this.geminiKey = (import.meta.env as any).VITE_GEMINI_API_KEY;

      logger.log('🔑 [SpeechToText] Config initialized:', {
        hasGoogleKey: !!this.config.googleApiKey,
        googleKeyLength: this.config.googleApiKey?.length || 0,
        hasAzureKey: !!this.config.azureKey,
      });
    } else {
      this.config = config;
    }

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Check if Google API is configured (same pattern as Gemini)
   */
  isGoogleConfigured(): boolean {
    return !!this.config.googleApiKey && this.config.googleApiKey.trim().length > 0;
  }

  /**
   * Check if Azure API is configured
   */
  isAzureConfigured(): boolean {
    return !!this.config.azureKey && !!this.config.azureRegion;
  }

  /**
   * Transcribe audio using Google Cloud Speech-to-Text
   * Optimized for Indian accents and rural pronunciation
   */
  async transcribeWithGoogle(
    audioBlob: Blob,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    logger.log('🎤 [transcribeWithGoogle] Starting transcription:', {
      blobSize: audioBlob.size,
      blobType: audioBlob.type,
      language: options.language,
      encoding: options.encoding,
      sampleRate: options.sampleRateHertz
    });

    if (!this.isGoogleConfigured()) {
      logger.error('❌ [transcribeWithGoogle] Google API key not configured');
      logger.error('📝 Current config:', {
        hasKey: !!this.config.googleApiKey,
        keyLength: this.config.googleApiKey?.length || 0,
        envVar: import.meta.env.VITE_GOOGLE_SPEECH_API_KEY ? 'SET' : 'NOT SET',
        envVarValue: import.meta.env.VITE_GOOGLE_SPEECH_API_KEY ? `${import.meta.env.VITE_GOOGLE_SPEECH_API_KEY.substring(0, 15)}...` : 'undefined',
      });
      throw new Error('Google API key not configured');
    }

    // Additional validation - check if key looks valid
    if (this.config.googleApiKey && this.config.googleApiKey.length < 20) {
      logger.warn('⚠️ [transcribeWithGoogle] API key seems too short. Expected ~39 characters for Google API key.');
    }

    if (!this.isOnline) {
      logger.warn('⚠️ [transcribeWithGoogle] Offline mode - transcription not available');
      throw new Error('Offline mode - transcription not available');
    }

    // Validate audio blob
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Invalid audio blob: empty or null');
    }

    try {
      // Convert blob to base64
      logger.log('🔄 [transcribeWithGoogle] Converting blob to base64...');
      const base64Audio = await this.blobToBase64(audioBlob);
      logger.log('✅ [transcribeWithGoogle] Blob converted, base64 length:', base64Audio.length);

      // Prepare request for Google Speech-to-Text API (v1 compatible payload)
      // Add domain phrase hints to improve recognition for assessment context
      // Use language-appropriate hints
      const PHRASE_HINTS = options.language === 'kn-IN' ? [
        // Kannada assessment words (in Kannada script)
        'ಪ್ರೇರಣೆ', 'ಪ್ರೇರೇಪಿಸು', 'ಮೌಲ್ಯಗಳು', 'ಗುಣಗಳು', 'ಪಾತ್ರಗಳು', 'ನೀವು', 'ನಿಮ್ಮ',
        'ವೀಡಿಯೊ', 'ಆಡಿಯೊ', 'ಪಾಠ', 'ಕಲಿ', 'ಕಲಿಕೆ', 'ಅಭ್ಯಾಸ', 'ಕ್ರಿಯೆ', 'ಯೋಚನೆಗಳು', 'ಸನ್ನಿವೇಶ',
        'ಉತ್ತರ', 'ಪ್ರತಿಕ್ರಿಯೆ', 'ಪ್ರಶ್ನೆ', 'ರೆಕಾರ್ಡ್', 'ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ',
        // Common Kannada words
        'ನಾನು', 'ನೀವು', 'ಅವರು', 'ಇದು', 'ಅದು', 'ಇಲ್ಲಿ', 'ಅಲ್ಲಿ', 'ಹಾಗೆ', 'ಹೀಗೆ'
      ] : [
        // General assessment words (English)
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
        'this', 'that', 'they', 'them', 'with', 'the', 'you', 'your', 'identify', 'qualities', 'characters',
        'to', 'too', 'two', 'hard work', 'never', 'should', 'in', 'succeed', 'there',
        // Indian English common words and phrases
        'well', 'actually', 'really', 'very', 'much', 'many', 'some', 'any', 'all', 'also', 'too', 'also',
        'because', 'so', 'then', 'when', 'where', 'what', 'who', 'why', 'how',
        'friend', 'friends', 'family', 'mother', 'father', 'sister', 'brother', 'teacher', 'school',
        'birthday', 'today', 'yesterday', 'tomorrow', 'called', 'told', 'said', 'forgot', 'remember',
        'sorry', 'thank you', 'please', 'kind of', 'sort of', 'like', 'such as',
        // Indian English pronunciation patterns
        'her', 'she', 'he', 'his', 'him', 'her', 'they', 'their', 'there',
        'will', 'would', 'could', 'should', 'might', 'may', 'can',
        'have', 'has', 'had', 'was', 'were', 'been', 'being',
        'that', 'this', 'these', 'those', 'the', 'a', 'an',
        // Common Indian English phrases
        'I have', 'I will', 'I can', 'I should', 'I would', 'I might',
        'she will', 'he will', 'they will', 'we will',
        'kind of', 'sort of', 'a lot', 'a bit', 'a little',
        'multiple times', 'many times', 'few times', 'some times',
        'real life', 'real life experiences', 'from my life', 'in my life',
        'inspiring', 'inspired', 'inspiration', 'motivated', 'motivation'
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
            phrases: [
              ...PHRASE_HINTS,
              ...(options.contextPhrases || [])
            ],
            boost: 25.0, // Increased boost for context + Indian English
          },
        ],
        // Use enhanced model for Indian English for better accuracy
        model: options.language === 'en-IN' ? 'latest_long' : undefined,
        useEnhanced: options.language === 'en-IN' ? true : false,
        // Help with code-switching (Hindi-English mix common in India)
        // DISABLE for now as it causes "UP Tu" type errors where English is transcribed as Hindi script
        // alternativeLanguageCodes: options.language === 'en-IN' ? ['hi-IN'] : undefined,
      };

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

      logger.log('📤 [transcribeWithGoogle] Sending request to Google Speech API...');
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

      logger.log('📥 [transcribeWithGoogle] Received response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          errorData = { error: { message: errorText } };
        }
        logger.error('❌ [transcribeWithGoogle] API error response:', errorData);
        throw new Error(`Google Speech API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      logger.log('✅ [transcribeWithGoogle] API response received:', {
        hasResults: !!data.results,
        resultsCount: data.results?.length || 0
      });

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
      logger.error('Google Speech-to-Text error:', error);
      throw error;
    }
  }

  /**
   * Enhanced post-processing for common Indian-English phonetic spellings.
   * Handles common mispronunciations and transcription errors in Indian English.
   */
  private postProcessTranscript(text: string, confidence: number, language: string): string {
    if (!text || language !== 'en-IN') return text;

    const MAP: Record<string, string> = {
      // Common phonetic errors
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
      'ryte': 'write',
      'med': 'made',

      // Indian English specific corrections (from your example)
      'fal': 'well',
      'har': 'her',
      'chhah': 'she',
      'van': 'when',
      'mai': 'my',
      'tel': 'tell',
      'dait': 'that',
      'den': 'then',
      'shi': 'she',
      'vil': 'will',
      'bi': 'be',
      'vel': 'well',
      'off': 'of',
      'ho gaya': 'happened',

      // Common v/w confusion in Indian English
      'vith': 'with',
      'vhen': 'when',
      'vhat': 'what',
      'vhere': 'where',
      'vhy': 'why',
      'vould': 'would',
      'vant': 'want',
      'vay': 'way',
      'vork': 'work',
      'vorld': 'world',

      // Common th/d confusion
      'dere': 'there',
      'dese': 'these',
      'de': 'the',
      'dough': 'though',
      'dink': 'think',
      'dought': 'thought',
      'drough': 'through',

      // Common r/l confusion
      'fliend': 'friend',
      'fliends': 'friends',
      'ploblem': 'problem',
      'ploblems': 'problems',

      // Common vowel sounds
      'tody': 'today',
      'yestody': 'yesterday',
      'tomorow': 'tomorrow',
      'caled': 'called',
      'told': 'told',
      'forgot': 'forgot',
      'forget': 'forget',
      'remembr': 'remember',
      'sory': 'sorry',
      'thnk': 'think',
      'thnks': 'thanks',
      'thnku': 'thank you',

      // Common word endings
      'kind off': 'kind of',
      'sort off': 'sort of',
      'a lot off': 'a lot of',
      'a bit off': 'a bit of',

      // Common phrases
      'i have': 'I have',
      'i will': 'I will',
      'i can': 'I can',
      'i should': 'I should',
      'i would': 'I would',
      'i told': 'I told',
      'i called': 'I called',
      'i forgot': 'I forgot',
      'i remember': 'I remember',
    };

    // First, handle multi-word phrases (longer matches first)
    let fixed = text;
    const phraseMap: Record<string, string> = {
      'ho gaya': 'happened',
      'kind off': 'kind of',
      'sort off': 'sort of',
      'a lot off': 'a lot of',
      'a bit off': 'a bit of',
    };

    // Replace phrases (case-insensitive)
    Object.keys(phraseMap).forEach(phrase => {
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      fixed = fixed.replace(regex, phraseMap[phrase]);
    });

    // Then handle single words
    const parts = fixed.split(/(\b)/);
    let result = parts.map(part => {
      const low = part.toLowerCase().trim();
      if (!/^[A-Za-z]+$/.test(part)) return part;
      const rep = MAP[low];
      if (!rep) return part;

      // Preserve capitalization
      if (part[0] === part[0].toUpperCase() && part.slice(1) === part.slice(1).toLowerCase()) {
        return rep.charAt(0).toUpperCase() + rep.slice(1);
      }
      return rep;
    }).join('');

    // Clean up extra spaces
    result = result.replace(/\s+/g, ' ').trim();

    // Basic sentence capitalization
    if (result.length > 0) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    return result;
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
      logger.error('Azure Speech-to-Text error:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using Google Gemini 1.5 Flash
   * Ultimate fallback that works with just the Gemini API key
   */
  async transcribeWithGemini(
    audioBlob: Blob,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    if (!this.geminiKey) {
      throw new Error('Gemini API key not configured');
    }

    logger.log('✨ [transcribeWithGemini] Starting Gemini transcription fallback...');

    // Convert blob to base64
    const base64Audio = await this.blobToBase64(audioBlob);

    // Prompt optimized for transcription of Indian accents
    const prompt = `
      Please transcribe this audio file accurately.
      
      Context:
      - This is a student recovering from rural India speaking in English (or Hindi/Kannada mixed).
      - The topic is "My Inspiration" - responding to videos about career, values, and life lessons.
      - Please capture the text exactly as spoken, but correct minor grammar/spelling errors if they don't change meaning.
      - If the audio is in Kannada or Hindi, please translate it to English.
      - Output ONLY the transcription/translation, no other text.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'audio/mp3', // Gemini handles wav/mp3/webm indiscriminately mostly
                    data: base64Audio
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.2, // Low temperature for accuracy
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text) {
        throw new Error('Gemini returned empty transcription');
      }

      logger.log('✨ [transcribeWithGemini] Success:', text.substring(0, 50) + '...');

      return {
        transcript: text.trim(),
        confidence: 0.9, // Artificial confidence since Gemini doesn't return it per-word easily
        languageCode: options.language
      };

    } catch (error) {
      logger.error('Gemini Transcription error:', error);
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

    // Try Google first
    try {
      return await this.transcribeWithGoogle(audioBlob, finalOptions);
    } catch (googleError) {
      logger.warn('Google transcription failed, trying Azure/Gemini:', googleError);

      // Try Azure if enabled
      if (this.config.fallbackEnabled && this.config.azureKey && this.config.azureRegion) {
        try {
          return await this.transcribeWithAzure(audioBlob, finalOptions);
        } catch (azureError) {
          logger.warn('Azure transcription failed, proceeding to Gemini fallback:', azureError);
          // Fall through to Gemini
        }
      }

      // Final fallback: Use Gemini 1.5 Flash if available
      if (this.geminiKey) {
        try {
          return await this.transcribeWithGemini(audioBlob, finalOptions);
        } catch (geminiError) {
          logger.error('All transcription services failed (Google, Azure, Gemini):', geminiError);
          throw new Error('Transcription failed on all services');
        }
      }

      // If we reached here, it means Google failed, Azure was skipped or failed, and Gemini was skipped (no key).
      // Re-throw the original error or a generic one.
      throw googleError;
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
              ...(finalOptions.language === 'kn-IN' ? [
                'ಪ್ರೇರಣೆ', 'ಪ್ರೇರೇಪಿಸು', 'ಮೌಲ್ಯಗಳು', 'ಗುಣಗಳು', 'ಪಾತ್ರಗಳು', 'ನೀವು', 'ನಿಮ್ಮ',
                'ವೀಡಿಯೊ', 'ಆಡಿಯೊ', 'ಪ್ರಶ್ನೆ', 'ಉತ್ತರ', 'ಕಲಿ', 'ಕಲಿಕೆ'
              ] : [
                'inspiration', 'motivated', 'values', 'qualities', 'characters', 'identify', 'yourself', 'video', 'audio', 'question', 'response', 'answer', 'learn', 'learning'
              ]),
              ...(finalOptions.contextPhrases || [])
            ],
            boost: 25.0,
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

      if (!pollResp.ok) {
        const errorText = await pollResp.text();
        throw new Error(`Failed to poll transcription operation: ${pollResp.status} ${pollResp.statusText} - ${errorText}`);
      }

      const op = await pollResp.json();

      // Check if operation has an error
      if (op?.error) {
        throw new Error(`Transcription operation failed: ${JSON.stringify(op.error)}`);
      }

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
      logger.warn('Language detection failed, defaulting to English:', error);
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

// Create singleton instance - same pattern as Gemini (loads API key in constructor)
export const speechToTextService = new SpeechToTextService();

export default speechToTextService;

