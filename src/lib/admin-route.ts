import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function requireAdminRoute() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/auth" });

  const { data: role, error: roleError } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();

  if (roleError || !["admin", "super_admin"].includes(role?.role)) {
    throw redirect({ to: "/home", replace: true });
  }
}

export async function requireSuperAdminRoute() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/auth" });
  const { data: role, error: roleError } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "super_admin")
    .maybeSingle();
  if (roleError || role?.role !== "super_admin") throw redirect({ to: "/home", replace: true });
}
