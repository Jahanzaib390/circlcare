export const BOOKING_BLOCK_MINUTES = 120;

export function hasAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

export function parseClockTime(text: string): { hour: number; minute: number } | undefined {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b|\b(\d{1,2})\s*baje\b/);
  if (!match) return undefined;

  let hour = Number(match[1] ?? match[4]);
  const minute = Number(match[2] ?? '0');
  const suffix = match[3];

  if (suffix === 'pm' && hour < 12) hour += 12;
  if (suffix === 'am' && hour === 12) hour = 0;
  if (!suffix && hour >= 1 && hour <= 7 && hasAny(text, ['shaam', 'sham', 'evening', 'raat'])) {
    hour += 12;
  }

  if (hour > 23 || minute > 59) return undefined;
  return { hour, minute };
}

export function resolvePreferredStartMinutes(timePreference: string): number | undefined {
  const preferred = timePreference.toLowerCase();
  const explicitClock = parseClockTime(preferred);

  if (explicitClock) return explicitClock.hour * 60 + explicitClock.minute;
  if (hasAny(preferred, ['early morning', 'subah jaldi', 'jaldi subah'])) return 8 * 60;
  if (hasAny(preferred, ['morning', 'subah', 'savera'])) return 10 * 60;
  if (hasAny(preferred, ['late afternoon', 'dopahar baad', 'dopehr baad'])) return 15 * 60;
  if (hasAny(preferred, ['afternoon', 'dopahar', 'dopehr', 'dupehar'])) return 13 * 60;
  if (hasAny(preferred, ['evening', 'shaam', 'sham'])) return 17 * 60;
  if (hasAny(preferred, ['night', 'raat'])) return 20 * 60;

  return undefined;
}

export function reconcileScheduledDatetimeWithPreference(
  scheduledDatetime: string,
  timePreference: string
): string {
  const preferredStart = resolvePreferredStartMinutes(timePreference);
  if (preferredStart == null) return scheduledDatetime;

  const match = scheduledDatetime.match(/^(\d{4}-\d{2}-\d{2}T)(\d{2}):(\d{2})(.*)$/);
  if (!match) return scheduledDatetime;

  const hour = Math.floor(preferredStart / 60).toString().padStart(2, '0');
  const minute = (preferredStart % 60).toString().padStart(2, '0');
  return `${match[1]}${hour}:${minute}${match[4]}`;
}
