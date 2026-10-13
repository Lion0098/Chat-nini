export type Privacy = "everyone" | "contacts" | "nobody";
export type Locale = "fa" | "en";
export type Role = "user" | "admin";

export type Me = {
  userId: string;
  email: string;
  username: string | null;
  displayName: string;
  about: string;
  phone: string | null;
  role: Role;
  locale: Locale;
  privacyLastSeen: Privacy;
  privacyPhoto: Privacy;
  privacyAbout: Privacy;
  privacyStatus: Privacy;
  readReceipts: boolean;
  suspended: boolean;
  hasAvatar: boolean;
  avatarRev: string;
  lastSeenAt: string | null;
  createdAt: string;
};

export type PublicUser = {
  userId: string;
  username: string | null;
  displayName: string;
  about: string | null;
  phone: string | null;
  hasAvatar: boolean;
  avatarRev: string;
  online: boolean;
  lastSeenAt: string | null;
  presenceHidden: boolean;
  blockedByMe: boolean;
  blockedMe: boolean;
  isContact: boolean;
};

export type LastMessage = {
  kind: string;
  body: string | null;
  senderId: string;
  senderName: string;
  createdAt: string;
  deleted: boolean;
  mine: boolean;
};

export type ChatListItem = {
  id: string;
  kind: "direct" | "group";
  title: string;
  about: string;
  hasAvatar: boolean;
  avatarRev: string;
  avatarUserId: string | null;
  peerId: string | null;
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  unread: number;
  updatedAt: string;
  last: LastMessage | null;
  online: boolean;
  lastSeenAt: string | null;
  presenceHidden: boolean;
};

export type ThreadMember = {
  userId: string;
  displayName: string;
  username: string | null;
  role: string;
  hasAvatar: boolean;
  avatarRev: string;
  online: boolean;
  lastSeenAt: string | null;
  presenceHidden: boolean;
  lastReadAt: string | null;
};

export type ReplySnap = {
  id: string;
  senderName: string;
  kind: string;
  body: string | null;
  deleted: boolean;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  kind: string;
  body: string | null;
  fileName: string | null;
  fileMime: string | null;
  fileSize: number | null;
  reply: ReplySnap | null;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  mine: boolean;
};

export type Thread = {
  chat: {
    id: string;
    kind: "direct" | "group";
    title: string;
    about: string;
    myRole: string;
    muted: boolean;
    pinned: boolean;
    archived: boolean;
    hasAvatar: boolean;
    avatarRev: string;
    peerId: string | null;
  };
  members: ThreadMember[];
  messages: ChatMessage[];
  typing: string[];
  hasMore: boolean;
};

export type StatusItem = {
  id: string;
  userId: string;
  displayName: string;
  username: string | null;
  hasAvatar: boolean;
  avatarRev: string;
  kind: string;
  caption: string | null;
  bg: string | null;
  createdAt: string;
  viewed: boolean;
  mine: boolean;
};

export type LiveCall = {
  id: string;
  chatId: string;
  callerId: string;
  calleeId: string;
  kind: "audio" | "video";
  status: string;
  peerId: string;
  peerName: string;
  peerHasAvatar: boolean;
  peerAvatarRev: string;
  createdAt: string;
};

export type AdminUser = {
  userId: string;
  email: string;
  username: string | null;
  displayName: string;
  phone: string | null;
  role: Role;
  suspended: boolean;
  about: string;
  createdAt: string;
  lastSeenAt: string | null;
};

export type AdminGroup = {
  id: string;
  title: string;
  about: string;
  members: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminReport = {
  id: string;
  reporterId: string;
  reporterName: string;
  targetUserId: string | null;
  targetName: string | null;
  targetChatId: string | null;
  targetMessageId: string | null;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
