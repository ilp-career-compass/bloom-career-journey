-- Update assessment-audio bucket to allow audio/webm with codecs parameter
-- The recorder uses 'audio/webm;codecs=opus' which needs to be explicitly allowed

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/ogg',
  'audio/ogg;codecs=opus', 
  'audio/wav',
  'audio/mpeg',
  'audio/mp3'
]
WHERE id = 'assessment-audio';

-- Add comment
COMMENT ON TABLE storage.buckets IS 'Storage buckets with updated MIME type support for audio codecs';

