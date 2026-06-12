import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

class GeminiTranslationService {
  private cache: Map<string, string> = new Map();

  // Unicode character checks to detect if a script contains Hindi/Kannada/Tamil
  containsKannada(text: string): boolean {
    return /[\u0C80-\u0CFF]/.test(text);
  }

  containsTamil(text: string): boolean {
    return /[\u0B80-\u0BFF]/.test(text);
  }

  containsHindi(text: string): boolean {
    return /[\u0900-\u097F]/.test(text);
  }

  // Detect script
  detectLanguage(text: string): 'en' | 'kn' | 'ta' | 'hi' {
    if (this.containsKannada(text)) return 'kn';
    if (this.containsTamil(text)) return 'ta';
    if (this.containsHindi(text)) return 'hi';
    return 'en';
  }

  // Get full language name
  private getFullLanguageName(lang: string): string {
    switch (lang) {
      case 'kn': return 'Kannada';
      case 'ta': return 'Tamil';
      case 'hi': return 'Hindi';
      case 'en':
      default:
        return 'English';
    }
  }

  /**
   * Bulk-translates a list of strings in a single Gemini request.
   */
  async translateArray(texts: string[], targetLang: string): Promise<string[]> {
    if (texts.length === 0) return [];

    // Filter out texts that do not need translation (e.g. empty or already in the target language)
    const neededTranslations: { index: number; text: string }[] = [];
    const results: string[] = [...texts];

    texts.forEach((text, index) => {
      if (!text || typeof text !== 'string' || !text.trim()) {
        return;
      }

      const cacheKey = `${targetLang}:${text}`;
      if (this.cache.has(cacheKey)) {
        results[index] = this.cache.get(cacheKey)!;
        return;
      }

      // Check script to see if it matches target language
      const detected = this.detectLanguage(text);
      if (detected === targetLang) {
        // Already in target language script, skip translating
        return;
      }

      // For english, if there are no Indian characters, skip translating
      if (targetLang === 'en' && detected === 'en') {
        return;
      }

      neededTranslations.push({ index, text });
    });

    if (neededTranslations.length === 0) {
      return results;
    }

    try {
      const targetLangName = this.getFullLanguageName(targetLang);
      const inputJSON = neededTranslations.map(item => item.text);

      const systemPrompt = `You are a professional, accurate translator. You will translate a JSON array of strings into ${targetLangName}.
Requirements:
1. Translate all text accurately into ${targetLangName}.
2. Maintain the first-person perspective ("I", "my", "me") as these are student responses.
3. Keep the original formatting, paragraph breaks, HTML tags, and punctuation.
4. Keep proper nouns and technical words in the appropriate form for the translation.
5. Return ONLY a valid JSON array of strings in the exact same order as the input. Do not wrap the JSON in Markdown formatting like \`\`\`json \`\`\` - output the raw JSON array string. No preamble, no explanation.`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: `Translate the following JSON array of strings into ${targetLangName}:\n\n${JSON.stringify(inputJSON)}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
        }
      };

      const models = [ 'gemini-2.5-flash',
  'gemini-2.5-flash-lite'];
      let responseText = '';
      let success = false;

      for (const model of models) {
        try {
          const result = await supabase.functions.invoke('gemini-proxy', {
            body: {
              model,
              contents: requestBody.contents,
              generationConfig: requestBody.generationConfig,
              systemInstruction: { parts: [{ text: systemPrompt }] }
            }
          });

          if (!result.error && result.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            responseText = result.data.candidates[0].content.parts[0].text;
            success = true;
            break;
          }
          logger.warn(`geminiTranslationService: translation with model ${model} failed`, result.error);
        } catch (e) {
          logger.warn(`geminiTranslationService: exception with model ${model}`, e);
        }
      }

      if (!success) {
        throw new Error('All models failed to translate text');
      }

      // Parse response JSON
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const translatedStrings = JSON.parse(cleanedText);
      if (Array.isArray(translatedStrings) && translatedStrings.length === neededTranslations.length) {
        translatedStrings.forEach((trans, i) => {
          const item = neededTranslations[i];
          if (trans && typeof trans === 'string' && item) {
            results[item.index] = trans;
            // Save to cache
            this.cache.set(`${targetLang}:${item.text}`, trans);
          }
        });
      } else {
        logger.error('geminiTranslationService: translated array size mismatch or invalid format', translatedStrings);
      }
    } catch (error) {
      logger.error('geminiTranslationService: failed to translate batch', error);
      // Fallback: return original text
    }

    return results;
  }

  /**
   * Helper to translate a single string.
   */
  async translateText(text: string, targetLang: string): Promise<string> {
    if (!text || !text.trim()) return text;
    const result = await this.translateArray([text], targetLang);
    return result[0] || text;
  }

  /**
   * Automatically flattens, translates, and un-flattens any nested object/array structure.
   */
  async translateStructure<T>(obj: T, targetLang: string): Promise<T> {
    if (!obj || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        return (await this.translateText(obj, targetLang)) as unknown as T;
      }
      return obj;
    }

    // Capture all string leaf nodes and their paths
    const paths: { path: (string | number)[]; val: string }[] = [];
    const traverse = (node: any, currentPath: (string | number)[]) => {
      if (typeof node === 'string') {
        paths.push({ path: currentPath, val: node });
      } else if (Array.isArray(node)) {
        node.forEach((item, index) => traverse(item, [...currentPath, index]));
      } else if (node && typeof node === 'object') {
        Object.keys(node).forEach(key => traverse(node[key], [...currentPath, key]));
      }
    };

    traverse(obj, []);

    if (paths.length === 0) return obj;

    // Translate the extracted strings in a single batch call!
    const originalTexts = paths.map(p => p.val);
    const translatedTexts = await this.translateArray(originalTexts, targetLang);

    // Deep clone the object to avoid modifying arguments
    const cloned = JSON.parse(JSON.stringify(obj));

    // Restore the translated strings
    paths.forEach((item, index) => {
      const transVal = translatedTexts[index] || item.val;
      // Navigate to the leaf and update
      let current = cloned;
      for (let i = 0; i < item.path.length - 1; i++) {
        current = current[item.path[i]];
      }
      current[item.path[item.path.length - 1]] = transVal;
    });

    return cloned;
  }
}

export const geminiTranslationService = new GeminiTranslationService();
