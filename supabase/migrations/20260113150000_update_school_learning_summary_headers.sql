-- Migration: Update School Learning Summary Headers and Questions
-- This migration updates the title and localized summary questions for the "School Learning" module.

INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('school_learning', 'Summary: My future plan', 
 '{
   "en": {
     "question1": "Subjects I like",
     "question2": "Careers that are possible of the subjects that I like",
     "question3": "Subjects I don''t like",
     "question4": "Careers that are possible if I improve in those subjects which I don''t like",
     "question5": "Things I am good at besides academics at school",
     "question6": "How will improving these skills help me with my career"
   },
   "kn": {
     "question1": "ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು",
     "question2": "ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾದ ವೃತ್ತಿಗಳು",
     "question3": "ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು",
     "question4": "ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾದ ವೃತ್ತಿಗಳು",
     "question5": "ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುತ್ತಿರುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು",
     "question6": "ನಾನು ಈ ಕೌಶಲ್ಯಗಳಲ್ಲಿ ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ."
   },
   "ta": {
     "question1": "நான் விரும்பும் பாடங்கள்",
     "question2": "நான் விரும்பும் பாடங்களின் மூலம் நான் அடையக்கூடிய தொழில்கள்",
     "question3": "நான் விரும்பாத பாடங்கள்",
     "question4": "நான் விரும்பாத பாடங்களில் முன்னேற்றம் பெற்றால் நான் அடையக்கூடிய தொழில்கள்",
     "question5": "பாடப்பிரிவுகளுடன் சேர்த்து, நான் சிறப்பாக சாதனை புரியும் பிற செயல்பாடுகள் / விஷயங்கள்",
     "question6": "இந்த திறன்களில் நான் மேம்பட்டால், என் வேலை / தொழில் தேர்வுக்கு உதவியாக இருக்கும்."
   }
 }'::jsonb)
ON CONFLICT (assessment_type) 
DO UPDATE SET
    title = EXCLUDED.title,
    summary_questions = EXCLUDED.summary_questions,
    updated_at = NOW();

-- Verify data update
DO $$
DECLARE
    school_learning_template_count INTEGER;
    template_data jsonb;
BEGIN
    SELECT COUNT(*) INTO school_learning_template_count
    FROM assessment_summary_templates 
    WHERE assessment_type = 'school_learning';
    
    SELECT summary_questions INTO template_data
    FROM assessment_summary_templates 
    WHERE assessment_type = 'school_learning'
    LIMIT 1;
    
    IF school_learning_template_count = 1 THEN
        RAISE NOTICE '✅ School Learning summary template updated successfully!';
    ELSE
        RAISE NOTICE '⚠️ School Learning summary template count: %', school_learning_template_count;
    END IF;
END $$;
