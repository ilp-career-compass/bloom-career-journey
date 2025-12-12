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
}

export function AudioRecorder({
  onRecordingComplete,
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
}: AudioRecorderProps) {
  const { toast } = useToast();
  const { t, lang } = useLang();

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Error handling functions (moved before useEffect to avoid hoisting issues)
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

  const markInteraction = useCallback(() => {
    setState(prev => ({ ...prev, hasInteracted: true }));
  }, []);

  // Debug function to check MediaRecorder capabilities (moved before useEffect)
  const debugMediaRecorderCapabilities = useCallback(() => {
    console.log('🔍 MediaRecorder Debug Info:');
    console.log('- MediaRecorder available:', !!window.MediaRecorder);
    console.log('- MediaDevices available:', !!navigator.mediaDevices);
    console.log('- getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);

    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];

    console.log('📋 Supported MIME Types:');
    mimeTypes.forEach(type => {
      const supported = MediaRecorder.isTypeSupported(type);
      console.log(`  ${supported ? '✅' : '❌'} ${type}`);
    });
  }, []);

  // Initialize audio response manager and request microphone permission
  useEffect(() => {
    // Check browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ MediaDevices API not supported');
      setErrorState('error', 'Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.');
      return;
    }

    if (!window.MediaRecorder) {
      console.error('❌ MediaRecorder API not supported');
      setErrorState('error', 'Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.');
      return;
    }

    // Check supported mimeTypes
    const supportedMimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ].filter(type => MediaRecorder.isTypeSupported(type));

    if (supportedMimeTypes.length === 0) {
      console.error('❌ No supported audio formats found');
      setErrorState('error', 'Your browser does not support any audio recording formats. Please use a modern browser.');
      return;
    }

    console.log('✅ Supported audio formats:', supportedMimeTypes);

    // Run debug info
    debugMediaRecorderCapabilities();

    if (studentId && assessmentId && assessmentType && assessmentTitle) {
      audioResponseManager.initialize({
        studentId,
        assessmentId,
        assessmentType,
        assessmentTitle,
        enableTranscription,
        enableOfflineMode,
        language, // Pass language for transcription
      });

      // Load offline queue
      audioResponseManager.loadOfflineQueue();
    }

    // Auto-request microphone permission when component mounts
    const requestPermission = async () => {
      try {
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

        console.log('✅ Microphone permission granted automatically');
      } catch (error) {
        console.log('❌ Microphone permission not granted:', error);
        setState(prev => ({ ...prev, hasPermission: false }));
      }
    };

    requestPermission();
  }, [studentId, assessmentId, assessmentType, assessmentTitle, enableTranscription, enableOfflineMode, setErrorState, debugMediaRecorderCapabilities]);

  // Reset state when questionId changes
  useEffect(() => {
    // Clean up any active recordings and streams
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      isPlaying: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      isUploading: false,
      uploadProgress: 0,
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
    }));
  }, [questionId]);

  // Cleanup on component unmount
  useEffect(() => {
    const currentAudioUrl = state.audioUrl;
    const currentPreviewUrl = state.previewUrl;

    return () => {
      // Stop any active recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.log('Error stopping MediaRecorder on cleanup:', e);
        }
      }

      // Stop all media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clear intervals
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      // Revoke object URLs to free memory
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  }, [state.audioUrl, state.previewUrl]);


  // Countdown functionality
  const startCountdown = useCallback(() => {
    setState(prev => ({
      ...prev,
      countdownActive: true,
      countdownValue: 3,
      buttonState: 'recording' as RecordingButtonState
    }));

    const countdownInterval = setInterval(() => {
      setState(prev => {
        if (prev.countdownValue <= 1) {
          clearInterval(countdownInterval);
          return {
            ...prev,
            countdownActive: false,
            countdownValue: 3
          };
        }
        return {
          ...prev,
          countdownValue: prev.countdownValue - 1
        };
      });
    }, 1000);
  }, []);

  // Pause/Resume functionality
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.pause();
      setState(prev => ({
        ...prev,
        isPaused: true,
        buttonState: 'idle' as RecordingButtonState
      }));
    }
  }, [state.isRecording]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState(prev => ({
        ...prev,
        isPaused: false,
        buttonState: 'recording' as RecordingButtonState
      }));
    }
  }, [state.isPaused]);

  // Audio preview functionality
  const showAudioPreview = useCallback((audioBlob: Blob) => {
    const url = URL.createObjectURL(audioBlob);
    setState(prev => ({
      ...prev,
      showPreview: true,
      previewUrl: url,
      buttonState: 'saved' as RecordingButtonState
    }));
  }, []);

  // Waveform visualization component
  const WaveformVisualizer = ({ data, isRecording }: { data: number[]; isRecording: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (data.length === 0) return;

      ctx.strokeStyle = isRecording ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const barWidth = width / data.length;
      data.forEach((value, index) => {
        const barHeight = (value / 255) * height;
        const x = index * barWidth;
        const y = (height - barHeight) / 2;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }, [data, isRecording]);

    return (
      <canvas
        ref={canvasRef}
        width={200}
        height={40}
        className="w-full h-10 bg-gray-100 rounded"
      />
    );
  };

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      console.log('🎤 Requesting microphone permission...');

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

      toast({
        title: "Microphone Access Granted",
        description: "You can now record audio responses.",
      });

      console.log('✅ Microphone permission granted');
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      setState(prev => ({ ...prev, hasPermission: false }));

      let errorMessage = 'Microphone access is required to record audio responses.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is being used by another application. Please close other applications and try again.';
        }
      }

      setErrorState('error', errorMessage);

      toast({
        title: "Microphone Access Denied",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, [toast, setErrorState]);

  // Process audio response
  const processAudioResponse = useCallback(async (audioBlob: Blob) => {
    if (!studentId || !assessmentId || !assessmentType || !assessmentTitle) {
      // Fallback to basic callback if not configured
      onRecordingComplete(audioBlob);
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isUploading: true,
        buttonState: 'processing' as RecordingButtonState,
        isSaving: true
      }));

      const result = await audioResponseManager.processAudioResponse({
        questionId,
        audioBlob,
        duration: state.duration,
        fileSize: audioBlob.size
      });

      console.log('🎤 Audio processing result:', {
        success: result.success,
        hasTranscription: !!result.transcription,
        transcriptionLength: result.transcription?.length || 0,
        transcriptionPreview: result.transcription?.substring(0, 50) || 'none',
        confidence: result.confidence,
        languageDetected: result.languageDetected
      });

      if (result.success) {
        setState(prev => ({
          ...prev,
          isUploading: false,
          buttonState: 'saved' as RecordingButtonState,
          savedAt: new Date().toISOString(),
          isSaving: false,
          hasTranscription: !!result.transcription,
          transcriptionConfidence: typeof result.confidence === 'number' ? result.confidence : prev.transcriptionConfidence,
        }));

        const toastMessage = result.transcription
          ? (lang === 'kn' ? "ಆಡಿಯೊ ಸೇವ್ ಮಾಡಲಾಗಿದೆ ಮತ್ತು ಬರಹ ಮಾಡಲಾಗಿದೆ" : "Audio saved and transcribed")
          : (lang === 'kn' ? "ಆಡಿಯೊ ಸೇವ್ ಮಾಡಲಾಗಿದೆ" : "Audio Saved");

        const toastDescription = result.transcription
          ? (lang === 'kn' ? "ನಿಮ್ಮ ಆಡಿಯೊ ಉತ್ತರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇವ್ ಮಾಡಲಾಗಿದೆ ಮತ್ತು ಪಠ್ಯಕ್ಕೆ ಪರಿವರ್ತಿಸಲಾಗಿದೆ." : "Your audio response has been saved and transcribed successfully.")
          : (lang === 'kn' ? "ನಿಮ್ಮ ಆಡಿಯೊ ಉತ್ತರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇವ್ ಮಾಡಲಾಗಿದೆ." : "Your audio response has been saved successfully.");

        toast({
          title: toastMessage,
          description: toastDescription,
        });

        console.log('📤 Calling onRecordingComplete with transcription:', {
          hasTranscription: !!result.transcription,
          transcriptionLength: result.transcription?.length || 0
        });

        onRecordingComplete(audioBlob, result.transcription);
      } else {
        throw new Error(result.error || 'Processing failed');
      }

    } catch (error) {
      console.error('Audio processing error:', error);
      setState(prev => ({
        ...prev,
        isUploading: false,
        buttonState: 'idle' as RecordingButtonState,
        isSaving: false
      }));

      setErrorState('error', 'Failed to save audio response. Your recording is saved locally.');

      toast({
        title: lang === 'kn' ? "ಸಂಸ್ಕರಣೆ ವಿಫಲವಾಗಿದೆ" : "Processing Failed",
        description: error instanceof Error ? error.message : (lang === 'kn' ? "ಆಡಿಯೊ ಉತ್ತರವನ್ನು ಸಂಸ್ಕರಿಸಲು ವಿಫಲವಾಗಿದೆ." : "Failed to process audio response."),
        variant: "destructive",
      });

      onRecordingComplete(audioBlob);
    }
  }, [studentId, assessmentId, assessmentType, assessmentTitle, questionId, language, onRecordingComplete, toast, setErrorState]);

  // Start recording
  const startRecording = useCallback(async () => {
    console.log('🎯 startRecording called!');

    // Safety check: Ensure assessment ID is present if we are in assessment mode
    if ((studentId || assessmentType) && !assessmentId) {
      console.warn('⚠️ AudioRecorder: assessmentId is missing, cannot start recording');
      toast({
        title: lang === 'kn' ? "ಇನ್ನೂ ಸಿದ್ಧವಾಗಿಲ್ಲ" : "Not Ready",
        description: lang === 'kn' ? "ದಯವಿಟ್ಟು ಒಂದು ಕ್ಷಣ ನಿರೀಕ್ಷಿಸಿ, ಸಿಸ್ಟಮ್ ಇನ್ನೂ ಲೋಡ್ ಆಗುತ್ತಿದೆ..." : "Please wait a moment, the system is initializing...",
        variant: "default",
      });
      return;
    }

    // Mark interaction and clear any previous errors
    markInteraction();
    clearError();

    if (!state.hasPermission) {
      console.log('❌ No permission, requesting...');
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.log('❌ Permission denied, exiting');
        setErrorState('error', 'Microphone access is required to record audio responses.');
        return;
      }
      console.log('✅ Permission granted');
    } else {
      console.log('✅ Permission already granted');
    }

    // Show mic check if enabled and not done yet
    if (showMicCheck && !state.micChecked) {
      console.log('🔍 Mic check required, showing modal');
      setState(prev => ({ ...prev, showMicCheckModal: true }));
      return;
    }

    console.log('🔍 Proceeding to recording logic...');

    // Start countdown instead of immediately recording
    startCountdown();
    return;
  }, [state.hasPermission, state.isOnline, maxDuration, processAudioResponse, toast, markInteraction, clearError, setErrorState, startCountdown, showMicCheck, state.micChecked, requestMicrophonePermission, studentId, assessmentType, assessmentId, lang]);

  // Actual recording start function (called after countdown)
  const startActualRecording = useCallback(async () => {
    try {
      console.log('🔍 Starting actual recording process...');

      // Guard: Don't start if already recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('⚠️ Already recording, skipping...');
        return;
      }

      // Check if we have a valid stream with active tracks
      const hasActiveStream = streamRef.current &&
        streamRef.current.getTracks().length > 0 &&
        streamRef.current.getTracks().some(track => track.readyState === 'live');

      if (!hasActiveStream) {
        console.log('📡 No active stream found, requesting new stream...');

        // Stop any existing tracks first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Request a fresh stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: AUDIO_CONFIG.sampleRate,
            channelCount: AUDIO_CONFIG.channels,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        streamRef.current = stream;
        console.log('✅ New active stream obtained with', stream.getTracks().length, 'tracks');
      } else {
        console.log('✅ Using existing active stream');
      }

      // Double-check we have active tracks
      const activeTracks = streamRef.current.getTracks().filter(track => track.readyState === 'live');
      if (activeTracks.length === 0) {
        console.log('⚠️ No active audio tracks found after stream check');
        throw new Error('No active audio tracks available for recording');
      }
      console.log('✅ Active audio tracks confirmed:', activeTracks.length);

      // Create MediaRecorder with simplified approach
      let mediaRecorder: MediaRecorder;

      try {
        // Try the simplest approach first - no mimeType specification
        console.log('🔄 Creating MediaRecorder with default settings...');
        mediaRecorder = new MediaRecorder(streamRef.current);
        console.log('✅ MediaRecorder created with default settings');
      } catch (error) {
        console.error('❌ Failed to create MediaRecorder with default settings:', error);

        // Try with specific mimeType
        const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg'];
        let success = false;

        for (const mimeType of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            try {
              console.log(`🔄 Trying MediaRecorder with mimeType: ${mimeType}`);
              mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
              console.log(`✅ MediaRecorder created with mimeType: ${mimeType}`);
              success = true;
              break;
            } catch (mimeError) {
              console.log(`❌ Failed with mimeType ${mimeType}:`, mimeError);
            }
          }
        }

        if (!success) {
          throw new Error('Failed to create MediaRecorder with any supported format');
        }
      }
      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 MediaRecorder stopped');
        const audioBlob = new Blob(audioChunksRef.current, {
          type: AUDIO_CONFIG.mimeType
        });
        setState(prev => ({
          ...prev,
          audioBlob,
          audioUrl: URL.createObjectURL(audioBlob)
        }));
        processAudioResponse(audioBlob);
      };

      // Start recording with simplified approach
      console.log('🎬 Starting MediaRecorder...');
      try {
        // Add a small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check MediaRecorder state
        console.log('📊 MediaRecorder state:', mediaRecorder.state);

        if (mediaRecorder.state === 'inactive') {
          mediaRecorder.start(1000); // Collect data every second
          console.log('✅ MediaRecorder started successfully');
        } else {
          console.log('⚠️ MediaRecorder not in inactive state:', mediaRecorder.state);
          throw new Error(`MediaRecorder is in ${mediaRecorder.state} state, cannot start`);
        }
      } catch (startError) {
        console.error('❌ Failed to start MediaRecorder:', startError);
        throw new Error(`Failed to start recording: ${startError.message}`);
      }

      console.log('📊 Updating state to recording...');
      setState(prev => {
        const newState = {
          ...prev,
          isRecording: true,
          duration: 0,
          buttonState: 'recording' as RecordingButtonState,
          waveformData: []
        };
        return newState;
      });
      console.log('✅ State updated to recording');

      // Start duration timer and waveform data collection
      recordingIntervalRef.current = setInterval(() => {
        setState(prev => {
          const newDuration = prev.duration + 1000;
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          return { ...prev, duration: newDuration };
        });
      }, 1000);

      // Start waveform data collection
      if (streamRef.current) {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(streamRef.current);
        source.connect(analyser);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const collectWaveformData = () => {
          if (state.isRecording) {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            setState(prev => ({
              ...prev,
              waveformData: [...prev.waveformData.slice(-49), average]
            }));
            requestAnimationFrame(collectWaveformData);
          }
        };
        collectWaveformData();
      }

      // Use setTimeout to avoid setState during render warning
      setTimeout(() => {
        toast({
          title: lang === 'kn' ? "ರೆಕಾರ್ಡಿಂಗ್ ಆರಂಭವಾಗಿದೆ" : "Recording Started",
          description: lang === 'kn' ? "ನಿಮ್ಮ ಮೈಕ್ರೋಫೋನ್‌ಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ. ಮುಗಿದ ನಂತರ ನಿಲ್ಲಿಸಿ ಒತ್ತಿ." : "Speak clearly into your microphone. Tap stop when finished.",
        });
      }, 0);

    } catch (error) {
      console.error('❌ Error starting recording:', error);

      setErrorState('error', 'Failed to start recording. Please check your microphone and try again.');

      // Use setTimeout to avoid setState during render warning
      setTimeout(() => {
        toast({
          title: "Recording Error",
          description: "Failed to start recording. Please try again.",
          variant: "destructive",
        });
      }, 0);
    }
  }, [state.hasPermission, state.isOnline, maxDuration, processAudioResponse, toast, setErrorState]);

  // Handle countdown completion
  const hasStartedRecordingRef = useRef(false);

  useEffect(() => {
    if (!state.countdownActive && state.countdownValue === 3 && state.buttonState === 'recording' && !hasStartedRecordingRef.current) {
      // Countdown just finished, start actual recording
      hasStartedRecordingRef.current = true;
      startActualRecording();
    }

    // Reset the flag when not in recording state
    if (state.buttonState !== 'recording') {
      hasStartedRecordingRef.current = false;
    }
  }, [state.countdownActive, state.countdownValue, state.buttonState]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isRecording: false,
        buttonState: 'processing' as RecordingButtonState,
        isAnalyzing: true
      }));

      toast({
        title: lang === 'kn' ? "ರೆಕಾರ್ಡಿಂಗ್ ಪೂರ್ಣಗೊಂಡಿದೆ" : "Recording Complete",
        description: allowRetry
          ? (lang === 'kn' ? "ನಿಮ್ಮ ಆಡಿಯೊ ರೆಕಾರ್ಡ್ ಮಾಡಲಾಗಿದೆ. ನೀವು ಅದನ್ನು ಪ್ಲೇ ಮಾಡಬಹುದು ಅಥವಾ ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಬಹುದು." : "Your audio has been recorded. You can play it back or record again.")
          : (lang === 'kn' ? "ನಿಮ್ಮ ಆಡಿಯೊ ರೆಕಾರ್ಡ್ ಮಾಡಲಾಗಿದೆ. ನೀವು ಪರಿಶೀಲಿಸಲು ಅದನ್ನು ಪ್ಲೇ ಮಾಡಬಹುದು." : "Your audio has been recorded. You can play it back to review."),
      });
    }
  }, [state.isRecording, allowRetry, toast]);

  // Play audio
  const playAudio = useCallback(() => {
    const audioUrlToUse = state.audioUrl || initialAudioUrl;
    if (audioRef.current && audioUrlToUse) {
      // Ensure audio element has the correct source
      if (audioRef.current.src !== audioUrlToUse) {
        audioRef.current.src = audioUrlToUse;
      }

      if (state.isPlaying) {
        audioRef.current.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          toast({
            title: lang === 'kn' ? 'ದೋಷ' : 'Error',
            description: lang === 'kn' ? 'ಆಡಿಯೊ ಪ್ಲೇ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to play audio',
            variant: 'destructive'
          });
        });
        setState(prev => ({ ...prev, isPlaying: true }));
      }
    }
  }, [state.audioUrl, state.isPlaying, initialAudioUrl, toast, lang]);

  // Reset recording
  const resetRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      isPlaying: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      isUploading: false,
      uploadProgress: 0,
      hasRecorded: false,
      buttonState: 'idle',
      savedAt: null,
      isSaving: false,
      waveformData: [],
      isAnalyzing: false,
      showPreview: false,
      previewUrl: null,
    }));

    audioChunksRef.current = [];
  }, []);

  // Format duration helper
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Enhanced compact mode with dynamic button states
  if (compact) {
    const getButtonConfig = () => {
      // Handle countdown state
      if (state.countdownActive) {
        return {
          label: `⏰ ${state.countdownValue}`,
          icon: <Clock className="w-4 h-4" />,
          variant: 'secondary' as const,
          className: 'bg-orange-500 text-white animate-pulse',
          disabled: true,
          onClick: () => { },
          extraUI: 'Get ready to speak...'
        };
      }

      // Handle paused state
      if (state.isPaused) {
        return {
          label: '▶️ Resume',
          icon: <Play className="w-4 h-4" />,
          variant: 'default' as const,
          className: 'bg-blue-500 hover:bg-blue-600 text-white',
          disabled: false,
          onClick: resumeRecording,
          extraUI: 'Recording paused'
        };
      }

      switch (state.buttonState) {
        case 'idle':
          if (!state.hasPermission) {
            return {
              label: '🎤 Allow Microphone',
              icon: <Mic className="w-4 h-4" />,
              variant: 'default' as const,
              className: 'bg-orange-500 hover:bg-orange-600 text-white',
              disabled: disabled,
              onClick: requestMicrophonePermission,
              extraUI: 'Click to allow microphone access'
            };
          }
          return {
            label: lang === 'kn' ? '🎤 ರೆಕಾರ್ಡ್' : '🎤 Record',
            icon: <Mic className="w-4 h-4" />,
            variant: 'default' as const,
            className: 'bg-blue-500 hover:bg-blue-600 text-white',
            disabled: disabled || (lockAfterSave && (state.buttonState === 'saved' || !!initialAudioUrl || !!initialSavedAt || !!initialTranscription)),
            onClick: startRecording,
            extraUI: lockAfterSave && (state.buttonState === 'saved' || !!initialAudioUrl || !!initialSavedAt || !!initialTranscription) ? (lang === 'kn' ? 'ಸೇವ್ ನಂತರ ರೆಕಾರ್ಡಿಂಗ್ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ' : 'Recording locked after save') : (lang === 'kn' ? 'ರೆಕಾರ್ಡ್ ಮಾಡಲು ಸಿದ್ಧ' : 'Ready to record')
          };
        case 'recording':
          return {
            label: '⏺️ Stop',
            icon: <Square className="w-4 h-4 animate-pulse" />,
            variant: 'destructive' as const,
            className: 'bg-red-500 hover:bg-red-600 text-white',
            disabled: false,
            onClick: stopRecording,
            extraUI: (
              <div className="flex items-center gap-2 text-sm">
                <Timer className="w-3 h-3" />
                <span>{formatDuration(maxDuration - state.duration)} / {formatDuration(maxDuration)}</span>
              </div>
            )
          };
        case 'processing':
          return {
            label: lang === 'kn' ? '⏳ ಸೇವ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : '⏳ Saving...',
            icon: <Loader2 className="w-4 h-4 animate-spin" />,
            variant: 'secondary' as const,
            className: 'bg-gray-500 text-white',
            disabled: true,
            onClick: () => { },
            extraUI: lang === 'kn' ? 'ಆಡಿಯೊವನ್ನು ಬರೆಯಲಾಗುತ್ತಿದೆ...' : 'Transcribing audio...'
          };
        case 'saved':
          return {
            label: lang === 'kn' ? '✅ ಸೇವ್ ಮಾಡಲಾಗಿದೆ' : '✅ Saved',
            icon: <CheckCircle className="w-4 h-4" />,
            variant: 'outline' as const,
            className: 'bg-green-50 border-green-200 text-green-700',
            disabled: false,
            onClick: () => { },
            extraUI: (state.savedAt || initialSavedAt) ? (lang === 'kn' ? `ಸೇವ್ ಮಾಡಲಾಗಿದೆ: ${new Date(state.savedAt || initialSavedAt as string).toLocaleTimeString()}` : `Saved at ${new Date(state.savedAt || initialSavedAt as string).toLocaleTimeString()}`) : (lang === 'kn' ? 'ಆಡಿಯೊ ಯಶಸ್ವಿಯಾಗಿ ಸೇವ್ ಮಾಡಲಾಗಿದೆ' : 'Audio saved successfully')
          };
        default:
          return {
            label: lang === 'kn' ? '🎤 ರೆಕಾರ್ಡ್' : '🎤 Record',
            icon: <Mic className="w-4 h-4" />,
            variant: 'default' as const,
            className: 'bg-blue-500 hover:bg-blue-600 text-white',
            disabled: disabled || !state.hasPermission || (lockAfterSave && (state.buttonState === 'saved' || !!initialAudioUrl || !!initialSavedAt || !!initialTranscription)),
            onClick: startRecording,
            extraUI: lockAfterSave && (state.buttonState === 'saved' || !!initialAudioUrl || !!initialSavedAt || !!initialTranscription) ? (lang === 'kn' ? 'ಸೇವ್ ನಂತರ ರೆಕಾರ್ಡಿಂಗ್ ಲಾಕ್ ಮಾಡಲಾಗಿದೆ' : 'Recording locked after save') : (lang === 'kn' ? 'ರೆಕಾರ್ಡ್ ಮಾಡಲು ಸಿದ್ಧ' : 'Ready to record')
          };
      }
    };

    const buttonConfig = getButtonConfig();

    return (
      <div className={`${className}`} style={{ position: 'relative', zIndex: 1 }}>
        {/* Phase 2: Card-like container with better visual hierarchy */}
        <Card className={`border-0 shadow-sm transition-all duration-200 ${state.errorState === 'error' ? 'border-red-200 bg-red-50' :
          state.errorState === 'warning' ? 'border-yellow-200 bg-yellow-50' :
            state.buttonState === 'recording' ? 'border-red-200 bg-red-50' :
              state.buttonState === 'saved' ? 'border-green-200 bg-green-50' :
                'border-gray-200 bg-white'
          }`}>
          <CardContent className="p-3">
            {/* Header with question number and status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${state.buttonState === 'saved' ? 'bg-green-500 text-white' :
                  state.buttonState === 'recording' ? 'bg-red-500 text-white' :
                    state.buttonState === 'processing' ? 'bg-gray-500 text-white' :
                      'bg-blue-500 text-white'
                  }`}>
                  🎤
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">{lang === 'kn' ? 'ಆಡಿಯೊ ಉತ್ತರ' : 'Audio Response'}</span>
                  {state.savedAt && (
                    <div className="text-xs text-green-600">Saved at {state.savedAt}</div>
                  )}
                </div>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-1">
                {state.buttonState === 'saved' && (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                    {lang === 'kn' ? 'ಸೇವ್ ಮಾಡಲಾಗಿದೆ' : 'Saved'}
                  </Badge>
                )}
                {state.hasPermission ? (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                    {lang === 'kn' ? 'ಸಿದ್ಧ' : 'Ready'}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Allow Mic
                  </Badge>
                )}
                {state.hasTranscription && (
                  <Badge variant="outline" className="text-xs text-blue-700 border-blue-200">
                    Transcribed{typeof state.transcriptionConfidence === 'number' ? ` • ${state.transcriptionConfidence.toFixed(2)}` : ''}
                  </Badge>
                )}
                {!state.isOnline && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    Offline
                  </Badge>
                )}
              </div>
            </div>

            {/* Main content area */}
            <div className="space-y-3">
              {/* Dynamic Button */}
              <Button
                onClick={buttonConfig.onClick}
                disabled={buttonConfig.disabled}
                size="sm"
                variant={buttonConfig.variant}
                className={`w-full flex items-center justify-center gap-2 transition-all duration-200 ${buttonConfig.className}`}
                style={{
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative',
                  minHeight: '40px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {buttonConfig.icon}
                {buttonConfig.label}
              </Button>

              {/* Waveform Visualization (only during recording) */}
              {state.buttonState === 'recording' && state.waveformData.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Audio Level</div>
                  <WaveformVisualizer data={state.waveformData} isRecording={true} />
                </div>
              )}

              {/* Playback button - show whenever audio is available */}
              {(state.audioUrl || initialAudioUrl) && state.buttonState !== 'recording' && state.buttonState !== 'processing' && (
                <Button
                  onClick={playAudio}
                  size="sm"
                  variant="outline"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  disabled={!state.audioUrl && !initialAudioUrl}
                >
                  {state.isPlaying ? (
                    <>
                      <Pause className="w-3 h-3 mr-2" />
                      {lang === 'kn' ? 'ವಿರಾಮ' : 'Pause'}
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-2" />
                      {lang === 'kn' ? 'ಆಡಿಯೊ ಪ್ಲೇ ಮಾಡಿ' : 'Play Audio'}
                    </>
                  )}
                </Button>
              )}

              {/* Extra UI based on state */}
              {buttonConfig.extraUI && (
                <div className="text-xs text-gray-600 text-center">
                  {typeof buttonConfig.extraUI === 'string' ? (
                    <span>{buttonConfig.extraUI}</span>
                  ) : (
                    buttonConfig.extraUI
                  )}
                </div>
              )}

              {/* Microphone permission help */}
              {!state.hasPermission && (
                <div className="p-3 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Microphone Access Required</div>
                      <div className="text-xs mt-1">Click "Allow Microphone" to enable audio recording</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 2: Error display */}
              {state.showError && state.errorMessage && (
                <div className={`p-3 rounded-lg text-sm ${state.errorState === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  state.errorState === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{state.errorMessage}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Audio element for playback in compact mode */}
            {(state.audioUrl || initialAudioUrl) && (
              <audio
                ref={audioRef}
                src={state.audioUrl || initialAudioUrl || undefined}
                onEnded={() => setState(prev => ({ ...prev, isPlaying: false }))}
                className="hidden"
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className={`w-full ${className} transition-all duration-200 ${state.errorState === 'error' ? 'border-red-200 bg-red-50' :
      state.errorState === 'warning' ? 'border-yellow-200 bg-yellow-50' :
        state.buttonState === 'recording' ? 'border-red-200 bg-red-50' :
          state.buttonState === 'saved' ? 'border-green-200 bg-green-50' :
            'border-gray-200 bg-white'
      }`}>
      <CardContent className="p-6">
        {/* Phase 2: Enhanced header with better visual hierarchy */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${state.buttonState === 'saved' ? 'bg-green-500 text-white' :
              state.buttonState === 'recording' ? 'bg-red-500 text-white' :
                state.buttonState === 'processing' ? 'bg-gray-500 text-white' :
                  'bg-blue-500 text-white'
              }`}>
              🎤
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{lang === 'kn' ? 'ಆಡಿಯೊ ಉತ್ತರ' : 'Audio Response'}</h3>
              <p className="text-sm text-gray-600">
                {state.savedAt ? (lang === 'kn' ? `ಸೇವ್ ಮಾಡಲಾಗಿದೆ: ${state.savedAt}` : `Saved at ${state.savedAt}`) : (lang === 'kn' ? 'ನಿಮ್ಮ ಧ್ವನಿ ಉತ್ತರವನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ' : 'Record your voice answer')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state.hasPermission ? (
              <Badge variant="default" className="bg-green-100 text-green-700">
                {lang === 'kn' ? 'ಮೈಕ್ ಸಿದ್ಧ' : 'Mic Ready'}
              </Badge>
            ) : (
              <Badge variant="destructive">
                {lang === 'kn' ? 'ಮೈಕ್ ಅಗತ್ಯ' : 'Mic Required'}
              </Badge>
            )}
            {!state.isOnline && (
              <Badge variant="outline" className="text-orange-600">
                Offline Mode
              </Badge>
            )}
          </div>
        </div>

        {/* Duration and progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Duration: {formatDuration(state.duration)}</span>
            <span>Max: {formatDuration(maxDuration)}</span>
          </div>
          <Progress
            value={(state.duration / maxDuration) * 100}
            className="h-2"
          />
        </div>

        {/* Waveform Visualization */}
        {state.waveformData.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Audio Waveform</div>
            <WaveformVisualizer data={state.waveformData} isRecording={state.isRecording} />
          </div>
        )}

        {/* Phase 2: Error display */}
        {state.showError && state.errorMessage && (
          <div className={`mb-4 p-4 rounded-lg ${state.errorState === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            state.errorState === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
              'bg-gray-50 text-gray-700 border border-gray-200'
            }`}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">{state.errorMessage}</div>
                {state.errorState === 'error' && (
                  <div className="text-xs text-red-600 mt-1">Please try again or contact support if the issue persists.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Recording controls with dynamic states */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {state.buttonState === 'idle' && (
            <>
              {!state.hasPermission ? (
                <Button
                  onClick={requestMicrophonePermission}
                  disabled={disabled}
                  size="lg"
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Allow Microphone
                </Button>
              ) : (
                <Button
                  onClick={startRecording}
                  disabled={disabled}
                  size="lg"
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              )}
            </>
          )}

          {state.buttonState === 'recording' && (
            <Button
              onClick={stopRecording}
              size="lg"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          )}

          {state.buttonState === 'processing' && (
            <Button
              size="lg"
              variant="secondary"
              disabled
              className="bg-gray-500 text-white cursor-not-allowed"
            >
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </Button>
          )}

          {/* Show playback button whenever audio is available (not just when saved) */}
          {(state.audioUrl || initialAudioUrl) && state.buttonState !== 'recording' && state.buttonState !== 'processing' && (
            <div className="flex items-center gap-3">
              <Button
                onClick={playAudio}
                size="lg"
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                disabled={!state.audioUrl && !initialAudioUrl}
              >
                {state.isPlaying ? (
                  <Pause className="w-5 h-5 mr-2" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                {state.isPlaying ? (lang === 'kn' ? 'ವಿರಾಮ' : 'Pause') : (lang === 'kn' ? 'ಆಡಿಯೊ ಪ್ಲೇ ಮಾಡಿ' : 'Play Audio')}
              </Button>

              {allowRetry && state.buttonState !== 'saved' && !initialAudioUrl && !initialSavedAt && (
                <Button
                  onClick={resetRecording}
                  size="lg"
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  {lang === 'kn' ? 'ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಿ' : 'Record Again'}
                </Button>
              )}
            </div>
          )}

          {state.buttonState === 'saved' && (
            <div className="flex items-center gap-3">
              {allowRetry && (
                <Button
                  onClick={resetRecording}
                  size="lg"
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  {lang === 'kn' ? 'ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಿ' : 'Record Again'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Audio element for playback */}
        {(state.audioUrl || initialAudioUrl) && (
          <audio
            ref={audioRef}
            src={state.audioUrl || initialAudioUrl || undefined}
            onEnded={() => setState(prev => ({ ...prev, isPlaying: false }))}
            className="hidden"
          />
        )}

        {/* Instructions */}
        {showInstructions && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Recording Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Speak clearly and at a normal pace</li>
              <li>Hold your device 6-8 inches from your mouth</li>
              <li>Record in a quiet environment if possible</li>
              <li>You can speak in Hindi or English</li>
              {!state.isOnline && (
                <li className="text-orange-600 font-medium">
                  Recording saved offline - will sync when online
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}