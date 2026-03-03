-- Allow admins to update any subscription
CREATE POLICY "Admins can update any subscription"
ON public.subscriptions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
