-- Fix 1: Restrict profiles table visibility to only shared project members
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a more restrictive policy
CREATE POLICY "Users can view profiles in shared projects"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id  -- Users can always see their own profile
    OR EXISTS (
      SELECT 1 FROM public.project_members pm1
      INNER JOIN public.project_members pm2 
        ON pm1.project_id = pm2.project_id
      WHERE pm1.user_id = auth.uid()
        AND pm2.user_id = profiles.id
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Fix 2: Secure notifications creation with a server-side function
-- Drop the permissive INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a secure function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _title TEXT,
  _message TEXT,
  _type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Validate inputs
  IF _user_id IS NULL OR _title IS NULL OR _message IS NULL OR _type IS NULL THEN
    RAISE EXCEPTION 'All parameters are required';
  END IF;
  
  -- Create the notification
  INSERT INTO public.notifications (user_id, title, message, type, read)
  VALUES (_user_id, _title, _message, _type, false)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_notification IS 'Securely creates notifications with validation. Only callable by authenticated users.';