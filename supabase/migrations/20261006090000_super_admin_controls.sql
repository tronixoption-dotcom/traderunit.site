-- Role hierarchy and super-admin controlled operating settings.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

ALTER TABLE public.treasury_settings
  ADD COLUMN IF NOT EXISTS platform_name TEXT NOT NULL DEFAULT 'Trader Unit',
  ADD COLUMN IF NOT EXISTS min_deposit NUMERIC(14,2) NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS min_withdrawal NUMERIC(14,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deposit_fee_rate NUMERIC(8,5) NOT NULL DEFAULT 0.05,
  ADD COLUMN IF NOT EXISTS withdrawal_fee_rate NUMERIC(8,5) NOT NULL DEFAULT 0.32,
  ADD COLUMN IF NOT EXISTS crypto_deposits_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT false;

UPDATE public.treasury_settings
SET platform_name = COALESCE(NULLIF(platform_name, ''), 'Trader Unit');

DROP POLICY IF EXISTS "treasury_settings_admin_read" ON public.treasury_settings;
CREATE POLICY "treasury_settings_admin_read" ON public.treasury_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "treasury_settings_admin_update" ON public.treasury_settings;
CREATE POLICY "treasury_settings_admin_update" ON public.treasury_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
