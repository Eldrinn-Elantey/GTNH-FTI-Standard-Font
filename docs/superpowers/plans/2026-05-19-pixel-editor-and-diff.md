# Pixel Editor and Diff Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pixel-level glyph texture editor and a save/diff modal to the existing Glyph Size Editor web tool.

**Architecture:** All changes go into `docs/index.html` (single-file pattern already used by the project). Two `OffscreenCanvas` objects per PNG page hold pixel edits. Two modal overlays handle pixel editing and pre-download diff review.

**Tech Stack:** Vanilla JS, HTML5 Canvas API, no build tools.

---

## File Map

| File | Change |
|------|--------|
| `docs/index.html` | All new HTML, CSS, JS added here |
| `docs/glyph-utils.js` | No changes |

---

### Task 1: Extend state and PNG loading to populate `pageCanvases`

**Files:**
- Modify: `docs/index.html` (state object + PNG load handler)

**Context:** The `state` object is defined around line 148. The PNG load handler is at line 177. `pageCanvases` stores one `OffscreenCanvas(256, 256)` per page index; pixel edits go here. `modifiedPages` tracks which pages were pixel-edited.

- [ ] **Step 1: Add `pageCanvases` and `modifiedPages` to the state object**

Find the `state` object (around line 148):
```js
const state = {
  originalData: null,
  workingData:  null,
  pages:        new Map(),
  activePage:   null,
  selectedCP:   null,
  modifiedCount: 0,
};
```
Replace with:
```js
const state = {
  originalData:  null,
  workingData:   null,
  pages:         new Map(),
  pageCanvases:  new Map(),
  modifiedPages: new Set(),
  activePage:    null,
  selectedCP:    null,
  modifiedCount: 0,
};
```

- [ ] **Step 2: Draw each loaded PNG into an OffscreenCanvas**

Inside the PNG load handler, after `state.pages.set(pageIndex, bitmap);`, add:
```js
const oc = new OffscreenCanvas(256, 256);
oc.getContext('2d').drawImage(bitmap, 0, 0);
state.pageCanvases.set(pageIndex, oc);
```

- [ ] **Step 3: Verify manually**

Open `docs/index.html` in a browser. Load a `.bin` and a PNG. Open DevTools console, run:
```js
state.pageCanvases.size  // should equal number of loaded PNGs
state.modifiedPages.size // should be 0
```

- [ ] **Step 4: Commit**

```bash
git add docs/index.html
git commit -m "feat: add pageCanvases and modifiedPages to state"
```

---

### Task 2: Add modal CSS and HTML skeletons

**Files:**
- Modify: `docs/index.html` (CSS block + two modal divs in `<body>`)

**Context:** The CSS `<style>` block ends around line 71 before `</style>`. The `<body>` closing tag is at line 452.

- [ ] **Step 1: Add modal CSS before `</style>`**

```css
/* Modals */
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:100; }
.modal-backdrop.hidden { display:none; }
.modal-box { background:#16213e; border:1px solid #333; border-radius:6px; padding:16px; display:flex; flex-direction:column; gap:12px; max-height:90vh; overflow-y:auto; }
.modal-title { font-size:13px; color:#fff; font-weight:bold; }
.modal-section-label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
.modal-actions { display:flex; gap:8px; flex-wrap:wrap; }
#pixel-editor-canvas { image-rendering:pixelated; cursor:crosshair; border:1px solid #444; display:block; }
```

- [ ] **Step 2: Add pixel editor modal HTML before `</body>`**

```html
<!-- Pixel editor modal -->
<div id="modal-pixel-editor" class="modal-backdrop hidden">
  <div class="modal-box">
    <div class="modal-title" id="pixel-modal-title">Edit Pixels — U+????</div>
    <canvas id="pixel-editor-canvas" width="384" height="384"></canvas>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="savePixelEdits()">✓ Save</button>
      <button class="btn" onclick="closePixelEditor()">Cancel</button>
    </div>
  </div>
</div>

<!-- Save / diff modal -->
<div id="modal-save" class="modal-backdrop hidden">
  <div class="modal-box" style="min-width:320px">
    <div class="modal-title">Save — Review Changes</div>
    <div>
      <div class="modal-section-label">Glyph size changes</div>
      <div id="diff-size-list" style="font-size:11px;line-height:1.8;color:#ccc;max-height:200px;overflow-y:auto"></div>
    </div>
    <div>
      <div class="modal-section-label">Modified PNG pages</div>
      <div id="diff-png-list" style="font-size:11px;line-height:1.8;color:#ccc"></div>
    </div>
    <div class="modal-actions" id="save-modal-actions"></div>
    <button class="btn" onclick="closeSaveModal()" style="align-self:flex-start">Close</button>
  </div>
</div>
```

- [ ] **Step 3: Verify modals are hidden**

Open `docs/index.html` in browser. Page should look identical to before. No visible modal.

- [ ] **Step 4: Commit**

```bash
git add docs/index.html
git commit -m "feat: add modal HTML and CSS skeletons"
```

---

### Task 3: Add "Edit Pixels" button to the editor panel

**Files:**
- Modify: `docs/index.html` (HTML: editor panel; JS: `selectGlyph`, `clearEditor`)

**Context:** The editor panel is around lines 102–134. `selectGlyph()` enables buttons when a glyph is selected (~line 300). `clearEditor()` disables them (~line 323).

- [ ] **Step 1: Add the button in the editor panel HTML**

After the `<div id="preview-wrap">` block (after line ~113), add:
```html
<button class="btn" id="btn-edit-pixels" disabled onclick="openPixelEditor()" style="width:100%">✏ Edit Pixels</button>
```

- [ ] **Step 2: Enable the button in `selectGlyph()`**

After the line `document.getElementById('btn-apply').disabled = false;`, add:
```js
const hasCanvas = state.pageCanvases.has(state.selectedCP >> 8);
document.getElementById('btn-edit-pixels').disabled = !hasCanvas;
```

- [ ] **Step 3: Disable the button in `clearEditor()`**

After `document.getElementById('btn-apply').disabled = true;`, add:
```js
document.getElementById('btn-edit-pixels').disabled = true;
```

- [ ] **Step 4: Verify manually**

Open in browser. Load bin + PNG. Click a glyph — "Edit Pixels" button should become active. Click another page tab that has no PNG — button should be disabled.

- [ ] **Step 5: Commit**

```bash
git add docs/index.html
git commit -m "feat: add Edit Pixels button to editor panel"
```

---

### Task 4: Implement pixel editor open/close/draw logic

**Files:**
- Modify: `docs/index.html` (new JS functions in `<script>`)

**Context:** The pixel editor canvas is 384×384 px displaying a 16×16 glyph (24px per source pixel). On open, copy the glyph from `pageCanvases` into a scratch `OffscreenCanvas(16,16)` for editing. On save, write back.

- [ ] **Step 1: Add module-level scratch state for the pixel editor**

In the `<script>` block, after the `state` declaration, add:
```js
const pixelEditor = {
  scratch: null,  // OffscreenCanvas 16x16 with current edit
  pageIndex: null,
  glyphX: null,
  glyphY: null,
  painting: false,
  lastValue: null, // true = drawing white, false = erasing
};
```

- [ ] **Step 2: Add `openPixelEditor()` function**

```js
function openPixelEditor() {
  if (state.selectedCP === null) return;
  const pageIndex = state.selectedCP >> 8;
  const oc = state.pageCanvases.get(pageIndex);
  if (!oc) return;

  const { x, y } = getGlyphCellCoords(state.selectedCP);
  pixelEditor.pageIndex = pageIndex;
  pixelEditor.glyphX = x;
  pixelEditor.glyphY = y;

  // Copy glyph pixels into scratch canvas
  pixelEditor.scratch = new OffscreenCanvas(16, 16);
  pixelEditor.scratch.getContext('2d').drawImage(oc, x, y, 16, 16, 0, 0, 16, 16);

  document.getElementById('pixel-modal-title').textContent =
    'Edit Pixels — U+' + state.selectedCP.toString(16).toUpperCase().padStart(4, '0');
  document.getElementById('modal-pixel-editor').classList.remove('hidden');
  renderPixelEditorCanvas();
}
```

- [ ] **Step 3: Add `renderPixelEditorCanvas()` function**

```js
function renderPixelEditorCanvas() {
  const canvas = document.getElementById('pixel-editor-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  // Checkerboard background to show transparency
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(0, 0, 384, 384);
  ctx.fillStyle = '#222233';
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      if ((r + c) % 2 === 0) ctx.fillRect(c * 24, r * 24, 24, 24);
    }
  }
  // Draw glyph pixels
  ctx.drawImage(pixelEditor.scratch, 0, 0, 16, 16, 0, 0, 384, 384);
  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 16; i++) {
    const p = i * 24;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 384); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(384, p); ctx.stroke();
  }
}
```

- [ ] **Step 4: Add `closePixelEditor()` function**

```js
function closePixelEditor() {
  document.getElementById('modal-pixel-editor').classList.add('hidden');
  pixelEditor.scratch = null;
}
```

- [ ] **Step 5: Verify visually**

Open browser, load bin + PNG, select a glyph, click "Edit Pixels". Modal should open showing the 16×16 glyph on a checkerboard background with a grid. Cancel should close it.

- [ ] **Step 6: Commit**

```bash
git add docs/index.html
git commit -m "feat: implement pixel editor open/close/render"
```

---

### Task 5: Implement pencil drawing in the pixel editor

**Files:**
- Modify: `docs/index.html` (JS: mouse event listeners on `#pixel-editor-canvas`)

**Context:** Click determines initial pixel value (toggle: white → transparent, transparent → white). Drag paints with the same value set on the initial click.

- [ ] **Step 1: Add helper `getPixelEditorCell(e)` to get row/col from mouse event**

```js
function getPixelEditorCell(e) {
  const canvas = document.getElementById('pixel-editor-canvas');
  const rect = canvas.getBoundingClientRect();
  const col = Math.floor((e.clientX - rect.left) / 24);
  const row = Math.floor((e.clientY - rect.top)  / 24);
  if (col < 0 || col > 15 || row < 0 || row > 15) return null;
  return { col, row };
}
```

- [ ] **Step 2: Add helper `paintPixel(col, row)` to toggle/set a pixel**

```js
function paintPixel(col, row) {
  const ctx = pixelEditor.scratch.getContext('2d');
  if (pixelEditor.lastValue) {
    ctx.clearRect(col, row, 1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(col, row, 1, 1);
  } else {
    ctx.clearRect(col, row, 1, 1);
  }
  renderPixelEditorCanvas();
}
```

- [ ] **Step 3: Add mouse event listeners for the pixel editor canvas**

```js
document.getElementById('pixel-editor-canvas').addEventListener('mousedown', (e) => {
  if (!pixelEditor.scratch) return;
  const cell = getPixelEditorCell(e);
  if (!cell) return;
  // Determine draw vs erase from the current pixel alpha
  const px = pixelEditor.scratch.getContext('2d').getImageData(cell.col, cell.row, 1, 1).data;
  pixelEditor.lastValue = px[3] < 128; // transparent → draw white; white → erase
  pixelEditor.painting = true;
  paintPixel(cell.col, cell.row);
  e.preventDefault();
});

document.getElementById('pixel-editor-canvas').addEventListener('mousemove', (e) => {
  if (!pixelEditor.painting || !pixelEditor.scratch) return;
  const cell = getPixelEditorCell(e);
  if (cell) paintPixel(cell.col, cell.row);
});

document.addEventListener('mouseup', () => { pixelEditor.painting = false; });
```

- [ ] **Step 4: Verify drawing**

Open browser, open pixel editor for a glyph. Click and drag — white pixels should appear/disappear. Release and drag — nothing should happen.

- [ ] **Step 5: Commit**

```bash
git add docs/index.html
git commit -m "feat: implement pencil drawing in pixel editor"
```

---

### Task 6: Implement `savePixelEdits()`

**Files:**
- Modify: `docs/index.html` (JS: `savePixelEdits` function)

**Context:** On save, write the 16×16 scratch back into the full page `OffscreenCanvas`, mark the page modified, regenerate the `ImageBitmap` in `state.pages`, and refresh the grid and preview.

- [ ] **Step 1: Add `savePixelEdits()` function**

```js
async function savePixelEdits() {
  const { pageIndex, glyphX, glyphY, scratch } = pixelEditor;
  if (!scratch) return;

  // Write scratch back into the full page canvas
  const oc = state.pageCanvases.get(pageIndex);
  const octx = oc.getContext('2d');
  octx.clearRect(glyphX, glyphY, 16, 16);
  octx.drawImage(scratch, 0, 0, 16, 16, glyphX, glyphY, 16, 16);

  state.modifiedPages.add(pageIndex);

  // Regenerate ImageBitmap so grid and preview reflect changes
  const newBitmap = await createImageBitmap(oc);
  state.pages.set(pageIndex, newBitmap);

  closePixelEditor();
  renderGrid(pageIndex);
  if (state.selectedCP !== null) {
    const { left, right } = parseGlyphByte(state.workingData[state.selectedCP]);
    renderPreview(state.selectedCP, left, right);
  }
}
```

- [ ] **Step 2: Verify save**

Open browser, edit pixels in a glyph, click Save. The grid and preview should update immediately. Open DevTools console: `state.modifiedPages.size` should be 1.

- [ ] **Step 3: Commit**

```bash
git add docs/index.html
git commit -m "feat: implement savePixelEdits writing back to pageCanvases"
```

---

### Task 7: Replace Download button with Save modal

**Files:**
- Modify: `docs/index.html` (HTML: toolbar button; JS: `openSaveModal`, `closeSaveModal`, `downloadPng`)

**Context:** The toolbar button `#btn-download` currently calls `downloadBin()` directly. Change it to open the save modal. The modal populates two lists and renders download buttons dynamically.

- [ ] **Step 1: Change toolbar button label and onclick**

Find:
```html
<button class="btn btn-primary" id="btn-download" disabled onclick="downloadBin()">💾 Download .bin</button>
```
Replace with:
```html
<button class="btn btn-primary" id="btn-download" disabled onclick="openSaveModal()">💾 Save</button>
```

- [ ] **Step 2: Add `openSaveModal()` function**

```js
function openSaveModal() {
  // Populate size diff list
  const sizeList = document.getElementById('diff-size-list');
  if (!state.workingData) { sizeList.textContent = 'No file loaded.'; }
  else {
    const diffs = [];
    for (let cp = 0; cp < 65536; cp++) {
      if (state.workingData[cp] !== state.originalData[cp]) {
        const orig = parseGlyphByte(state.originalData[cp]);
        const curr = parseGlyphByte(state.workingData[cp]);
        const origW = Math.max(0, orig.right - orig.left + 1);
        const currW = Math.max(0, curr.right - curr.left + 1);
        let label = '';
        try { label = ' "' + String.fromCodePoint(cp) + '"'; } catch {}
        diffs.push('U+' + cp.toString(16).toUpperCase().padStart(4, '0') + label +
          '  —  ' + origW + ' → ' + currW + ' px');
      }
    }
    sizeList.innerHTML = diffs.length
      ? diffs.map(d => '<div>' + d + '</div>').join('')
      : '<span style="color:#555">No size changes</span>';
  }

  // Populate modified PNG list
  const pngList = document.getElementById('diff-png-list');
  if (state.modifiedPages.size === 0) {
    pngList.innerHTML = '<span style="color:#555">No pixel changes</span>';
  } else {
    pngList.innerHTML = [...state.modifiedPages]
      .sort((a, b) => a - b)
      .map(idx => {
        const name = 'unicode_page_' + idx.toString(16).toUpperCase().padStart(2, '0') + '.png';
        return '<div style="color:#00b4d8">' + name + ' <span style="color:#555">[modified]</span></div>';
      }).join('');
  }

  // Build action buttons
  const actions = document.getElementById('save-modal-actions');
  actions.innerHTML = '';

  const btnBin = document.createElement('button');
  btnBin.className = 'btn btn-primary';
  btnBin.textContent = '💾 Download .bin';
  btnBin.onclick = downloadBin;
  actions.appendChild(btnBin);

  [...state.modifiedPages].sort((a, b) => a - b).forEach(idx => {
    const hex = idx.toString(16).toUpperCase().padStart(2, '0');
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = '🖼 Download PNG [' + hex + ']';
    btn.onclick = () => downloadPng(idx);
    actions.appendChild(btn);
  });

  document.getElementById('modal-save').classList.remove('hidden');
}
```

- [ ] **Step 3: Add `closeSaveModal()` function**

```js
function closeSaveModal() {
  document.getElementById('modal-save').classList.add('hidden');
}
```

- [ ] **Step 4: Add `downloadPng()` function**

```js
function downloadPng(pageIndex) {
  const oc = state.pageCanvases.get(pageIndex);
  if (!oc) return;
  const hex = pageIndex.toString(16).toUpperCase().padStart(2, '0');
  oc.convertToBlob({ type: 'image/png' }).then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'unicode_page_' + hex + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 100);
  });
}
```

- [ ] **Step 5: Verify full flow**

Open browser, load bin + PNGs, make some size changes, edit pixels on one glyph. Click "Save". Modal should show the list of size-changed glyphs and the modified PNG page. "Download .bin" and "Download PNG [XX]" buttons should trigger downloads. Downloaded PNG should reflect pixel edits.

- [ ] **Step 6: Commit**

```bash
git add docs/index.html
git commit -m "feat: add save/diff modal with bin and PNG downloads"
```

---

### Task 8: Close modals on backdrop click + keyboard Escape

**Files:**
- Modify: `docs/index.html` (JS: event listeners)

- [ ] **Step 1: Add backdrop-click and Escape to close pixel editor modal**

```js
document.getElementById('modal-pixel-editor').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closePixelEditor();
});
```

- [ ] **Step 2: Add backdrop-click and Escape to close save modal**

```js
document.getElementById('modal-save').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeSaveModal();
});
```

- [ ] **Step 3: Add Escape key handler**

Inside the existing `document.addEventListener('keydown', ...)` handler, before the arrow-key logic, add:

```js
if (e.key === 'Escape') {
  if (!document.getElementById('modal-pixel-editor').classList.contains('hidden')) {
    closePixelEditor(); return;
  }
  if (!document.getElementById('modal-save').classList.contains('hidden')) {
    closeSaveModal(); return;
  }
}
```

- [ ] **Step 4: Verify**

Open each modal, click the dark backdrop → should close. Press Escape → should close.

- [ ] **Step 5: Commit**

```bash
git add docs/index.html
git commit -m "feat: close modals on backdrop click and Escape key"
```
