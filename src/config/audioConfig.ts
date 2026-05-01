// Audio Response Configuration
// Centralized configuration for audio recording and transcription features

export const AUDIO_CONFIG = {
  // Recording settings
  sampleRate: 16000, // 16kHz for speech recognition
  channels: 1, // Mono
  bitRate: 64000, // 64kbps
  mimeType: 'audio/webm;codecs=opus',
  maxDuration: parseInt(import.meta.env.VITE_AUDIO_MAX_DURATION || '120000'), // 2 minutes
  chunkSize: parseInt(import.meta.env.VITE_AUDIO_CHUNK_SIZE || '524288'), // 512KB
  
  // Feature flags
  enabled: import.meta.env.VITE_ENABLE_AUDIO_RESPONSES === 'true',
  offlineMode: import.meta.env.VITE_AUDIO_ENABLE_OFFLINE_MODE !== 'false',
  transcription: import.meta.env.VITE_AUDIO_ENABLE_TRANSCRIPTION !== 'false',
  
  // Storage settings
  bucket: 'assessment-audio',
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay
  
  // Transcription settings
  language: 'en-IN' as const,
  useEnhanced: true,
  enableAutomaticPunctuation: true,
  enableWordTimeOffsets: true,
  
  // UI settings
  showWaveform: true,
  showTranscription: true,
  allowReRecord: true,
  autoPlay: false,
};

export const AUDIO_FEATURES = {
  // Check if audio features are enabled
  isEnabled: () => AUDIO_CONFIG.enabled,
  
  // Check if transcription is available
  isTranscriptionAvailable: () => {
    return AUDIO_CONFIG.transcription && !!AUDIO_CONFIG.googleApiKey;
  },
  
  // Check if offline mode is enabled
  isOfflineModeEnabled: () => AUDIO_CONFIG.offlineMode,
  
  // Get available services
  getAvailableServices: () => {
    const services = [];
    if (AUDIO_CONFIG.googleApiKey) services.push('google');
    return services;
  },
  
  // Get primary service
  getPrimaryService: () => {
    if (AUDIO_CONFIG.googleApiKey) return 'google';
    return null;
  },
};

export const AUDIO_UI_TEXT = {
  // Recording instructions
  recordingTips: [
    "Speak clearly and at a normal pace",
    "Hold your device 6-8 inches from your mouth",
    "Record in a quiet environment if possible",
    "You can speak in Hindi or English",
  ],
  
  // Status messages
  status: {
    recording: "Recording... Tap stop when finished",
    processing: "Processing your audio...",
    uploading: "Uploading your response...",
    transcribing: "Transcribing your speech...",
    completed: "Response saved successfully!",
    failed: "Something went wrong. Please try again.",
    offline: "Recording saved offline - will sync when online",
  },
  
  // Button labels
  buttons: {
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    pauseRecording: "Pause",
    resumeRecording: "Resume",
    playAudio: "Play",
    pauseAudio: "Pause",
    reRecord: "Re-record",
    upload: "Upload",
  },
  
  // Error messages
  errors: {
    noMicrophone: "Microphone access is required for audio responses",
    recordingFailed: "Failed to start recording. Please check your microphone.",
    uploadFailed: "Failed to upload audio. Please check your internet connection.",
    transcriptionFailed: "Audio saved but transcription failed. You can try again later.",
    offlineMode: "You're offline. Audio will be saved and synced when you're back online.",
  },
};

export default AUDIO_CONFIG;
