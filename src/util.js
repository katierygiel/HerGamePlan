import { dayKey } from "./data/seed";

export const initialsOf = (name = "") =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "HG";

export const firstOf = (name = "") => name.split(/\s+/)[0] || "";

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function timeAgo(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} week${w === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}

export function shortTime(ts) {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** consecutive days of activity, counting back from today (or yesterday) */
export function streakOf(activity = []) {
  const set = new Set(activity);
  let t = Date.now();
  if (!set.has(dayKey(t))) t -= 864e5;
  let n = 0;
  while (set.has(dayKey(t))) { n++; t -= 864e5; }
  return n;
}

/** how well a job lines up with the user's interests, 30–99 */
export function matchPct(job, interests = []) {
  if (!interests.length || !job.tags.length) return null;
  const lower = interests.map((i) => i.toLowerCase());
  const hits = job.tags.filter((t) => lower.includes(t.toLowerCase())).length;
  return Math.min(99, Math.round(30 + 69 * (hits / job.tags.length)));
}

export async function sha256(text) {
  try {
    if (globalThis.crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) { /* fall through */ }
  return `plain:${btoa(unescape(encodeURIComponent(text)))}`; // demo-only fallback
}

/** center-crop + downscale an uploaded image so it fits comfortably in storage */
export function resizeImage(file, size = 320) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Could not read file"));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a readable image"));
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const s = Math.min(img.width, img.height);
        c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

export const isEmail = (s = "") => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
export const plural = (n, a, b = `${a}s`) => `${n} ${n === 1 ? a : b}`;

/** how well a mentor's expertise lines up with the user's interests, 40–99 */
export function mentorMatch(m, interests = []) {
  if (!interests.length || !m.expertise?.length) return null;
  const lower = interests.map((i) => i.toLowerCase());
  const hits = m.expertise.filter((e) => lower.includes(e.toLowerCase())).length;
  return Math.min(99, Math.round(40 + 59 * Math.min(1, hits / 2)));
}
