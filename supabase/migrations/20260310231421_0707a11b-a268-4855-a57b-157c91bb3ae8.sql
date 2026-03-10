ALTER TABLE public.despesas DROP CONSTRAINT despesas_type_check;
ALTER TABLE public.despesas ADD CONSTRAINT despesas_type_check CHECK (type IN ('gasto', 'divida', 'assinatura'));