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
