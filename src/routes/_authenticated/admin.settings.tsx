import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminGetSystemSettings, adminUpdateSystemSettings } from "@/lib/admin.functions";
import { requireSuperAdminRoute } from "@/lib/admin-route";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  beforeLoad: requireSuperAdminRoute,
  component: SystemSettingsPage,
});

const defaults = {
  platform_name: "Trader Unit",
  min_deposit: 10,
  min_withdrawal: 1,
  deposit_fee_rate: 0.05,
  withdrawal_fee_rate: 0.32,
  trade_profit_rate: 15,
  kyc_enabled: true,
  crypto_deposits_enabled: true,
  maintenance_mode: false,
};

function SystemSettingsPage() {
  const getFn = useServerFn(adminGetSystemSettings);
  const updateFn = useServerFn(adminUpdateSystemSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-system-settings"], queryFn: () => getFn() });
  const [form, setForm] = useState<any>(defaults);

  useEffect(() => {
    if (data) setForm({ ...defaults, ...data, trade_profit_rate: Number(data.trade_profit_rate ?? 0.15) * 100 });
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateFn({
      data: {
        ...form,
        min_deposit: Number(form.min_deposit),
        min_withdrawal: Number(form.min_withdrawal),
        deposit_fee_rate: Number(form.deposit_fee_rate),
        withdrawal_fee_rate: Number(form.withdrawal_fee_rate),
        trade_profit_rate: Number(form.trade_profit_rate) / 100,
      },
    }),
    onSuccess: () => {
      toast.success("System settings saved");
      qc.invalidateQueries({ queryKey: ["admin-system-settings"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save settings"),
  });

  const set = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));

  return (
    <AdminShell title="System Settings">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-base font-semibold">Core operating controls</h2>
          <p className="mt-1 text-xs text-muted-foreground">Only super admins can change these values.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Platform name" value={form.platform_name} onChange={(v) => set("platform_name", v)} />
            <Field label="Minimum deposit (KES)" type="number" value={form.min_deposit} onChange={(v) => set("min_deposit", v)} />
            <Field label="Minimum withdrawal (KES)" type="number" value={form.min_withdrawal} onChange={(v) => set("min_withdrawal", v)} />
            <Field label="Deposit fee / service rate" type="number" step="0.001" value={form.deposit_fee_rate} onChange={(v) => set("deposit_fee_rate", v)} />
            <Field label="Withdrawal fee rate" type="number" step="0.001" value={form.withdrawal_fee_rate} onChange={(v) => set("withdrawal_fee_rate", v)} />
            <Field label="Profit earned per successful trade (%)" type="number" step="0.1" value={form.trade_profit_rate} onChange={(v) => set("trade_profit_rate", v)} />
          </div>
          <div className="mt-5 space-y-3 border-t border-border/60 pt-4">
            <Toggle label="Allow crypto deposits" checked={!!form.crypto_deposits_enabled} onChange={(v) => set("crypto_deposits_enabled", v)} />
            <Toggle label="Require KYC verification for trading, deposits, and withdrawals" checked={!!form.kyc_enabled} onChange={(v) => set("kyc_enabled", v)} />
            <Toggle label="Maintenance mode" checked={!!form.maintenance_mode} onChange={(v) => set("maintenance_mode", v)} />
          </div>
          <Button className="mt-5 gradient-gold" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save system settings"}
          </Button>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs text-muted-foreground">
          Rates use decimal form: 0.05 means 5%. Changes apply to new deposit and withdrawal requests.
        </div>
      </div>
    </AdminShell>
  );
}

function Field({ label, value, onChange, type = "text", step }: { label: string; value: any; onChange: (v: string) => void; type?: string; step?: string }) {
  return <div><Label>{label}</Label><Input type={type} step={step} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
