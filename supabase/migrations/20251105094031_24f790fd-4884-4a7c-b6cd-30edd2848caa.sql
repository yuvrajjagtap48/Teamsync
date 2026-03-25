-- Drop the existing foreign key constraint on profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make the profiles table standalone for demo purposes
-- This allows adding sample team members without requiring auth.users entries
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();