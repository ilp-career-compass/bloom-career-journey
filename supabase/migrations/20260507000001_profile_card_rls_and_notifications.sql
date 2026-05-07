-- Fix H1: Add INSERT policy for teachers on profile_card_cache
-- Teachers trigger keyword regen after rejection; the upsert needs INSERT permission
-- when no cache row exists yet for that module.
CREATE POLICY "Teachers can insert profile card cache for their students"
  ON profile_card_cache FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN teachers t ON t.state_id = c.state_id
      WHERE s.user_id = student_id
        AND t.user_id = auth.uid()
    )
  );

-- Fix H3: Add profile_card_rejected notification type so rejection notifications
-- can be sent to students via create_notification_secure RPC.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'profile_card_rejected';
