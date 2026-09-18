import test from 'node:test';
import assert from 'node:assert/strict';
import { upcomingEvents, safeEventURL } from '../assets/js/calendar-events.mjs';

const wrap = (...events) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join('\r\n');
const event = (...lines) => ['BEGIN:VEVENT', ...lines, 'END:VEVENT'].join('\r\n');
const zone = `BEGIN:VTIMEZONE
TZID:Europe/Berlin
BEGIN:DAYLIGHT
DTSTART:19810329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
END:DAYLIGHT
BEGIN:STANDARD
DTSTART:19961027T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
END:STANDARD
END:VTIMEZONE`.replaceAll('\n', '\r\n');

test('CNCF monthly rule retains Berlin wall time across daylight-saving changes', () => {
  const source = wrap(zone, event('UID:monthly', 'DTSTART;TZID=Europe/Berlin:20260806T170000',
    'DTEND;TZID=Europe/Berlin:20260806T180000', 'RRULE:FREQ=MONTHLY;INTERVAL=1;WKST=SU;BYDAY=+1TH',
    'SUMMARY:Community meeting', 'URL;VALUE=TEXT:https://example.org/join'));
  const results = upcomingEvents(source, { now: new Date('2026-09-18T12:00:00Z') });
  assert.deepEqual(results.map(e => e.start.toISOString()), ['2026-10-01T15:00:00.000Z', '2026-11-05T16:00:00.000Z', '2026-12-03T16:00:00.000Z']);
  assert.ok(results.every(e => e.end - e.start === 3600000));
  const spring = upcomingEvents(source, { now: new Date('2027-03-01T00:00:00Z') });
  assert.equal(spring[0].start.toISOString(), '2027-03-04T16:00:00.000Z');
  assert.equal(spring[1].start.toISOString(), '2027-04-01T15:00:00.000Z');
});

test('exclusions, cancellations, and moved occurrences replace original dates', () => {
  const source = wrap(
    event('UID:weekly', 'DTSTART:20261001T150000Z', 'DTEND:20261001T160000Z', 'RRULE:FREQ=WEEKLY;COUNT=5', 'EXDATE:20261008T150000Z', 'SUMMARY:Meeting'),
    event('UID:weekly', 'RECURRENCE-ID:20261015T150000Z', 'STATUS:CANCELLED'),
    event('UID:weekly', 'RECURRENCE-ID:20261022T150000Z', 'DTSTART:20261020T150000Z', 'DTEND:20261020T160000Z', 'SUMMARY:Moved meeting'),
  );
  const results = upcomingEvents(source, { now: new Date('2026-10-02T00:00:00Z') });
  assert.deepEqual(results.map(e => e.start.toISOString()), ['2026-10-20T15:00:00.000Z', '2026-10-29T15:00:00.000Z']);
  assert.equal(results[0].title, 'Moved meeting');
});

test('moved occurrences outside the expansion window can move into it', () => {
  const source = wrap(
    event('UID:moved', 'DTSTART:20200101T120000Z', 'DURATION:PT1H', 'RRULE:FREQ=YEARLY', 'SUMMARY:Yearly'),
    event('UID:moved', 'RECURRENCE-ID:20300101T120000Z', 'DTSTART:20261002T120000Z', 'DURATION:PT1H'),
  );
  const results = upcomingEvents(source, { now: new Date('2026-10-01T00:00:00Z') });
  assert.equal(results[0].start.toISOString(), '2026-10-02T12:00:00.000Z');
});

test('handles folded URLs, escaped titles, all-day dates, and sorting', () => {
  const source = wrap(
    event('UID:all-day', 'DTSTART;VALUE=DATE:20261003', 'DTEND;VALUE=DATE:20261005', 'SUMMARY:Community\\, gathering'),
    event('UID:timed', 'DTSTART:20261002T150000Z', 'DURATION:PT1H', 'URL:https://example.org/\r\n join'),
  );
  const results = upcomingEvents(source, { now: new Date('2026-10-01T00:00:00Z') });
  assert.equal(results[0].url, 'https://example.org/join');
  assert.equal(results[1].allDay, true);
  assert.equal(results[1].title, 'Community, gathering');
  assert.equal(results[1].start.getDate(), 3);
  assert.equal(results[1].end.getDate(), 5);
});

test('omits ended and cancelled meetings, retains ongoing meetings, prefers latest sequence', () => {
  const source = wrap(
    event('UID:ended', 'DTSTART:20261001T100000Z', 'DTEND:20261001T110000Z'),
    event('UID:ongoing', 'DTSTART:20261001T120000Z', 'DTEND:20261001T130000Z'),
    event('UID:cancelled', 'DTSTART:20261002T100000Z', 'STATUS:CANCELLED'),
    event('UID:duplicate', 'DTSTART:20261003T100000Z', 'DURATION:PT1H', 'SEQUENCE:2', 'SUMMARY:New'),
    event('UID:duplicate', 'DTSTART:20261003T090000Z', 'DURATION:PT1H', 'SEQUENCE:1', 'SUMMARY:Old'),
  );
  const results = upcomingEvents(source, { now: new Date('2026-10-01T12:30:00Z') });
  assert.deepEqual(results.map(e => e.id), ['ongoing', 'duplicate']);
  assert.equal(results[1].title, 'New');
});

test('rejects malformed data and unsafe links', () => {
  assert.throws(() => upcomingEvents('not a calendar'));
  assert.equal(safeEventURL('javascript:alert(1)'), null);
  assert.equal(safeEventURL('data:text/html,hello'), null);
  assert.equal(safeEventURL('https://example.org/meeting'), 'https://example.org/meeting');
  assert.deepEqual(upcomingEvents(wrap()), []);
  assert.throws(() => upcomingEvents(wrap(event('UID:unknown', 'DTSTART;TZID=Unknown/Zone:20261001T150000'))), /Unknown event time zone/);
});

test('honors UNTIL and additional recurrence dates', () => {
  const source = wrap(event('UID:dates', 'DTSTART:20261001T150000Z', 'DURATION:PT1H',
    'RRULE:FREQ=DAILY;UNTIL=20261002T150000Z', 'RDATE:20261005T150000Z'));
  const results = upcomingEvents(source, { now: new Date('2026-10-01T00:00:00Z'), limit: 10 });
  assert.deepEqual(results.map(e => e.start.toISOString()), ['2026-10-01T15:00:00.000Z', '2026-10-02T15:00:00.000Z', '2026-10-05T15:00:00.000Z']);
});

test('a cancelled series does not revive its detached occurrences', () => {
  const source = wrap(
    event('UID:series', 'DTSTART:20261001T150000Z', 'RRULE:FREQ=WEEKLY', 'STATUS:CANCELLED'),
    event('UID:series', 'RECURRENCE-ID:20261008T150000Z', 'DTSTART:20261008T170000Z', 'DURATION:PT1H'),
  );
  assert.deepEqual(upcomingEvents(source, { now: new Date('2026-10-01T00:00:00Z') }), []);
});

test('THISANDFUTURE reschedules subsequent occurrences', () => {
  const source = wrap(
    event('UID:range', 'DTSTART:20261001T150000Z', 'DURATION:PT1H', 'RRULE:FREQ=WEEKLY;COUNT=3'),
    event('UID:range', 'RECURRENCE-ID;RANGE=THISANDFUTURE:20261008T150000Z', 'DTSTART:20261008T170000Z', 'DURATION:PT1H'),
  );
  const results = upcomingEvents(source, { now: new Date('2026-10-01T00:00:00Z') });
  assert.deepEqual(results.map(e => e.start.toISOString()), ['2026-10-01T15:00:00.000Z', '2026-10-08T17:00:00.000Z', '2026-10-15T17:00:00.000Z']);
});
