-- Drop the stale inspiration_videos table.
-- This table (created in 20250125000002) was superseded by inspiration_sources when
-- the get_inspiration_videos RPC was rewritten in 20260325000001 to query
-- inspiration_sources instead. No application code queries this table directly.
-- The RLS policy added in 20260401000002 goes with it.

DROP TABLE IF EXISTS inspiration_videos;
