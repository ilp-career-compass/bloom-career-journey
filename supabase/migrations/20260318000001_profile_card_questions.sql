-- ============================================================
-- Profile Card Questions — content_translations migration
-- Source: Google Sheet tab "Profile Card Questions - Grade"
-- Skips Holland Code section (personality) — to be added later
-- ============================================================

BEGIN;

-- ============================================================
-- My Inspiration (3 questions + title)
-- ============================================================

INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('profile_card_inspiration', 'title', 'en', 'My Inspiration'),
('profile_card_inspiration', 'title', 'kn', $$ನನ್ನ ಪ್ರೇರಣೆ$$),
('profile_card_inspiration', 'title', 'ta', $$எனது உத்வேகம்$$),
('profile_card_inspiration', 'title', 'hi', $$मेरी प्रेरणा$$),

('profile_card_inspiration', 'question1', 'en', 'Qualities/values that inspire me'),
('profile_card_inspiration', 'question1', 'kn', $$ನನಗೆ ಸ್ಫೂರ್ತಿ ನೀಡುವ ಗುಣಗಳು/ಮೌಲ್ಯಗಳು$$),
('profile_card_inspiration', 'question1', 'ta', $$என்னை ஊக்கப்படுத்தும் குணங்கள்/மதிப்புகள்$$),
('profile_card_inspiration', 'question1', 'hi', $$मुझे प्रेरित करने वाले गुण/मूल्य$$),

('profile_card_inspiration', 'question2', 'en', 'Qualities/values I already possess'),
('profile_card_inspiration', 'question2', 'kn', $$ನಾನು ಈಗಾಗಲೇ ಹೊಂದಿರುವ ಗುಣಗಳು/ಮೌಲ್ಯಗಳು$$),
('profile_card_inspiration', 'question2', 'ta', $$என்னிடம் ஏற்கனவே உள்ள குணங்கள்/மதிப்புகள்$$),
('profile_card_inspiration', 'question2', 'hi', $$गुण/मूल्य जो मेरे पास पहले से हैं$$),

('profile_card_inspiration', 'question3', 'en', 'Qualities/values I can adopt'),
('profile_card_inspiration', 'question3', 'kn', $$ನಾನು ಅಳವಡಿಸಿಕೊಳ್ಳಬಹುದಾದ ಗುಣಗಳು/ಮೌಲ್ಯಗಳು$$),
('profile_card_inspiration', 'question3', 'ta', $$நான் வளர்த்துக்கொள்ளக்கூடிய குணங்கள்/மதிப்புகள்$$),
('profile_card_inspiration', 'question3', 'hi', $$गुण/मूल्य जिन्हें मैं अपना सकता हूँ$$)

ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- ============================================================
-- About Me (5 questions + title)
-- ============================================================

INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('profile_card_about_me', 'title', 'en', 'About Me'),
('profile_card_about_me', 'title', 'kn', $$ನನ್ನ ಬಗ್ಗೆ$$),
('profile_card_about_me', 'title', 'ta', $$என்னைப்பற்றி$$),
('profile_card_about_me', 'title', 'hi', $$मेरे बारे में$$),

('profile_card_about_me', 'question1', 'en', 'My friends (inside and outside my family)'),
('profile_card_about_me', 'question1', 'kn', $$ನನ್ನ ಸ್ನೇಹಿತರು (ನನ್ನ ಕುಟುಂಬ ಮತ್ತು ಕುಟುಂಬದ ಹೊರಗೆ)$$),
('profile_card_about_me', 'question1', 'ta', $$எனது நண்பர்கள் (எனது குடும்பத்திற்கு உள்ளேயும் வெளியேயும்)$$),
('profile_card_about_me', 'question1', 'hi', $$मेरे मित्र (मेरे परिवार के अंदर और बाहर)$$),

('profile_card_about_me', 'question2', 'en', 'Subjects/things that are difficult for me'),
('profile_card_about_me', 'question2', 'kn', $$ನನಗೆ ಕಷ್ಟಕರವಾದ ವಿಷಯಗಳು$$),
('profile_card_about_me', 'question2', 'ta', $$எனக்கு கடினமாக இருக்கும் பாடங்கள்/விஷயங்கள்$$),
('profile_card_about_me', 'question2', 'hi', $$विषय/चीजें जो मेरे लिए कठिन हैं$$),

('profile_card_about_me', 'question3', 'en', 'Activities I can do naturally'),
('profile_card_about_me', 'question3', 'kn', $$ನನಗೆ ಸ್ವಾಭಾವಿಕವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು$$),
('profile_card_about_me', 'question3', 'ta', $$நான் இயல்பாகவே செய்யக்கூடிய செயல்பாடுகள்$$),
('profile_card_about_me', 'question3', 'hi', $$गतिविधियाँ जो मैं स्वाभाविक रूप से कर सकता हूँ$$),

('profile_card_about_me', 'question4', 'en', 'Qualities I possess'),
('profile_card_about_me', 'question4', 'kn', $$ನನ್ನಲ್ಲಿರುವ ಗುಣಗಳು$$),
('profile_card_about_me', 'question4', 'ta', $$என்னிடம் உள்ள குணங்கள்$$),
('profile_card_about_me', 'question4', 'hi', $$मुझमें मौजूद गुण$$),

('profile_card_about_me', 'question5', 'en', 'Qualities that need improvement'),
('profile_card_about_me', 'question5', 'kn', $$ಸುಧಾರಿಸಬೇಕಾದ ಗುಣಗಳು$$),
('profile_card_about_me', 'question5', 'ta', $$மேம்படுத்தப்பட வேண்டிய குணங்கள்$$),
('profile_card_about_me', 'question5', 'hi', $$गुण जिनमें सुधार की आवश्यकता है$$)

ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- ============================================================
-- My Dreams (3 questions + title)
-- ============================================================

INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('profile_card_dreams', 'title', 'en', 'My Dreams'),
('profile_card_dreams', 'title', 'kn', $$ನನ್ನ ಕನಸುಗಳು$$),
('profile_card_dreams', 'title', 'ta', $$எனது கனவுகள்$$),
('profile_card_dreams', 'title', 'hi', $$मेरे सपने$$),

('profile_card_dreams', 'question1', 'en', 'Qualities & values that help me make this dream come true'),
('profile_card_dreams', 'question1', 'kn', $$ಈ ಕನಸನ್ನು ನನಸಾಗಿಸಲು ನನಗೆ ಸಹಾಯ ಮಾಡುವ ಗುಣಗಳು & ಮೌಲ್ಯಗಳು$$),
('profile_card_dreams', 'question1', 'ta', $$இந்த கனவை நனவாக்க எனக்கு உதவும் குணங்கள் மற்றும் மதிப்புகள்$$),
('profile_card_dreams', 'question1', 'hi', $$इस सपने को साकार करने में मदद करने वाले गुण और मूल्य$$),

('profile_card_dreams', 'question2', 'en', 'What I need to improve so this dream does not fail'),
('profile_card_dreams', 'question2', 'kn', $$ಈ ಕನಸು ವಿಫಲವಾಗದಂತೆ ನಾನು ಏನು ಸುಧಾರಿಸಬೇಕು$$),
('profile_card_dreams', 'question2', 'ta', $$இந்த கனவு தோல்வியடையாமல் இருக்க நான் எதை மேம்படுத்த வேண்டும்$$),
('profile_card_dreams', 'question2', 'hi', $$इस सपने को विफल होने से बचाने के लिए मुझे क्या सुधारना चाहिए$$),

('profile_card_dreams', 'question3', 'en', 'What should I study after 10th grade to realize this dream?'),
('profile_card_dreams', 'question3', 'kn', $$ಈ ಕನಸನ್ನು ನನಸಾಗಿಸಲು 10 ನೇ ತರಗತಿಯ ನಂತರ ನಾನು ಏನು ಓದಬೇಕು?$$),
('profile_card_dreams', 'question3', 'ta', $$இந்த கனவை நனவாக்க 10 ஆம் வகுப்புக்குப் பிறகு நான் என்ன படிக்க வேண்டும்?$$),
('profile_card_dreams', 'question3', 'hi', $$इस सपने को साकार करने के लिए मुझे 10वीं के बाद क्या पढ़ना चाहिए?$$)

ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- ============================================================
-- My School, My Learning and I (4 questions + title)
-- ============================================================

INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('profile_card_school_learning', 'title', 'en', 'My School, My Learning and I'),
('profile_card_school_learning', 'title', 'kn', $$ನಾನು, ನನ್ನ ಶಾಲೆ, ನನ್ನ ಕಲಿಕೆ$$),
('profile_card_school_learning', 'title', 'ta', $$நானும், என் பள்ளியும், என் கற்றலும்$$),
('profile_card_school_learning', 'title', 'hi', $$मैं, मेरा स्कूल, मेरी सीख$$),

('profile_card_school_learning', 'question1', 'en', 'Subjects I am interested in'),
('profile_card_school_learning', 'question1', 'kn', $$ನನಗೆ ಆಸಕ್ತಿಯಿರುವ ವಿಷಯಗಳು$$),
('profile_card_school_learning', 'question1', 'ta', $$எனக்கு ஆர்வமுள்ள பாடங்கள்$$),
('profile_card_school_learning', 'question1', 'hi', $$जिन विषयों में मेरी रुचि है$$),

('profile_card_school_learning', 'question2', 'en', 'Subjects I do not like'),
('profile_card_school_learning', 'question2', 'kn', $$ನಾನು ಇಷ್ಟಪಡದ ವಿಷಯಗಳು$$),
('profile_card_school_learning', 'question2', 'ta', $$எனக்கு பிடிக்காத பாடங்கள்$$),
('profile_card_school_learning', 'question2', 'hi', $$जिन विषयों को मैं पसंद नहीं करता$$),

('profile_card_school_learning', 'question3', 'en', 'Things I am good at, excluding academic subjects'),
('profile_card_school_learning', 'question3', 'kn', $$ಶೈಕ್ಷಣಿಕ ವಿಷಯಗಳನ್ನು ಹೊರತುಪಡಿಸಿ ನಾನು ಉತ್ತಮವಾಗಿರುವ ವಿಷಯಗಳು$$),
('profile_card_school_learning', 'question3', 'ta', $$கல்விப் பாடங்களைத் தவிர நான் சிறந்து விளங்கும் விஷயங்கள்$$),
('profile_card_school_learning', 'question3', 'hi', $$शैक्षणिक विषयों के अलावा वे चीजें जिनमें मैं अच्छा हूँ$$),

('profile_card_school_learning', 'question4', 'en', 'Subjects and skills I need to improve for my professional life'),
('profile_card_school_learning', 'question4', 'kn', $$ನನ್ನ ವೃತ್ತಿ ಜೀವನಕ್ಕಾಗಿ ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ವಿಷಯಗಳು ಮತ್ತು ಕೌಶಲ್ಯಗಳು$$),
('profile_card_school_learning', 'question4', 'ta', $$எனது தொழில்முறை வாழ்க்கைக்கு நான் மேம்படுத்த வேண்டிய பாடங்கள் மற்றும் திறன்கள்$$),
('profile_card_school_learning', 'question4', 'hi', $$विषय और कौशल जिन्हें मुझे अपने पेशेवर जीवन के लिए सुधारने की आवश्यकता है$$)

ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- ============================================================
-- Talents & Hobbies (4 questions + title)
-- ============================================================

INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('profile_card_hobbies', 'title', 'en', 'Talents & Hobbies'),
('profile_card_hobbies', 'title', 'kn', $$ಪ್ರತಿಭೆಗಳು & ಹವ್ಯಾಸಗಳು$$),
('profile_card_hobbies', 'title', 'ta', $$திறமைகள் & பொழுதுபோக்குகள்$$),
('profile_card_hobbies', 'title', 'hi', $$प्रतिभा और शौक$$),

('profile_card_hobbies', 'question1', 'en', 'Hobbies and potential careers'),
('profile_card_hobbies', 'question1', 'kn', $$ಹವ್ಯಾಸಗಳು ಮತ್ತು ಸಂಭಾವ್ಯ ವೃತ್ತಿಗಳು$$),
('profile_card_hobbies', 'question1', 'ta', $$பொழுதுபோக்குகள் மற்றும் சாத்தியமான தொழில்கள்$$),
('profile_card_hobbies', 'question1', 'hi', $$शौक और संभावित करियर$$),

('profile_card_hobbies', 'question2', 'en', 'People who can help in transitioning from hobby to career'),
('profile_card_hobbies', 'question2', 'kn', $$ಹವ್ಯಾಸದಿಂದ ವೃತ್ತಿಜೀವನಕ್ಕೆ ಸಹಾಯ ಮಾಡುವ ಜನರು$$),
('profile_card_hobbies', 'question2', 'ta', $$பொழுதுபோக்கிலிருந்து தொழிலுக்கு மாற உதவும் நபர்கள்$$),
('profile_card_hobbies', 'question2', 'hi', $$शौक से करियर बनाने में मदद करने वाले लोग$$),

('profile_card_hobbies', 'question3', 'en', 'Talents and matching professions'),
('profile_card_hobbies', 'question3', 'kn', $$ಪ್ರತಿಭೆಗಳು ಮತ್ತು ಹೊಂದಾಣಿಕೆಯ ವೃತ್ತಿಗಳು$$),
('profile_card_hobbies', 'question3', 'ta', $$திறமைகள் மற்றும் பொருத்தமான தொழில்கள்$$),
('profile_card_hobbies', 'question3', 'hi', $$प्रतिभा और उससे मेल खाने वाले पेशे$$),

('profile_card_hobbies', 'question4', 'en', 'People who help with talent for a professional career'),
('profile_card_hobbies', 'question4', 'kn', $$ವೃತ್ತಿಜೀವನಕ್ಕೆ ಪ್ರತಿಭೆಯೊಂದಿಗೆ ಸಹಾಯ ಮಾಡುವ ಜನರು$$),
('profile_card_hobbies', 'question4', 'ta', $$தொழில்முறை வாழ்க்கைக்கு திறமையுடன் உதவும் நபர்கள்$$),
('profile_card_hobbies', 'question4', 'hi', $$पेशेवर करियर के लिए प्रतिभा के साथ मदद करने वाले लोग$$)

ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

-- ============================================================
-- My Role Models (3 questions + title)
-- ============================================================

INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('profile_card_role_models', 'title', 'en', 'My Role Models'),
('profile_card_role_models', 'title', 'kn', $$ನನ್ನ ಆದರ್ಶ ವ್ಯಕ್ತಿಗಳು$$),
('profile_card_role_models', 'title', 'ta', $$எனது முன்மாதிரி ஆளுமைகள்$$),
('profile_card_role_models', 'title', 'hi', $$मेरे आदर्श व्यक्तित्व$$),

('profile_card_role_models', 'question1', 'en', 'My favorite people'),
('profile_card_role_models', 'question1', 'kn', $$ನನ್ನ ಮೆಚ್ಚಿನ ವ್ಯಕ್ತಿಗಳು$$),
('profile_card_role_models', 'question1', 'ta', $$எனக்கு பிடித்த நபர்கள்$$),
('profile_card_role_models', 'question1', 'hi', $$मेरे पसंदीदा व्यक्ति$$),

('profile_card_role_models', 'question2', 'en', 'Qualities I admire in them'),
('profile_card_role_models', 'question2', 'kn', $$ನಾನು ಅವರಲ್ಲಿ ಮೆಚ್ಚುವ ಗುಣಗಳು$$),
('profile_card_role_models', 'question2', 'ta', $$அவர்களிடம் நான் போற்றும் குணங்கள்$$),
('profile_card_role_models', 'question2', 'hi', $$उनके वे गुण जिनकी मैं प्रशंसा करता हूँ$$),

('profile_card_role_models', 'question3', 'en', 'Profession or quality/value that inspired me to follow them'),
('profile_card_role_models', 'question3', 'kn', $$ವೃತ್ತಿ ಅಥವಾ ಗುಣ /ಮೌಲ್ಯ ನನ್ನನ್ನು ಅನುಸರಿಸಲು ಪ್ರೇರೇಪಿಸಿದವು$$),
('profile_card_role_models', 'question3', 'ta', $$தொழில் அல்லது குணம்/மதிப்பு அவர்களைப் பின்பற்ற என்னை தூண்டியது$$),
('profile_card_role_models', 'question3', 'hi', $$पेशा या गुण/मूल्य जिसने मुझे उनका अनुसरण करने के लिए प्रेरित किया$$)

ON CONFLICT (resource_type, resource_key, lang) DO UPDATE SET text = EXCLUDED.text;

COMMIT;
