# Glyph Size Editor — Design Spec

**Date:** 2026-05-19

## Overview

A single-file browser tool for editing `glyph_sizes.bin` from Minecraft Unicode font resource packs. The user uploads the bin file and PNG textures, edits glyph bounds visually, then downloads the modified bin. Deployed as a static page on GitHub Pages.

## Tech Stack

- Single `index.html`, vanilla JS, no build step, no dependencies
- Deployed to GitHub Pages (no server required)

## File Format

`glyph_sizes.bin` is 65536 bytes — one byte per Unicode codepoint.
Each byte: high nibble = left bound (0–15), low nibble = right bound (0–15), within a 16px-wide glyph cell.

Unicode page PNG files are 256×256 px, containing a 16×16 grid of 16×16 glyph cells.
Page number maps to codepoint range: page `XX` covers U+XX00–U+XXFF.

## Layout

Two-panel layout:

**Left panel — Glyph grid**
- Page selector tabs (only pages with a loaded PNG are shown)
- 16×16 grid of glyph cells; each cell renders the actual pixel art from the PNG texture using `canvas` or CSS `background-position`
- Selected glyph is highlighted with a colored border
- Clicking a cell selects it and updates the right panel

**Right panel — Glyph editor**
- Shows codepoint label (e.g. `U+002E · FULL STOP`)
- Large PNG preview (×8 zoom, pixel-perfect via `image-rendering: pixelated`)
- Two colored overlay lines on the preview: left bound (red) and right bound (blue), update live as sliders move
- Two sliders, range 0–15: left bound (red) and right bound (blue)
- Raw byte value in hex and glyph width in pixels shown below sliders
- "Reset" button (restore original value) and "Apply" button (write to buffer)

## File Loading

- `glyph_sizes.bin`: `<input type="file">`, read as `ArrayBuffer`, stored in a `Uint8Array`
- PNG pages: `<input type="file" multiple>`, matched by filename (`unicode_page_XX.png`), stored as `ImageBitmap` or `<img>` elements keyed by page index

## Saving

- "Download .bin" button creates a `Blob` from the `Uint8Array` and triggers a browser download
- Status bar shows count of modified glyphs

## State

- `originalData: Uint8Array` — unmodified copy for reset
- `workingData: Uint8Array` — live edits
- `pages: Map<number, ImageBitmap>` — loaded PNG pages keyed by page index
- `selectedCodepoint: number` — currently selected glyph

## Error Handling

- If no bin file loaded: disable grid and editor with a prompt to load files
- If PNG for a page is not loaded: show placeholder cells in the grid for that page
- Filename mismatch (e.g. wrong naming): show a warning, allow manual page assignment

## Deployment

- File lives at `docs/index.html` in this repository
- GitHub Pages configured to serve from `docs/` on `main` branch
- No build step needed
