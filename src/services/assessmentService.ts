import { supabase } from '@/integrations/supabase/client';

export interface AssessmentOption {
  id: string;
  option_text: string;
  option_value: string;
  sequence_number: number;
}

export interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: 'text' | 'textarea' | 'checkbox' | 'radio' | 'multiple_choice' | 'rating' | 'boolean';
  help_text: string | null;
  is_required: boolean;
  sequence_number: number;
  options: AssessmentOption[];
}

export interface AssessmentSection {
  id: string;
  title: string;
  description: string | null;
  sequence_number: number;
  questions: AssessmentQuestion[];
}

export interface AssessmentTemplate {
  template_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  sections: AssessmentSection[];
}

export interface MediaSource {
  id: string;
  media_type: 'video' | 'audio' | 'image' | 'document';
  title: string;
  url: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  sequence_number: number;
}

export class AssessmentService {
  /**
   * Get assessment template with all questions and options
   */
  static async getAssessmentTemplate(assessmentType: string): Promise<AssessmentTemplate | null> {
    try {
      const { data, error } = await supabase.rpc('get_assessment_template', {
        p_assessment_type: assessmentType
      });

      if (error) {
        console.error('Error fetching assessment template:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn(`No assessment template found for type: ${assessmentType}`);
        return null;
      }

      return data[0] as AssessmentTemplate;
    } catch (error) {
      console.error('Error in getAssessmentTemplate:', error);
      return null;
    }
  }

  /**
   * Get media sources for an assessment
   */
  static async getMediaSources(assessmentType: string): Promise<MediaSource[]> {
    try {
      const { data, error } = await supabase.rpc('get_assessment_media_sources', {
        p_assessment_type: assessmentType
      });

      if (error) {
        console.error('Error fetching media sources:', error);
        return [];
      }

      return data as MediaSource[];
    } catch (error) {
      console.error('Error in getMediaSources:', error);
      return [];
    }
  }

  /**
   * Get all assessment templates (for admin use)
   */
  static async getAllAssessmentTemplates(): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_assessment_templates');

      if (error) {
        console.error('Error fetching all assessment templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllAssessmentTemplates:', error);
      return [];
    }
  }

  /**
   * Update assessment template
   */
  static async updateAssessmentTemplate(
    templateId: string,
    updates: {
      title?: string;
      description?: string;
      instructions?: string;
      is_active?: boolean;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_assessment_template', {
        p_template_id: templateId,
        p_title: updates.title,
        p_description: updates.description,
        p_instructions: updates.instructions,
        p_is_active: updates.is_active
      });

      if (error) {
        console.error('Error updating assessment template:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateAssessmentTemplate:', error);
      return false;
    }
  }

  /**
   * Add or update media source
   */
  static async upsertMediaSource(
    assessmentType: string,
    mediaData: {
      title: string;
      url: string;
      description?: string;
      thumbnail_url?: string;
      duration_seconds?: number;
      sequence_number?: number;
    }
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('upsert_media_source', {
        p_assessment_type: assessmentType,
        p_title: mediaData.title,
        p_url: mediaData.url,
        p_description: mediaData.description,
        p_thumbnail_url: mediaData.thumbnail_url,
        p_duration_seconds: mediaData.duration_seconds,
        p_sequence_number: mediaData.sequence_number
      });

      if (error) {
        console.error('Error upserting media source:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in upsertMediaSource:', error);
      return null;
    }
  }

  /**
   * Get Holland Code categories and questions
   */
  static async getHollandCodeData(): Promise<{
    categories: { [key: string]: string };
    questions: { [key: string]: string[] };
    description: string | null;
    instructions: string | null;
  } | null> {
    try {
      const template = await this.getAssessmentTemplate('personality');
      if (!template) return null;

      const categories: { [key: string]: string } = {
        'R': 'Realistic',
        'I': 'Investigative',
        'A': 'Artistic',
        'S': 'Social',
        'E': 'Enterprising',
        'C': 'Conventional'
      };

      const questions: { [key: string]: string[] } = {
        'R': [],
        'I': [],
        'A': [],
        'S': [],
        'E': [],
        'C': []
      };

      // Map questions to categories based on sequence numbers
      template.sections.forEach(section => {
        section.questions.forEach(question => {
          const seqNum = question.sequence_number;
          if (seqNum >= 1 && seqNum <= 7) {
            questions['R'].push(question.question_text);
          } else if (seqNum >= 8 && seqNum <= 14) {
            questions['I'].push(question.question_text);
          } else if (seqNum >= 15 && seqNum <= 21) {
            questions['A'].push(question.question_text);
          } else if (seqNum >= 22 && seqNum <= 28) {
            questions['S'].push(question.question_text);
          } else if (seqNum >= 29 && seqNum <= 35) {
            questions['E'].push(question.question_text);
          } else if (seqNum >= 36 && seqNum <= 42) {
            questions['C'].push(question.question_text);
          }
        });
      });

      return {
        categories,
        questions,
        description: template.description,
        instructions: template.instructions
      };
    } catch (error) {
      console.error('Error in getHollandCodeData:', error);
      return null;
    }
  }

  /**
   * Get inspiration assessment data with videos and questions
   */
  static async getInspirationAssessmentData(): Promise<{
    videos: MediaSource[];
    questions: AssessmentQuestion[];
    helpTexts: { [key: string]: string };
  } | null> {
    try {
      const [template, videos] = await Promise.all([
        this.getAssessmentTemplate('inspiration'),
        this.getMediaSources('inspiration')
      ]);

      if (!template) return null;

      // Get questions from the first section
      const questions = template.sections[0]?.questions || [];

      // Create help texts object
      const helpTexts: { [key: string]: string } = {};
      questions.forEach((question, index) => {
        helpTexts[`question${index + 1}`] = question.help_text || '';
      });

      return {
        videos,
        questions,
        helpTexts
      };
    } catch (error) {
      console.error('Error in getInspirationAssessmentData:', error);
      return null;
    }
  }
}
