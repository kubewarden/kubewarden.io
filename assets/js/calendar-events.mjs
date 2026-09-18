import ICAL from './vendor/ical-2.2.1.mjs';

export function safeEventURL(value) {
  try {
    const url = new URL(String(value));
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch (_) {
    return null;
  }
}

const cancelled = event => String(event.component.getFirstPropertyValue('status')).toUpperCase() === 'CANCELLED';

// Expand from DTSTART, not from today: changing the iterator's start can change
// COUNT and monthly rules. Bound the work rather than silently truncate a series.
export function upcomingEvents(source, { now = new Date(), limit = 3, months = 12 } = {}) {
  const calendar = new ICAL.Component(ICAL.parse(source));
  if (calendar.name !== 'vcalendar') throw new Error('Expected an iCalendar feed');
  ICAL.TimezoneService.reset();
  for (const zone of calendar.getAllSubcomponents('vtimezone')) {
    ICAL.TimezoneService.register(new ICAL.Timezone(zone));
  }
  const until = new Date(now);
  until.setUTCMonth(until.getUTCMonth() + months);
  const groups = new Map();
  for (const component of calendar.getAllSubcomponents('vevent')) {
    for (const property of component.getAllProperties()) {
      const tzid = property.getParameter('tzid');
      if (tzid && !ICAL.TimezoneService.has(tzid)) throw new Error('Unknown event time zone');
    }
    const uid = component.getFirstPropertyValue('uid');
    if (!uid) throw new Error('Event has no UID');
    if (!groups.has(uid)) groups.set(uid, new Map());
    const recurrence = component.getFirstPropertyValue('recurrence-id')?.toString() || '';
    const previous = groups.get(uid).get(recurrence);
    const sequence = Number(component.getFirstPropertyValue('sequence') || 0);
    if (!previous || sequence >= Number(previous.getFirstPropertyValue('sequence') || 0)) {
      groups.get(uid).set(recurrence, component);
    }
  }

  const results = new Map();
  const add = (event, start, end, id, fallback) => {
    if (cancelled(event)) return;
    if (!start || !end) throw new Error('Event has no dates');
    if (!start.isDate && start.zone.tzid !== 'floating' && start.zone.tzid !== 'UTC' &&
        !ICAL.TimezoneService.has(start.zone.tzid)) throw new Error('Unknown event time zone');
    const startDate = start.toJSDate();
    const endDate = end.toJSDate();
    if (!Number.isFinite(+startDate) || !Number.isFinite(+endDate) || endDate < startDate) {
      throw new Error('Invalid event dates');
    }
    if (endDate <= now || startDate >= until) return;
    results.set(id, {
      id,
      title: event.summary || fallback?.summary || 'Community meeting',
      start: startDate,
      end: endDate,
      allDay: start.isDate,
      url: safeEventURL(event.component.getFirstPropertyValue('url')) || safeEventURL(event.location) ||
        safeEventURL(fallback?.component.getFirstPropertyValue('url')) || safeEventURL(fallback?.location),
    });
  };

  let iterations = 0;
  for (const [uid, components] of groups) {
    const masterComponent = components.get('');
    const exceptions = [...components.entries()].filter(([id]) => id).map(([, c]) => new ICAL.Event(c, { exceptions: [] }));
    const master = masterComponent && new ICAL.Event(masterComponent, { exceptions, strictExceptions: true });
    if (master && !cancelled(master)) {
      if (!master.startDate) throw new Error('Event has no start date');
      if (master.isRecurring()) {
        const iterator = master.iterator();
        let occurrence;
        while ((occurrence = iterator.next())) {
          if (++iterations > 20000) throw new Error('Calendar recurrence limit exceeded');
          const exception = exceptions.find(e => e.recurrenceId.compare(occurrence) === 0);
          if (exception && cancelled(exception)) continue;
          const details = master.getOccurrenceDetails(occurrence);
          add(details.item, details.startDate, details.endDate, `${uid}/${occurrence}`, master);
          // Explicit exceptions are also handled below, including moves into the
          // window from outside it. Range exceptions use the adjusted start date.
          if (occurrence.toJSDate() >= until && details.startDate.toJSDate() >= until) break;
        }
      } else {
        add(master, master.startDate, master.endDate, uid);
      }
    }
    // A moved occurrence can now precede its original recurrence date. Include
    // detached occurrences too, but never revive an entirely cancelled series.
    if (!master || !cancelled(master)) {
      for (const event of exceptions) {
        if (cancelled(event)) continue;
        add(event, event.startDate, event.endDate, `${uid}/${event.recurrenceId}`, master);
      }
    }
  }
  return [...results.values()].sort((a, b) => a.start - b.start || a.title.localeCompare(b.title)).slice(0, limit);
}
