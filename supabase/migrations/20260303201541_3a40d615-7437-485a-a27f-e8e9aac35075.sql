
-- Add expiration date to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS expires_at date;

-- Create admin_messages table for broadcast messages
CREATE TABLE public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read admin messages
CREATE POLICY "Anyone can read admin messages"
ON public.admin_messages FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert admin messages"
ON public.admin_messages FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete admin messages"
ON public.admin_messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
