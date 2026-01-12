-- Migration: Update About Me Content (I18N) and Add Summary

-- 1. Update/Reset About Me Fields (Main Questions)
-- We prefer to delete and re-insert to ensure exact match with the new structure (20 questions)
DELETE FROM about_me_fields;

INSERT INTO about_me_fields (field_key, question_text, help_text, field_type, section, sequence_number) VALUES
('question1', 'In your family, with whom can you freely share your opinions without fear or hesitation? And how much trust do you have in them?', 'Choose the family member you feel safest talking to', 'textarea', 'A. Your Profile', 1),
('question2', 'Other than your family members, with whom can you freely share your opinions and feelings without fear or hesitation?', 'Think about someone outside your family whom you trust and feel comfortable talking to.', 'textarea', 'A. Your Profile', 2),
('question3', 'What are the tasks you do at home? (e.g., helping in agricultural activities, bringing vegetables and groceries from the shop, money-related work, taking care of animals, filling water, etc.)', 'Think about the daily work you help with at home.', 'textarea', 'A. Your Profile', 3),

('question4', 'The tasks you like to do a. During school hours b. After school hours (before school starts and after school ends)', 'Write the activities you enjoy doing during and after school.', 'textarea', 'B. What is your favourite work?', 4),
('question5', 'What are the activities you like to do alone, independently? (Tasks you do by yourself)', 'Think about activities you enjoy doing by yourself.', 'textarea', 'B. What is your favourite work?', 5),
('question6', 'What activities do you like to do in a group or with your friends?', 'Think about activities you enjoy doing with friends.', 'textarea', 'B. What is your favourite work?', 6),

('question7', 'What activities do you find difficult at school? Write them.', 'Think about school activities that are hard for you.', 'textarea', 'C. The job that you find difficult to carry out', 7),
('question8', 'Apart from school work or activities, what other tasks do you find difficult?', 'Think about tasks outside school that you find difficult.', 'textarea', 'C. The job that you find difficult to carry out', 8),
('question9', 'What activities do you like to do alone? For example, reading, drawing, playing, etc.', 'Think about activities you enjoy doing alone', 'textarea', 'C. The job that you find difficult to carry out', 9),
('question10', 'Do you like to do the activities you like or dislike by yourself?', 'Think about whether you like doing activities alone.', 'textarea', 'C. The job that you find difficult to carry out', 10),
('question11', 'Do you like to do the activities you like or dislike by yourself?', 'Think about whether you like doing activities alone.', 'textarea', 'C. The job that you find difficult to carry out', 11),

('question12', 'What would you say about yourself? What qualities do you have?', 'What are your good qualities?', 'textarea', 'D. Answer the below questions to share more information about yourself', 12),
('question13', 'Which of your qualities do you think these people (parents, teachers, friends, etc.) like? List them.', 'What good qualities do your parents, teachers, and friends like? (Ask your parents, teachers, and friends and verify.)', 'textarea', 'D. Answer the below questions to share more information about yourself', 13),
('question14', 'Which habit or behaviour of yours do you want to improve or change?', 'Is there any habit or behaviour you want to change or improve?', 'textarea', 'D. Answer the below questions to share more information about yourself', 14),
('question15', 'Which of your qualities or behaviours do others want you to correct, or advise you to change?', 'Think about the feedback you get from others.', 'textarea', 'D. Answer the below questions to share more information about yourself', 15),
('question16', 'If you had a chance to become something or someone in the future, what would you like to become?', 'If you could become anything or anyone, what would you like to be?', 'textarea', 'D. Answer the below questions to share more information about yourself', 16),
('question17', 'Recall an interview or feedback you received about yourself. Which of your actions or work earned you appreciation? How did you achieve it? Explain briefly.', 'Think about a time when someone appreciated you', 'textarea', 'D. Answer the below questions to share more information about yourself', 17),
('question18', 'Think about a difficult or challenging situation you faced recently. How did you face it or overcome it? What lesson did you learn from it?', 'Think about a recent problem or challenge.', 'textarea', 'D. Answer the below questions to share more information about yourself', 18),
('question19', 'Recall a situation where others misunderstood you or had a wrong impression about you. How did you handle that situation, and what did you learn from it?', 'Think about a time when someone misunderstood you.', 'textarea', 'D. Answer the below questions to share more information about yourself', 19),
('question20', 'Based on the summary, write briefly about yourself. (You may use words, pictures, or symbols.)', 'Write a short note about yourself using the summary.', 'textarea', 'D. Answer the below questions to share more information about yourself', 20);

-- 2. Insert Translations into content_translations
DELETE FROM content_translations WHERE resource_type IN ('about_me_question', 'about_me_help', 'about_me_module', 'about_me_summary_question');

-- Module Title
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('about_me_module', 'title', 'ta', 'என்னைப் பற்றி'),
('about_me_module', 'title', 'kn', 'ನನ್ನ ಬಗ್ಗೆ');

-- Tamil Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('about_me_question', 'question1', 'ta', 'உங்கள் குடும்பத்தில், பயம் அல்லது தயக்கம் இன்றி உங்கள் கருத்துக்களை யாருடன் சுதந்திரமாக பகிர்ந்து கொள்ள முடியும்?'),
('about_me_question', 'question2', 'ta', 'உங்கள் குடும்பத்தினரைத் தவிர, பயம் அல்லது தயக்கம் இல்லாமல் உங்கள் கருத்துகளையும் உணர்வுகளையும் யாருடன் சுதந்திரமாக பகிர்ந்து கொள்ள முடியும்?'),
('about_me_question', 'question3', 'ta', 'வீட்டில் நீங்கள் செய்யும் வேலைகள் என்னென்ன? (உதா: விவசாயப் பணிகளில் உதவுதல், கடையிலிருந்து காய்கறிகள் மற்றும் மளிகைப் பொருட்கள் வாங்கி வருதல், பணம் தொடர்பான வேலைகள், விலங்குகளை பராமரித்தல்,'),
('about_me_question', 'question4', 'ta', 'நீங்கள் விரும்பி செய்யும் வேலைகள்: a பள்ளி நேரத்தில் b. பள்ளி நேரத்திற்கு பிறகு (பள்ளி தொடங்குவதற்கு முன் மற்றும் பள்ளி முடிந்த பிறகு)'),
('about_me_question', 'question5', 'ta', 'என்னென்ன? (தனியாகவே செய்து முடிக்கும் பணிகள்)'),
('about_me_question', 'question6', 'ta', 'நீங்கள் குழுவாக அல்லது உங்கள் நண்பர்களுடன் செய்ய விரும்பும் செயல்கள் என்னென்ன?'),
('about_me_question', 'question7', 'ta', 'பள்ளியில் உங்களுக்கு கடினமாக தோன்றும் செயல்கள் என்னென்ன? எழுதுங்கள்.'),
('about_me_question', 'question8', 'ta', 'பள்ளி வேலைகள் / செயல்களைத் தவிர, பள்ளிக்கு வெளியே உங்களுக்கு கடினமாக இருக்கும் வேலைகள் என்னென்ன?'),
('about_me_question', 'question9', 'ta', 'நீங்கள் தனியாக செய்ய விரும்பும் செயல்கள் என்னென்ன? உதாரணமாக, படித்தல், வரைதல், விளையாடல், போன்றவை.'),
('about_me_question', 'question10', 'ta', 'செயல்களை தனியாக செய்ய விரும்புகிறீர்களா?'),
('about_me_question', 'question11', 'ta', 'நீங்கள் விரும்பும் அல்லது விரும்பாத செயல்களை தனியாக செய்ய விரும்புகிறீர்களா?'),
('about_me_question', 'question12', 'ta', 'உங்களைப் பற்றி நீங்கள் என்ன சொல்ல விரும்புகிறீர்கள்? உங்களிடம் உள்ள நல்ல குணங்கள் என்ன?'),
('about_me_question', 'question13', 'ta', 'உங்களிடம் உள்ள எந்த குணங்களை பெற்றோர், ஆசிரியர்கள் மற்றும் நண்பர்கள் போன்றோர் விரும்புகிறார்கள் என்று நீங்கள் நினைக்கிறீர்கள்? பட்டியலிடுங்கள்.'),
('about_me_question', 'question14', 'ta', 'உங்களிடம் உள்ள எந்த பழக்கம் அல்லது நடத்தையை நீங்கள் மேம்படுத்த அல்லது மாற்ற விரும்புகிறீர்கள்?'),
('about_me_question', 'question15', 'ta', 'மற்றவர்கள் திருத்த வேண்டும் என்று விரும்புகிறார்கள் அல்லது ஆலோசனை தருகிறார்கள்?'),
('about_me_question', 'question16', 'ta', 'எதிர்காலத்தில் நீங்கள் ஏதாவது ஆக அல்லது யாராவது ஆக வாய்ப்பு இருந்தால், நீங்கள் என்ன ஆக விரும்புகிறீர்கள்?'),
('about_me_question', 'question17', 'ta', 'உங்களைப் பற்றி நீங்கள் பெற்ற நேர்காணல் அல்லது கருத்தை நினைவில் கொள்ளுங்கள். உங்கள் எந்த செயல் அல்லது வேலைக்கு உங்களுக்கு பாராட்டு கிடைத்தது? அதை நீங்கள் எவ்வாறு சாதித்தீர்கள்? சுருக்கமாக விளக்குங்கள்.'),
('about_me_question', 'question18', 'ta', 'நீங்கள் சமீபத்தில் எதிர்கொண்ட ஒரு கடினமான அல்லது சவாலான சூழ்நிலையை பற்றி யோசியுங்கள். அதை நீங்கள் எவ்வாறு எதிர்கொண்டீர்கள் அல்லது அதிலிருந்து எவ்வாறு மீண்டீர்கள்? அதிலிருந்து நீங்கள் கற்றுக்கொண்ட பாடம் என்ன?'),
('about_me_question', 'question19', 'ta', 'மற்றவர்கள் உங்களை தவறாக புரிந்து கொண்ட அல்லது உங்களைப் பற்றி தவறான கருத்து கொண்ட ஒரு சூழ்நிலையை நினைவில் கொள்ளுங்கள். அந்த சூழ்நிலையை நீங்கள் எவ்வாறு கையாண்டிர்கள், அதிலிருந்து நீங்கள் என்ன கற்றுக்கொண்டீர்கள்?'),
('about_me_question', 'question20', 'ta', 'சுருக்கத்தின் அடிப்படையில், உங்களைப் பற்றி சுருக்கமாக எழுதுங்கள். (சொற்கள், படங்கள் அல்லது குறிகளை)');

-- Tamil Help Texts
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('about_me_help', 'question1', 'ta', 'நீங்கள் பாதுகாப்பாக பேச முடியும் என்ற குடும்ப உறுப்பினரை தேர்வு செய்யவும்.'),
('about_me_help', 'question2', 'ta', 'உங்கள் குடும்பத்திற்கு வெளியே, நீங்கள் நம்பி நிம்மதியாக பேச முடியும் நபரை நினைத்துப் பதிலளிக்கவும்.'),
('about_me_help', 'question3', 'ta', 'வீட்டில் நீங்கள் தினமும் செய்யும் வேலைகளை நினைத்து பதிலளிக்கவும்.'),
('about_me_help', 'question4', 'ta', 'பள்ளி நேரத்திலும், பள்ளிக்குப் பிறகும் நீங்கள் விரும்பி செய்யும் செயல்களை எழுதுங்கள்.'),
('about_me_help', 'question5', 'ta', 'நீங்கள் தனியாக செய்து மகிழும் செயல்களை நினைத்து பதிலளிக்கவும்.'),
('about_me_help', 'question6', 'ta', 'நண்பர்களுடன் சேர்ந்து செய்ய விரும்பும் செயல்களை நினைத்து பதிலளிக்கவும்.'),
('about_me_help', 'question7', 'ta', 'பள்ளியில் உங்களுக்கு கடினமாக இருக்கும் செயல்களை நினைத்து பதிலளிக்கவும்.'),
('about_me_help', 'question8', 'ta', 'பள்ளிக்கு வெளியே உங்களுக்கு கடினமாக இருக்கும் வேலைகளை நினைத்து பதிலளிக்கவும்.'),
('about_me_help', 'question9', 'ta', 'நீங்கள் தனியாக செய்து மகிழும் செயல்களை நினைத்து பதிலளிக்கவும்.'),
('about_me_help', 'question10', 'ta', 'செயல்களை தனியாக செய்ய விரும்புகிறீர்களா என நினைத்து பதிலளிக்கவும்.'),
('about_me_help', 'question11', 'ta', 'செயல்களை தனியாக செய்ய விரும்புகிறீர்களா என நினைத்து பதிலளிக்கவும்.'),
('about_me_help', 'question12', 'ta', 'உங்களிடம் உள்ள நல்ல குணங்கள் என்ன?'),
('about_me_help', 'question13', 'ta', 'பெற்றோர், ஆசிரியர்கள் மற்றும் நண்பர்கள் உங்களிடம் விரும்பும் நல்ல குணங்கள் என்ன? (கேட்டு உறுதிப்படுத்தவும்.)'),
('about_me_help', 'question14', 'ta', 'நீங்கள் மாற்ற அல்லது மேம்படுத்த விரும்பும் பழக்கம் அல்லது நடத்தை ஏதாவது உள்ளதா?'),
('about_me_help', 'question15', 'ta', 'நீங்கள் திருத்த வேண்டும் என்று விரும்பும் குணம் அல்லது நடத்தை எது?'),
('about_me_help', 'question16', 'ta', 'நீங்கள் ஏதாவது ஆக அல்லது யாராவது ஆக வாய்ப்பு இருந்தால், என்ன ஆக விரும்புகிறீர்கள்?'),
('about_me_help', 'question17', 'ta', 'எந்த வேலை அல்லது செயலில் உங்களுக்கு பாராட்டு கிடைத்தது?'),
('about_me_help', 'question18', 'ta', 'சமீபத்தில் நீங்கள் எதிர்கொண்ட ஒரு சிக்கல் அல்லது சவாலை நினைத்து பாருங்கள்'),
('about_me_help', 'question19', 'ta', 'யாராவது உங்களை தவறாக புரிந்துகொண்ட ஒரு நேரத்தை நினைத்து பாருங்கள்'),
('about_me_help', 'question20', 'ta', 'சுருக்கத்தை வைத்து உங்களைப் பற்றி சுருக்கமாக எழுதுங்கள்.');

-- Kannada Questions
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('about_me_question', 'question1', 'kn', 'ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಯಾರೊಂದಿಗೆ ನೀವು ಭಯ / ಸಂಕುಚಿತತೆ ಇಲ್ಲದೆ ಮುಕ್ತವಾಗಿ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳನ್ನು ವಿಶ್ವಾಸವಿದೆ?'),
('about_me_question', 'question2', 'kn', 'ನಿಮ್ಮ ಕುಟುಂಬದವರನ್ನು ಬಿಟ್ಟು ಬೇರೆ ಯಾರೊಂದಿಗೆ ನೀವು ಭಯ / ಸಂಕುಚಿತತೆ ಇಲ್ಲದೆ ಮುಕ್ತವಾಗಿ ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಗಳನ್ನು ಮತ್ತು ಭಾವನೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬಹುದು?'),
('about_me_question', 'question3', 'kn', 'ಮನೆಯಲ್ಲಿ ನೀವು ಮಾಡುವ ಕೆಲಸಗಳು ಯಾವುವು? (ಉದಾ: ಕೃಷಿ ಚಟುವಟಿಕೆಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡುವುದು, ಅಂಗಡಿಯಿಂದ ತರಕಾರಿ ಮತ್ತು ದಿನಸಿ ಸಾಮಗ್ರಿಗಳನ್ನು ತರುವುದು, ಹಣ-ಕಾಸು ಕೆಲಸಗಳು, ಪ್ರಾಣಿಗಳ ಆರೈಕೆ, ನೀರು ತುಂಬಿಸುವುದು ಇತ್ಯಾದಿ)'),
('about_me_question', 'question4', 'kn', 'ನೀವು ಇಷ್ಟಪಟ್ಟು ಮಾಡುವ ಕೆಲಸಗಳು: a. ಶಾಲಾ ಅವಧಿಯಲ್ಲಿ b. ಶಾಲಾ ಅವಧಿಯ ನಂತರ (ಶಾಲಾ ಅವಧಿ ನಂತರ)'),
('about_me_question', 'question5', 'kn', 'ಒಬ್ಬರೇ, ಸ್ವತಂತ್ರವಾಗಿ ಮಾಡಲು ಇಷ್ಟಪಡುವ ಕೆಲಸಗಳು ಯಾವುವು? (ಪ್ರತ್ಯೇಕವಾಗಿ ಒಬ್ಬರೇ ನಿರ್ವಹಿಸುವ ಕಾರ್ಯಗಳು)'),
('about_me_question', 'question6', 'kn', 'ನೀವು ಗುಂಪಿನಲ್ಲಿ / ನಿಮ್ಮ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಿ?'),
('about_me_question', 'question7', 'kn', 'ನಿಮಗೆ ಶಾಲೆಯಲ್ಲಿ ಕಷ್ಟವೆನಿಸುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು? ಬರೆಯಿರಿ.'),
('about_me_question', 'question8', 'kn', 'ಶಾಲೆಯ ಕೆಲಸ / ಚಟುವಟಿಕೆಗಳನ್ನು ಹೊರತುಪಡಿಸಿ ನಿಮಗೆ ಕಷ್ಟಕರವಾದ ಇನ್ನೇನು ಕೆಲಸಗಳಿವೆ?'),
('about_me_question', 'question9', 'kn', 'ನೀವು ಒಬ್ಬರೇ ಮಾಡಲು ಇಷ್ಟಪಡುವ ಕೆಲಸಗಳು ಯಾವುವು? ಉದಾಹರಣೆಗೆ, ಓದು, ಚಿತ್ರ ಬಿಡಿಸುವುದು, ಆಟಗಳು, ಇತ್ಯಾದಿ.'),
('about_me_question', 'question10', 'kn', 'ನೀವು ಇಷ್ಟಪಡುವ / ಇಷ್ಟವಿಲ್ಲದ ಚಟುವಟಿಕೆಗಳನ್ನು ಒಬ್ಬರೇ ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಾ?'),
('about_me_question', 'question11', 'kn', 'ನೀವು ಇಷ್ಟಪಡುವ / ಇಷ್ಟವಿಲ್ಲದ ಚಟುವಟಿಕೆಗಳನ್ನು ಒಬ್ಬರೇ ಮಾಡಲು ಇಷ್ಟಪಡುತ್ತೀರಾ?'),
('about_me_question', 'question12', 'kn', 'ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವೇ ಏನು ಹೇಳಿಕೊಳ್ಳುತ್ತೀರಿ? ನಿಮ್ಮಲ್ಲಿರುವ ಗುಣಗಳು ಯಾವುವು?'),
('about_me_question', 'question13', 'kn', 'ಇವರು (ಪಾಲಕರು, ಶಿಕ್ಷಕರು, ಸ್ನೇಹಿತರು ಇತ್ಯಾದಿ) ನಿಮ್ಮ ಯಾವ ಗುಣಗಳನ್ನು ಇಷ್ಟಪಡುತ್ತಾರೆ ಎಂದು ಭಾವಿಸುತ್ತೀರಿ? ಪಟ್ಟಿ ಮಾಡಿ.'),
('about_me_question', 'question14', 'kn', 'ನಿಮ್ಮಲ್ಲಿರುವ ಯಾವ ಸ್ವಭಾವವನ್ನು ಸುಧಾರಣೆ / ಬದಲಾವಣೆ ಮಾಡಿಕೊಳ್ಳಲು ನೀವು ಬಯಸುತ್ತೀರಿ?'),
('about_me_question', 'question15', 'kn', 'ನಿಮ್ಮ ಯಾವ ಗುಣ ಅಥವಾ ಸ್ವಭಾವವನ್ನು ತಿದ್ದಿಕೊಳ್ಳಬೇಕು ಎಂದು ಇತರರು ಬಯಸುತ್ತಾರೆ ಅಥವಾ ಸಲಹೆ ನೀಡುತ್ತಾರೆ?'),
('about_me_question', 'question16', 'kn', 'ಭವಿಷ್ಯದಲ್ಲಿ ನಿಮಗೆ ಏನಾದರೂ / ಯಾರಾದರೂ ಆಗುವ ಅವಕಾಶ ಇದ್ದರೆ, ನೀವು ಏನಾಗಲು / ಯಾರಾಗಲು ಬಯಸುತ್ತೀರಿ?'),
('about_me_question', 'question17', 'kn', 'ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ತೆಗೆದುಕೊಂಡ ಸಂದರ್ಶನವನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ. ನಿಮ್ಮ ಯಾವ ಕೆಲಸದಿಂದ ನಿಮಗೆ ಮೆಚ್ಚುಗೆ ದೊರಕಿತು? ಅದನ್ನು ಹೇಗೆ ಸಾಧಿಸಿದ್ದೀರಿ? ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ.'),
('about_me_question', 'question18', 'kn', 'ನೀವು ಇತ್ತೀಚೆಗೆ ಎದುರಿಸಿದ ಕಷ್ಟಕರ / ಸವಾಲಿನ ಪರಿಸ್ಥಿತಿಯ ಬಗ್ಗೆ ಯೋಚಿಸಿ. ಅದನ್ನು ನೀವು ಹೇಗೆ ಎದುರಿಸಿದ್ದೀರಿ ಅಥವಾ ಅದರಿಂದ ಹೇಗೆ ಪಾರಾಗಿದ್ದೀರಿ? ಅದರಿಂದ ಕಲಿತ ಪಾಠವೇನು?'),
('about_me_question', 'question19', 'kn', 'ಇತರರು ನಿಮ್ಮನ್ನು ತಪ್ಪಾಗಿ ತಿಳಿದ (ನಿಮ್ಮ ಬಗ್ಗೆ ತಪ್ಪು ಕಲ್ಪನೆ ಹೊಂದಿದ) ಸಂದರ್ಭವನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ. ನೀವು ಆ ಪರಿಸ್ಥಿತಿಯನ್ನು ಹೇಗೆ ನಿರ್ವಹಿಸಿದ್ದೀರಿ ಮತ್ತು ಅದರಿಂದ ನೀವು ಏನು ಕಲಿತಿರಿ?'),
('about_me_question', 'question20', 'kn', 'ಸಾರಾಂಶದ ಆಧಾರದ ಮೇಲೆ ನಿಮ್ಮ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ. (ಪದಗಳು, ಚಿತ್ರಗಳು ಅಥವಾ ಚಿಹ್ನೆಗಳನ್ನು ಬಳಸಬಹುದು.)');

-- 3. Create Summary Questions Table
CREATE TABLE IF NOT EXISTS about_me_summary_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    sequence_number INTEGER,
    section_header TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE about_me_summary_questions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON about_me_summary_questions TO authenticated;
DROP POLICY IF EXISTS "Authenticated users can view about me summary questions" ON about_me_summary_questions;
CREATE POLICY "Authenticated users can view about me summary questions" ON about_me_summary_questions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Truncate to ensure clean state
TRUNCATE about_me_summary_questions;

-- Insert English Summary Questions
INSERT INTO about_me_summary_questions (sequence_number, section_header, question_text) VALUES
(1, 'Prepare a personal profile or your own self-portrait. Summarize the points you wrote about yourself above in one or a few words.', 'Who are my friends outside my family?'),
(2, NULL, 'What activities do I do daily?'),
(3, NULL, 'Which activities do I enjoy during school time?'),
(4, NULL, 'Which activities do I enjoy outside school?'),
(5, NULL, 'What activities do I enjoy personally?'),
(6, NULL, 'What activities do I enjoy doing as a team?'),
(7, NULL, 'Which school activity do I find difficult even though I must do it? Which activity do I find difficult to manage after school or outside school?'),
(8, NULL, 'What activities must I do?'),
(9, NULL, 'Which activities can I do easily?'),
(10, NULL, 'Which activities are not easy for me to do?'),
(11, NULL, 'What qualities do I like about myself?'),
(12, NULL, 'What qualities do others like in me?'),
(13, NULL, 'Which qualities or aspects do I need to improve?');

-- Insert Summary Translations (Tamil)
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('about_me_summary_question', 'header1', 'ta', 'ஒரு தனிப்பட்ட சுயவிவரம் அல்லது உங்கள் சொந்த சுயப்படத்தை தயாரிக்கவும். மேலே உங்களைப் பற்றி நீங்கள் எழுதிய அம்சங்களை ஒரு அல்லது சில சொற்களில் சுருக்கமாக எழுதுங்கள்.'),
('about_me_summary_question', 'question1', 'ta', 'என் குடும்பத்தைத் தவிர, என் நண்பர்கள் யார்?'),
('about_me_summary_question', 'question2', 'ta', 'நான் தினமும் என்ன வேலைகளை செய்கிறேன்?'),
('about_me_summary_question', 'question3', 'ta', 'பள்ளி நேரத்தில் நான் ரசிக்கும் செயல்கள் என்ன?'),
('about_me_summary_question', 'question4', 'ta', 'பள்ளிக்கு வெளியே நான் ரசிக்கும் செயல்கள் என்ன?'),
('about_me_summary_question', 'question5', 'ta', 'தனிப்பட்ட முறையில் நான் ரசிக்கும் செயல்கள் என்ன?'),
('about_me_summary_question', 'question6', 'ta', 'குழுவாகச் செய்யும்போது நான் ரசிக்கும் செயல்கள் என்ன?'),
('about_me_summary_question', 'question7', 'ta', 'பள்ளியில் செய்ய வேண்டியிருந்தாலும் எனக்கு கடினமாக இருக்கும் செயல் எது? பள்ளிக்கு பிறகு அல்லது பள்ளிக்கு வெளியே செய்ய கடினமாக இருப்பது எது?'),
('about_me_summary_question', 'question8', 'ta', 'நான் கட்டாயமாக செய்ய வேண்டிய செயல்கள் என்ன?'),
('about_me_summary_question', 'question9', 'ta', 'நான் எளிதாக செய்யக்கூடிய செயல்கள் என்ன?'),
('about_me_summary_question', 'question10', 'ta', 'எனக்கு எளிதாக செய்ய முடியாத செயல்கள் என்ன?'),
('about_me_summary_question', 'question11', 'ta', 'என்னிடத்தில் நான் விரும்பும் குணங்கள் என்ன?'),
('about_me_summary_question', 'question12', 'ta', 'மற்றவர்கள் என்னிடத்தில் விரும்பும் குணங்கள் என்ன?'),
('about_me_summary_question', 'question13', 'ta', 'நான் மேம்படுத்த வேண்டிய குணங்கள் /அம்சங்கள் என்ன?');

-- Insert Summary Translations (Kannada)
INSERT INTO content_translations (resource_type, resource_key, lang, text) VALUES
('about_me_summary_question', 'header1', 'kn', 'ವೈಯಕ್ತಿಕ ಪ್ರೊಫೈಲ್ ಅಥವಾ ನಿಮ್ಮದೇ ವ್ಯಕ್ತಿಚಿತ್ರವನ್ನು ಸಿದ್ಧಪಡಿಸಿ. ಮೇಲೆ ನಿಮ್ಮ ಬಗ್ಗೆ ನೀವು ಬರೆದ ಅಂಶಗಳನ್ನು ಒಂದು ಅಥವಾ ಕೆಲವು ಪದಗಳಲ್ಲಿ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಬರೆಯಿರಿ.'),
('about_me_summary_question', 'question1', 'kn', 'ನನ್ನ ಸ್ನೇಹಿತರು ಯಾರು?'),
('about_me_summary_question', 'question2', 'kn', 'ನಾನು ದಿನನಿತ್ಯದಲ್ಲಿ ಯಾವ ಕೆಲಸಗಳನ್ನು ಮಾಡುತ್ತೇನೆ?'),
('about_me_summary_question', 'question3', 'kn', 'ಶಾಲೆಯ ಸಮಯದಲ್ಲಿ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?'),
('about_me_summary_question', 'question4', 'kn', 'ಶಾಲೆ ಹೊರಗೆ ನಾನು ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?'),
('about_me_summary_question', 'question5', 'kn', 'ವೈಯಕ್ತಿಕವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸಗಳು / ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?'),
('about_me_summary_question', 'question6', 'kn', 'ತಂಡವಾಗಿ ನಾನು ಆನಂದಿಸುವ ಕೆಲಸಗಳು / ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?'),
('about_me_summary_question', 'question7', 'kn', 'ಶಾಲೆಯಲ್ಲಿ ಮಾಡಬೇಕಾದರೂ ನನಗೆ ಕಷ್ಟವಾಗುವ ಚಟುವಟಿಕೆ ಯಾವುದು? ಶಾಲೆಯ ನಂತರ ಅಥವಾ ಶಾಲೆ ಹೊರಗೆ ನನಗೆ ನಿರ್ವಹಿಸಲು ಕಷ್ಟವಾಗುವ ಚಟುವಟಿಕೆ ಯಾವುದು?'),
('about_me_summary_question', 'question8', 'kn', 'ನಾನು ಮಾಡಲೇಬೇಕಾದ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?'),
('about_me_summary_question', 'question9', 'kn', 'ನಾನು ಸುಲಭವಾಗಿ ಮಾಡಬಹುದಾದ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?'),
('about_me_summary_question', 'question10', 'kn', 'ನನಗೆ ಸುಲಭವಾಗಿ ಮಾಡಲು ಬಾರದ ಚಟುವಟಿಕೆಗಳು ಯಾವುವು?'),
('about_me_summary_question', 'question11', 'kn', 'ನನ್ನಲ್ಲಿರುವ ನಾನು ಇಷ್ಟಪಡುವ ಗುಣಗಳು ಯಾವುವು?'),
('about_me_summary_question', 'question12', 'kn', 'ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟ ಪಡುವ ಗುಣಗಳು ಯಾವುವು?'),
('about_me_summary_question', 'question13', 'kn', 'ನಾನು ಸುಧಾರಿಸಿಕೊಳ್ಳಬೇಕಾದ ಗುಣಗಳು / ಅಂಶಗಳು ಯಾವುವು?');

-- 4. Create RPC for Main Questions
DROP FUNCTION IF EXISTS get_about_me_fields_i18n(text);
CREATE OR REPLACE FUNCTION get_about_me_fields_i18n(p_lang text DEFAULT 'en')
RETURNS TABLE (
    field_key TEXT,
    question_text TEXT,
    help_text TEXT,
    field_type TEXT,
    section TEXT,
    sequence_number INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.field_key,
        COALESCE(t.text, q.question_text) as question_text,
        COALESCE(th.text, q.help_text) as help_text,
        q.field_type,
        q.section,
        q.sequence_number
    FROM about_me_fields q
    LEFT JOIN content_translations t ON q.field_key = t.resource_key 
        AND t.resource_type = 'about_me_question' 
        AND t.lang = p_lang
    LEFT JOIN content_translations th ON q.field_key = th.resource_key 
        AND th.resource_type = 'about_me_help' 
        AND th.lang = p_lang
    ORDER BY q.sequence_number;
END;
$$;

GRANT EXECUTE ON FUNCTION get_about_me_fields_i18n(text) TO authenticated;

-- 5. Create RPC for Summary Questions
DROP FUNCTION IF EXISTS get_about_me_summary_questions_i18n(text);
CREATE OR REPLACE FUNCTION get_about_me_summary_questions_i18n(p_lang text)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    section_header TEXT,
    sequence_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH base AS (
        SELECT 
            s.id,
            s.question_text,
            s.section_header,
            s.sequence_number,
            ROW_NUMBER() OVER (ORDER BY s.sequence_number) as rn
        FROM about_me_summary_questions s
        WHERE s.is_active = true
    )
    SELECT 
        base.id,
        COALESCE(
            public.get_translation('about_me_summary_question', 'question' || base.rn, p_lang),
            base.question_text
        ) as question_text,
        COALESCE(
            public.get_translation('about_me_summary_question', 'header' || base.rn, p_lang),
            base.section_header
        ) as section_header,
        base.sequence_number
    FROM base
    ORDER BY base.sequence_number;
END $$;

GRANT EXECUTE ON FUNCTION get_about_me_summary_questions_i18n(text) TO authenticated;

-- 6. Helper to get module title
CREATE OR REPLACE FUNCTION get_about_me_module_title_i18n(p_lang text)
RETURNS TABLE (
    title TEXT,
    subtitle TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_title text;
    v_subtitle text;
BEGIN
    -- Only fetching title for now as per requirement, but structure allows expansion
    -- In json: "title_text" and "subtitle_text" exist.
    -- I'll map 'title' to the main module title "About Me" translation
    
    SELECT text INTO v_title
    FROM content_translations
    WHERE resource_type = 'about_me_module' 
    AND resource_key = 'title'
    AND lang = p_lang;
    
    RETURN QUERY SELECT COALESCE(v_title, 'About Me'), CAST(NULL AS TEXT);
END $$;

GRANT EXECUTE ON FUNCTION get_about_me_module_title_i18n(text) TO authenticated;
