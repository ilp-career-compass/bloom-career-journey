import { logger } from '@/lib/logger';

// AI Summary Service - Generates reflective summaries using Gemini API

import { SummaryQuestions } from '@/types/assessmentSummary';
import { supabase } from '@/integrations/supabase/client';

interface VideoResponse {
  videoId: string;
  videoTitle: string;
  responses: {
    question1?: string;
    question2?: string;
    question3?: string;
    question4?: string;
    [key: string]: string | undefined;
  };
}

interface AssessmentResponses {
  [videoKey: string]: VideoResponse | any;
}

interface GenerateSummaryResult {
  success: boolean;
  summary?: SummaryQuestions;
  error?: string;
}

type SummaryTemplateLanguageBlock = {
  question1: string;
  question2: string;
  question3?: string;
  question4?: string;
  question5?: string;
  question6?: string;
  question7?: string;
  question8?: string;
  question9?: string;
  question10?: string;
  question11?: string;
  question12?: string;
  question13?: string;
  question14?: string;
  question15?: string;
  question16?: string;
  [key: string]: string | undefined;
};

interface SummaryTemplate {
  // English is always expected
  en: SummaryTemplateLanguageBlock;
  // Other language blocks are optional – fall back to English when missing
  kn?: SummaryTemplateLanguageBlock;
  ta?: SummaryTemplateLanguageBlock;
  hi?: SummaryTemplateLanguageBlock;
}

type SummaryLanguage = 'en' | 'kn' | 'ta' | 'hi';

const BASE_SYSTEM_PROMPT =
  'You are a career guidance counsellor for rural students in India. ' +
  "You will be provided with student responses from which you should draw your answers. " +
  'The answers must be without abbreviations, references, and notes. ' +
  'Your language will be simple, clear and relevant for grade 8 through grade 12 students. ' +
  'Answer in small simple sentences. ' +
  "Respond in the same language as the student's responses. " +
  "Be encouraging and positive — highlight the student's strengths before mentioning areas for growth. " +
  'Keep each summary answer to 2-3 sentences maximum. ' +
  "Do not use general knowledge beyond the student's responses. " +
  'Do not respond to questions from sources outside the data provided to you. ' +
  'Do not make up replies or provide general guidance. ' +
  'Always strive for accuracy, fairness, and respect in responding. ' +
  'Avoid generating content that promotes hate, violence, discrimination, sexually explicit material, pornography or misinformation. ' +
  'Instead, focus on providing constructive and helpful responses.';

class AISummaryService {

  private templateCache: Map<string, SummaryTemplate> = new Map();

  constructor() {
    // API calls routed through gemini-proxy Edge Function — no client-side key needed
  }

  /*
   * Check if Gemini API is configured
   */
  isConfigured(): boolean {
    return true; // API calls routed through gemini-proxy Edge Function
  }

  /**
   * Detect if text contains Kannada script (Unicode range: 0C80-0CFF)
   */
  private containsKannada(text: string): boolean {
    if (!text) return false;
    // Kannada Unicode range: 0C80-0CFF
    return /[\u0C80-\u0CFF]/.test(text);
  }

  /**
   * Detect if text contains Tamil script (Unicode range: 0B80-0BFF)
   */
  private containsTamil(text: string): boolean {
    if (!text) return false;
    // Tamil Unicode range: 0B80-0BFF
    return /[\u0B80-\u0BFF]/.test(text);
  }

  /**
   * Detect if text contains Hindi / Devanagari script (Unicode range: 0900-097F)
   */
  private containsHindi(text: string): boolean {
    if (!text) return false;
    // Devanagari Unicode range: 0900-097F
    return /[\u0900-\u097F]/.test(text);
  }

  /**
   * Detect if student responses are primarily in Kannada, Tamil, Hindi, or default to English.
   * - Works for BOTH flat and deeply nested response objects (sections, question groups, etc.).
   * - Looks only at the actual answer strings, not at UI language.
   * - If preferredLanguage is provided (and supported), it takes precedence.
   */
  private detectLanguage(responses: AssessmentResponses, preferredLanguage?: string): SummaryLanguage {
    // If a supported preferred language is provided, strictly enforce it
    if (preferredLanguage === 'kn') return 'kn';
    if (preferredLanguage === 'ta') return 'ta';
    if (preferredLanguage === 'hi') return 'hi';
    if (preferredLanguage === 'en') return 'en';

    let kannadaCount = 0;
    let tamilCount = 0;
    let hindiCount = 0;
    let totalCount = 0;

    const scanNode = (node: any) => {
      if (!node) return;

      if (typeof node === 'string') {
        const trimmed = node.trim();
        if (!trimmed) return;
        totalCount++;
        if (this.containsKannada(trimmed)) {
          kannadaCount++;
        } else if (this.containsTamil(trimmed)) {
          tamilCount++;
        } else if (this.containsHindi(trimmed)) {
          hindiCount++;
        }
        return;
      }

      if (Array.isArray(node)) {
        node.forEach((item) => scanNode(item));
        return;
      }

      if (typeof node === 'object') {
        // Some assessment responses store answers under a nested "responses" key
        const maybeResponses = (node as any).responses || node;
        Object.keys(maybeResponses).forEach((k) => {
          scanNode(maybeResponses[k]);
        });
      }
    };

    Object.keys(responses).forEach((key) => {
      scanNode(responses[key]);
    });

    if (totalCount === 0) {
      return 'en';
    }

    const kannadaRatio = kannadaCount / totalCount;
    const tamilRatio = tamilCount / totalCount;
    const hindiRatio = hindiCount / totalCount;

    if (kannadaRatio > 0.5) return 'kn';
    if (tamilRatio > 0.5) return 'ta';
    if (hindiRatio > 0.5) return 'hi';

    return 'en';
  }

  /**
   * Format student responses for the AI prompt
   */
  private formatResponses(responses: AssessmentResponses): string {
    let formatted = '';

    Object.keys(responses).forEach((key) => {
      const videoData = responses[key];

      // Handle different response structures
      if (videoData && typeof videoData === 'object') {
        const videoTitle = videoData.videoTitle || videoData.title || key;
        formatted += `\n=== ${videoTitle} ===\n`;

        const videoResponses = videoData.responses || videoData;

        Object.keys(videoResponses).forEach((qKey) => {
          const answer = videoResponses[qKey];
          if (answer && typeof answer === 'string' && answer.trim()) {
            formatted += `${qKey}: ${answer}\n`;
          }
        });
      }
    });

    return formatted || 'No responses available';
  }

  /**
   * Fetch summary template from database
   */
  private async getSummaryTemplate(assessmentType: string = 'inspiration'): Promise<SummaryTemplate | null> {
    // Check cache first
    if (this.templateCache.has(assessmentType)) {
      return this.templateCache.get(assessmentType)!;
    }

    try {
      const { data, error } = await supabase.rpc('get_summary_template', {
        p_assessment_type: assessmentType
      });

      if (error) {
        logger.error('Error fetching summary template:', error);
        return null;
      }

      if (!data || data.length === 0) {
        logger.warn(`No summary template found for assessment type: ${assessmentType}`);
        return null;
      }

      const template = data[0].summary_questions as SummaryTemplate;

      // Cache the template
      this.templateCache.set(assessmentType, template);

      return template;
    } catch (error) {
      logger.error('Exception fetching summary template:', error);
      return null;
    }
  }

  /**
   * Build the prompt for Gemini API
   */
  private async buildPrompt(
    responses: AssessmentResponses,
    language: SummaryLanguage = 'en'
  ): Promise<string> {
    const formattedResponses = this.formatResponses(responses);

    // Fetch template from database
    const template = await this.getSummaryTemplate('inspiration');

    if (!template) {
      logger.error('Failed to fetch summary template, falling back to default');
      // Fallback to a basic prompt if database fetch fails
      return this.buildFallbackPrompt(responses, language);
    }

    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';

    // Choose the appropriate language block from the template, with safe fallback to English
    const preferredKey: SummaryLanguage = language;
    const hasPreferred = template[preferredKey];
    const langKey: keyof SummaryTemplate =
      (hasPreferred ? preferredKey : 'en') as keyof SummaryTemplate;

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write all three answers in Kannada, maintaining the student\'s natural voice.\n- Use Kannada script for all text in question1, question2, and question3.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write all three answers in Tamil, maintaining the student\'s natural voice.\n- Use Tamil script for all text in question1, question2, and question3.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write all three answers in Hindi, maintaining the student\'s natural voice.\n- Use Devanagari script for all text in question1, question2, and question3.\n'
          : '';

    // Get questions from database template – fall back to English if specific language block is missing
    const questions =
      (template[langKey] as SummaryTemplateLanguageBlock | undefined) ?? template.en;

    // Instructions remain hardcoded in the service
    const instructions = isKannada
      ? {
        question1:
          "- ವೀಡಿಯೊಗಳಿಂದ ನಿರ್ದಿಷ್ಟ ಕ್ಷಣಗಳು, ಉಲ್ಲೇಖಗಳು ಅಥವಾ ವಿಷಯಗಳನ್ನು ಗುರುತಿಸಿ\n- ವಿದ್ಯಾರ್ಥಿ ಉಲ್ಲೇಖಿಸಿದ ವೈಯಕ್ತಿಕ ಅನುಭವಗಳಿಗೆ ಸಂಪರ್ಕಿಸಿ\n- 3-5 ಪ್ರಮುಖ ತೆಗೆದುಕೊಳ್ಳುವಿಕೆಗಳೊಂದಿಗೆ ನಿರ್ದಿಷ್ಟವಾಗಿರಿ\n- ಮೊದಲ ವ್ಯಕ್ತಿಯಲ್ಲಿ ಬರೆಯಿರಿ (\"ನಾನು ... ಮೂಲಕ ಪ್ರೇರೇಪಿಸಲ್ಪಟ್ಟೆನು\")",
        question2:
          "- ವೀಡಿಯೊಗಳಲ್ಲಿ ಉಲ್ಲೇಖಿಸಲಾದ ನಕಾರಾತ್ಮಕ ಮಾದರಿಗಳು, ಅಭ್ಯಾಸಗಳು ಅಥವಾ ಮನೋಭಾವಗಳನ್ನು ಗುರುತಿಸಿ\n- ಇವುಗಳನ್ನು ಏಕೆ ತಪ್ಪಿಸಬೇಕು ಎಂಬುದನ್ನು ವಿವರಿಸಿ\n- ರಚನಾತ್ಮಕ ಚೌಕಟ್ಟನ್ನು ಒದಗಿಸಿ\n- ಮೊದಲ ವ್ಯಕ್ತಿಯಲ್ಲಿ ಬರೆಯಿರಿ (\"ನಾನು ... ತಪ್ಪಿಸಬೇಕು\")",
        question3:
          "- ಸಾಮಾನ್ಯ ವಿಷಯಗಳು, ಮೌಲ್ಯಗಳು ಅಥವಾ ಗುಣಲಕ್ಷಣಗಳನ್ನು ಹುಡುಕಿ\n- ವೀಡಿಯೊ ಪಾತ್ರಗಳನ್ನು ವಿದ್ಯಾರ್ಥಿ ಉಲ್ಲೇಖಿಸಿದ ನಿಜ ಜೀವನದ ಮಾದರಿಗಳಿಗೆ ಸಂಪರ್ಕಿಸಿ\n- ಯಾರನ್ನಾದರೂ ಪ್ರೇರೇಪಿಸುವ ಮಾದರಿಗಳನ್ನು ಗುರುತಿಸಿ\n- ಮೊದಲ ವ್ಯಕ್ತಿಯಲ್ಲಿ ಬರೆಯಿರಿ (\"ನಾನು ಗಮನಿಸಿದ್ದೇನೆ ...\")"
      }
      : isTamil
        ? {
          // Simple Tamil guidance; model is still instructed separately to answer in Tamil
          question1:
            "- வீடியோக்களில் உங்களை குறிப்பாக பாதித்த தருணங்கள், வசனங்கள் அல்லது கருத்துகளை குறிப்பிடுங்கள்\n- மாணவர் சொன்ன தனிப்பட்ட அனுபவங்களுடன் இணைத்துச் सोचிக்கவும்\n- 3–5 முக்கிய புள்ளிகளாக எழுதுங்கள்\n- முதல் நபர் பார்வையில் எழுதுங்கள் (\"என்னை ... மிகவும் ஊக்கப்படுத்தியது\")",
          question2:
            "- வீடியோக்களில் வரும் தவிர்க்க வேண்டிய பழக்கங்கள், நடத்தைகள் அல்லது மனப்பாங்குகளை குறிப்பிடுங்கள்\n- ஏன் அவற்றை தவிர்க்க வேண்டும் என்று சுலபமான சொல்லில் விளக்குங்கள்\n- கட்டுரை போல் அல்லாமல் சாதாரண வாக்கியங்களில் எழுதுங்கள்\n- முதல் நபர் பார்வையில் எழுதுங்கள் (\"நான் ... தவிர்க்க வேண்டும்\")",
          question3:
            "- உங்களை ஊக்கப்படுத்தும் மனிதர்களில் காணப்படும் பொதுவான குணங்களையும் மதிப்புகளையும் கண்டுபிடிக்கவும்\n- வீடியோ கதாபாத்திரங்களையும் உங்கள் உண்மை வாழ்க்கை முன்மாதிரிகளையும் ஒப்பிடுங்கள்\n- இந்த ஒற்றுமைகள் உங்கள் எதிர்காலத்திற்கு எப்படி உதவுகின்றன என்று எழுதுங்கள்\n- முதல் நபர் பார்வையில் எழுதுங்கள் (\"நான் கவனித்தது என்னவென்றால் ...\")"
        }
        : {
          question1:
            "- Identify specific moments, quotes, or themes from the videos\n- Connect to any personal experiences the student mentioned\n- Be specific with 3-5 key takeaways\n- Write in first person (\"I was inspired by...\")",
          question2:
            "- Identify negative patterns, habits, or attitudes mentioned in the videos\n- Explain why these should be avoided\n- Provide constructive framing\n- Write in first person (\"I should avoid...\")",
          question3:
            "- Find common themes, values, or traits\n- Connect video characters to real-life role models the student mentioned\n- Identify patterns of what makes someone inspiring\n- Write in first person (\"I notice that...\")"
        };

    const questionsPrompt = `Question 1: ${questions.question1}
${instructions.question1}

Question 2: ${questions.question2}
${instructions.question2}

Question 3: ${questions.question3}
${instructions.question3}`;

    const coreInstructions = BASE_SYSTEM_PROMPT;

    return `${coreInstructions}

You will now create a summary based only on the student's responses about the videos.
${languageInstruction}
STUDENT ANSWERS ABOUT THE VIDEOS:
${formattedResponses}

Write answers to these 3 questions as if the student is speaking (use "I" and "me").

${questionsPrompt}

IMPORTANT RULES:
- Write like the student is talking (use "I" and "me")
- Use very simple words that a grade 8 or 9 student can easily understand
- Use plain English - no difficult words
- For Question 1, produce the Markdown table described above so each category appears on its own row
- The TOTAL length should be 100-150 words for all three answers together
- Be short and clear
- Use the student's own words from their answers
- Write like the student himself/herself is writing
- Format the response as valid JSON with this exact structure:

{
  "question1": "Your answer here...",
  "question2": "Your answer here...",
  "question3": "Your answer here..."
}

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Fallback prompt builder in case database fetch fails
   */
  private buildFallbackPrompt(
    responses: AssessmentResponses,
    language: SummaryLanguage = 'en'
  ): string {
    const formattedResponses = this.formatResponses(responses);
    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write all three answers in Kannada, maintaining the student\'s natural voice.\n- Use Kannada script for all text in question1, question2, and question3.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write all three answers in Tamil, maintaining the student\'s natural voice.\n- Use Tamil script for all text in question1, question2, and question3.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write all three answers in Hindi, maintaining the student\'s natural voice.\n- Use Devanagari script for all text in question1, question2, and question3.\n'
          : '';

    const questionsPrompt = isKannada
      ? `Question 1: ಈ ವೀಡಿಯೊಗಳಿಂದ ಮತ್ತು ನಿಮ್ಮ ಸ್ವಂತ ಅನುಭವಗಳಿಂದ ನಿಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸಿದ ವಿಷಯಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ.

Question 2: ಈ ಎಲ್ಲಾ ವೀಡಿಯೊಗಳನ್ನು ನೋಡಿದ ನಂತರ, ನೀವು ತಪ್ಪಿಸಬೇಕಾದ ನಡವಳಿಕೆಗಳು ಯಾವುವು? ಅವುಗಳನ್ನು ಬರೆಯಿರಿ.

Question 3: ನಿಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸಿದ ಈ ವೀಡಿಯೊಗಳಲ್ಲಿನ ಪಾತ್ರಗಳು ಮತ್ತು ನಿಜ ಜೀವನದಲ್ಲಿ ನಿಮ್ಮನ್ನು ಪ್ರೇರೇಪಿಸಿದ ಜನರ ನಡುವಿನ ಹೋಲಿಕೆಗಳನ್ನು ನಿಮ್ಮ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಚರ್ಚಿಸಿ. ನಂತರ ಒಂದು ಸಾರಾಂಶ ಬರೆಯಿರಿ.`
      : isTamil
        ? `Question 1: இந்த வீடியோக்களில் உங்களை அதிகமாக ஊக்கப்படுத்திய விஷயங்களையும், உங்கள் சொந்த அனுபவங்களையும் எளிய சொல்லில் எழுதுங்கள்.

Question 2: இந்த வீடியோக்களை பார்த்த பிறகு, நீங்கள் தவிர்க்க வேண்டும் என்று உணர்ந்த நடத்தைகள் அல்லது பழக்கங்களை எழுதுங்கள்.

Question 3: இந்த வீடியோக்களில் உங்களை ஊக்கப்படுத்தும் கதாபாத்திரங்களும், உண்மை வாழ்க்கையில் உங்களை ஊக்கப்படுத்திய أش أش அம்சங்களையும் ஒப்பிட்டு, ஒரு சுருக்கமான விளக்கத்தை எழுதுங்கள்.`
        : `Question 1: List the things that inspired you from these videos and from your own experiences.

Question 2: After watching all these videos, which behaviors do you feel you should avoid? Write them down.

Question 3: Discuss the similarities between the characters in these videos who inspired you, and the people who have inspired you in real life, with your friends. Then write a summary.`;

    const coreInstructions = BASE_SYSTEM_PROMPT;

    return `${coreInstructions}

You will now create a summary based only on the student's responses about the videos.
${languageInstruction}
STUDENT ANSWERS ABOUT THE VIDEOS:
${formattedResponses}

Write answers to these 3 questions as if the student is speaking (use "I" and "me").

${questionsPrompt}

IMPORTANT RULES:
- Write like the student is talking (use "I" and "me")
- Use very simple words that a grade 8 or 9 student can easily understand
- Use plain English - no difficult words
- The TOTAL length should be 100-150 words for all three answers together
- Be short and clear
- Use the student's own words from their answers
- Write like the student himself/herself is writing
- Format the response as valid JSON with this exact structure:

{
  "question1": "Your answer here...",
  "question2": "Your answer here...",
  "question3": "Your answer here..."
}

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Parse Gemini API response to extract JSON
   */
  private parseGeminiResponse(responseText: string): SummaryQuestions | null {
    try {
      // Remove markdown code blocks if present
      let cleanedText = responseText.trim();

      // Remove ```json and ``` markers
      cleanedText = cleanedText.replace(/^```json\s*/i, '');
      cleanedText = cleanedText.replace(/^```\s*/i, '');
      cleanedText = cleanedText.replace(/\s*```$/i, '');
      cleanedText = cleanedText.trim();

      // Parse JSON
      const parsed = JSON.parse(cleanedText);

      logger.log('📋 Parsed JSON structure:', Object.keys(parsed));

      // Handle dream portfolio structure
      if (Array.isArray(parsed.entries)) {
        const entries = parsed.entries.map((entry: any) => ({
          dream: (entry?.dream ?? '').trim(),
          quality_value_strength: (entry?.quality_value_strength ?? '').trim(),
          prevent_failure: (entry?.prevent_failure ?? '').trim(),
          study_path: (entry?.study_path ?? '').trim()
        }));

        return {
          question1: JSON.stringify(entries),
          question2: parsed.question2 || parsed.summary || '',
          question3: parsed.question3 || parsed.action_plan || '',
          question4: '',
          question5: '',
          question6: ''
        };
      }

      // Handle Role Models assessment (only question1)
      if (parsed.question1 && !parsed.question2) {
        logger.log('✅ Role Models format detected (question1 only)');
        return {
          question1: parsed.question1,
          question2: '',
          question3: '',
          question4: '',
          question5: '',
          question6: ''
        };
      }

      // Validate structure - support 2, 3, 4, and 6 question formats
      if (parsed.question1 && (parsed.question2 || parsed.summary)) {
        return {
          question1: parsed.question1,
          question2: parsed.question2 || parsed.summary || '',
          question3: parsed.question3 || parsed.action_plan || '', // Optional third question
          question4: parsed.question4 || '', // Optional fourth question (Dreams)
          question5: parsed.question5 || '', // Optional fifth question (School Learning)

          question6: parsed.question6 || '', // Optional sixth question
          question7: parsed.question7 || '',
          question8: parsed.question8 || '',
          question9: parsed.question9 || '',
          question10: parsed.question10 || '',
          question11: parsed.question11 || '',
          question12: parsed.question12 || '',
          question13: parsed.question13 || '',
          question14: parsed.question14 || '',
          question15: parsed.question15 || '',
          question16: parsed.question16 || ''
        };
      }

      logger.error('❌ Invalid JSON structure - missing question1 or question2:', parsed);
      return null;
    } catch (error) {
      logger.error('❌ Failed to parse Gemini response:', error);
      logger.error('📄 Raw response text (first 500 chars):', responseText.substring(0, 500));
      return null;
    }
  }

  /**
   * Generate AI summary for inspiration assessment
   */
  async generateInspirationSummary(
    responses: AssessmentResponses,
    preferredLanguage?: string
  ): Promise<GenerateSummaryResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gemini API key is not configured'
      };
    }

    // Validate responses
    if (!responses || Object.keys(responses).length === 0) {
      return {
        success: false,
        error: 'No responses provided'
      };
    }

    try {
      // Detect language from student responses
      const detectedLanguage = this.detectLanguage(responses, preferredLanguage);
      logger.log(`🌐 Detected language from student responses: ${detectedLanguage}`);

      const prompt = await this.buildPrompt(responses, detectedLanguage);

      // Use exact same format as chatbot - no generationConfig initially
      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };

      logger.log('📡 Calling Gemini API via proxy (inspiration)');
      logger.log('📝 Request body:', JSON.stringify(requestBody));

      const data = await this.callGeminiProxy(requestBody) as any;
      logger.log('✅ Gemini API response received');
      logger.log('📊 Response structure:', {
        hasCandidates: !!data?.candidates,
        candidatesCount: data?.candidates?.length || 0,
        hasContent: !!data?.candidates?.[0]?.content
      });

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        logger.error('❌ No text in response:', JSON.stringify(data, null, 2));
        return {
          success: false,
          error: 'No content generated by AI'
        };
      }

      logger.log('✅ Successfully generated summary, length:', generatedText.length);

      const summary = this.parseGeminiResponse(generatedText);

      if (!summary) {
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }

      return {
        success: true,
        summary
      };

    } catch (error) {
      logger.error('Error generating summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate summary content
   */
  validateSummary(summary: SummaryQuestions): boolean {
    const minLength = 50; // Minimum characters per answer

    return !!(
      summary.question1 && summary.question1.length >= minLength &&
      summary.question2 && summary.question2.length >= minLength &&
      summary.question3 && summary.question3.length >= minLength
    ) || (
        // Or if it's the detailed About Me (check a few key questions)
        summary.question1 && summary.question16 && summary.question1.length > 5
      );
  }

  /**
   * Get word count for a summary
   */
  getSummaryWordCount(summary: SummaryQuestions): number {
    const allText = `${summary.question1} ${summary.question2} ${summary.question3}`;
    return allText.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Format Dreams assessment responses for summary
   */
  private formatDreamsResponses(responses: Record<string, string>): string {
    let formatted = '=== MY DREAMS ASSESSMENT ===\n';

    Object.entries(responses).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        formatted += `${key}: ${value}\n`;
      }
    });

    return formatted || 'No responses available';
  }

  /**
   * Build prompt for Dreams assessment summary
   */
  private async buildDreamsPrompt(
    responses: Record<string, string>,
    language: SummaryLanguage = 'en'
  ): Promise<string> {
    const formattedResponses = this.formatDreamsResponses(responses);

    // Fetch template from database
    const template = await this.getSummaryTemplate('dreams');

    if (!template) {
      logger.error('Failed to fetch Dreams summary template, falling back to default');
      return this.buildDreamsFallbackPrompt(responses, language);
    }

    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';
    const preferredKey: SummaryLanguage = language;
    const hasPreferred = template[preferredKey];
    const langKey: keyof SummaryTemplate =
      (hasPreferred ? preferredKey : 'en') as keyof SummaryTemplate;

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write all entries in Kannada, maintaining the student\'s natural voice.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write all entries in Tamil, maintaining the student\'s natural voice.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write all entries in Hindi, maintaining the student\'s natural voice.\n'
          : '';

    // Get questions from database template
    const questions =
      (template[langKey] as SummaryTemplateLanguageBlock | undefined) ?? template.en;

    // Instructions for generating portfolio
    const instructions = isKannada
      ? '- ಪ್ರತಿಯೊಂದು ಕನಸಿಗಾಗಿ, ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗಳಿಂದ ನಿಜವಾದ ವಿವರಗಳನ್ನು ಬಳಸಿ\n- ವಿದ್ಯಾರ್ಥಿಯ ಧ್ವನಿಯಲ್ಲಿ ಬರೆಯಿರಿ (ಮೊದಲ ವ್ಯಕ್ತಿ)\n- ಪ್ರತಿಯೊಂದು ಪ್ರವೇಶಕ್ಕೆ ಸ್ಪಷ್ಟವಾಗಿ ಮತ್ತು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಉತ್ತರಿಸಿ'
      : isTamil
        ? '- ஒவ்வொரு கனவுக்கும், மாணவர் எழுதிய பதில்களில் இருந்து உண்மையான விவரங்களைப் பயன்படுத்துங்கள்\n- மாணவரின் குரலில் (முதல் நபர்) எழுதுங்கள்\n- ஒவ்வொரு பகுதியையும் குறுகிய, தெளிவான வரிகளில் எழுதுங்கள்'
        : '- For each dream, use specific details from their responses\n- Write in the student\'s voice (first person)\n- Be clear and concise for each entry';

    const questionsPrompt = `Create a dream portfolio with 3 dream entries. For each entry, fill in:

Entry Column 1: ${questions.question1}
Entry Column 2: ${questions.question2}
Entry Column 3: ${questions.question3}
Entry Column 4: ${questions.question4}

${instructions}`;

    const coreInstructions = BASE_SYSTEM_PROMPT;

    return `${coreInstructions}

You will now create a summary based only on the student's responses about their dreams.
${languageInstruction}
STUDENT ANSWERS ABOUT THEIR DREAMS:
${formattedResponses}

Write exactly 3 dream entries as if the student is speaking (use "I" and "me").

${questionsPrompt}

IMPORTANT RULES:
- Write exactly 3 dream entries
- Each entry should have 4 parts as shown above
- Write like the student is talking (use "I" and "me")
- Use very simple words that a grade 8 or 9 student can easily understand
- Use plain English - no difficult words
- The TOTAL length should be 100-150 words for all 3 entries together
- Be short and clear
- Use the student's own words from their answers
- Write like the student himself/herself is writing
- Format the response as valid JSON with this exact structure:

{
  "entries": [
    {
      "dream": "Dream description here",
      "quality_value_strength": "Qualities/values/strengths that help achieve this dream",
      "prevent_failure": "Actions to prevent this dream from failing",
      "study_path": "What to study after 10th to achieve this dream (if applicable)"
    },
    {
      "dream": "Second dream description",
      "quality_value_strength": "...",
      "prevent_failure": "...",
      "study_path": "..."
    },
    {
      "dream": "Third dream description",
      "quality_value_strength": "...",
      "prevent_failure": "...",
      "study_path": "..."
    }
  ]
}

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Fallback prompt for Dreams if database fetch fails
   */
  private buildDreamsFallbackPrompt(
    responses: Record<string, string>,
    language: SummaryLanguage = 'en'
  ): string {
    const formattedResponses = this.formatDreamsResponses(responses);
    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write all entries in Kannada, maintaining the student\'s natural voice.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write all entries in Tamil, maintaining the student\'s natural voice.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write all entries in Hindi, maintaining the student\'s natural voice.\n'
          : '';

    const questionsPrompt = isKannada
      ? `Create a dream portfolio with 3 dream entries. For each entry, fill in:

Entry Column 1: ಕನಸು
Entry Column 2: ನಿಮ್ಮಲ್ಲಿ ಈಗಾಗಲೇ ಕಂಡುಕೊಂಡಿರುವ ಯಾವ ಗುಣ/ ಮೌಲ್ಯ/ ಸಾರ್ಥ್ಯ ನಿಮ್ಮ ಕನಸನ್ನು ಸಾಧಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.
Entry Column 3: ಕನಸು ವಿಫಲವಾಗುವುದಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ನೀವು ಏನು ಮಾಡಬೇಕಾಗುತ್ತದೆ
Entry Column 4: ಈ ಕನಸನ್ನುಸಾಧಿಸಲು ೧೦ನೇ ತರಗತಿಯ ನಂತರ ನೀವು ಏನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು? (ಅನ್ವಯಿಸಿದರೆ)`
      : isTamil
        ? `Create a dream portfolio with 3 dream entries. For each entry, fill in:

Entry Column 1: கனவு
Entry Column 2: உங்களிடம் ஏற்கனவே உள்ள எந்த குணம் / மதிப்பு / திறன் இந்த கனவை அடைய உங்களுக்கு உதவும்?
Entry Column 3: இந்த கனவு தோல்வியடையாமல் இருக்க நீங்கள் என்ன செய்ய வேண்டும்?
Entry Column 4: இந்த கனவை அடைய 10ஆம் வகுப்பிற்குப் பிறகு நீங்கள் என்ன படிக்க வேண்டும்? (தேவையானால்)`
        : `Create a dream portfolio with 3 dream entries. For each entry, fill in:

Entry Column 1: Dream
Entry Column 2: Which quality/ value/ ability that you already have will help you achieve your dream?
Entry Column 3: What do you need to do to make sure this dream does not fail?
Entry Column 4: To achieve this dream, what do you need to study after Class 10? (if applicable)`;

    const coreInstructions = BASE_SYSTEM_PROMPT;

    return `${coreInstructions}

You will now create a summary based only on the student's responses about their dreams.
${languageInstruction}
STUDENT ANSWERS ABOUT THEIR DREAMS:
${formattedResponses}

Write exactly 3 dream entries as if the student is speaking (use "I" and "me").

${questionsPrompt}

IMPORTANT RULES:
- Write exactly 3 dream entries
- Each entry should have 4 parts as shown above
- Write like the student is talking (use "I" and "me")
- Use very simple words that a grade 8 or 9 student can easily understand
- Use plain English - no difficult words
- The TOTAL length should be 100-150 words for all 3 entries together
- Be short and clear
- Use the student's own words from their answers
- Write like the student himself/herself is writing
- Format the response as valid JSON with this exact structure:

{
  "entries": [
    {
      "dream": "Dream description here",
      "quality_value_strength": "Qualities/values/strengths that help achieve this dream",
      "prevent_failure": "Actions to prevent this dream from failing",
      "study_path": "What to study after 10th to achieve this dream (if applicable)"
    },
    {
      "dream": "Second dream description",
      "quality_value_strength": "...",
      "prevent_failure": "...",
      "study_path": "..."
    },
    {
      "dream": "Third dream description",
      "quality_value_strength": "...",
      "prevent_failure": "...",
      "study_path": "..."
    }
  ]
}

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Generate AI summary for Dreams assessment
   */
  async generateDreamsSummary(
    responses: Record<string, string>,
    preferredLanguage?: string
  ): Promise<GenerateSummaryResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gemini API key is not configured'
      };
    }

    // Validate responses
    if (!responses || Object.keys(responses).length === 0) {
      return {
        success: false,
        error: 'No responses provided from Dreams assessment'
      };
    }

    try {
      // Detect language from student responses
      const detectedLanguage = this.detectLanguage({ part1: responses }, preferredLanguage);
      logger.log(`🌐 Detected language from student responses: ${detectedLanguage}`);

      const prompt = await this.buildDreamsPrompt(responses, detectedLanguage);

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };

      logger.log('📡 Calling Gemini API for Dreams summary:', 'gemini-proxy');

      const data = await this.callGeminiProxy(requestBody) as any;
      logger.log('✅ Gemini API response received for Dreams summary');

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        logger.error('❌ No text in response:', JSON.stringify(data, null, 2));
        return {
          success: false,
          error: 'No content generated by AI'
        };
      }

      logger.log('✅ Successfully generated Dreams summary, length:', generatedText.length);

      const summary = this.parseDreamsResponse(generatedText);

      if (!summary) {
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }

      return {
        success: true,
        summary
      };

    } catch (error) {
      logger.error('Error generating Dreams summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse Dreams summary response (returns portfolio entries as SummaryQuestions structure)
   */
  private parseDreamsResponse(text: string): SummaryQuestions | null {
    try {
      // Remove markdown code blocks if present
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      // Validate structure
      if (!parsed.entries || !Array.isArray(parsed.entries) || parsed.entries.length !== 3) {
        logger.error('❌ Invalid Dreams summary structure:', parsed);
        return null;
      }

      // Convert portfolio entries to SummaryQuestions format
      // For Dreams, we'll store it as a structured format
      // question1-3 will contain JSON string of entries, question4 will be empty
      const portfolioJson = JSON.stringify(parsed.entries);

      return {
        question1: portfolioJson, // Store full portfolio as JSON string
        question2: '', // Not used for Dreams
        question3: '', // Not used for Dreams
        question4: '' // Not used for Dreams
      };
    } catch (error) {
      logger.error('❌ Failed to parse Dreams summary response:', error);
      logger.error('Response text:', text);
      return null;
    }
  }

  /**
   * Format School Learning assessment responses for summary
   */
  private formatSchoolLearningResponses(responses: Record<string, any>): string {
    let formatted = '=== MY SCHOOL, MY LEARNING AND I ASSESSMENT ===\n';

    Object.entries(responses).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        formatted += `${key}: ${value}\n`;
      } else if (value && typeof value === 'object') {
        // Handle checkbox responses (learning methodologies)
        if (key.includes('question11') || key.includes('question')) {
          const checkboxValues = Object.entries(value)
            .filter(([_, checked]) => checked === true)
            .map(([k, _]) => k);
          if (checkboxValues.length > 0) {
            formatted += `${key}: ${checkboxValues.join(', ')}\n`;
          }
          if (value.others && value.others.trim()) {
            formatted += `${key}_others: ${value.others}\n`;
          }
        } else {
          formatted += `${key}: ${JSON.stringify(value)}\n`;
        }
      }
    });

    return formatted || 'No responses available';
  }

  /**
   * Build prompt for School Learning assessment summary
   */
  private async buildSchoolLearningPrompt(
    responses: Record<string, any>,
    language: SummaryLanguage = 'en'
  ): Promise<string> {
    const formattedResponses = this.formatSchoolLearningResponses(responses);

    // Fetch template from database
    const template = await this.getSummaryTemplate('school_learning');

    if (!template) {
      logger.error('Failed to fetch School Learning summary template, falling back to default');
      return this.buildSchoolLearningFallbackPrompt(responses, language);
    }

    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';
    const preferredKey: SummaryLanguage = language;
    const hasPreferred = template[preferredKey];
    const langKey: keyof SummaryTemplate =
      (hasPreferred ? preferredKey : 'en') as keyof SummaryTemplate;

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script ONLY.\n- Even though the questions may be written in English, ALL your answers must be in Kannada.\n- Write all answers in Kannada, maintaining the student\'s natural voice.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script ONLY.\n- Even though the questions may be written in English, ALL your answers must be in Tamil.\n- Write all answers in Tamil, maintaining the student\'s natural voice.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script ONLY.\n- Even though the questions may be written in English, ALL your answers must be in Hindi.\n- Write all answers in Hindi, maintaining the student\'s natural voice.\n'
          : '';

    // Get questions from database template
    const questions =
      (template[langKey] as SummaryTemplateLanguageBlock | undefined) ?? template.en;

    // Instructions for generating summary
    const instructions = isKannada
      ? '- ವಿದ್ಯಾರ್ಥಿಯ ಪ್ರತಿಕ್ರಿಯೆಗಳಿಂದ ನಿಜವಾದ ವಿವರಗಳನ್ನು ಬಳಸಿ\n- ವಿದ್ಯಾರ್ಥಿಯ ಧ್ವನಿಯಲ್ಲಿ ಬರೆಯಿರಿ (ಮೊದಲ ವ್ಯಕ್ತಿ)\n- ಪ್ರತಿಯೊಂದು ಪ್ರಶ್ನೆಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಮತ್ತು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಉತ್ತರಿಸಿ'
      : isTamil
        ? '- மாணவர் எழுதிய பதில்களில் இருந்து உண்மையான விவரங்களைப் பயன்படுத்துங்கள்\n- மாணவரின் குரலில் (முதல் நபர்) எழுதுங்கள்\n- ஒவ்வொரு கேள்விக்கும் குறுகிய, தெளிவான பதில் கொடுங்கள்'
        : '- Use specific details from the student\'s responses\n- Write in the student\'s voice (first person)\n- Be clear and concise for each question';

    const questionsPrompt = `Question 1: ${questions.question1}
${instructions}

Question 2: ${questions.question2}
${instructions}

Question 3: ${questions.question3}
${instructions}

Question 4: ${questions.question4}
${instructions}

Question 5: ${questions.question5}
${instructions}

Question 6: ${questions.question6}
${instructions}`;

    const languageRule =
      isKannada
        ? '- Use simple Kannada words – no difficult or English-heavy phrases.\n'
        : isTamil
          ? '- Use simple Tamil words – no difficult or English-heavy phrases.\n'
          : isHindi
            ? '- Use simple Hindi words – no difficult or English-heavy phrases.\n'
            : '- Use plain English – no difficult words.\n';

    const coreInstructions = BASE_SYSTEM_PROMPT + '\n' + languageRule;

    return `${coreInstructions}

You will now create a summary based only on the student's responses about their school and learning.
${languageInstruction}
STUDENT ANSWERS ABOUT SCHOOL AND LEARNING:
${formattedResponses}

Write answers to these 6 questions as if the student is speaking (use "I" and "me").

${questionsPrompt}

IMPORTANT RULES:
- Write like the student is talking (use "I" and "me")
- Use very simple words that a grade 8 or 9 student can easily understand
- Use plain English - no difficult words
- The TOTAL length should be 100-150 words for all six answers together
- Be short and clear
- Use the student's own words from their answers
- Write like the student himself/herself is writing
- Format the response as valid JSON with this exact structure:

{
  "question1": "Your answer here...",
  "question2": "Your answer here...",
  "question3": "Your answer here...",
  "question4": "Your answer here...",
  "question5": "Your answer here...",
  "question6": "Your answer here..."
}

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Fallback prompt for School Learning if database fetch fails
   */
  private buildSchoolLearningFallbackPrompt(
    responses: Record<string, any>,
    language: SummaryLanguage = 'en'
  ): string {
    const formattedResponses = this.formatSchoolLearningResponses(responses);
    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write all answers in Kannada, maintaining the student\'s natural voice.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write all answers in Tamil, maintaining the student\'s natural voice.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write all answers in Hindi, maintaining the student\'s natural voice.\n'
          : '';

    const questionsPrompt = isKannada
      ? `Question 1: ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು

Question 2: ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು

Question 3: ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು

Question 4: ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು

Question 5: ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು

Question 6: ನಾನು ಈ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ.`
      : isTamil
        ? `Question 1: 1.நான் விரும்பும் பாடங்கள்

Question 2: 2.நான் விரும்பும் பாடங்களின் மூலம் நான் அடையக்கூடிய தொழில்கள்

Question 3: 3.நான் விரும்பாத பாடங்கள்

Question 4: 4.நான் விரும்பாத பாடங்களில் முன்னேற்றம் பெற்றால் நான் அடையக்கூடிய தொழில்கள்

Question 5: 5.பாடப்பிரிவுகளுடன் சேர்த்து, நான் சிறப்பாக சாதனை புரியும் பிற செயல்பாடுகள் / விஷயங்கள்

Question 6: 6.இந்த திறன்களில் நான் மேம்பட்டால், என் வேலை / தொழில் தேர்வுக்கு உதவியாக இருக்கும்.`
        : `Question 1: Subjects I like

Question 2: Careers I can pursue based on the subjects I like

Question 3: Subjects I do not like

Question 4: Careers I can pursue if I make progress in the subjects I do not like

Question 5: Other activities / areas in which I perform well along with academic subjects

Question 6: If I improve these skills, it will help me in choosing my job / career.`;

    return `${BASE_SYSTEM_PROMPT}

You will now create a summary of the student's school learning assessment with 6 questions.
${languageInstruction}
STUDENT RESPONSES FROM MY SCHOOL, MY LEARNING AND I ASSESSMENT:
${formattedResponses}

Please generate answers to these 6 reflection questions in the student's voice (first person).
Be specific, reference actual content from their responses, and keep the tone conversational and age-appropriate.

${questionsPrompt}

IMPORTANT:
- Write in the student's voice (first person)
- Keep each answer to 2-4 concise paragraphs
- Be specific and reference their actual responses
- Use natural, conversational language appropriate for their age
- For Question 1: List the subjects they mentioned liking
- For Question 2: Suggest careers related to those subjects
- For Question 3: List the subjects they mentioned disliking
- For Question 4: Suggest careers that might open up if they improve in disliked subjects
- For Question 5: List their non-academic strengths/skills
- For Question 6: Explain how improving those skills helps with career
- Format the response as valid JSON with this exact structure:

{
  "question1": "Your detailed answer here...",
  "question2": "Your detailed answer here...",
  "question3": "Your detailed answer here...",
  "question4": "Your detailed answer here...",
  "question5": "Your detailed answer here...",
  "question6": "Your detailed answer here..."
}

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Generate AI summary for School Learning assessment
   */
  async generateSchoolLearningSummary(
    responses: Record<string, any>,
    preferredLanguage?: string
  ): Promise<GenerateSummaryResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gemini API key is not configured'
      };
    }

    // Validate responses
    if (!responses || Object.keys(responses).length === 0) {
      return {
        success: false,
        error: 'No responses provided from School Learning assessment'
      };
    }

    try {
      // Detect language from student responses (supports Kannada, Tamil, or default English)
      const detectedLanguage = this.detectLanguage({ part1: responses }, preferredLanguage);
      logger.log(`🌐 Detected language from student responses: ${detectedLanguage}`);

      const prompt = await this.buildSchoolLearningPrompt(responses, detectedLanguage);

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };

      logger.log('📡 Calling Gemini API for School Learning summary:', 'gemini-proxy');

      const data = await this.callGeminiProxy(requestBody) as any;
      logger.log('✅ Gemini API response received for School Learning summary');

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        logger.error('❌ No text in response:', JSON.stringify(data, null, 2));
        return {
          success: false,
          error: 'No content generated by AI'
        };
      }

      logger.log('✅ Successfully generated School Learning summary, length:', generatedText.length);

      const summary = this.parseGeminiResponse(generatedText);

      if (!summary) {
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }

      return {
        success: true,
        summary
      };

    } catch (error) {
      logger.error('Error generating School Learning summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Format Hobbies assessment responses for summary
   */
  private formatHobbiesResponses(responses: Record<string, string>): string {
    let formatted = '=== MY TALENTS AND HOBBIES ASSESSMENT ===\n';

    Object.entries(responses).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        formatted += `${key}: ${value}\n`;
      }
    });

    return formatted || 'No responses available';
  }

  /**
   * Build prompt for Hobbies assessment summary
   */
  private async buildHobbiesPrompt(
    responses: Record<string, string>,
    language: SummaryLanguage = 'en'
  ): Promise<string> {
    const formattedResponses = this.formatHobbiesResponses(responses);

    // Fetch template from database
    const template = await this.getSummaryTemplate('hobbies');

    if (!template) {
      logger.error('Failed to fetch Hobbies summary template, falling back to default');
      return this.buildHobbiesFallbackPrompt(responses, language);
    }

    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';
    const preferredKey: SummaryLanguage = language;
    const hasPreferred = template[preferredKey];
    const langKey: keyof SummaryTemplate =
      (hasPreferred ? preferredKey : 'en') as keyof SummaryTemplate;

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write all entries in Kannada, maintaining the student\'s natural voice.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write all entries in Tamil, maintaining the student\'s natural voice.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write all entries in Hindi, maintaining the student\'s natural voice.\n'
          : '';

    // Get questions from database template
    const questions =
      (template[langKey] as SummaryTemplateLanguageBlock | undefined) ?? template.en;

    // Instructions for generating portfolio
    const instructions = isKannada
      ? '- ಪ್ರತಿಯೊಂದು ಹವ್ಯಾಸ ಮತ್ತು ಪ್ರತಿಭೆಗಾಗಿ, ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗಳಿಂದ ನಿಜವಾದ ವಿವರಗಳನ್ನು ಬಳಸಿ\n- ವಿದ್ಯಾರ್ಥಿಯ ಧ್ವನಿಯಲ್ಲಿ ಬರೆಯಿರಿ (ಮೊದಲ ವ್ಯಕ್ತಿ)\n- ಪ್ರತಿಯೊಂದು ಪ್ರವೇಶಕ್ಕೆ ಸ್ಪಷ್ಟವಾಗಿ ಮತ್ತು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಉತ್ತರಿಸಿ'
      : isTamil
        ? '- ஒவ்வொரு பொழுதுபோக்கும் திறமைக்கும், மாணவர் எழுதிய பதில்களில் இருந்து உண்மையான விவரங்களைப் பயன்படுத்துங்கள்\n- மாணவரின் குரலில் (முதல் நபர்) எழுதுங்கள்\n- ஒவ்வொரு பதிவையும் குறுகிய, தெளிவான வரிகளில் எழுதுங்கள்'
        : '- For each hobby and talent, use specific details from their responses\n- Write in the student\'s voice (first person)\n- Be clear and concise for each entry';

    const hobbiesPrompt = `HOBBIES PORTFOLIO:
Create a hobbies portfolio table with entries. For each entry, fill in:

Column 1: "${questions.question2}" - The hobby name
Column 2: "${questions.question3}" - Whether you would like to turn this hobby into a career
Column 3: "${questions.question4}" - Careers that are compatible with these hobbies
Column 4: "${questions.question5}" - People you know who have turned their hobbies into careers`;

    const talentsPrompt = `TALENTS PORTFOLIO:
Create a talents portfolio table with entries. For each entry, fill in:

Column 1: "${questions.question7}" - The talent name
Column 2: "${questions.question8}" - Whether you want to turn your talent into a career
Column 3: "${questions.question9}" - Careers that match your talents
Column 4: "${questions.question10}" - People you know who have turned their talents into careers`;

    const coreInstructions = BASE_SYSTEM_PROMPT;

    return `${coreInstructions}

You will now create a summary based only on the student's responses about their hobbies and talents.
${languageInstruction}
STUDENT ANSWERS ABOUT HOBBIES AND TALENTS:
${formattedResponses}

Write about their hobbies and talents as if the student is speaking (use "I" and "me").

${hobbiesPrompt}

${talentsPrompt}

${instructions}

IMPORTANT RULES:
- Write about both hobbies and talents
- Write at least 2-3 entries for each
- Each entry should have 4 parts as shown above
- Write like the student is talking (use "I" and "me")
- Use very simple words that a grade 8 or 9 student can easily understand
- Use plain English - no difficult words
- The TOTAL length should be 100-150 words for all entries together
- Be short and clear
- Use the student's own words from their answers
- Write like the student himself/herself is writing
- Format the response as valid JSON with this exact structure:

{
  "hobbiesPortfolio": {
    "entries": [
      {
        "hobby": "Hobby name here",
        "want_career": "Yes/No/Maybe and why",
        "compatible_careers": "List of careers",
        "people_examples": "Names or examples of people"
      }
    ]
  },
  "talentsPortfolio": {
    "entries": [
      {
        "talent": "Talent name here",
        "want_career": "Yes/No/Maybe and why",
        "matching_careers": "List of careers",
        "people_examples": "Names or examples of people"
      }
    ]
  }
}

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Fallback prompt for Hobbies if database fetch fails
   */
  private buildHobbiesFallbackPrompt(
    responses: Record<string, string>,
    language: SummaryLanguage = 'en'
  ): string {
    const formattedResponses = this.formatHobbiesResponses(responses);

    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write all entries in Kannada, maintaining the student\'s natural voice.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write all entries in Tamil, maintaining the student\'s natural voice.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write all entries in Hindi, maintaining the student\'s natural voice.\n'
          : '';

    return `${BASE_SYSTEM_PROMPT}

You will now create portfolios of the student's talents and hobbies.
${languageInstruction}
STUDENT RESPONSES FROM MY TALENTS AND HOBBIES ASSESSMENT:
${formattedResponses}

Generate both Hobbies Portfolio and Talents Portfolio in the student's voice (first person).

HOBBIES PORTFOLIO - For each hobby entry:
- Hobbies: The hobby name
- I would like to turn this hobby into a career: Yes/No/Maybe and why
- Careers that are compatible with these hobbies: List of careers
- People you know who have turned their hobbies into careers: Names or examples

TALENTS PORTFOLIO - For each talent entry:
- Talents: The talent name
- Do you want to turn your talent into a career?: Yes/No/Maybe and why
- Careers that match your talents: List of careers
- People you know who have turned their talents into careers: Names or examples

Format the response as valid JSON:
{
  "hobbiesPortfolio": {
    "entries": [
      {
        "hobby": "...",
        "want_career": "...",
        "compatible_careers": "...",
        "people_examples": "..."
      }
    ]
  },
  "talentsPortfolio": {
    "entries": [
      {
        "talent": "...",
        "want_career": "...",
        "matching_careers": "...",
        "people_examples": "..."
      }
    ]
  }
}

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Generate AI summary for Hobbies assessment
   */
  async generateHobbiesSummary(
    responses: Record<string, string>,
    preferredLanguage?: string
  ): Promise<GenerateSummaryResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gemini API key is not configured'
      };
    }

    // Validate responses
    if (!responses || Object.keys(responses).length === 0) {
      return {
        success: false,
        error: 'No responses provided from Hobbies assessment'
      };
    }

    try {
      // Detect language from student responses
      const detectedLanguage = this.detectLanguage({ part1: responses }, preferredLanguage);
      logger.log(`🌐 Detected language from student responses: ${detectedLanguage}`);

      const prompt = await this.buildHobbiesPrompt(responses, detectedLanguage);

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };

      logger.log('📡 Calling Gemini API for Hobbies summary:', 'gemini-proxy');

      const data = await this.callGeminiProxy(requestBody) as any;
      logger.log('✅ Gemini API response received for Hobbies summary');

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        logger.error('❌ No text in response:', JSON.stringify(data, null, 2));
        return {
          success: false,
          error: 'No content generated by AI'
        };
      }

      logger.log('✅ Successfully generated Hobbies summary, length:', generatedText.length);

      const summary = this.parseHobbiesResponse(generatedText);

      if (!summary) {
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }

      return {
        success: true,
        summary
      };

    } catch (error) {
      logger.error('Error generating Hobbies summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse Hobbies summary response (returns portfolio entries as SummaryQuestions structure)
   */
  private parseHobbiesResponse(text: string): SummaryQuestions | null {
    try {
      // Remove markdown code blocks if present
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      // Validate structure
      if (!parsed.hobbiesPortfolio || !parsed.talentsPortfolio) {
        logger.error('❌ Invalid Hobbies summary structure:', parsed);
        return null;
      }

      if (!parsed.hobbiesPortfolio.entries || !Array.isArray(parsed.hobbiesPortfolio.entries)) {
        logger.error('❌ Invalid Hobbies Portfolio structure:', parsed.hobbiesPortfolio);
        return null;
      }

      if (!parsed.talentsPortfolio.entries || !Array.isArray(parsed.talentsPortfolio.entries)) {
        logger.error('❌ Invalid Talents Portfolio structure:', parsed.talentsPortfolio);
        return null;
      }

      // Convert portfolio entries to SummaryQuestions format
      // Store hobbies portfolio as JSON string in question1
      // Store talents portfolio as JSON string in question6
      const hobbiesJson = JSON.stringify(parsed.hobbiesPortfolio.entries);
      const talentsJson = JSON.stringify(parsed.talentsPortfolio.entries);

      return {
        question1: hobbiesJson, // Store hobbies portfolio as JSON string
        question2: '', // Not used for Hobbies
        question3: '', // Not used for Hobbies
        question4: '', // Not used for Hobbies
        question5: '', // Not used for Hobbies
        question6: talentsJson // Store talents portfolio as JSON string
      };
    } catch (error) {
      logger.error('❌ Failed to parse Hobbies summary response:', error);
      return null;
    }
  }

  /**
   * Format About Me assessment responses for summary
   */
  private formatAboutMeResponses(responses: Record<string, any>): string {
    let formatted = '=== ABOUT ME ASSESSMENT ===\n';

    Object.entries(responses).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          // Handle triple or double arrays
          formatted += `${key}: ${value.filter(v => v && typeof v === 'string' && v.trim()).join(', ')}\n`;
        } else if (typeof value === 'string' && value.trim()) {
          formatted += `${key}: ${value}\n`;
        }
      }
    });

    return formatted || 'No responses available';
  }

  /**
   * Build prompt for About Me assessment summary
   */
  private async buildAboutMePrompt(
    responses: Record<string, any>,
    language: SummaryLanguage = 'en'
  ): Promise<string> {
    const formattedResponses = this.formatAboutMeResponses(responses);

    // Fetch template from database
    const template = await this.getSummaryTemplate('about_me');

    if (!template) {
      logger.error('Failed to fetch About Me summary template, falling back to default');
      return this.buildAboutMeFallbackPrompt(responses, language);
    }

    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';
    const preferredKey: SummaryLanguage = language;
    const hasPreferred = template[preferredKey];
    const langKey: keyof SummaryTemplate =
      (hasPreferred ? preferredKey : 'en') as keyof SummaryTemplate;

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write all three answers in Kannada, maintaining the student\'s natural voice.\n- Use Kannada script for all text in question1, question2, and question3.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write all three answers in Tamil, maintaining the student\'s natural voice.\n- Use Tamil script for all text in question1, question2, and question3.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write all three answers in Hindi, maintaining the student\'s natural voice.\n- Use Devanagari script for all text in question1, question2, and question3.\n'
          : '';

    // Get questions from database template
    const questions =
      (template[langKey] as SummaryTemplateLanguageBlock | undefined) ?? template.en;

    // Dynamically build questions prompt to avoid "undefined" for missing questions
    let questionsPrompt = '';
    const jsonStructure: Record<string, string> = {};

    // We support up to 20 questions just in case
    for (let i = 1; i <= 20; i++) {
      const qKey = `question${i}`;
      const qText = (questions as any)[qKey];
      if (qText) {
        questionsPrompt += `Question ${i}: ${qText}\n`;
        jsonStructure[qKey] = `Answer for Q${i}...`;
      }
    }

    const coreInstructions = BASE_SYSTEM_PROMPT;

    return `${coreInstructions}

You will now create a summary based only on the student's responses about themselves.
${languageInstruction}
STUDENT ANSWERS ABOUT THEMSELVES:
${formattedResponses}

Write answers to the questions based on the student's input. Use "I" and "me".

${questionsPrompt}

IMPORTANT RULES:
- Write like the student is talking (use "I" and "me")
- Use plain English - no difficult words
- The TOTAL length should be 200-300 words
- For each question, write a brief 2-3 sentence answer directly. Do not include labels like "Category" or "What I said". Just write the answer.
- Be short and clear
- Use the student's own words from their answers
- Write like the student himself/herself is writing
- Format the response as valid JSON with this exact structure:

${JSON.stringify(jsonStructure, null, 2)}

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Fallback prompt for About Me if database fetch fails
   */
  private buildAboutMeFallbackPrompt(
    responses: Record<string, any>,
    language: SummaryLanguage = 'en'
  ): string {
    const formattedResponses = this.formatAboutMeResponses(responses);
    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write all three answers in Kannada, maintaining the student\'s natural voice.\n- Use Kannada script for all text in question1, question2, and question3.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write all three answers in Tamil, maintaining the student\'s natural voice.\n- Use Tamil script for all text in question1, question2, and question3.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write all three answers in Hindi, maintaining the student\'s natural voice.\n- Use Devanagari script for all text in question1, question2, and question3.\n'
          : '';

    const questionsPrompt = isKannada
      ? `Question 1: ಕುಟುಂಬ ಬಿಟ್ಟು ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತ
Question 2: ನಾನು ಮನೆಯಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತಿದ್ದೇನೆ?
Question 3: ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು
Question 4: ಶಾಲೆಯ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆ/ಅಂಶಗಳು
Question 5: ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು
Question 6: ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳು
Question 7: ಶಾಲಾವಧಿಯಲ್ಲಿ ಮಾಡಬೇಕಾದ, ಆದರೆ ನನಗೆ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ
Question 8: ಶಾಲಾವಧಿಯ ನಂತರ, ಶಾಲೆಯ ಆಚೆ ನನಗೆ ನರ್ವಹಿಸಲು ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆ
Question 9: ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು
Question 10: ನಾನು ಸಹಜವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು
Question 11: ನನಗೆ ಸಹಜವಾಗಿ ಮಾಡಲು ಬಾರದಿರುವ ಚಟುವಟಿಕೆಗಳು
Question 12: ನನ್ನಲ್ಲಿರುವ, ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು
Question 13: ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು
Question 14: ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣ/ ಅಂಶಗಳು`
      : isTamil
        ? `Question 1: என் குடும்பத்தைத் தவிர, என் நண்பர்கள் யார்?
Question 2: நான் தினமும் என்ன வேலைகளை செய்கிறேன்?
Question 3: பள்ளி நேரத்தில் நான் ரசிக்கும் செயல்கள் என்ன?
Question 4: பள்ளிக்கு வெளியே நான் ரசிக்கும் செயல்கள் என்ன?
Question 5: தனிப்பட்ட முறையில் நான் ரசிக்கும் செயல்கள் என்ன?
Question 6: குழுவாகச் செய்யும்போது நான் ரசிக்கும் செயல்கள் என்ன?
Question 7: பள்ளியில் செய்ய வேண்டியிருந்தாலும் எனக்கு கடினமாக இருக்கும் செயல் எது?
Question 8: பள்ளிக்கு பிறகு அல்லது பள்ளிக்கு வெளியே செய்ய கடினமாக இருப்பது எது?
Question 9: நான் கட்டாயமாக செய்ய வேண்டிய செயல்கள் என்ன?
Question 10: நான் எளிதாக செய்யக்கூடிய செயல்கள் என்ன?
Question 11: எனக்கு எளிதாக செய்ய முடியாத செயல்கள் என்ன?
Question 12: என்னிடத்தில் நான் விரும்பும் குணங்கள் என்ன?
Question 13: மற்றவர்கள் என்னிடத்தில் விரும்பும் குணங்கள் என்ன?
Question 14: நான் மேம்படுத்த வேண்டிய குணங்கள் / அம்சங்கள் என்ன?`
        : `Question 1: Who are my friends outside my family?
Question 2: What activities do I do daily?
Question 3: Which activities do I enjoy during school time?
Question 4: Which activities do I enjoy outside school?
Question 5: What activities do I enjoy personally?
Question 6: What activities do I enjoy doing as a team?
Question 7: Which school activity do I find difficult even though I must do it?
Question 8: Which activity do I find difficult to manage after school or outside school?
Question 9: What activities must I do?
Question 10: Which activities can I do easily?
Question 11: Which activities are not easy for me to do?
Question 12: What qualities do I like about myself?
Question 13: What qualities do others like in me?
Question 14: Which qualities or aspects do I need to improve?`;

    const coreInstructions = BASE_SYSTEM_PROMPT;

    return `${coreInstructions}

You will now create a summary based only on the student's responses about themselves.
${languageInstruction}
STUDENT ANSWERS ABOUT THEMSELVES:
${formattedResponses}

Write answers to these 14 questions as if the student is speaking (use "I" and "me").

${questionsPrompt}

IMPORTANT RULES:
- Write like the student is talking (use "I" and "me")
- Use very simple words that a grade 8 or 9 student can easily understand
- Use plain English - no difficult words
- The TOTAL length should be 200-300 words for all 14 answers together
- Be short and clear
- Use the student's own words from their answers
- Write like the student himself/herself is writing
- Format the response as valid JSON with this exact structure:

{
  "question1": "...",
  "question2": "...",
  "question3": "...",
  "question4": "...",
  "question5": "...",
  "question6": "...",
  "question7": "...",
  "question8": "...",
  "question9": "...",
  "question10": "...",
  "question11": "...",
  "question12": "...",
  "question13": "...",
  "question14": "..."
}

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Generate AI summary for About Me assessment
   */
  async generateAboutMeSummary(
    responses: Record<string, any>,
    preferredLanguage?: string
  ): Promise<GenerateSummaryResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gemini API key is not configured'
      };
    }

    // Validate responses
    if (!responses || Object.keys(responses).length === 0) {
      return {
        success: false,
        error: 'No responses provided from About Me assessment'
      };
    }

    try {
      // Detect language from student responses
      const detectedLanguage = this.detectLanguage({ part1: responses }, preferredLanguage);
      logger.log(`🌐 Detected language from student responses: ${detectedLanguage} `);

      const prompt = await this.buildAboutMePrompt(responses, detectedLanguage);

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };

      logger.log('📡 Calling Gemini API for About Me summary:', 'gemini-proxy');

      const data = await this.callGeminiProxy(requestBody) as any;
      logger.log('✅ Gemini API response received for About Me');

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        logger.error('❌ No text in response:', JSON.stringify(data, null, 2));
        return {
          success: false,
          error: 'No content generated by AI'
        };
      }

      logger.log('✅ Successfully generated About Me summary, length:', generatedText.length);

      const summary = this.parseGeminiResponse(generatedText);

      if (!summary) {
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }

      return {
        success: true,
        summary
      };

    } catch (error) {
      logger.error('Error generating About Me summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Format Role Models assessment responses for summary
   */
  private formatRoleModelsResponses(responses: Record<string, any>): string {
    let formatted = '=== MY ROLE MODELS ASSESSMENT ===\n';

    // Role Models has roleModel1, roleModel2, roleModel3 structure
    if (responses.roleModel1 || responses.roleModel2 || responses.roleModel3) {
      ['roleModel1', 'roleModel2', 'roleModel3'].forEach((key, index) => {
        const roleModel = responses[key];
        if (roleModel && typeof roleModel === 'object') {
          formatted += `\n-- - Role Model ${index + 1} ---\n`;
          Object.entries(roleModel).forEach(([field, value]) => {
            if (value && typeof value === 'string' && value.trim()) {
              formatted += `${field}: ${value} \n`;
            }
          });
        }
      });
    } else {
      // Fallback: format all fields
      Object.entries(responses).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          formatted += `${key}: ${value} \n`;
        } else if (value && typeof value === 'object') {
          formatted += `${key}: ${JSON.stringify(value)} \n`;
        }
      });
    }

    return formatted || 'No responses available';
  }

  /**
   * Build prompt for Role Models assessment summary
   */
  private async buildRoleModelsPrompt(
    responses: Record<string, any>,
    language: SummaryLanguage = 'en'
  ): Promise<string> {
    const formattedResponses = this.formatRoleModelsResponses(responses);

    // Fetch template from database
    const template = await this.getSummaryTemplate('role_models');

    if (!template) {
      logger.error('Failed to fetch Role Models summary template, falling back to default');
      return this.buildRoleModelsFallbackPrompt(responses, language);
    }

    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';
    const preferredKey: SummaryLanguage = language;
    const hasPreferred = template[preferredKey];
    const langKey: keyof SummaryTemplate =
      (hasPreferred ? preferredKey : 'en') as keyof SummaryTemplate;

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write the answer in Kannada, maintaining the student\'s natural voice.\n- Use Kannada script for all text in question1.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write the answer in Tamil, maintaining the student\'s natural voice.\n- Use Tamil script for all text in question1.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write the answer in Hindi, maintaining the student\'s natural voice.\n- Use Devanagari script for all text in question1.\n'
          : '';

    // Get questions from database template
    const questions =
      (template[langKey] as SummaryTemplateLanguageBlock | undefined) ?? template.en;

    const questionsPrompt = `Question 1: ${questions.question1}`;

    const coreInstructions = BASE_SYSTEM_PROMPT;

    return `${coreInstructions}

You will now create a summary based only on the student's responses about their role models.
${languageInstruction}
STUDENT ANSWERS ABOUT THEIR ROLE MODELS:
${formattedResponses}

Write an answer to this question as if the student is speaking(use "I" and "me").

      ${questionsPrompt}

IMPORTANT RULES:
    - Write like the student is talking(use "I" and "me")
      - Use very simple words that a grade 8 or 9 student can easily understand
        - Use plain English - no difficult words
          - The output MUST be a numbered list of 5 to 10 specific questions
            - Each question in the list should be something the student would want to ask their role model
              - Base the questions on the specific role models and qualities the student mentioned(e.g., if they chose a teacher, ask about teaching; if they chose a doctor, ask about medicine)
    - Be short and clear
      - Use the student's own words from their answers
        - Write like the student himself / herself is writing
          - Format the response as valid JSON with this exact structure:

    {
      "question1": "1. [First Question]\\n2. [Second Question]\\n..."
    }

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Fallback prompt for Role Models if database fetch fails
   */
  private buildRoleModelsFallbackPrompt(
    responses: Record<string, any>,
    language: SummaryLanguage = 'en'
  ): string {
    const formattedResponses = this.formatRoleModelsResponses(responses);
    const isKannada = language === 'kn';
    const isTamil = language === 'ta';
    const isHindi = language === 'hi';

    const languageInstruction = isKannada
      ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Kannada (ಕನ್ನಡ).\n- You MUST generate your summary answers in Kannada (ಕನ್ನಡ) script.\n- Write the answer in Kannada, maintaining the student\'s natural voice.\n- Use Kannada script for all text in question1.\n'
      : isTamil
        ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Tamil (தமிழ்).\n- You MUST generate your summary answers in Tamil (தமிழ்) script.\n- Write the answer in Tamil, maintaining the student\'s natural voice.\n- Use Tamil script for all text in question1.\n'
        : isHindi
          ? '\n\nIMPORTANT LANGUAGE REQUIREMENT:\n- The student\'s responses are in Hindi (हिन्दी).\n- You MUST generate your summary answers in Hindi (हिन्दी / Devanagari) script.\n- Write the answer in Hindi, maintaining the student\'s natural voice.\n- Use Devanagari script for all text in question1.\n'
          : '';

    const questionsPrompt = isKannada
      ? `Question 1: ನಿಮ್ಮ ಪಾತ್ರ ಮಾದರಿಗಳಿಂದ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನದ ಕುರಿತಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ.`
      : isTamil
        ? `Question 1: உங்கள் முன்மாதிரிகளிடம் தொழில் வழிகாட்டல் பற்றி நீங்கள் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்.`
        : `Question 1: Write down 5 to 10 questions you would like to ask your role models about career guidance.`;

    const coreInstructions = BASE_SYSTEM_PROMPT;

    return `${coreInstructions}

You will now create a summary based only on the student's responses about their role models.
${languageInstruction}
STUDENT ANSWERS ABOUT THEIR ROLE MODELS:
${formattedResponses}

Write an answer to this question as if the student is speaking(use "I" and "me").

      ${questionsPrompt}

IMPORTANT RULES:
    - Write like the student is talking(use "I" and "me")
      - Use very simple words that a grade 8 or 9 student can easily understand
        - Use plain English - no difficult words
          - The output MUST be a numbered list of 5 to 10 specific questions
            - Each question in the list should be something the student would want to ask their role model
              - Base the questions on the specific role models and qualities the student mentioned
                - Be short and clear
                  - Use the student's own words from their answers
                    - Write like the student himself / herself is writing
                      - Format the response as valid JSON with this exact structure:

    {
      "question1": "1. [First Question]\\n2. [Second Question]\\n..."
    }

Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Generate AI summary for Role Models assessment
   */
  async generateRoleModelsSummary(
    responses: Record<string, any>,
    preferredLanguage?: string
  ): Promise<GenerateSummaryResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gemini API key is not configured'
      };
    }

    // Validate responses
    if (!responses || Object.keys(responses).length === 0) {
      return {
        success: false,
        error: 'No responses provided from Role Models assessment'
      };
    }

    try {
      // Detect language from student responses
      const detectedLanguage = this.detectLanguage({ part1: responses }, preferredLanguage);
      logger.log(`🌐 Detected language from student responses: ${detectedLanguage} `);

      const prompt = await this.buildRoleModelsPrompt(responses, detectedLanguage);

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };

      logger.log('📡 Calling Gemini API for Role Models summary:', 'gemini-proxy');

      const data = await this.callGeminiProxy(requestBody) as any;
      logger.log('✅ Gemini API response received for Role Models summary');

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        logger.error('❌ No text in response:', JSON.stringify(data, null, 2));
        return {
          success: false,
          error: 'No content generated by AI'
        };
      }

      logger.log('✅ Successfully generated Role Models summary, length:', generatedText.length);
      logger.log('📄 Generated text (first 500 chars):', generatedText.substring(0, 500));

      const summary = this.parseGeminiResponse(generatedText);

      if (!summary) {
        logger.error('❌ Failed to parse Role Models summary. Full response:', generatedText);
        return {
          success: false,
          error: 'Failed to parse AI response. Please check the console for details.'
        };
      }

      logger.log('✅ Successfully parsed Role Models summary:', summary);

      return {
        success: true,
        summary
      };

    } catch (error) {
      logger.error('Error generating Role Models summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate 3-5 keyword phrases from an approved assessment summary for the Profile Card.
   * Returns a JSON array of strings.
   */
  async generateProfileCardKeywords(
    assessmentType: string,
    summaryText: string,
    lang: string = 'en',
    assessmentResponses?: string
  ): Promise<{ success: boolean; keywords?: Record<string, string>; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Gemini API key is not configured' };
    }
    if (!summaryText || summaryText.trim().length === 0) {
      return { success: false, error: 'No summary text provided' };
    }

    // Fetch profile card questions from content_translations
    const resourceType = `profile_card_${assessmentType}`;
    const questionKeys = Array.from({ length: 10 }, (_, i) => `question${i + 1}`);
    const { data: qRows } = await supabase
      .from('content_translations')
      .select('resource_key,text')
      .eq('resource_type', resourceType)
      .eq('lang', lang)
      .in('resource_key', questionKeys);

    if (!qRows || qRows.length === 0) {
      // Fallback to English if no rows for requested lang
      const { data: enRows } = await supabase
        .from('content_translations')
        .select('resource_key,text')
        .eq('resource_type', resourceType)
        .eq('lang', 'en')
        .in('resource_key', questionKeys);
      if (!enRows || enRows.length === 0) {
        return { success: false, error: `No profile card questions found for ${assessmentType}` };
      }
      qRows?.splice(0, qRows.length, ...enRows);
      if (!qRows || qRows.length === 0) {
        // Direct assignment for when qRows was null
        return this.generateProfileCardKeywordsWithQuestions(assessmentType, summaryText, lang, enRows, assessmentResponses);
      }
    }

    return this.generateProfileCardKeywordsWithQuestions(assessmentType, summaryText, lang, qRows, assessmentResponses);
  }

  private async generateProfileCardKeywordsWithQuestions(
    assessmentType: string,
    summaryText: string,
    lang: string,
    qRows: { resource_key: string; text: string }[],
    assessmentResponses?: string
  ): Promise<{ success: boolean; keywords?: Record<string, string>; error?: string }> {
    // Sort questions by key
    const sortedQuestions = qRows
      .filter(r => r.resource_key.startsWith('question'))
      .sort((a, b) => {
        const aNum = parseInt(a.resource_key.replace('question', ''));
        const bNum = parseInt(b.resource_key.replace('question', ''));
        return aNum - bNum;
      });

    const isKannada = lang === 'kn';
    const isTamil = lang === 'ta';
    const isHindi = lang === 'hi';

    const langInstruction = isKannada
      ? 'All keyword answers MUST be written in Kannada script (ಕನ್ನಡ). Not in English. Not in Roman letters.'
      : isTamil
        ? 'All keyword answers MUST be written in Tamil script (தமிழ்). Not in English. Not in Roman letters.'
        : isHindi
          ? 'All keyword answers MUST be written in Hindi/Devanagari script (हिन्दी). Not in English. Not in Roman letters.'
          : 'All keyword answers MUST be written in English.';

    // BASE_SYSTEM_PROMPT contains "Respond in the same language as the student's responses" which
    // is too permissive for profile card keywords (students may write in Tanglish/Roman script).
    // tanglishInstruction below explicitly overrides that instruction for this function only.
    const tanglishInstruction = `
IMPORTANT — INPUT LANGUAGE NOTE:
Students in rural India often write in Tanglish/Kanglish/Hinglish — their native language written in English/Roman letters.
For example: "naa doctor aganum" means "I want to become a doctor" in Tamil.
"nanna kನ್ನಡ school" is mixed Kannada-English.
You must understand these Roman-script representations of Indian languages and extract their meaning correctly.

IMPORTANT — OUTPUT LANGUAGE REQUIREMENT:
Regardless of what language or script the student used in their responses, you MUST generate all keyword answers in the following script: ${langInstruction}
This overrides all other language instructions. Do NOT mirror the student's input script. Do NOT output in English unless the dashboard language is English. Always output in the script specified above.
`;

    // Build questions list for prompt
    const questionsBlock = sortedQuestions
      .map(q => `${q.resource_key}: ${q.text}`)
      .join('\n');

    // Build JSON structure for expected output
    const jsonStructure: Record<string, string> = {};
    sortedQuestions.forEach(q => {
      jsonStructure[q.resource_key] = '2-3 word answer';
    });

    const contextBlock = assessmentResponses
      ? `\nAssessment Responses:\n${assessmentResponses}\n\nAssessment Summary:\n${summaryText}`
      : `\nAssessment Summary:\n${summaryText}`;

    const prompt = `${BASE_SYSTEM_PROMPT}

Based on the student's assessment data below, answer each of the following profile card questions in exactly 2-3 words only.

${tanglishInstruction}

Profile Card Questions:
${questionsBlock}
${contextBlock}

Rules:
- Each answer MUST be exactly 2-3 words. No more.
- Use the student's own words where possible.
- Be encouraging and age-appropriate.
- Return ONLY a JSON object. No other text.

Expected format:
${JSON.stringify(jsonStructure, null, 2)}`;

    try {
      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
      };

      const data = await this.callGeminiProxy(requestBody) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!parsed || typeof parsed !== 'object' || !parsed.question1) {
        return { success: false, error: 'Failed to parse profile card answers from AI response' };
      }

      return { success: true, keywords: parsed as Record<string, string> };
    } catch (error) {
      logger.error('Error generating profile card keywords:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generate a career direction paragraph combining Dreams + Talents + Role Models keywords.
   */
  async generateCareerDirection(
    dreamsAnswers: Record<string, string>,
    hobbiesAnswers: Record<string, string>,
    roleModelsAnswers: Record<string, string>,
    studentName: string,
    lang: string = 'en'
  ): Promise<{ success: boolean; direction?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Gemini API key is not configured' };
    }

    const langInstruction = lang === 'kn'
      ? 'Respond in Kannada (ಕನ್ನಡ) script.'
      : lang === 'ta'
        ? 'Respond in Tamil (தமிழ்) script.'
        : lang === 'hi'
          ? 'Respond in Hindi (हिन्दी / Devanagari) script.'
          : 'Respond in English.';

    const formatAnswers = (answers: Record<string, string>) =>
      Object.values(answers).filter(v => v && v.trim()).join(', ');

    const prompt = `${BASE_SYSTEM_PROMPT}

Based on the student's profile card answers below, write a single inspiring paragraph (60-100 words) that weaves together their dreams, talents, and role model inspirations into a cohesive career direction summary.

${langInstruction}
Address the student by name: ${studentName}.
Be encouraging, specific, and age-appropriate.
Return ONLY the paragraph text, no JSON or formatting.

Dreams: ${formatAnswers(dreamsAnswers)}
Talents & Hobbies: ${formatAnswers(hobbiesAnswers)}
Role Models: ${formatAnswers(roleModelsAnswers)}`;

    try {
      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      };

      const data = await this.callGeminiProxy(requestBody) as any;
      const direction = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      if (!direction) {
        return { success: false, error: 'Empty response from AI' };
      }

      return { success: true, direction };
    } catch (error) {
      logger.error('Error generating career direction:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Proxy all Gemini generateContent calls through the gemini-proxy Edge Function.
   * Tries gemini-2.0-flash first, falls back to gemini-2.0-flash-lite on error.
   */
  private async callGeminiProxy(requestBody: { contents: unknown[]; generationConfig?: object }): Promise<unknown> {
    const invoke = (model: string) =>
      supabase.functions.invoke('gemini-proxy', {
        body: { model, contents: requestBody.contents, ...(requestBody.generationConfig ? { generationConfig: requestBody.generationConfig } : {}) },
      });

    let result = await invoke('gemini-2.0-flash');
    if (result.error) {
      logger.warn('Primary Gemini model failed, trying fallback:', result.error);
      result = await invoke('gemini-2.0-flash-lite');
    }
    if (result.error) {
      throw new Error(result.error.message || 'Gemini proxy error');
    }
    return result.data;
  }
}

// Export singleton instance
export const aiSummaryService = new AISummaryService();

