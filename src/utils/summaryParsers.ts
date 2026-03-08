import { logger } from '@/lib/logger';

/**
 * Utility functions for parsing complex AI JSON summary portfolio strings
 * into structured arrays to be displayed on student and teacher dashboards.
 */

export const parseDreamEntries = (content: string) => {
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            return parsed.map((entry) => ({
                dream: entry?.dream ?? '',
                quality_value_strength: entry?.quality_value_strength ?? '',
                prevent_failure: entry?.prevent_failure ?? '',
                study_path: entry?.study_path ?? ''
            }));
        }
    } catch (error) {
        logger.warn('Failed to parse dream portfolio:', error);
    }
    return [];
};

export const parseHobbiesEntries = (content: string) => {
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            return parsed.map((entry) => ({
                hobby: entry?.hobby ?? '',
                want_career: entry?.want_career ?? '',
                compatible_careers: entry?.compatible_careers ?? '',
                people_examples: entry?.people_examples ?? ''
            }));
        }
    } catch (error) {
        logger.warn('Failed to parse hobbies portfolio:', error);
    }
    return [];
};

export const parseTalentsEntries = (content: string) => {
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            return parsed.map((entry) => ({
                talent: entry?.talent ?? '',
                want_career: entry?.want_career ?? '',
                matching_careers: entry?.matching_careers ?? '',
                people_examples: entry?.people_examples ?? ''
            }));
        }
    } catch (error) {
        logger.warn('Failed to parse talents portfolio:', error);
    }
    return [];
};

export const parseSchoolLearningEntries = (content: string) => {
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            return parsed.map((entry) => ({
                liked_subjects: entry?.liked_subjects ?? '',
                liked_careers: entry?.liked_careers ?? '',
                disliked_subjects: entry?.disliked_subjects ?? '',
                disliked_careers: entry?.disliked_careers ?? '',
                other_activities: entry?.other_activities ?? '',
                skills_improvement: entry?.skills_improvement ?? ''
            }));
        }
    } catch (error) {
        logger.warn('Failed to parse school learning portfolio:', error);
    }
    return [];
};
