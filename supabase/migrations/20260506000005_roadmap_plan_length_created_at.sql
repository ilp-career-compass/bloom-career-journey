-- G15: Add max-length CHECK constraints on plan_a/b/c columns (500 chars each).
--      NOT VALID skips validating existing rows; only new inserts/updates are enforced.
-- G16: Add created_at column so first-fill timestamps are preserved.

BEGIN;

-- created_at: existing rows get the migration timestamp as a proxy for creation time
ALTER TABLE career_roadmap
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Length guards on plan columns — 500 chars is generous for a career choice field
ALTER TABLE career_roadmap
  ADD CONSTRAINT career_roadmap_plan_a_length CHECK (char_length(plan_a) <= 500) NOT VALID;

ALTER TABLE career_roadmap
  ADD CONSTRAINT career_roadmap_plan_b_length CHECK (char_length(plan_b) <= 500) NOT VALID;

ALTER TABLE career_roadmap
  ADD CONSTRAINT career_roadmap_plan_c_length CHECK (char_length(plan_c) <= 500) NOT VALID;

COMMIT;
