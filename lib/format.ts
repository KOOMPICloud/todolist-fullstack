/**
 * Dates, times and money the way people in Cambodia read them: Phnom Penh
 * time, and dollars or riel with their sign. Use these on every screen
 * instead of showing raw values ("2026-11-10 09:41:00", "12.5").
 */
export const TIME_ZONE = 'Asia/Phnom_Penh';

/** A date from the database ("2026-11-10 09:41:00" is UTC, as SQLite's datetime('now') writes it) or an ISO string. */
export function toDate(value: string | number | Date): Date {
  if (value instanceof Date || typeof value === 'number') return new Date(value);
  return new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(value) ? `${value.replace(' ', 'T')}Z` : value);
}

/** "10 Nov", or "Today" / "Yesterday" / "Tomorrow" when it is. */
export function formatDay(value: string | number | Date, locale = 'en-GB'): string {
  const date = toDate(value);
  const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(d);
  const today = new Date();
  const offset = (days: number) => day(new Date(today.getTime() + days * 86_400_000));
  const that = day(date);
  if (that === offset(0)) return 'Today';
  if (that === offset(-1)) return 'Yesterday';
  if (that === offset(1)) return 'Tomorrow';
  return new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, day: 'numeric', month: 'short' }).format(date);
}

/** "2:30 pm" (or "14:30" with locale en-GB-u-hc-h23). */
export function formatTime(value: string | number | Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' }).format(toDate(value)).toLowerCase();
}

/** "$12.50" or "12,000 ៛". */
export function formatMoney(amount: number | string, currency: 'USD' | 'KHR' = 'USD'): string {
  const n = Number(amount);
  return currency === 'KHR' ? `${Math.round(n).toLocaleString('en-US')} ៛` : `$${n.toFixed(2)}`;
}
