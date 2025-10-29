// AI Summary Service - Generates reflective summaries using Gemini API

import { SummaryQuestions } from '@/types/assessmentSummary';

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

class AISummaryService {
  private apiKey: string | undefined;
  private endpoint: string;
  private fallbackEndpoint: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // Use Gemini 2.0 Flash (confirmed available in your API key metrics)
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    // Fallback to experimental model if needed
    this.fallbackEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-exp-1206:generateContent';
  }

  /**
   * Check if Gemini API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
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
   * Build the prompt for Gemini API
   */
  private buildPrompt(responses: AssessmentResponses): string {
    const formattedResponses = this.formatResponses(responses);
    
    return `You are a career counselor helping a student reflect on inspirational videos they watched.
Based on the student's responses below, generate a thoughtful, personalized summary.

STUDENT RESPONSES TO 6 INSPIRATIONAL VIDEOS:
${formattedResponses}

Please generate answers to these 3 reflection questions in the student's voice (first person).
Be specific, reference actual content from their responses, and keep the tone conversational and age-appropriate.

Question 1: List the things that inspired you from these videos and from your own experiences.
- Identify specific moments, quotes, or themes from the videos
- Connect to any personal experiences the student mentioned
- Be specific with 3-5 key takeaways
- Write in first person ("I was inspired by...")

Question 2: After watching all these videos, which behaviors do you feel you should avoid?
- Identify negative patterns, habits, or attitudes mentioned in the videos
- Explain why these should be avoided
- Provide constructive framing
- Write in first person ("I should avoid...")

Question 3: Discuss the similarities between the characters in these videos who inspired you, and the people who have inspired you in real life.
- Find common themes, values, or traits
- Connect video characters to real-life role models the student mentioned
- Identify patterns of what makes someone inspiring
- Write in first person ("I notice that...")

IMPORTANT: 
- Write in the student's voice (first person)
- Keep each answer to 2-4 concise paragraphs
- Be specific and reference their actual responses
- Use natural, conversational language appropriate for their age
- Format the response as valid JSON with this exact structure:

{
  "question1": "Your detailed answer here...",
  "question2": "Your detailed answer here...",
  "question3": "Your detailed answer here..."
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
      
      // Validate structure
      if (parsed.question1 && parsed.question2 && parsed.question3) {
        return {
          question1: parsed.question1,
          question2: parsed.question2,
          question3: parsed.question3
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return null;
    }
  }

  /**
   * Generate AI summary for inspiration assessment
   */
  async generateInspirationSummary(
    responses: AssessmentResponses
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
      const prompt = this.buildPrompt(responses);
      
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

      console.log('📡 Calling Gemini API:', this.endpoint);
      console.log('🔑 API Key configured:', !!this.apiKey);
      console.log('📝 Request body:', JSON.stringify(requestBody));

      // Try primary endpoint (gemini-1.5-flash-latest)
      let response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // If 404, try fallback endpoint (gemini-1.5-pro-latest)
      if (!response.ok && response.status === 404) {
        console.warn('⚠️ Primary model not found, trying fallback:', this.fallbackEndpoint);
        
        response = await fetch(`${this.fallbackEndpoint}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Gemini API error (Full Response):', errorData);
        console.error('❌ Status:', response.status);
        console.error('❌ Status Text:', response.statusText);
        console.error('❌ Response Headers:', Object.fromEntries(response.headers.entries()));
        
        // Try to parse error for more details
        try {
          const errorJson = JSON.parse(errorData);
          console.error('❌ Parsed Error:', JSON.stringify(errorJson, null, 2));
          
          // Log suggested models if available
          if (errorJson.error?.message) {
            console.error('❌ Error Message:', errorJson.error.message);
          }
        } catch (e) {
          console.error('❌ Could not parse error as JSON');
        }
        
        return {
          success: false,
          error: `API request failed: ${response.status} - ${response.statusText}`
        };
      }

      const data = await response.json();
      console.log('✅ Gemini API response received');
      console.log('📊 Response structure:', {
        hasCandidates: !!data?.candidates,
        candidatesCount: data?.candidates?.length || 0,
        hasContent: !!data?.candidates?.[0]?.content
      });

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        console.error('❌ No text in response:', JSON.stringify(data, null, 2));
        return {
          success: false,
          error: 'No content generated by AI'
        };
      }

      console.log('✅ Successfully generated summary, length:', generatedText.length);

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
      console.error('Error generating summary:', error);
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
    );
  }

  /**
   * Get word count for a summary
   */
  getSummaryWordCount(summary: SummaryQuestions): number {
    const allText = `${summary.question1} ${summary.question2} ${summary.question3}`;
    return allText.split(/\s+/).filter(word => word.length > 0).length;
  }
}

// Export singleton instance
export const aiSummaryService = new AISummaryService();

