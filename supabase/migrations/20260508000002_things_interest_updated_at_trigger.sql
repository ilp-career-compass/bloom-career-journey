-- Add updated_at auto-update trigger to things_that_interest_me.
-- update_updated_at_column() already exists (created in 20250116000001).
-- Removes the need to set updated_at manually from the client.

CREATE TRIGGER things_that_interest_me_set_updated_at
  BEFORE UPDATE ON things_that_interest_me
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
