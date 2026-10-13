import { useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { usePrefs } from "@/lib/prefs";
import { getPublicConfig } from "@/server/api";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const { t, locale, setLocale } = usePrefs();
  const cfg = useQuery({ queryKey: ["public-config"], queryFn: () => getPublicConfig() });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return <div className="grid h-dvh place-items-center bg-shell text-sm text-muted">{t("appName")}</div>;
  }
  if (user) return <Navigate to="/" />;
  if (!authEnabled) return <RedirectToSignIn to="/" />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup") {
      if (cfg.data && !cfg.data.allowSignups) {
        toast.error(t("signupsClosed"));
        return;
      }
      if (password.length < 8) {
        toast.error(t("passwordShort"));
        return;
      }
      if (password !== confirm) {
        toast.error(t("passwordMismatch"));
        return;
      }
      if (!/^[a-zA-Z0-9._]{3,24}$/.test(username)) {
        toast.error(t("errUsernameBad"));
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await authClient.signUp.email({ email, password, name: name || username });
        if (res.error) {
          toast.error(res.error.message || t("authFailed"));
          return;
        }
        const { saveProfile } = await import("@/server/api");
        await saveProfile({ data: { username, displayName: name || username, locale } });
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) {
          toast.error(res.error.message || t("authFailed"));
          return;
        }
      }
      await navigate({ to: "/" });
    } catch {
      toast.error(t("authFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-shell lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-green p-10 text-on lg:flex">
        <div className="text-2xl font-bold">{t("appName")}</div>
        <div>
          <div className="grid size-20 place-items-center rounded-full bg-on/15 text-4xl font-bold">ن</div>
          <h1 className="mt-6 text-4xl font-semibold">{t("appName")}</h1>
          <p className="mt-3 max-w-sm text-on/85">{t("tagline")}</p>
        </div>
        <p className="text-sm text-on/75">{t("storageNote")}</p>
      </section>
      <section className="grid place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-panel p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold lg:hidden">{t("appName")}</h2>
            <div className="flex gap-2 text-sm">
              <button type="button" onClick={() => setLocale("fa")} className={locale === "fa" ? "font-semibold text-green-2" : "text-muted"}>
                {t("langFa")}
              </button>
              <button type="button" onClick={() => setLocale("en")} className={locale === "en" ? "font-semibold text-green-2" : "text-muted"}>
                {t("langEn")}
              </button>
            </div>
          </div>
          {cfg.data?.maintenance ? (
            <p className="mb-3 rounded-lg bg-header px-3 py-2 text-sm">{cfg.data.maintenance}</p>
          ) : null}
          <div className="mb-4 grid grid-cols-2 rounded-full bg-header p-1 text-sm">
            <button type="button" onClick={() => setMode("login")} className={`h-10 rounded-full ${mode === "login" ? "bg-panel font-medium shadow" : ""}`}>
              {t("login")}
            </button>
            <button type="button" onClick={() => setMode("signup")} className={`h-10 rounded-full ${mode === "signup" ? "bg-panel font-medium shadow" : ""}`}>
              {t("signup")}
            </button>
          </div>
          <form onSubmit={(e) => void submit(e)} className="space-y-3">
            {mode === "signup" ? (
              <>
                <Lab label={t("name")} value={name} onChange={setName} autoComplete="name" />
                <Lab label={t("username")} value={username} onChange={setUsername} autoComplete="username" />
              </>
            ) : null}
            <Lab label={t("email")} value={email} onChange={setEmail} type="email" autoComplete="email" />
            <Lab label={t("password")} value={password} onChange={setPassword} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            {mode === "signup" ? (
              <Lab label={t("confirmPassword")} value={confirm} onChange={setConfirm} type="password" autoComplete="new-password" />
            ) : null}
            <button disabled={busy} className="h-11 w-full rounded-full bg-green font-medium text-on disabled:opacity-60">
              {mode === "signup" ? t("signup") : t("login")}
            </button>
          </form>
          <div className="my-4 text-center text-xs text-muted">{t("or")}</div>
          <div className="space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="h-11 w-full rounded-full bg-header text-sm font-medium"
              >
                {p.providerId === "grok-google" ? t("continueGoogle") : t("continueX")}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Lab({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1 h-11 w-full rounded-lg bg-header px-3 outline-none ring-1 ring-transparent focus:ring-green-2"
      />
    </label>
  );
}
