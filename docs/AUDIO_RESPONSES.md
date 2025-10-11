# Audio Responses Implementation

This document describes the audio response feature implementation for the Bloom Career Journey platform, specifically designed for rural Indian students.

## 🎯 Overview

The audio response system allows students to record their answers to assessment questions instead of (or in addition to) typing. This is particularly beneficial for:

- **Rural students** who may express themselves better through speech
- **Dyslexic students** who find writing challenging
- **Non-native speakers** who are more comfortable speaking
- **Students with motor difficulties**

## 🏗️ Architecture

### Core Components

1. **AudioRecorder** (`src/components/ui/AudioRecorder.tsx`)
   - Offline-first mobile audio recorder
   - 16kHz mono recording with Opus compression
   - Visual waveform and recording controls
   - Automatic transcription integration

2. **Speech-to-Text Service** (`src/services/speechToTextService.ts`)
   - Google Cloud Speech-to-Text (primary)
   - Azure Speech Services (fallback)
   - Enhanced models for Indian accents
   - Language detection (Hindi/English)

3. **Supabase Upload Service** (`src/services/supabaseUploadService.ts`)
   - Resumable chunked uploads
   - Offline queuing
   - Retry logic for poor connectivity

4. **Audio Response Manager** (`src/services/audioResponseManager.ts`)
   - Orchestrates the complete pipeline
   - Handles offline sync
   - Database integration

### Database Schema

```sql
-- Audio responses stored in assessment_responses table
ALTER TABLE assessment_responses 
ADD COLUMN audio_responses JSONB;

-- Audio files metadata table
CREATE TABLE audio_files (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    assessment_id UUID REFERENCES assessment_responses(id),
    question_id TEXT,
    file_path TEXT,
    file_url TEXT,
    file_size BIGINT,
    duration_ms INTEGER,
    transcription TEXT,
    confidence_score DECIMAL(3,2),
    language_detected TEXT,
    upload_status TEXT
);
```

## 🚀 Features

### Offline-First Design
- **Record without internet** - Audio is saved locally
- **Automatic sync** - Uploads when connection is restored
- **Queue management** - Failed uploads are retried
- **Progress tracking** - Visual feedback for all operations

### Speech Recognition
- **Google Cloud Speech-to-Text** - Primary service with enhanced models
- **Azure Speech Services** - Fallback option
- **Indian accent optimization** - en-IN language model
- **Hindi/English support** - Automatic language detection
- **Confidence scoring** - Quality assessment of transcriptions

### Mobile Optimization
- **Touch-friendly interface** - Large buttons for mobile devices
- **Responsive design** - Works on various screen sizes
- **Bandwidth optimization** - Chunked uploads for slow connections
- **Battery efficiency** - Optimized recording settings

### Rural India Specific
- **Poor connectivity handling** - Resumable uploads
- **Regional accent support** - Enhanced models for Indian pronunciation
- **Code-switching support** - Hindi/English mixed speech
- **Offline capability** - Works without internet

## 📱 Usage

### Basic Integration

```tsx
import { AudioRecorder } from '@/components/ui/AudioRecorder';

<AudioRecorder
  questionId="video1_question1"
  onRecordingComplete={(audioBlob, transcription) => {
    // Handle completed recording
  }}
  studentId={studentId}
  assessmentId={assessmentId}
  assessmentType="inspiration"
  assessmentTitle="My Inspiration"
  enableTranscription={true}
  enableOfflineMode={true}
  maxDuration={120000} // 2 minutes
  language="en-IN"
/>
```

### With Text + Audio Options

```tsx
import { AudioResponseExample } from '@/components/assessments/AudioResponseExample';

<AudioResponseExample
  questionId="video1_question1"
  questionText="What inspired you most about this video?"
  studentId={studentId}
  assessmentId={assessmentId}
  assessmentType="inspiration"
  assessmentTitle="My Inspiration"
  onResponseChange={(questionId, textResponse, audioBlob) => {
    // Handle both text and audio responses
  }}
/>
```

## ⚙️ Configuration

### Environment Variables

```env
# Google Cloud Speech-to-Text
VITE_GOOGLE_SPEECH_API_KEY=your_api_key_here

# Azure Speech Services (fallback)
VITE_AZURE_SPEECH_KEY=your_azure_key_here
VITE_AZURE_SPEECH_REGION=your_azure_region_here

# Feature flags
VITE_ENABLE_AUDIO_RESPONSES=true
VITE_AUDIO_MAX_DURATION=120000
VITE_AUDIO_ENABLE_OFFLINE_MODE=true
VITE_AUDIO_ENABLE_TRANSCRIPTION=true
```

### Supabase Storage

Create a storage bucket named `assessment-audio` with the following policy:

```sql
-- Allow students to upload their own audio files
CREATE POLICY "Students can upload audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assessment-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🔧 Implementation Status

### ✅ Completed
- [x] AudioRecorder component with offline-first architecture
- [x] 16kHz mono recording with Opus compression
- [x] Local storage for offline capability
- [x] Supabase resumable upload service
- [x] Google Speech-to-Text integration
- [x] Azure Speech Services fallback
- [x] Database schema for audio responses
- [x] Audio Response Manager orchestration

### 🚧 In Progress
- [ ] Integration into Inspiration Assessment
- [ ] Consent flows and privacy compliance
- [ ] Basic noise reduction

### 📋 Pending
- [ ] Integration into Dreams Assessment
- [ ] Integration into Hobbies Assessment
- [ ] Integration into Role Models Assessment
- [ ] Teacher dashboard audio playback
- [ ] Analytics and reporting
- [ ] Performance optimization

## 🧪 Testing

### Manual Testing Checklist

- [ ] **Recording**: Can record audio successfully
- [ ] **Playback**: Can play recorded audio
- [ ] **Re-record**: Can delete and record again
- [ ] **Offline**: Works without internet connection
- [ ] **Sync**: Uploads when connection restored
- [ ] **Transcription**: Generates accurate transcriptions
- [ ] **Language Detection**: Correctly identifies Hindi/English
- [ ] **Mobile**: Works on mobile devices
- [ ] **Poor Connection**: Handles slow/unreliable internet
- [ ] **Error Handling**: Graceful failure and recovery

### Test Scenarios

1. **Rural Student Scenario**
   - Record audio on slow 2G connection
   - Go offline during recording
   - Resume when connection available
   - Verify transcription accuracy

2. **Hindi/English Mixed Speech**
   - Record responses mixing Hindi and English
   - Verify language detection
   - Check transcription quality

3. **Mobile Device Testing**
   - Test on various screen sizes
   - Verify touch interactions
   - Check audio quality on different devices

## 📊 Performance Metrics

### Target Metrics
- **Recording Quality**: Clear audio on basic smartphones
- **Upload Success**: >95% even with poor connectivity
- **Transcription Accuracy**: >90% for clear speech
- **Offline Sync**: 100% of queued items synced when online
- **User Experience**: <3 seconds to start recording

### Monitoring
- Upload success rates
- Transcription accuracy scores
- Offline queue sizes
- User completion rates
- Error frequencies

## 🔒 Privacy & Security

### Data Handling
- **Audio files**: Stored in Supabase Storage with RLS
- **Transcriptions**: Stored in PostgreSQL with encryption
- **Local storage**: Cleared after successful upload
- **API keys**: Stored securely in environment variables

### Consent
- **Microphone permission**: Required for recording
- **Data usage**: Clear explanation of how audio is used
- **Retention policy**: Audio files kept for assessment duration
- **Deletion**: Students can request data deletion

## 🚀 Deployment

### Prerequisites
1. Google Cloud Speech-to-Text API enabled
2. Azure Speech Services configured (optional)
3. Supabase Storage bucket created
4. Database migrations applied
5. Environment variables configured

### Steps
1. Run database migrations
2. Configure storage bucket policies
3. Set environment variables
4. Deploy application
5. Test audio recording functionality
6. Monitor performance metrics

## 📈 Future Enhancements

### Planned Features
- **Voice emotion analysis** - Detect student engagement
- **Speaking pace analysis** - Assess communication skills
- **Keyword extraction** - Identify key themes
- **Multi-language support** - Regional Indian languages
- **Real-time transcription** - Live speech-to-text
- **Audio quality enhancement** - Noise reduction, echo cancellation

### Integration Opportunities
- **Teacher dashboard** - Play audio responses
- **Analytics** - Speaking patterns and engagement
- **Accessibility** - Screen reader support
- **Mobile app** - Native audio recording
- **Offline sync** - Background processing

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript best practices
- Add comprehensive error handling
- Include accessibility features
- Test on mobile devices
- Document all public APIs
- Maintain offline-first architecture

### Code Structure
```
src/
├── components/ui/AudioRecorder.tsx
├── services/
│   ├── speechToTextService.ts
│   ├── supabaseUploadService.ts
│   └── audioResponseManager.ts
├── config/audioConfig.ts
└── components/assessments/AudioResponseExample.tsx
```

This implementation provides a robust, offline-first audio response system specifically designed for rural Indian students, with comprehensive transcription support and seamless integration with the existing assessment platform.
