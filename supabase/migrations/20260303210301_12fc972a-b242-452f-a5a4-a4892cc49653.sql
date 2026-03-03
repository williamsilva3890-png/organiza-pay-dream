
-- Add chat_type column to distinguish admin vs friends chat
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS chat_type text NOT NULL DEFAULT 'friends';

-- Allow users to delete their OWN messages
CREATE POLICY "Users can delete own chat messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Drop the admin-only delete policy since now both users and admins can delete
DROP POLICY IF EXISTS "Admins can delete chat messages" ON public.chat_messages;

-- Re-create admin policy to also allow admins to delete any message
CREATE POLICY "Admins can delete any chat messages"
ON public.chat_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create referral_codes table
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code"
ON public.referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Authenticated can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referred_id);

-- Admins can see all referrals
CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
