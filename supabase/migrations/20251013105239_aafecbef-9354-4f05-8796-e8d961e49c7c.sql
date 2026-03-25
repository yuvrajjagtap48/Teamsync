-- Create file_attachments table for file uploads
CREATE TABLE public.file_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files in their projects"
ON public.file_attachments FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  uploaded_by = auth.uid() OR
  (entity_type = 'task' AND EXISTS (
    SELECT 1 FROM tasks WHERE id = entity_id AND is_project_member(auth.uid(), project_id)
  )) OR
  (entity_type = 'project' AND is_project_member(auth.uid(), entity_id))
);

CREATE POLICY "Users can upload files to their projects"
ON public.file_attachments FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid() AND (
    (entity_type = 'task' AND EXISTS (
      SELECT 1 FROM tasks WHERE id = entity_id AND is_project_member(auth.uid(), project_id)
    )) OR
    (entity_type = 'project' AND is_project_member(auth.uid(), entity_id))
  )
);

CREATE POLICY "Users can delete their own uploads"
ON public.file_attachments FOR DELETE
USING (uploaded_by = auth.uid());

-- Create project_templates table
CREATE TABLE public.project_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  template_data JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view templates"
ON public.project_templates FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can create templates"
ON public.project_templates FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and creators can update templates"
ON public.project_templates FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid());

CREATE POLICY "Admins can delete templates"
ON public.project_templates FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create template_tasks table
CREATE TABLE public.template_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  estimated_hours INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.template_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view template tasks"
ON public.template_tasks FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can manage template tasks"
ON public.template_tasks FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create chat_channels table first
CREATE TABLE public.chat_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'project',
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Create channel_members table
CREATE TABLE public.channel_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Now add RLS policies for chat_channels (after channel_members exists)
CREATE POLICY "Users can view channels in their projects"
ON public.chat_channels FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  created_by = auth.uid() OR
  (project_id IS NOT NULL AND is_project_member(auth.uid(), project_id)) OR
  EXISTS (SELECT 1 FROM channel_members WHERE channel_id = chat_channels.id AND user_id = auth.uid())
);

CREATE POLICY "Project members can create channels"
ON public.chat_channels FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  (project_id IS NULL OR is_project_member(auth.uid(), project_id))
);

CREATE POLICY "Channel creators and admins can update channels"
ON public.chat_channels FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid());

CREATE POLICY "Admins can delete channels"
ON public.chat_channels FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policies for channel_members
CREATE POLICY "Users can view channel members"
ON public.channel_members FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM chat_channels WHERE id = channel_id AND created_by = auth.uid())
);

CREATE POLICY "Channel creators can add members"
ON public.channel_members FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM chat_channels WHERE id = channel_id AND created_by = auth.uid())
);

CREATE POLICY "Users can leave channels"
ON public.channel_members FOR DELETE
USING (user_id = auth.uid());

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  reply_to UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their channels"
ON public.chat_messages FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM chat_channels 
    WHERE id = channel_id AND (
      created_by = auth.uid() OR
      (project_id IS NOT NULL AND is_project_member(auth.uid(), project_id)) OR
      EXISTS (SELECT 1 FROM channel_members WHERE channel_id = chat_channels.id AND user_id = auth.uid())
    )
  )
);

CREATE POLICY "Channel members can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM chat_channels 
    WHERE id = channel_id AND (
      created_by = auth.uid() OR
      (project_id IS NOT NULL AND is_project_member(auth.uid(), project_id)) OR
      EXISTS (SELECT 1 FROM channel_members WHERE channel_id = chat_channels.id AND user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can update their own messages"
ON public.chat_messages FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages FOR DELETE
USING (user_id = auth.uid());

-- Create time_entries table
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view time entries in their projects"
ON public.time_entries FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  user_id = auth.uid() OR
  (project_id IS NOT NULL AND is_project_member(auth.uid(), project_id))
);

CREATE POLICY "Users can create their own time entries"
ON public.time_entries FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  (project_id IS NULL OR is_project_member(auth.uid(), project_id))
);

CREATE POLICY "Users can update their own time entries"
ON public.time_entries FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own time entries"
ON public.time_entries FOR DELETE
USING (user_id = auth.uid());

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_file_attachments_updated_at
BEFORE UPDATE ON public.file_attachments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_templates_updated_at
BEFORE UPDATE ON public.project_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_channels_updated_at
BEFORE UPDATE ON public.chat_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
BEFORE UPDATE ON public.time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();