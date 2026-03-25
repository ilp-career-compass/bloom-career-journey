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

  // Keep ref in sync
  useEffect(() => {
    isRecordingRef.current = state.isRecording;
  }, [state.isRecording]);

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
          logger.log('📝 Stream update:', text);
          streamingTranscriptRef.current += text + " ";
          if (onStreamTranscript) {
            onStreamTranscript(streamingTranscriptRef.current.trim());
          }
        },
        (error) => {
          logger.error('❌ Streaming error:', error);
          const recordingMsg = lang === 'kn' ? 'ರೆಕಾರ್ಡಿಂಗ್ ನಡೆಯುತ್ತಿದೆ. ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಉಳಿಸಲಾಗುತ್ತದೆ.'
            : lang === 'ta' ? 'பதிவு நடைபெறுகிறது. உங்கள் பதில் சேமிக்கப்படும்.'
            : lang === 'hi' ? 'रिकॉर्डिंग जारी है। आपका उत्तर सहेजा जाएगा।'
            : 'Recording in progress. Your response will be saved.';
          setErrorState('warning', recordingMsg);
        }
      );

      // Create Audio Context @ 16kHz
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      logger.log('🎤 AudioContext Sample Rate:', audioCtx.sampleRate, 'State:', audioCtx.state);

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      // Load AudioWorklet Module
      try {
        await audioCtx.audioWorklet.addModule('/sarvam-audio-processor.js');
        logger.log('✅ AudioWorklet Module Loaded');
      } catch (err) {
        logger.error('❌ Failed to load AudioWorklet:', err);
        throw err;
      }

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Create Worklet Node
      const workletNode = new AudioWorkletNode(audioCtx, 'sarvam-audio-processor');
      processorRef.current = workletNode;

      // Handle Audio Chunks from Worklet
      workletNode.port.onmessage = (e) => {
        // Use Ref to avoid stale closure issues
        if (!isRecordingRef.current && !state.isPaused) return;

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

        logger.log(`🎤 Generated Chunk: ${base64Audio.substring(0, 10)}...`);
        sarvamStreamingService.sendAudioChunk(base64Audio);
      };

      source.connect(workletNode);
      workletNode.connect(audioCtx.destination);

      logger.log('✅ Streaming Capture Started (AudioWorklet)');

    } catch (e) {
      logger.error('Failed to start streaming capture:', e);
      // Fallback: Don't fail the whole recording if streaming fails
    }
  };

  const stopStreamingCapture = () => {
    // Disconnect WebSocket
    sarvamStreamingService.disconnect();

    // Disconnect Audio Nodes
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
  };

  // --- PERMISSIONS & SETUP ---
  // Localized permission-denied messages
  const micDeniedMessages: Record<string, string> = {
    en: 'Microphone access denied. Please allow microphone access in your browser settings to record your answer. You can also type your answer instead.',
    kn: 'ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಮೈಕ್ರೋಫೋನ್ ಅನ್ನು ಅನುಮತಿಸಿ.',
    ta: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உங்கள் பதிலை பதிவு செய்ய உலாவி அமைப்புகளில் மைக்ரோஃபோனை அனுமதிக்கவும்.',
    hi: 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया अपना उत्तर रिकॉर्ड करने के लिए ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।',
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
          sampleRate: AUDIO_CONFIG.sampleRate,
          channelCount: AUDIO_CONFIG.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      setState(prev => ({ ...prev, hasPermission: true }));
      streamRef.current = stream;

      // Clean up the test stream
      stream.getTracks().forEach(track => track.stop());

      logger.log('✅ Microphone permission granted');
      return true;
    } catch (error) {
      logger.error('❌ Microphone permission denied:', error);
      setState(prev => ({ ...prev, hasPermission: false }));

      const baseLang = (lang || 'en').split('-')[0];
      let errorMessage = micDeniedMessages[baseLang] || micDeniedMessages.en;

      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is being used by another application. Please close other applications and try again.';
        }
        // NotAllowedError uses the localized message above
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

  }, [state.hasPermission, requestMicrophonePermission]);

  const startActualRecording = async () => {
    try {
      // 1. Constraints: Disable native processing to avoid VAD gating
      const constraints = {
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // 1. Start MediaRecorder (Blob Storage)
      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg'];
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

      mediaRecorder.onstop = () => {
        logger.log('🛑 Recorder Stopped');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setState(prev => ({ ...prev, audioBlob, buttonState: 'saved', hasRecorded: true }));

        const finalTranscript = streamingTranscriptRef.current;
        onRecordingComplete(audioBlob, finalTranscript);
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
          const unavailMsg = lang === 'kn' ? 'ರೆಕಾರ್ಡಿಂಗ್ ನಡೆಯುತ್ತಿದೆ. ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಉಳಿಸಲಾಗುತ್ತದೆ.'
            : lang === 'ta' ? 'பதிவு நடைபெறுகிறது. உங்கள் பதில் சேமிக்கப்படும்.'
            : lang === 'hi' ? 'रिकॉर्डिंग जारी है। आपका उत्तर सहेजा जाएगा।'
            : 'Recording in progress. Your response will be saved.';
          setErrorState('warning', unavailMsg);
        });
      }

    } catch (e) {
      logger.error('Error starting recording:', e);
      setErrorState('error', 'Could not start recording.');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      stopStreamingCapture();

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