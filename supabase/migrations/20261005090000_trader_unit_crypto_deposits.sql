-- Trader Unit crypto deposit configuration and manual approval support.
CREATE TABLE IF NOT EXISTS public.crypto_deposit_settings (
  id INT PRIMARY KEY DEFAULT 1,
  wallet_address TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USDT',
  network TEXT NOT NULL DEFAULT 'TRC20',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT crypto_deposit_settings_single_row CHECK (id = 1)
);

INSERT INTO public.crypto_deposit_settings (id, wallet_address, currency, network)
VALUES (1, '', 'USDT', 'TRC20')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS deposit_method TEXT NOT NULL DEFAULT 'mpesa';
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS crypto_amount NUMERIC(24,8);
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS crypto_currency TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS crypto_network TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS crypto_tx_hash TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT;

CREATE INDEX IF NOT EXISTS idx_deposits_method_status
  ON public.deposits(deposit_method, status, created_at DESC);

ALTER TABLE public.crypto_deposit_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crypto_settings_authenticated_read" ON public.crypto_deposit_settings;
CREATE POLICY "crypto_settings_authenticated_read"
  ON public.crypto_deposit_settings FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.crypto_deposit_settings TO authenticated;
GRANT ALL ON public.crypto_deposit_settings TO service_role;
