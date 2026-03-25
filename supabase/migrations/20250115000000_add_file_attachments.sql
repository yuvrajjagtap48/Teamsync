-- Create file_attachments table
CREATE TABLE public.file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'project')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_file_attachments_entity ON public.file_attachments(entity_type, entity_id);
CREATE INDEX idx_file_attachments_uploaded_by ON public.file_attachments(uploaded_by);

-- Enable Row Level Security
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_attachments
CREATE POLICY "Users can view attachments for their projects"
  ON public.file_attachments FOR SELECT
  TO authenticated
  USING (
    entity_type = 'project' AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = entity_id AND (
          manager_id = auth.uid()
          OR public.is_project_member(auth.uid(), id)
        )
      )
    )
    OR entity_type = 'task' AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.tasks
        WHERE id = entity_id AND public.is_project_member(auth.uid(), project_id)
      )
    )
  );

CREATE POLICY "Project members can upload attachments"
  ON public.file_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      entity_type = 'project' AND (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
          SELECT 1 FROM public.projects
          WHERE id = entity_id AND (
            manager_id = auth.uid()
            OR public.is_project_member(auth.uid(), id)
          )
        )
      )
      OR entity_type = 'task' AND (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
          SELECT 1 FROM public.tasks
          WHERE id = entity_id AND public.is_project_member(auth.uid(), project_id)
        )
      )
    )
  );

CREATE POLICY "Project members can delete attachments"
  ON public.file_attachments FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR (
      entity_type = 'project' AND (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
          SELECT 1 FROM public.projects
          WHERE id = entity_id AND manager_id = auth.uid()
        )
      )
      OR entity_type = 'task' AND (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
          SELECT 1 FROM public.tasks
          WHERE id = entity_id AND public.is_project_member(auth.uid(), project_id)
        )
      )
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_file_attachments_updated_at
  BEFORE UPDATE ON public.file_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true);

-- Set up storage policies
CREATE POLICY "Users can view attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'attachments');

CREATE POLICY "Users can upload attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Users can delete their own attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'attachments');
