import test from 'node:test';
import assert from 'node:assert/strict';

let compare = {};
try {
  compare = await import('../app.js');
} catch {
  compare = {};
}

test('swaps the pair when a side selects the active opposite video', () => {
  assert.equal(typeof compare.selectPair, 'function');
  assert.deepEqual(
    compare.selectPair({ a: 'bshort4', b: 'c4' }, 'a', 'c4'),
    { a: 'c4', b: 'bshort4' },
  );
});

test('selects a different video without changing the opposite side', () => {
  assert.deepEqual(
    compare.selectPair({ a: 'bshort4', b: 'c4' }, 'b', 'final20'),
    { a: 'bshort4', b: 'final20' },
  );
});

test('preserves playback state while changing the selected pair', () => {
  const state = { a: 'bshort4', b: 'c4', mode: 'time', audio: 'a', playing: true };
  assert.deepEqual(
    compare.selectPair(state, 'a', 'c4'),
    { a: 'c4', b: 'bshort4', mode: 'time', audio: 'a', playing: true },
  );
});

test('maps master progress to each duration in progress mode', () => {
  const videos = [{ duration: 5, currentTime: 0 }, { duration: 10, currentTime: 0 }];
  compare.seekByMasterProgress(videos, 'progress', 0.5);
  assert.deepEqual(videos.map(({ currentTime }) => currentTime), [2.5, 5]);
});

test('maps master progress to shared seconds in time mode and clamps the short video', () => {
  const videos = [{ duration: 5, currentTime: 0 }, { duration: 10, currentTime: 0 }];
  compare.seekByMasterProgress(videos, 'time', 0.8);
  assert.deepEqual(videos.map(({ currentTime }) => currentTime), [5, 8]);
});

test('corrects relative drift only after the two-percent threshold', () => {
  const leader = { duration: 10, currentTime: 5 };
  const close = { duration: 20, currentTime: 9.8 };
  const far = { duration: 20, currentTime: 8 };
  compare.syncRelativeProgress(leader, close);
  compare.syncRelativeProgress(leader, far);
  assert.equal(close.currentTime, 9.8);
  assert.equal(far.currentTime, 10);
});

test('corrects absolute drift only after 0.20 seconds and clamps at duration', () => {
  const leader = { duration: 10, currentTime: 8 };
  const close = { duration: 10, currentTime: 7.9 };
  const short = { duration: 5, currentTime: 4 };
  compare.syncAbsoluteTime(leader, close);
  compare.syncAbsoluteTime(leader, short);
  assert.equal(close.currentTime, 7.9);
  assert.equal(short.currentTime, 5);
});

test('keeps at most one audio source unmuted', () => {
  const videos = [{ muted: true }, { muted: true }];
  compare.setAudioSource(videos, 'a');
  assert.deepEqual(videos.map(({ muted }) => muted), [false, true]);
  compare.setAudioSource(videos, 'b');
  assert.deepEqual(videos.map(({ muted }) => muted), [true, false]);
  compare.setAudioSource(videos, 'muted');
  assert.deepEqual(videos.map(({ muted }) => muted), [true, true]);
});

test('maps the selected pair to run-strip A and B assignment states', () => {
  assert.equal(typeof compare.syncRunStrip, 'function');
  assert.deepEqual(
    compare.syncRunStrip({ a: 'bshort4', b: 'c4' }, ['final20', 'c4', 'bshort4']),
    [
      { id: 'final20', a: false, b: false },
      { id: 'c4', a: false, b: true },
      { id: 'bshort4', a: true, b: false },
    ],
  );
});

const runA = {
  width: 1344, height: 768, frames: 124, duration: 5.167,
  steps: 4, elapsed: 537.49, statusKey: 'status.success',
  recommendationKey: 'recommendation.resolutionPriority',
};
const runB = {
  width: 1024, height: 576, frames: 243, duration: 10.125,
  steps: 4, elapsed: 650.96, statusKey: 'status.success',
  recommendationKey: 'recommendation.lengthPriority',
};
const fakeTranslate = (key, params = {}) => ({
  'telemetry.resolution': 'Resolution',
  'telemetry.frames': 'Frames',
  'telemetry.bMoreFrames': 'B has more frames',
  'telemetry.verifiedResults': 'Both runs verified',
  'status.success': 'Success',
  'unit.frames': `${params.value} frames`,
  'unit.seconds': `${params.value} sec`,
}[key] ?? key);

test('builds six localized comparison metrics without changing technical values', () => {
  assert.equal(typeof compare.buildComparisonMetrics, 'function');
  const metrics = compare.buildComparisonMetrics(runA, runB, fakeTranslate);
  assert.equal(metrics.length, 6);
  assert.equal(metrics[0].label, 'Resolution');
  assert.equal(metrics[0].aValue, '1344×768');
  assert.equal(metrics[1].bValue, '243 frames');
  assert.equal(metrics[1].note, 'B has more frames');
  assert.equal(metrics[5].aValue, 'Success');
  assert.equal(metrics[5].note, 'Both runs verified');
});

test('localizes a catalog item from neutral keys', () => {
  assert.equal(typeof compare.localizeCatalogItem, 'function');
  assert.deepEqual(
    compare.localizeCatalogItem({
      titleKey: 'media.c4.title', descriptionKey: 'media.c4.description',
      statusKey: 'status.success', recommendationKey: 'recommendation.lengthPriority',
    }, fakeTranslate),
    {
      title: 'media.c4.title', description: 'media.c4.description',
      status: 'Success', recommendation: 'recommendation.lengthPriority',
    },
  );
});

test('refreshing localized state preserves every comparison control choice', () => {
  assert.equal(typeof compare.refreshLocalizedState, 'function');
  const state = { a: 'bshort4', b: 'c4', mode: 'time', audio: 'a', playing: true };
  const refreshed = compare.refreshLocalizedState(state);
  assert.deepEqual(refreshed, state);
  assert.notEqual(refreshed, state);
});
