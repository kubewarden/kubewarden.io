import { upcomingEvents } from './calendar-events.mjs';

const panel = document.getElementById('community-events');
if (panel) {
  const status = panel.querySelector('[role="status"]');
  const list = panel.querySelector('.events-list');
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  let source;
  const render = () => {
    const events = upcomingEvents(source);
    const fragment = document.createDocumentFragment();
    for (const event of events) {
      const card = element('li', 'event-card');
      const date = element('time', 'event-date', dateFormat.format(event.start));
      date.dateTime = event.allDay
        ? `${event.start.getFullYear()}-${String(event.start.getMonth() + 1).padStart(2, '0')}-${String(event.start.getDate()).padStart(2, '0')}`
        : event.start.toISOString();
      card.append(date, element('h4', 'event-title', event.title));
      const sameDay = event.start.toDateString() === event.end.toDateString();
      const endLabel = sameDay ? timeFormat.format(event.end) : `${dateFormat.format(event.end)}, ${timeFormat.format(event.end)}`;
      let schedule = `${timeFormat.format(event.start)} – ${endLabel}`;
      if (event.allDay) {
        const lastDay = new Date(event.end);
        lastDay.setDate(lastDay.getDate() - 1); // DTEND is exclusive for all-day events.
        schedule = lastDay > event.start ? `All day, through ${dateFormat.format(lastDay)}` : 'All day';
      }
      card.append(element('p', 'event-time', schedule));
      const link = element('a', 'arrow-link', event.url ? 'Join meeting' : 'View calendar');
      link.href = event.url || panel.dataset.calendar;
      link.append(element('span', 'sr-only', `: ${event.title}, ${dateFormat.format(event.start)}`));
      card.append(link);
      fragment.append(card);
    }
    list.replaceChildren(fragment);
    list.hidden = !events.length;
    status.textContent = events.length ? '' : 'No upcoming meetings in the next 12 months. Check the full calendar for updates.';
  };
  const fail = () => {
    list.hidden = true;
    status.textContent = 'We could not load upcoming meetings. Open the full calendar or subscribe using the links above.';
  };
  document.getElementById('events-timezone').textContent = `Times shown in your local time zone${zone ? ` (${zone.replaceAll('_', ' ')})` : ''}.`;
  status.textContent = 'Loading upcoming meetings…';
  panel.setAttribute('aria-busy', 'true');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  fetch(panel.dataset.feed, { signal: controller.signal, credentials: 'omit' })
    .then(response => {
      if (!response.ok) throw new Error('Calendar request failed');
      return response.text();
    })
    .then(text => { source = text; render(); })
    .catch(fail)
    .finally(() => { clearTimeout(timeout); panel.setAttribute('aria-busy', 'false'); });
  // Hide completed meetings when a reader returns to an already-open tab.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && source) {
      try { render(); } catch (_) { fail(); }
    }
  });
}
