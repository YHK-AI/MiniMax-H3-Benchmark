# Device Resource Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the exact Lenovo test-machine configuration and an auditable resource record for every tested MiniMax H3 preset, while defaulting comparison rail A to the best 20-step result.

**Architecture:** Preserve the static HTML/CSS/ES-module site. Add semantic hardware and resource tables directly to `index.html`, localize labels through the existing key-parity catalog in `i18n.js`, and enforce content/defaults with Node tests. Mirror the same evidence and caveats in the bilingual Markdown documents and the original ComfyUI manual.

**Tech Stack:** Static HTML5, CSS custom properties and responsive tables, ES modules, Node.js built-in test runner, Markdown, GitHub Pages Actions.

## Global Constraints

- English remains the default locale; Simplified Chinese uses identical technical values.
- A defaults to `final20`; B defaults to `c4`.
- Exact device values: Lenovo `21J8`; Intel Core i9-13900H, 14 cores / 20 logical processors; RTX 4060 Laptop, 8188 MiB, driver 581.08; 2×16 GiB Samsung DDR5-5600 configured at 5200 MT/s; Samsung 1 TB plus WD 2 TB NVMe.
- Storage evidence: models 39.554 GiB, virtual environment 4.041 GiB, published site 46.58 MiB; 60 GiB is a recommended free-space floor, not measured usage.
- Never invent an unrecorded RAM, VRAM, CPU, power, or scratch-space peak. Use “not recorded” / “未记录”.
- Preserve filtering, synchronized playback, media viewer behavior, keyboard access, reduced motion, and mobile readability.

---

### Task 1: Best-result comparison default

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: `createCompareController()` reads `select.dataset.default` and the canonical media catalog.
- Produces: server-rendered A rail state for `final20` and B rail state for `c4` before JavaScript enhancement.

- [ ] **Step 1: Write the failing test**

Add a test that extracts both `data-compare-side` articles and requires A to contain `data-default="final20"`, the selected `final20` option, the final title/spec/source, and B to retain `data-default="c4"`.

```js
test('defaults A to the best verified final and B to the comparable four-step run', async () => {
  const html = await readFile(join(root, 'index.html'), 'utf8');
  const railA = html.match(/<article class="compare-rail" data-compare-side="a">[\s\S]*?<\/article>/)?.[0] ?? '';
  const railB = html.match(/<article class="compare-rail" data-compare-side="b">[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.match(railA, /data-default="final20"/);
  assert.match(railA, /<option value="final20" selected>/);
  assert.match(railA, /MiniMax_H3_KFP_FINAL_C_1024x576_243f_20step_00001_\.mp4/);
  assert.match(railB, /data-default="c4"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because A currently defaults to `bshort4`.

- [ ] **Step 3: Write minimal implementation**

Update only A's selected option, header, spec, source link, video source, fallback, and poster to the final result. Keep B at `c4`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/site.test.mjs`

Expected: PASS.

### Task 2: Device profile and seven-run resource matrix

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `tests/i18n.test.mjs`
- Modify: `index.html`
- Modify: `i18n.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: existing `data-i18n`, `data-i18n-data-label`, `data-result`, and filter-button contracts.
- Produces: semantic `#device-profile` definition list and seven `data-resource-run` rows inside the existing filtered matrix.

- [ ] **Step 1: Write failing content tests**

Require the exact CPU, core/thread count, GPU/driver, RAM modules/speed, both NVMe devices, fixed storage footprint, seven resource rows, `VRAM`, `RAM/private`, `MP4 size`, and `Measurement basis` headers. Require the five exact MP4 sizes and explicit “Not recorded” text.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/site.test.mjs tests/i18n.test.mjs`

Expected: FAIL for missing device/resource content or translation keys.

- [ ] **Step 3: Implement semantic content**

Expand the hardware card into a device definition list. Expand the matrix to seven rows and add generation time, VRAM, RAM/private memory, MP4 size, and basis columns. Use `—` for failed output and text labels for all status colors.

- [ ] **Step 4: Add matched English/Chinese keys**

Add identical keys under both locale catalogs for the new labels and caveats. Keep every number in HTML so language changes cannot alter evidence.

- [ ] **Step 5: Add responsive styling**

Reuse `.table-wrap`; set a practical minimum table width, tabular numerals, compact resource cells, and narrow-screen data labels. Keep focus outlines and touch scrolling.

- [ ] **Step 6: Run tests to verify GREEN**

Run: `node --test tests/site.test.mjs tests/i18n.test.mjs`

Expected: all selected tests pass.

### Task 3: Bilingual documentation and original manual

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/INSTALLATION.md`
- Modify: `docs/INSTALLATION.zh-CN.md`
- Modify: `docs/BENCHMARK.md`
- Modify: `docs/BENCHMARK.zh-CN.md`
- Modify: `E:/01_YHK/03_Dev/02_TXGit/YHK_Workflow/001_ComfyUI/02DOCs/ComfyUI.md`

**Interfaces:**
- Consumes: exact hardware and resource values from the design spec.
- Produces: matching English/Chinese installation and benchmark guidance with measurement provenance.

- [ ] **Step 1: Write failing documentation tests**

Require the English and Chinese repository documents to include `i9-13900H`, `14 cores / 20` or `14 核 / 20`, `2×16`, `5200`, both NVMe model families, 39.554 GiB, 4.041 GiB, 60 GiB, and the five output sizes.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/site.test.mjs`

Expected: FAIL for missing documentation evidence.

- [ ] **Step 3: Update repository documents**

Add a detailed device table, installation footprint table, and per-run resource table. State that successful-run per-process RAM and some VRAM peaks were not captured.

- [ ] **Step 4: Update the original ComfyUI manual**

Mirror the device profile, fixed footprint, resource matrix, monitoring commands, and C-drive/E-drive placement warning without duplicating the full website copy.

- [ ] **Step 5: Run documentation tests to verify GREEN**

Run: `node --test tests/site.test.mjs`

Expected: PASS.

### Task 4: Full verification and publication

**Files:**
- Verify: all changed repository files
- Verify: `E:/01_YHK/03_Dev/02_TXGit/YHK_Workflow/001_ComfyUI/02DOCs/ComfyUI.md`

**Interfaces:**
- Consumes: completed website and documentation changes.
- Produces: clean commits, synchronized `origin/main`, passing GitHub Pages workflow, and HTTP-verified public media.

- [ ] **Step 1: Run local verification**

```powershell
node --check app.js
node --check i18n.js
node --test tests/*.test.mjs
git diff --check
```

Expected: syntax exit 0, all tests pass, diff check produces no errors.

- [ ] **Step 2: Verify static serving and range media**

Run local HTTP checks for `/`, `i18n.js`, and the final MP4 with a byte range. Expected: 200 for documents and 206 for media.

- [ ] **Step 3: Commit intended files only**

Stage the plan, tests, site, bilingual documents, and no media/model files. Commit with `feat: document device resource usage`.

- [ ] **Step 4: Push and verify GitHub Pages**

Push `main`, wait for the Pages workflow, confirm every job step succeeds, and check the public root plus all seven assets.
