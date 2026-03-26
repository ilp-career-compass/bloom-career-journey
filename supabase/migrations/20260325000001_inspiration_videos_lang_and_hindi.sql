-- Add lang column to inspiration_sources if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspiration_sources' AND column_name = 'lang') THEN
        ALTER TABLE inspiration_sources ADD COLUMN lang VARCHAR(10) DEFAULT 'en';
    END IF;
END $$;

-- Set existing rows to 'en' if lang is null
UPDATE inspiration_sources SET lang = 'en' WHERE lang IS NULL;

-- Delete existing data and re-insert with language variants
DELETE FROM inspiration_sources;

-- English Videos
INSERT INTO inspiration_sources (title, url, description, sequence_number, lang) VALUES
('Video 1', 'https://youtu.be/U7-HlfpvQIA?si=_gakjQozpgbZC2aQ', 'English Inspiration Video 1', 1, 'en'),
('Video 2', 'https://www.youtube.com/watch?v=xqb1hfgfcl8', 'English Inspiration Video 2', 2, 'en'),
('Video 3', 'https://youtu.be/G87ylRECJzY?si=HyhMM4-ggplVLO2i', 'English Inspiration Video 3', 3, 'en');

-- Kannada Videos (unique 3rd video)
INSERT INTO inspiration_sources (title, url, description, sequence_number, lang) VALUES
('Video 1', 'https://youtu.be/U7-HlfpvQIA?si=_gakjQozpgbZC2aQ', 'Kannada Inspiration Video 1', 1, 'kn'),
('Video 2', 'https://www.youtube.com/watch?v=xqb1hfgfcl8', 'Kannada Inspiration Video 2', 2, 'kn'),
('Video 3', 'https://www.youtube.com/watch?v=z3PYJ9MfMH4', 'Kannada Inspiration Video 3', 3, 'kn');

-- Tamil Videos (same as English)
INSERT INTO inspiration_sources (title, url, description, sequence_number, lang) VALUES
('Video 1', 'https://youtu.be/U7-HlfpvQIA?si=_gakjQozpgbZC2aQ', 'Tamil Inspiration Video 1', 1, 'ta'),
('Video 2', 'https://www.youtube.com/watch?v=xqb1hfgfcl8', 'Tamil Inspiration Video 2', 2, 'ta'),
('Video 3', 'https://youtu.be/G87ylRECJzY?si=HyhMM4-ggplVLO2i', 'Tamil Inspiration Video 3', 3, 'ta');

-- Hindi Videos (videos 1 & 2 = English placeholders, video 3 = Hindi-specific)
INSERT INTO inspiration_sources (title, url, description, sequence_number, lang) VALUES
('Video 1', 'https://youtu.be/U7-HlfpvQIA?si=_gakjQozpgbZC2aQ', 'Hindi Inspiration Video 1', 1, 'hi'),
('Video 2', 'https://www.youtube.com/watch?v=xqb1hfgfcl8', 'Hindi Inspiration Video 2', 2, 'hi'),
('Video 3', 'https://youtu.be/-9OGDxKtUMI', 'Hindi Inspiration Video 3', 3, 'hi');

-- Recreate the RPC to accept p_lang and query inspiration_sources
DROP FUNCTION IF EXISTS get_inspiration_videos();
DROP FUNCTION IF EXISTS get_inspiration_videos(TEXT);

CREATE OR REPLACE FUNCTION get_inspiration_videos(p_lang TEXT DEFAULT 'en')
RETURNS TABLE (
    id UUID,
    title TEXT,
    url TEXT,
    description TEXT,
    sequence_number INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT s.id, s.title, s.url, s.description, s.sequence_number
    FROM inspiration_sources s
    WHERE s.lang = p_lang
      AND s.sequence_number IS NOT NULL
    ORDER BY s.sequence_number;
$$;

GRANT EXECUTE ON FUNCTION get_inspiration_videos(TEXT) TO authenticated;
