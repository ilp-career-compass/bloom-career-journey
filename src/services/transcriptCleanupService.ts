// Transcript Cleanup Service using Google Gemini
// Applies light grammar/spell/punctuation cleanup while preserving meaning

import { supabase } from '@/integrations/supabase/client';

export interface CleanupResult {
  cleanedText: string;
  rawText: string;
  model: string;
}

class TranscriptCleanupService {
  isConfigured(): boolean {
    return true; // API calls routed through gemini-proxy Edge Function
  }

  async clean(rawText: string, languageCode: string = 'en-IN'): Promise<CleanupResult> {
    const text = (rawText || '').trim();
    if (!text) {
      return { cleanedText: rawText, rawText, model: 'none' };
    }

    // If not configured, return as-is
    if (!this.isConfigured()) {
      return { cleanedText: rawText, rawText, model: 'none' };
    }

    try {
      const prompt = [
        'Clean up this transcript with light touch-up:',
        '- Fix obvious spelling/grammar and punctuation.',
        '- Keep the original meaning; do not rewrite content.',
        '- Keep proper nouns (names/places) unchanged.',
        '- Output only the cleaned text with no additional commentary.',
        `Language: ${languageCode || 'en-IN'}`,
        '',
        rawText,
      ].join('\n');

      const body = {
        contents: [
          {
            parts: [
              { text: prompt },
            ],
          },
        ],
        // Keep defaults minimal to reduce latency/cost
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      } as any;

      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { model: 'gemini-2.5-flash', contents: body.contents, generationConfig: body.generationConfig },
      });

      if (error || !data) {
        return { cleanedText: rawText, rawText, model: 'gemini:failed' };
      }

      const cleaned = data?.candidates?.[0]?.content?.parts?.[0]?.text || rawText;
      return { cleanedText: cleaned, rawText, model: 'gemini-2.5-flash' };
    } catch {
      return { cleanedText: rawText, rawText, model: 'gemini:error' };
    }
  }
}

export const transcriptCleanupService = new TranscriptCleanupService();
export default transcriptCleanupService;


