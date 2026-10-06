import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { adminListDeposits, adminApproveDeposit, adminGetCryptoDepositSettings, adminUpdateCryptoDepositSettings, adminGetAccess } from "@/lib/admin.functions";
import { AdminShell } from "@/components/layout/admin-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { requireAdminRoute } from "@/lib/admin-route";

export const Route = createFileRoute("/_authenticated/admin/deposits")({
  beforeLoad: requireAdminRoute,
  component: DepositsPage,
});

const fmt = (n: any) => `KES ${Number(n).toLocaleString()}`;

function DepositsPage() {
  const listFn = useServerFn(adminListDeposits);
  const actFn = useServerFn(adminApproveDeposit);
  const settingsFn = useServerFn(adminGetCryptoDepositSettings);
  const updateSettingsFn = useServerFn(adminUpdateCryptoDepositSettings);
  const accessFn = useServerFn(adminGetAccess);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-deposits"], queryFn: () => listFn() });
  const { data: access } = useQuery({ queryKey: ["admin-access"], queryFn: () => accessFn() });
  const { data: cryptoSettings } = useQuery({ queryKey: ["admin-crypto-settings"], queryFn: () => settingsFn(), enabled: access?.role === "super_admin" });
  const [walletAddress, setWalletAddress] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const [network, setNetwork] = useState("TRC20");
  useEffect(() => {
    if (cryptoSettings) {
      setWalletAddress(cryptoSettings.wallet_address ?? "");
      setCurrency(cryptoSettings.currency ?? "USDT");
      setNetwork(cryptoSettings.network ?? "TRC20");
    }
  }, [cryptoSettings]);
  const act = useMutation({
    mutationFn: (args: { deposit_id: string; approve: boolean }) => actFn({ data: args }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-deposits"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const saveSettings = useMutation({
    mutationFn: () => updateSettingsFn({ data: { wallet_address: walletAddress, currency, network } }),
    onSuccess: () => { toast.success("Crypto deposit wallet updated"); qc.invalidateQueries({ queryKey: ["admin-crypto-settings"] }); },
    onError: (e: any) => toast.error(e.message ?? "Could not update wallet"),
  });

  return (
    <AdminShell title="Deposits">
      {access?.role === "super_admin" && <div className="mb-4 glass-card rounded-2xl p-4">
        <div className="mb-3"><div className="text-sm font-semibold">Crypto deposit wallet</div><div className="text-xs text-muted-foreground">Clients send crypto here and wait for your approval.</div></div>
        <div className="grid gap-3 md:grid-cols-[1fr_140px_140px_auto] md:items-end">
          <div><Label>Wallet address</Label><Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="Enter receiving wallet address" /></div>
          <div><Label>Currency</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
          <div><Label>Network</Label><Input value={network} onChange={(e) => setNetwork(e.target.value)} /></div>
          <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>{saveSettings.isPending ? "Saving..." : "Save wallet"}</Button>
        </div>
      </div>}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[1fr_120px_140px_140px_180px] gap-2 border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
          <div>User</div>
          <div>Amount</div>
          <div>Receipt / Tx hash</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {(data ?? []).map((d: any) => (
          <div
            key={d.id}
            className="grid grid-cols-[1fr_120px_140px_140px_180px] items-center gap-2 border-b border-border/40 px-4 py-3 text-sm last:border-0"
          >
            <div>
              <div className="font-medium">
                {d.profile?.full_name || d.profile?.email || d.user_id.slice(0, 8)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {d.mpesa_phone} · {new Date(d.created_at).toLocaleString()}
              </div>
            </div>
            <div>{fmt(d.amount)}</div>
            <div className="text-xs">{d.mpesa_receipt ?? "—"}</div>
            <div>
              <StatusBadge s={d.status} />
              {d.crypto_tx_hash && <div className="mt-1 max-w-[140px] truncate text-[10px] text-muted-foreground" title={d.crypto_tx_hash}>tx: {d.crypto_tx_hash}</div>}
            </div>
            <div>
              {access?.role === "super_admin" && d.status === "pending" && (
                <div className="flex gap-1">
                  <button
                    onClick={() => act.mutate({ deposit_id: d.id, approve: true })}
                    className="rounded-md bg-success/20 px-3 py-1 text-xs text-success"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act.mutate({ deposit_id: d.id, approve: false })}
                    className="rounded-md bg-destructive/20 px-3 py-1 text-xs text-destructive"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {(data ?? []).length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No deposits yet.</div>
        )}
      </div>
    </AdminShell>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/20 text-warning",
    success: "bg-success/20 text-success",
    failed: "bg-destructive/20 text-destructive",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${map[s] ?? "bg-muted text-muted-foreground"}`}
    >
      {s}
    </span>
  );
}
