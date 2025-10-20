// Transcript Cleanup Service using Google Gemini
// Applies light grammar/spell/punctuation cleanup while preserving meaning

export interface CleanupResult {
  cleanedText: string;
  rawText: string;
  model: string;
}

class TranscriptCleanupService {
  private apiKey?: string;
  private endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
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

      const resp = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        // On failure, fall back to raw
        return { cleanedText: rawText, rawText, model: 'gemini:failed' };
      }

      const data = await resp.json();
      const cleaned = data?.candidates?.[0]?.content?.parts?.[0]?.text || rawText;
      return { cleanedText: cleaned, rawText, model: 'gemini-1.5-flash-latest' };
    } catch {
      return { cleanedText: rawText, rawText, model: 'gemini:error' };
    }
  }
}

export const transcriptCleanupService = new TranscriptCleanupService();
export default transcriptCleanupService;


