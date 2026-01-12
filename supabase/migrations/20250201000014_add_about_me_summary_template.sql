-- Migration: Add About Me AI Summary Template
-- This migration adds the AI summary template for "About Me" assessment

-- Insert About Me summary template into assessment_summary_templates
INSERT INTO assessment_summary_templates (assessment_type, title, summary_questions) VALUES
('about_me', 'Summary: About Me', 
 '{
    "en": {
      "question1": "Who is the friend in my family? (Summarize based on student response)",
      "question2": "Who are my friends outside my family?",
      "question3": "What activities do I do daily at home?",
      "question4": "Which activities/aspects do I enjoy during school hours?",
      "question5": "Which activities/aspects do I enjoy outside of school?",
      "question6": "What work/activities do I enjoy personally?",
      "question7": "What work/activities do I enjoy doing as a team?",
      "question8": "Which school activity do I find difficult even though I must do it?",
      "question9": "Which activity do I find difficult to manage after school or outside school?",
      "question10": "What activities must I do (jobs I dont like but have to)?",
      "question11": "Which activities come naturally to me (easy to do)?",
      "question12": "Which activities are not easy for me to do (dont come naturally)?",
      "question13": "What qualities do I like about myself?",
      "question14": "What qualities do others like in me?",
      "question15": "Which qualities or aspects do I need to improve?",
      "question16": "Prepare a personal profile or your own self-portrait. Summarize the points you wrote about yourself above in one or a few words."
    },
    "kn": {
      "question1": "ನನ್ನ ಕುಟುಂಬದಲ್ಲಿರುವ ಸ್ನೇಹಿತ ಯಾರು?",
      "question2": "ನನ್ನ ಕುಟುಂಬದ ಹೊರಗಿನ ನನ್ನ ಸ್ನೇಹಿತ ಯಾರು?",
      "question3": "ನಾನು ಮನೆಯಲ್ಲಿ ಪ್ರತಿದಿನ ಯಾವ ಚಟುವಟಿಕೆಗಳನ್ನು ಮಾಡುತ್ತೇನೆ?",
      "question4": "ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಯಾವ ಚಟುವಟಿಕೆಗಳು/ಅಂಶಗಳನ್ನು ಆನಂದಿಸುತ್ತೇನೆ?",
      "question5": "ಶಾಲೆಯ ಹೊರಗೆ ನಾನು ಯಾವ ಚಟುವಟಿಕೆಗಳು/ಅಂಶಗಳನ್ನು ಆನಂದಿಸುತ್ತೇನೆ?",
      "question6": "ನಾನು ವೈಯಕ್ತಿಕವಾಗಿ ಯಾವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳನ್ನು ಆನಂದಿಸುತ್ತೇನೆ?",
      "question7": "ನಾನು ತಂಡವಾಗಿ ಯಾವ ಕೆಲಸ/ಚಟುವಟಿಕೆಗಳನ್ನು ಆನಂದಿಸುತ್ತೇನೆ?",
      "question8": "ಶಾಲೆಯಲ್ಲಿ ಮಾಡಬೇಕಾದ, ಆದರೆ ನನಗೆ ಕಷ್ಟಕರವಾದ ಚಟುವಟಿಕೆ ಯಾವುದು?",
      "question9": "ಶಾಲೆಯ ನಂತರ ಅಥವಾ ಹೊರಗೆ ನಿರ್ವಹಿಸಲು ನನಗೆ ಕಷ್ಟಕರವಾದ ಚಟುವಟಿಕೆ ಯಾವುದು?",
      "question10": "ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು (ಇಷ್ಟವಿಲ್ಲದಿದ್ದರೂ)?",
      "question11": "ನನಗೆ ಸ್ವಾಭಾವಿಕವಾಗಿ/ಸುಲಭವಾಗಿ ಬರುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?",
      "question12": "ನನಗೆ ಮಾಡಲು ಸುಲಭವಲ್ಲದ (ಸ್ವಾಭಾವಿಕವಾಗಿ ಬಾರದ) ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?",
      "question13": "ನನ್ನಲ್ಲಿ ನನಗೆ ಇಷ್ಟವಾಗುವ ಗುಣಗಳು ಯಾವುವು?",
      "question14": "ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು ಯಾವುವು?",
      "question15": "ನಾನು ಯಾವ ಗುಣಗಳು ಅಥವಾ ಅಂಶಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕು?",
      "question16": "ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಪರಿಚಯ ಅಥವಾ ಸ್ವಯಂ-ಚಿತ್ರಣವನ್ನು ತಯಾರಿಸಿ. ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಬರೆದ ಅಂಶಗಳನ್ನು ಒಂದೆರಡು ಪದಗಳಲ್ಲಿ ಸಾರಾಂಶಿಸಿ."
    },
    "ta": {
      "question1": "என் குடும்பத்தில் உள்ள நண்பர் யார்?",
      "question2": "என் குடும்பத்திற்கு வெளியே உள்ள நண்பர்கள் யார்?",
      "question3": "நான் வீட்டில் தினமும் என்ன வேலைகளை செய்கிறேன்?",
      "question4": "பள்ளி நேரத்தில் நான் விரும்பி செய்யும் செயல்கள் எவை?",
      "question5": "பள்ளிக்கு வெளியே நான் விரும்பி செய்யும் செயல்கள் எவை?",
      "question6": "நான் தனிப்பட்ட முறையில் விரும்பி செய்யும் வேலைகள்/செயல்கள் எவை?",
      "question7": "நான் ஒரு குழுவாக செய்ய விரும்பும் வேலைகள்/செயல்கள் எவை?",
      "question8": "நான் செய்ய வேண்டியிருந்தாலும், பள்ளியில் எனக்கு கடினமாக இருக்கும் செயல் எது?",
      "question9": "பள்ளிக்கு பிறகு அல்லது வெளியே நிர்வகிக்க கடினமாக இருக்கும் செயல் எது?",
      "question10": "நான் கண்டிப்பாக செய்ய வேண்டிய வேலைகள் எவை (பிடிக்காவிட்டாலும்)?",
      "question11": "எனக்கு இயல்பாகவே (எளிதாக) வரும் செயல்கள் எவை?",
      "question12": "எனக்கு செய்ய எளிதாக இல்லாத (இயல்பாக வராத) செயல்கள் எவை?",
      "question13": "என்னிடம் எனக்கு பிடித்த குணங்கள் எவை?",
      "question14": "மற்றவர்கள் என்னிடம் விரும்பும் குணங்கள் எவை?",
      "question15": "நான் மேம்படுத்திக்கொள்ள வேண்டிய குணங்கள் அல்லது அம்சங்கள் எவை?",
      "question16": "உங்கள் தனிப்பட்ட சுயவிவரம் அல்லது சுய சித்திரத்தை தயார் செய்யுங்கள். உங்களைப் பற்றி நீங்கள் எழுதிய கருத்துக்களை ஓரிரு வார்த்தைகளில் சுருக்கமாக எழுதுங்கள்."
    }
  }'::jsonb)
ON CONFLICT (assessment_type) 
DO UPDATE SET
    title = EXCLUDED.title,
    summary_questions = EXCLUDED.summary_questions,
    updated_at = NOW();

-- Verify insertion
DO $$
DECLARE
    template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count 
    FROM assessment_summary_templates 
    WHERE assessment_type = 'about_me';
    
    RAISE NOTICE 'About Me Summary Template Update Complete:';
    RAISE NOTICE 'Templates found: %', template_count;
    
    IF template_count = 1 THEN
        RAISE NOTICE '✅ About Me summary template inserted successfully!';
    ELSE
        RAISE WARNING '⚠️ Expected 1 template, found %', template_count;
    END IF;
END $$;

