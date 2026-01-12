function formatIso(date: Date) {
  const y = date.getUTCFullYear().toString().padStart(4, "0");
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMonthStart(monthISO: string): Date {
  const parsed = new Date(`${monthISO}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1));
}

export function getMonthEndExclusive(monthISO: string): Date {
  const start = getMonthStart(monthISO);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
}

export function daysInMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

export function clampDueDayToMonth(dueDay: number, monthDate: Date): number {
  const lastDay = daysInMonth(monthDate);
  return Math.min(Math.max(dueDay, 1), lastDay);
}

export function buildCalendarGrid(monthISO: string) {
  const start = getMonthStart(monthISO);
  const endExclusive = getMonthEndExclusive(monthISO);
  const monthIndex = start.getUTCMonth();
  const year = start.getUTCFullYear();

  const startOffset = start.getUTCDay();
  const gridStart = new Date(start);
  gridStart.setUTCDate(gridStart.getUTCDate() - startOffset);

  const lastOfMonth = new Date(endExclusive);
  lastOfMonth.setUTCDate(lastOfMonth.getUTCDate() - 1);
  const endOffset = 6 - lastOfMonth.getUTCDay();
  const gridEndExclusive = new Date(endExclusive);
  gridEndExclusive.setUTCDate(gridEndExclusive.getUTCDate() + endOffset + 1);

  const weeks: { date: Date; inMonth: boolean; iso: string; day: number }[][] = [];
  let currentWeek: { date: Date; inMonth: boolean; iso: string; day: number }[] = [];
  for (let cursor = new Date(gridStart); cursor < gridEndExclusive; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const iso = formatIso(cursor);
    currentWeek.push({
      date: new Date(cursor),
      inMonth: cursor.getUTCFullYear() === year && cursor.getUTCMonth() === monthIndex,
      iso,
      day: cursor.getUTCDate(),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
