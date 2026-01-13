export function isoToYMD(iso?: string | null): string {
  return typeof iso === "string" && iso.length >= 10 ? iso.slice(0, 10) : "";
}

export function ymdToPretty(ymd: string): string {
  if (typeof ymd !== "string" || ymd.length !== 10) {
    return ymd;
  }

  const [yearStr, monthStr, dayStr] = ymd.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day) {
    return ymd;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = monthNames[month - 1] ?? monthStr;

  return `${monthName} ${day.toString().padStart(2, "0")}, ${yearStr}`;
}
