-- Drop both restrictive INSERT policies and replace with a single permissive one
DROP POLICY IF EXISTS "Users can insert own despesas" ON public.despesas;
DROP POLICY IF EXISTS "Friends can insert debts for friends" ON public.despesas;

CREATE POLICY "Users can insert despesas"
ON public.despesas
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR
  (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM friends
      WHERE (friends.user_id = auth.uid() AND friends.friend_id = despesas.user_id)
         OR (friends.friend_id = auth.uid() AND friends.user_id = despesas.user_id)
    )
  )
);