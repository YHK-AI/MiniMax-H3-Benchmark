import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

let i18n = {};
try {
  i18n = await import('../i18n.js');
} catch {
  i18n = {};
}

test('defaults to English and normalizes only supported locales', () => {
  assert.equal(i18n.DEFAULT_LOCALE, 'en');
  assert.equal(i18n.normalizeLocale?.(undefined), 'en');
  assert.equal(i18n.normalizeLocale?.('fr'), 'en');
  assert.equal(i18n.normalizeLocale?.('zh'), 'zh-CN');
  assert.equal(i18n.normalizeLocale?.('zh-CN'), 'zh-CN');
});

test('reads and writes an explicit locale without trusting corrupted storage', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.equal(i18n.readStoredLocale?.(storage), 'en');
  assert.equal(i18n.writeStoredLocale?.(storage, 'zh-CN'), true);
  assert.equal(i18n.readStoredLocale?.(storage), 'zh-CN');
  values.set('minimax-h3-locale', 'broken');
  assert.equal(i18n.readStoredLocale?.(storage), 'en');
});

test('storage exceptions fall back safely', () => {
  const storage = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
  };
  assert.equal(i18n.readStoredLocale?.(storage), 'en');
  assert.equal(i18n.writeStoredLocale?.(storage, 'zh-CN'), false);
});

test('English and Chinese catalogs have identical key sets', () => {
  assert.deepEqual(
    Object.keys(i18n.catalogs?.en ?? {}).sort(),
    Object.keys(i18n.catalogs?.['zh-CN'] ?? {}).sort(),
  );
  assert.ok(Object.keys(i18n.catalogs?.en ?? {}).length >= 150);
});

test('every translation marker in the page resolves in both catalogs', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-(?:aria-label|alt|title|data-label))?="([^"]+)"/g)]
    .map((match) => match[1]);
  assert.ok(keys.length >= 100);
  for (const key of keys) {
    assert.ok(key in i18n.catalogs.en, `missing English key: ${key}`);
    assert.ok(key in i18n.catalogs['zh-CN'], `missing Chinese key: ${key}`);
  }
});

test('translation interpolates parameters and falls back to English', () => {
  assert.equal(
    i18n.translate?.('en', 'compare.trackEnded', { side: 'A' }),
    'Track A reached its final frame; the other track continues.',
  );
  assert.equal(
    i18n.translate?.('zh-CN', 'compare.trackEnded', { side: 'A' }),
    '轨道 A 已到末帧，另一侧继续播放。',
  );
  assert.equal(i18n.translate?.('fr', 'language.english'), 'English');
});

test('locale controller applies stored locale and persists only explicit changes', () => {
  const values = new Map([['minimax-h3-locale', 'zh-CN']]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const applied = [];
  const document = {
    documentElement: { lang: 'en' },
    title: '',
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  const controller = i18n.createLocaleController?.({
    document,
    storage,
    apply: (_document, locale) => applied.push(locale),
  });
  assert.equal(controller?.getLocale(), 'zh-CN');
  assert.deepEqual(applied, ['zh-CN']);
  let notified = '';
  controller?.subscribe((locale) => { notified = locale; });
  controller?.setLocale('en');
  assert.equal(values.get('minimax-h3-locale'), 'en');
  assert.equal(notified, 'en');
});
