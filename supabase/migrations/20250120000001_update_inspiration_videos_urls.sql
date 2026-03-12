-- Update Inspiration Video URLs
-- This migration updates the URLs for inspirational videos 1, 2, 4, and 6

-- Update the URL for Inspirational Video 1
UPDATE inspiration_sources 
SET url = 'https://youtu.be/U7-HlfpvQIA?si=_gakjQozpgbZC2aQ'
WHERE title = 'Inspirational Video 1' AND sequence_number = 1;

-- Update the URL for Inspirational Video 2
UPDATE inspiration_sources 
SET url = 'https://www.youtube.com/watch?v=xqb1hfgfcl8'
WHERE title = 'Inspirational Video 2' AND sequence_number = 2;

-- Update the URL for Inspirational Video 4
UPDATE inspiration_sources 
SET url = 'https://youtu.be/X9wViEY5tPQ?si=qDOuMSUatButKwZk'
WHERE title = 'Inspirational Video 4' AND sequence_number = 4;

-- Update the URL for Inspirational Video 6
UPDATE inspiration_sources 
SET url = 'https://youtu.be/GPeeZ6viNgY?si=sg4hFF33p3cF4X25'
WHERE title = 'Inspirational Video 6' AND sequence_number = 6;

-- Verify the updates
SELECT title, url, sequence_number 
FROM inspiration_sources 
WHERE sequence_number IN (1, 2, 4, 6)
ORDER BY sequence_number;
