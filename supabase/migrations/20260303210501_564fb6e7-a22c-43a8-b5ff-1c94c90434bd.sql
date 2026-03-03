
-- Allow anyone authenticated to read referral codes (needed for signup referral lookup)
DROP POLICY IF EXISTS "Users can view own referral code" ON public.referral_codes;
CREATE POLICY "Authenticated can read referral codes"
ON public.referral_codes FOR SELECT
USING (true);
