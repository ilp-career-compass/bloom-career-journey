/**
 * Checks if a string contains any Hindi (Devanagari), Tamil, Kannada, or other non-English language scripts.
 * 
 * ASCII range:
 * - \x00-\x7F: standard English letters, digits, spaces, and punctuation.
 * 
 * Indian Script ranges:
 * - Devanagari (Hindi, etc.): \u0900-\u097F
 * - Tamil: \u0B80-\u0BFF
 * - Kannada: \u0C80-\u0CFF
 * - All major Indian scripts: \u0900-\u0D7F
 * 
 * Standard Latin-1 Accents: \u0080-\u00FF
 * Emojis and basic symbols are fully permitted.
 */
export function hasNonEnglishContent(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  // 1. Check for Indian language scripts (Devanagari, Tamil, Kannada, etc.)
  const indianScriptRegex = /[\u0900-\u0D7F]/;
  if (indianScriptRegex.test(text)) {
    return true;
  }

  // 2. Unicode Letter check for non-English alphabets
  try {
    const letters = text.match(/\p{L}/gu);
    if (letters) {
      const hasNonEnglish = letters.some(char => !/[A-Za-z]/.test(char));
      if (hasNonEnglish) return true;
    }
  } catch (e) {
    // Fallback regex for environment compatibility if Unicode property escapes aren't fully supported
    const fallbackRegex = /[\u0080-\u00FF\u0400-\u04FF\u0370-\u03FF\u3040-\u30FF\u4E00-\u9FFF]/;
    if (fallbackRegex.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the current page URL route is an assessment route.
 */
export function isAssessmentRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  return (
    path.includes('assessment') ||
    path.includes('things-interest-me') ||
    path.includes('holland-test') ||
    path.includes('summary')
  );
}

/**
 * Recursively scans any response state structure (flat or deeply nested)
 * and returns false if any user-entered string contains non-English characters.
 */
export function validateResponses(responses: any): boolean {
  if (responses === null || responses === undefined) return true;

  if (typeof responses === 'string') {
    return !hasNonEnglishContent(responses);
  }

  if (Array.isArray(responses)) {
    return responses.every(item => validateResponses(item));
  }

  if (typeof responses === 'object') {
    return Object.values(responses).every(value => validateResponses(value));
  }

  return true;
}
