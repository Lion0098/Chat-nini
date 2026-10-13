export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const i = raw.indexOf(",");
      resolve(i >= 0 ? raw.slice(i + 1) : raw);
    };
    reader.onerror = () => reject(reader.error ?? new Error("read"));
    reader.readAsDataURL(file);
  });
}

export async function resizeImage(
  file: Blob,
  max: number,
  quality = 0.82,
): Promise<{ mime: string; data: string }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("blob");
  return { mime: "image/jpeg", data: await fileToBase64(blob) };
}

export function downloadBase64(name: string, mime: string, data: string) {
  const a = document.createElement("a");
  a.href = `data:${mime};base64,${data}`;
  a.download = name || "file";
  a.click();
}

export const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤔", "😴",
  "😢", "😭", "😡", "🤯", "🙌", "👏", "🙏", "👍", "👎", "🔥",
  "✨", "🎉", "❤️", "💚", "💙", "⭐", "🌟", "☀️", "🌙", "⚡",
  "🌹", "🍀", "☕", "🍕", "🎂", "🎁", "🏆", "⚽", "🎵", "📷",
  "💬", "📞", "✅", "❌", "💯", "🤝", "👀", "💪",
];
