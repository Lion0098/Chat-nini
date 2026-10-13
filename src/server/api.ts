import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import type {
  AdminGroup,
  AdminReport,
  AdminUser,
  ChatListItem,
  ChatMessage,
  LiveCall,
  Locale,
  Me,
  Privacy,
  PublicUser,
  Result,
  Role,
  StatusItem,
  Thread,
  ThreadMember,
} from "@/lib/chat-types";

function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}
function err(error: string): Result<never> {
  return { ok: false, error };
}

function iso(value: unknown): string | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function bool(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1;
}

function clean(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
}

function rec(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") throw new Error("bad_input");
  return input as Record<string, unknown>;
}

const USERNAME = /^[a-z0-9._]{3,24}$/;
const PHONE = /^\+?[0-9]{8,15}$/;
const PRIV = new Set(["everyone", "contacts", "nobody"]);
const BANNED_MIME = new Set([
  "text/html",
  "image/svg+xml",
  "application/javascript",
  "text/javascript",
  "application/xhtml+xml",
]);
const KIND_MIME: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/webm", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/aac"],
};

type ProfileRow = {
  user_id: string;
  username: string | null;
  display_name: string;
  about: string;
  phone: string | null;
  avatar_data: string | null;
  avatar_mime: string | null;
  role: string;
  locale: string;
  privacy_last_seen: string;
  privacy_photo: string;
  privacy_about: string;
  privacy_status: string;
  read_receipts: unknown;
  suspended: unknown;
  last_seen_at: unknown;
  created_at: unknown;
  updated_at: unknown;
};

function privacyOf(value: string): Privacy {
  return value === "contacts" || value === "nobody" ? value : "everyone";
}

function roleOf(value: string): Role {
  return value === "admin" ? "admin" : "user";
}

function localeOf(value: string): Locale {
  return value === "en" ? "en" : "fa";
}

function isOnline(last: unknown): boolean {
  const at = iso(last);
  if (!at) return false;
  return Date.now() - new Date(at).getTime() < 35_000;
}

function toMe(row: ProfileRow, email: string): Me {
  return {
    userId: row.user_id,
    email,
    username: row.username,
    displayName: row.display_name,
    about: row.about,
    phone: row.phone,
    role: roleOf(row.role),
    locale: localeOf(row.locale),
    privacyLastSeen: privacyOf(row.privacy_last_seen),
    privacyPhoto: privacyOf(row.privacy_photo),
    privacyAbout: privacyOf(row.privacy_about),
    privacyStatus: privacyOf(row.privacy_status),
    readReceipts: bool(row.read_receipts),
    suspended: bool(row.suspended),
    hasAvatar: Boolean(row.avatar_data),
    avatarRev: iso(row.updated_at) ?? "",
    lastSeenAt: iso(row.last_seen_at),
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
  };
}

async function userRow(sql: Sql, userId: string) {
  const rows = await sql<{ id: string; name: string; email: string }>`
    select id, name, email from "user" where id = ${userId}
  `;
  return rows[0] ?? null;
}

async function profileOf(sql: Sql, userId: string): Promise<ProfileRow | null> {
  const rows = await sql<ProfileRow>`
    select user_id, username, display_name, about, phone, avatar_data, avatar_mime,
           role, locale, privacy_last_seen, privacy_photo, privacy_about, privacy_status,
           read_receipts, suspended, last_seen_at, created_at, updated_at
    from profiles where user_id = ${userId}
  `;
  return rows[0] ?? null;
}

async function ensure(sql: Sql, userId: string): Promise<ProfileRow> {
  const existing = await profileOf(sql, userId);
  if (existing) return existing;
  const user = await userRow(sql, userId);
  if (!user) throw new Error("Unauthorized");
  const name = clean(user.name, 50) || "User";
  await sql`
    insert into profiles (user_id, display_name, about, last_seen_at)
    values (${userId}, ${name}, ${""}, now())
    on conflict (user_id) do nothing
  `;
  await sql`
    update profiles set role = 'admin'
    where user_id = ${userId}
      and role <> 'admin'
      and not exists (
        select 1 from profiles where role = 'admin' and user_id <> ${userId}
      )
  `;
  const created = await profileOf(sql, userId);
  if (!created) throw new Error("profile_failed");
  return created;
}

async function gate(sql: Sql, userId: string): Promise<ProfileRow> {
  const row = await ensure(sql, userId);
  if (bool(row.suspended)) throw new Error("suspended");
  return row;
}

async function blockedEither(sql: Sql, a: string, b: string): Promise<boolean> {
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from blocks
    where (blocker_id = ${a} and blocked_id = ${b})
       or (blocker_id = ${b} and blocked_id = ${a})
  `;
  return num(rows[0]?.n) > 0;
}

async function blockDir(sql: Sql, blocker: string, blocked: string): Promise<boolean> {
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from blocks
    where blocker_id = ${blocker} and blocked_id = ${blocked}
  `;
  return num(rows[0]?.n) > 0;
}

async function known(sql: Sql, viewer: string, target: string): Promise<boolean> {
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from (
      select 1 from contacts where owner_id = ${viewer} and contact_id = ${target}
      union all
      select 1
      from chat_members a
      join chat_members b on b.chat_id = a.chat_id and b.user_id = ${target}
      join chats c on c.id = a.chat_id and c.kind = 'direct'
      where a.user_id = ${viewer}
    ) t
  `;
  return num(rows[0]?.n) > 0;
}

function allowed(level: string, isKnown: boolean): boolean {
  if (level === "nobody") return false;
  if (level === "contacts") return isKnown;
  return true;
}

async function setting(sql: Sql, key: string, fallback: string): Promise<string> {
  const rows = await sql<{ value: string }>`
    select value from system_settings where key = ${key}
  `;
  return rows[0]?.value ?? fallback;
}

async function maxBytes(sql: Sql): Promise<number> {
  const n = Number(await setting(sql, "max_upload_bytes", "2000000"));
  if (!Number.isFinite(n)) return 2_000_000;
  return Math.min(4_000_000, Math.max(100_000, Math.floor(n)));
}

function approxBytes(b64: string): number {
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - pad);
}

function mimeOk(kind: string, mime: string): boolean {
  if (!mime || mime.length > 120 || BANNED_MIME.has(mime)) return false;
  if (kind === "file") return true;
  return (KIND_MIME[kind] ?? []).includes(mime);
}

async function memberRole(sql: Sql, chatId: string, userId: string) {
  const rows = await sql<{
    role: string;
    muted: unknown;
    pinned: unknown;
    archived: unknown;
    cleared_at: unknown;
    last_read_at: unknown;
  }>`
    select role, muted, pinned, archived, cleared_at, last_read_at
    from chat_members where chat_id = ${chatId} and user_id = ${userId}
  `;
  return rows[0] ?? null;
}

async function systemNote(sql: Sql, chatId: string, senderId: string, body: string) {
  await sql`
    insert into messages (id, chat_id, sender_id, kind, body)
    values (${crypto.randomUUID()}, ${chatId}, ${senderId}, 'system', ${body})
  `;
  await sql`update chats set updated_at = now() where id = ${chatId}`;
}

async function publicUser(sql: Sql, viewer: string, row: ProfileRow): Promise<PublicUser> {
  const self = viewer === row.user_id;
  const byMe = self ? false : await blockDir(sql, viewer, row.user_id);
  const meBy = self ? false : await blockDir(sql, row.user_id, viewer);
  const isKnown = self ? true : await known(sql, viewer, row.user_id);
  const seePhoto = self || (!byMe && !meBy && allowed(row.privacy_photo, isKnown));
  const seeAbout = self || (!byMe && !meBy && allowed(row.privacy_about, isKnown));
  const seePresence = self || (!byMe && !meBy && allowed(row.privacy_last_seen, isKnown));
  const seePhone = self || (isKnown && !byMe && !meBy);
  return {
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name || row.username || "User",
    about: seeAbout ? row.about : null,
    phone: seePhone ? row.phone : null,
    hasAvatar: Boolean(seePhoto && row.avatar_data),
    avatarRev: iso(row.updated_at) ?? "",
    online: seePresence ? isOnline(row.last_seen_at) : false,
    lastSeenAt: seePresence ? iso(row.last_seen_at) : null,
    presenceHidden: !seePresence,
    blockedByMe: byMe,
    blockedMe: meBy,
    isContact: isKnown,
  };
}

async function requireAdmin(sql: Sql, userId: string) {
  const row = await ensure(sql, userId);
  if (row.role !== "admin") throw new Error("forbidden");
  return row;
}

export const getPublicConfig = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return {
    allowSignups: (await setting(sql, "allow_signups", "true")) !== "false",
    maintenance: await setting(sql, "maintenance_message", ""),
  };
});

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Me> => {
    const sql = await getSql();
    await ensure(sql, context.userId);
    await sql`update profiles set last_seen_at = now() where user_id = ${context.userId}`;
    const row = await profileOf(sql, context.userId);
    const user = await userRow(sql, context.userId);
    if (!row) throw new Error("profile_failed");
    return toMe(row, user?.email ?? "");
  });

export const heartbeat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensure(sql, context.userId);
    await sql`update profiles set last_seen_at = now() where user_id = ${context.userId}`;
    return ok(true);
  });

export const saveProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Result<Me>> => {
    const sql = await getSql();
    const row = await gate(sql, context.userId);
    const displayName =
      data.displayName === undefined ? row.display_name : clean(data.displayName, 50);
    if (!displayName) return err("name_required");
    const about = data.about === undefined ? row.about : clean(data.about, 140);
    let username = row.username;
    if (data.username !== undefined) {
      username = clean(data.username, 24).toLowerCase();
      if (!USERNAME.test(username)) return err("username_invalid");
      const taken = await sql<{ user_id: string }>`
        select user_id from profiles
        where lower(username) = ${username} and user_id <> ${context.userId}
      `;
      if (taken.length) return err("username_taken");
    }
    let phone = row.phone;
    if (data.phone !== undefined) {
      const raw = clean(data.phone, 16);
      if (!raw) phone = null;
      else if (!PHONE.test(raw)) return err("phone_invalid");
      else {
        const taken = await sql<{ user_id: string }>`
          select user_id from profiles where phone = ${raw} and user_id <> ${context.userId}
        `;
        if (taken.length) return err("phone_taken");
        phone = raw;
      }
    }
    const locale = data.locale === undefined ? row.locale : localeOf(clean(data.locale, 8));
    const pick = (key: string, current: string): Privacy => {
      if (data[key] === undefined) return privacyOf(current);
      const v = clean(data[key], 16);
      if (!PRIV.has(v)) throw new Error("bad_input");
      return privacyOf(v);
    };
    let privacyLastSeen: Privacy;
    let privacyPhoto: Privacy;
    let privacyAbout: Privacy;
    let privacyStatus: Privacy;
    try {
      privacyLastSeen = pick("privacyLastSeen", row.privacy_last_seen);
      privacyPhoto = pick("privacyPhoto", row.privacy_photo);
      privacyAbout = pick("privacyAbout", row.privacy_about);
      privacyStatus = pick("privacyStatus", row.privacy_status);
    } catch {
      return err("bad_input");
    }
    const readReceipts =
      data.readReceipts === undefined ? bool(row.read_receipts) : Boolean(data.readReceipts);

    let avatarData = row.avatar_data;
    let avatarMime = row.avatar_mime;
    if (data.avatarData === null) {
      avatarData = null;
      avatarMime = null;
    } else if (typeof data.avatarData === "string" && data.avatarData.length > 0) {
      const mime = clean(data.avatarMime, 40);
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) return err("bad_type");
      if (approxBytes(data.avatarData) > 180_000) return err("too_large");
      if (!/^[A-Za-z0-9+/=\s]+$/.test(data.avatarData)) return err("bad_type");
      avatarData = data.avatarData.replace(/\s/g, "");
      avatarMime = mime;
    }

    await sql`
      update profiles set
        username = ${username},
        display_name = ${displayName},
        about = ${about},
        phone = ${phone},
        locale = ${locale},
        privacy_last_seen = ${privacyLastSeen},
        privacy_photo = ${privacyPhoto},
        privacy_about = ${privacyAbout},
        privacy_status = ${privacyStatus},
        read_receipts = ${readReceipts},
        avatar_data = ${avatarData},
        avatar_mime = ${avatarMime},
        updated_at = now()
      where user_id = ${context.userId}
    `;
    const user = await userRow(sql, context.userId);
    if (displayName && user) {
      await sql`update "user" set name = ${displayName}, "updatedAt" = now() where id = ${context.userId}`;
    }
    const fresh = await profileOf(sql, context.userId);
    if (!fresh) return err("profile_failed");
    return ok(toMe(fresh, user?.email ?? ""));
  });

export const getAvatar = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const userId = clean(rec(input).userId, 80);
    if (!userId) throw new Error("bad_input");
    return { userId };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensure(sql, context.userId);
    const row = await profileOf(sql, data.userId);
    if (!row?.avatar_data) return { data: null as string | null, mime: null as string | null };
    if (data.userId !== context.userId) {
      if (await blockedEither(sql, context.userId, data.userId)) {
        return { data: null, mime: null };
      }
      const isKnown = await known(sql, context.userId, data.userId);
      if (!allowed(row.privacy_photo, isKnown)) return { data: null, mime: null };
    }
    return { data: row.avatar_data, mime: row.avatar_mime ?? "image/jpeg" };
  });

export const getChatAvatar = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const chatId = clean(rec(input).chatId, 80);
    if (!chatId) throw new Error("bad_input");
    return { chatId };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensure(sql, context.userId);
    const mem = await memberRole(sql, data.chatId, context.userId);
    if (!mem) return { data: null as string | null, mime: null as string | null };
    const rows = await sql<{ avatar_data: string | null; avatar_mime: string | null }>`
      select avatar_data, avatar_mime from chats where id = ${data.chatId}
    `;
    const row = rows[0];
    if (!row?.avatar_data) return { data: null, mime: null };
    return { data: row.avatar_data, mime: row.avatar_mime ?? "image/jpeg" };
  });

export const searchUsers = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const q = clean(rec(input).q, 40).toLowerCase();
    return { q };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<PublicUser[]> => {
    const sql = await getSql();
    await gate(sql, context.userId);
    if (data.q.length < 2) return [];
    const like = `%${data.q.replace(/[%_]/g, "")}%`;
    const rows = await sql<ProfileRow>`
      select user_id, username, display_name, about, phone, avatar_data, avatar_mime,
             role, locale, privacy_last_seen, privacy_photo, privacy_about, privacy_status,
             read_receipts, suspended, last_seen_at, created_at, updated_at
      from profiles
      where user_id <> ${context.userId}
        and suspended = false
        and user_id not in (
          select blocked_id from blocks where blocker_id = ${context.userId}
          union
          select blocker_id from blocks where blocked_id = ${context.userId}
        )
        and (
          lower(coalesce(username, '')) like ${like}
          or lower(display_name) like ${like}
          or coalesce(phone, '') like ${like}
        )
      order by display_name asc
      limit 20
    `;
    const out: PublicUser[] = [];
    for (const row of rows) out.push(await publicUser(sql, context.userId, row));
    return out;
  });

export const getUser = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const userId = clean(rec(input).userId, 80);
    if (!userId) throw new Error("bad_input");
    return { userId };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<PublicUser | null> => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const row = await profileOf(sql, data.userId);
    if (!row || bool(row.suspended)) return null;
    return publicUser(sql, context.userId, row);
  });

export const setContact = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const o = rec(input);
    const userId = clean(o.userId, 80);
    if (!userId) throw new Error("bad_input");
    return { userId, add: Boolean(o.add) };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Result<true>> => {
    const sql = await getSql();
    await gate(sql, context.userId);
    if (data.userId === context.userId) return err("self");
    if (data.add) {
      await sql`
        insert into contacts (owner_id, contact_id) values (${context.userId}, ${data.userId})
        on conflict do nothing
      `;
    } else {
      await sql`
        delete from contacts where owner_id = ${context.userId} and contact_id = ${data.userId}
      `;
    }
    return ok(true);
  });

export const listChats = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const archived = Boolean(rec(input ?? {}).archived);
    return { archived };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<ChatListItem[]> => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const memberships = await sql<{
      id: string;
      kind: string;
      title: string | null;
      about: string;
      avatar_data: string | null;
      updated_at: unknown;
      pinned: unknown;
      muted: unknown;
      archived: unknown;
      last_open_at: unknown;
    }>`
      select c.id, c.kind, c.title, c.about, c.avatar_data, c.updated_at,
             cm.pinned, cm.muted, cm.archived, cm.last_open_at
      from chat_members cm
      join chats c on c.id = cm.chat_id
      where cm.user_id = ${context.userId} and cm.archived = ${data.archived}
      order by cm.pinned desc, c.updated_at desc
      limit 200
    `;
    if (!memberships.length) return [];
    const ids = memberships.map((m) => m.id);
    const ph = ids.map((_, i) => `$${i + 2}`).join(", ");
    const peers = await sql.query<{
      chat_id: string;
      user_id: string;
      username: string | null;
      display_name: string;
      avatar_data: string | null;
      privacy_photo: string;
      privacy_last_seen: string;
      last_seen_at: unknown;
      updated_at: unknown;
    }>(
      `select cm.chat_id, p.user_id, p.username, p.display_name, p.avatar_data,
              p.privacy_photo, p.privacy_last_seen, p.last_seen_at, p.updated_at
       from chat_members cm
       join profiles p on p.user_id = cm.user_id
       join chats c on c.id = cm.chat_id and c.kind = 'direct'
       where cm.user_id <> $1 and cm.chat_id in (${ph})`,
      [context.userId, ...ids],
    );
    const peerByChat = new Map(peers.map((p) => [p.chat_id, p]));
    const lasts = await sql.query<{
      chat_id: string;
      kind: string;
      body: string | null;
      sender_id: string;
      sender_name: string | null;
      created_at: unknown;
      deleted_at: unknown;
    }>(
      `select distinct on (m.chat_id) m.chat_id, m.kind, m.body, m.sender_id,
              p.display_name as sender_name, m.created_at, m.deleted_at
       from messages m
       left join profiles p on p.user_id = m.sender_id
       where m.chat_id in (${ids.map((_, i) => `$${i + 1}`).join(", ")})
       order by m.chat_id, m.created_at desc`,
      ids,
    );
    const lastByChat = new Map(lasts.map((m) => [m.chat_id, m]));
    const unreads = await sql.query<{ chat_id: string; n: number }>(
      `select m.chat_id, count(*)::int as n
       from messages m
       join chat_members cm on cm.chat_id = m.chat_id and cm.user_id = $1
       where m.chat_id in (${ph})
         and m.sender_id <> $1
         and m.deleted_at is null
         and m.kind <> 'system'
         and (cm.last_open_at is null or m.created_at > cm.last_open_at)
         and (cm.cleared_at is null or m.created_at > cm.cleared_at)
       group by m.chat_id`,
      [context.userId, ...ids],
    );
    const unreadBy = new Map(unreads.map((u) => [u.chat_id, num(u.n)]));
    const items: ChatListItem[] = [];
    for (const m of memberships) {
      const peer = peerByChat.get(m.id);
      let presenceHidden = false;
      let online = false;
      let lastSeenAt: string | null = null;
      let hasAvatar = Boolean(m.avatar_data);
      let avatarRev = iso(m.updated_at) ?? "";
      let avatarUserId: string | null = null;
      let title = m.title || "";
      if (m.kind === "direct" && peer) {
        const isKnown = await known(sql, context.userId, peer.user_id);
        const hide = await blockedEither(sql, context.userId, peer.user_id);
        const seePresence = !hide && allowed(peer.privacy_last_seen, isKnown);
        const seePhoto = !hide && allowed(peer.privacy_photo, isKnown);
        presenceHidden = !seePresence;
        online = seePresence ? isOnline(peer.last_seen_at) : false;
        lastSeenAt = seePresence ? iso(peer.last_seen_at) : null;
        hasAvatar = Boolean(seePhoto && peer.avatar_data);
        avatarRev = iso(peer.updated_at) ?? "";
        avatarUserId = peer.user_id;
        title = peer.display_name || peer.username || "";
      }
      const last = lastByChat.get(m.id);
      items.push({
        id: m.id,
        kind: m.kind === "group" ? "group" : "direct",
        title,
        about: m.about,
        hasAvatar,
        avatarRev,
        avatarUserId,
        peerId: peer?.user_id ?? null,
        pinned: bool(m.pinned),
        muted: bool(m.muted),
        archived: bool(m.archived),
        unread: unreadBy.get(m.id) ?? 0,
        updatedAt: iso(m.updated_at) ?? new Date().toISOString(),
        last: last
          ? {
              kind: last.kind,
              body: last.deleted_at ? null : last.body,
              senderId: last.sender_id,
              senderName: last.sender_name ?? "",
              createdAt: iso(last.created_at) ?? new Date().toISOString(),
              deleted: Boolean(last.deleted_at),
              mine: last.sender_id === context.userId,
            }
          : null,
        online,
        lastSeenAt,
        presenceHidden,
      });
    }
    items.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
    return items;
  });

type MsgRow = {
  id: string;
  sender_id: string;
  kind: string;
  body: string | null;
  file_name: string | null;
  file_mime: string | null;
  file_size: number | null;
  reply_to: string | null;
  created_at: unknown;
  edited_at: unknown;
  deleted_at: unknown;
  sender_name: string | null;
  reply_kind: string | null;
  reply_body: string | null;
  reply_deleted: unknown;
  reply_sender: string | null;
};

function mapMessage(row: MsgRow, me: string): ChatMessage {
  const deleted = Boolean(row.deleted_at);
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name || "",
    kind: row.kind,
    body: deleted ? null : row.body,
    fileName: deleted ? null : row.file_name,
    fileMime: deleted ? null : row.file_mime,
    fileSize: deleted ? null : row.file_size == null ? null : num(row.file_size),
    reply:
      row.reply_to && row.reply_kind
        ? {
            id: row.reply_to,
            senderName: row.reply_sender || "",
            kind: row.reply_kind,
            body: row.reply_deleted ? null : row.reply_body,
            deleted: Boolean(row.reply_deleted),
          }
        : null,
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
    editedAt: iso(row.edited_at),
    deleted,
    mine: row.sender_id === me,
  };
}

export const listMessages = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const o = rec(input);
    const chatId = clean(o.chatId, 80);
    if (!chatId) throw new Error("bad_input");
    const before = o.before ? clean(o.before, 40) : null;
    return { chatId, before };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Thread | null> => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const mem = await memberRole(sql, data.chatId, context.userId);
    if (!mem) return null;
    const chats = await sql<{
      id: string;
      kind: string;
      title: string | null;
      about: string;
      avatar_data: string | null;
      updated_at: unknown;
    }>`
      select id, kind, title, about, avatar_data, updated_at from chats where id = ${data.chatId}
    `;
    const chat = chats[0];
    if (!chat) return null;
    const memberRows = await sql<{
      user_id: string;
      role: string;
      display_name: string | null;
      username: string | null;
      avatar_data: string | null;
      privacy_photo: string | null;
      privacy_last_seen: string | null;
      last_seen_at: unknown;
      updated_at: unknown;
      last_read_at: unknown;
    }>`
      select cm.user_id, cm.role, p.display_name, p.username, p.avatar_data,
             p.privacy_photo, p.privacy_last_seen, p.last_seen_at, p.updated_at, cm.last_read_at
      from chat_members cm
      left join profiles p on p.user_id = cm.user_id
      where cm.chat_id = ${data.chatId}
      order by cm.joined_at asc
    `;
    const members: ThreadMember[] = [];
    let peerId: string | null = null;
    let title = chat.title || "";
    for (const m of memberRows) {
      if (m.user_id !== context.userId && chat.kind === "direct") {
        peerId = m.user_id;
        title = m.display_name || m.username || title;
      }
      const self = m.user_id === context.userId;
      const isKnown = self || !m.user_id ? true : await known(sql, context.userId, m.user_id);
      const hide = self ? false : await blockedEither(sql, context.userId, m.user_id);
      const seePresence = self || (!hide && allowed(m.privacy_last_seen || "everyone", isKnown));
      const seePhoto = self || (!hide && allowed(m.privacy_photo || "everyone", isKnown));
      members.push({
        userId: m.user_id,
        displayName: m.display_name || m.username || "",
        username: m.username,
        role: m.role,
        hasAvatar: Boolean(seePhoto && m.avatar_data),
        avatarRev: iso(m.updated_at) ?? "",
        online: seePresence ? isOnline(m.last_seen_at) : false,
        lastSeenAt: seePresence ? iso(m.last_seen_at) : null,
        presenceHidden: !seePresence,
        lastReadAt: iso(m.last_read_at),
      });
    }
    const before = data.before ?? "9999-12-31T00:00:00.000Z";
    const rows = await sql<MsgRow>`
      select m.id, m.sender_id, m.kind, m.body, m.file_name, m.file_mime, m.file_size,
             m.reply_to, m.created_at, m.edited_at, m.deleted_at,
             p.display_name as sender_name,
             r.kind as reply_kind, r.body as reply_body, r.deleted_at as reply_deleted,
             rp.display_name as reply_sender
      from messages m
      join chat_members cm on cm.chat_id = m.chat_id and cm.user_id = ${context.userId}
      left join profiles p on p.user_id = m.sender_id
      left join messages r on r.id = m.reply_to
      left join profiles rp on rp.user_id = r.sender_id
      where m.chat_id = ${data.chatId}
        and m.created_at < ${before}::timestamptz
        and (cm.cleared_at is null or m.created_at > cm.cleared_at)
      order by m.created_at desc
      limit 81
    `;
    const hasMore = rows.length > 80;
    const slice = rows.slice(0, 80).reverse();
    const typing = await sql<{ display_name: string }>`
      select coalesce(p.display_name, '') as display_name
      from typing t
      left join profiles p on p.user_id = t.user_id
      where t.chat_id = ${data.chatId}
        and t.user_id <> ${context.userId}
        and t.until_at > now()
    `;
    return {
      chat: {
        id: chat.id,
        kind: chat.kind === "group" ? "group" : "direct",
        title,
        about: chat.about,
        myRole: mem.role,
        muted: bool(mem.muted),
        pinned: bool(mem.pinned),
        archived: bool(mem.archived),
        hasAvatar: chat.kind === "group" ? Boolean(chat.avatar_data) : false,
        avatarRev: iso(chat.updated_at) ?? "",
        peerId,
      },
      members,
      messages: slice.map((row) => mapMessage(row, context.userId)),
      typing: typing.map((t) => t.display_name).filter(Boolean),
      hasMore,
    };
  });

export const markOpen = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const chatId = clean(rec(input).chatId, 80);
    if (!chatId) throw new Error("bad_input");
    return { chatId };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await gate(sql, context.userId);
    const mem = await memberRole(sql, data.chatId, context.userId);
    if (!mem) return err("not_found");
    if (bool(me.read_receipts)) {
      await sql`
        update chat_members
        set last_open_at = now(), last_read_at = now()
        where chat_id = ${data.chatId} and user_id = ${context.userId}
      `;
    } else {
      await sql`
        update chat_members set last_open_at = now()
        where chat_id = ${data.chatId} and user_id = ${context.userId}
      `;
    }
    return ok(true);
  });

export const setTyping = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const o = rec(input);
    const chatId = clean(o.chatId, 80);
    if (!chatId) throw new Error("bad_input");
    return { chatId, on: Boolean(o.on) };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const mem = await memberRole(sql, data.chatId, context.userId);
    if (!mem) return err("not_found");
    if (!data.on) {
      await sql`delete from typing where chat_id = ${data.chatId} and user_id = ${context.userId}`;
      return ok(true);
    }
    await sql`
      insert into typing (chat_id, user_id, until_at)
      values (${data.chatId}, ${context.userId}, now() + make_interval(secs => 4))
      on conflict (chat_id, user_id) do update set until_at = excluded.until_at
    `;
    return ok(true);
  });

export const sendMessage = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Result<{ id: string }>> => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const chatId = clean(data.chatId, 80);
    const kind = clean(data.kind, 16);
    if (!chatId || !["text", "image", "video", "audio", "file"].includes(kind)) return err("bad_input");
    const mem = await memberRole(sql, chatId, context.userId);
    if (!mem) return err("not_found");
    const chats = await sql<{ kind: string }>`select kind from chats where id = ${chatId}`;
    if (chats[0]?.kind === "direct") {
      const other = await sql<{ user_id: string }>`
        select user_id from chat_members where chat_id = ${chatId} and user_id <> ${context.userId}
      `;
      if (other[0] && (await blockedEither(sql, context.userId, other[0].user_id))) return err("blocked");
    }
    const recent = await sql<{ n: number }>`
      select count(*)::int as n from messages
      where sender_id = ${context.userId}
        and created_at > now() - make_interval(secs => 60)
    `;
    if (num(recent[0]?.n) > 40) return err("rate");
    const body = clean(data.body, 4000);
    if (kind === "text" && !body) return err("empty");
    let fileName: string | null = null;
    let fileMime: string | null = null;
    let fileData: string | null = null;
    let fileSize: number | null = null;
    if (kind !== "text") {
      fileMime = clean(data.fileMime, 80).toLowerCase();
      fileName = clean(data.fileName, 120).replace(/[\\/]/g, "") || "file";
      fileData = typeof data.fileData === "string" ? data.fileData.replace(/\s/g, "") : "";
      if (!mimeOk(kind, fileMime) || !/^[A-Za-z0-9+/=]+$/.test(fileData)) return err("bad_type");
      fileSize = approxBytes(fileData);
      const cap = await maxBytes(sql);
      if (fileSize > cap) return err("too_large");
    }
    let replyTo: string | null = null;
    if (data.replyTo) {
      const rid = clean(data.replyTo, 80);
      const found = await sql<{ id: string }>`
        select id from messages where id = ${rid} and chat_id = ${chatId}
      `;
      if (found.length) replyTo = rid;
    }
    const id = crypto.randomUUID();
    await sql`
      insert into messages (
        id, chat_id, sender_id, kind, body, file_name, file_mime, file_data, file_size, reply_to
      ) values (
        ${id}, ${chatId}, ${context.userId}, ${kind}, ${body || null},
        ${fileName}, ${fileMime}, ${fileData}, ${fileSize}, ${replyTo}
      )
    `;
    await sql`update chats set updated_at = now() where id = ${chatId}`;
    await sql`delete from typing where chat_id = ${chatId} and user_id = ${context.userId}`;
    return ok({ id });
  });

export const editMessage = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const id = clean(data.id, 80);
    const body = clean(data.body, 4000);
    if (!id || !body) return err("empty");
    const rows = await sql<{ sender_id: string; kind: string; deleted_at: unknown }>`
      select sender_id, kind, deleted_at from messages where id = ${id}
    `;
    const row = rows[0];
    if (!row || row.sender_id !== context.userId || row.kind !== "text" || row.deleted_at) {
      return err("forbidden");
    }
    await sql`update messages set body = ${body}, edited_at = now() where id = ${id}`;
    return ok(true);
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = clean(rec(input).id, 80);
    if (!id) throw new Error("bad_input");
    return { id };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const rows = await sql<{ sender_id: string }>`
      select sender_id from messages where id = ${data.id} and deleted_at is null
    `;
    if (!rows[0] || rows[0].sender_id !== context.userId) return err("forbidden");
    await sql`
      update messages
      set deleted_at = now(), body = null, file_data = null, file_name = null, file_mime = null
      where id = ${data.id}
    `;
    return ok(true);
  });

export const getFile = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const id = clean(rec(input).id, 80);
    if (!id) throw new Error("bad_input");
    return { id };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const rows = await sql<{
      chat_id: string;
      file_data: string | null;
      file_mime: string | null;
      file_name: string | null;
      deleted_at: unknown;
    }>`
      select chat_id, file_data, file_mime, file_name, deleted_at from messages where id = ${data.id}
    `;
    const row = rows[0];
    if (!row || row.deleted_at || !row.file_data) return { data: null, mime: null, name: null };
    const mem = await memberRole(sql, row.chat_id, context.userId);
    if (!mem) return { data: null, mime: null, name: null };
    return { data: row.file_data, mime: row.file_mime, name: row.file_name };
  });

export const openDirect = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const userId = clean(rec(input).userId, 80);
    if (!userId) throw new Error("bad_input");
    return { userId };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data}): Promise<Result<{ id: string }>> => {
    const sql = await getSql();
    await gate(sql, context.userId);
    if (data.userId === context.userId) return err("self");
    const other = await profileOf(sql, data.userId);
    if (!other || bool(other.suspended)) return err("not_found");
    if (await blockedEither(sql, context.userId, data.userId)) return err("blocked");
    const existing = await sql<{ id: string }>`
      select c.id from chats c
      join chat_members a on a.chat_id = c.id and a.user_id = ${context.userId}
      join chat_members b on b.chat_id = c.id and b.user_id = ${data.userId}
      where c.kind = 'direct'
      limit 1
    `;
    if (existing[0]) return ok({ id: existing[0].id });
    const id = crypto.randomUUID();
    await sql`
      insert into chats (id, kind, title, created_by) values (${id}, 'direct', ${""}, ${context.userId})
    `;
    await sql`
      insert into chat_members (chat_id, user_id, role) values
        (${id}, ${context.userId}, 'member'),
        (${id}, ${data.userId}, 'member')
    `;
    await sql`
      insert into contacts (owner_id, contact_id) values
        (${context.userId}, ${data.userId}),
        (${data.userId}, ${context.userId})
      on conflict do nothing
    `;
    return ok({ id });
  });

export const createGroup = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Result<{ id: string }>> => {
    const sql = await getSql();
    const me = await gate(sql, context.userId);
    const title = clean(data.title, 60);
    if (!title) return err("name_required");
    const rawIds = Array.isArray(data.memberIds) ? data.memberIds : [];
    const memberIds = [...new Set(rawIds.map((id) => clean(id, 80)).filter((id) => id && id !== context.userId))].slice(0, 50);
    if (!memberIds.length) return err("members_required");
    const id = crypto.randomUUID();
    await sql`
      insert into chats (id, kind, title, created_by) values (${id}, 'group', ${title}, ${context.userId})
    `;
    await sql`
      insert into chat_members (chat_id, user_id, role) values (${id}, ${context.userId}, 'owner')
    `;
    for (const uid of memberIds) {
      const p = await profileOf(sql, uid);
      if (!p || bool(p.suspended)) continue;
      if (await blockedEither(sql, context.userId, uid)) continue;
      await sql`
        insert into chat_members (chat_id, user_id, role) values (${id}, ${uid}, 'member')
        on conflict do nothing
      `;
    }
    await systemNote(sql, id, context.userId, `created:${me.display_name}`);
    return ok({ id });
  });

export const updateGroup = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const chatId = clean(data.chatId, 80);
    const mem = await memberRole(sql, chatId, context.userId);
    if (!mem || (mem.role !== "owner" && mem.role !== "admin")) return err("forbidden");
    const chats = await sql<{ kind: string }>`select kind from chats where id = ${chatId}`;
    if (chats[0]?.kind !== "group") return err("not_found");
    if (data.title !== undefined) {
      const title = clean(data.title, 60);
      if (!title) return err("name_required");
      await sql`update chats set title = ${title}, updated_at = now() where id = ${chatId}`;
    }
    if (data.about !== undefined) {
      await sql`update chats set about = ${clean(data.about, 200)}, updated_at = now() where id = ${chatId}`;
    }
    if (data.avatarData === null) {
      await sql`update chats set avatar_data = null, avatar_mime = null, updated_at = now() where id = ${chatId}`;
    } else if (typeof data.avatarData === "string" && data.avatarData) {
      const mime = clean(data.avatarMime, 40);
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) return err("bad_type");
      const raw = data.avatarData.replace(/\s/g, "");
      if (approxBytes(raw) > 180_000) return err("too_large");
      await sql`
        update chats set avatar_data = ${raw}, avatar_mime = ${mime}, updated_at = now()
        where id = ${chatId}
      `;
    }
    return ok(true);
  });

export const addMembers = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await gate(sql, context.userId);
    const chatId = clean(data.chatId, 80);
    const mem = await memberRole(sql, chatId, context.userId);
    if (!mem || (mem.role !== "owner" && mem.role !== "admin")) return err("forbidden");
    const ids = Array.isArray(data.memberIds) ? data.memberIds : [];
    for (const raw of ids.slice(0, 30)) {
      const uid = clean(raw, 80);
      if (!uid || uid === context.userId) continue;
      const p = await profileOf(sql, uid);
      if (!p || bool(p.suspended)) continue;
      await sql`
        insert into chat_members (chat_id, user_id, role) values (${chatId}, ${uid}, 'member')
        on conflict do nothing
      `;
      await systemNote(sql, chatId, context.userId, `added:${p.display_name}:${me.display_name}`);
    }
    return ok(true);
  });

export const removeMember = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const o = rec(input);
    return { chatId: clean(o.chatId, 80), userId: clean(o.userId, 80) };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await gate(sql, context.userId);
    if (!data.chatId || !data.userId) return err("bad_input");
    const mem = await memberRole(sql, data.chatId, context.userId);
    if (!mem || (mem.role !== "owner" && mem.role !== "admin")) return err("forbidden");
    const target = await memberRole(sql, data.chatId, data.userId);
    if (!target || target.role === "owner") return err("forbidden");
    const profile = await profileOf(sql, data.userId);
    await sql`delete from chat_members where chat_id = ${data.chatId} and user_id = ${data.userId}`;
    await systemNote(
      sql,
      data.chatId,
      context.userId,
      `removed:${profile?.display_name || ""}:${me.display_name}`,
    );
    return ok(true);
  });

export const leaveGroup = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const chatId = clean(rec(input).chatId, 80);
    if (!chatId) throw new Error("bad_input");
    return { chatId };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await gate(sql, context.userId);
    const mem = await memberRole(sql, data.chatId, context.userId);
    if (!mem) return err("not_found");
    const chats = await sql<{ kind: string }>`select kind from chats where id = ${data.chatId}`;
    if (chats[0]?.kind !== "group") return err("forbidden");
    if (mem.role === "owner") {
      const next = await sql<{ user_id: string }>`
        select user_id from chat_members
        where chat_id = ${data.chatId} and user_id <> ${context.userId}
        order by (role = 'admin') desc, joined_at asc
        limit 1
      `;
      if (!next[0]) {
        await sql`delete from chats where id = ${data.chatId}`;
        return ok(true);
      }
      await sql`
        update chat_members set role = 'owner'
        where chat_id = ${data.chatId} and user_id = ${next[0].user_id}
      `;
    }
    await sql`delete from chat_members where chat_id = ${data.chatId} and user_id = ${context.userId}`;
    await systemNote(sql, data.chatId, context.userId, `left:${me.display_name}`);
    return ok(true);
  });

export const setChatFlags = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const chatId = clean(data.chatId, 80);
    const mem = await memberRole(sql, chatId, context.userId);
    if (!mem) return err("not_found");
    if (data.pinned !== undefined) {
      await sql`
        update chat_members set pinned = ${Boolean(data.pinned)}
        where chat_id = ${chatId} and user_id = ${context.userId}
      `;
    }
    if (data.muted !== undefined) {
      await sql`
        update chat_members set muted = ${Boolean(data.muted)}
        where chat_id = ${chatId} and user_id = ${context.userId}
      `;
    }
    if (data.archived !== undefined) {
      await sql`
        update chat_members set archived = ${Boolean(data.archived)}
        where chat_id = ${chatId} and user_id = ${context.userId}
      `;
    }
    if (data.clear) {
      await sql`
        update chat_members set cleared_at = now(), last_open_at = now()
        where chat_id = ${chatId} and user_id = ${context.userId}
      `;
    }
    return ok(true);
  });

export const setBlock = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const o = rec(input);
    const userId = clean(o.userId, 80);
    if (!userId) throw new Error("bad_input");
    return { userId, block: Boolean(o.block) };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    if (data.userId === context.userId) return err("self");
    if (data.block) {
      await sql`
        insert into blocks (blocker_id, blocked_id) values (${context.userId}, ${data.userId})
        on conflict do nothing
      `;
    } else {
      await sql`
        delete from blocks where blocker_id = ${context.userId} and blocked_id = ${data.userId}
      `;
    }
    return ok(true);
  });

export const listBlocked = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    return sql<{ userId: string; displayName: string; username: string | null }>`
      select p.user_id as "userId", p.display_name as "displayName", p.username
      from blocks b
      join profiles p on p.user_id = b.blocked_id
      where b.blocker_id = ${context.userId}
      order by b.created_at desc
    `;
  });

export const reportUser = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const reason = clean(data.reason, 40);
    if (!["spam", "harassment", "other"].includes(reason)) return err("bad_input");
    const details = clean(data.details, 500);
    const targetUserId = data.targetUserId ? clean(data.targetUserId, 80) : null;
    const targetChatId = data.targetChatId ? clean(data.targetChatId, 80) : null;
    const targetMessageId = data.targetMessageId ? clean(data.targetMessageId, 80) : null;
    if (!targetUserId && !targetMessageId) return err("bad_input");
    await sql`
      insert into reports (id, reporter_id, target_user_id, target_chat_id, target_message_id, reason, details)
      values (
        ${crypto.randomUUID()}, ${context.userId}, ${targetUserId}, ${targetChatId},
        ${targetMessageId}, ${reason}, ${details || null}
      )
    `;
    return ok(true);
  });

const STATUS_BG = new Set(["#008069", "#0b141a", "#6b3fa0", "#c4532a", "#1f6f8b", "#8a1538"]);

export const listStatuses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StatusItem[]> => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const rows = await sql<{
      id: string;
      user_id: string;
      kind: string;
      caption: string | null;
      bg: string | null;
      created_at: unknown;
      display_name: string | null;
      username: string | null;
      avatar_data: string | null;
      privacy_photo: string;
      privacy_status: string;
      updated_at: unknown;
      viewed: unknown;
    }>`
      select s.id, s.user_id, s.kind, s.caption, s.bg, s.created_at,
             p.display_name, p.username, p.avatar_data, p.privacy_photo, p.privacy_status, p.updated_at,
             (sv.viewer_id is not null) as viewed
      from statuses s
      join profiles p on p.user_id = s.user_id
      left join status_views sv on sv.status_id = s.id and sv.viewer_id = ${context.userId}
      where s.expires_at > now() and p.suspended = false
      order by s.created_at desc
      limit 200
    `;
    const out: StatusItem[] = [];
    for (const row of rows) {
      const mine = row.user_id === context.userId;
      if (!mine) {
        if (await blockedEither(sql, context.userId, row.user_id)) continue;
        const isKnown = await known(sql, context.userId, row.user_id);
        if (!allowed(row.privacy_status, isKnown)) continue;
      }
      const seePhoto = mine || allowed(row.privacy_photo, await known(sql, context.userId, row.user_id));
      out.push({
        id: row.id,
        userId: row.user_id,
        displayName: row.display_name || row.username || "",
        username: row.username,
        hasAvatar: Boolean(seePhoto && row.avatar_data),
        avatarRev: iso(row.updated_at) ?? "",
        kind: row.kind,
        caption: row.caption,
        bg: row.bg,
        createdAt: iso(row.created_at) ?? new Date().toISOString(),
        viewed: bool(row.viewed) || mine,
        mine,
      });
    }
    return out;
  });

export const postStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const kind = clean(data.kind, 16);
    const caption = clean(data.caption, 200);
    if (kind === "text") {
      if (!caption) return err("empty");
      const bg = STATUS_BG.has(clean(data.bg, 16)) ? clean(data.bg, 16) : "#008069";
      await sql`
        insert into statuses (id, user_id, kind, caption, bg, expires_at)
        values (${crypto.randomUUID()}, ${context.userId}, 'text', ${caption}, ${bg}, now() + make_interval(hours => 24))
      `;
      return ok(true);
    }
    if (kind !== "image") return err("bad_input");
    const mime = clean(data.fileMime, 40);
    const raw = typeof data.fileData === "string" ? data.fileData.replace(/\s/g, "") : "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) return err("bad_type");
    if (approxBytes(raw) > (await maxBytes(sql))) return err("too_large");
    await sql`
      insert into statuses (id, user_id, kind, caption, file_mime, file_data, expires_at)
      values (
        ${crypto.randomUUID()}, ${context.userId}, 'image', ${caption || null}, ${mime}, ${raw},
        now() + make_interval(hours => 24)
      )
    `;
    return ok(true);
  });

export const getStatusMedia = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const id = clean(rec(input).id, 80);
    if (!id) throw new Error("bad_input");
    return { id };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const rows = await sql<{
      user_id: string;
      file_data: string | null;
      file_mime: string | null;
      privacy_status: string;
    }>`
      select s.user_id, s.file_data, s.file_mime, p.privacy_status
      from statuses s
      join profiles p on p.user_id = s.user_id
      where s.id = ${data.id} and s.expires_at > now()
    `;
    const row = rows[0];
    if (!row?.file_data) return { data: null as string | null, mime: null as string | null };
    if (row.user_id !== context.userId) {
      if (await blockedEither(sql, context.userId, row.user_id)) return { data: null, mime: null };
      const isKnown = await known(sql, context.userId, row.user_id);
      if (!allowed(row.privacy_status, isKnown)) return { data: null, mime: null };
    }
    return { data: row.file_data, mime: row.file_mime };
  });

export const viewStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = clean(rec(input).id, 80);
    if (!id) throw new Error("bad_input");
    return { id };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const rows = await sql<{ user_id: string }>`
      select user_id from statuses where id = ${data.id} and expires_at > now()
    `;
    if (!rows[0] || rows[0].user_id === context.userId) return ok(true);
    await sql`
      insert into status_views (status_id, viewer_id) values (${data.id}, ${context.userId})
      on conflict do nothing
    `;
    return ok(true);
  });

export const deleteStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = clean(rec(input).id, 80);
    if (!id) throw new Error("bad_input");
    return { id };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    await sql`delete from statuses where id = ${data.id} and user_id = ${context.userId}`;
    return ok(true);
  });

export const statusViewers = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const id = clean(rec(input).id, 80);
    if (!id) throw new Error("bad_input");
    return { id };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    return sql<{ displayName: string; username: string | null; viewedAt: string }>`
      select p.display_name as "displayName", p.username, sv.viewed_at as "viewedAt"
      from status_views sv
      join statuses s on s.id = sv.status_id and s.user_id = ${context.userId}
      join profiles p on p.user_id = sv.viewer_id
      where sv.status_id = ${data.id}
      order by sv.viewed_at desc
    `;
  });

async function expireCalls(sql: Sql, userId: string) {
  const rows = await sql<{ id: string; chat_id: string; kind: string; caller_id: string }>`
    update calls set status = 'missed', ended_at = now()
    where status = 'ringing'
      and created_at < now() - make_interval(secs => 45)
      and (caller_id = ${userId} or callee_id = ${userId})
    returning id, chat_id, kind, caller_id
  `;
  for (const row of rows) {
    await systemNote(sql, row.chat_id, row.caller_id, `call:${row.kind}:missed`);
  }
}

function mapCall(
  row: {
    id: string;
    chat_id: string;
    caller_id: string;
    callee_id: string;
    kind: string;
    status: string;
    created_at: unknown;
    peer_id: string;
    peer_name: string | null;
    peer_avatar: string | null;
    peer_rev: unknown;
  },
): LiveCall {
  return {
    id: row.id,
    chatId: row.chat_id,
    callerId: row.caller_id,
    calleeId: row.callee_id,
    kind: row.kind === "video" ? "video" : "audio",
    status: row.status,
    peerId: row.peer_id,
    peerName: row.peer_name || "",
    peerHasAvatar: Boolean(row.peer_avatar),
    peerAvatarRev: iso(row.peer_rev) ?? "",
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
  };
}

export const pollCalls = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ incoming: LiveCall | null; active: LiveCall | null }> => {
    const sql = await getSql();
    await gate(sql, context.userId);
    await expireCalls(sql, context.userId);
    const rows = await sql<{
      id: string;
      chat_id: string;
      caller_id: string;
      callee_id: string;
      kind: string;
      status: string;
      created_at: unknown;
      peer_id: string;
      peer_name: string | null;
      peer_avatar: string | null;
      peer_rev: unknown;
    }>`
      select c.id, c.chat_id, c.caller_id, c.callee_id, c.kind, c.status, c.created_at,
             p.user_id as peer_id, p.display_name as peer_name, p.avatar_data as peer_avatar,
             p.updated_at as peer_rev
      from calls c
      join profiles p on p.user_id = case
        when c.caller_id = ${context.userId} then c.callee_id else c.caller_id end
      where (c.caller_id = ${context.userId} or c.callee_id = ${context.userId})
        and c.status in ('ringing', 'accepted')
        and c.created_at > now() - make_interval(secs => 3600)
      order by c.created_at desc
      limit 5
    `;
    const incoming = rows.find((r) => r.status === "ringing" && r.callee_id === context.userId) ?? null;
    const active =
      rows.find((r) => r.status === "accepted") ??
      rows.find((r) => r.status === "ringing" && r.caller_id === context.userId) ??
      null;
    return {
      incoming: incoming ? mapCall(incoming) : null,
      active: active && active.id !== incoming?.id ? mapCall(active) : incoming ? null : null,
    };
  });

export const startCall = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const o = rec(input);
    const chatId = clean(o.chatId, 80);
    const kind = clean(o.kind, 8);
    if (!chatId || (kind !== "audio" && kind !== "video")) throw new Error("bad_input");
    return { chatId, kind: kind as "audio" | "video" };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Result<LiveCall>> => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const chat = await sql<{ kind: string }>`select kind from chats where id = ${data.chatId}`;
    if (chat[0]?.kind !== "direct") return err("not_direct");
    const mem = await memberRole(sql, data.chatId, context.userId);
    if (!mem) return err("not_found");
    const other = await sql<{ user_id: string }>`
      select user_id from chat_members where chat_id = ${data.chatId} and user_id <> ${context.userId}
    `;
    if (!other[0]) return err("not_found");
    if (await blockedEither(sql, context.userId, other[0].user_id)) return err("blocked");
    const existing = await sql<{ id: string }>`
      select id from calls
      where chat_id = ${data.chatId} and status in ('ringing', 'accepted')
        and created_at > now() - make_interval(secs => 3600)
      limit 1
    `;
    if (existing[0]) return err("busy");
    const id = crypto.randomUUID();
    await sql`
      insert into calls (id, chat_id, caller_id, callee_id, kind, status)
      values (${id}, ${data.chatId}, ${context.userId}, ${other[0].user_id}, ${data.kind}, 'ringing')
    `;
    const polled = await sql<{
      id: string;
      chat_id: string;
      caller_id: string;
      callee_id: string;
      kind: string;
      status: string;
      created_at: unknown;
      peer_id: string;
      peer_name: string | null;
      peer_avatar: string | null;
      peer_rev: unknown;
    }>`
      select c.id, c.chat_id, c.caller_id, c.callee_id, c.kind, c.status, c.created_at,
             p.user_id as peer_id, p.display_name as peer_name, p.avatar_data as peer_avatar,
             p.updated_at as peer_rev
      from calls c join profiles p on p.user_id = c.callee_id
      where c.id = ${id}
    `;
    if (!polled[0]) return err("not_found");
    return ok(mapCall(polled[0]));
  });

export const answerCall = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const o = rec(input);
    const id = clean(o.id, 80);
    const action = clean(o.action, 16);
    if (!id || !["accept", "decline", "cancel", "end"].includes(action)) throw new Error("bad_input");
    return { id, action };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await gate(sql, context.userId);
    const rows = await sql<{
      id: string;
      chat_id: string;
      caller_id: string;
      callee_id: string;
      kind: string;
      status: string;
    }>`
      select id, chat_id, caller_id, callee_id, kind, status from calls where id = ${data.id}
    `;
    const call = rows[0];
    if (!call) return err("not_found");
    if (call.caller_id !== context.userId && call.callee_id !== context.userId) return err("forbidden");
    if (data.action === "accept") {
      if (call.callee_id !== context.userId || call.status !== "ringing") return err("forbidden");
      await sql`update calls set status = 'accepted', answered_at = now() where id = ${call.id}`;
      return ok(true);
    }
    if (data.action === "decline") {
      if (call.callee_id !== context.userId || call.status !== "ringing") return err("forbidden");
      await sql`update calls set status = 'declined', ended_at = now() where id = ${call.id}`;
      await systemNote(sql, call.chat_id, call.caller_id, `call:${call.kind}:declined`);
      return ok(true);
    }
    if (data.action === "cancel") {
      if (call.caller_id !== context.userId || call.status !== "ringing") return err("forbidden");
      await sql`update calls set status = 'cancelled', ended_at = now() where id = ${call.id}`;
      await systemNote(sql, call.chat_id, call.caller_id, `call:${call.kind}:cancelled`);
      return ok(true);
    }
    if (call.status === "ringing" || call.status === "accepted") {
      await sql`update calls set status = 'ended', ended_at = now() where id = ${call.id}`;
      await systemNote(sql, call.chat_id, call.caller_id, `call:${call.kind}:ended`);
    }
    return ok(true);
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .validator((input: unknown) => ({ q: clean(rec(input ?? {}).q, 60).toLowerCase() }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<AdminUser[]> => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const like = `%${data.q.replace(/[%_]/g, "")}%`;
    const rows = await sql<{
      id: string;
      email: string;
      username: string | null;
      display_name: string | null;
      phone: string | null;
      role: string | null;
      suspended: unknown;
      about: string | null;
      created_at: unknown;
      last_seen_at: unknown;
    }>`
      select u.id, u.email, p.username, coalesce(p.display_name, u.name) as display_name,
             p.phone, p.role, p.suspended, p.about, coalesce(p.created_at, u."createdAt") as created_at,
             p.last_seen_at
      from "user" u
      left join profiles p on p.user_id = u.id
      where ${data.q} = ''
         or lower(u.email) like ${like}
         or lower(coalesce(p.username, '')) like ${like}
         or lower(coalesce(p.display_name, u.name)) like ${like}
         or coalesce(p.phone, '') like ${like}
      order by u."createdAt" desc
      limit 100
    `;
    return rows.map((r) => ({
      userId: r.id,
      email: r.email,
      username: r.username,
      displayName: r.display_name || "",
      phone: r.phone,
      role: roleOf(r.role || "user"),
      suspended: bool(r.suspended),
      about: r.about || "",
      createdAt: iso(r.created_at) ?? "",
      lastSeenAt: iso(r.last_seen_at),
    }));
  });

export const adminSaveUser = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const userId = clean(data.userId, 80);
    if (!userId) return err("bad_input");
    await ensure(sql, userId);
    const target = await profileOf(sql, userId);
    if (!target) return err("not_found");
    const displayName = data.displayName === undefined ? target.display_name : clean(data.displayName, 50);
    if (!displayName) return err("name_required");
    let username = target.username;
    if (data.username !== undefined) {
      const next = clean(data.username, 24).toLowerCase();
      if (next && !USERNAME.test(next)) return err("username_invalid");
      if (next) {
        const taken = await sql<{ user_id: string }>`
          select user_id from profiles where lower(username) = ${next} and user_id <> ${userId}
        `;
        if (taken.length) return err("username_taken");
      }
      username = next || null;
    }
    let phone = target.phone;
    if (data.phone !== undefined) {
      const raw = clean(data.phone, 16);
      if (!raw) phone = null;
      else if (!PHONE.test(raw)) return err("phone_invalid");
      else {
        const taken = await sql<{ user_id: string }>`
          select user_id from profiles where phone = ${raw} and user_id <> ${userId}
        `;
        if (taken.length) return err("phone_taken");
        phone = raw;
      }
    }
    const role = data.role === undefined ? target.role : clean(data.role, 16) === "admin" ? "admin" : "user";
    const suspended = data.suspended === undefined ? bool(target.suspended) : Boolean(data.suspended);
    if (userId === admin.user_id && (role !== "admin" || suspended)) return err("self");
    if (target.role === "admin" && role !== "admin") {
      const admins = await sql<{ n: number }>`select count(*)::int as n from profiles where role = 'admin'`;
      if (num(admins[0]?.n) <= 1) return err("last_admin");
    }
    const about = data.about === undefined ? target.about : clean(data.about, 140);
    await sql`
      update profiles set
        display_name = ${displayName},
        username = ${username},
        phone = ${phone},
        role = ${role},
        suspended = ${suspended},
        about = ${about},
        updated_at = now()
      where user_id = ${userId}
    `;
    await sql`update "user" set name = ${displayName}, "updatedAt" = now() where id = ${userId}`;
    return ok(true);
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const email = clean(data.email, 120).toLowerCase();
    const password = String(data.password ?? "");
    const displayName = clean(data.displayName, 50);
    const username = clean(data.username, 24).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("invalid_email");
    if (password.length < 8) return err("weak_password");
    if (!displayName) return err("name_required");
    if (!USERNAME.test(username)) return err("username_invalid");
    const taken = await sql<{ user_id: string }>`
      select user_id from profiles where lower(username) = ${username}
    `;
    if (taken.length) return err("username_taken");
    const { auth } = await import("@/lib/auth/server");
    try {
      const created = await auth.api.signUpEmail({
        body: { email, password, name: displayName },
      });
      const userId = created.user.id;
      await sql`
        insert into profiles (user_id, username, display_name, role, last_seen_at)
        values (${userId}, ${username}, ${displayName}, 'user', null)
        on conflict (user_id) do update set username = ${username}, display_name = ${displayName}
      `;
      return ok({ userId });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (/exist|unique|already/i.test(message)) return err("email_taken");
      return err("auth_failed");
    }
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const userId = clean(rec(input).userId, 80);
    if (!userId) throw new Error("bad_input");
    return { userId };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    if (data.userId === admin.user_id) return err("self");
    const target = await profileOf(sql, data.userId);
    if (target?.role === "admin") {
      const admins = await sql<{ n: number }>`select count(*)::int as n from profiles where role = 'admin'`;
      if (num(admins[0]?.n) <= 1) return err("last_admin");
    }
    const id = data.userId;
    await sql`delete from messages where sender_id = ${id}`;
    await sql`delete from statuses where user_id = ${id}`;
    await sql`delete from status_views where viewer_id = ${id}`;
    await sql`delete from blocks where blocker_id = ${id} or blocked_id = ${id}`;
    await sql`delete from contacts where owner_id = ${id} or contact_id = ${id}`;
    await sql`delete from typing where user_id = ${id}`;
    await sql`delete from calls where caller_id = ${id} or callee_id = ${id}`;
    await sql`delete from chat_members where user_id = ${id}`;
    await sql`delete from profiles where user_id = ${id}`;
    await sql`delete from "session" where "userId" = ${id}`;
    await sql`delete from "account" where "userId" = ${id}`;
    await sql`delete from "user" where id = ${id}`;
    return ok(true);
  });

export const adminListGroups = createServerFn({ method: "GET" })
  .validator((input: unknown) => ({ q: clean(rec(input ?? {}).q, 60).toLowerCase() }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<AdminGroup[]> => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const like = `%${data.q.replace(/[%_]/g, "")}%`;
    const rows = await sql<{
      id: string;
      title: string | null;
      about: string;
      members: number;
      created_at: unknown;
      updated_at: unknown;
    }>`
      select c.id, c.title, c.about, count(m.user_id)::int as members, c.created_at, c.updated_at
      from chats c
      left join chat_members m on m.chat_id = c.id
      where c.kind = 'group'
        and (${data.q} = '' or lower(coalesce(c.title, '')) like ${like})
      group by c.id
      order by c.updated_at desc
      limit 100
    `;
    return rows.map((r) => ({
      id: r.id,
      title: r.title || "",
      about: r.about,
      members: num(r.members),
      createdAt: iso(r.created_at) ?? "",
      updatedAt: iso(r.updated_at) ?? "",
    }));
  });

export const adminUpdateGroup = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const id = clean(data.id, 80);
    const title = clean(data.title, 60);
    if (!id || !title) return err("name_required");
    await sql`
      update chats set title = ${title}, about = ${clean(data.about, 200)}, updated_at = now()
      where id = ${id} and kind = 'group'
    `;
    return ok(true);
  });

export const adminDeleteGroup = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const id = clean(rec(input).id, 80);
    if (!id) throw new Error("bad_input");
    return { id };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    await sql`delete from chats where id = ${data.id} and kind = 'group'`;
    return ok(true);
  });

export const adminListReports = createServerFn({ method: "GET" })
  .validator((input: unknown) => ({ status: clean(rec(input ?? {}).status, 16) }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<AdminReport[]> => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const status = ["open", "reviewed", "dismissed"].includes(data.status) ? data.status : "";
    const rows = await sql<{
      id: string;
      reporter_id: string;
      reporter_name: string | null;
      target_user_id: string | null;
      target_name: string | null;
      target_chat_id: string | null;
      target_message_id: string | null;
      reason: string;
      details: string | null;
      status: string;
      created_at: unknown;
    }>`
      select r.id, r.reporter_id, rp.display_name as reporter_name, r.target_user_id,
             tp.display_name as target_name, r.target_chat_id, r.target_message_id,
             r.reason, r.details, r.status, r.created_at
      from reports r
      left join profiles rp on rp.user_id = r.reporter_id
      left join profiles tp on tp.user_id = r.target_user_id
      where ${status} = '' or r.status = ${status}
      order by r.created_at desc
      limit 200
    `;
    return rows.map((r) => ({
      id: r.id,
      reporterId: r.reporter_id,
      reporterName: r.reporter_name || "",
      targetUserId: r.target_user_id,
      targetName: r.target_name,
      targetChatId: r.target_chat_id,
      targetMessageId: r.target_message_id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: iso(r.created_at) ?? "",
    }));
  });

export const adminSetReport = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const o = rec(input);
    const id = clean(o.id, 80);
    const status = clean(o.status, 16);
    if (!id || !["open", "reviewed", "dismissed"].includes(status)) throw new Error("bad_input");
    return { id, status };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    await sql`update reports set status = ${data.status} where id = ${data.id}`;
    return ok(true);
  });

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    return {
      allowSignups: (await setting(sql, "allow_signups", "true")) !== "false",
      maxUploadBytes: Number(await setting(sql, "max_upload_bytes", "2000000")),
      maintenance: await setting(sql, "maintenance_message", ""),
    };
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .validator((input: unknown) => rec(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const allow = Boolean(data.allowSignups);
    let max = Number(data.maxUploadBytes);
    if (!Number.isFinite(max)) max = 2_000_000;
    max = Math.min(4_000_000, Math.max(100_000, Math.floor(max)));
    const maintenance = clean(data.maintenance, 240);
    const pairs: [string, string][] = [
      ["allow_signups", allow ? "true" : "false"],
      ["max_upload_bytes", String(max)],
      ["maintenance_message", maintenance],
    ];
    for (const [key, value] of pairs) {
      await sql`
        insert into system_settings (key, value) values (${key}, ${value})
        on conflict (key) do update set value = ${value}
      `;
    }
    return ok(true);
  });
