
-- Table to manage couple account sharing (max 2 people)
CREATE TABLE public.shared_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  partner_id UUID,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(owner_id)
);

-- Ensure a user can only be a partner in ONE shared account
CREATE UNIQUE INDEX idx_shared_accounts_partner ON public.shared_accounts(partner_id) WHERE partner_id IS NOT NULL AND status = 'active';

-- Enable RLS
ALTER TABLE public.shared_accounts ENABLE ROW LEVEL SECURITY;

-- Owner can view their own shared account
CREATE POLICY "Owner can view shared account"
  ON public.shared_accounts FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = partner_id);

-- Owner can create a shared account (only if premium + casal profile)
CREATE POLICY "Owner can create shared account"
  ON public.shared_accounts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owner can update (to revoke or accept partner)
CREATE POLICY "Owner or partner can update shared account"
  ON public.shared_accounts FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = partner_id);

-- Owner can delete shared account
CREATE POLICY "Owner can delete shared account"
  ON public.shared_accounts FOR DELETE
  USING (auth.uid() = owner_id);

-- Function to accept invite by code
CREATE OR REPLACE FUNCTION public.accept_couple_invite(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shared shared_accounts%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  -- Find the invite
  SELECT * INTO v_shared FROM shared_accounts WHERE invite_code = p_code AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Código inválido ou já utilizado');
  END IF;

  -- Can't invite yourself
  IF v_shared.owner_id = v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Você não pode aceitar seu próprio convite');
  END IF;

  -- Check if user is already in another shared account (as owner or partner)
  IF EXISTS (SELECT 1 FROM shared_accounts WHERE owner_id = v_user_id AND status IN ('pending', 'active')) THEN
    RETURN json_build_object('success', false, 'error', 'Você já possui uma conta compartilhada');
  END IF;
  
  IF EXISTS (SELECT 1 FROM shared_accounts WHERE partner_id = v_user_id AND status = 'active') THEN
    RETURN json_build_object('success', false, 'error', 'Você já está vinculado(a) a outra conta');
  END IF;

  -- Accept the invite
  UPDATE shared_accounts 
  SET partner_id = v_user_id, status = 'active', updated_at = now()
  WHERE id = v_shared.id;

  RETURN json_build_object('success', true, 'message', 'Conta compartilhada com sucesso!');
END;
$$;

-- Update RLS on financial tables to allow shared access
-- Receitas: partner can also view owner's data
DROP POLICY IF EXISTS "Users can view own receitas" ON public.receitas;
CREATE POLICY "Users can view own or shared receitas"
  ON public.receitas FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = receitas.user_id)
        OR (partner_id = auth.uid() AND owner_id = receitas.user_id))
    )
  );

-- Receitas: partner can insert for the shared account
DROP POLICY IF EXISTS "Users can insert own receitas" ON public.receitas;
CREATE POLICY "Users can insert own or shared receitas"
  ON public.receitas FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = receitas.user_id)
        OR (partner_id = auth.uid() AND owner_id = receitas.user_id))
    )
  );

-- Receitas: partner can update
DROP POLICY IF EXISTS "Users can update own receitas" ON public.receitas;
CREATE POLICY "Users can update own or shared receitas"
  ON public.receitas FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = receitas.user_id)
        OR (partner_id = auth.uid() AND owner_id = receitas.user_id))
    )
  );

-- Receitas: partner can delete
DROP POLICY IF EXISTS "Users can delete own receitas" ON public.receitas;
CREATE POLICY "Users can delete own or shared receitas"
  ON public.receitas FOR DELETE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = receitas.user_id)
        OR (partner_id = auth.uid() AND owner_id = receitas.user_id))
    )
  );

-- Despesas: same pattern
DROP POLICY IF EXISTS "Users can view own despesas" ON public.despesas;
CREATE POLICY "Users can view own or shared despesas"
  ON public.despesas FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = despesas.user_id)
        OR (partner_id = auth.uid() AND owner_id = despesas.user_id))
    )
  );

DROP POLICY IF EXISTS "Users can update own despesas" ON public.despesas;
CREATE POLICY "Users can update own or shared despesas"
  ON public.despesas FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = despesas.user_id)
        OR (partner_id = auth.uid() AND owner_id = despesas.user_id))
    )
  );

DROP POLICY IF EXISTS "Users can delete own despesas" ON public.despesas;
CREATE POLICY "Users can delete own or shared despesas"
  ON public.despesas FOR DELETE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = despesas.user_id)
        OR (partner_id = auth.uid() AND owner_id = despesas.user_id))
    )
  );

-- Metas: same pattern
DROP POLICY IF EXISTS "Users can view own metas" ON public.metas;
CREATE POLICY "Users can view own or shared metas"
  ON public.metas FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = metas.user_id)
        OR (partner_id = auth.uid() AND owner_id = metas.user_id))
    )
  );

DROP POLICY IF EXISTS "Users can insert own metas" ON public.metas;
CREATE POLICY "Users can insert own or shared metas"
  ON public.metas FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = metas.user_id)
        OR (partner_id = auth.uid() AND owner_id = metas.user_id))
    )
  );

DROP POLICY IF EXISTS "Users can update own metas" ON public.metas;
CREATE POLICY "Users can update own or shared metas"
  ON public.metas FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = metas.user_id)
        OR (partner_id = auth.uid() AND owner_id = metas.user_id))
    )
  );

DROP POLICY IF EXISTS "Users can delete own metas" ON public.metas;
CREATE POLICY "Users can delete own or shared metas"
  ON public.metas FOR DELETE
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_accounts 
      WHERE status = 'active' 
      AND ((owner_id = auth.uid() AND partner_id = metas.user_id)
        OR (partner_id = auth.uid() AND owner_id = metas.user_id))
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_shared_accounts_updated_at
  BEFORE UPDATE ON public.shared_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
