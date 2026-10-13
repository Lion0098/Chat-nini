import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { usePrefs } from "@/lib/prefs";
import { formatChatTime } from "@/lib/format";
import {
  adminCreateUser,
  adminDeleteGroup,
  adminDeleteUser,
  adminGetSettings,
  adminListGroups,
  adminListReports,
  adminListUsers,
  adminSaveSettings,
  adminSaveUser,
  adminSetReport,
  adminUpdateGroup,
  getMe,
} from "@/server/api";

type Tab = "users" | "groups" | "reports" | "system";

export function AdminScreen() {
  const { t, err, locale } = usePrefs();
  const qc = useQueryClient();
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => getMe() });
  const [tab, setTab] = useState<Tab>("users");
  const [q, setQ] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const users = useQuery({
    queryKey: ["admin-users", q],
    queryFn: () => adminListUsers({ data: { q } }),
    enabled: meQ.data?.role === "admin" && tab === "users",
  });
  const groups = useQuery({
    queryKey: ["admin-groups", q],
    queryFn: () => adminListGroups({ data: { q } }),
    enabled: meQ.data?.role === "admin" && tab === "groups",
  });
  const reports = useQuery({
    queryKey: ["admin-reports", reportStatus],
    queryFn: () => adminListReports({ data: { status: reportStatus } }),
    enabled: meQ.data?.role === "admin" && tab === "reports",
  });
  const settings = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminGetSettings(),
    enabled: meQ.data?.role === "admin" && tab === "system",
  });
  const [draft, setDraft] = useState<{ email: string; password: string; displayName: string; username: string } | null>(null);

  if (meQ.isLoading) return <div className="grid h-dvh place-items-center bg-shell">{t("appName")}</div>;
  if (!meQ.data || meQ.data.role !== "admin") {
    return (
      <div className="grid h-dvh place-items-center bg-shell p-6 text-center">
        <div>
          <p>{t("notAdmin")}</p>
          <Link to="/" className="mt-3 inline-block text-green-2">{t("back")}</Link>
        </div>
      </div>
    );
  }

  const tabs: Tab[] = ["users", "groups", "reports", "system"];
  const label: Record<Tab, string> = { users: t("users"), groups: t("groups"), reports: t("reports"), system: t("system") };

  return (
    <div className="min-h-dvh bg-shell text-ink">
      <header className="flex h-14 items-center gap-2 bg-green px-3 text-on">
        <Link to="/" aria-label={t("back")} className="grid size-11 place-items-center">
          <ArrowRight className="size-5 rtl:rotate-180" />
        </Link>
        <h1 className="font-semibold">{t("adminTitle")}</h1>
      </header>
      <div className="mx-auto max-w-5xl p-4">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {tabs.map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`h-10 shrink-0 rounded-full px-4 text-sm ${tab === item ? "bg-green text-on" : "bg-panel"}`}>
              {label[item]}
            </button>
          ))}
        </div>
        {tab !== "reports" && tab !== "system" ? (
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchUsersPh")} className="mb-4 h-11 w-full rounded-lg bg-panel px-3 outline-none" />
        ) : null}
        {tab === "users" ? (
          <div className="space-y-3">
            <button type="button" onClick={() => setDraft({ email: "", password: "", displayName: "", username: "" })} className="h-10 rounded-full bg-green px-4 text-sm text-on">
              {t("createUser")}
            </button>
            {draft ? (
              <form
                className="grid gap-2 rounded-xl bg-panel p-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void adminCreateUser({ data: draft }).then((res) => {
                    if (!res.ok) toast.error(err(res.error));
                    else {
                      toast.success(t("userCreated"));
                      setDraft(null);
                      void qc.invalidateQueries({ queryKey: ["admin-users"] });
                    }
                  });
                }}
              >
                <input required placeholder={t("name")} value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} className="h-11 rounded-lg bg-header px-3" />
                <input required placeholder={t("username")} value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} className="h-11 rounded-lg bg-header px-3" />
                <input required type="email" placeholder={t("email")} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="h-11 rounded-lg bg-header px-3" />
                <input required type="text" placeholder={t("password")} value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} className="h-11 rounded-lg bg-header px-3" />
                <p className="text-xs text-muted sm:col-span-2">{t("passwordOnce")}</p>
                <div className="flex gap-2 sm:col-span-2">
                  <button className="h-10 rounded-full bg-green px-4 text-on">{t("create")}</button>
                  <button type="button" onClick={() => setDraft(null)} className="h-10 rounded-full bg-header px-4">{t("cancel")}</button>
                </div>
              </form>
            ) : null}
            <div className="overflow-x-auto rounded-xl bg-panel">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-line text-start">
                    <th className="px-3 py-2 font-medium">{t("name")}</th>
                    <th className="px-3 py-2 font-medium">{t("emailCol")}</th>
                    <th className="px-3 py-2 font-medium">{t("username")}</th>
                    <th className="px-3 py-2 font-medium">{t("role")}</th>
                    <th className="px-3 py-2 font-medium">{t("time")}</th>
                    <th className="px-3 py-2 font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(users.data ?? []).map((u) => (
                    <tr key={u.userId} className="border-b border-line">
                      <td className="px-3 py-2">{u.displayName}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">{u.username}</td>
                      <td className="px-3 py-2">{u.suspended ? t("ban") : u.role === "admin" ? t("adminRole") : t("userRole")}</td>
                      <td className="px-3 py-2">{formatChatTime(u.lastSeenAt, locale, t)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-green-2"
                            onClick={() => {
                              const displayName = window.prompt(t("name"), u.displayName) ?? u.displayName;
                              const username = window.prompt(t("username"), u.username ?? "") ?? u.username;
                              void adminSaveUser({ data: { userId: u.userId, displayName, username } }).then((res) => {
                                if (!res.ok) toast.error(err(res.error));
                                else void qc.invalidateQueries({ queryKey: ["admin-users"] });
                              });
                            }}
                          >
                            {t("edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void adminSaveUser({
                              data: { userId: u.userId, role: u.role === "admin" ? "user" : "admin" },
                            }).then((res) => {
                              if (!res.ok) toast.error(err(res.error));
                              else void qc.invalidateQueries({ queryKey: ["admin-users"] });
                            })}
                          >
                            {t("role")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void adminSaveUser({ data: { userId: u.userId, suspended: !u.suspended } }).then((res) => {
                              if (!res.ok) toast.error(err(res.error));
                              else void qc.invalidateQueries({ queryKey: ["admin-users"] });
                            })}
                          >
                            {u.suspended ? t("unban") : t("ban")}
                          </button>
                          <button
                            type="button"
                            className="text-danger"
                            onClick={() => {
                              if (!window.confirm(t("confirmDelete"))) return;
                              void adminDeleteUser({ data: { userId: u.userId } }).then((res) => {
                                if (!res.ok) toast.error(err(res.error));
                                else void qc.invalidateQueries({ queryKey: ["admin-users"] });
                              });
                            }}
                          >
                            {t("deleteUser")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {tab === "groups" ? (
          <div className="space-y-2">
            {(groups.data ?? []).map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-panel px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-muted">{g.members} {t("members")}</div>
                </div>
                <button
                  type="button"
                  className="text-sm text-green-2"
                  onClick={() => {
                    const title = window.prompt(t("groupTitle"), g.title);
                    if (!title) return;
                    void adminUpdateGroup({ data: { id: g.id, title, about: g.about } }).then(() => qc.invalidateQueries({ queryKey: ["admin-groups"] }));
                  }}
                >
                  {t("editGroup")}
                </button>
                <button
                  type="button"
                  className="text-sm text-danger"
                  onClick={() => {
                    if (!window.confirm(t("confirmDelete"))) return;
                    void adminDeleteGroup({ data: { id: g.id } }).then(() => qc.invalidateQueries({ queryKey: ["admin-groups"] }));
                  }}
                >
                  {t("deleteGroup")}
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {tab === "reports" ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              {["", "open", "reviewed", "dismissed"].map((s) => (
                <button key={s || "all"} type="button" onClick={() => setReportStatus(s)} className={`h-9 rounded-full px-3 text-sm ${reportStatus === s ? "bg-green text-on" : "bg-panel"}`}>
                  {s === "" ? t("all") : s === "open" ? t("open") : s === "reviewed" ? t("reviewed") : t("dismissed")}
                </button>
              ))}
            </div>
            {(reports.data ?? []).length === 0 ? <p className="text-sm text-muted">{t("noReports")}</p> : null}
            {(reports.data ?? []).map((r) => (
              <article key={r.id} className="rounded-xl bg-panel p-3 text-sm">
                <div className="font-medium">{r.reporterName} → {r.targetName || r.targetUserId || t("message")}</div>
                <div className="text-muted">{r.reason} · {r.status} · {formatChatTime(r.createdAt, locale, t)}</div>
                {r.details ? <p className="mt-1">{r.details}</p> : null}
                <div className="mt-2 flex gap-3">
                  <button type="button" className="text-green-2" onClick={() => void adminSetReport({ data: { id: r.id, status: "reviewed" } }).then(() => qc.invalidateQueries({ queryKey: ["admin-reports"] }))}>{t("markReviewed")}</button>
                  <button type="button" onClick={() => void adminSetReport({ data: { id: r.id, status: "dismissed" } }).then(() => qc.invalidateQueries({ queryKey: ["admin-reports"] }))}>{t("dismiss")}</button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {tab === "system" && settings.data ? (
          <SettingsForm
            initial={settings.data}
            onSave={async (value) => {
              const res = await adminSaveSettings({ data: value });
              if (!res.ok) toast.error(err(res.error));
              else {
                toast.success(t("saved"));
                void qc.invalidateQueries({ queryKey: ["admin-settings"] });
              }
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function SettingsForm({
  initial,
  onSave,
}: {
  initial: { allowSignups: boolean; maxUploadBytes: number; maintenance: string };
  onSave: (v: { allowSignups: boolean; maxUploadBytes: number; maintenance: string }) => Promise<void>;
}) {
  const { t } = usePrefs();
  const [allowSignups, setAllow] = useState(initial.allowSignups);
  const [maxUploadBytes, setMax] = useState(String(initial.maxUploadBytes));
  const [maintenance, setNote] = useState(initial.maintenance);
  return (
    <form
      className="max-w-lg space-y-3 rounded-xl bg-panel p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({ allowSignups, maxUploadBytes: Number(maxUploadBytes), maintenance });
      }}
    >
      <label className="flex items-center justify-between">
        <span>{t("allowSignups")}</span>
        <input type="checkbox" checked={allowSignups} onChange={(e) => setAllow(e.target.checked)} className="size-5" />
      </label>
      <label className="block text-sm">
        <span className="text-muted">{t("maxUpload")}</span>
        <input value={maxUploadBytes} onChange={(e) => setMax(e.target.value)} className="mt-1 h-11 w-full rounded-lg bg-header px-3" />
      </label>
      <label className="block text-sm">
        <span className="text-muted">{t("maintenance")}</span>
        <textarea value={maintenance} onChange={(e) => setNote(e.target.value)} className="mt-1 h-24 w-full rounded-lg bg-header p-3" />
      </label>
      <button className="h-11 rounded-full bg-green px-5 text-on">{t("saveSettings")}</button>
    </form>
  );
}
