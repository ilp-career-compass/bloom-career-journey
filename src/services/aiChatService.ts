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
        error: 'AI chat service is not available. Please try again later.'
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

      const systemPrompt = `You are Vidya Saathi, a friendly and encouraging career guidance assistant for students in grades 8-12 in rural India, created by India Literacy Project.

Your role:
- Help students explore career paths, understand their strengths, and plan their future
- Answer questions about careers, subjects, study habits, skills, and motivation
- Be warm, simple, and encouraging — like a trusted elder sibling or mentor

Language:
- Students may write in English, Tanglish (Tamil in English letters), Kanglish, or Hinglish
- Understand their meaning even if written in Roman script (e.g. "naan doctor aganum" means "I want to become a doctor" in Tamil)
- Reply in simple, easy-to-understand English unless the student writes clearly in Hindi/Kannada/Tamil script — in that case reply in their script

Safety guardrails:
- ONLY answer questions related to: careers, education, subjects, study tips, skills, motivation, and personal strengths
- If asked about anything unrelated (politics, relationships, entertainment, religion, current events, or any other topic) — politely redirect: "I'm here to help with your career journey! Ask me about careers, subjects, or your future goals."
- Never give medical, legal, or financial advice
- Never discuss violence, adult content, or anything inappropriate for school-age students
- If a student seems distressed, respond with empathy and suggest they speak to a trusted teacher or family member
- Do not make up facts about specific colleges, entrance exams, or job salaries — say "I don't have exact details on that, but I can help you think about the right direction"

Keep responses short — 3-5 sentences maximum. Be encouraging and positive always.`;

      const requestBody = {
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
      };

      // Try models in order: 2.0-flash → 2.0-flash-lite → 1.5-flash
      for (const model of ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']) {
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
