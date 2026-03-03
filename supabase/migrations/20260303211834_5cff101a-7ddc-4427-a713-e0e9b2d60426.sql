
-- Add admin reply column to suggestions
ALTER TABLE public.suggestions ADD COLUMN admin_reply text DEFAULT NULL;
ALTER TABLE public.suggestions ADD COLUMN replied_at timestamptz DEFAULT NULL;
