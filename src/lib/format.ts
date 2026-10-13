import type { Locale } from "@/lib/chat-types";
import type { CopyKey } from "@/lib/prefs";

export function formatClock(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDay(iso: string | null, locale: Locale, t: (k: CopyKey) => string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return t("today");
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return t("yesterday");
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatChatTime(iso: string | null, locale: Locale, t: (k: CopyKey) => string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatClock(iso, locale);
  return formatDay(iso, locale, t);
}

export function formatLastSeen(iso: string | null, online: boolean, locale: Locale, t: (k: CopyKey) => string) {
  if (online) return t("online");
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${t("lastSeen")} ${t("justNow")}`;
  return `${t("lastSeen")} ${formatChatTime(iso, locale, t)} ${formatClock(iso, locale)}`;
}

export function bytesLabel(size: number | null): string {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
