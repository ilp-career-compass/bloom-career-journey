import { logger } from '@/lib/logger';

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
  constructor() {
    // API calls routed through gemini-proxy Edge Function — no client-side key needed
  }

  isConfigured(): boolean {
    return true; // API calls routed through gemini-proxy Edge Function
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

      // Try models in order: 2.0-flash-exp → exp-1206 → 1.5-flash
      for (const model of ['gemini-2.0-flash-exp', 'gemini-exp-1206', 'gemini-1.5-flash']) {
        try {
          return await this.callApi(model, requestBody);
        } catch (error) {
          logger.warn(`Model ${model} failed:`, error);
          if (model === 'gemini-1.5-flash') throw error;
        }
      }

    } catch (error: any) {
      logger.error('AIChatService Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to AI service.'
      };
    }
  }

  private async callApi(model: string, body: any): Promise<ChatResponse> {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: { model, contents: body.contents, generationConfig: body.generationConfig },
    });

    if (error) {
      throw new Error(error.message || `Gemini proxy error for model ${model}`);
    }
    
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
