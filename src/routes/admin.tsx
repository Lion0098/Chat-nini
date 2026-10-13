import { createFileRoute } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AdminScreen } from "@/components/admin-screen";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="grid h-dvh place-items-center bg-shell" />;
  if (!user) return <RedirectToSignIn />;
  return <AdminScreen />;
}
