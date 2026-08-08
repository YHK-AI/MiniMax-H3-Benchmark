import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(testDir, '..');

const requiredFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'i18n.js',
  'README.md',
  '.nojekyll',
  '.gitattributes',
  '.github/workflows/pages.yml',
];
const videoFiles = [
  'MiniMax_H3_KFP_FINAL_C_1024x576_243f_20step_00001_.mp4',
  'MiniMax_H3_KFP_C_1024x576_243f_4step_00001_.mp4',
  'MiniMax_H3_KFP_Bshort_1344x768_124f_4step_00001_.mp4',
  'MiniMax_H3_KFP_C_preflight_1024x576_243f_1step_00001_.mp4',
  'MiniMax_H3_KFP_Bshort_preflight_1344x768_124f_1step_00001_.mp4',
];
const imageFiles = [
  'KFP_Bshort_vs_C_4step_contact_sheet.png',
  'MiniMax_H3_KFP_FINAL_C_20step_contact_sheet.png',
];

async function exists(relativePath) {
  try {
    await access(path.join(siteRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readText(relativePath) {
  try {
    return await readFile(path.join(siteRoot, relativePath), 'utf8');
  } catch {
    return '';
  }
}

async function directoryNames(relativePath) {
  try {
    return (await readdir(path.join(siteRoot, relativePath))).sort();
  } catch {
    return [];
  }
}

test('ships every required static entry file', async () => {
  const results = await Promise.all(requiredFiles.map(exists));
  assert.deepEqual(results, requiredFiles.map(() => true));
});

test('ships exactly the approved public media assets', async () => {
  assert.deepEqual(await directoryNames('assets/videos'), [...videoFiles].sort());
  assert.deepEqual(await directoryNames('assets/images'), [...imageFiles].sort());

  for (const relativePath of [
    ...videoFiles.map((name) => `assets/videos/${name}`),
    ...imageFiles.map((name) => `assets/images/${name}`),
  ]) {
    const info = await stat(path.join(siteRoot, relativePath));
    assert.ok(info.size > 0, `${relativePath} must not be empty`);
    assert.ok(info.size < 100_000_000, `${relativePath} must remain below GitHub's 100MB limit`);
  }
});

test('contains the complete semantic report and approved claims', async () => {
  const html = await readText('index.html');
  assert.match(html, /<html[^>]+lang="en"/i);
  assert.match(html, /name="viewport"/i);
  assert.match(html, /class="skip-link"/i);
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1);

  for (const sectionId of [
    'result',
    'comparison',
    'matrix',
    'limits',
    'gallery',
    'verification',
    'reproduce',
    'recommendation',
  ]) {
    assert.match(html, new RegExp(`id="${sectionId}"`, 'i'));
  }

  for (const filename of [...videoFiles, ...imageFiles]) {
    assert.ok(html.includes(filename), `index.html must reference ${filename}`);
  }
  assert.match(html, /Local best verified configuration/);
  assert.match(html, /not the absolute hardware limit/i);
  assert.match(html, /RTX 4060 Laptop 8GB/i);
});

test('publishes the exact device profile and seven-run resource evidence', async () => {
  const html = await readText('index.html');

  assert.match(html, /id="device-profile"/);
  for (const value of [
    'Lenovo 21J8',
    'Intel Core i9-13900H',
    '14 cores / 20 threads',
    'NVIDIA GeForce RTX 4060 Laptop GPU',
    '8188 MiB',
    '581.08',
    '2 × 16 GiB Samsung DDR5-5600',
    '5200 MT/s',
    'SAMSUNG MZVL21T0HCLR-00BL2',
    'WD PC SN740 SDDPTQE-2T00',
    '39.554 GiB',
    '4.041 GiB',
    '46.58 MiB',
    '60 GiB',
  ]) assert.ok(html.includes(value), `device/resource profile must include ${value}`);

  assert.equal((html.match(/data-resource-run=/g) ?? []).length, 7);
  for (const run of ['upper', 'b-long', 'b-short-1', 'b-short-4', 'c-1', 'c-4', 'final-20']) {
    assert.match(html, new RegExp(`data-resource-run="${run}"`));
  }
  for (const key of [
    'matrix.generationTime', 'matrix.vram', 'matrix.ramPrivate',
    'matrix.outputSize', 'matrix.measurementBasis',
  ]) assert.match(html, new RegExp(`data-i18n="${key.replace('.', '\\.')}"`));
  for (const size of ['6.38 MiB', '4.83 MiB', '16.94 MiB', '8.42 MiB', '6.82 MiB']) {
    assert.ok(html.includes(size), `resource matrix must include ${size}`);
  }
  assert.match(html, /Peak not recorded/);
  assert.match(html, /CPU utilization and power were not continuously sampled/);
  assert.match(html, /class="[^"]*resource-table/);
});

test('ships an English fallback and an accessible persistent language switch', async () => {
  const [html, css, script] = await Promise.all([
    readText('index.html'), readText('styles.css'), readText('app.js'),
  ]);
  assert.match(html, /<html[^>]+lang="en"/i);
  assert.equal((html.match(/data-locale="(?:en|zh-CN)"/g) ?? []).length, 2);
  assert.match(html, /data-locale="en"[^>]+aria-pressed="true"/);
  assert.match(html, /data-locale="zh-CN"[^>]+aria-pressed="false"/);
  assert.match(html, /data-i18n="decision\.title"[^>]*>Local best verified configuration/);
  assert.match(html, /data-i18n-aria-label="a11y\.languageSwitcher"/);
  assert.match(html, /data-media-title-key="media\.final20\.title"/);
  assert.match(html, /data-media-description-key="media\.final20\.description"/);
  assert.match(css, /\.language-switcher/);
  assert.match(css, /\.sr-only/);
  assert.match(script, /from ['"]\.\/i18n\.js['"]/);
});

test('uses only deployable relative paths for scripts, styles and media', async () => {
  const html = await readText('index.html');
  assert.doesNotMatch(html, /file:/i);
  assert.doesNotMatch(html, /(?:[A-Z]:\\|E:\/)/i);
  assert.doesNotMatch(html, /localhost|127\.0\.0\.1/i);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:\/\//i);
  assert.equal((html.match(/assets\/videos\/[^"']+\.mp4/g) ?? []).length >= 5, true);
});

test('implements synchronized comparison and resilient progressive enhancement', async () => {
  const script = await readText('app.js');
  for (const id of ['compare-play-toggle', 'compare-reset']) {
    assert.ok(script.includes(id), `app.js must bind ${id}`);
  }
  assert.match(script, /data-compare-video/);
  assert.match(script, /Promise\.allSettled/);
  assert.match(script, /currentTime/);
  assert.match(script, /data-filter/);
  assert.match(script, /addEventListener\(['"]error['"]/);
  assert.match(script, /prefers-reduced-motion/);
});

test('defaults A to the best verified final and B to the comparable four-step run', async () => {
  const html = await readText('index.html');
  const railA = html.match(/<article class="compare-rail" data-compare-side="a">[\s\S]*?<\/article>/)?.[0] ?? '';
  const railB = html.match(/<article class="compare-rail" data-compare-side="b">[\s\S]*?<\/article>/)?.[0] ?? '';

  assert.match(railA, /data-default="final20"/);
  assert.match(railA, /<option value="final20" selected>/);
  assert.match(railA, /<h3 data-compare-title>Final C \/ 20 steps<\/h3>/);
  assert.match(railA, /1024×576 \/ 243 frames \/ 10\.125 sec/);
  assert.match(railA, /MiniMax_H3_KFP_FINAL_C_1024x576_243f_20step_00001_\.mp4/);
  assert.match(railB, /data-default="c4"/);
  assert.match(railB, /<option value="c4" selected>/);
});

test('exposes five selectable videos and the complete A/B console', async () => {
  const html = await readText('index.html');
  for (const id of [
    'compare-a-select', 'compare-b-select', 'compare-play-toggle', 'compare-reset',
    'compare-progress', 'compare-sync-progress', 'compare-sync-time',
    'compare-audio-muted', 'compare-audio-a', 'compare-audio-b',
    'compare-diff-grid', 'compare-status',
  ]) assert.match(html, new RegExp(`id="${id}"`), `${id} must exist`);

  assert.equal((html.match(/data-media-type="video"/g) ?? []).length, 5);
  for (const field of ['media-frames', 'media-duration', 'media-steps', 'media-elapsed', 'media-status-key']) {
    assert.equal((html.match(new RegExp(`data-${field}=`, 'g')) ?? []).length, 5);
  }
  assert.match(html, /id="compare-a-select"[^>]*data-default="bshort4"/);
  assert.match(html, /id="compare-b-select"[^>]*data-default="c4"/);
});

test('implements selectable relative and absolute synchronization', async () => {
  const script = await readText('app.js');
  for (const token of [
    'buildVideoCatalog', 'createCompareController', 'selectPair', 'swapPair',
    'applySelection', 'seekByMasterProgress', 'syncRelativeProgress',
    'syncAbsoluteTime', 'setAudioSource', 'renderComparisonDiff',
    'requestAnimationFrame', 'Promise.allSettled',
  ]) assert.ok(script.includes(token), `app.js must include ${token}`);
  assert.match(script, /0\.20/);
  assert.match(script, /0\.02/);
});

test('captures the requested master seek before pause refreshes the range', async () => {
  const script = await readText('app.js');
  const start = script.indexOf("controls.progress.addEventListener('input'");
  const end = script.indexOf('controls.sync.forEach', start);
  const handler = script.slice(start, end);
  assert.match(handler, /const requestedProgress = Number\(controls\.progress\.value\) \/ 1000/);
  assert.ok(
    handler.indexOf('const requestedProgress') < handler.indexOf("pauseBoth('')"),
    'the slider value must be captured before pauseBoth updates the UI',
  );
  assert.match(handler, /seekByMasterProgress\(videos, state\.mode, requestedProgress\)/);
});

test('exposes all seven assets through one accessible media viewer', async () => {
  const html = await readText('index.html');
  assert.equal((html.match(/data-media-trigger\b/g) ?? []).length >= 7, true);
  assert.equal((html.match(/data-media-catalog\b/g) ?? []).length, 7);
  for (const id of ['final20', 'c4', 'bshort4', 'c1', 'bshort1', 'study4', 'timeline20']) {
    assert.match(html, new RegExp(`data-media-catalog[^>]+data-media-id="${id}"`));
  }
  assert.equal((html.match(/<dialog\b/gi) ?? []).length, 1);
  assert.match(html, /id="media-lightbox"/);
  assert.match(html, /id="media-stage"/);
  assert.match(html, /id="media-fit"/);
  assert.match(html, /id="media-native"/);
  assert.match(html, /id="media-previous"/);
  assert.match(html, /id="media-next"/);
  assert.match(html, /aria-labelledby="media-title"/);
});

test('declares deployable metadata for five videos and two images', async () => {
  const html = await readText('index.html');
  assert.equal((html.match(/data-media-type="video"/g) ?? []).length, 5);
  assert.equal((html.match(/data-media-type="image"/g) ?? []).length, 2);
  assert.equal((html.match(/data-media-width="(?:1024|1344)"/g) ?? []).length >= 5, true);
  assert.equal((html.match(/data-media-height="(?:576|768)"/g) ?? []).length >= 5, true);
  assert.doesNotMatch(html, /data-media-src="(?:file:|[A-Z]:\\|\/\/)/i);
});

test('implements native-size media navigation and accessible dialog cleanup', async () => {
  const script = await readText('app.js');
  for (const token of [
    'mediaItems', 'openMedia', 'renderMedia', 'setMediaMode', 'closeMedia', 'stepMedia',
    'showModal', 'naturalWidth', 'naturalHeight', 'videoWidth', 'videoHeight',
    'lastMediaTrigger', 'media-previous', 'media-next', 'media-native', 'media-fit',
  ]) assert.ok(script.includes(token), `app.js must include ${token}`);
  assert.match(script, /addEventListener\(['"]keydown['"]/);
  assert.match(script, /event\.key === ['"]Escape['"]/);
  assert.match(script, /event\.key === ['"]ArrowLeft['"]/);
  assert.match(script, /event\.key === ['"]ArrowRight['"]/);
  assert.match(script, /\.focus\(\)/);
  assert.match(script, /removeAttribute\(['"]src['"]\)/);
});

test('ships the upgraded responsive media and reading experience', async () => {
  const [html, css, script] = await Promise.all([
    readText('index.html'), readText('styles.css'), readText('app.js'),
  ]);
  for (const selector of [
    '.reading-progress', '.preset-grid', '.media-library-grid', '.media-card',
    '.media-lightbox', '.media-stage', '[data-media-mode="native"]',
  ]) assert.ok(css.includes(selector), `styles.css must include ${selector}`);
  assert.match(css, /td::before/);
  assert.match(css, /content:\s*attr\(data-label\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /justify-self:\s*safe center/);
  assert.match(css, /align-self:\s*safe center/);
  assert.match(css, /width:\s*var\(--media-native-width\)/);
  assert.match(css, /height:\s*var\(--media-native-height\)/);
  assert.match(css, /@media\s*\([^)]*max-width:\s*760px/i);
  assert.match(html, /id="media-library"/);
  assert.match(script, /reading-progress-bar/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /aria-current/);
});

test('ships the approved twin-bay telemetry workspace instead of a marketing hero', async () => {
  const [html, css, script] = await Promise.all([
    readText('index.html'), readText('styles.css'), readText('app.js'),
  ]);
  for (const selector of [
    '.lab-masthead', '.decision-rail', '.twin-bay', '.control-deck',
    '.run-strip', '.telemetry-table', '.media-lightbox', '.skip-link',
  ]) assert.ok(css.includes(selector), `styles.css must include ${selector}`);
  for (const className of [
    'lab-masthead', 'decision-rail', 'twin-bay', 'control-deck',
    'run-strip', 'telemetry-table',
  ]) assert.match(html, new RegExp(`class="[^"]*${className}`), `${className} must exist`);
  for (const token of [
    '--graphite-950', '--slate-900', '--warm-050', '--amber-400',
    '--cyan-400', '--coral-500', '--verified-500',
  ]) assert.ok(css.includes(token), `styles.css must include ${token}`);
  assert.doesNotMatch(html, /class="[^"]*\bhero\b/);
  assert.doesNotMatch(css, /letter-spacing:\s*(?:0\.[12-9]|[2-9])em/i);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(html, /name="theme-color" content="#090d11"/);
  assert.match(html, /id="lightbox-image"[^>]+src="assets\/images\//);
  assert.match(html, /id="run-strip-title"[^>]+data-i18n="run\.heading"/);
  assert.equal((html.match(/<li class="run-item/g) ?? []).length, 5);
  assert.match(html, /class="compare-master control-deck" role="group"/);
  assert.match(html, /class="filter-group" role="group"/);
  assert.match(css, /touch-action:\s*manipulation/);
  assert.match(css, /overscroll-behavior:\s*contain/);
  assert.match(css, /text-wrap:\s*balance/);
  assert.match(css, /env\(safe-area-inset-left\)/);
  assert.doesNotMatch(css, /\bInter\b/);
  assert.doesNotMatch(css, /\.run-item\.is-a\.is-b/);
  assert.match(css, /min-height:\s*44px/);
  assert.doesNotMatch(html, /MEDIA INTEGRITY/);
  assert.doesNotMatch(html, /class="section-index"/);
  assert.doesNotMatch(html, /class="status-mark"[^>]*>\s*✓/);
  assert.match(html, /class="status-mark"[^>]*>[\s\S]*?<svg\b/);
  const decisionRail = html.match(/<section class="decision-rail[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.doesNotMatch(decisionRail, /data-media-id="final20"/);
  assert.equal((html.match(/class="telemetry-fallback-item"/g) ?? []).length, 6);
  assert.doesNotMatch(html, /\bdata-reveal\b/);
  assert.doesNotMatch(css, /reveal-ready/);
  assert.match(css, /@keyframes\s+telemetry-lock-in/);
  assert.match(script, /telemetry-locked/);
  for (const width of ['320px', '768px', '1024px', '1440px']) {
    assert.ok(css.includes(width), `styles.css must address ${width}`);
  }
});

test('includes responsive, reduced-motion and print styles', async () => {
  const css = await readText('styles.css');
  assert.match(css, /@media\s*\([^)]*max-width/i);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media\s+print/i);
  assert.match(css, /:focus-visible/);
});

test('documents independent GitHub Pages publication without model files', async () => {
  const [readme, chinese] = await Promise.all([
    readText('README.md'),
    readText('README.zh-CN.md'),
  ]);
  assert.match(readme, /GitHub Pages/i);
  assert.match(readme, /GitHub Actions/i);
  assert.match(readme, /repository root.*\/ \(root\)/i);
  assert.match(readme, /45\s*MB/i);
  assert.match(readme, /No model weights/i);
  assert.match(chinese, /不包含模型权重/);
});

test('documents the exact host, storage footprint, and per-run resource evidence bilingually', async () => {
  const files = await Promise.all([
    'README.md', 'README.zh-CN.md',
    'docs/INSTALLATION.md', 'docs/INSTALLATION.zh-CN.md',
    'docs/BENCHMARK.md', 'docs/BENCHMARK.zh-CN.md',
  ].map(readText));
  const all = files.join('\n');
  for (const token of [
    'Intel Core i9-13900H', '14 cores / 20 threads',
    '2 × 16 GiB Samsung DDR5-5600', '5200 MT/s',
    'SAMSUNG MZVL21T0HCLR-00BL2', 'WD PC SN740 SDDPTQE-2T00',
    '39.554 GiB', '4.041 GiB', '46.58 MiB', '60 GiB',
  ]) assert.ok(all.includes(token), `documentation must include ${token}`);
  for (const report of [files[4], files[5]]) {
    for (const token of ['6.38 MiB', '4.83 MiB', '16.94 MiB', '8.42 MiB', '6.82 MiB']) {
      assert.ok(report.includes(token), `benchmark report must include ${token}`);
    }
    assert.match(report, /8188 MiB/);
    assert.match(report, /6\.46 (?:GB|GiB)/);
  }
  assert.match(files[4], /CPU utilization and power were not continuously sampled/i);
  assert.match(files[5], /未连续采集 CPU 利用率和功耗/);
});

test('documents the synchronized comparison console', async () => {
  const readme = await readText('README.md');
  assert.match(readme, /A\/B comparison/i);
  assert.match(readme, /progress alignment/i);
  assert.match(readme, /time alignment/i);
  assert.match(readme, /Audio A.*audio B.*mutually exclusive/is);
});

test('documents the media viewer controls', async () => {
  const readme = await readText('README.md');
  assert.match(readme, /five videos.*two images/is);
  assert.match(readme, /original 1:1/i);
  assert.match(readme, /Left\/Right arrow/i);
  assert.match(readme, /Esc/);
});

test('documents the bilingual default and persistent language preference', async () => {
  const readme = await readText('README.md');
  assert.match(readme, /English is the safe default/i);
  assert.match(readme, /EN \/ 中文/);
  assert.match(readme, /localStorage/);
  assert.match(readme, /minimax-h3-locale/);
});

test('deploys the tested repository root through GitHub Pages Actions', async () => {
  const workflow = await readText('.github/workflows/pages.yml');
  for (const token of [
    'actions/checkout@v7', 'actions/setup-node@v6', 'node-version: 22',
    'node --test tests/*.test.mjs', 'actions/configure-pages@v6',
    'actions/upload-pages-artifact@v5', 'actions/deploy-pages@v5',
    'pages: write', 'id-token: write',
  ]) assert.ok(workflow.includes(token), `workflow must include ${token}`);
  assert.match(workflow, /path:\s*\./);
});
