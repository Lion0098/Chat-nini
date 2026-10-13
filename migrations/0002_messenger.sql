-- Chat Nini messenger schema. Files live in Postgres (no disk, no VPS).
-- Realtime is HTTP polling; calls are browser WebRTC with DB signaling.

create table if not exists profiles (
  user_id text primary key,
  username text,
  display_name text not null default '',
  about text not null default '',
  phone text,
  avatar_data text,
  avatar_mime text,
  role text not null default 'user',
  locale text not null default 'fa',
  privacy_last_seen text not null default 'everyone',
  privacy_photo text not null default 'everyone',
  privacy_about text not null default 'everyone',
  privacy_status text not null default 'contacts',
  read_receipts boolean not null default true,
  suspended boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower
  on profiles (lower(username));

create unique index if not exists profiles_phone_unique
  on profiles (phone)
  where phone is not null and phone <> '';

create table if not exists chats (
  id text primary key,
  kind text not null,
  title text,
  about text not null default '',
  avatar_data text,
  avatar_mime text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_members (
  chat_id text not null references chats (id) on delete cascade,
  user_id text not null,
  role text not null default 'member',
  muted boolean not null default false,
  pinned boolean not null default false,
  archived boolean not null default false,
  last_read_at timestamptz,
  last_open_at timestamptz,
  cleared_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create index if not exists chat_members_user_idx on chat_members (user_id);

create table if not exists messages (
  id text primary key,
  chat_id text not null references chats (id) on delete cascade,
  sender_id text not null,
  kind text not null,
  body text,
  file_name text,
  file_mime text,
  file_data text,
  file_size integer,
  reply_to text,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index if not exists messages_chat_created_idx
  on messages (chat_id, created_at);

create table if not exists statuses (
  id text primary key,
  user_id text not null,
  kind text not null,
  caption text,
  bg text,
  file_mime text,
  file_data text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists statuses_expires_idx on statuses (expires_at);

create table if not exists status_views (
  status_id text not null references statuses (id) on delete cascade,
  viewer_id text not null,
  viewed_at timestamptz not null default now(),
  primary key (status_id, viewer_id)
);

create table if not exists blocks (
  blocker_id text not null,
  blocked_id text not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create index if not exists blocks_blocked_idx on blocks (blocked_id);

create table if not exists reports (
  id text primary key,
  reporter_id text not null,
  target_user_id text,
  target_chat_id text,
  target_message_id text,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists reports_status_idx on reports (status, created_at);

create table if not exists contacts (
  owner_id text not null,
  contact_id text not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, contact_id)
);

create table if not exists calls (
  id text primary key,
  chat_id text not null,
  caller_id text not null,
  callee_id text not null,
  kind text not null,
  status text not null,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz
);

create index if not exists calls_callee_idx on calls (callee_id, status, created_at);
create index if not exists calls_caller_idx on calls (caller_id, status, created_at);

create table if not exists typing (
  chat_id text not null,
  user_id text not null,
  until_at timestamptz not null,
  primary key (chat_id, user_id)
);

create table if not exists system_settings (
  key text primary key,
  value text not null
);

insert into system_settings (key, value) values
  ('allow_signups', 'true'),
  ('max_upload_bytes', '2000000'),
  ('maintenance_message', '')
on conflict (key) do nothing;
