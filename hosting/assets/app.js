const EMOJI = ["😀","😁","😂","🤣","😊","😍","😘","😎","🤔","😢","😡","👍","👎","🙏","👏","🔥","❤️","💚","🎉","🌹","🌙","⭐","✅","📌","📎","🎵","📍","📷"];
const STICKERS = ["😀","🥰","😎","🤩","😭","🤯","👍","🙏","🔥","🎉","💯","🌹","🌙","⭐","🍀","🍕"];
const I18N = {
  fa: {
    app: "چت‌نینی", login: "ورود", signup: "ثبت‌نام", email: "ایمیل", phone: "شماره موبایل", password: "رمز",
    name: "نام", username: "نام کاربری", about: "بیو", send: "ارسال", search: "جستجو با نام، نام کاربری یا شماره",
    noChats: "هنوز گفتگویی نیست", empty: "یک گفتگو را انتخاب کن", type: "پیام", online: "آنلاین", typing: "داره تایپ می‌کنه…",
    recording: "داره ضبط می‌کنه…", lastSeen: "آخرین بازدید", you: "شما", deleted: "این پیام حذف شد", edited: "ویرایش شد",
    reply: "پاسخ", copy: "کپی", edit: "ویرایش", delMe: "حذف برای من", delAll: "حذف برای همه", forward: "فوروارد", pin: "سنجاق پیام",
    report: "گزارش", save: "ذخیره", cancel: "انصراف", settings: "تنظیمات", privacy: "حریم خصوصی", contacts: "مخاطبین",
    archive: "بایگانی", newGroup: "گروه جدید", status: "وضعیت", logout: "خروج", logoutAll: "خروج از همه دستگاه‌ها",
    everyone: "همه", nobody: "هیچ‌کس", contact: "مخاطبین", photo: "عکس نمایه", read: "تیک خوانده‌شدن",
    hideOnline: "مخفی کردن آنلاین", shareTyping: "نشان دادن تایپ و ضبط", sound: "صدا و ویبره", theme: "حالت شب",
    lang: "English", block: "مسدود", unblock: "رفع مسدودی", add: "افزودن مخاطب", group: "نام گروه", members: "اعضا",
    leave: "ترک گروه", mute: "بی‌صدا", unmute: "صدادار", pinChat: "سنجاق گفتگو", unpin: "برداشتن سنجاق",
    clear: "پاک کردن", removeChat: "حذف گفتگو", unread: "علامت نخوانده", twofa: "تأیید دو مرحله‌ای با ایمیل یا پیامک",
    forgot: "بازیابی رمز", code: "کد", reset: "رمز جدید", notif: "اعلان مرورگر و پوش", notes: "اعلان‌ها", sticker: "استیکر",
    gif: "گیف", loc: "موقعیت", live: "موقعیت زنده", camera: "ویدیو پیام", voice: "ویس", file: "فایل",
    image: "عکس", video: "ویدیو", audio: "صدا", people: "افراد", create: "ساخت", admin: "مدیر", owner: "سازنده",
    makeAdmin: "مدیر کردن", remove: "حذف", searchChat: "جستجو در گفتگو", forwarded: "فوروارد شده",
    minutes: "دقیقه", publish: "انتشار", viewers: "دیده‌شده توسط", myStatus: "وضعیت من", install: "نصب برنامه",
    or: "با ایمیل، شماره یا نام کاربری", loginId: "ایمیل، شماره یا نام کاربری",
    auth_failed: "ورود ناموفق", username_taken: "نام کاربری گرفته شده", weak_password: "رمز کوتاه است",
    rate: "کمی بعد دوباره تلاش کن", blocked: "مسدود است", blockedList: "مسدودشده‌ها", unarchive: "خروج از بایگانی",
    addMember: "افزودن عضو", groupPhoto: "عکس گروه", gifUrl: "آدرس گیف (https)", offline: "آفلاین — متن در صف می‌ماند",
    adminPanel: "مدیریت سامانه", reports: "گزارش‌ها", signups: "ثبت‌نام باز است", backup: "پشتیبان‌گیری",
    suspend: "تعلیق", restore: "فعال‌سازی", users: "کاربران", groups: "گروه‌ها", close: "بستن", demote: "گرفتن مدیریت",
    emptyArchive: "بایگانی خالی است", queued: "پیام در صف آفلاین ماند", removeContact: "حذف مخاطب",
    ok: "انجام شد", profile: "نمایه", new: "گفتگوی جدید", info: "اطلاعات", forward: "فوروارد",
    pickContact: "انتخاب مخاطب", statusView: "وضعیت", groupPane: "گروه",
  },
  en: {
    app: "Chat Nini", login: "Log in", signup: "Sign up", email: "Email", phone: "Mobile", password: "Password",
    name: "Name", username: "Username", about: "About", send: "Send", search: "Search name, username or phone",
    noChats: "No chats yet", empty: "Pick a chat", type: "Message", online: "online", typing: "typing…",
    recording: "recording audio…", lastSeen: "last seen", you: "You", deleted: "This message was deleted", edited: "edited",
    reply: "Reply", copy: "Copy", edit: "Edit", delMe: "Delete for me", delAll: "Delete for everyone", forward: "Forward", pin: "Pin",
    report: "Report", save: "Save", cancel: "Cancel", settings: "Settings", privacy: "Privacy", contacts: "Contacts",
    archive: "Archived", newGroup: "New group", status: "Status", logout: "Log out", logoutAll: "Log out all devices",
    everyone: "Everyone", nobody: "Nobody", contact: "Contacts", photo: "Profile photo", read: "Read receipts",
    hideOnline: "Hide online", shareTyping: "Show typing and recording", sound: "Sound and vibration", theme: "Dark mode",
    lang: "فارسی", block: "Block", unblock: "Unblock", add: "Add contact", group: "Group name", members: "Members",
    leave: "Leave group", mute: "Mute", unmute: "Unmute", pinChat: "Pin chat", unpin: "Unpin",
    clear: "Clear", removeChat: "Delete chat", unread: "Mark unread", twofa: "Email or SMS two-factor",
    forgot: "Reset password", code: "Code", reset: "New password", notif: "Browser notification and push", notes: "Alerts", sticker: "Sticker",
    gif: "GIF", loc: "Location", live: "Live location", camera: "Video message", voice: "Voice", file: "File",
    image: "Photo", video: "Video", audio: "Audio", people: "People", create: "Create", admin: "Admin", owner: "Owner",
    makeAdmin: "Make admin", remove: "Remove", searchChat: "Search in chat", forwarded: "Forwarded",
    minutes: "min", publish: "Publish", viewers: "Seen by", myStatus: "My status", install: "Install app",
    or: "Email, phone or username", loginId: "Email, phone or username",
    auth_failed: "Could not sign in", username_taken: "Username is taken", weak_password: "Password is too short",
    rate: "Slow down and try again", blocked: "Blocked", blockedList: "Blocked", unarchive: "Unarchive",
    addMember: "Add member", groupPhoto: "Group photo", gifUrl: "GIF https URL", offline: "Offline — text stays queued",
    adminPanel: "Admin", reports: "Reports", signups: "Signups open", backup: "Backup",
    suspend: "Suspend", restore: "Restore", users: "Users", groups: "Groups", close: "Close", demote: "Dismiss admin",
    emptyArchive: "Nothing archived", queued: "Message queued offline", removeContact: "Remove contact",
    ok: "Done", profile: "Profile", new: "New chat", info: "Info", forward: "Forward",
    pickContact: "Pick a contact", statusView: "Status", groupPane: "Group",
  },
};

const state = {
  token: localStorage.getItem("nini_token") || "",
  locale: localStorage.getItem("nini_locale") || "fa",
  theme: localStorage.getItem("nini_theme") || "light",
  me: null,
  mode: "login",
  chats: [],
  archivedChats: [],
  chatCache: null,
  chatId: null,
  messages: [],
  members: [],
  typing: [],
  pinned: 0,
  people: [],
  contacts: [],
  blocks: [],
  statuses: [],
  live: [],
  pane: null,
  ui: 0,
  menu: false,
  query: "",
  inChatQuery: "",
  draft: "",
  reply: null,
  editing: null,
  openMsg: null,
  deferredInstall: null,
  recorder: null,
  recording: false,
  forwardId: null,
  statusId: null,
  viewers: [],
  pollTimer: 0,
  seenNotes: new Set(),
  inbox: [],
  groupIds: [],
  adminData: null,
  archived: 0,
};

const root = document.getElementById("root");
const t = (k) => (I18N[state.locale] && I18N[state.locale][k]) || I18N.fa[k] || k;
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    if (c === "&") return "\u0026amp;";
    if (c === "<") return "\u0026lt;";
    if (c === ">") return "\u0026gt;";
    if (c === '"') return "\u0026quot;";
    return "\u0026#39;";
  });
}

function applyDoc() {
  document.documentElement.lang = state.locale === "en" ? "en" : "fa";
  document.documentElement.dir = state.locale === "en" ? "ltr" : "rtl";
  const dark = (state.me?.theme || state.theme) === "dark";
  document.documentElement.classList.toggle("dark", dark);
}

async function api(path, body, method) {
  const headers = {};
  if (state.token) headers.Authorization = "Bearer " + state.token;
  const opts = { method: method || (body ? "POST" : "GET"), headers };
  if (body) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch("/api" + path, opts);
  } catch {
    throw new Error("offline");
  }
  const data = await res.json().catch(() => ({ ok: false, error: "server" }));
  if (res.status === 401) {
    state.token = "";
    localStorage.removeItem("nini_token");
    state.me = null;
    render();
    throw new Error("unauthorized");
  }
  if (!data.ok) throw new Error(data.error || "error");
  return data.data;
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  const label = t(msg);
  el.textContent = label === msg ? msg : label;
  document.getElementById("toasts").appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function beep() {
  if (state.me && state.me.notifSound === false) return;
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.12);
  } catch { /* autoplay */ }
  if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
}

async function authedFile(id) {
  const res = await fetch("/api/files/" + id, { headers: { Authorization: "Bearer " + state.token } });
  if (!res.ok) return "";
  return URL.createObjectURL(await res.blob());
}

const blobCache = new Map();
async function srcFor(id) {
  if (!id) return "";
  if (blobCache.has(id)) return blobCache.get(id);
  const url = await authedFile(id);
  if (url) blobCache.set(id, url);
  return url;
}

function hydrateAvatars(scope) {
  (scope || document).querySelectorAll("[data-av]").forEach(async (node) => {
    const id = node.getAttribute("data-av");
    if (!id || node.dataset.loaded === id) return;
    node.dataset.loaded = id;
    const url = await srcFor(id);
    if (url && node.isConnected) node.innerHTML = `<img alt="" src="${url}">`;
  });
}

function avHtml(person, title) {
  const letter = esc((person?.displayName || title || "?").slice(0, 1));
  const file = person?.avatarFile || "";
  return `<span class="av"${file ? ` data-av="${esc(file)}"` : ""}>${letter}</span>`;
}

async function uploadFile(file) {
  const init = await api("/upload/init", { name: file.name || "file", mime: file.type || "application/octet-stream", size: file.size });
  const chunk = init.chunk || 480 * 1024;
  let offset = 0;
  while (offset < file.size) {
    const part = file.slice(offset, offset + chunk);
    const res = await fetch("/api/upload/chunk?id=" + init.id + "&offset=" + offset, {
      method: "POST",
      headers: { Authorization: "Bearer " + state.token, "Content-Type": "application/octet-stream" },
      body: part,
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "upload");
    offset += part.size;
  }
  return api("/upload/finish", { id: init.id });
}

function relTime(iso) {
  if (!iso) return "";
  const then = Date.parse(String(iso).replace(" ", "T") + "Z");
  const sec = Math.max(0, (Date.now() - then) / 1000);
  if (sec < 60) return state.locale === "fa" ? "لحظاتی پیش" : "just now";
  if (sec < 3600) return Math.floor(sec / 60) + (state.locale === "fa" ? " دقیقه پیش" : "m ago");
  if (sec < 86400) return Math.floor(sec / 3600) + (state.locale === "fa" ? " ساعت پیش" : "h ago");
  return String(iso).slice(0, 16);
}

function tickMarks(m) {
  if (!m.mine || m.deleted || m.kind === "system") return "";
  if (m.read) return '<span class="blue">✓✓</span>';
  if (m.delivered) return "<span>✓✓</span>";
  return "<span>✓</span>";
}

function previewText(last) {
  if (!last) return "";
  const map = { image: t("image"), video: t("video"), audio: t("voice"), file: t("file"), sticker: t("sticker"), gif: t("gif"), location: t("loc"), live_location: t("live"), video_note: t("camera"), contact: t("contacts") };
  return map[last.kind] || last.body || "";
}

function currentChat() {
  return state.chats.find((c) => c.id === state.chatId)
    || (state.archivedChats || []).find((c) => c.id === state.chatId)
    || (state.chatCache && state.chatCache.id === state.chatId ? state.chatCache : null);
}

function queueMessage(payload) {
  const q = JSON.parse(localStorage.getItem("nini_outbox") || "[]");
  q.push(payload);
  localStorage.setItem("nini_outbox", JSON.stringify(q.slice(-40)));
}

async function flushOutbox() {
  const q = JSON.parse(localStorage.getItem("nini_outbox") || "[]");
  if (!q.length) return;
  const left = [];
  for (const item of q) {
    try { await api("/messages", item); } catch (e) {
      if (e.message === "unauthorized") return;
      left.push(item);
    }
  }
  localStorage.setItem("nini_outbox", JSON.stringify(left));
}

async function boot() {
  applyDoc();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); state.deferredInstall = e; });
  window.addEventListener("online", () => { flushOutbox().then(() => refresh()).then(paint).catch(() => {}); });
  window.addEventListener("offline", () => paint());
  if (!state.token) return render();
  try {
    state.me = await api("/me");
    state.locale = state.me.locale || state.locale;
    state.theme = state.me.theme || state.theme;
    applyDoc();
    await refresh();
    render();
    clearInterval(state.pollTimer);
    state.pollTimer = setInterval(() => refresh().then(paint).catch(() => {}), 3000);
  } catch {
    render();
  }
}

async function refresh() {
  await flushOutbox();
  const data = await api("/poll");
  const freshNotes = (data.notifications || []).filter((n) => !state.seenNotes.has(n.id));
  freshNotes.forEach((n) => state.seenNotes.add(n.id));
  if (freshNotes.length) {
    freshNotes.forEach((n) => state.inbox.unshift({ id: n.id, title: n.title, body: n.body }));
    state.inbox = state.inbox.slice(0, 30);
    const n = freshNotes[0];
    const chat = state.chats.find((c) => c.id === n.chat_id);
    if (!chat || !chat.muted) {
      toast(n.title + " — " + n.body);
      beep();
      if (Notification.permission === "granted" && document.hidden) new Notification(n.title, { body: n.body, icon: "/favicon.svg" });
    }
    api("/notifications/seen", {}).catch(() => {});
  }
  state.chats = data.chats || [];
  state.statuses = data.statuses || [];
  state.live = data.live || [];
  state.archived = data.archived || 0;
  if (state.chatId) {
    if (!state.pane) await api("/messages/read", { chatId: state.chatId }).catch(() => {});
    const q = state.inChatQuery.trim();
    const thread = await api("/messages?chatId=" + state.chatId + (q ? "&q=" + encodeURIComponent(q) : ""));
    state.messages = thread.messages;
    state.members = thread.members;
    state.typing = thread.typing;
    state.pinned = thread.pinnedMessageId || 0;
  }
}

function render() {
  applyDoc();
  if (!state.token || !state.me) return renderAuth();
  renderShell();
  paint();
}

function renderAuth() {
  root.innerHTML = `<div class="auth"><form class="card" id="auth">
    <div class="row"><h1 class="grow">${esc(t("app"))}</h1>
      <button type="button" id="lang" class="btn ghost">${esc(t("lang"))}</button></div>
    <p class="muted">${esc(t("or"))}</p>
    <div class="tabs">
      <button type="button" data-mode="login" class="${state.mode === "login" ? "on" : ""}">${esc(t("login"))}</button>
      <button type="button" data-mode="signup" class="${state.mode === "signup" ? "on" : ""}">${esc(t("signup"))}</button>
    </div>
    ${state.mode === "signup" ? `<label>${esc(t("name"))}<input name="displayName" required></label><label>${esc(t("username"))}<input name="username" required pattern="[a-z0-9._]{3,24}"></label><label>${esc(t("email"))}<input name="email" type="email"></label><label>${esc(t("phone"))}<input name="phone" inputmode="tel" placeholder="+98912…"></label>` : `<label>${esc(t("loginId"))}<input name="login" required autocomplete="username"></label>`}
    <label>${esc(t("password"))}<input name="password" type="password" required minlength="8"></label>
    ${state.challenge ? `<label>${esc(t("code"))}<input name="code" required inputmode="numeric"></label>` : ""}
    <button class="btn full">${esc(state.mode === "signup" ? t("signup") : t("login"))}</button>
    <p><button type="button" id="forgot" class="btn ghost">${esc(t("forgot"))}</button></p>
    <div id="resetbox"></div>
  </form></div>`;
  root.querySelectorAll("[data-mode]").forEach((b) => { b.onclick = () => { state.mode = b.dataset.mode; state.challenge = null; renderAuth(); }; });
  root.querySelector("#lang").onclick = () => { state.locale = state.locale === "fa" ? "en" : "fa"; localStorage.setItem("nini_locale", state.locale); renderAuth(); };
  root.querySelector("#forgot").onclick = async () => {
    const email = (root.querySelector('[name="login"]') || root.querySelector('[name="email"]') || root.querySelector('[name="phone"]'))?.value || "";
    try {
      const res = await api("/auth/forgot", { login: email });
      root.querySelector("#resetbox").innerHTML = `<label>${esc(t("code"))}<input id="token" value="${esc(res.devToken || "")}"></label><label>${esc(t("reset"))}<input id="np" type="password" minlength="8"></label><button type="button" id="doreset" class="btn">${esc(t("save"))}</button>`;
      root.querySelector("#doreset").onclick = async () => {
        await api("/auth/reset", { token: root.querySelector("#token").value, password: root.querySelector("#np").value });
        toast("ok");
      };
    } catch (e) { toast(e.message); }
  };
  root.querySelector("#auth").onsubmit = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    try {
      if (state.challenge) {
        enter(await api("/auth/verify-2fa", { challenge: state.challenge, code: payload.code }));
        return;
      }
      const path = state.mode === "signup" ? "/auth/register" : "/auth/login";
      const body = state.mode === "signup" ? payload : { login: payload.login, password: payload.password };
      const res = await api(path, body);
      if (res.need2fa) {
        state.challenge = res.challenge;
        if (res.devCode) toast(String(res.devCode));
        renderAuth();
        return;
      }
      enter(res);
    } catch (err) { toast(err.message); }
  };
}

function enter(res) {
  state.token = res.token;
  state.me = res.me;
  localStorage.setItem("nini_token", res.token);
  state.challenge = null;
  boot();
}

function renderShell() {
  if (document.getElementById("shell")) return;
  root.innerHTML = `<div class="shell"><div class="frame" id="shell">
    <aside class="side">
      <div id="offbar" class="offline" hidden></div>
      <header class="head">
        <button class="avatar" id="meav" type="button"></button>
        <strong class="grow">${esc(t("app"))}</strong>
        <button class="icon" id="bell" type="button" aria-label="${esc(t("notes"))}">🔔</button>
        <button class="icon" id="newchat" type="button">＋</button>
        <button class="icon" id="menu" type="button">⋮</button>
      </header>
      <div id="menu-pop"></div>
      <input class="search" id="q" placeholder="${esc(t("search"))}">
      <div class="statuses" id="statuses"></div>
      <div class="chats" id="chats"></div>
    </aside>
    <section class="main" id="main"></section>
  </div></div>`;
  document.getElementById("menu").onclick = () => { state.menu = !state.menu; paint(); };
  document.getElementById("newchat").onclick = () => { state.pane = "new"; state.menu = false; state.ui++; paint(); };
  document.getElementById("q").oninput = async (e) => {
    state.query = e.target.value.trim();
    state.people = state.query.length >= 2 ? await api("/users/search?q=" + encodeURIComponent(state.query)).catch(() => []) : [];
    paintChats();
  };
  document.getElementById("meav").onclick = () => { state.pane = "profile"; state.ui++; paint(); };
  document.getElementById("bell").onclick = () => { state.pane = state.pane === "notes" ? null : "notes"; state.menu = false; state.ui++; paint(); };
}

function paint() {
  applyDoc();
  paintBell();
  if (!document.getElementById("shell")) return render();
  const frame = document.getElementById("shell");
  frame.classList.toggle("show-chat", Boolean(state.chatId) || Boolean(state.pane));
  const off = document.getElementById("offbar");
  if (off) {
    off.hidden = navigator.onLine;
    off.textContent = t("offline");
  }
  paintMenu();
  paintStatuses();
  paintChats();
  paintMain();
  const av = document.getElementById("meav");
  if (av && state.me) {
    if (state.me.avatarFile) av.setAttribute("data-av", state.me.avatarFile);
    else av.removeAttribute("data-av");
    if (!av.querySelector("img")) av.textContent = (state.me.displayName || "?").slice(0, 1);
  }
  hydrateAvatars(document);
}

function paintBell() {
  const b = document.getElementById("bell");
  if (!b) return;
  const n = state.inbox.length;
  b.textContent = n ? String(Math.min(n, 9)) : "🔔";
}

function paintMenu() {
  const el = document.getElementById("menu-pop");
  if (!el) return;
  if (!state.menu) { el.innerHTML = ""; return; }
  const items = [
    ["group", "newGroup"], ["status", "status"], ["contacts", "contacts"], ["blocked", "blockedList"], ["archive", "archive"],
    ["settings", "settings"], ["logoutAll", "logoutAll"], ["logout", "logout"],
  ];
  if (state.me?.role === "admin") items.unshift(["admin", "adminPanel"]);
  el.innerHTML = `<div class="menu">${items.map(([id, key]) => `<button type="button" data-go="${id}">${esc(t(key))}</button>`).join("")}</div>`;
  el.querySelectorAll("button").forEach((b) => { b.onclick = () => menuGo(b.dataset.go); });
}

async function menuGo(id) {
  state.menu = false;
  if (id === "logout") {
    state.token = "";
    localStorage.removeItem("nini_token");
    clearInterval(state.pollTimer);
    location.reload();
    return;
  }
  if (id === "logoutAll") {
    await api("/auth/logout-all", {});
    localStorage.removeItem("nini_token");
    location.reload();
    return;
  }
  state.pane = id === "group" ? "group" : id;
  state.ui++;
  if (id === "contacts") state.contacts = await api("/contacts");
  if (id === "blocked") state.blocks = await api("/blocks");
  if (id === "archive") state.archivedChats = await api("/chats?archived=1");
  if (id === "group") state.groupIds = [];
  if (id === "admin") await loadAdmin();
  paint();
}

async function loadAdmin() {
  const [overview, users, reports, groups] = await Promise.all([
    api("/admin/overview"), api("/admin/users"), api("/admin/reports"), api("/admin/groups"),
  ]);
  state.adminData = { overview, users, reports, groups };
}

function paintStatuses() {
  const el = document.getElementById("statuses");
  if (!el) return;
  const groups = new Map();
  for (const s of state.statuses) {
    const g = groups.get(s.userId) || { ...s, ids: [], unseen: false };
    g.ids.push(s.id);
    if (!s.viewed) g.unseen = true;
    groups.set(s.userId, g);
  }
  const mine = groups.get(state.me.id);
  const rest = [...groups.values()].filter((g) => g.userId !== state.me.id);
  const bubble = (g, seen) => `<button type="button" data-st="${g.ids[0]}"><span class="ring ${seen ? "seen" : ""} av"${g.avatarFile ? ` data-av="${esc(g.avatarFile)}"` : ""}>${esc((g.displayName || "?").slice(0, 1))}</span><div>${esc(g.displayName || "")}</div></button>`;
  el.innerHTML = `<button type="button" id="addst"><span class="ring">＋</span><div>${esc(t("myStatus"))}</div></button>`
    + (mine ? bubble(mine, true) : "")
    + rest.map((g) => bubble(g, !g.unseen)).join("");
  el.querySelector("#addst").onclick = () => { state.pane = "status"; state.ui++; paint(); };
  el.querySelectorAll("[data-st]").forEach((b) => { b.onclick = () => openStatus(Number(b.dataset.st)); });
}

function paintChats() {
  const el = document.getElementById("chats");
  if (!el) return;
  const people = state.query.length >= 2
    ? `<div class="muted" style="padding:8px 12px">${esc(t("people"))}</div>` + state.people.map((p) => `<button type="button" class="chat" data-user="${p.id}">${avHtml(p)}<span class="grow"><b>${esc(p.displayName)}</b><div class="sub">@${esc(p.username || "")} ${esc(p.phone || "")}</div></span></button>`).join("")
    : "";
  const arch = !state.query && state.archived
    ? `<button type="button" class="chat" id="openarch"><span class="av">▣</span><span class="grow"><b>${esc(t("archive"))}</b></span><span class="badge">${state.archived}</span></button>`
    : "";
  const q = state.query.toLowerCase();
  const list = state.chats.filter((c) => !q || (c.title || "").toLowerCase().includes(q) || (c.last?.body || "").toLowerCase().includes(q));
  el.innerHTML = people + arch + (list.length ? list.map((c) => `<button type="button" class="chat ${c.id === state.chatId ? "on" : ""}" data-chat="${c.id}">
      <span class="rel">${avHtml({ displayName: c.title, avatarFile: c.avatarFile }, c.title)}${c.online ? '<i class="dot"></i>' : ""}</span>
      <span class="grow"><span class="meta"><b>${c.pinned ? "📌 " : ""}${c.muted ? "🔇 " : ""}${esc(c.title)}</b><small class="${c.unread ? "" : "muted"}">${esc(relTime(c.last?.createdAt || c.updatedAt))}</small></span>
      <span class="meta"><span class="sub">${esc(previewText(c.last))}</span>${c.unread ? `<span class="badge">${c.unread}</span>` : ""}</span></span>
    </button>`).join("") : `<div class="empty">${esc(t("noChats"))}</div>`);
  el.querySelectorAll("[data-user]").forEach((b) => { b.onclick = () => openUser(Number(b.dataset.user)); });
  el.querySelectorAll("[data-chat]").forEach((b) => { b.onclick = () => openChat(Number(b.dataset.chat)); });
  const openarch = el.querySelector("#openarch");
  if (openarch) openarch.onclick = () => menuGo("archive");
  hydrateAvatars(el);
}

async function openUser(id) {
  const res = await api("/chats/direct", { userId: id });
  state.query = "";
  state.people = [];
  const q = document.getElementById("q");
  if (q) q.value = "";
  state.pane = null;
  await refresh();
  await openChat(res.id);
}

async function openChat(id) {
  state.chatId = id;
  state.pane = null;
  state.openMsg = null;
  state.chatCache = state.chats.find((c) => c.id === id) || (state.archivedChats || []).find((c) => c.id === id) || state.chatCache;
  await api("/messages/read", { chatId: id }).catch(() => {});
  await refresh();
  paint();
  const box = document.getElementById("msgs");
  if (box) box.scrollTop = box.scrollHeight;
}

function presenceLine(chat) {
  const typing = state.typing[0];
  if (typing) return (typing.name ? typing.name + " " : "") + (typing.kind === "recording" ? t("recording") : t("typing"));
  if (chat?.kind === "group") return (state.members.length || "") + " " + t("members");
  if (chat?.online) return t("online");
  if (chat?.lastSeenAt) return t("lastSeen") + " " + relTime(chat.lastSeenAt);
  if (chat?.presenceHidden) return "";
  return "";
}

function paintMain() {
  const main = document.getElementById("main");
  if (!main) return;
  if (state.pane) {
    if (main.dataset.pane === state.pane && main.dataset.ui === String(state.ui) && document.getElementById("pane")) return;
    main.dataset.view = "pane";
    main.dataset.pane = state.pane;
    main.dataset.ui = String(state.ui);
    main.dataset.chat = "";
    paintPane(main);
    return;
  }
  main.dataset.pane = "";
  if (!state.chatId) {
    if (main.dataset.view !== "empty") {
      main.dataset.view = "empty";
      main.dataset.chat = "";
      main.innerHTML = `<div class="empty"><h2>${esc(t("app"))}</h2><p>${esc(t("empty"))}</p></div>`;
    }
    return;
  }
  const chat = currentChat();
  const presence = presenceLine(chat);
  const same = main.dataset.view === "chat" && main.dataset.chat === String(state.chatId) && document.getElementById("draft");
  if (!same) {
    const back = state.locale === "en" ? "←" : "→";
    main.dataset.view = "chat";
    main.dataset.chat = String(state.chatId);
    main.innerHTML = `<header class="head">
        <button class="icon" id="back" type="button">${back}</button>
        <button class="grow" id="info" type="button" style="border:0;background:transparent;color:inherit;text-align:start">
          <b id="ctitle"></b><div class="muted" id="presence"></div>
        </button>
        <input id="inq" placeholder="${esc(t("searchChat"))}" value="${esc(state.inChatQuery)}" style="max-width:140px">
      </header>
      <div class="wallpaper" id="msgs"></div>
      <div id="replybar"></div>
      <div id="extra"></div>
      <form class="compose" id="composer">
        <button type="button" class="icon" id="emoji">☺</button>
        <button type="button" class="icon" id="attach">📎</button>
        <textarea id="draft" rows="1" placeholder="${esc(t("type"))}"></textarea>
        <button class="icon" id="send" type="submit">🎤</button>
      </form>`;
    bindComposer();
  }
  document.getElementById("ctitle").textContent = chat?.title || "";
  document.getElementById("presence").textContent = presence;
  const draft = document.getElementById("draft");
  if (draft && document.activeElement !== draft && !state.editing) draft.value = state.draft;
  syncSend();
  renderReplyBar();
  renderThread();
}

function bindComposer() {
  document.getElementById("back").onclick = () => { state.chatId = null; state.reply = null; state.editing = null; paint(); };
  document.getElementById("info").onclick = () => { state.pane = "info"; state.ui++; paint(); };
  let timer = 0;
  document.getElementById("inq").oninput = (e) => {
    state.inChatQuery = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(async () => { await refresh(); renderThread(); }, 280);
  };
  document.getElementById("draft").oninput = (e) => {
    state.draft = e.target.value;
    api("/typing", { chatId: state.chatId, kind: e.target.value ? "typing" : "off" }).catch(() => {});
    syncSend();
  };
  document.getElementById("emoji").onclick = () => togglePicker("emoji");
  document.getElementById("attach").onclick = () => togglePicker("attach");
  document.getElementById("composer").onsubmit = (e) => { e.preventDefault(); sendDraft(); };
}

function syncSend() {
  const btn = document.getElementById("send");
  const draft = document.getElementById("draft");
  if (!btn || !draft) return;
  btn.textContent = state.recording ? "■" : (draft.value.trim() || state.editing ? "➤" : "🎤");
}

function renderReplyBar() {
  const bar = document.getElementById("replybar");
  if (!bar) return;
  if (state.editing) {
    bar.innerHTML = `<div class="replybar"><span class="grow">${esc(t("edit"))}: ${esc(state.editing.body || "")}</span><button type="button" id="clearreply">${esc(t("cancel"))}</button></div>`;
  } else if (state.reply) {
    bar.innerHTML = `<div class="replybar"><span class="grow">${esc(t("reply"))}: ${esc(state.reply.body || state.reply.kind)}</span><button type="button" id="clearreply">${esc(t("cancel"))}</button></div>`;
  } else bar.innerHTML = "";
  const c = document.getElementById("clearreply");
  if (c) c.onclick = () => { state.reply = null; state.editing = null; syncSend(); renderReplyBar(); };
}

function renderThread() {
  const box = document.getElementById("msgs");
  if (!box) return;
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 90;
  const pinned = state.messages.find((m) => m.id === state.pinned);
  box.innerHTML = (pinned ? `<div class="linkcard">📌 ${esc(pinned.body || pinned.kind)}</div>` : "") + state.messages.map(bubble).join("");
  box.querySelectorAll("[data-msg]").forEach((b) => {
    b.onclick = () => {
      state.openMsg = state.openMsg === Number(b.dataset.msg) ? null : Number(b.dataset.msg);
      renderThread();
    };
  });
  wireActions();
  if (near) box.scrollTop = box.scrollHeight;
}

function bubble(m) {
  if (m.kind === "system") return `<div class="empty">${esc(m.body || "")}</div>`;
  const live = state.live.find((l) => l.messageId === m.id);
  let inner = "";
  if (m.deleted) inner = `<p class="muted">${esc(t("deleted"))}</p>`;
  else if (m.kind === "text") {
    const preview = m.meta && m.meta.url && m.meta.title ? `<a class="linkcard" href="${esc(m.meta.url)}" target="_blank" rel="noopener">${m.meta.image ? `<img class="media" alt="" src="${esc(m.meta.image)}">` : ""}${esc(m.meta.title)}<div class="muted">${esc(m.meta.description || "")}</div></a>` : "";
    inner = preview + `<p>${esc(m.body || "")}</p>`;
  } else if (m.kind === "sticker") inner = `<div style="font-size:64px">${STICKERS[Number(String(m.meta?.sticker || "s1").slice(1)) - 1] || "⭐"}</div>`;
  else if (m.kind === "location" || m.kind === "live_location") {
    const lat = Number(live?.lat ?? m.meta?.lat);
    const lng = Number(live?.lng ?? m.meta?.lng);
    inner = Number.isFinite(lat) && Number.isFinite(lng)
      ? `<iframe class="map" title="map" src="https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}"></iframe><div class="muted">${esc(m.kind === "live_location" ? t("live") : t("loc"))}</div>`
      : `<p>${esc(t("loc"))}</p>`;
  } else if (m.kind === "contact") inner = `<button type="button" class="linkcard" data-openuser="${m.meta?.userId || ""}">${esc(m.meta?.name || "")}<div>@${esc(m.meta?.username || "")} ${esc(m.meta?.phone || "")}</div></button>`;
  else if (m.kind === "gif" && m.meta?.url && !m.fileId) inner = `<img class="media" alt="" src="${esc(m.meta.url)}">`;
  else if (m.fileId) inner = `<div data-file="${esc(m.fileId)}" data-kind="${esc(m.kind)}" data-name="${esc(m.fileName || "")}">…</div>`;
  else inner = `<p>${esc(m.body || m.kind)}</p>`;
  const quote = m.reply ? `<div class="quote">${esc(m.reply.body || m.reply.kind)}</div>` : "";
  const actions = state.openMsg === m.id ? `<div class="actions">
      <button type="button" data-act="reply">${esc(t("reply"))}</button>
      <button type="button" data-act="copy">${esc(t("copy"))}</button>
      ${m.mine && m.kind === "text" && !m.deleted ? `<button type="button" data-act="edit">${esc(t("edit"))}</button>` : ""}
      <button type="button" data-act="delMe">${esc(t("delMe"))}</button>
      ${m.mine ? `<button type="button" data-act="delAll">${esc(t("delAll"))}</button>` : ""}
      <button type="button" data-act="forward">${esc(t("forward"))}</button>
      <button type="button" data-act="pin">${esc(t("pin"))}</button>
      ${m.mine ? "" : `<button type="button" data-act="report">${esc(t("report"))}</button>`}
    </div>` : "";
  return `<div class="bubble ${m.mine ? "mine" : "theirs"}" data-msg="${m.id}">
    ${m.forwarded ? `<div class="muted">${esc(t("forwarded"))}</div>` : ""}
    ${!m.mine && state.members.length > 2 ? `<div class="muted">${esc(m.senderName)}</div>` : ""}
    ${quote}${inner}${actions}
    <div class="ticks"><span>${esc(m.editedAt ? t("edited") + " · " : "")}${esc((m.createdAt || "").slice(11, 16))}</span>${tickMarks(m)}</div>
  </div>`;
}

function wireActions() {
  document.querySelectorAll("[data-file]").forEach(async (node) => {
    const url = await srcFor(node.dataset.file);
    if (!url || !node.isConnected) return;
    const kind = node.dataset.kind;
    if (kind === "image" || kind === "gif") node.innerHTML = `<img class="media" alt="" src="${url}">`;
    else if (kind === "video" || kind === "video_note") node.innerHTML = `<video class="media" controls src="${url}" ${kind === "video_note" ? 'style="border-radius:50%;width:180px;height:180px;object-fit:cover"' : ""}></video>`;
    else if (kind === "audio") node.innerHTML = `<audio controls src="${url}"></audio>`;
    else node.innerHTML = `<a class="linkcard" href="${url}" download="${esc(node.dataset.name)}">${esc(node.dataset.name || t("file"))}</a>`;
  });
  document.querySelectorAll("[data-act]").forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      const m = state.messages.find((x) => x.id === state.openMsg);
      if (m) act(b.dataset.act, m);
    };
  });
  document.querySelectorAll("[data-openuser]").forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); if (b.dataset.openuser) openUser(Number(b.dataset.openuser)); };
  });
}

async function act(name, m) {
  if (name === "reply") { state.reply = m; state.editing = null; }
  if (name === "copy") { try { await navigator.clipboard.writeText(m.body || ""); toast("ok"); } catch { toast("copy"); } }
  if (name === "edit") {
    state.editing = m;
    state.reply = null;
    const d = document.getElementById("draft");
    if (d) d.value = m.body || "";
    syncSend();
  }
  if (name === "delMe") await api("/messages/delete", { id: m.id, scope: "me" });
  if (name === "delAll") await api("/messages/delete", { id: m.id, scope: "all" });
  if (name === "pin") await api("/messages/pin", { id: m.id });
  if (name === "report") await api("/reports", { reason: "spam", userId: m.senderId, messageId: m.id });
  if (name === "forward") { state.forwardId = m.id; state.pane = "forward"; state.ui++; }
  state.openMsg = null;
  if (name !== "reply" && name !== "edit" && name !== "copy") await refresh();
  paint();
}

function togglePicker(kind) {
  const extra = document.getElementById("extra");
  if (!extra) return;
  if (extra.dataset.kind === kind) { extra.innerHTML = ""; extra.dataset.kind = ""; return; }
  extra.dataset.kind = kind;
  if (kind === "emoji") {
    extra.innerHTML = `<div class="picker">${EMOJI.map((e) => `<button type="button" data-em="${e}">${e}</button>`).join("")}</div>`;
    extra.querySelectorAll("[data-em]").forEach((b) => {
      b.onclick = () => {
        const d = document.getElementById("draft");
        d.value += b.dataset.em;
        state.draft = d.value;
        syncSend();
      };
    });
    return;
  }
  extra.innerHTML = `<div class="picker">
    ${STICKERS.map((e, i) => `<button type="button" data-st="s${i + 1}">${e}</button>`).join("")}
    <button type="button" data-pick="image">${esc(t("image"))}</button>
    <button type="button" data-pick="video">${esc(t("video"))}</button>
    <button type="button" data-pick="audio">${esc(t("audio"))}</button>
    <button type="button" data-pick="file">${esc(t("file"))}</button>
    <button type="button" data-pick="gif">${esc(t("gif"))}</button>
    <button type="button" data-pick="gifurl">${esc(t("gifUrl"))}</button>
    <button type="button" data-pick="camera">${esc(t("camera"))}</button>
    <button type="button" data-pick="loc">${esc(t("loc"))}</button>
    <button type="button" data-pick="live">${esc(t("live"))} 15</button>
    <button type="button" data-pick="live30">30</button>
    <button type="button" data-pick="live60">60</button>
    <button type="button" data-pick="contact">${esc(t("contact"))}</button>
  </div><input id="file" type="file" hidden>`;
  extra.querySelectorAll("[data-st]").forEach((b) => { b.onclick = () => sendSpecial("sticker", { meta: { sticker: b.dataset.st } }); });
  extra.querySelectorAll("[data-pick]").forEach((b) => { b.onclick = () => pickKind(b.dataset.pick); });
}

async function pickKind(kind) {
  if (kind === "loc") return sendLocation(false, 0);
  if (kind === "live" || kind === "live30" || kind === "live60") {
    const mins = kind === "live60" ? 60 : kind === "live30" ? 30 : 15;
    return sendLocation(true, mins);
  }
  if (kind === "contact") {
    state.contacts = await api("/contacts");
    state.pane = "pickContact";
    state.ui++;
    paint();
    return;
  }
  if (kind === "camera") return recordVideo();
  if (kind === "gifurl") {
    const url = prompt(t("gifUrl"));
    if (url && url.startsWith("https://")) return sendSpecial("gif", { meta: { url } });
    return;
  }
  const input = document.getElementById("file");
  input.accept = kind === "image" ? "image/*" : kind === "gif" ? "image/gif,image/webp" : kind === "video" ? "video/*" : kind === "audio" ? "audio/*" : "*/*";
  input.onchange = async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const up = await uploadFile(file);
      const map = { image: "image", video: "video", audio: "audio", gif: "gif", file: "file" };
      await sendSpecial(map[kind] || "file", { fileId: up.id });
    } catch (e) { toast(e.message); }
  };
  input.click();
}

async function sendLocation(live, minutes) {
  const pos = await new Promise((resolve) => navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: true, timeout: 8000 }));
  const lat = pos ? pos.coords.latitude : Number(prompt("lat"));
  const lng = pos ? pos.coords.longitude : Number(prompt("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const res = await sendSpecial(live ? "live_location" : "location", { meta: { lat, lng }, minutes: live ? minutes : undefined });
  if (live && res?.id && navigator.geolocation.watchPosition) {
    const watch = navigator.geolocation.watchPosition((p) => api("/live", { messageId: res.id, lat: p.coords.latitude, lng: p.coords.longitude }).catch(() => {}));
    setTimeout(() => navigator.geolocation.clearWatch(watch), minutes * 60 * 1000);
  }
}

async function recordVideo() {
  if (state.videoRec) { state.videoRec.stop(); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); }
  catch { toast("camera"); return; }
  const rec = new MediaRecorder(stream);
  const bits = [];
  rec.ondataavailable = (e) => { if (e.data.size) bits.push(e.data); };
  rec.onstop = async () => {
    stream.getTracks().forEach((tr) => tr.stop());
    state.videoRec = null;
    const file = new File(bits, "note.webm", { type: rec.mimeType || "video/webm" });
    try {
      const up = await uploadFile(file);
      await sendSpecial("video_note", { fileId: up.id });
    } catch (e) { toast(e.message); }
  };
  state.videoRec = rec;
  rec.start();
  toast("●");
  setTimeout(() => { if (state.videoRec === rec && rec.state === "recording") rec.stop(); }, 12000);
}

async function sendDraft() {
  if (state.recording && state.recorder) {
    state.recorder.stop();
    state.recording = false;
    syncSend();
    return;
  }
  const text = (document.getElementById("draft")?.value || "").trim();
  if (!text) return toggleVoice();
  const payload = { chatId: state.chatId, kind: "text", body: text, replyTo: state.reply?.id || undefined };
  try {
    if (state.editing) {
      await api("/messages/edit", { id: state.editing.id, body: text });
      state.editing = null;
    } else {
      if (/^https?:\/\/\S+$/.test(text)) {
        try { payload.meta = await api("/link-preview?url=" + encodeURIComponent(text)); } catch { /* preview optional */ }
      }
      await api("/messages", payload);
    }
  } catch (e) {
    if (e.message === "offline" && !state.editing) {
      queueMessage(payload);
      toast(t("queued"));
    } else {
      toast(e.message);
      return;
    }
  }
  state.reply = null;
  state.draft = "";
  const d = document.getElementById("draft");
  if (d) d.value = "";
  await api("/typing", { chatId: state.chatId, kind: "off" }).catch(() => {});
  await refresh().catch(() => {});
  paint();
}

async function toggleVoice() {
  if (state.recording && state.recorder) {
    state.recorder.stop();
    state.recording = false;
    syncSend();
    return;
  }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch { toast("audio"); return; }
  await api("/typing", { chatId: state.chatId, kind: "recording" }).catch(() => {});
  const rec = new MediaRecorder(stream);
  const bits = [];
  rec.ondataavailable = (e) => { if (e.data.size) bits.push(e.data); };
  rec.onstop = async () => {
    stream.getTracks().forEach((tr) => tr.stop());
    state.recording = false;
    syncSend();
    await api("/typing", { chatId: state.chatId, kind: "off" }).catch(() => {});
    if (!bits.length) return;
    try {
      const file = new File(bits, "voice.webm", { type: rec.mimeType || "audio/webm" });
      const up = await uploadFile(file);
      await sendSpecial("audio", { fileId: up.id });
    } catch (e) { toast(e.message); }
  };
  state.recorder = rec;
  state.recording = true;
  rec.start();
  syncSend();
  toast(t("recording"));
}

async function sendSpecial(kind, extra) {
  const res = await api("/messages", { chatId: state.chatId, kind, body: extra.body || "", replyTo: state.reply?.id, ...extra });
  state.reply = null;
  state.pane = state.pane === "pickContact" ? null : state.pane;
  await refresh();
  paint();
  return res;
}

function paneTitle() {
  const map = { new: "search", group: "newGroup", settings: "settings", profile: "profile", contacts: "contacts", archive: "archive", forward: "forward", info: "info", status: "status", statusView: "status", blocked: "blockedList", admin: "adminPanel", pickContact: "pickContact", notes: "notes" };
  return t(map[state.pane] || state.pane);
}

function paintPane(main) {
  const back = state.locale === "en" ? "←" : "→";
  main.innerHTML = `<div class="overlay"><header class="head"><button class="icon" id="back" type="button">${back}</button><b>${esc(paneTitle())}</b></header><div class="body" id="pane"></div></div>`;
  document.getElementById("back").onclick = () => { state.pane = null; paint(); };
  const pane = document.getElementById("pane");
  if (state.pane === "settings") pane.innerHTML = settingsHtml();
  else if (state.pane === "profile") pane.innerHTML = profileHtml();
  else if (state.pane === "contacts") pane.innerHTML = state.contacts.map((c) => `<div class="row" style="margin:6px 0">${avHtml(c)}<button type="button" class="listbtn grow" data-user="${c.id}">${esc(c.displayName)} <span class="muted">@${esc(c.username || "")}</span></button><button type="button" class="btn ghost" data-uncontact="${c.id}">${esc(t("remove"))}</button></div>`).join("") || `<p class="muted">—</p>`;
  else if (state.pane === "blocked") pane.innerHTML = state.blocks.map((c) => `<div class="row" style="margin:6px 0">${avHtml(c)}<span class="grow">${esc(c.displayName)}</span><button type="button" class="btn ghost" data-unblock="${c.id}">${esc(t("unblock"))}</button></div>`).join("") || `<p class="muted">—</p>`;
  else if (state.pane === "group") pane.innerHTML = groupHtml();
  else if (state.pane === "new") pane.innerHTML = `<label>${esc(t("search"))}<input id="find" placeholder="${esc(t("search"))}"></label><div id="found"></div>`;
  else if (state.pane === "status") pane.innerHTML = statusHtml();
  else if (state.pane === "notes") pane.innerHTML = state.inbox.map((n) => `<div class="listbtn"><b>${esc(n.title)}</b><div class="muted">${esc(n.body)}</div></div>`).join("") || `<p class="muted">—</p>`;
  else if (state.pane === "archive") pane.innerHTML = archiveHtml();
  else if (state.pane === "forward") pane.innerHTML = state.chats.map((c) => `<button type="button" class="listbtn" data-to="${c.id}">${esc(c.title)}</button>`).join("") || `<p class="muted">—</p>`;
  else if (state.pane === "info") pane.innerHTML = infoHtml();
  else if (state.pane === "statusView") pane.innerHTML = statusViewHtml();
  else if (state.pane === "pickContact") pane.innerHTML = state.contacts.map((c) => `<button type="button" class="listbtn" data-sendc="${c.id}">${esc(c.displayName)} <span class="muted">@${esc(c.username || "")}</span></button>`).join("") || `<p class="muted">—</p>`;
  else if (state.pane === "admin") pane.innerHTML = adminHtml();
  wirePane(pane);
  hydrateAvatars(pane);
}

function wirePane(pane) {
  pane.querySelectorAll("[data-user]").forEach((b) => { b.onclick = () => openUser(Number(b.dataset.user)); });
  pane.querySelectorAll("[data-to]").forEach((b) => {
    b.onclick = async () => {
      await api("/messages/forward", { id: state.forwardId, chatId: Number(b.dataset.to) });
      state.pane = null;
      await refresh();
      paint();
    };
  });
  pane.querySelectorAll("[data-unblock]").forEach((b) => {
    b.onclick = async () => {
      await api("/blocks", { userId: Number(b.dataset.unblock), block: false });
      state.blocks = await api("/blocks");
      state.ui++;
      paint();
    };
  });
  pane.querySelectorAll("[data-uncontact]").forEach((b) => {
    b.onclick = async () => {
      await api("/contacts", { userId: Number(b.dataset.uncontact), add: false });
      state.contacts = await api("/contacts");
      state.ui++;
      paint();
    };
  });
  pane.querySelectorAll("[data-sendc]").forEach((b) => {
    b.onclick = () => sendSpecial("contact", { meta: { userId: Number(b.dataset.sendc) } });
  });
  pane.querySelectorAll("[data-flag]").forEach((b) => { b.onclick = () => flagChat(b.dataset.flag); });
  pane.querySelectorAll("[data-unarch]").forEach((b) => {
    b.onclick = async () => {
      await api("/chats/flags", { chatId: Number(b.dataset.unarch), archived: false });
      state.archivedChats = await api("/chats?archived=1");
      state.ui++;
      await refresh();
      paint();
    };
  });
  pane.querySelectorAll("[data-archopen]").forEach((b) => { b.onclick = () => openChat(Number(b.dataset.archopen)); });
  const form = pane.querySelector("form");
  if (form) form.onsubmit = (e) => submitPane(e);
  const photo = pane.querySelector("#photo");
  if (photo) photo.onchange = () => changePhoto(photo.files[0]);
  const stimg = pane.querySelector("#stfile");
  if (stimg) stimg.onchange = () => publishStatus(stimg.files[0]);
  const pub = pane.querySelector("#pubtext");
  if (pub) pub.onclick = () => publishStatus(null);
  const find = pane.querySelector("#find");
  if (find) find.oninput = async () => {
    const q = find.value.trim();
    const people = q.length >= 2 ? await api("/users/search?q=" + encodeURIComponent(q)).catch(() => []) : [];
    const box = pane.querySelector("#found");
    box.innerHTML = people.map((p) => `<button type="button" class="listbtn" data-user="${p.id}">${esc(p.displayName)} <span class="muted">@${esc(p.username || "")}</span></button>`).join("");
    box.querySelectorAll("[data-user]").forEach((b) => { b.onclick = () => openUser(Number(b.dataset.user)); });
  };
  const gfind = pane.querySelector("#gfind");
  if (gfind) gfind.oninput = async () => {
    const q = gfind.value.trim();
    const people = q.length >= 2 ? await api("/users/search?q=" + encodeURIComponent(q)).catch(() => []) : [];
    const box = pane.querySelector("#gfound");
    box.innerHTML = people.map((p) => `<button type="button" class="listbtn" data-pickg="${p.id}">${state.groupIds.includes(p.id) ? "✓ " : ""}${esc(p.displayName)}</button>`).join("");
    box.querySelectorAll("[data-pickg]").forEach((b) => {
      b.onclick = () => {
        const id = Number(b.dataset.pickg);
        state.groupIds = state.groupIds.includes(id) ? state.groupIds.filter((x) => x !== id) : state.groupIds.concat(id);
        pane.querySelector("#gpicked").textContent = state.groupIds.join(", ");
        b.textContent = (state.groupIds.includes(id) ? "✓ " : "") + b.textContent.replace(/^✓ /, "");
      };
    });
  };
  const gcreate = pane.querySelector("#gcreate");
  if (gcreate) gcreate.onclick = async () => {
    const title = pane.querySelector("#gtitle").value.trim();
    try {
      const res = await api("/chats/group", { title, memberIds: state.groupIds });
      state.pane = null;
      state.groupIds = [];
      await refresh();
      await openChat(res.id);
    } catch (e) { toast(e.message); }
  };
  wireInfo(pane);
  wireAdmin(pane);
}

function privSelect(name, label, val) {
  const opts = [["everyone", t("everyone")], ["contacts", t("contact")], ["nobody", t("nobody")]];
  return `<label>${esc(label)}<select name="${name}">${opts.map(([v, l]) => `<option value="${v}" ${val === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
}

function settingsHtml() {
  const m = state.me;
  return `<form>
    ${privSelect("privacyPhoto", t("photo"), m.privacyPhoto)}
    ${privSelect("privacyLastSeen", t("lastSeen"), m.privacyLastSeen)}
    ${privSelect("privacyAbout", t("about"), m.privacyAbout)}
    ${privSelect("privacyStatus", t("status"), m.privacyStatus)}
    <label class="chk"><input type="checkbox" name="hideOnline" ${m.hideOnline ? "checked" : ""}> ${esc(t("hideOnline"))}</label>
    <label class="chk"><input type="checkbox" name="shareTyping" ${m.shareTyping ? "checked" : ""}> ${esc(t("shareTyping"))}</label>
    <label class="chk"><input type="checkbox" name="readReceipts" ${m.readReceipts ? "checked" : ""}> ${esc(t("read"))}</label>
    <label class="chk"><input type="checkbox" name="notifSound" ${m.notifSound ? "checked" : ""}> ${esc(t("sound"))}</label>
    <label class="chk"><input type="checkbox" name="twoFactor" ${m.twoFactor ? "checked" : ""}> ${esc(t("twofa"))}</label>
    <label class="chk"><input type="checkbox" name="dark" ${m.theme === "dark" ? "checked" : ""}> ${esc(t("theme"))}</label>
    <button class="btn" type="submit">${esc(t("save"))}</button>
    <button class="btn ghost" type="button" id="askn">${esc(t("notif"))}</button>
    <button class="btn ghost" type="button" id="lang2">${esc(t("lang"))}</button>
    ${state.deferredInstall ? `<button class="btn ghost" type="button" id="install">${esc(t("install"))}</button>` : `<p class="muted">${esc(t("install"))}</p>`}
  </form>`;
}

function profileHtml() {
  const m = state.me;
  return `<form>
    <div class="av lg" id="bigav" ${m.avatarFile ? `data-av="${esc(m.avatarFile)}"` : ""}>${esc((m.displayName || "?").slice(0, 1))}</div>
    <label>${esc(t("name"))}<input name="displayName" value="${esc(m.displayName)}"></label>
    <label>${esc(t("username"))}<input name="username" value="${esc(m.username || "")}"></label>
    <label>${esc(t("about"))}<input name="about" value="${esc(m.about || "")}"></label>
    <label>${esc(t("phone"))}<input name="phone" value="${esc(m.phone || "")}"></label>
    <label>${esc(t("email"))}<input name="email" value="${esc(m.email || "")}"></label>
    <label>${esc(t("photo"))}<input id="photo" type="file" accept="image/*"></label>
    <button class="btn" type="submit">${esc(t("save"))}</button>
    <button class="btn ghost" type="button" id="delav">${esc(t("remove"))}</button>
  </form>`;
}

function groupHtml() {
  return `<label>${esc(t("group"))}<input id="gtitle" required></label>
    <label>${esc(t("addMember"))}<input id="gfind" placeholder="${esc(t("search"))}"></label>
    <p class="muted" id="gpicked"></p>
    <div id="gfound"></div>
    <button class="btn" type="button" id="gcreate">${esc(t("create"))}</button>`;
}

function statusHtml() {
  return `<label>${esc(t("status"))}<textarea id="cap"></textarea></label>
    <button class="btn" id="pubtext" type="button">${esc(t("publish"))}</button>
    <label>${esc(t("image"))} / ${esc(t("video"))}<input id="stfile" type="file" accept="image/*,video/*"></label>`;
}

function archiveHtml() {
  if (!state.archivedChats.length) return `<p class="muted">${esc(t("emptyArchive"))}</p>`;
  return state.archivedChats.map((c) => `<div class="row"><button type="button" class="listbtn grow" data-archopen="${c.id}">${esc(c.title)}</button><button type="button" class="btn ghost" data-unarch="${c.id}">${esc(t("unarchive"))}</button></div>`).join("");
}

function infoHtml() {
  const chat = currentChat();
  const peer = state.members.find((m) => m.id === chat?.peerId);
  const manage = chat?.kind === "group" && (chat.myRole === "owner" || chat.myRole === "admin");
  const people = state.members.map((m) => {
    let tools = "";
    if (manage && m.id !== state.me.id && m.role !== "owner") {
      tools += `<button type="button" class="btn ghost" data-rm="${m.id}">${esc(t("remove"))}</button>`;
      if (chat.myRole === "owner") tools += `<button type="button" class="btn ghost" data-adm="${m.id}" data-on="${m.role === "admin" ? "0" : "1"}">${esc(m.role === "admin" ? t("demote") : t("makeAdmin"))}</button>`;
    }
    return `<div class="row" style="margin:6px 0">${avHtml(m)}<span class="grow">${esc(m.displayName)} <span class="muted">${esc(m.role || "")}</span>${m.about ? `<div class="muted">${esc(m.about)}</div>` : ""}</span>${tools}</div>`;
  }).join("");
  const groupForm = manage ? `<form id="grename"><label>${esc(t("group"))}<input name="title" value="${esc(chat?.title || "")}"></label><label>${esc(t("groupPhoto"))}<input id="gphoto" name="photo" type="file" accept="image/*"></label><button class="btn">${esc(t("save"))}</button></form><label>${esc(t("addMember"))}<input id="find" placeholder="${esc(t("search"))}"></label><div id="found"></div>` : "";
  return `<h2>${esc(chat?.title || "")}</h2>${chat?.about ? `<p class="muted">${esc(chat.about)}</p>` : ""}${groupForm}${people}
    <button type="button" class="listbtn" data-flag="mute">${esc(chat?.muted ? t("unmute") : t("mute"))}</button>
    <button type="button" class="listbtn" data-flag="pin">${esc(chat?.pinned ? t("unpin") : t("pinChat"))}</button>
    <button type="button" class="listbtn" data-flag="${chat?.archived ? "unarchive" : "archive"}">${esc(chat?.archived ? t("unarchive") : t("archive"))}</button>
    <button type="button" class="listbtn" data-flag="unread">${esc(t("unread"))}</button>
    <button type="button" class="listbtn" data-flag="clear">${esc(t("clear"))}</button>
    <button type="button" class="listbtn danger" data-flag="delete">${esc(t("removeChat"))}</button>
    ${chat?.peerId ? `<button type="button" class="listbtn" id="block">${esc(peer?.blockedByMe ? t("unblock") : t("block"))}</button><button type="button" class="listbtn" id="addc">${esc(peer?.isContact ? t("removeContact") : t("add"))}</button><button type="button" class="listbtn" id="reportu">${esc(t("report"))}</button>` : `<button type="button" class="listbtn danger" id="leave">${esc(t("leave"))}</button>`}`;
}

function statusViewHtml() {
  const s = state.statuses.find((x) => x.id === state.statusId);
  if (!s) return "";
  const bg = s.kind === "text" ? ` style="background:${esc(s.bg || "#008069")};color:#fff;padding:24px;border-radius:12px"` : "";
  return `<h2>${esc(s.displayName)}</h2><div id="stmedia"${bg}><p>${esc(s.caption || "")}</p></div>
    ${s.mine ? `<div>${esc(t("viewers"))}</div>${state.viewers.map((v) => `<div>${esc(v.display_name)}</div>`).join("") || "—"}<button id="delst" class="btn ghost" type="button">${esc(t("remove"))}</button>` : ""}`;
}

function adminHtml() {
  const a = state.adminData || { overview: {}, users: [], reports: [], groups: [] };
  const o = a.overview || {};
  return `<p class="muted">${esc(t("users"))}: ${o.users || 0} · ${esc(t("groups"))}: ${(a.groups || []).length} · ${esc(t("reports"))}: ${o.reports || 0}</p>
    <form id="adset">
      <label class="chk"><input type="checkbox" name="allowSignups" ${o.allowSignups ? "checked" : ""}> ${esc(t("signups"))}</label>
      <label>max bytes<input name="maxUpload" value="${o.maxUpload || 8388608}"></label>
      <button class="btn" type="submit">${esc(t("save"))}</button>
      <button class="btn ghost" type="button" id="dobackup">${esc(t("backup"))}</button>
    </form>
    <h3>${esc(t("users"))}</h3>
    <form id="adnew">
      <label>${esc(t("name"))}<input name="displayName" required></label>
      <label>${esc(t("username"))}<input name="username" required></label>
      <label>${esc(t("email"))}<input name="email"></label>
      <label>${esc(t("phone"))}<input name="phone"></label>
      <label>${esc(t("password"))}<input name="password" type="password" required minlength="8"></label>
      <button class="btn">${esc(t("create"))}</button>
    </form>
    ${(a.users || []).map((u) => `<div class="row" style="margin:8px 0"><span class="grow"><b>${esc(u.display_name)}</b><div class="muted">@${esc(u.username || "")} ${esc(u.email || "")} ${esc(u.phone || "")} · ${esc(u.role)}${Number(u.suspended) ? " · " + esc(t("suspend")) : ""}</div></span>
      ${u.id === state.me.id ? "" : `<button type="button" class="btn ghost" data-sus="${u.id}" data-on="${Number(u.suspended) ? "0" : "1"}">${esc(Number(u.suspended) ? t("restore") : t("suspend"))}</button><button type="button" class="btn ghost" data-adel="${u.id}">${esc(t("remove"))}</button>`}
    </div>`).join("")}
    <h3>${esc(t("reports"))}</h3>
    ${(a.reports || []).map((r) => `<div class="listbtn">${esc(r.reason)} · @${esc(r.reporter || "")} → @${esc(r.target || "")} · ${esc(r.status)} ${r.status === "open" ? `<button type="button" data-rclose="${r.id}">${esc(t("close"))}</button>` : ""}</div>`).join("") || "<p class='muted'>—</p>"}
    <h3>${esc(t("groups"))}</h3>
    ${(a.groups || []).map((g) => `<div class="row"><span class="grow">${esc(g.title)} <span class="muted">${g.members}</span></span><button type="button" class="btn ghost" data-gdel="${g.id}">${esc(t("remove"))}</button></div>`).join("") || "<p class='muted'>—</p>"}`;
}

function wireInfo(pane) {
  pane.querySelectorAll("[data-rm]").forEach((b) => {
    b.onclick = async () => {
      await api("/chats/members", { chatId: state.chatId, action: "remove", userId: Number(b.dataset.rm) });
      await refresh();
      state.ui++;
      paint();
    };
  });
  pane.querySelectorAll("[data-adm]").forEach((b) => {
    b.onclick = async () => {
      await api("/chats/members", { chatId: state.chatId, action: "admin", userId: Number(b.dataset.adm), on: b.dataset.on === "1" });
      await refresh();
      state.ui++;
      paint();
    };
  });
  const found = pane.querySelector("#found");
  const find = pane.querySelector("#find");
  if (find && state.pane === "info") {
    find.oninput = async () => {
      const q = find.value.trim();
      const people = q.length >= 2 ? await api("/users/search?q=" + encodeURIComponent(q)).catch(() => []) : [];
      found.innerHTML = people.map((p) => `<button type="button" class="listbtn" data-addm="${p.id}">${esc(t("add"))} ${esc(p.displayName)}</button>`).join("");
      found.querySelectorAll("[data-addm]").forEach((b) => {
        b.onclick = async () => {
          await api("/chats/members", { chatId: state.chatId, action: "add", userId: Number(b.dataset.addm) });
          await refresh();
          state.ui++;
          paint();
        };
      });
    };
  }
  const ren = pane.querySelector("#grename");
  if (ren) ren.onsubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const title = new FormData(ren).get("title");
    let fileId;
    const file = pane.querySelector("#gphoto")?.files?.[0];
    if (file) fileId = (await uploadFile(file)).id;
    await api("/chats/group/update", { chatId: state.chatId, title, fileId });
    await refresh();
    state.ui++;
    toast("ok");
    paint();
  };
}

function wireAdmin(pane) {
  const set = pane.querySelector("#adset");
  if (set) set.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(set);
    await api("/admin/settings", { allowSignups: Boolean(set.querySelector('[name="allowSignups"]').checked), maxUpload: Number(fd.get("maxUpload")) });
    await loadAdmin();
    state.ui++;
    toast("ok");
    paint();
  };
  const neu = pane.querySelector("#adnew");
  if (neu) neu.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api("/admin/users", Object.fromEntries(new FormData(neu).entries()));
      await loadAdmin();
      state.ui++;
      toast("ok");
      paint();
    } catch (err) { toast(err.message); }
  };
  const backup = pane.querySelector("#dobackup");
  if (backup) backup.onclick = async () => { const r = await api("/admin/backup", {}); toast(r.file || "ok"); };
  pane.querySelectorAll("[data-sus]").forEach((b) => {
    b.onclick = async () => {
      await api("/admin/user", { id: Number(b.dataset.sus), suspended: b.dataset.on === "1" });
      await loadAdmin();
      state.ui++;
      paint();
    };
  });
  pane.querySelectorAll("[data-adel]").forEach((b) => {
    b.onclick = async () => {
      await api("/admin/user/remove", { id: Number(b.dataset.adel) });
      await loadAdmin();
      state.ui++;
      paint();
    };
  });
  pane.querySelectorAll("[data-rclose]").forEach((b) => {
    b.onclick = async () => {
      await api("/admin/reports", { id: Number(b.dataset.rclose), status: "closed" });
      await loadAdmin();
      state.ui++;
      paint();
    };
  });
  pane.querySelectorAll("[data-gdel]").forEach((b) => {
    b.onclick = async () => {
      await api("/admin/groups/delete", { id: Number(b.dataset.gdel) });
      await loadAdmin();
      state.ui++;
      await refresh();
      paint();
    };
  });
}

async function openStatus(id) {
  state.statusId = id;
  state.pane = "statusView";
  const s = state.statuses.find((x) => x.id === id);
  if (s && !s.mine) await api("/statuses/view", { id });
  if (s?.mine) state.viewers = await api("/statuses/viewers?id=" + id);
  state.ui++;
  paint();
  if (s?.fileId) {
    const url = await srcFor(s.fileId);
    const node = document.getElementById("stmedia");
    if (node) node.innerHTML = (s.caption ? `<p>${esc(s.caption)}</p>` : "") + (s.kind === "video" ? `<video class="media" controls src="${url}"></video>` : `<img class="media" alt="" src="${url}">`);
  }
  document.getElementById("delst")?.addEventListener("click", async () => {
    await api("/statuses/delete", { id });
    state.pane = null;
    await refresh();
    paint();
  });
}

async function submitPane(e) {
  e.preventDefault();
  if (e.target.id === "grename" || e.target.id === "adset" || e.target.id === "adnew") return;
  const fd = Object.fromEntries(new FormData(e.target).entries());
  try {
    if (state.pane === "profile") {
      state.me = await api("/me", fd);
      state.ui++;
      toast("ok");
      paint();
    } else if (state.pane === "settings") {
      await saveFrom(fd, e.target);
    }
  } catch (err) { toast(err.message); }
}

async function saveFrom(fd, form) {
  const box = (name) => Boolean(form.querySelector(`[name="${name}"]`)?.checked);
  const want2 = box("twoFactor");
  state.me = await api("/me", {
    privacyPhoto: fd.privacyPhoto,
    privacyLastSeen: fd.privacyLastSeen,
    privacyAbout: fd.privacyAbout,
    privacyStatus: fd.privacyStatus,
    hideOnline: box("hideOnline"),
    shareTyping: box("shareTyping"),
    readReceipts: box("readReceipts"),
    notifSound: box("notifSound"),
    theme: box("dark") ? "dark" : "light",
    locale: state.locale,
  });
  if (want2 !== state.me.twoFactor) {
    await api("/me/2fa", { enabled: want2 });
    state.me = await api("/me");
  }
  state.theme = state.me.theme;
  localStorage.setItem("nini_theme", state.theme);
  applyDoc();
  toast("ok");
}

async function changePhoto(file) {
  if (!file) return;
  try {
    const up = await uploadFile(file);
    await api("/me/avatar", { fileId: up.id });
    state.me = await api("/me");
    blobCache.delete(state.me.avatarFile);
    state.ui++;
    toast("ok");
    paint();
  } catch (e) { toast(e.message); }
}

async function publishStatus(file) {
  const caption = document.getElementById("cap")?.value || "";
  try {
    if (!file) await api("/statuses", { kind: "text", caption, bg: "#008069" });
    else {
      const up = await uploadFile(file);
      await api("/statuses", { kind: file.type.startsWith("video") ? "video" : "image", caption, fileId: up.id });
    }
    state.pane = null;
    await refresh();
    paint();
  } catch (e) { toast(e.message); }
}

async function flagChat(flag) {
  const chat = currentChat();
  const body = { chatId: state.chatId };
  if (flag === "mute") body.muted = !chat?.muted;
  if (flag === "pin") body.pinned = !chat?.pinned;
  if (flag === "archive") body.archived = true;
  if (flag === "unarchive") body.archived = false;
  if (flag === "unread") body.unread = true;
  if (flag === "clear") body.clear = true;
  if (flag === "delete") body.delete = true;
  await api("/chats/flags", body);
  if (flag === "delete" || flag === "archive" || flag === "unread") state.chatId = null;
  state.pane = null;
  await refresh();
  paint();
}

function b64ToBuf(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(String(s).replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function enablePush() {
  const perm = await Notification.requestPermission();
  if (perm !== "granted" || !state.me?.vapidPublic || !("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBuf(state.me.vapidPublic) });
    const json = sub.toJSON();
    await api("/push/subscribe", { endpoint: sub.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth });
    toast("ok");
  } catch { toast("notif"); }
}

document.addEventListener("click", async (e) => {
  const id = e.target?.id;
  if (id === "askn") enablePush();
  if (id === "lang2") {
    state.locale = state.locale === "fa" ? "en" : "fa";
    localStorage.setItem("nini_locale", state.locale);
    state.me = await api("/me", { locale: state.locale });
    document.getElementById("shell")?.remove();
    render();
  }
  if (id === "install" && state.deferredInstall) state.deferredInstall.prompt();
  if (id === "delav") {
    await api("/me/avatar/delete", {});
    state.me = await api("/me");
    state.ui++;
    toast("ok");
    paint();
  }
  if (id === "block") {
    const chat = currentChat();
    const peer = state.members.find((m) => m.id === chat?.peerId);
    await api("/blocks", { userId: chat.peerId, block: !peer?.blockedByMe });
    await refresh();
    state.ui++;
    toast("ok");
    paint();
  }
  if (id === "addc") {
    const chat = currentChat();
    const peer = state.members.find((m) => m.id === chat?.peerId);
    await api("/contacts", { userId: chat.peerId, add: !peer?.isContact });
    await refresh();
    state.ui++;
    toast("ok");
    paint();
  }
  if (id === "reportu") {
    const chat = currentChat();
    await api("/reports", { reason: "harassment", userId: chat.peerId });
    toast("ok");
  }
  if (id === "leave") {
    await api("/chats/leave", { chatId: state.chatId });
    state.chatId = null;
    state.pane = null;
    await refresh();
    paint();
  }
});

boot();
