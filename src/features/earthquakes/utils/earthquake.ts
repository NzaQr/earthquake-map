export function formatTime(ms: number): { absolute: string; relative: string } {
  const date = new Date(ms);
  const absolute = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const diffMs = Date.now() - ms;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  let relative: string;
  if (diffMins < 60) relative = `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  else if (diffHours < 24) relative = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  else relative = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return { absolute, relative };
}
