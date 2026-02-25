-- Add paid column to despesas
ALTER TABLE public.despesas ADD COLUMN paid boolean NOT NULL DEFAULT false;