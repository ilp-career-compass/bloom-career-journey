
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface ChatResponse {
  success: boolean;
  text?: string;
  error?: string;
}

class AIChatService {
  private apiKey: string | undefined;
  private endpoint: string;
  private fallbackEndpoint: string;
  private backupEndpoint: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // Primary: Gemini 2.0 Flash (Experimental) - Fast and capable
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    // Fallback 1: Gemini Experimental 1206
    this.fallbackEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-exp-1206:generateContent';
    // Fallback 2: Gemini 1.5 Flash (Stable backup)
    this.backupEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  async sendMessage(history: ChatMessage[], newMessage: string): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY.'
      };
    }

    try {
      // Construct the prompt history
      const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Add the new message
      contents.push({
        role: 'user',
        parts: [{ text: newMessage }]
      });

      // System instruction for persona
      const systemInstruction = {
        role: 'user',
        parts: [{ text: `
You are a helpful and empathetic career guidance counsellor for students in India (grades 8-12).
Your name is "Vidya Saathi".
- Keep answers concise, simple, and encouraging.
- Use simple English suitable for students.
- You can offer advice on career paths, study habits, motivation, and finding one's passion.
- If asked about specific ILP (India Literacy Project) details you don't know, politely say you don't have that specific information but can help with general career guidance.
- Do NOT make up facts.
        ` }]
      };
      
      // Gemini API expects system instructions to be passed differently depending on the model/version,
      // but simpler is to just prepend it to the history or strictly use the system_instruction field if supported.
      // For simplicity and compatibility across flash/pro, we'll prepend it as a 'user' message with a directive 
      // OR use the system_instruction field if we were using the Google AI SDK. 
      // Here we will just prepend it to the very first message for context.
      
      const finalContents = [
        systemInstruction,
        ...contents
      ];

      const requestBody = {
        contents: finalContents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
        }
      };

      // Attempt 1: Primary Endpoint
      try {
        return await this.callApi(this.endpoint, requestBody);
      } catch (error) {
        console.warn('Primary model failed, trying fallback 1...', error);
        
        // Attempt 2: Fallback Endpoint
        try {
            return await this.callApi(this.fallbackEndpoint, requestBody);
        } catch (error2) {
            console.warn('Fallback 1 failed, trying backup...', error2);
            
            // Attempt 3: Backup Endpoint
            return await this.callApi(this.backupEndpoint, requestBody);
        }
      }

    } catch (error: any) {
      console.error('AIChatService Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to AI service.'
      };
    }
  }

  private async callApi(url: string, body: any): Promise<ChatResponse> {
    const response = await fetch(`${url}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.candidates || data.candidates.length === 0) {
      // Check for safety blocks
      if (data.promptFeedback?.blockReason) {
        return {
            success: false,
            error: `I cannot answer that. (Safety Block: ${data.promptFeedback.blockReason})`
        };
      }
      throw new Error('No response candidates returned.');
    }

    const text = data.candidates[0].content?.parts?.[0]?.text;
    if (!text) {
        throw new Error('Empty text response from AI.');
    }

    return {
      success: true,
      text: text
    };
  }
}

export const aiChatService = new AIChatService();
