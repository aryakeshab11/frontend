export function getClientTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function formatDateForUser(isoDate, timeZone, locale = 'en-US') {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function getGreetingFromTimeZone(timeZone) {
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone,
    }).format(now),
  );

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getGreetingForUser(userTimeZone) {
  const zone = userTimeZone || getClientTimezone();
  return getGreetingFromTimeZone(zone);
}

export function getCurrentTimeForUser(userTimeZone, locale = 'en-US') {
  const zone = userTimeZone || getClientTimezone();
  return new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date());
}
