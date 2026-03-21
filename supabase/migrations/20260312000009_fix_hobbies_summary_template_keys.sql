-- ============================================================
-- Fix hobbies summary_questions JSONB key numbering
-- Service expects question1-10 (headers at 1,6; columns at 2-5,7-10)
-- Migration had question1-8 (sequential, no gaps)
-- ============================================================

BEGIN;

UPDATE assessment_summary_templates
SET summary_questions = $${
  "en": {
    "question1": "Hobbies",
    "question2": "Hobbies",
    "question3": "I would like to turn this hobby into a career",
    "question4": "Careers that match with these hobbies",
    "question5": "People known to me who have turned their hobbies into careers",
    "question6": "Talents",
    "question7": "Talents",
    "question8": "I would like to turn this talent into a career.",
    "question9": "Careers that match your talents",
    "question10": "People known to me who have turned their talents into careers."
  },
  "kn": {
    "question1": "ಹವ್ಯಾಸಗಳು",
    "question2": "ಹವ್ಯಾಸಗಳು",
    "question3": "ನನ್ನ ಈ ಹವ್ಯಾಸವನ್ನು ವೃತ್ತಿಯಾಗಿ ರೂಪಿಸಿಕೊಳ್ಳಲು ನಾನು ಬಯಸುತ್ತೇನೆ.",
    "question4": "ಈ ಹವ್ಯಾಸಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು",
    "question5": "ತಮ್ಮ ಹವ್ಯಾಸಗಳನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನಿಮಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು",
    "question6": "ಪ್ರತಿಭೆಗಳು",
    "question7": "ಪ್ರತಿಭೆಗಳು",
    "question8": "ನಾನು ಈ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಯಾಗಿ ರೂಪಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೇನೆ.",
    "question9": "ಪ್ರತಿಭೆಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗಬಲ್ಲ ವೃತ್ತಿಗಳು",
    "question10": "ತಮ್ಮ ಪ್ರತಿಭೆಯನ್ನು ವೃತ್ತಿಗಳನ್ನಾಗಿ ಮಾಡಿಕೊಂಡಿರುವ ನನಗೆ ಪರಿಚಿತವಿರುವ ವ್ಯಕ್ತಿಗಳು"
  },
  "ta": {
    "question1": "பொழுதுபோக்குகள்",
    "question2": "பொழுதுபோக்குகள்",
    "question3": "இந்தப் பொழுதுபோக்கை ஒரு தொழிலாக மாற்ற நான் விரும்புகிறேன்.",
    "question4": "இந்தப் பொழுதுபோக்குகளுக்கு ஏற்ற தொழில்கள்.",
    "question5": "தங்களது பொழுதுபோக்கை தொழிலாக மாற்றிக்கொண்ட எனக்குத் தெரிந்த நபர்கள்.",
    "question6": "திறமைகள்",
    "question7": "திறமைகள்",
    "question8": "இந்தத் திறமையை ஒரு தொழிலாக மாற்ற நான் விரும்புகிறேன்.",
    "question9": "இந்தத் திறமைகளுக்கு ஏற்ற தொழில்கள்",
    "question10": "தங்களது திறமையை தொழிலாக மாற்றிக்கொண்ட எனக்குத் தெரிந்த நபர்கள்"
  },
  "hi": {
    "question1": "शौक",
    "question2": "शौक",
    "question3": "मैं इस शौक को करियर में बदलना चाहता हूँ",
    "question4": "इन शौकों के साथ मेल खाने वाले करियर",
    "question5": "ऐसे लोग जिन्हें मैं जानता हूँ जिन्होंने अपने शौक को करियर बनाया है",
    "question6": "प्रतिभा",
    "question7": "प्रतिभा",
    "question8": "मैं इस प्रतिभा को करियर में बदलना चाहता हूँ",
    "question9": "मैं अपनी प्रतिभा को करियर में बदलना चाहता हूँ",
    "question10": "ऐसे लोग जिन्हें मैं जानता हूँ जिन्होंने अपनी प्रतिभा को करियर बनाया है"
  }
}$$::jsonb
WHERE assessment_type = 'hobbies';

COMMIT;
