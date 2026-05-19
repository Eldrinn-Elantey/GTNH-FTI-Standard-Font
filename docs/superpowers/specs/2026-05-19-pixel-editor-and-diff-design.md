# Pixel Editor and Diff Modal — Design Spec

**Date:** 2026-05-19

## Overview

Two new features added to the existing single-page Glyph Size Editor (`docs/index.html`):

1. **Pixel Editor** — modal window for editing the 16×16 pixel texture of a selected glyph
2. **Save/Diff Modal** — modal shown before downloading, listing all changes to glyph sizes and modified PNG pages

Both are implemented directly in `docs/index.html` (no new files), following the existing single-file pattern.

## State Changes

Add two fields to the existing `state` object:

- `pageCanvases: Map<pageIndex, OffscreenCanvas>` — one canvas per loaded PNG page; pixel edits are written here
- `modifiedPages: Set<pageIndex>` — tracks which pages have pixel edits (need PNG re-export)

Existing fields (`originalData`, `workingData`, `pages`, `modifiedCount`) are unchanged.

When a PNG is loaded, its bitmap is drawn into a new `OffscreenCanvas(256, 256)` stored in `pageCanvases`. The existing `pages` map (ImageBitmap) is kept for grid rendering.

## Feature 1: Pixel Editor Modal

### Trigger

A button "✏ Edit Pixels" is added to the right editor panel, below the preview section. It is disabled when no glyph is selected or when the page has no PNG loaded.

### Modal layout

- Dark backdrop overlay
- Canvas displaying the 16×16 glyph at ~24px per pixel (384×384 display size)
- Pencil tool only: click or click-drag toggles pixels
  - White opaque pixel (`rgba(255,255,255,255)`) → fully transparent (`rgba(0,0,0,0)`)
  - Transparent pixel → white opaque
- Two buttons: **Save** and **Cancel**

### Save behavior

- Writes the edited pixels back into `pageCanvases.get(pageIndex)`
- Adds `pageIndex` to `modifiedPages`
- Regenerates `pages.get(pageIndex)` ImageBitmap from the updated `OffscreenCanvas` via `createImageBitmap()`
- Refreshes the grid and preview canvases for the affected page

### Cancel behavior

- Discards all edits made in the modal; no state changes

## Feature 2: Save/Diff Modal

### Trigger

The existing "Download .bin" button is renamed to "💾 Save" and now opens this modal instead of directly downloading.

### Modal layout

Two sections:

**Glyph size changes** — list of codepoints where `workingData[cp] !== originalData[cp]`:
```
U+0041 "A"  —  width 3 → 5 px
U+0042 "B"  —  width 2 → 4 px
```
If no size changes: shows "No size changes".

**Modified PNG pages** — list of pages in `modifiedPages`:
```
unicode_page_04.png  [modified]
```
If no pixel edits: shows "No pixel changes".

### Download buttons

- **Download .bin** — always shown if bin is loaded; triggers existing `downloadBin()` logic
- **Download PNG [XX]** — one button per page in `modifiedPages`; exports via `canvas.toBlob('image/png')` and triggers download as `unicode_page_XX.png`
- **Close** — dismisses modal

If nothing is loaded, the Save button remains disabled (same as current Download button behavior).

## Implementation Approach

All changes go into `docs/index.html`. Estimated size: ~450 lines → ~900 lines.

New HTML: two `<div id="modal-pixel-editor">` and `<div id="modal-save">` appended to `<body>`, hidden by default.

New CSS: modal backdrop and container styles, pixel editor canvas cursor.

New JS functions:
- `openPixelEditor()` / `closePixelEditor()`
- `savePixelEdits()`
- `openSaveModal()` / `closeSaveModal()`
- `downloadPng(pageIndex)`
- PNG loading updated to also populate `pageCanvases`

No changes to `glyph-utils.js`.
