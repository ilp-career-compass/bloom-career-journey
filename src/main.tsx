import { logger } from '@/lib/logger';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force load speech-to-text service early to initialize API keys
import { speechToTextService } from './services/speechToTextService';

// Immediate check for API key - runs before anything else
logger.log('🚀 [main.tsx] Application starting...');
logger.log('🔑 [main.tsx] Google Speech API Key check:', {
  isSet: !!import.meta.env.VITE_GOOGLE_SPEECH_API_KEY,
  keyPreview: import.meta.env.VITE_GOOGLE_SPEECH_API_KEY ? `${import.meta.env.VITE_GOOGLE_SPEECH_API_KEY.substring(0, 20)}...` : 'NOT SET',
  keyLength: import.meta.env.VITE_GOOGLE_SPEECH_API_KEY?.length || 0,
});

// Verify service was initialized
logger.log('🔑 [main.tsx] SpeechToText service initialized:', {
  isGoogleConfigured: speechToTextService.isGoogleConfigured(),
  isAzureConfigured: speechToTextService.isAzureConfigured(),
});

logger.log('main.tsx starting...');

// Check if root element exists
const rootElement = document.getElementById("root");
logger.log('Root element found:', !!rootElement);

if (!rootElement) {
  logger.error('Root element not found! This will cause a blank screen.');
  throw new Error('Root element not found');
}

try {
  const root = createRoot(rootElement);
  logger.log('React root created successfully');
  
  root.render(<App />);
  logger.log('App component rendered');
} catch (error) {
  logger.error('Error rendering app:', error);
}
