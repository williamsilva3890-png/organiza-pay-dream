
-- Add columns to despesas for friend-created debts
ALTER TABLE public.despesas ADD COLUMN created_by uuid DEFAULT NULL;
ALTER TABLE public.despesas ADD COLUMN creditor_name text DEFAULT NULL;

-- Allow friends to insert debts for other users (the friend)
CREATE POLICY "Friends can insert debts for friends" ON public.despesas
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  OR (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.friends 
      WHERE (user_id = auth.uid() AND friend_id = public.despesas.user_id)
         OR (friend_id = auth.uid() AND user_id = public.despesas.user_id)
    )
  )
);
