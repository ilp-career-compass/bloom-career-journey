-- ============================================================
-- School Learning Options Fix (Phase 1E)
-- INSERT kn/ta for 2 missing keys: presentation, rolePlay
-- UPDATE kn/ta for 7 existing keys to match sheet values
-- DO NOT touch reading, writing, memorizing rows
-- ============================================================

BEGIN;

-- 7 existing keys — upsert with sheet-sourced kn/ta values
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES
  ('school_learning_option', 'visual', 'kn', $$ವಿಡಿಯೋಗಳನ್ನು ವೀಕ್ಷಿಸುವುದು ಅಥವಾ ಚಿತ್ರಗಳ ಮೂಲಕ ತಿಳಿಯುವುದು (ದೃಶ್ಯ ಮಾಧ್ಯಮ)$$),
  ('school_learning_option', 'visual', 'ta', $$வீடியோக்களைப் பார்ப்பது அல்லது படங்களின் மூலம் புரிந்துகொள்வது (காட்சி முறை)$$),

  ('school_learning_option', 'audio', 'kn', $$ವಿವರಣೆಗಳನ್ನು ಆಲಿಸುವುದು (ಶ್ರವಣ ಮಾಧ್ಯಮ)$$),
  ('school_learning_option', 'audio', 'ta', $$விளக்கங்களைக் கேட்டுப் புரிந்துகொள்வது (ஒலி முறை)$$),

  ('school_learning_option', 'experimenting', 'kn', $$ಪ್ರಯೋಗ ಅಥವಾ ಚಟುವಟಿಕೆಗಳ ಮೂಲಕ ಕಲಿಯುವುದು (ಅನುಭವಾತ್ಮಕ)$$),
  ('school_learning_option', 'experimenting', 'ta', $$சோதனைகள் அல்லது செய்முறைப் பயிற்சிகள் மூலம் கற்றல் (அனுபவ முறை)$$),

  ('school_learning_option', 'discuss', 'kn', $$ವಿಷಯಗಳ ಬಗ್ಗೆ ಚರ್ಚಿಸುವುದು ಅಥವಾ ತಾರ್ಕಿಕವಾಗಿ ಯೋಚಿಸುವುದು$$),
  ('school_learning_option', 'discuss', 'ta', $$கருத்துகளை விவாதிப்பது அல்லது தர்க்கரீதியாகச் சிந்திப்பது$$),

  ('school_learning_option', 'groupDiscussions', 'kn', $$ಸ್ನೇಹಿತರೊಂದಿಗೆ ಗುಂಪು ಚರ್ಚೆ ಮಾಡುವುದು$$),
  ('school_learning_option', 'groupDiscussions', 'ta', $$நண்பர்களுடன் குழுவாக விவாதிப்பது$$),

  ('school_learning_option', 'teaching', 'kn', $$ಇತರರಿಗೆ ಕಲಿಸುವ ಮೂಲಕ ಅಥವಾ ವಿವರಿಸುವ ಮೂಲಕ ಕಲಿಯುವುದು$$),
  ('school_learning_option', 'teaching', 'ta', $$மற்றவர்களுக்குக் கற்பிப்பதன் மூலம் அல்லது விளக்குவதன் மூலம் கற்றல்$$),

  ('school_learning_option', 'other', 'kn', $$ನಿಮಗೆ ಅನ್ವಯಿಸುವ ಬೇರೆ ಯಾವುದೇ ವಿಧಾನ$$),
  ('school_learning_option', 'other', 'ta', $$உங்களுக்குப் பொருந்தும் வேறு ஏதேனும் முறை$$)

ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text;

-- 2 new keys — presentation and rolePlay
-- These were not in the Google Sheet; old Feb 2026 migration had wrong
-- values (mapped to Writing/Reading due to column misalignment).
-- Correct translations created to match the English labels.
INSERT INTO content_translations (resource_type, resource_key, lang, text)
VALUES
  ('school_learning_option', 'presentation', 'kn', $$ಪ್ರಸ್ತುತಿ ಮಾಡುವುದು$$),
  ('school_learning_option', 'presentation', 'ta', $$கருத்தரங்கு வழங்குதல்$$),

  ('school_learning_option', 'rolePlay', 'kn', $$ಪಾತ್ರಾಭಿನಯದ ಮೂಲಕ ಮೌಖಿಕ ಅಭ್ಯಾಸ$$),
  ('school_learning_option', 'rolePlay', 'ta', $$பாத்திர நடிப்பு மூலம் பேச்சுப் பயிற்சி$$)

ON CONFLICT (resource_type, resource_key, lang)
DO UPDATE SET text = EXCLUDED.text;

COMMIT;
