-- Migration: Update Role Models Summary Template
-- Updates title and localized questions for English, Kannada, and Tamil

UPDATE assessment_summary_templates
SET
    title = 'Summary: My future plan',
    summary_questions = '{
        "en": { 
            "question1": "Write 5 to 10 questions you would like to ask your role model for career guidance." 
        },
        "kn": { 
            "question1": "ನಿಮ್ಮ ಆದರ್ಶ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ನಿಮ್ಮ ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ನೀವು ಕೇಳಲು ಬಯಸುವ 5 ರಿಂದ 10 ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ." 
        },
        "ta": { 
            "question1": "உங்கள் முன்மாதிரி நபரிடம் உங்கள் தொழில் வழிகாட்டலுக்காக நீங்கள் கேட்க விரும்பும் 5 முதல் 10 கேள்விகளை எழுதுங்கள்." 
        }
    }'::jsonb,
    updated_at = NOW()
WHERE assessment_type = 'role_models';
