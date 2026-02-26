-- Add recurrence column to receitas (mensal, semanal, diaria, or null for one-time)
ALTER TABLE public.receitas ADD COLUMN recurrence text DEFAULT NULL;