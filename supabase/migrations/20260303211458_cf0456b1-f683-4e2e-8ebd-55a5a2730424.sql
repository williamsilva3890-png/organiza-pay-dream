
-- Friends table to track friend relationships
CREATE TABLE public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friends" ON public.friends
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert own friends" ON public.friends
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own friends" ON public.friends
FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Allow all authenticated users to read each other's profiles (for friend names/avatars in chat)
CREATE POLICY "Authenticated can read profiles for chat" ON public.profiles
FOR SELECT USING (true);
