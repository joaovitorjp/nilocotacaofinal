-- Create user using Supabase auth signup (this avoids the trigger issue)
-- We'll do this by creating a simple signup function and calling it
CREATE OR REPLACE FUNCTION create_initial_user()
RETURNS void AS $$
BEGIN
  -- This will be done via the application instead
  RAISE NOTICE 'User creation should be done via application signup endpoint';
END;
$$ LANGUAGE plpgsql;