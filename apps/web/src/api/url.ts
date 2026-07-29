/**
 * Absolute API prefix for Capacitor / cross-origin clients.
 * Leave unset for same-origin PWA (relative `/api/...`).
 * Example: VITE_API_BASE=https://your-app.up.railway.app
 */
export function apiUrl(path: string): string {
  const raw = import.meta.env.VITE_API_BASE as string | undefined;
  const base = (raw ?? "").trim().replace(/\/$/, "");
  if (!path.startsWith("/")) return base ? `${base}/${path}` : `/${path}`;
  return `${base}${path}`;
}
