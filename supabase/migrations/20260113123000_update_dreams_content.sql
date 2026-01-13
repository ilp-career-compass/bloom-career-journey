-- Migration: Update My Dreams Assessment Content
-- Updates Kannada and Tamil translations for 'dreams_question' and 'dreams_help'.

-- 1. Kannada Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('dreams_question', 'question1', 'kn', 'ನಿಮ್ಮ ಭವಿಷ್ಯದ ಬಗ್ಗೆ ನಿಮ್ಮ ಕನಸು ಏನು?', NOW()),
('dreams_question', 'question2', 'kn', 'ನೀವು ಯಾವ ಶೈಕ್ಷಣಿಕ ಪದವಿಯನ್ನು ಪಡೆಯಲು ಆಸೆಪಡುತ್ತೀರಿ?', NOW()),
('dreams_question', 'question3', 'kn', 'ನೀವು ಯಾವ ವೃತ್ತಿಯನ್ನು ಮಾಡಲು ಕನಸು ಕಾಣುತ್ತೀರಿ?', NOW()),
('dreams_question', 'question4', 'kn', 'ನೀವು ವೃತ್ತಿಪರವಾಗಿ ಆಡಲು ಬಯಸುವ ಕ್ರೀಡೆ ಯಾವುದು?', NOW()),
('dreams_question', 'question5', 'kn', 'ನೀವು ಬರಹಗಾರರಾಗಿದ್ದರೆ, ಯಾವ ಕ್ಷೇತ್ರವನ್ನು ಆಯ್ಕೆ ಮಾಡುತ್ತೀರಿ?', NOW()),
('dreams_question', 'question6', 'kn', 'ನೀವು ಸಂಗೀತದ ಯಾವ ಕ್ಷೇತ್ರದಲ್ಲಿ ಪ್ರಮುಖವಾಗಲು ಬಯಸುತ್ತೀರಿ? (ಹಾಡುಗಾರಿಕೆ / ವಾದ್ಯಗಳು)', NOW()),
('dreams_question', 'question7', 'kn', 'ನೀವು ಆಯ್ಕೆ ಮಾಡಬೇಕೆಂದಿರುವ ಕಾಲೇಜು ಯಾವುದು?', NOW()),
('dreams_question', 'question8', 'kn', 'ನೀವು ಇತರರಿಗೆ ಸೇವೆ ಸಲ್ಲಿಸಲು ನಿಮ್ಮ ಶ್ರಮವನ್ನು ಸಮರ್ಪಿಸಬೇಕಾದರೆ, ಯಾರಿಗೆ ಅಥವಾ ಯಾವುದಕ್ಕೆ ಸೇವೆ ಮಾಡುತ್ತೀರಿ?', NOW()),
('dreams_question', 'question9', 'kn', 'ನಿಮಗೆ ಜಗತ್ತಿನ ಯಾವ ಸ್ಥಳದಲ್ಲಿ ವಾಸಿಸಲು ಅವಕಾಶ ಸಿಕ್ಕರೆ, ಎಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?', NOW()),
('dreams_question', 'question10', 'kn', 'ನೀವು ಕಲಾವಿದರಾಗಿದ್ದರೆ, ಯಾವ ರೀತಿಯ ಕಲೆ ಅನುಸರಿಸುತ್ತೀರಿ?', NOW()),
('dreams_question', 'question11', 'kn', 'ನಿಮಗೆ ಪ್ರವಾಸ ಮಾಡುವ ಆಸಕ್ತಿ ಇದೆಯೇ? ಹೌದಾದರೆ, ಯಾವುದು ನಿಮಗೆ ಹೆಚ್ಚು ಇಷ್ಟ?', NOW()),
('dreams_question', 'question12', 'kn', 'ನೀವು ಒಂದು ದಿನ ವೃತ್ತಿಪರ ವ್ಯಕ್ತಿಯಿಂದ ಕಲಿಯುವ ಅವಕಾಶ ದೊರೆತರೆ, ಯಾರು ಮತ್ತು ಏಕೆ?', NOW()),
('dreams_question', 'question13', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ನೀವು ಬಯಸುತ್ತೀರಾ?', NOW()),
('dreams_question', 'question14', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳನ್ನು ನನಸಾಗಿಸಲು ಯಾವ ಅಂಶಗಳು ಅಗತ್ಯ?', NOW()),
('dreams_question', 'question15', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳಿಗಾಗಿ ನೀವು ಮೊದಲಿಗೆ ಏನು ಮಾಡುತ್ತೀರಿ?', NOW()),
('dreams_question', 'question16', 'kn', 'ನಿಮ್ಮಲ್ಲಿ ಆತ್ಮವಿಶ್ವಾಸ ಮತ್ತು ಪ್ರೇರಣೆ ಇದೆಯೇ?', NOW()),
('dreams_question', 'question17', 'kn', 'ನಿಮ್ಮ ಕನಸುಗಳ ಮಾರ್ಗದಲ್ಲಿ ಯಾವ ಅಡಚಣೆಗಳು ಬರಬಹುದು?', NOW()),
('dreams_question', 'question18', 'kn', 'ಶಾಲಾ ಶಿಕ್ಷಣವು ನಿಮ್ಮ ಕನಸುಗಳಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆಯೇ? ಹೇಗೆ?', NOW())

ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET 
    text = EXCLUDED.text,
    updated_at = NOW();

-- 2. Tamil Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('dreams_question', 'question1', 'ta', 'உங்கள் எதிர்காலத்தைப் பற்றி உங்கள் கனவு என்ன?', NOW()),
('dreams_question', 'question2', 'ta', 'நீங்கள் எந்த கல்விப் பட்டப்படிப்பை படிக்க விரும்புகிறீர்கள்?', NOW()),
('dreams_question', 'question3', 'ta', 'நீங்கள் எந்த தொழிலை செய்ய கனவு காண்கிறீர்கள்?', NOW()),
('dreams_question', 'question4', 'ta', 'நீங்கள் தொழில்முறையாக விளையாட விரும்பும் விளையாட்டு எது?', NOW()),
('dreams_question', 'question5', 'ta', 'நீங்கள் எழுத்தாளராக இருந்தால் எந்த துறையைத் தேர்வு செய்வீர்கள்?', NOW()),
('dreams_question', 'question6', 'ta', 'நீங்கள் இசையின் எந்த துறையில் சிறப்பு பெற விரும்புகிறீர்கள்?', NOW()),
('dreams_question', 'question7', 'ta', 'நீங்கள் தேர்வு செய்ய விரும்பும் கல்லூரி எது?', NOW()),
('dreams_question', 'question8', 'ta', 'நீங்கள் சேவை செய்ய விரும்பினால் யாருக்கு அல்லது எதற்கு செய்வீர்கள்?', NOW()),
('dreams_question', 'question9', 'ta', 'உலகில் எங்கு வேண்டுமானாலும்  வாழ வாய்ப்பு கிடைத்தால், எங்கு வாழ விரும்புவீர்கள்?', NOW()),
('dreams_question', 'question10', 'ta', 'நீங்கள் கலைஞராக இருந்தால் எந்த வகை கலையை தேர்வு செய்வீர்கள்?', NOW()),
('dreams_question', 'question11', 'ta', 'உங்களுக்கு பயணம் செய்ய பிடிக்குமா? அதில் எது பிடிக்கும்?', NOW()),
('dreams_question', 'question12', 'ta', 'ஒரு நாள் ஒரு தொழில்முறை நபரிடமிருந்து கற்றுக்கொள்ள வாய்ப்பு கிடைத்தால், அவர் யார்? ஏன்?', NOW()),
('dreams_question', 'question13', 'ta', 'உங்கள் கனவுகளை நிஜமாக்க விரும்புகிறீர்களா?', NOW()),
('dreams_question', 'question14', 'ta', 'உங்கள் கனவுகளை நனவாக்க என்ன தேவை?', NOW()),
('dreams_question', 'question15', 'ta', 'உங்கள் கனவுக்காக முதல் முயற்சி என்ன?', NOW()),
('dreams_question', 'question16', 'ta', 'உங்களிடம் தன்னம்பிக்கை மற்றும் ஊக்கம் உள்ளதா?', NOW()),
('dreams_question', 'question17', 'ta', 'உங்கள் கனவு பாதையில் என்ன சவால்கள் வரலாம்?', NOW()),
('dreams_question', 'question18', 'ta', 'பள்ளி கல்வி உங்கள் கனவுக்கு உதவுமா? எப்படி?', NOW())

ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET 
    text = EXCLUDED.text,
    updated_at = NOW();

-- 3. Tamil Help Text
INSERT INTO content_translations (resource_type, resource_key, lang, text, updated_at) VALUES
('dreams_help', 'question1', 'ta', 'நீங்கள் எதிர்காலத்தில் என்ன ஆக விரும்புகிறீர்கள்?', NOW()),
('dreams_help', 'question2', 'ta', 'நீங்கள் படிக்க விரும்பும் பட்டப்படிப்பு என்ன?', NOW()),
('dreams_help', 'question3', 'ta', 'நீங்கள் செய்ய விரும்பும் வேலை என்ன?', NOW()),
('dreams_help', 'question4', 'ta', 'நீங்கள் எந்த விளையாட்டில் ஆர்வம் உள்ளவர்?', NOW()),
('dreams_help', 'question5', 'ta', 'கதை, கவிதை, கட்டுரை போன்றவற்றில் ஒன்றை எழுதுங்கள்.', NOW()),
('dreams_help', 'question6', 'ta', 'பாடகரா அல்லது இசையமைப்பாளரா என்று எழுதுங்கள்.', NOW()),
('dreams_help', 'question7', 'ta', 'தெரிந்தால் கல்லூரி பெயரை எழுதுங்கள்.', NOW()),
('dreams_help', 'question8', 'ta', 'மக்கள், ஏழைகள், நாடு, விலங்குகள்', NOW()),
('dreams_help', 'question9', 'ta', 'நாடு அல்லது நகரத்தின் பெயரை எழுதுங்கள்.', NOW()),
('dreams_help', 'question10', 'ta', 'ஓவியம், நடனம் போன்றவற்றை எழுதுங்கள்', NOW()),
('dreams_help', 'question11', 'ta', 'இடங்கள், இயற்கை, உணவு என்று எழுதலாம்.', NOW()),
('dreams_help', 'question12', 'ta', 'ஆசிரியர், மருத்துவர், பொறியாளர், விஞ்ஞானி.', NOW()),
('dreams_help', 'question13', 'ta', 'ஆம் அல்லது இல்லை என்று எழுதுங்கள்.', NOW()),
('dreams_help', 'question14', 'ta', 'உழைப்பு, நேரம், பயிற்சி.', NOW()),
('dreams_help', 'question15', 'ta', 'நன்றாக படித்தல், பயிற்சி செய்தல்.', NOW()),
('dreams_help', 'question16', 'ta', 'நேர்மையாக பதில் எழுதுங்கள்.', NOW()),
('dreams_help', 'question17', 'ta', 'பணம், பயம், மதிப்பெண்கள்.', NOW()),
('dreams_help', 'question18', 'ta', 'பாடங்கள் அறிவும் திறனும் தரும்.', NOW())

ON CONFLICT (resource_type, resource_key, lang) 
DO UPDATE SET 
    text = EXCLUDED.text,
    updated_at = NOW();
