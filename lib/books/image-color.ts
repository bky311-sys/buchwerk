import "server-only";

import zlib from "node:zlib";

export type Rgb = { r: number; g: number; b: number };

// Average colour of a PNG (colour type 2/6, 8-bit, non-interlaced — what Flux
// outputs). Returns null on anything it can't safely decode, so callers fall
// back to a default. Used to tint the manuscript's back cover with the cover's
// main colour.
export function averagePngColor(png: Uint8Array): Rgb | null {
  try {
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) if (png[i] !== sig[i]) return null;

    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    let offset = 8;
    let width = 0;
    let height = 0;
    let colorType = 0;
    let bitDepth = 0;
    let interlace = 0;
    const idat: Uint8Array[] = [];

    while (offset < png.length) {
      const len = view.getUint32(offset);
      const type = String.fromCharCode(
        png[offset + 4],
        png[offset + 5],
        png[offset + 6],
        png[offset + 7],
      );
      const dataStart = offset + 8;
      if (type === "IHDR") {
        width = view.getUint32(dataStart);
        height = view.getUint32(dataStart + 4);
        bitDepth = png[dataStart + 8];
        colorType = png[dataStart + 9];
        interlace = png[dataStart + 12];
      } else if (type === "IDAT") {
        idat.push(png.subarray(dataStart, dataStart + len));
      } else if (type === "IEND") {
        break;
      }
      offset = dataStart + len + 4; // skip data + CRC
    }

    if (bitDepth !== 8 || interlace !== 0) return null;
    const channels = colorType === 2 ? 3 : colorType === 6 ? 4 : 0;
    if (!channels || !width || !height) return null;

    const compressed = Buffer.concat(idat.map((c) => Buffer.from(c)));
    const raw = zlib.inflateSync(compressed);

    const bpp = channels;
    const stride = width * bpp;
    const recon = new Uint8Array(height * stride);

    let pos = 0;
    for (let y = 0; y < height; y++) {
      const filter = raw[pos++];
      const rowStart = y * stride;
      const priorStart = (y - 1) * stride;
      for (let x = 0; x < stride; x++) {
        const rawByte = raw[pos++];
        const a = x >= bpp ? recon[rowStart + x - bpp] : 0; // left
        const b = y > 0 ? recon[priorStart + x] : 0; // up
        const c = x >= bpp && y > 0 ? recon[priorStart + x - bpp] : 0; // up-left
        let value: number;
        switch (filter) {
          case 0:
            value = rawByte;
            break;
          case 1:
            value = rawByte + a;
            break;
          case 2:
            value = rawByte + b;
            break;
          case 3:
            value = rawByte + ((a + b) >> 1);
            break;
          case 4: {
            const p = a + b - c;
            const pa = Math.abs(p - a);
            const pb = Math.abs(p - b);
            const pc = Math.abs(p - c);
            const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
            value = rawByte + pr;
            break;
          }
          default:
            return null;
        }
        recon[rowStart + x] = value & 0xff;
      }
    }

    // Average over a sample of pixels (every few pixels is plenty).
    let rs = 0;
    let gs = 0;
    let bs = 0;
    let count = 0;
    const step = Math.max(1, Math.floor((width * height) / 4000));
    for (let p = 0; p < width * height; p += step) {
      const idx = p * bpp;
      rs += recon[idx];
      gs += recon[idx + 1];
      bs += recon[idx + 2];
      count++;
    }
    if (!count) return null;
    return {
      r: rs / count / 255,
      g: gs / count / 255,
      b: bs / count / 255,
    };
  } catch {
    return null;
  }
}
