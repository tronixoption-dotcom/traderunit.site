-- Super-admin controls for copy-trade profit and platform KYC enforcement.
ALTER TABLE public.treasury_settings
  ADD COLUMN IF NOT EXISTS trade_profit_rate NUMERIC(8,5) NOT NULL DEFAULT 0.15,
  ADD COLUMN IF NOT EXISTS kyc_enabled BOOLEAN NOT NULL DEFAULT true;
