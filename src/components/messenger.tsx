import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  CheckCheck,
  Loader2,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Users,
  Video,
  X,
} from "lucide-react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { ChatListItem, ChatMessage, Me, PublicUser, Thread } from "@/lib/chat-types";
import { EMOJIS, downloadBase64, fileToBase64, resizeImage } from "@/lib/files";
import { bytesLabel, formatChatTime, formatClock, formatDay, formatLastSeen } from "@/lib/format";
import { usePrefs, type CopyKey } from "@/lib/prefs";
import {
  addMembers,
  createGroup,
  deleteMessage,
  deleteStatus,
  editMessage,
  getAvatar,
  getChatAvatar,
  getFile,
  getStatusMedia,
  getUser,
  heartbeat,
  leaveGroup,
  listBlocked,
  listChats,
  listMessages,
  listStatuses,
  markOpen,
  openDirect,
  postStatus,
  removeMember,
  reportUser,
  saveProfile,
  searchUsers,
  sendMessage,
  setBlock,
  setChatFlags,
  setContact,
  setTyping,
  startCall,
  statusViewers,
  updateGroup,
  viewStatus,
  getMe,
} from "@/server/api";
import { CallLayer } from "@/components/call-dock";

type Pane = null | "profile" | "settings" | "privacy" | "blocked" | "new" | "group" | "status" | "archive";

function Splash() {
  return (
    <div className="grid h-dvh place-items-center bg-shell">
      <div className="grid size-16 place-items-center rounded-full bg-green text-2xl font-bold text-on">ن</div>
    </div>
  );
}

export function Messenger() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <Splash />;
  if (!user) return <RedirectToSignIn />;
  return <Authed />;
}

function Authed() {
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => getMe(), refetchInterval: 20_000 });
  if (meQ.isError) {
    return (
      <div className="grid h-dvh place-items-center bg-shell p-6 text-center text-sm">
        <p>{meQ.error instanceof Error ? meQ.error.message : "Error"}</p>
      </div>
    );
  }
  if (meQ.isLoading || !meQ.data) return <Splash />;
  if (meQ.data.suspended) return <Suspended />;
  if (!meQ.data.username) return <Onboarding me={meQ.data} />;
  return <Shell me={meQ.data} />;
}

function Suspended() {
  const { t } = usePrefs();
  return (
    <div className="grid h-dvh place-items-center bg-shell p-6 text-center">
      <div className="max-w-sm space-y-3 rounded-2xl bg-panel p-6 shadow-lg">
        <h1 className="text-xl font-semibold">{t("suspended")}</h1>
        <p className="text-sm text-muted">{t("suspendedHint")}</p>
        <UserButton />
      </div>
    </div>
  );
}

function Onboarding({ me }: { me: Me }) {
  const { t, err } = usePrefs();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState(me.about);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await saveProfile({
      data: { username, phone, about, displayName: me.displayName || username },
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(err(res.error));
      return;
    }
    await qc.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <div className="grid h-dvh place-items-center bg-shell p-4">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-md space-y-4 rounded-2xl bg-panel p-6 shadow-lg">
        <h1 className="text-xl font-semibold">{t("pickUsername")}</h1>
        <p className="text-sm text-muted">{t("usernameHint")}</p>
        <Field label={t("username")} value={username} onChange={setUsername} autoComplete="username" />
        <Field label={t("phoneOptional")} value={phone} onChange={setPhone} />
        <Field label={t("about")} value={about} onChange={setAbout} />
        <button disabled={busy} className="h-11 w-full rounded-full bg-green font-medium text-on disabled:opacity-60">
          {t("saveContinue")}
        </button>
      </form>
    </div>
  );
}

function Shell({ me }: { me: Me }) {
  const { t, locale, setLocale, theme, setTheme, err } = usePrefs();
  const qc = useQueryClient();
  const [chatId, setChatId] = useState<string | null>(null);
  const [pane, setPane] = useState<Pane>(null);
  const [info, setInfo] = useState(false);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [report, setReport] = useState<{ userId?: string; messageId?: string } | null>(null);
  const [statusId, setStatusId] = useState<string | null>(null);
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const applied = useRef(false);

  const chatsQ = useQuery({
    queryKey: ["chats", false],
    queryFn: () => listChats({ data: { archived: false } }),
    refetchInterval: 3000,
  });
  const archQ = useQuery({
    queryKey: ["chats", true],
    queryFn: () => listChats({ data: { archived: true } }),
    enabled: pane === "archive",
    refetchInterval: pane === "archive" ? 4000 : false,
  });
  const threadQ = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => listMessages({ data: { chatId: chatId ?? "" } }),
    enabled: Boolean(chatId),
    refetchInterval: chatId ? 2000 : false,
  });
  const peopleQ = useQuery({
    queryKey: ["people", q],
    queryFn: () => searchUsers({ data: { q } }),
    enabled: q.trim().length >= 2 && pane !== "group",
  });
  const statusesQ = useQuery({
    queryKey: ["statuses"],
    queryFn: () => listStatuses(),
    refetchInterval: 8000,
  });

  useEffect(() => {
    const id = window.setInterval(() => void heartbeat(), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    setLocale(me.locale);
  }, [me.locale, setLocale]);

  useEffect(() => {
    setOlder([]);
    setReply(null);
    setEditing(null);
    setInfo(false);
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    void markOpen({ data: { chatId } }).then(() => {
      void qc.invalidateQueries({ queryKey: ["chats"] });
    });
  }, [chatId, threadQ.data?.messages.at(-1)?.id, qc]);

  const prevUnread = useRef<number | null>(null);
  useEffect(() => {
    const list = chatsQ.data ?? [];
    const total = list.filter((c) => !c.muted).reduce((sum, c) => sum + c.unread, 0);
    if (prevUnread.current != null && total > prevUnread.current && document.hidden && Notification.permission === "granted") {
      const hit = list.find((c) => c.unread > 0 && !c.muted);
      const note = new Notification(hit?.title || t("appName"), { body: hit?.last?.body || t("message") });
      note.onclick = () => window.focus();
    }
    prevUnread.current = total;
  }, [chatsQ.data, t]);

  const list = pane === "archive" ? (archQ.data ?? []) : (chatsQ.data ?? []);
  const filtered = list.filter((c) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return c.title.toLowerCase().includes(needle) || (c.last?.body || "").toLowerCase().includes(needle);
  });
  const thread = threadQ.data;
  const active = (chatsQ.data ?? []).find((c) => c.id === chatId) ?? (archQ.data ?? []).find((c) => c.id === chatId) ?? null;
  const peerId = thread?.chat.peerId ?? null;
  const peerQ = useQuery({
    queryKey: ["user", peerId],
    queryFn: () => getUser({ data: { userId: peerId ?? "" } }),
    enabled: Boolean(peerId),
  });
  const chatLocked = Boolean(peerQ.data?.blockedByMe || peerQ.data?.blockedMe);
  const messages = useMemo(() => {
    const latest = thread?.messages ?? [];
    const map = new Map<string, ChatMessage>();
    for (const m of older) map.set(m.id, m);
    for (const m of latest) map.set(m.id, m);
    return [...map.values()].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  }, [older, thread?.messages]);

  async function openPerson(userId: string) {
    const res = await openDirect({ data: { userId } });
    if (!res.ok) {
      toast.error(err(res.error));
      return;
    }
    setPane(null);
    setQ("");
    setChatId(res.data.id);
    void qc.invalidateQueries({ queryKey: ["chats"] });
  }

  async function loadOlder() {
    if (!chatId || !messages[0]) return;
    const page = await listMessages({ data: { chatId, before: messages[0].createdAt } });
    if (!page) return;
    setOlder((cur) => {
      const map = new Map(cur.map((m) => [m.id, m]));
      for (const m of page.messages) map.set(m.id, m);
      return [...map.values()];
    });
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-shell text-ink">
      <div className="absolute inset-x-0 top-0 hidden h-32 bg-green md:block" />
      <div className="relative flex h-dvh justify-center md:px-4 md:py-5">
        <div className="flex h-full w-full max-w-6xl overflow-hidden bg-panel md:rounded-lg md:shadow-2xl">
          <aside className={`${chatId && pane == null ? "hidden md:flex" : "flex"} relative w-full shrink-0 flex-col border-e border-line md:w-96`}>
            <header className="flex h-14 items-center gap-2 bg-header px-3">
              <button type="button" aria-label={t("profile")} onClick={() => setPane("profile")} className="rounded-full">
                <Face userId={me.userId} rev={me.avatarRev} has={me.hasAvatar} name={me.displayName} className="size-10" />
              </button>
              <div className="min-w-0 flex-1 font-semibold">{t("appName")}</div>
              <IconBtn label={t("newChat")} onClick={() => setPane("new")}>
                <Plus className="size-5" />
              </IconBtn>
              <IconBtn label={t("menu")} onClick={() => setMenu((v) => !v)}>
                <MoreVertical className="size-5" />
              </IconBtn>
            </header>
            {menu ? (
              <div className="absolute end-2 top-14 z-20 w-56 rounded-lg bg-panel py-1 shadow-xl ring-1 ring-line">
                <MenuBtn onClick={() => { setPane("group"); setMenu(false); }}>{t("newGroup")}</MenuBtn>
                <MenuBtn onClick={() => { setPane("status"); setMenu(false); }}>{t("status")}</MenuBtn>
                <MenuBtn onClick={() => { setPane("archive"); setMenu(false); }}>{t("archived")}</MenuBtn>
                <MenuBtn onClick={() => { setPane("settings"); setMenu(false); }}>{t("settings")}</MenuBtn>
                {me.role === "admin" ? (
                  <Link to="/admin" className="block px-4 py-3 text-start text-sm hover:bg-hover">{t("admin")}</Link>
                ) : null}
              </div>
            ) : null}
            <div className="px-3 py-2">
              <label className="flex h-10 items-center gap-2 rounded-lg bg-header px-3 text-muted">
                <Search className="size-4" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("search")}
                  className="w-full bg-transparent text-sm text-ink outline-none"
                />
              </label>
            </div>
            {pane !== "archive" && q.trim().length < 2 ? (
              <StatusStrip me={me} onOpen={setStatusId} onAdd={() => setPane("status")} />
            ) : null}
            {pane === "archive" ? (
              <button type="button" onClick={() => setPane(null)} className="flex h-11 items-center gap-2 bg-header px-3 text-sm text-green-2">
                <ArrowRight className="size-4 rtl:rotate-180" />
                {t("archived")}
              </button>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {q.trim().length >= 2 && pane == null ? (
                <People rows={peopleQ.data ?? []} onOpen={(id) => void openPerson(id)} />
              ) : null}
              {filtered.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted">
                  <div className="font-medium text-ink">{pane === "archive" ? t("archiveEmpty") : t("noChats")}</div>
                  <p className="mt-1">{pane === "archive" ? "" : t("noChatsHint")}</p>
                </div>
              ) : (
                filtered.map((chat) => (
                  <ChatRow
                    key={chat.id}
                    chat={chat}
                    active={chat.id === chatId}
                    onClick={() => {
                      setChatId(chat.id);
                      setPane(null);
                    }}
                  />
                ))
              )}
            </div>
            {pane && pane !== "archive" ? (
              <SidePane
                pane={pane}
                me={me}
                onClose={() => setPane(null)}
                go={setPane}
                onOpen={openPerson}
                onCreated={(id) => {
                  setPane(null);
                  setChatId(id);
                }}
                theme={theme}
                setTheme={setTheme}
                locale={locale}
                setLocale={(loc) => {
                  setLocale(loc);
                  void saveProfile({ data: { locale: loc } });
                }}
              />
            ) : null}
          </aside>
          <section className={`${chatId ? "flex" : "hidden md:flex"} relative min-w-0 flex-1 flex-col`}>
            {thread && chatId ? (
              <>
                <ThreadHeader
                  thread={thread}
                  active={active}
                  onBack={() => setChatId(null)}
                  onInfo={() => setInfo(true)}
                  onCall={(kind) => {
                    if (thread.chat.kind !== "direct") {
                      toast.error(t("groupCallNo"));
                      return;
                    }
                    void startCall({ data: { chatId, kind } }).then((res) => {
                      if (!res.ok) toast.error(err(res.error));
                      void qc.invalidateQueries({ queryKey: ["calls"] });
                    });
                  }}
                />
                <MessageList
                  me={me}
                  thread={thread}
                  messages={messages}
                  onOlder={() => void loadOlder()}
                  onReply={setReply}
                  onEdit={setEditing}
                  onDelete={(id) => {
                    void deleteMessage({ data: { id } }).then(() => qc.invalidateQueries({ queryKey: ["messages", chatId] }));
                  }}
                  onReport={(messageId) => setReport({ messageId, userId: thread.chat.peerId ?? undefined })}
                />
                <Composer
                  chatId={chatId}
                  reply={reply}
                  editing={editing}
                  onClearReply={() => setReply(null)}
                  onClearEdit={() => setEditing(null)}
                  peerBlocked={chatLocked}
                  blockedHint={peerQ.data?.blockedByMe ? t("youBlocked") : t("blockedYou")}
                />
              </>
            ) : (
              <div className="wallpaper grid flex-1 place-items-center px-6 text-center">
                <div>
                  <div className="mx-auto grid size-20 place-items-center rounded-full bg-green text-3xl font-bold text-on">ن</div>
                  <h1 className="mt-4 text-2xl font-semibold">{t("emptyTitle")}</h1>
                  <p className="mt-2 text-sm text-muted">{t("emptyHint")}</p>
                </div>
              </div>
            )}
            {info && thread ? (
              <InfoPane
                thread={thread}
                me={me}
                onClose={() => setInfo(false)}
                onReport={(userId) => setReport({ userId })}
                onLeft={() => {
                  setInfo(false);
                  setChatId(null);
                }}
              />
            ) : null}
            <CallLayer meId={me.userId} />
          </section>
        </div>
      </div>
      {statusId ? <StatusViewer id={statusId} onClose={() => setStatusId(null)} mine={statusesQ.data?.find((s) => s.id === statusId)?.mine ?? false} /> : null}
      {report ? <ReportDialog target={report} chatId={chatId} onClose={() => setReport(null)} /> : null}
    </div>
  );
}

function StatusStrip({ me, onOpen, onAdd }: { me: Me; onOpen: (id: string) => void; onAdd: () => void }) {
  const { t } = usePrefs();
  const q = useQuery({ queryKey: ["statuses"], queryFn: () => listStatuses(), refetchInterval: 8000 });
  const groups = new Map<string, { name: string; userId: string; has: boolean; rev: string; ids: string[]; unseen: boolean }>();
  for (const s of q.data ?? []) {
    const g = groups.get(s.userId) ?? {
      name: s.displayName,
      userId: s.userId,
      has: s.hasAvatar,
      rev: s.avatarRev,
      ids: [],
      unseen: false,
    };
    g.ids.push(s.id);
    if (!s.viewed) g.unseen = true;
    groups.set(s.userId, g);
  }
  const mine = groups.get(me.userId);
  const rest = [...groups.values()].filter((g) => g.userId !== me.userId);
  return (
    <div className="flex gap-3 overflow-x-auto px-3 pb-2">
      <button type="button" onClick={onAdd} className="flex w-16 shrink-0 flex-col items-center gap-1 text-xs">
        <span className="grid size-12 place-items-center rounded-full bg-header ring-2 ring-green">
          <Plus className="size-5 text-green-2" />
        </span>
        {t("myStatus")}
      </button>
      {mine ? (
        <button type="button" onClick={() => onOpen(mine.ids[0]!)} className="flex w-16 shrink-0 flex-col items-center gap-1 text-xs">
          <Face userId={me.userId} rev={me.avatarRev} has={me.hasAvatar} name={me.displayName} className="size-12 ring-2 ring-line" />
          {mine.ids.length}
        </button>
      ) : null}
      {rest.map((g) => (
        <button key={g.userId} type="button" onClick={() => onOpen(g.ids[0]!)} className="flex w-16 shrink-0 flex-col items-center gap-1 text-xs">
          <Face userId={g.userId} rev={g.rev} has={g.has} name={g.name} className={`size-12 ring-2 ${g.unseen ? "ring-green-2" : "ring-line"}`} />
          <span className="w-full truncate">{g.name}</span>
        </button>
      ))}
    </div>
  );
}

function People({ rows, onOpen }: { rows: PublicUser[]; onOpen: (id: string) => void }) {
  const { t } = usePrefs();
  if (!rows.length) return <div className="px-4 py-2 text-sm text-muted">{t("noResults")}</div>;
  return (
    <div className="border-b border-line pb-2">
      <div className="px-4 py-1 text-xs font-medium text-green-2">{t("people")}</div>
      {rows.map((p) => (
        <button key={p.userId} type="button" onClick={() => onOpen(p.userId)} className="flex w-full items-center gap-3 px-4 py-2 text-start hover:bg-hover">
          <Face userId={p.userId} rev={p.avatarRev} has={p.hasAvatar} name={p.displayName} className="size-10" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{p.displayName}</span>
            <span className="block truncate text-sm text-muted">{p.username ? `@${p.username}` : ""}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function ChatRow({ chat, active, onClick }: { chat: ChatListItem; active: boolean; onClick: () => void }) {
  const { t, locale } = usePrefs();
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 px-3 py-3 text-start hover:bg-hover ${active ? "bg-active" : ""}`}>
      {chat.kind === "group" ? (
        <GroupFace chatId={chat.id} rev={chat.avatarRev} has={chat.hasAvatar} name={chat.title} className="size-12" />
      ) : (
        <span className="relative">
          <Face userId={chat.avatarUserId} rev={chat.avatarRev} has={chat.hasAvatar} name={chat.title} className="size-12" />
          {chat.online ? <span className="absolute bottom-0 end-0 size-3 rounded-full bg-unread ring-2 ring-panel" /> : null}
        </span>
      )}
      <span className="min-w-0 flex-1 border-b border-line pb-2">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate font-medium">{chat.title || t("chats")}</span>
          <span className={`shrink-0 text-xs ${chat.unread ? "text-unread" : "text-muted"}`}>
            {formatChatTime(chat.last?.createdAt ?? chat.updatedAt, locale, t)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm text-muted">{previewText(chat, t)}</span>
          {chat.unread ? (
            <span className="grid min-w-5 place-items-center rounded-full bg-unread px-1.5 text-xs font-semibold text-on">{chat.unread}</span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function previewText(chat: ChatListItem, t: (k: CopyKey) => string) {
  const last = chat.last;
  if (!last) return "";
  if (last.deleted) return t("deleted");
  if (last.kind === "image") return t("photo");
  if (last.kind === "video") return t("video");
  if (last.kind === "audio") return t("voice");
  if (last.kind === "file") return t("file");
  if (last.kind === "system") return systemText(last.body, t);
  const who = chat.kind === "group" && !last.mine ? `${last.senderName}: ` : "";
  return `${who}${last.body ?? ""}`;
}

function ThreadHeader({
  thread,
  active,
  onBack,
  onInfo,
  onCall,
}: {
  thread: Thread;
  active: ChatListItem | null;
  onBack: () => void;
  onInfo: () => void;
  onCall: (kind: "audio" | "video") => void;
}) {
  const { t, locale } = usePrefs();
  const peer = thread.members.find((m) => m.userId === thread.chat.peerId);
  const subtitle =
    thread.typing.length > 0
      ? t("typing")
      : thread.chat.kind === "group"
        ? `${thread.members.length} ${t("members")}`
        : peer && !peer.presenceHidden
          ? formatLastSeen(peer.lastSeenAt, peer.online, locale, t)
          : "";
  return (
    <header className="flex h-14 items-center gap-1 bg-header px-2">
      <button type="button" aria-label={t("back")} onClick={onBack} className="grid size-11 place-items-center rounded-full text-muted md:hidden">
        <ArrowRight className="size-5 rtl:rotate-180" />
      </button>
      <button type="button" onClick={onInfo} className="flex min-w-0 flex-1 items-center gap-3 text-start">
        {thread.chat.kind === "group" ? (
          <GroupFace chatId={thread.chat.id} rev={thread.chat.avatarRev} has={thread.chat.hasAvatar} name={thread.chat.title} className="size-10" />
        ) : (
          <Face userId={thread.chat.peerId} rev={active?.avatarRev ?? ""} has={active?.hasAvatar ?? false} name={thread.chat.title} className="size-10" />
        )}
        <span className="min-w-0">
          <span className="block truncate font-semibold">{thread.chat.title}</span>
          <span className="block truncate text-xs text-muted">{subtitle}</span>
        </span>
      </button>
      <IconBtn label={t("call")} onClick={() => onCall("audio")}><Phone className="size-5" /></IconBtn>
      <IconBtn label={t("videoCall")} onClick={() => onCall("video")}><Video className="size-5" /></IconBtn>
    </header>
  );
}

function MessageList({
  me,
  thread,
  messages,
  onOlder,
  onReply,
  onEdit,
  onDelete,
  onReport,
}: {
  me: Me;
  thread: Thread;
  messages: ChatMessage[];
  onOlder: () => void;
  onReply: (m: ChatMessage) => void;
  onEdit: (m: ChatMessage) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
}) {
  const { t, locale } = usePrefs();
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    const el = scroller.current;
    if (!el || !stick.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, messages.at(-1)?.id, messages.at(-1)?.body]);

  let lastDay = "";
  return (
    <div
      ref={scroller}
      onScroll={(e) => {
        const el = e.currentTarget;
        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
      className="wallpaper min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3"
    >
      {thread.hasMore ? (
        <button type="button" onClick={onOlder} className="mx-auto mb-2 block rounded-full bg-panel px-3 py-1 text-xs text-muted shadow">
          {t("loadOlder")}
        </button>
      ) : null}
      {messages.map((m) => {
        const day = formatDay(m.createdAt, locale, t);
        const showDay = day !== lastDay;
        lastDay = day;
        if (m.kind === "system") {
          return (
            <div key={m.id}>
              {showDay ? <DayChip label={day} /> : null}
              <div className="mx-auto my-1 max-w-md rounded-lg bg-panel/90 px-3 py-1 text-center text-xs text-muted shadow-sm">
                {systemText(m.body, t)}
              </div>
            </div>
          );
        }
        const read = me.readReceipts && m.mine && thread.members.some((mem) => mem.userId !== me.userId && mem.lastReadAt && mem.lastReadAt >= m.createdAt);
        return (
          <div key={m.id}>
            {showDay ? <DayChip label={day} /> : null}
            <div className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className={`group relative max-w-[80%] rounded-lg px-2 py-1 shadow-sm ${m.mine ? "bg-out" : "bg-in"}`}>
                <div className="block w-full cursor-pointer text-start" onClick={() => setOpenId((cur) => (cur === m.id ? null : m.id))}>
                {thread.chat.kind === "group" && !m.mine ? <div className="text-xs font-semibold text-green-2">{m.senderName}</div> : null}
                {m.reply ? (
                  <div className="mb-1 rounded-md border-s-4 border-green-2 bg-header/70 px-2 py-1 text-xs">
                    <div className="font-medium">{m.reply.senderName}</div>
                    <div className="truncate text-muted">{m.reply.deleted ? t("deleted") : m.reply.body || m.reply.kind}</div>
                  </div>
                ) : null}
                {m.deleted ? (
                  <p className="text-sm italic text-muted">{t("deleted")}</p>
                ) : m.kind === "text" ? (
                  <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                ) : (
                  <MessageMedia id={m.id} kind={m.kind} name={m.fileName} mime={m.fileMime} size={m.fileSize} />
                )}
                <div className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted">
                  {m.editedAt && !m.deleted ? <span>{t("edited")}</span> : null}
                  <span>{formatClock(m.createdAt, locale)}</span>
                  {m.mine && !m.deleted ? read ? <CheckCheck className="size-3.5 text-tick" /> : <Check className="size-3.5" /> : null}
                </div>
                </div>
                {!m.deleted && openId === m.id ? (
                  <div className="mt-1 flex flex-wrap gap-1 border-t border-line pt-1">
                    <Tiny onClick={() => { setOpenId(null); onReply(m); }} label={t("reply")}>{t("reply")}</Tiny>
                    {m.kind === "text" ? <Tiny onClick={() => { setOpenId(null); void navigator.clipboard.writeText(m.body || ""); }} label={t("copy")}>{t("copy")}</Tiny> : null}
                    {m.mine && m.kind === "text" ? <Tiny onClick={() => { setOpenId(null); onEdit(m); }} label={t("edit")}>{t("edit")}</Tiny> : null}
                    {m.mine ? <Tiny onClick={() => { setOpenId(null); onDelete(m.id); }} label={t("remove")}>{t("remove")}</Tiny> : null}
                    {!m.mine ? <Tiny onClick={() => { setOpenId(null); onReport(m.id); }} label={t("report")}>{t("report")}</Tiny> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayChip({ label }: { label: string }) {
  return <div className="mx-auto my-2 w-fit rounded-lg bg-panel px-3 py-1 text-xs text-muted shadow-sm">{label}</div>;
}

function Tiny({ children, onClick, label }: { children: string; onClick: () => void; label: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="rounded-full bg-header px-2 py-1 text-xs hover:bg-active">
      {children}
    </button>
  );
}

function MessageMedia({ id, kind, name, mime, size }: { id: string; kind: string; name: string | null; mime: string | null; size: number | null }) {
  const { t } = usePrefs();
  const q = useQuery({
    queryKey: ["file", id],
    queryFn: () => getFile({ data: { id } }),
    staleTime: Number.POSITIVE_INFINITY,
  });
  if (!q.data?.data) return <div className="h-24 w-40 animate-pulse rounded-md bg-header" />;
  const src = `data:${q.data.mime ?? mime};base64,${q.data.data}`;
  if (kind === "image") return <img src={src} alt="" className="max-h-64 rounded-md object-cover" />;
  if (kind === "video") return <video src={src} controls onClick={(e) => e.stopPropagation()} className="max-h-64 max-w-full rounded-md" />;
  if (kind === "audio") return <audio src={src} controls onClick={(e) => e.stopPropagation()} className="max-w-full" />;
  return (
    <button
      type="button"
      className="text-sm underline"
      onClick={(e) => {
        e.stopPropagation();
        downloadBase64(name || "file", q.data?.mime || "application/octet-stream", q.data?.data || "");
      }}
    >
      {name || t("download")} · {bytesLabel(size)}
    </button>
  );
}

function Composer({
  chatId,
  reply,
  editing,
  onClearReply,
  onClearEdit,
  peerBlocked,
  blockedHint,
}: {
  chatId: string;
  reply: ChatMessage | null;
  editing: ChatMessage | null;
  onClearReply: () => void;
  onClearEdit: () => void;
  peerBlocked: boolean;
  blockedHint: string;
}) {
  const { t, err } = usePrefs();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState(false);
  const [attach, setAttach] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [accept, setAccept] = useState("image/*");

  useEffect(() => {
    setText(editing?.body ?? "");
  }, [editing]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void setTyping({ data: { chatId, on: text.trim().length > 0 && !editing } });
    }, 300);
    return () => window.clearTimeout(id);
  }, [text, chatId, editing]);

  async function sendText() {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    const res = editing
      ? await editMessage({ data: { id: editing.id, body } })
      : await sendMessage({ data: { chatId, kind: "text", body, replyTo: reply?.id } });
    setBusy(false);
    if (!res.ok) {
      toast.error(err(res.error));
      return;
    }
    setText("");
    onClearReply();
    onClearEdit();
    setEmoji(false);
    void qc.invalidateQueries({ queryKey: ["messages", chatId] });
    void qc.invalidateQueries({ queryKey: ["chats"] });
  }

  async function sendFile(file: File, kind: "image" | "video" | "audio" | "file") {
    setBusy(true);
    setAttach(false);
    try {
      let mime = file.type || "application/octet-stream";
      let data = "";
      if (kind === "image") {
        const img = await resizeImage(file, 1600, 0.82);
        mime = img.mime;
        data = img.data;
      } else {
        data = await fileToBase64(file);
      }
      const res = await sendMessage({
        data: { chatId, kind, fileName: file.name, fileMime: mime, fileData: data, replyTo: reply?.id },
      });
      if (!res.ok) toast.error(err(res.error));
      else {
        onClearReply();
        void qc.invalidateQueries({ queryKey: ["messages", chatId] });
        void qc.invalidateQueries({ queryKey: ["chats"] });
      }
    } catch {
      toast.error(t("errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  function pick(kind: "image" | "video" | "audio" | "file") {
    const map = { image: "image/*", video: "video/*", audio: "audio/*", file: "*/*" };
    setAccept(map[kind]);
    window.setTimeout(() => fileRef.current?.click(), 0);
    fileRef.current?.setAttribute("data-kind", kind);
  }

  async function toggleRec() {
    if (recording && recRef.current) {
      recRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks.current, { type: mime });
        void sendFile(new File([blob], `voice.${mime.includes("mp4") ? "m4a" : "webm"}`, { type: mime }), "audio");
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error(t("callFailed"));
    }
  }

  return (
    <div className="bg-header px-2 py-2">
      {peerBlocked ? (
        <p className="px-3 py-3 text-center text-sm text-danger">{blockedHint}</p>
      ) : (
      <>
      {reply ? (
        <div className="mb-2 flex items-center gap-2 rounded-md bg-panel px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 truncate">{reply.body || reply.kind}</span>
          <button type="button" aria-label={t("close")} onClick={onClearReply}><X className="size-4" /></button>
        </div>
      ) : null}
      {emoji ? (
        <div className="mb-2 grid grid-cols-8 gap-1 rounded-lg bg-panel p-2">
          {EMOJIS.map((e) => (
            <button key={e} type="button" className="grid h-10 place-items-center text-xl" onClick={() => setText((v) => v + e)}>
              {e}
            </button>
          ))}
        </div>
      ) : null}
      {attach ? (
        <div className="mb-2 flex flex-wrap gap-2">
          <Chip onClick={() => pick("image")}>{t("gallery")}</Chip>
          <Chip onClick={() => pick("video")}>{t("video")}</Chip>
          <Chip onClick={() => pick("audio")}>{t("audioFile")}</Chip>
          <Chip onClick={() => pick("file")}>{t("document")}</Chip>
        </div>
      ) : null}
      <div className="flex items-end gap-1">
        <IconBtn label={t("emoji")} onClick={() => { setEmoji((v) => !v); setAttach(false); }}><Smile className="size-5" /></IconBtn>
        <IconBtn label={t("attach")} onClick={() => { setAttach((v) => !v); setEmoji(false); }}><Paperclip className="size-5" /></IconBtn>
        <textarea
          value={text}
          rows={1}
          placeholder={t("typeMessage")}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendText();
            }
          }}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-lg bg-compose px-3 py-2.5 text-sm outline-none"
        />
        {text.trim() || editing ? (
          <button type="button" aria-label={t("send")} disabled={busy} onClick={() => void sendText()} className="grid size-11 place-items-center rounded-full text-green-2">
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          </button>
        ) : (
          <button type="button" aria-label={recording ? t("stop") : t("voice")} onClick={() => void toggleRec()} className={`grid size-11 place-items-center rounded-full ${recording ? "text-danger" : "text-muted"}`}>
            <Mic className="size-5" />
          </button>
        )}
      </div>
      {recording ? <div className="px-12 text-xs text-danger">{t("recording")}</div> : null}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const kind = (e.target.getAttribute("data-kind") || "file") as "image" | "video" | "audio" | "file";
          e.target.value = "";
          if (file) void sendFile(file, kind);
        }}
      />
      </>
      )}
    </div>
  );
}

function Chip({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-10 rounded-full bg-panel px-4 text-sm shadow ring-1 ring-line">
      {children}
    </button>
  );
}

function SidePane({
  pane,
  me,
  onClose,
  go,
  onOpen,
  onCreated,
  theme,
  setTheme,
  locale,
  setLocale,
}: {
  pane: Pane;
  me: Me;
  onClose: () => void;
  go: (pane: Pane) => void;
  onOpen: (id: string) => Promise<void>;
  onCreated: (id: string) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  locale: "fa" | "en";
  setLocale: (l: "fa" | "en") => void;
}) {
  const { t, err } = usePrefs();
  const qc = useQueryClient();
  const [name, setName] = useState(me.displayName);
  const [username, setUsername] = useState(me.username ?? "");
  const [about, setAbout] = useState(me.about);
  const [phone, setPhone] = useState(me.phone ?? "");
  const [find, setFind] = useState("");
  const [picked, setPicked] = useState<PublicUser[]>([]);
  const [groupName, setGroupName] = useState("");
  const [statusText, setStatusText] = useState("");
  const [bg, setBg] = useState("#008069");
  const found = useQuery({
    queryKey: ["people", find, pane],
    queryFn: () => searchUsers({ data: { q: find } }),
    enabled: find.trim().length >= 2 && (pane === "new" || pane === "group"),
  });
  const blocked = useQuery({
    queryKey: ["blocked"],
    queryFn: () => listBlocked(),
    enabled: pane === "blocked",
  });

  async function saveMe(extra: Record<string, unknown> = {}) {
    const res = await saveProfile({ data: { displayName: name, username, about, phone, ...extra } });
    if (!res.ok) toast.error(err(res.error));
    else {
      toast.success(t("saved"));
      await qc.invalidateQueries({ queryKey: ["me"] });
    }
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-panel">
      <header className="flex h-14 items-center gap-2 bg-green px-2 text-on">
        <button type="button" aria-label={t("back")} onClick={onClose} className="grid size-11 place-items-center rounded-full">
          <ArrowRight className="size-5 rtl:rotate-180" />
        </button>
        <h2 className="font-semibold">
          {pane === "profile" ? t("profile") : pane === "settings" ? t("settings") : pane === "privacy" ? t("privacy") : pane === "blocked" ? t("blocked") : pane === "new" ? t("newChat") : pane === "group" ? t("newGroup") : pane === "status" ? t("status") : t("archived")}
        </h2>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {pane === "profile" ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <Face userId={me.userId} rev={me.avatarRev} has={me.hasAvatar} name={me.displayName} className="size-24 text-2xl" />
              <label className="text-sm text-green-2">
                {t("changePhoto")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    void resizeImage(file, 256, 0.75).then((img) => saveMe({ avatarData: img.data, avatarMime: img.mime }));
                  }}
                />
              </label>
              {me.hasAvatar ? (
                <button type="button" className="text-sm text-danger" onClick={() => void saveMe({ avatarData: null })}>{t("removePhoto")}</button>
              ) : null}
            </div>
            <Field label={t("name")} value={name} onChange={setName} />
            <Field label={t("username")} value={username} onChange={setUsername} />
            <p className="text-xs text-muted">{t("usernameHint")}</p>
            <Field label={t("about")} value={about} onChange={setAbout} />
            <Field label={t("phone")} value={phone} onChange={setPhone} />
            <button type="button" onClick={() => void saveMe()} className="h-11 w-full rounded-full bg-green font-medium text-on">{t("save")}</button>
          </>
        ) : null}
        {pane === "settings" ? (
          <>
            <button type="button" onClick={() => go("profile")} className="flex h-12 w-full items-center gap-3 rounded-xl bg-header px-3 text-start">
              <Face userId={me.userId} rev={me.avatarRev} has={me.hasAvatar} name={me.displayName} className="size-10" />
              <span>
                <span className="block font-medium">{me.displayName}</span>
                <span className="text-sm text-muted">@{me.username}</span>
              </span>
            </button>
            <RowBtn onClick={() => go("blocked")}>{t("blocked")}</RowBtn>
            <div className="rounded-xl bg-header p-3 text-sm">
              <div className="mb-2 font-medium">{t("language")}</div>
              <div className="flex gap-2">
                <Chip onClick={() => setLocale("fa")}>{locale === "fa" ? `• ${t("langFa")}` : t("langFa")}</Chip>
                <Chip onClick={() => setLocale("en")}>{locale === "en" ? `• ${t("langEn")}` : t("langEn")}</Chip>
              </div>
            </div>
            <div className="rounded-xl bg-header p-3 text-sm">
              <div className="mb-2 font-medium">{t("theme")}</div>
              <div className="flex gap-2">
                <Chip onClick={() => setTheme("light")}>{theme === "light" ? `• ${t("light")}` : t("light")}</Chip>
                <Chip onClick={() => setTheme("dark")}>{theme === "dark" ? `• ${t("dark")}` : t("dark")}</Chip>
              </div>
            </div>
            <PrivacyForm me={me} />
            <button
              type="button"
              className="h-11 w-full rounded-full bg-header text-sm"
              onClick={() => void Notification.requestPermission()}
            >
              {Notification.permission === "granted" ? t("notificationsOn") : t("enableNotifications")}
            </button>
            <p className="text-xs leading-relaxed text-muted">{t("storageNote")}</p>
            {me.role === "admin" ? <p className="text-xs text-muted">{t("firstAdmin")}</p> : null}
            <div className="flex items-center justify-between">
              <UserButton />
              <button type="button" className="text-sm text-danger" onClick={() => void signOut("/").catch(() => toast.error(t("errGeneric")))}>{t("signingOut")}</button>
            </div>
          </>
        ) : null}
        {pane === "privacy" ? <PrivacyForm me={me} /> : null}
        {pane === "blocked" ? (
          <div className="space-y-2">
            {(blocked.data ?? []).length === 0 ? <p className="text-sm text-muted">{t("noBlocked")}</p> : null}
            {(blocked.data ?? []).map((b) => (
              <div key={b.userId} className="flex items-center justify-between gap-2">
                <span>{b.displayName} {b.username ? `@${b.username}` : ""}</span>
                <button
                  type="button"
                  className="text-sm text-green-2"
                  onClick={() => void setBlock({ data: { userId: b.userId, block: false } }).then(() => qc.invalidateQueries({ queryKey: ["blocked"] }))}
                >
                  {t("unblock")}
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {pane === "new" || pane === "group" ? (
          <>
            <Field label={t("searchUsersPh")} value={find} onChange={setFind} />
            {pane === "group" ? <Field label={t("groupTitle")} value={groupName} onChange={setGroupName} /> : null}
            {pane === "group" && picked.length ? (
              <div className="flex flex-wrap gap-2">
                {picked.map((p) => (
                  <button key={p.userId} type="button" className="rounded-full bg-header px-3 py-1 text-sm" onClick={() => setPicked((cur) => cur.filter((x) => x.userId !== p.userId))}>
                    {p.displayName} ×
                  </button>
                ))}
              </div>
            ) : null}
            {(found.data ?? []).map((p) => (
              <button
                key={p.userId}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-start hover:bg-hover"
                onClick={() => {
                  if (pane === "new") void onOpen(p.userId);
                  else setPicked((cur) => (cur.some((x) => x.userId === p.userId) ? cur : [...cur, p]));
                }}
              >
                <Face userId={p.userId} rev={p.avatarRev} has={p.hasAvatar} name={p.displayName} className="size-10" />
                <span>
                  <span className="block font-medium">{p.displayName}</span>
                  <span className="text-sm text-muted">{p.username ? `@${p.username}` : ""}</span>
                </span>
              </button>
            ))}
            {pane === "group" ? (
              <button
                type="button"
                className="h-11 w-full rounded-full bg-green font-medium text-on"
                onClick={() => {
                  void createGroup({ data: { title: groupName, memberIds: picked.map((p) => p.userId) } }).then(async (res) => {
                    if (!res.ok) toast.error(err(res.error));
                    else {
                      await qc.invalidateQueries({ queryKey: ["chats"] });
                      onCreated(res.data.id);
                    }
                  });
                }}
              >
                {t("create")}
              </button>
            ) : null}
          </>
        ) : null}
        {pane === "status" ? (
          <StatusComposer
            text={statusText}
            setText={setStatusText}
            bg={bg}
            setBg={setBg}
          />
        ) : null}
        {pane === "archive" ? <p className="text-sm text-muted">{t("archived")}</p> : null}
      </div>
    </div>
  );
}

function PrivacyForm({ me }: { me: Me }) {
  const { t, err } = usePrefs();
  const qc = useQueryClient();
  const [lastSeen, setLast] = useState(me.privacyLastSeen);
  const [photo, setPhoto] = useState(me.privacyPhoto);
  const [about, setAbout] = useState(me.privacyAbout);
  const [status, setStatus] = useState(me.privacyStatus);
  const [reads, setReads] = useState(me.readReceipts);
  async function save() {
    const res = await saveProfile({
      data: {
        privacyLastSeen: lastSeen,
        privacyPhoto: photo,
        privacyAbout: about,
        privacyStatus: status,
        readReceipts: reads,
      },
    });
    if (!res.ok) toast.error(err(res.error));
    else {
      toast.success(t("saved"));
      await qc.invalidateQueries({ queryKey: ["me"] });
    }
  }
  return (
    <div className="space-y-3 rounded-xl bg-header p-3 text-sm">
      <div className="font-medium">{t("privacy")}</div>
      <Select label={t("lastSeenPrivacy")} value={lastSeen} onChange={setLast} />
      <Select label={t("photoPrivacy")} value={photo} onChange={setPhoto} />
      <Select label={t("aboutPrivacy")} value={about} onChange={setAbout} />
      <Select label={t("statusPrivacy")} value={status} onChange={setStatus} />
      <label className="flex items-center justify-between gap-3">
        <span>
          <span className="block">{t("readReceipts")}</span>
          <span className="text-xs text-muted">{t("readReceiptsHint")}</span>
        </span>
        <input type="checkbox" checked={reads} onChange={(e) => setReads(e.target.checked)} className="size-5" />
      </label>
      <button type="button" onClick={() => void save()} className="h-10 rounded-full bg-green px-4 text-on">{t("save")}</button>
    </div>
  );
}

function Select({ label, value, onChange }: { label: string; value: string; onChange: (v: "everyone" | "contacts" | "nobody") => void }) {
  const { t } = usePrefs();
  return (
    <label className="block">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as "everyone" | "contacts" | "nobody")}
        className="mt-1 h-10 w-full rounded-lg bg-panel px-2"
      >
        <option value="everyone">{t("everyone")}</option>
        <option value="contacts">{t("contacts")}</option>
        <option value="nobody">{t("nobody")}</option>
      </select>
    </label>
  );
}

const BACKGROUNDS = ["#008069", "#0b141a", "#6b3fa0", "#c4532a", "#1f6f8b", "#8a1538"];

function StatusComposer({
  text,
  setText,
  bg,
  setBg,
}: {
  text: string;
  setText: (v: string) => void;
  bg: string;
  setBg: (v: string) => void;
}) {
  const { t, err } = usePrefs();
  const qc = useQueryClient();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("statusHint")}</p>
      <div className="grid h-40 place-items-center rounded-xl p-4 text-center text-on" style={{ background: bg }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("writeStatus")} className="w-full resize-none bg-transparent text-center text-lg outline-none placeholder:text-on/70" />
      </div>
      <div className="flex gap-2">
        {BACKGROUNDS.map((c) => (
          <button key={c} type="button" aria-label={c} onClick={() => setBg(c)} className="size-8 rounded-full ring-2 ring-panel" style={{ background: c }} />
        ))}
      </div>
      <button
        type="button"
        className="h-11 w-full rounded-full bg-green font-medium text-on"
        onClick={() => {
          void postStatus({ data: { kind: "text", caption: text, bg } }).then((res) => {
            if (!res.ok) toast.error(err(res.error));
            else {
              setText("");
              toast.success(t("saved"));
              void qc.invalidateQueries({ queryKey: ["statuses"] });
            }
          });
        }}
      >
        {t("textStatus")}
      </button>
      <label className="flex h-11 w-full items-center justify-center rounded-full bg-header text-sm">
        {t("imageStatus")}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            void resizeImage(file, 1280, 0.8).then((img) =>
              postStatus({ data: { kind: "image", caption: text, fileMime: img.mime, fileData: img.data } }).then((res) => {
                if (!res.ok) toast.error(err(res.error));
                else {
                  toast.success(t("saved"));
                  void qc.invalidateQueries({ queryKey: ["statuses"] });
                }
              }),
            );
          }}
        />
      </label>
    </div>
  );
}

function InfoPane({
  thread,
  me,
  onClose,
  onReport,
  onLeft,
}: {
  thread: Thread;
  me: Me;
  onClose: () => void;
  onReport: (userId: string) => void;
  onLeft: () => void;
}) {
  const { t, err, locale } = usePrefs();
  const qc = useQueryClient();
  const peerId = thread.chat.peerId;
  const userQ = useQuery({
    queryKey: ["user", peerId],
    queryFn: () => getUser({ data: { userId: peerId ?? "" } }),
    enabled: Boolean(peerId),
  });
  const peer = userQ.data;
  const [title, setTitle] = useState(thread.chat.title);
  const [addQ, setAddQ] = useState("");
  const found = useQuery({
    queryKey: ["people", addQ, "info"],
    queryFn: () => searchUsers({ data: { q: addQ } }),
    enabled: addQ.trim().length >= 2 && thread.chat.kind === "group",
  });
  const canManage = thread.chat.myRole === "owner" || thread.chat.myRole === "admin";

  async function flag(patch: Record<string, unknown>) {
    const res = await setChatFlags({ data: { chatId: thread.chat.id, ...patch } });
    if (!res.ok) toast.error(err(res.error));
    void qc.invalidateQueries({ queryKey: ["chats"] });
    void qc.invalidateQueries({ queryKey: ["messages", thread.chat.id] });
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-panel">
      <header className="flex h-14 items-center gap-2 bg-header px-2">
        <button type="button" aria-label={t("back")} onClick={onClose} className="grid size-11 place-items-center"><ArrowRight className="size-5 rtl:rotate-180" /></button>
        <h2 className="font-semibold">{t("info")}</h2>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          {thread.chat.kind === "group" ? (
            <GroupFace chatId={thread.chat.id} rev={thread.chat.avatarRev} has={thread.chat.hasAvatar} name={thread.chat.title} className="size-24 text-2xl" />
          ) : (
            <Face userId={peerId} rev={peer?.avatarRev ?? ""} has={peer?.hasAvatar ?? false} name={thread.chat.title} className="size-24 text-2xl" />
          )}
          <div className="text-xl font-semibold">{thread.chat.title}</div>
          {peer?.username ? <div className="text-sm text-muted">@{peer.username}</div> : null}
          {peer && !peer.presenceHidden ? <div className="text-sm text-green-2">{formatLastSeen(peer.lastSeenAt, peer.online, locale, t)}</div> : null}
          {peer?.about ? <p className="text-sm">{peer.about}</p> : null}
          {peer?.phone ? <p className="text-sm">{peer.phone}</p> : null}
        </div>
        {thread.chat.kind === "group" && canManage ? (
          <div className="space-y-2">
            <Field label={t("groupTitle")} value={title} onChange={setTitle} />
            <button
              type="button"
              className="h-10 rounded-full bg-green px-4 text-sm text-on"
              onClick={() => void updateGroup({ data: { chatId: thread.chat.id, title } }).then(() => qc.invalidateQueries({ queryKey: ["messages"] }))}
            >
              {t("save")}
            </button>
            <Field label={t("addMembers")} value={addQ} onChange={setAddQ} />
            {(found.data ?? []).map((p) => (
              <button
                key={p.userId}
                type="button"
                className="block w-full rounded-lg px-2 py-2 text-start hover:bg-hover"
                onClick={() => void addMembers({ data: { chatId: thread.chat.id, memberIds: [p.userId] } }).then(() => {
                  setAddQ("");
                  void qc.invalidateQueries({ queryKey: ["messages", thread.chat.id] });
                })}
              >
                {p.displayName}
              </button>
            ))}
          </div>
        ) : null}
        <div className="space-y-1">
          {thread.members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 py-1">
              <Face userId={m.userId} rev={m.avatarRev} has={m.hasAvatar} name={m.displayName} className="size-10" />
              <div className="min-w-0 flex-1">
                <div className="truncate">{m.userId === me.userId ? t("you") : m.displayName}</div>
                <div className="text-xs text-muted">{m.role === "owner" ? t("owner") : m.role === "admin" ? t("groupAdmin") : m.username ? `@${m.username}` : t("member")}</div>
              </div>
              {canManage && m.role !== "owner" && m.userId !== me.userId ? (
                <button type="button" className="text-xs text-danger" onClick={() => void removeMember({ data: { chatId: thread.chat.id, userId: m.userId } }).then(() => qc.invalidateQueries({ queryKey: ["messages", thread.chat.id] }))}>
                  {t("removeMember")}
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <div className="grid gap-2">
          <RowBtn onClick={() => void flag({ pinned: !thread.chat.pinned })}>{thread.chat.pinned ? t("unpin") : t("pin")}</RowBtn>
          <RowBtn onClick={() => void flag({ muted: !thread.chat.muted })}>{thread.chat.muted ? t("unmute") : t("mute")}</RowBtn>
          <RowBtn onClick={() => void flag({ archived: !thread.chat.archived })}>{thread.chat.archived ? t("unarchive") : t("archive")}</RowBtn>
          <RowBtn onClick={() => void flag({ clear: true })}>{t("clearChat")}</RowBtn>
          {peerId ? (
            <>
              <RowBtn onClick={() => void setContact({ data: { userId: peerId, add: true } }).then(() => toast.success(t("added")))}>{t("contact")}</RowBtn>
              <RowBtn onClick={() => void setBlock({ data: { userId: peerId, block: !peer?.blockedByMe } }).then(() => qc.invalidateQueries({ queryKey: ["user", peerId] }))}>
                {peer?.blockedByMe ? t("unblock") : t("block")}
              </RowBtn>
              <RowBtn onClick={() => onReport(peerId)}>{t("report")}</RowBtn>
            </>
          ) : null}
          {thread.chat.kind === "group" ? (
            <button
              type="button"
              className="h-11 rounded-lg text-danger"
              onClick={() => {
                if (!window.confirm(t("confirmDelete"))) return;
                void leaveGroup({ data: { chatId: thread.chat.id } }).then(() => {
                  void qc.invalidateQueries({ queryKey: ["chats"] });
                  onLeft();
                });
              }}
            >
              {t("leaveGroup")}
            </button>
          ) : null}
          {peer?.blockedByMe ? <p className="text-sm text-danger">{t("youBlocked")}</p> : null}
          {peer?.blockedMe ? <p className="text-sm text-danger">{t("blockedYou")}</p> : null}
        </div>
      </div>
    </div>
  );
}

function StatusViewer({ id, onClose, mine }: { id: string; onClose: () => void; mine: boolean }) {
  const { t } = usePrefs();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["statuses"], queryFn: () => listStatuses() });
  const item = (list.data ?? []).find((s) => s.id === id);
  const media = useQuery({
    queryKey: ["status-media", id],
    queryFn: () => getStatusMedia({ data: { id } }),
    enabled: item?.kind === "image",
  });
  const viewers = useQuery({
    queryKey: ["status-views", id],
    queryFn: () => statusViewers({ data: { id } }),
    enabled: mine,
  });
  useEffect(() => {
    if (!mine) void viewStatus({ data: { id } }).then(() => qc.invalidateQueries({ queryKey: ["statuses"] }));
  }, [id, mine, qc]);
  if (!item) return null;
  const src = media.data?.data ? `data:${media.data.mime};base64,${media.data.data}` : "";
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/95 p-4">
      <button type="button" aria-label={t("close")} onClick={onClose} className="absolute end-4 top-4 grid size-11 place-items-center text-panel"><X /></button>
      <div className="w-full max-w-md">
        <div className="mb-3 text-panel">{item.displayName}</div>
        {item.kind === "image" && src ? (
          <img src={src} alt="" className="max-h-[70dvh] w-full rounded-xl object-contain" />
        ) : (
          <div className="grid min-h-80 place-items-center rounded-xl p-6 text-center text-2xl text-on" style={{ background: item.bg || "#008069" }}>
            {item.caption}
          </div>
        )}
        {item.caption && item.kind === "image" ? <p className="mt-3 text-center text-panel">{item.caption}</p> : null}
        {mine ? (
          <div className="mt-4 text-sm text-panel">
            <div className="mb-2">{t("seenBy")}</div>
            {(viewers.data ?? []).length === 0 ? <div className="text-panel/70">{t("nobodyYet")}</div> : null}
            {(viewers.data ?? []).map((v) => (
              <div key={v.username ?? v.displayName}>{v.displayName}</div>
            ))}
            <button
              type="button"
              className="mt-3 text-danger"
              onClick={() => void deleteStatus({ data: { id } }).then(() => {
                void qc.invalidateQueries({ queryKey: ["statuses"] });
                onClose();
              })}
            >
              {t("deleteStatus")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReportDialog({
  target,
  chatId,
  onClose,
}: {
  target: { userId?: string; messageId?: string };
  chatId: string | null;
  onClose: () => void;
}) {
  const { t, err } = usePrefs();
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-ink/40 p-4">
      <form
        className="w-full max-w-sm space-y-3 rounded-2xl bg-panel p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void reportUser({
            data: {
              reason,
              details,
              targetUserId: target.userId,
              targetMessageId: target.messageId,
              targetChatId: chatId,
            },
          }).then((res) => {
            if (!res.ok) toast.error(err(res.error));
            else toast.success(t("reportSent"));
            onClose();
          });
        }}
      >
        <h3 className="font-semibold">{t("report")}</h3>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-11 w-full rounded-lg bg-header px-2">
          <option value="spam">{t("spam")}</option>
          <option value="harassment">{t("harassment")}</option>
          <option value="other">{t("other")}</option>
        </select>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t("details")} className="h-24 w-full rounded-lg bg-header p-2 text-sm outline-none" />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-full bg-header">{t("cancel")}</button>
          <button className="h-11 flex-1 rounded-full bg-danger text-panel">{t("sendReport")}</button>
        </div>
      </form>
    </div>
  );
}

function Face({
  userId,
  rev,
  has,
  name,
  className,
}: {
  userId: string | null;
  rev: string;
  has: boolean;
  name: string;
  className: string;
}) {
  const q = useQuery({
    queryKey: ["avatar", userId, rev],
    queryFn: () => getAvatar({ data: { userId: userId ?? "" } }),
    enabled: Boolean(has && userId),
    staleTime: 120_000,
  });
  const src = q.data?.data ? `data:${q.data.mime};base64,${q.data.data}` : "";
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-header font-semibold text-muted ${className}`}>
      {src ? <img src={src} alt="" className="size-full object-cover" /> : (name || "?").slice(0, 1)}
    </span>
  );
}

function GroupFace({ chatId, rev, has, name, className }: { chatId: string; rev: string; has: boolean; name: string; className: string }) {
  const q = useQuery({
    queryKey: ["chat-avatar", chatId, rev],
    queryFn: () => getChatAvatar({ data: { chatId } }),
    enabled: has,
    staleTime: 120_000,
  });
  const src = q.data?.data ? `data:${q.data.mime};base64,${q.data.data}` : "";
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-header text-muted ${className}`}>
      {src ? <img src={src} alt="" className="size-full object-cover" /> : <Users className="size-5" />}
      {!src && name ? <span className="sr-only">{name}</span> : null}
    </span>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-11 place-items-center rounded-full text-muted hover:bg-hover">
      {children}
    </button>
  );
}

function MenuBtn({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block w-full px-4 py-3 text-start text-sm hover:bg-hover">
      {children}
    </button>
  );
}

function RowBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-11 w-full items-center rounded-lg px-2 text-start hover:bg-hover">
      {children}
    </button>
  );
}

function Field({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (v: string) => void; autoComplete?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <input
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-lg bg-header px-3 text-ink outline-none ring-1 ring-transparent focus:ring-green-2"
      />
    </label>
  );
}

function systemText(body: string | null, t: (k: CopyKey) => string) {
  if (!body) return "";
  if (body.startsWith("created:")) return `${body.slice(8)} ${t("systemCreated")}`;
  if (body.startsWith("added:")) {
    const [name, by] = body.slice(6).split(":");
    return `${by ?? ""} ${t("systemAdded")} ${name ?? ""}`;
  }
  if (body.startsWith("left:")) return `${body.slice(5)} ${t("systemLeft")}`;
  if (body.startsWith("removed:")) {
    const [name, by] = body.slice(8).split(":");
    return `${by ?? ""} ${t("systemRemoved")} ${name ?? ""}`;
  }
  if (body.startsWith("call:")) {
    const state = body.split(":")[2];
    if (state === "missed") return t("missedCall");
    if (state === "declined") return t("declinedCall");
    if (state === "cancelled") return t("cancelledCall");
    return t("endedCall");
  }
  return body;
}
