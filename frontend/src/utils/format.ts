export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function isExpired(poll: { expiresAt?: string | null; isActive: boolean }): boolean {
  if (!poll.expiresAt) return false;
  return new Date(poll.expiresAt).getTime() < Date.now();
}

export function shareUrl(pollId: string): string {
  return `${window.location.origin}/p/${pollId}`;
}
