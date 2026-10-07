import type { IconName } from "../reusable/ui/Icon.vue";

export function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1000 * 1000) return `${Math.round(bytes / 1000)} KB`;
  return `${(bytes / 1000 / 1000).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" });
}

/** The images a browser can show from a view link; the server serves only these. */
const viewable = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export function isViewable(mediaType: string): boolean {
  return viewable.has(mediaType);
}

/** The icon and colors for a file of this media type. */
export function lookOf(mediaType: string): { icon: IconName; tint: string; ink: string } {
  if (mediaType.startsWith("image/")) return { icon: "image", tint: "#e6f3f1", ink: "#23695f" };
  if (mediaType === "application/pdf") return { icon: "file", tint: "#fdeeee", ink: "#a33a3a" };
  if (mediaType.startsWith("text/") || mediaType.includes("csv")) return { icon: "text", tint: "#e8f4ec", ink: "#2b6a43" };
  return { icon: "file", tint: "#eef0f6", ink: "#4a4f6a" };
}
