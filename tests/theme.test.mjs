import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/theme.js', import.meta.url), 'utf8');
const key = 'kubewarden-theme';

function browser({ stored = null, dark = false, blocked = false } = {}) {
  const listeners = new Map();
  const target = name => ({
    addEventListener(event, handler) { listeners.set(`${name}:${event}`, handler); },
  });
  const attributes = new Map();
  const icon = { setAttribute(name, value) { attributes.set(`icon:${name}`, value); } };
  const button = {
    ...target('button'), hidden: true,
    setAttribute(name, value) { attributes.set(name, value); },
    querySelector() { return icon; },
  };
  const system = { ...target('system'), matches: dark };
  const document = {
    ...target('document'), documentElement: { dataset: {} },
    getElementById() { return ready ? button : null; },
  };
  let ready = false;
  let value = stored;
  const localStorage = {
    getItem() { if (blocked) throw Error('Storage blocked'); return value; },
    setItem(_, next) { if (blocked) throw Error('Storage blocked'); value = next; },
  };
  vm.runInNewContext(source, { document, window: target('window'), localStorage, matchMedia: () => system });
  const emit = (name, event, data = {}) => listeners.get(`${name}:${event}`)?.(data);
  return {
    button, attributes, document,
    theme: () => document.documentElement.dataset.theme,
    stored: () => value,
    ready() { ready = true; emit('document', 'DOMContentLoaded'); },
    click() { emit('button', 'click'); },
    system(dark) { system.matches = dark; emit('system', 'change'); },
    external(next, eventKey = key) { value = next; emit('window', 'storage', { key: eventKey, newValue: next }); },
    restore(next) { value = next; emit('window', 'pageshow'); },
  };
}

test('applies system preference before the header exists and follows system changes', () => {
  const page = browser({ dark: true });
  assert.equal(page.theme(), 'dark');
  page.ready();
  assert.equal(page.button.hidden, false);
  assert.equal(page.attributes.get('aria-label'), 'Switch to light theme');
  assert.equal(page.attributes.get('icon:href'), '#icon-sun');
  page.system(false);
  assert.equal(page.theme(), 'light');
  assert.equal(page.button.title, 'Switch to dark theme');
  assert.equal(page.attributes.get('icon:href'), '#icon-moon');
});

test('explicit choice overrides the system and persists across page loads', () => {
  const page = browser({ stored: 'light', dark: true });
  assert.equal(page.theme(), 'light');
  page.ready();
  page.click();
  assert.equal(page.stored(), 'dark');
  page.system(false);
  assert.equal(page.theme(), 'dark');
  assert.equal(browser({ stored: page.stored(), dark: false }).theme(), 'dark');
});

test('ignores invalid stored values and still works with blocked storage', () => {
  assert.equal(browser({ stored: 'invalid', dark: true }).theme(), 'dark');
  const page = browser({ blocked: true, dark: true });
  page.ready();
  page.click();
  page.restore(null);
  page.system(true);
  assert.equal(page.theme(), 'light');
});

test('syncs other tabs and returns to system preference when storage is cleared', () => {
  const page = browser({ dark: true });
  page.ready();
  page.external('light');
  assert.equal(page.theme(), 'light');
  page.external(null, null);
  assert.equal(page.theme(), 'dark');
  page.external('light', 'unrelated-key');
  assert.equal(page.theme(), 'dark');
});

test('refreshes preference when a page returns from the back/forward cache', () => {
  const page = browser({ stored: 'light' });
  page.ready();
  page.restore('dark');
  assert.equal(page.theme(), 'dark');
  assert.equal(page.button.title, 'Switch to light theme');
});
