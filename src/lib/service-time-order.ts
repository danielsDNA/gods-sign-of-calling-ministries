export interface ScheduledService {
  id?: number;
  day: string;
  time: string;
  label: string;
  location: string;
}

const WEEKDAYS = new Map([
  ['sunday', 0],
  ['monday', 1],
  ['tuesday', 2],
  ['wednesday', 3],
  ['thursday', 4],
  ['friday', 5],
  ['saturday', 6],
]);

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = value.match(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
  if (!match) return null;
  const hourValue = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (hourValue < 1 || hourValue > 12 || minute > 59) return null;
  const hour = (hourValue % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return { hour, minute };
}

function nextOccurrence(service: ScheduledService, now: Date): Date | null {
  const monthly = service.day.match(/^\s*(\d+)(?:st|nd|rd|th)\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i);
  const weeklyDay = monthly?.[2] ?? service.day.match(/\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i)?.[1];
  if (!weeklyDay) return null;
  const weekday = WEEKDAYS.get(weeklyDay.toLowerCase());
  const start = parseTime(service.time);
  if (weekday === undefined || !start) return null;

  const occurrence = new Date(now);
  occurrence.setHours(start.hour, start.minute, 0, 0);

  if (monthly) {
    const ordinal = Number(monthly[1]);
    if (ordinal < 1 || ordinal > 5) return null;
    let monthOffset = 0;
    while (monthOffset < 13) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const firstDayOffset = (weekday - monthStart.getDay() + 7) % 7;
      const dayOfMonth = 1 + firstDayOffset + (ordinal - 1) * 7;
      const candidate = new Date(monthStart.getFullYear(), monthStart.getMonth(), dayOfMonth, start.hour, start.minute);
      if (candidate > now) return candidate;
      monthOffset += 1;
    }
    return null;
  }

  const dayOffset = (weekday - now.getDay() + 7) % 7;
  occurrence.setDate(now.getDate() + dayOffset);
  if (occurrence <= now) occurrence.setDate(occurrence.getDate() + 7);
  return occurrence;
}

export function orderServicesByNextOccurrence<T extends ScheduledService>(services: T[], now = new Date()): T[] {
  return services
    .map((service, index) => ({ service, index, next: nextOccurrence(service, now)?.getTime() ?? Number.POSITIVE_INFINITY }))
    .sort((left, right) => left.next - right.next || left.index - right.index)
    .map(({ service }) => service);
}
