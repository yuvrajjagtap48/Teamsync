-- Fix project creation and visibility for all users

-- Drop and recreate the INSERT policy to allow anyone to create projects where they are the manager
DROP POLICY IF EXISTS "Admins and managers can create projects" ON public.projects;

CREATE POLICY "Users can create projects where they are manager"
ON public.projects
FOR INSERT
WITH CHECK (manager_id = auth.uid());

-- Create a function to automatically add the creator as a project member
CREATE OR REPLACE FUNCTION public.add_creator_as_project_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only add if manager_id is set
  IF NEW.manager_id IS NOT NULL THEN
    INSERT INTO public.project_members (project_id, user_id)
    VALUES (NEW.id, NEW.manager_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically add creator as project member
DROP TRIGGER IF EXISTS on_project_created ON public.projects;

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.add_creator_as_project_member();