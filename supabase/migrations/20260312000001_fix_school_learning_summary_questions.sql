-- Phase 0A: Fix corrupted question1 values in school_learning
-- summary questions. question1 had "English"/"Kannada"/"Tamil"
-- as values (column header text inserted instead of cell content).
-- questions 2-8 included in full replacement but values unchanged.
-- One-time exception to "never update English" rule — corrupted data.
-- ⚠️ UNICODE REMINDER: dollar-quoting for ALL kn/ta strings

BEGIN;

UPDATE assessment_summary_templates
SET summary_questions = jsonb_build_object(
  'en', jsonb_build_object(
    'question1', 'Summary: My future plan',
    'question2', 'Subjects I like',
    'question3', 'Careers I can pursue based on the subjects I like',
    'question4', 'Subjects I do not like',
    'question5', 'Careers I can pursue if I make progress in the subjects I do not like',
    'question6', 'Other activities I perform well in',
    'question7', 'If I improve these skills, it will help me in choosing my job / career.',
    'question8', 'Note: You have the opportunity to choose your career based on your areas of interest. At the end of this book, on the page titled "My Areas of Interest," record which lessons you would like to learn in the coming days, which subjects/lessons you like, and why you like them. This will help you understand the careers related to these subjects, how the lessons learned here are useful in different professions/fields, and support you in making future career decisions.'
  ),
  'kn', jsonb_build_object(
    'question1', $$ಸಾರಾಂಶ: ನನ್ನ ಮುಂದಿನ ಯೋಜನೆ$$,
    'question2', $$ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳು$$,
    'question3', $$ನಾನು ಇಷ್ಟಪಡುವ ವಿಷಯಗಳಿಂದ ನಾನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು$$,
    'question4', $$ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು$$,
    'question5', $$ಇಷ್ಟಪಡದ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಬಹುದಾದ ವೃತ್ತಿಗಳು$$,
    'question6', $$ಪಠ್ಯ ವಿಷಯಗಳ ಜೊತೆಗೆ, ನಾನು ಉತ್ತಮ ಸಾಧನೆ ಮಾಡುವ ಇತರ ಚಟುವಟಿಕೆಗಳು / ವಿಷಯಗಳು$$,
    'question7', $$ನಾನು ಈ ಕೌಶಲ್ಯಗಳನ್ನು ಸುಧಾರಿಸಿಕೊಂಡರೆ ನನ್ನ ಕೆಲಸ / ವೃತ್ತಿಯ ಆಯ್ಕೆಗೆ ಸಹಾಯವಾಗುತ್ತದೆ.$$,
    'question8', $$ಸೂಚನೆ: ಪ್ರತಿ ಆಸಕ್ತಿಯ ವಿಷಯಗಳ ಆಧಾರದ ಮೇಲು ವೃತ್ತಿ ಆಯ್ಕೆ ಮಾಡಿಕೊಳ್ಳುವ ಅವಕಾಶವಿದ್ದು, ಈ ಪುಸ್ತಕದ ಕೊನೆಯಲ್ಲಿ "ನನ್ನ ಆಸಕ್ತಿಯ ವಿಷಯಗಳು" ಎಂಬ ಪುಟದಲ್ಲಿ ನೀಡಿರುವ ಸ್ಥಳದಲ್ಲಿ ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ ಯಾವುದೇ ಪಾಠವನ್ನು ಕಲಿಯುವಾಗ ನಿಮಗೆ ಇಷ್ಟವಾಗುವ ವಿಷಯ, ಪಾಠ ಮತ್ತು ಏಕೆ ಅಥವಾ ಯಾವ ಅಂಶಗಳು ಇಷ್ಟವಾಗಲು ಕಾರಣವಾಯಿತು ಈ ಎಲ್ಲಾ ಅಂಶಗಳನ್ನು ದಾಖಲಿಸಿ. ಇದು ವಿಷಯಕ್ಕೆ ಅನುಗುಣವಾಗಿರುವ ವೃತ್ತಿಗಳು, ಇಲ್ಲಿ ಕಲಿತ ಪಠ್ಯ ವಿಷಯ ಯಾವ ವೃತ್ತಿ/ವಲಯದಲ್ಲಿ ಉಪಯುಕ್ತವಾಗುವುದು ಎಂಬುದನ್ನು ಅರ್ಥೈಸಿಕೊಳ್ಳಲು ಮತ್ತು ಮುಂದಿನ ವೃತ್ತಿ ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳಲು ಸಹಾಯವಾಗುತ್ತದೆ.$$
  ),
  'ta', jsonb_build_object(
    'question1', $$சுருக்கம்: என் எதிர்கால திட்டம்$$,
    'question2', $$எனக்கு பிடித்த பாடங்கள்$$,
    'question3', $$விருப்பமான பாடங்கள் மூலம் நான் அடையக்கூடிய தொழில்கள்$$,
    'question4', $$எனக்கு பிடிக்காத பாடங்கள்$$,
    'question5', $$விருப்பமில்லாத பாடங்களில் முன்னேறினால் நான் அடையக்கூடிய தொழில்கள்$$,
    'question6', $$நான் சிறப்பாகச் செய்யும் பிற செயல்பாடுகள்$$,
    'question7', $$நான் மேம்படுத்த வேண்டிய திறன்கள்$$,
    'question8', $$குறிப்பு: ஒவ்வொரு ஆர்வப் பாடத்தையும் அடிப்படையாகக் கொண்டு, உங்கள் தொழில் தேர்வைச் செய்யும் வாய்ப்பு உள்ளது. இந்தப் புத்தகத்தின் இறுதியில் "என் ஆர்வப் பாடங்கள்" என்ற பக்கத்தில் கொடுக்கப்பட்ட இடத்தில், எதிர்காலத்தில் நீங்கள் எந்த பாடங்களை கற்றுக்கொள்ள விரும்புகிறீர்கள், எந்த விஷயங்கள்/பாடங்கள் உங்களுக்கு ஏன் பிடிக்கின்றன என்பவற்றை பதிவு செய்யுங்கள். இதனால் பாடங்களுக்கு ஏற்ற தொழில்கள், இங்கு கற்ற பாடப்பிரிவுகள் எந்த தொழில்/துறையில் பயன்படும் என்பதையும் புரிந்து கொண்டு, எதிர்கால தொழில் முடிவுகளை எடுக்க உதவும்.$$
  )
)
WHERE assessment_type = 'school_learning';

COMMIT;
