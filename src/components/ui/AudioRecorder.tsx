import { logger } from '@/lib/logger';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Upload,
  CheckCircle,
  AlertCircle,
  MicOff,
  Volume2,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle2,
  Loader2,
  Save,
  Timer,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { audioResponseManager } from '@/services/audioResponseManager';
import { sarvamStreamingService } from '@/services/sarvamStreamingService';
import { useLang } from '@/hooks/useLang';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Audio configuration
const AUDIO_CONFIG = {
  mimeType: 'audio/webm;codecs=opus',
  sampleRate: 48000,
  channels: 1,
  bitRate: 128000,
};

// Enhanced recording states for better UX
type RecordingButtonState = 'idle' | 'recording' | 'processing' | 'saved';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isOnline: boolean;
  hasPermission: boolean;
  hasRecorded: boolean;
  micChecked: boolean;
  showMicCheckModal: boolean;
  // Phase 1 enhancements
  buttonState: RecordingButtonState;
  savedAt: string | null;
  isSaving: boolean;
  waveformData: number[];
  isAnalyzing: boolean;
  // Phase 2 enhancements
  hasInteracted: boolean;
  errorState: 'none' | 'warning' | 'error';
  errorMessage: string | null;
  showError: boolean;
  // UX Enhancement features
  countdownActive: boolean;
  countdownValue: number;
  showPreview: boolean;
  previewUrl: string | null;
  // Transcription indicators
  hasTranscription: boolean;
  transcriptionConfidence: number | null;
}

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcription?: string) => void;
  // Callback for live streaming text
  onStreamTranscript?: (text: string) => void;
  questionId: string;
  maxDuration?: number;
  language?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  showInstructions?: boolean;
  allowRetry?: boolean;
  showMicCheck?: boolean;
  studentId?: string;
  assessmentId?: string;
  assessmentType?: string;
  assessmentTitle?: string;
  enableTranscription?: boolean;
  enableOfflineMode?: boolean;
  // Initial persisted state for revisit
  initialAudioUrl?: string | null;
  initialTranscription?: string | null;
  initialConfidence?: number | null;
  initialSavedAt?: string | null;
  // Lock recording after a successful save (one attempt per question)
  lockAfterSave?: boolean;
  // Context phrases to boost identification of specific words
  contextPhrases?: string[];
  // Enable streaming mode
  useStreaming?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  onStreamTranscript,
  questionId,
  maxDuration = 120000,
  language = 'en-IN',
  disabled = false,
  className = '',
  compact = false,
  showInstructions = true,
  allowRetry = false,
  showMicCheck = false,
  studentId,
  assessmentId,
  assessmentType,
  assessmentTitle,
  enableTranscription = true,
  enableOfflineMode = true,
  initialAudioUrl = null,
  initialTranscription = null,
  initialConfidence = null,
  initialSavedAt = null,
  lockAfterSave = true,
  contextPhrases = [],
  useStreaming = true,
}: AudioRecorderProps) {
  const { toast } = useToast();
  const { t, lang } = useLang();

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isRecordingRef = useRef<boolean>(false); // Track live state for async callbacks
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Streaming Refs
  const processorRef = useRef<ScriptProcessorNode | AudioWorkletNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamingTranscriptRef = useRef<string>("");
  const flushPromiseRef = useRef<Promise<void>>(Promise.resolve());
  const isPausedRef = useRef<boolean>(false);

  // State
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    isPlaying: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    isUploading: false,
    uploadProgress: 0,
    isOnline: navigator.onLine,
    hasPermission: false,
    hasRecorded: false,
    micChecked: false,
    showMicCheckModal: false,
    // Phase 1 enhancements
    buttonState: 'idle',
    savedAt: null,
    isSaving: false,
    waveformData: [],
    isAnalyzing: false,
    // Phase 2 enhancements
    hasInteracted: false,
    errorState: 'none',
    errorMessage: null,
    showError: false,
    // UX Enhancement features
    countdownActive: false,
    countdownValue: 3,
    showPreview: false,
    previewUrl: null,
    // Transcription indicators
    hasTranscription: !!initialTranscription,
    transcriptionConfidence: initialConfidence ?? null,
  });

  // Initialize from persisted state (when revisiting)
  useEffect(() => {
    if (initialAudioUrl || initialSavedAt) {
      setState(prev => ({
        ...prev,
        audioUrl: initialAudioUrl ?? prev.audioUrl,
        buttonState: 'saved',
        savedAt: initialSavedAt ?? prev.savedAt,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAudioUrl, initialSavedAt]);

  // Update audio element source when initialAudioUrl changes
  useEffect(() => {
    if (audioRef.current && initialAudioUrl && !state.audioUrl) {
      audioRef.current.src = initialAudioUrl;
    }
  }, [initialAudioUrl, state.audioUrl]);

  // Reflect initial transcription props
  useEffect(() => {
    if (initialTranscription || initialConfidence !== null) {
      setState(prev => ({
        ...prev,
        hasTranscription: !!initialTranscription,
        transcriptionConfidence: initialConfidence ?? prev.transcriptionConfidence,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTranscription, initialConfidence]);

  // Error handling functions
  const setErrorState = useCallback((errorState: 'none' | 'warning' | 'error', message?: string) => {
    setState(prev => ({
      ...prev,
      errorState,
      errorMessage: message || null,
      showError: errorState !== 'none'
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      errorState: 'none',
      errorMessage: null,
      showError: false
    }));
  }, []);

  // Keep refs in sync
  useEffect(() => {
    isRecordingRef.current = state.isRecording;
  }, [state.isRecording]);

  useEffect(() => {
    isPausedRef.current = state.isPaused;
  }, [state.isPaused]);

  const markInteraction = useCallback(() => {
    setState(prev => ({ ...prev, hasInteracted: true }));
  }, []);

  // --- STREAMING LOGIC ---
  const startStreamingCapture = async (stream: MediaStream) => {
    try {
      logger.log('🔌 Connecting to Sarvam Streaming Service...');

      // Reset transcript buffer
      streamingTranscriptRef.current = "";

      // Connect to WebSocket Service (Passing language code)
      let langCode = 'hi-IN';
      if (language) {
        if (language.includes('-')) langCode = language;
        else langCode = `${language}-IN`;
      }

      await sarvamStreamingService.connect(
        langCode,
        (text, isFinal) => {
          logger.log('📝 Stream update:', text, 'isFinal:', isFinal);
          if (isFinal) {
            streamingTranscriptRef.current += text + " ";
          }
          if (onStreamTranscript) {
            const display = isFinal
              ? streamingTranscriptRef.current.trim()
              : (streamingTranscriptRef.current + text).trim();
            onStreamTranscript(display);
          }
        },
        (error) => {
          logger.error('❌ Streaming error:', error);
          const baseLang = (lang || localStorage.getItem('lang') || 'en').split('-')[0];
          setErrorState('warning', streamingUnavailableMessages[baseLang] || streamingUnavailableMessages.en);
        }
      );

      // G15: Close any AudioContext left open by a previous failed startStreamingCapture
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }

      // Create Audio Context @ 16kHz
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      logger.log('🎤 AudioContext Sample Rate:', audioCtx.sampleRate, 'State:', audioCtx.state);

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      // Try loading AudioWorklet module, fallback to ScriptProcessor on failure
      let useWorklet = false;
      if (audioCtx.audioWorklet) {
        try {
          await audioCtx.audioWorklet.addModule('/sarvam-audio-processor.js');
          logger.log('✅ AudioWorklet Module Loaded');
          useWorklet = true;
        } catch (err) {
          logger.warn('⚠️ Failed to load AudioWorklet, falling back to ScriptProcessor:', err);
        }
      } else {
        logger.log('ℹ️ AudioWorklet not supported by browser, falling back to ScriptProcessor');
      }

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      if (useWorklet) {
        // Create Worklet Node
        const workletNode = new AudioWorkletNode(audioCtx, 'sarvam-audio-processor');
        processorRef.current = workletNode;

        // Handle Audio Chunks from Worklet
        workletNode.port.onmessage = (e) => {
          // G14: use refs to avoid stale closure; stream only when recording and not paused
          if (!isRecordingRef.current || isPausedRef.current) return;

          // e.data is Float32Array
          const inputData = e.data;

          // Convert to Int16 with GAIN
          const GAIN = 15.0; // Aggressive boost for quiet microphones
          const buffer = new ArrayBuffer(inputData.length * 2);
          const view = new DataView(buffer);
          for (let i = 0; i < inputData.length; i++) {
            let s = inputData[i] * GAIN;
            s = Math.max(-1, Math.min(1, s));
            s = s < 0 ? s * 32768 : s * 32767;
            view.setInt16(i * 2, s, true);
          }

          // Convert to Base64
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Audio = window.btoa(binary);

          logger.log(`🎤 Generated Chunk (Worklet): ${base64Audio.substring(0, 10)}...`);
          sarvamStreamingService.sendAudioChunk(base64Audio);
        };

        source.connect(workletNode);
        workletNode.connect(audioCtx.destination);
        logger.log('✅ Streaming Capture Started (AudioWorklet)');
      } else {
        // Fallback to ScriptProcessorNode
        const scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = scriptNode;

        scriptNode.onaudioprocess = (e) => {
          if (!isRecordingRef.current || isPausedRef.current) return;

          // inputBuffer is already at 16000Hz because the audioCtx was created with sampleRate: 16000
          const inputData = e.inputBuffer.getChannelData(0);

          // Convert to Int16 with GAIN
          const GAIN = 15.0;
          const buffer = new ArrayBuffer(inputData.length * 2);
          const view = new DataView(buffer);
          for (let i = 0; i < inputData.length; i++) {
            let s = inputData[i] * GAIN;
            s = Math.max(-1, Math.min(1, s));
            s = s < 0 ? s * 32768 : s * 32767;
            view.setInt16(i * 2, s, true);
          }

          // Convert to Base64
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Audio = window.btoa(binary);

          logger.log(`🎤 Generated Chunk (ScriptProcessor): ${base64Audio.substring(0, 10)}...`);
          sarvamStreamingService.sendAudioChunk(base64Audio);
        };

        source.connect(scriptNode);
        scriptNode.connect(audioCtx.destination);
        logger.log('✅ Streaming Capture Started (ScriptProcessor fallback)');
      }

    } catch (e) {
      logger.error('Failed to start streaming capture:', e);
      // Clean up WS connection on start failure
      sarvamStreamingService.disconnect().catch(() => {});
      const baseLang = (lang || localStorage.getItem('lang') || 'en').split('-')[0];
      setErrorState('warning', streamingUnavailableMessages[baseLang] || streamingUnavailableMessages.en);
    }
  };

  const stopStreamingCapture = (): Promise<void> => {
    // G8: return the flush Promise so callers can await the final Sarvam transcript
    const flushPromise = sarvamStreamingService.disconnect();

    // Disconnect Audio Nodes immediately — no more audio to send
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    return flushPromise;
  };

  // --- PERMISSIONS & SETUP ---
  // Localized permission-denied messages
  const micDeniedMessages: Record<string, string> = {
    en: 'Microphone access denied. Please allow microphone access in your browser settings to record your answer. You can also type your answer instead.',
    kn: 'ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಮೈಕ್ರೋಫೋನ್ ಅನ್ನು ಅನುಮತಿಸಿ.',
    ta: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உங்கள் பதிலை பதிவு செய்ய உலாவி அமைப்புகளில் மைக்ரோஃபோனை அனுமதிக்கவும்.',
    hi: 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया अपना उत्तर रिकॉर्ड करने के लिए ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।',
  };

  const micNotFoundMessages: Record<string, string> = {
    en: 'No microphone found. Please connect a microphone and try again.',
    kn: 'ಮೈಕ್ರೋಫೋನ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್ರೋಫೋನ್ ಸಂಪರ್ಕಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    ta: 'மைக்ரோஃபோன் கண்டுபிடிக்கப்படவில்லை. மைக்ரோஃபோனை இணைத்து மீண்டும் முயற்சிக்கவும்.',
    hi: 'माइक्रोफ़ोन नहीं मिला। कृपया माइक्रोफ़ोन जोड़कर फिर से प्रयास करें।',
  };

  const micInUseMessages: Record<string, string> = {
    en: 'Microphone is being used by another application. Please close other apps and try again.',
    kn: 'ಮೈಕ್ರೋಫೋನ್ ಅನ್ನು ಇನ್ನೊಂದು ಅಪ್ಲಿಕೇಶನ್ ಬಳಸುತ್ತಿದೆ. ಇತರ ಅಪ್ಲಿಕೇಶನ್‌ಗಳನ್ನು ಮುಚ್ಚಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    ta: 'மைக்ரோஃபோன் வேறு பயன்பாட்டில் உள்ளது. மற்ற பயன்பாடுகளை மூடி மீண்டும் முயற்சிக்கவும்.',
    hi: 'माइक्रोफ़ोन किसी अन्य एप्लिकेशन द्वारा उपयोग किया जा रहा है। अन्य एप्लिकेशन बंद करके फिर से प्रयास करें।',
  };

  const streamingUnavailableMessages: Record<string, string> = {
    en: 'Recording in progress. Your response will be saved.',
    kn: 'ರೆಕಾರ್ಡಿಂಗ್ ನಡೆಯುತ್ತಿದೆ. ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಉಳಿಸಲಾಗುತ್ತದೆ.',
    ta: 'பதிவு நடைபெறுகிறது. உங்கள் பதில் சேமிக்கப்படும்.',
    hi: 'रिकॉर्डिंग जारी है। आपका उत्तर सहेजा जाएगा।',
  };

  // Request microphone permission (called lazily on first record click)
  const requestMicrophonePermission = useCallback(async () => {
    // Check browser support first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Audio recording is not supported on this browser. You can type your answer instead.';
      setErrorState('warning', msg);
      toast({ title: t('error'), description: msg, variant: 'destructive' });
      return false;
    }

    try {
      logger.log('🎤 Requesting microphone permission...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      setState(prev => ({ ...prev, hasPermission: true }));
      // L1: Keep the stream alive so startActualRecording can reuse it immediately
      streamRef.current = stream;

      logger.log('✅ Microphone permission granted');
      return true;
    } catch (error) {
      logger.error('❌ Microphone permission denied:', error);
      setState(prev => ({ ...prev, hasPermission: false }));

      const baseLang = (lang || localStorage.getItem('lang') || 'en').split('-')[0];
      let errorMessage = micDeniedMessages[baseLang] || micDeniedMessages.en;

      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          errorMessage = micNotFoundMessages[baseLang] || micNotFoundMessages.en;
        } else if (error.name === 'NotReadableError') {
          errorMessage = micInUseMessages[baseLang] || micInUseMessages.en;
        }
        // NotAllowedError uses micDeniedMessages above
      }

      setErrorState('warning', errorMessage);

      toast({
        title: t('error'),
        description: errorMessage,
      });

      return false;
    }
  }, [toast, setErrorState, lang, t]);


  // Initialize audio response manager (no mic permission request on mount)
  useEffect(() => {
    if (studentId && assessmentId) {
      audioResponseManager.initialize({
        studentId, assessmentId, assessmentType: assessmentType!, assessmentTitle: assessmentTitle!,
        enableTranscription, enableOfflineMode, language
      });
      audioResponseManager.loadOfflineQueue();
    }
  }, [studentId, assessmentId, assessmentType, assessmentTitle, enableTranscription, enableOfflineMode, language]);

  // Clean up
  useEffect(() => {
    return () => {
      stopStreamingCapture(); // Ensure streaming stops
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      // G8: Capture flush Promise BEFORE stopping the recorder so onstop can await it
      flushPromiseRef.current = stopStreamingCapture();
      mediaRecorderRef.current.stop();

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isRecording: false,
        buttonState: 'processing',
        hasRecorded: true
      }));
    }
  }, [state.isRecording]);

  const startActualRecording = useCallback(async () => {
    try {
      const constraints = {
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };

      // L1: Reuse the stream opened by requestMicrophonePermission if it is still live
      const stream = (streamRef.current && streamRef.current.getTracks().some(t => t.readyState === 'live'))
        ? streamRef.current
        : await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // 1. Start MediaRecorder (Blob Storage)
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream); // Fallback
      }
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        logger.log('🛑 Recorder Stopped');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // G8: Wait for Sarvam's 2500ms flush to complete so the final transcript is captured
        await flushPromiseRef.current;

        const finalTranscript = streamingTranscriptRef.current;
        const durationMs = Date.now() - startTime;

        // If configured, trigger the upload/database save flow
        if (studentId && assessmentId) {
          setState(prev => ({ 
            ...prev, 
            audioBlob, 
            hasRecorded: true,
            buttonState: 'processing',
            isUploading: true,
            uploadProgress: 0,
            isSaving: true
          }));

          try {
            const audioData = {
              questionId,
              audioBlob,
              transcription: finalTranscript || undefined,
              duration: durationMs,
              fileSize: audioBlob.size,
            };

            logger.log('📂 Uploading audio response to Supabase...', {
              questionId,
              size: audioBlob.size,
              duration: durationMs,
              hasTranscript: !!finalTranscript
            });

            const result = await audioResponseManager.processAudioResponse(
              audioData,
              (progress) => {
                setState(prev => ({ ...prev, uploadProgress: progress }));
              }
            );

            setState(prev => ({ 
              ...prev, 
              isUploading: false, 
              uploadProgress: 100,
              buttonState: 'saved',
              savedAt: new Date().toISOString(),
              isSaving: false
            }));

            // Use the returned transcription from processAudioResponse (might be cleaned up)
            // or fallback to the streaming transcript we got.
            const transcriptionToUse = result.success ? (result.transcription || finalTranscript) : finalTranscript;

            onRecordingComplete(audioBlob, transcriptionToUse);

            if (result.success) {
              toast({
                title: "Audio Response Saved",
                description: transcriptionToUse
                  ? "Your audio has been recorded, transcribed, and saved."
                  : "Your audio has been recorded and saved.",
              });
            } else {
              // RLS policy issue or other non-fatal issues might still be treated as successful locally
              if (result.error?.includes('row-level security policy')) {
                toast({
                  title: "Audio Response Saved",
                  description: "Your audio has been recorded. File saved to storage.",
                });
              } else {
                throw new Error(result.error || 'Processing failed');
              }
            }
          } catch (uploadError) {
            logger.error('Audio processing error:', uploadError);
            setState(prev => ({ 
              ...prev, 
              isUploading: false,
              buttonState: 'idle',
              isSaving: false
            }));

            setErrorState('error', 'Failed to save audio response. Your recording is saved locally.');

            toast({
              title: "Saving Failed",
              description: uploadError instanceof Error ? uploadError.message : "Failed to process audio response.",
              variant: "destructive",
            });

            // Fallback: still notify parent component of completion with the local blob
            onRecordingComplete(audioBlob, finalTranscript);
          }
        } else {
          // Fallback if not configured for saving (e.g. basic testing page)
          setState(prev => ({ ...prev, audioBlob, hasRecorded: true, buttonState: 'saved' }));
          onRecordingComplete(audioBlob, finalTranscript);
        }
      };

      mediaRecorder.start(100);

      // 3. UI Updates (Optimistic: Start Timer Immediately)
      const startTime = Date.now();
      recordingIntervalRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: Date.now() - startTime }));
        if (Date.now() - startTime >= maxDuration) stopRecording();
      }, 100);

      setState(prev => ({ ...prev, isRecording: true, buttonState: 'recording' }));

      // 4. Start Streaming (Async - Non Blocking)
      if (useStreaming) {
        // Clone stream to prevent ScriptProcessor/MediaRecorder conflicts
        const streamClone = stream.clone();

        startStreamingCapture(streamClone).catch(err => {
          logger.warn("Streaming failed, but local recording continues:", err);
          const baseLang = (lang || localStorage.getItem('lang') || 'en').split('-')[0];
          setErrorState('warning', streamingUnavailableMessages[baseLang] || streamingUnavailableMessages.en);
        });
      }

    } catch (e) {
      logger.error('Error starting recording:', e);
      // L3: If mic was revoked between sessions, reset hasPermission and show localized denial
      if (e instanceof Error && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')) {
        setState(prev => ({ ...prev, hasPermission: false }));
        const baseLang = (lang || localStorage.getItem('lang') || 'en').split('-')[0];
        setErrorState('warning', micDeniedMessages[baseLang] || micDeniedMessages.en);
      } else {
        setErrorState('error', 'Could not start recording.');
      }
    }
  }, [
    studentId,
    assessmentId,
    assessmentType,
    assessmentTitle,
    questionId,
    language,
    maxDuration,
    useStreaming,
    enableTranscription,
    enableOfflineMode,
    onRecordingComplete,
    toast,
    setErrorState,
    lang,
    stopRecording
  ]);

  // START RECORDING FLOW
  const startRecording = useCallback(async () => {
    if (!state.hasPermission) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    // Start Countdown
    setState(prev => ({ ...prev, countdownActive: true, countdownValue: 3 }));

    let count = 3;
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      count--;
      setState(prev => ({ ...prev, countdownValue: count }));
      if (count <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = null;
        setState(prev => ({ ...prev, countdownActive: false, isRecording: true }));
        startActualRecording();
      }
    }, 1000);

  }, [state.hasPermission, requestMicrophonePermission, startActualRecording]);


  // RENDER
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-14 px-4 py-2 text-sm select-none shadow-md transition-all duration-300 ${state.isRecording ? 'border-red-200 ring-4 ring-red-50 bg-red-50/20' : ''} ${className}`}>
        {/* Action Button */}
        <button
          type="button"
          onClick={state.isRecording ? stopRecording : startRecording}
          disabled={disabled || state.buttonState === 'processing'}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 shadow-md ${
            state.isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : state.buttonState === 'saved'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-primary hover:bg-primary-hover text-white'
          }`}
        >
          {state.buttonState === 'processing' ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : state.isRecording ? (
            <Square className="w-4.5 h-4.5 text-white fill-current" />
          ) : state.buttonState === 'saved' ? (
            <RotateCcw className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Info & Timer Section */}
        <div className="flex flex-col justify-center min-w-[105px]">
          {state.countdownActive ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-orange-500 animate-pulse">{state.countdownValue}</span>
              <span className="text-[10px] text-orange-500 font-semibold uppercase tracking-wider">Get Ready</span>
            </div>
          ) : state.isRecording ? (
            <div className="flex flex-col">
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Speaking Live
              </span>
              <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
                {new Date(state.duration).toISOString().slice(14, 19)}
              </span>
            </div>
          ) : state.buttonState === 'processing' ? (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider animate-pulse">Saving response</span>
              <span className="text-[10px] text-muted-foreground">Please wait...</span>
            </div>
          ) : state.buttonState === 'saved' ? (
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
              <span className="text-[9px] text-muted-foreground leading-tight">Tap to retry</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-xs text-slate-600 dark:text-slate-350 font-bold uppercase tracking-wider">Speak Answer</span>
              <span className="text-[9px] text-muted-foreground leading-tight">Tap mic to start</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER
  return (
    <div className={`flex flex-col gap-4 ${className}`}>

      {/* 1. COUNTDOWN VIEW */}
      {state.countdownActive && (
        <div className="flex items-center justify-center h-48 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in zoom-in duration-300">
          <div className="text-6xl font-black text-slate-800 tabular-nums animate-pulse">
            {state.countdownValue}
          </div>
        </div>
      )}

      {/* 2. RECORDING CARD */}
      {!state.countdownActive && (
        <Card className={`border-slate-200 shadow-sm overflow-hidden transition-all duration-500 ${state.isRecording ? 'border-red-200 ring-4 ring-red-50/50' : ''}`}>
          <CardContent className="p-6 flex flex-col items-center justify-center gap-6">

            {/* Status Header */}
            <div className="flex items-center gap-2">
              {state.isRecording ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100/50 text-red-600 rounded-full animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Recording Live</span>
                </div>
              ) : state.buttonState === 'saved' ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100/50 text-green-700 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold text-xs uppercase tracking-wider">Saved</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400">
                  <Mic className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-medium">Ready</span>
                </div>
              )}
            </div>

            {/* Main Action Button */}
            <div className="relative">
              {state.isRecording && (
                <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping scale-150" />
              )}

              <Button
                onClick={state.isRecording ? stopRecording : startRecording}
                disabled={disabled || state.buttonState === 'processing'}
                className={`
                            relative w-24 h-24 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95
                            ${state.isRecording
                    ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-4 border-red-100'
                    : state.buttonState === 'saved'
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-4 border-emerald-100'
                      : 'bg-gradient-to-br from-slate-800 to-slate-900 hover:from-black hover:to-slate-900 border-4 border-slate-100'
                  }
                        `}
              >
                {state.buttonState === 'processing' ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : state.isRecording ? (
                  <Square className="w-8 h-8 text-white fill-current" />
                ) : state.buttonState === 'saved' ? (
                  <RotateCcw className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </Button>
            </div>

            {/* Timer Display */}
            <div className="font-mono text-3xl tabular-nums text-slate-700 font-bold tracking-tight">
              {new Date(state.duration).toISOString().slice(14, 19)}
            </div>

            {/* Error/Warning Message */}
            {state.errorMessage && (
              <div className={`text-sm flex items-center gap-2 px-4 py-2 rounded-md ${
                state.errorState === 'error' ? 'text-red-500 bg-red-50' : 'text-amber-600 bg-amber-50'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {state.errorMessage}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}