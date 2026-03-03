
-- Create chat_messages table for global chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text,
  user_email text,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Authenticated users can read chat" ON public.chat_messages
FOR SELECT TO authenticated USING (true);

-- Users can insert their own messages
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can delete any message
CREATE POLICY "Admins can delete chat messages" ON public.chat_messages
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for admin_messages and chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
