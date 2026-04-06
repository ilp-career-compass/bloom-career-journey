import { logger } from '@/lib/logger';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force load speech-to-text service early to initialize API keys
import { speechToTextService } from './services/speechToTextService';

logger.log('🚀 [main.tsx] Application starting...');

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
