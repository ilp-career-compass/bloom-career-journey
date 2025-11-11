import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force load speech-to-text service early to initialize API keys
import { speechToTextService } from './services/speechToTextService';

// Immediate check for API key - runs before anything else
console.log('🚀 [main.tsx] Application starting...');
console.log('🔑 [main.tsx] Google Speech API Key check:', {
  isSet: !!import.meta.env.VITE_GOOGLE_SPEECH_API_KEY,
  keyPreview: import.meta.env.VITE_GOOGLE_SPEECH_API_KEY ? `${import.meta.env.VITE_GOOGLE_SPEECH_API_KEY.substring(0, 20)}...` : 'NOT SET',
  keyLength: import.meta.env.VITE_GOOGLE_SPEECH_API_KEY?.length || 0,
});

// Verify service was initialized
console.log('🔑 [main.tsx] SpeechToText service initialized:', {
  isGoogleConfigured: speechToTextService.isGoogleConfigured(),
  isAzureConfigured: speechToTextService.isAzureConfigured(),
});

console.log('main.tsx starting...');

// Check if root element exists
const rootElement = document.getElementById("root");
console.log('Root element found:', !!rootElement);

if (!rootElement) {
  console.error('Root element not found! This will cause a blank screen.');
  throw new Error('Root element not found');
}

try {
  const root = createRoot(rootElement);
  console.log('React root created successfully');
  
  root.render(<App />);
  console.log('App component rendered');
} catch (error) {
  console.error('Error rendering app:', error);
}
