export function normalizeDateToMiddayUTC(dateStr: string): string {
  const trimmed = dateStr.trim();
  const normalized = new Date(`${trimmed}T12:00:00.000Z`);

  if (!trimmed || Number.isNaN(normalized.getTime())) {
    throw new Error("Invalid date string");
  }

  return normalized.toISOString();
}

export function formatISOToDateInput(iso: string): string {
  if (typeof iso !== "string" || iso.length < 10) {
    return "";
  }

  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getUTCFullYear().toString().padStart(4, "0");
  const month = (parsed.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = parsed.getUTCDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}
