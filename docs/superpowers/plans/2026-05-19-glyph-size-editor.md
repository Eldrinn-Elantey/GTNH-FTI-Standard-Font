# Glyph Size Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page browser tool for visually editing `glyph_sizes.bin` from Minecraft Unicode font resource packs.

**Architecture:** Three files — `glyph-utils.js` holds pure functions (parse/encode byte, cell coords), `index.html` holds all UI and app logic as inline `<script>`, `test.html` is a self-contained test runner. App state is a plain JS object; canvas elements handle rendering.

**Tech Stack:** Vanilla JS (ES2020), HTML5 Canvas, no build step, GitHub Pages static hosting.

---

## File Structure

| File | Responsibility |
|---|---|
| `docs/index.html` | App shell: HTML layout, CSS, app JS (file loading, state, rendering, events) |
| `docs/glyph-utils.js` | Pure functions: `parseGlyphByte`, `encodeGlyphByte`, `getGlyphCellCoords` |
| `docs/test.html` | Unit test runner for glyph-utils.js functions |

---

### Task 1: Scaffolding

**Files:**
- Create: `docs/index.html`
- Create: `docs/glyph-utils.js`
- Modify: `.gitignore`

- [ ] **Step 1: Update .gitignore**

Add to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 2: Create docs/glyph-utils.js skeleton**

```js
function parseGlyphByte(byte) {
  return { left: (byte >> 4) & 0xF, right: byte & 0xF };
}

function encodeGlyphByte(left, right) {
  return ((left & 0xF) << 4) | (right & 0xF);
}

// Returns pixel coords of a glyph cell within a 256x256 page PNG.
// codepoint: full Unicode codepoint (e.g. 0x0041 for 'A')
function getGlyphCellCoords(codepoint) {
  const indexInPage = codepoint & 0xFF;
  const col = indexInPage & 0xF;
  const row = (indexInPage >> 4) & 0xF;
  return { x: col * 16, y: row * 16, w: 16, h: 16 };
}
```

- [ ] **Step 3: Create docs/index.html skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Glyph Size Editor</title>
  <script src="glyph-utils.js"></script>
</head>
<body>
  <p>Loading...</p>
  <script>
    console.log('app ready');
  </script>
</body>
</html>
```

- [ ] **Step 4: Open docs/index.html in browser and verify console shows "app ready"**

- [ ] **Step 5: Commit**

```bash
git add docs/index.html docs/glyph-utils.js .gitignore
git commit -m "scaffold glyph editor project"
```

---

### Task 2: Pure Functions (TDD)

**Files:**
- Create: `docs/test.html`
- Modify: `docs/glyph-utils.js` (functions already exist, test drives correctness)

- [ ] **Step 1: Create docs/test.html with failing tests**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Glyph Utils Tests</title>
  <script src="glyph-utils.js"></script>
</head>
<body>
<pre id="out"></pre>
<script>
  let passed = 0, failed = 0;
  function assert(desc, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    document.getElementById('out').textContent +=
      (ok ? '✓' : '✗') + ' ' + desc +
      (ok ? '' : '\n  expected: ' + JSON.stringify(expected) + '\n  got:      ' + JSON.stringify(actual)) + '\n';
    ok ? passed++ : failed++;
  }

  // parseGlyphByte
  assert('parseGlyphByte(0x00)', parseGlyphByte(0x00), { left: 0, right: 0 });
  assert('parseGlyphByte(0xFF)', parseGlyphByte(0xFF), { left: 15, right: 15 });
  assert('parseGlyphByte(0x3A)', parseGlyphByte(0x3A), { left: 3, right: 10 });
  assert('parseGlyphByte(0xB4)', parseGlyphByte(0xB4), { left: 11, right: 4 });

  // encodeGlyphByte
  assert('encodeGlyphByte(0, 0)', encodeGlyphByte(0, 0), 0x00);
  assert('encodeGlyphByte(15, 15)', encodeGlyphByte(15, 15), 0xFF);
  assert('encodeGlyphByte(3, 10)', encodeGlyphByte(3, 10), 0x3A);
  assert('encodeGlyphByte(11, 4)', encodeGlyphByte(11, 4), 0xB4);

  // round-trip
  assert('round-trip 0x28', encodeGlyphByte(parseGlyphByte(0x28).left, parseGlyphByte(0x28).right), 0x28);

  // getGlyphCellCoords
  assert('U+0000 → col 0 row 0', getGlyphCellCoords(0x0000), { x: 0,   y: 0,   w: 16, h: 16 });
  assert('U+000F → col 15 row 0', getGlyphCellCoords(0x000F), { x: 240, y: 0,   w: 16, h: 16 });
  assert('U+0041 (A) → col 1 row 4', getGlyphCellCoords(0x0041), { x: 16,  y: 64,  w: 16, h: 16 });
  assert('U+00FF → col 15 row 15', getGlyphCellCoords(0x00FF), { x: 240, y: 240, w: 16, h: 16 });
  assert('U+0410 (А) same coords as U+0010', getGlyphCellCoords(0x0410), getGlyphCellCoords(0x0010));

  document.getElementById('out').textContent += '\n' + passed + ' passed, ' + failed + ' failed';
</script>
</body>
</html>
```

- [ ] **Step 2: Open docs/test.html — verify all tests pass (green checkmarks)**

- [ ] **Step 3: Commit**

```bash
git add docs/test.html
git commit -m "add unit tests for glyph-utils pure functions"
```

---

### Task 3: HTML Layout + CSS

**Files:**
- Modify: `docs/index.html` (replace skeleton with full layout)

- [ ] **Step 1: Replace docs/index.html with full layout**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Glyph Size Editor</title>
  <script src="glyph-utils.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #1a1a2e; color: #ccc; font-family: monospace; font-size: 13px; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

    /* Toolbar */
    #toolbar { background: #16213e; border-bottom: 1px solid #333; padding: 8px 12px; display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
    #toolbar .logo { color: #e94560; font-weight: bold; font-size: 14px; margin-right: 8px; }
    .btn { background: #0f3460; border: 1px solid #444; border-radius: 4px; padding: 5px 10px; color: #aaa; cursor: pointer; white-space: nowrap; }
    .btn:hover { border-color: #888; color: #fff; }
    .btn-primary { background: #e94560; border-color: #e94560; color: #fff; }
    .btn-primary:hover { background: #ff6b81; }
    .btn:disabled { opacity: 0.4; cursor: default; }
    #toolbar .spacer { flex: 1; }
    input[type="file"] { display: none; }

    /* Page selector */
    #page-bar { background: #16213e; border-bottom: 1px solid #333; padding: 6px 12px; display: flex; gap: 6px; align-items: center; flex-shrink: 0; min-height: 36px; }
    #page-bar span { color: #888; margin-right: 4px; }
    .page-tab { background: #0f3460; border-radius: 3px; padding: 2px 8px; color: #888; cursor: pointer; }
    .page-tab:hover { color: #ccc; }
    .page-tab.active { background: #e94560; color: #fff; }

    /* Main panels */
    #main { display: flex; flex: 1; overflow: hidden; }

    /* Left: grid */
    #grid-panel { flex: 1; padding: 10px; overflow: auto; border-right: 1px solid #333; display: flex; flex-direction: column; gap: 8px; }
    #grid-panel .panel-title { color: #888; font-size: 11px; }
    #grid-canvas { image-rendering: pixelated; cursor: pointer; border: 1px solid #333; display: block; }
    #grid-overlay { position: absolute; pointer-events: none; image-rendering: pixelated; }
    #grid-wrap { position: relative; display: inline-block; }

    /* Right: editor */
    #editor-panel { width: 260px; flex-shrink: 0; padding: 12px; display: flex; flex-direction: column; gap: 10px; background: #16213e; overflow-y: auto; }
    #glyph-label { font-size: 11px; color: #888; }
    #glyph-name  { font-size: 13px; color: #fff; margin-top: 2px; }
    #preview-wrap { background: #0f3460; border-radius: 4px; padding: 8px; text-align: center; }
    #preview-wrap .preview-title { font-size: 10px; color: #888; margin-bottom: 4px; }
    #preview-canvas { image-rendering: pixelated; display: block; margin: 0 auto; position: relative; z-index: 0; }
    #preview-container { position: relative; display: inline-block; }
    #bound-left  { position: absolute; top: 0; bottom: 0; width: 2px; background: #e94560; pointer-events: none; }
    #bound-right { position: absolute; top: 0; bottom: 0; width: 2px; background: #00b4d8; pointer-events: none; }

    .slider-row { display: flex; flex-direction: column; gap: 3px; }
    .slider-label { display: flex; justify-content: space-between; font-size: 11px; }
    input[type="range"] { width: 100%; cursor: pointer; }

    #byte-info { background: #0f3460; border-radius: 3px; padding: 6px 8px; font-size: 11px; color: #888; }
    #byte-info span { color: #fff; }

    #editor-actions { display: flex; gap: 6px; margin-top: auto; }
    #editor-actions button { flex: 1; padding: 7px; border-radius: 4px; cursor: pointer; border: none; font-family: monospace; font-size: 12px; }
    #btn-reset  { background: #0f3460; color: #aaa; border: 1px solid #444 !important; }
    #btn-apply  { background: #e94560; color: #fff; flex: 2; }
    #btn-reset:hover  { color: #fff; }
    #btn-apply:hover  { background: #ff6b81; }

    /* Status bar */
    #status-bar { background: #0f3460; border-top: 1px solid #333; padding: 4px 12px; display: flex; gap: 12px; font-size: 11px; color: #666; flex-shrink: 0; }
    #status-bar .highlight { color: #00b4d8; }

    #no-file-msg { color: #555; margin: auto; text-align: center; line-height: 2; }
  </style>
</head>
<body>
  <!-- Toolbar -->
  <div id="toolbar">
    <span class="logo">⬛ Glyph Size Editor</span>
    <span class="spacer"></span>
    <button class="btn" onclick="document.getElementById('input-bin').click()">📂 Load glyph_sizes.bin</button>
    <input type="file" id="input-bin" accept=".bin">
    <button class="btn" onclick="document.getElementById('input-png').click()">🖼 Load PNG pages</button>
    <input type="file" id="input-png" accept=".png" multiple>
    <button class="btn btn-primary" id="btn-download" disabled onclick="downloadBin()">💾 Download .bin</button>
  </div>

  <!-- Page selector -->
  <div id="page-bar">
    <span>Page:</span>
    <div id="page-tabs"></div>
  </div>

  <!-- Main area -->
  <div id="main">
    <div id="grid-panel">
      <div class="panel-title" id="grid-title">No file loaded</div>
      <div id="no-file-msg">Load glyph_sizes.bin and PNG pages to begin.</div>
      <div id="grid-wrap" style="display:none">
        <canvas id="grid-canvas"></canvas>
        <canvas id="grid-overlay" style="position:absolute;top:0;left:0"></canvas>
      </div>
    </div>

    <div id="editor-panel">
      <div>
        <div id="glyph-label">No glyph selected</div>
        <div id="glyph-name"></div>
      </div>
      <div id="preview-wrap">
        <div class="preview-title">Texture (16×16 px, ×8)</div>
        <div id="preview-container">
          <canvas id="preview-canvas" width="128" height="128"></canvas>
          <div id="bound-left"></div>
          <div id="bound-right"></div>
        </div>
      </div>
      <div class="slider-row">
        <div class="slider-label">
          <span style="color:#e94560">Left bound</span>
          <span style="color:#e94560" id="val-left">—</span>
        </div>
        <input type="range" id="slider-left" min="0" max="15" value="0" style="accent-color:#e94560" disabled>
      </div>
      <div class="slider-row">
        <div class="slider-label">
          <span style="color:#00b4d8">Right bound</span>
          <span style="color:#00b4d8" id="val-right">—</span>
        </div>
        <input type="range" id="slider-right" min="0" max="15" value="15" style="accent-color:#00b4d8" disabled>
      </div>
      <div id="byte-info">Byte: <span id="info-byte">—</span> · Width: <span id="info-width">—</span></div>
      <div id="editor-actions">
        <button id="btn-reset" disabled onclick="resetGlyph()">Reset</button>
        <button id="btn-apply" disabled onclick="applyGlyph()">✓ Apply</button>
      </div>
    </div>
  </div>

  <!-- Status bar -->
  <div id="status-bar">
    <span id="status-bin">No file loaded</span>
    <span>·</span>
    <span id="status-page">—</span>
    <span>·</span>
    <span id="status-changes" class="highlight">No changes</span>
  </div>

  <script>
    console.log('app ready');
  </script>
</body>
</html>
```

- [ ] **Step 2: Open docs/index.html in browser — verify the two-panel layout renders correctly, toolbar and status bar visible**

- [ ] **Step 3: Commit**

```bash
git add docs/index.html
git commit -m "add full HTML layout and CSS"
```

---

### Task 4: File Loading

**Files:**
- Modify: `docs/index.html` (replace the `<script>` block with app state + file loaders)

- [ ] **Step 1: Replace the inline `<script>` block in docs/index.html with app state and file loading logic**

Replace `<script>\n    console.log('app ready');\n  </script>` with:

```html
<script>
  // ── App state ────────────────────────────────────────────────
  const state = {
    originalData: null,   // Uint8Array 65536 bytes, immutable copy
    workingData:  null,   // Uint8Array 65536 bytes, live edits
    pages:        new Map(), // Map<pageIndex, ImageBitmap>
    activePage:   null,
    selectedCP:   null,   // currently selected codepoint
    modifiedCount: 0,
  };

  // ── File loading ──────────────────────────────────────────────
  document.getElementById('input-bin').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength !== 65536) {
      alert('Invalid file: glyph_sizes.bin must be exactly 65536 bytes.');
      return;
    }
    state.originalData = new Uint8Array(buffer);
    state.workingData  = new Uint8Array(buffer.slice(0));
    state.modifiedCount = 0;
    document.getElementById('btn-download').disabled = false;
    document.getElementById('status-bin').textContent = 'Loaded: ' + file.name;
    updateStatusChanges();
    refreshPageTabs();
    if (state.activePage !== null) renderGrid(state.activePage);
    e.target.value = '';
  });

  document.getElementById('input-png').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const match = file.name.match(/unicode_page_([0-9a-fA-F]{2})\.png$/i);
      if (!match) { console.warn('Skipping unrecognized file:', file.name); continue; }
      const pageIndex = parseInt(match[1], 16);
      const bitmap = await createImageBitmap(file);
      state.pages.set(pageIndex, bitmap);
    }
    refreshPageTabs();
    // auto-select first loaded page if none active
    if (state.activePage === null && state.pages.size > 0) {
      selectPage([...state.pages.keys()].sort((a, b) => a - b)[0]);
    } else if (state.activePage !== null) {
      renderGrid(state.activePage);
    }
    e.target.value = '';
  });

  function updateStatusChanges() {
    const el = document.getElementById('status-changes');
    el.textContent = state.modifiedCount === 0
      ? 'No changes'
      : 'Modified: ' + state.modifiedCount + ' glyph' + (state.modifiedCount === 1 ? '' : 's');
  }
</script>
```

- [ ] **Step 2: Open browser devtools console, load a glyph_sizes.bin file via the toolbar button — verify no errors and status bar updates to show filename**

- [ ] **Step 3: Load a unicode_page_XX.png — verify no console errors**

- [ ] **Step 4: Commit**

```bash
git add docs/index.html
git commit -m "add file loading for .bin and PNG pages"
```

---

### Task 5: Page Tabs + Glyph Grid

**Files:**
- Modify: `docs/index.html` (add `refreshPageTabs`, `selectPage`, `renderGrid`, click handler)

- [ ] **Step 1: Add the following functions to the `<script>` block (before the closing `</script>`)**

```js
  // ── Page tabs ─────────────────────────────────────────────────
  function refreshPageTabs() {
    const bar = document.getElementById('page-tabs');
    bar.innerHTML = '';
    const sorted = [...state.pages.keys()].sort((a, b) => a - b);
    sorted.forEach(idx => {
      const tab = document.createElement('div');
      tab.className = 'page-tab' + (idx === state.activePage ? ' active' : '');
      tab.textContent = idx.toString(16).toUpperCase().padStart(2, '0');
      tab.title = 'U+' + (idx * 256).toString(16).toUpperCase().padStart(4, '0') +
                  '–U+' + (idx * 256 + 255).toString(16).toUpperCase().padStart(4, '0');
      tab.onclick = () => selectPage(idx);
      bar.appendChild(tab);
    });
  }

  function selectPage(pageIndex) {
    state.activePage = pageIndex;
    state.selectedCP = null;
    refreshPageTabs();
    renderGrid(pageIndex);
    clearEditor();
    const base = pageIndex * 256;
    document.getElementById('grid-title').textContent =
      'Page ' + pageIndex.toString(16).toUpperCase().padStart(2, '0') +
      ' · U+' + base.toString(16).toUpperCase().padStart(4, '0') +
      '–U+' + (base + 255).toString(16).toUpperCase().padStart(4, '0');
    document.getElementById('status-page').textContent =
      'Page ' + pageIndex.toString(16).toUpperCase().padStart(2, '0') +
      ': unicode_page_' + pageIndex.toString(16).toUpperCase().padStart(2, '0') + '.png';
  }

  // ── Grid rendering ────────────────────────────────────────────
  const CELL = 16;   // px per glyph in source PNG
  const SCALE = 2;   // display scale factor for grid (256×256 → 512×512)

  function renderGrid(pageIndex) {
    const bitmap = state.pages.get(pageIndex);
    const canvas  = document.getElementById('grid-canvas');
    const overlay = document.getElementById('grid-overlay');
    const size = 256 * SCALE;

    canvas.width  = size; canvas.height  = size;
    overlay.width = size; overlay.height = size;
    canvas.style.width  = size + 'px'; canvas.style.height  = size + 'px';
    overlay.style.width = size + 'px'; overlay.style.height = size + 'px';

    document.getElementById('no-file-msg').style.display = 'none';
    document.getElementById('grid-wrap').style.display   = 'inline-block';

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, 0, 0, size, size);
    renderGridOverlay(pageIndex);
  }

  function renderGridOverlay(pageIndex) {
    const overlay = document.getElementById('grid-overlay');
    const ctx = overlay.getContext('2d');
    const size = 256 * SCALE;
    ctx.clearRect(0, 0, size, size);

    // draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      const p = i * CELL * SCALE;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }

    // highlight selected glyph
    if (state.selectedCP !== null && (state.selectedCP >> 8) === pageIndex) {
      const { x, y } = getGlyphCellCoords(state.selectedCP);
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * SCALE + 1, y * SCALE + 1, CELL * SCALE - 2, CELL * SCALE - 2);
    }
  }

  // ── Grid click ────────────────────────────────────────────────
  document.getElementById('grid-canvas').addEventListener('click', (e) => {
    if (state.activePage === null) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const col = Math.floor(mx / (CELL * SCALE));
    const row = Math.floor(my / (CELL * SCALE));
    if (col < 0 || col > 15 || row < 0 || row > 15) return;
    const cp = state.activePage * 256 + row * 16 + col;
    selectGlyph(cp);
  });
```

- [ ] **Step 2: Open browser, load a PNG page — verify the glyph grid appears with grid lines. Click a cell — verify it highlights in red.**

- [ ] **Step 3: Commit**

```bash
git add docs/index.html
git commit -m "add page tabs and glyph grid rendering"
```

---

### Task 6: Glyph Editor Panel

**Files:**
- Modify: `docs/index.html` (add `selectGlyph`, `clearEditor`, `renderPreview`, slider listeners)

- [ ] **Step 1: Add editor functions to the `<script>` block**

```js
  // ── Editor ────────────────────────────────────────────────────
  const PREVIEW_SCALE = 8; // 16px × 8 = 128px preview canvas

  function selectGlyph(cp) {
    if (!state.workingData) return;
    state.selectedCP = cp;
    renderGridOverlay(state.activePage);

    const byte = state.workingData[cp];
    const { left, right } = parseGlyphByte(byte);
    setSliders(left, right);
    renderPreview(cp, left, right);

    const hex = '0x' + cp.toString(16).toUpperCase().padStart(4, '0');
    document.getElementById('glyph-label').textContent = 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
    document.getElementById('glyph-name').textContent  = getCharDisplay(cp);

    document.getElementById('slider-left').disabled  = false;
    document.getElementById('slider-right').disabled = false;
    document.getElementById('btn-reset').disabled  = false;
    document.getElementById('btn-apply').disabled  = false;
  }

  function getCharDisplay(cp) {
    try { return '"' + String.fromCodePoint(cp) + '"'; } catch { return '(control)'; }
  }

  function clearEditor() {
    document.getElementById('glyph-label').textContent = 'No glyph selected';
    document.getElementById('glyph-name').textContent  = '';
    document.getElementById('val-left').textContent  = '—';
    document.getElementById('val-right').textContent = '—';
    document.getElementById('info-byte').textContent  = '—';
    document.getElementById('info-width').textContent = '—';
    document.getElementById('slider-left').disabled  = true;
    document.getElementById('slider-right').disabled = true;
    document.getElementById('btn-reset').disabled  = true;
    document.getElementById('btn-apply').disabled  = true;
    const previewCtx = document.getElementById('preview-canvas').getContext('2d');
    previewCtx.clearRect(0, 0, 128, 128);
    document.getElementById('bound-left').style.left  = '-9999px';
    document.getElementById('bound-right').style.left = '-9999px';
  }

  function setSliders(left, right) {
    document.getElementById('slider-left').value  = left;
    document.getElementById('slider-right').value = right;
    document.getElementById('val-left').textContent  = left;
    document.getElementById('val-right').textContent = right;
    updateByteInfo(left, right);
    updateBoundLines(left, right);
  }

  function updateByteInfo(left, right) {
    const byte = encodeGlyphByte(left, right);
    document.getElementById('info-byte').textContent  = '0x' + byte.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('info-width').textContent = Math.max(0, right - left) + 'px';
  }

  function updateBoundLines(left, right) {
    const W = 128; // preview canvas width
    const px = PREVIEW_SCALE; // pixels per source pixel
    document.getElementById('bound-left').style.left  = (left  * px) + 'px';
    document.getElementById('bound-right').style.left = (right * px) + 'px';
  }

  function renderPreview(cp, left, right) {
    const pageIndex = cp >> 8;
    const bitmap = state.pages.get(pageIndex);
    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 128, 128);
    if (bitmap) {
      const { x, y } = getGlyphCellCoords(cp);
      ctx.drawImage(bitmap, x, y, 16, 16, 0, 0, 128, 128);
    }
    updateBoundLines(left, right);
    updateByteInfo(left, right);
  }

  // ── Slider listeners ──────────────────────────────────────────
  document.getElementById('slider-left').addEventListener('input', (e) => {
    const left  = parseInt(e.target.value);
    const right = parseInt(document.getElementById('slider-right').value);
    document.getElementById('val-left').textContent = left;
    updateBoundLines(left, right);
    updateByteInfo(left, right);
  });

  document.getElementById('slider-right').addEventListener('input', (e) => {
    const right = parseInt(e.target.value);
    const left  = parseInt(document.getElementById('slider-left').value);
    document.getElementById('val-right').textContent = right;
    updateBoundLines(left, right);
    updateByteInfo(left, right);
  });

  // ── Apply / Reset ─────────────────────────────────────────────
  function applyGlyph() {
    if (state.selectedCP === null || !state.workingData) return;
    const left  = parseInt(document.getElementById('slider-left').value);
    const right = parseInt(document.getElementById('slider-right').value);
    const newByte = encodeGlyphByte(left, right);
    const oldByte = state.workingData[state.selectedCP];
    if (newByte !== oldByte) {
      const wasModified = oldByte !== state.originalData[state.selectedCP];
      state.workingData[state.selectedCP] = newByte;
      const isModified  = newByte !== state.originalData[state.selectedCP];
      if (!wasModified && isModified)  state.modifiedCount++;
      if (wasModified  && !isModified) state.modifiedCount--;
      updateStatusChanges();
    }
  }

  function resetGlyph() {
    if (state.selectedCP === null || !state.workingData) return;
    const origByte = state.originalData[state.selectedCP];
    const wasDiff  = state.workingData[state.selectedCP] !== origByte;
    state.workingData[state.selectedCP] = origByte;
    if (wasDiff) { state.modifiedCount--; updateStatusChanges(); }
    const { left, right } = parseGlyphByte(origByte);
    setSliders(left, right);
    renderPreview(state.selectedCP, left, right);
  }
```

- [ ] **Step 2: Open browser. Load .bin + PNG. Click a glyph — verify preview shows correct pixel art, sliders update bound lines in real time.**

- [ ] **Step 3: Move a slider and click Apply — verify status bar shows "Modified: 1 glyph". Click Reset — verify it goes back to 0.**

- [ ] **Step 4: Commit**

```bash
git add docs/index.html
git commit -m "add glyph editor panel with preview and sliders"
```

---

### Task 7: Download + Polish

**Files:**
- Modify: `docs/index.html` (add `downloadBin`, keyboard navigation)

- [ ] **Step 1: Add download function and keyboard navigation to the `<script>` block**

```js
  // ── Download ──────────────────────────────────────────────────
  function downloadBin() {
    if (!state.workingData) return;
    const blob = new Blob([state.workingData], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'glyph_sizes.bin';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Keyboard navigation (arrow keys to move between glyphs) ───
  document.addEventListener('keydown', (e) => {
    if (state.selectedCP === null || state.activePage === null) return;
    let delta = 0;
    if (e.key === 'ArrowRight') delta = 1;
    if (e.key === 'ArrowLeft')  delta = -1;
    if (e.key === 'ArrowDown')  delta = 16;
    if (e.key === 'ArrowUp')    delta = -16;
    if (delta === 0) return;
    e.preventDefault();
    const newCP = state.selectedCP + delta;
    const newPage = newCP >> 8;
    if (newPage !== state.activePage) return; // don't cross page boundaries with arrows
    if (newCP < 0 || newCP > 65535) return;
    selectGlyph(newCP);
  });
```

- [ ] **Step 2: Verify download works: load .bin, modify a glyph, click Download — confirm the file downloads and its size is exactly 65536 bytes.**

- [ ] **Step 3: Verify keyboard nav: click a glyph in the grid, press arrow keys — verify selection moves and editor updates.**

- [ ] **Step 4: Commit**

```bash
git add docs/index.html
git commit -m "add download and keyboard navigation"
```

---

### Task 8: GitHub Pages Setup

**Files:**
- Modify: `docs/index.html` (add meta description and viewport tag for public use)
- No new files needed — GitHub Pages serves `docs/` directly

- [ ] **Step 1: Add viewport and description meta tags to the `<head>` of docs/index.html**

Add inside `<head>` after `<meta charset="UTF-8">`:
```html
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Visual editor for Minecraft Unicode font glyph_sizes.bin files">
```

- [ ] **Step 2: Enable GitHub Pages in the repository settings**

Go to: Repository Settings → Pages → Source: "Deploy from a branch" → Branch: `main`, Folder: `/docs` → Save.

- [ ] **Step 3: Verify the page is live**

After a minute, open `https://eldrinn-elantey.github.io/GTNH-FTI-Standard-Font/` and confirm the editor loads.

- [ ] **Step 4: Final commit**

```bash
git add docs/index.html
git commit -m "add meta tags for GitHub Pages deployment"
```
