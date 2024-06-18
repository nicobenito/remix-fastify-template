import { DateTime } from 'luxon';

import { env } from '~/env.server';

export function todayAsString(format = 'D'): string {
  return DateTime.now().setLocale(env.LOCALE).toFormat(format);
}

export function todayTimeAsString(timezone: string): string {
  return DateTime.now().setLocale(env.LOCALE).setZone(timezone).toFormat('D T ZZZZ');
}
