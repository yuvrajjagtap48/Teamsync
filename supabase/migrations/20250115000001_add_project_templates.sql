-- Create project_templates table
CREATE TABLE public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  template_data JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create template_tasks table for predefined tasks in templates
CREATE TABLE public.template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.project_templates(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority NOT NULL DEFAULT 'medium',
  estimated_hours INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_project_templates_category ON public.project_templates(category);
CREATE INDEX idx_project_templates_public ON public.project_templates(is_public);
CREATE INDEX idx_template_tasks_template ON public.template_tasks(template_id);

-- Enable Row Level Security
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_templates
CREATE POLICY "Users can view public templates"
  ON public.project_templates FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can view their own templates"
  ON public.project_templates FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create templates"
  ON public.project_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON public.project_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON public.project_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for template_tasks
CREATE POLICY "Users can view tasks for accessible templates"
  ON public.template_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_templates
      WHERE id = template_id AND (
        is_public = true OR created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage tasks for their templates"
  ON public.template_tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_templates
      WHERE id = template_id AND created_by = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON public.project_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default templates
INSERT INTO public.project_templates (name, description, category, template_data, is_public) VALUES
('Web Development Project', 'A complete web development project template with frontend, backend, and deployment tasks', 'development', '{"phases": ["Planning", "Development", "Testing", "Deployment"], "technologies": ["React", "Node.js", "Database"]}', true),
('Mobile App Development', 'Template for mobile application development project', 'development', '{"phases": ["Design", "Development", "Testing", "App Store"], "platforms": ["iOS", "Android"]}', true),
('Marketing Campaign', 'Template for marketing campaign project', 'marketing', '{"phases": ["Strategy", "Content Creation", "Execution", "Analysis"], "channels": ["Social Media", "Email", "SEO"]}', true),
('Product Launch', 'Template for product launch project', 'product', '{"phases": ["Planning", "Development", "Testing", "Launch"], "departments": ["Product", "Marketing", "Sales"]}', true),
('Event Planning', 'Template for event planning project', 'events', '{"phases": ["Planning", "Preparation", "Execution", "Follow-up"], "components": ["Venue", "Catering", "Entertainment"]}', true);

-- Insert template tasks for Web Development Project
INSERT INTO public.template_tasks (template_id, title, description, priority, estimated_hours, order_index)
SELECT 
  pt.id,
  task_data.title,
  task_data.description,
  task_data.priority::task_priority,
  task_data.estimated_hours,
  task_data.order_index
FROM public.project_templates pt,
LATERAL (
  VALUES 
    ('Project Setup', 'Initialize project structure and development environment', 'high', 4, 1),
    ('Database Design', 'Design and implement database schema', 'high', 8, 2),
    ('Backend API Development', 'Develop REST API endpoints', 'medium', 16, 3),
    ('Frontend Development', 'Build user interface components', 'medium', 20, 4),
    ('Authentication System', 'Implement user authentication and authorization', 'high', 6, 5),
    ('Testing', 'Write and execute unit and integration tests', 'medium', 12, 6),
    ('Deployment Setup', 'Configure production environment and CI/CD', 'high', 8, 7),
    ('Documentation', 'Create project documentation and user guides', 'low', 4, 8)
) AS task_data(title, description, priority, estimated_hours, order_index)
WHERE pt.name = 'Web Development Project';
