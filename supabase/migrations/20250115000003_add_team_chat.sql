-- Create chat_channels table
CREATE TABLE public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'direct')),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  reply_to UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create channel_members table
CREATE TABLE public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(channel_id, user_id)
);

-- Create indexes
CREATE INDEX idx_chat_channels_project ON public.chat_channels(project_id);
CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX idx_channel_members_channel ON public.channel_members(channel_id);
CREATE INDEX idx_channel_members_user ON public.channel_members(user_id);

-- Enable Row Level Security
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_channels
CREATE POLICY "Users can view channels they are members of"
  ON public.chat_channels FOR SELECT
  TO authenticated
  USING (
    type = 'public'
    OR EXISTS (
      SELECT 1 FROM public.channel_members
      WHERE channel_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create channels"
  ON public.chat_channels FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Channel creators can update channels"
  ON public.chat_channels FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Channel creators can delete channels"
  ON public.chat_channels FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in channels they are members of"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels
      WHERE id = channel_id AND (
        type = 'public'
        OR EXISTS (
          SELECT 1 FROM public.channel_members
          WHERE channel_id = chat_channels.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create messages in channels they are members of"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_channels
      WHERE id = channel_id AND (
        type = 'public'
        OR EXISTS (
          SELECT 1 FROM public.channel_members
          WHERE channel_id = chat_channels.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for channel_members
CREATE POLICY "Users can view channel members"
  ON public.channel_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels
      WHERE id = channel_id AND (
        type = 'public'
        OR EXISTS (
          SELECT 1 FROM public.channel_members cm2
          WHERE cm2.channel_id = chat_channels.id AND cm2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join public channels"
  ON public.channel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_channels
      WHERE id = channel_id AND type = 'public'
    )
  );

CREATE POLICY "Users can leave channels"
  ON public.channel_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_chat_channels_updated_at
  BEFORE UPDATE ON public.chat_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create default general channel
INSERT INTO public.chat_channels (name, description, type) VALUES
('General', 'General team discussion', 'public');

-- Add all users to general channel
INSERT INTO public.channel_members (channel_id, user_id)
SELECT 
  (SELECT id FROM public.chat_channels WHERE name = 'General' LIMIT 1),
  id
FROM public.profiles;

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
