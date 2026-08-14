// Pure image-effect functions. Each takes a source canvas (already drawn with
// the working-resolution image) and a target canvas of the same dimensions,
// and paints the processed result onto the target's 2D context.

export type EffectId =
  | "halftone"
  | "pixelate"
  | "posterize"
  | "edge"
  | "vhs"
  | "lowpoly"
  | "charmosaic"
  | "blueprint"
  | "anaglyph"
  | "crossstitch"
  | "vignette"
  | "kaleidoscope"
  | "palette";

export interface EffectParams {
  // halftone
  haloCellSize: number;
  haloColor: string;
  // pixelate
  blockSize: number;
  // posterize
  posterLevels: number;
  // edge / sketch
  edgeThreshold: number;
  edgeInvert: boolean;
  // vhs / glitch
  vhsShift: number;
  vhsScanline: number;
  vhsNoise: number;
  // low-poly
  lowPolyGrid: number;
  // char mosaic
  charCellSize: number;
  charColored: boolean;
  // blueprint
  blueprintGrid: boolean;
  // anaglyph
  anaglyphOffset: number;
  // cross-stitch
  stitchCellSize: number;
  // vignette + grain
  vignetteStrength: number;
  grainAmount: number;
  // kaleidoscope
  kaleidoSegments: 2 | 4;
  // palette poster
  paletteColors: number;
}

export const DEFAULT_PARAMS: EffectParams = {
  haloCellSize: 10,
  haloColor: "#09090b",
  blockSize: 12,
  posterLevels: 4,
  edgeThreshold: 60,
  edgeInvert: false,
  vhsShift: 6,
  vhsScanline: 40,
  vhsNoise: 20,
  lowPolyGrid: 24,
  charCellSize: 10,
  charColored: true,
  blueprintGrid: true,
  anaglyphOffset: 6,
  stitchCellSize: 12,
  vignetteStrength: 60,
  grainAmount: 30,
  kaleidoSegments: 4,
  paletteColors: 5,
};

export const EFFECTS: { id: EffectId; label: string }[] = [
  { id: "halftone", label: "Halftone" },
  { id: "pixelate", label: "Pixelate" },
  { id: "posterize", label: "Posterize" },
  { id: "edge", label: "Edge / Sketch" },
  { id: "vhs", label: "VHS / Glitch" },
  { id: "lowpoly", label: "Low-Poly" },
  { id: "charmosaic", label: "Char Mosaic" },
  { id: "blueprint", label: "Blueprint" },
  { id: "anaglyph", label: "Anaglyph 3D" },
  { id: "crossstitch", label: "Cross-stitch" },
  { id: "vignette", label: "Vignette + Grain" },
  { id: "kaleidoscope", label: "Kaleidoscope" },
  { id: "palette", label: "Palette Poster" },
];

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, v));
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => clampByte(Math.round(v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");
  return ctx;
}

function copyDims(source: HTMLCanvasElement, target: HTMLCanvasElement) {
  target.width = source.width;
  target.height = source.height;
}

/** Mulberry32 seeded PRNG so noise-heavy effects stay deterministic per-frame. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// 1. Halftone
// ---------------------------------------------------------------------------
export function halftone(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const data = srcCtx.getImageData(0, 0, width, height).data;

  const ctx = getCtx(target);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = params.haloColor;

  const cell = Math.max(3, params.haloCellSize);
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      let sum = 0;
      let count = 0;
      for (let dy = 0; dy < cell && y + dy < height; dy++) {
        for (let dx = 0; dx < cell && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          sum += luminance(data[idx], data[idx + 1], data[idx + 2]);
          count++;
        }
      }
      const avg = count ? sum / count : 255;
      const darkness = 1 - avg / 255;
      const radius = (cell / 2) * Math.sqrt(darkness);
      if (radius > 0.3) {
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Pixelate / Mosaic
// ---------------------------------------------------------------------------
export function pixelate(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const block = Math.max(1, params.blockSize);
  const smallW = Math.max(1, Math.round(width / block));
  const smallH = Math.max(1, Math.round(height / block));

  const small = document.createElement("canvas");
  small.width = smallW;
  small.height = smallH;
  const smallCtx = getCtx(small);
  smallCtx.imageSmoothingEnabled = true;
  smallCtx.drawImage(source, 0, 0, smallW, smallH);

  const ctx = getCtx(target);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(small, 0, 0, smallW, smallH, 0, 0, width, height);
}

// ---------------------------------------------------------------------------
// 3. Posterize
// ---------------------------------------------------------------------------
export function posterize(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const imageData = srcCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const n = Math.max(2, Math.min(8, params.posterLevels));
  const step = 255 / (n - 1);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.round(data[i] / step) * step);
    data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
    data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
  }

  const ctx = getCtx(target);
  ctx.putImageData(imageData, 0, 0);
}

// ---------------------------------------------------------------------------
// 4. Edge / Sketch (Sobel)
// ---------------------------------------------------------------------------
export function edgeSketch(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const src = srcCtx.getImageData(0, 0, width, height);
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < src.data.length; i += 4, p++) {
    gray[p] = luminance(src.data[i], src.data[i + 1], src.data[i + 2]);
  }

  const out = getCtx(target).createImageData(width, height);
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sx = 0;
      let sy = 0;
      let k = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = Math.min(width - 1, Math.max(0, x + dx));
          const py = Math.min(height - 1, Math.max(0, y + dy));
          const v = gray[py * width + px];
          sx += v * gx[k];
          sy += v * gy[k];
          k++;
        }
      }
      const mag = Math.sqrt(sx * sx + sy * sy);
      const isEdge = mag > params.edgeThreshold;
      let value = isEdge ? 0 : 255;
      if (params.edgeInvert) value = 255 - value;
      const idx = (y * width + x) * 4;
      out.data[idx] = value;
      out.data[idx + 1] = value;
      out.data[idx + 2] = value;
      out.data[idx + 3] = 255;
    }
  }

  getCtx(target).putImageData(out, 0, 0);
}

// ---------------------------------------------------------------------------
// 5. VHS / Glitch
// ---------------------------------------------------------------------------
export function vhsGlitch(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const src = srcCtx.getImageData(0, 0, width, height);
  const out = getCtx(target).createImageData(width, height);
  const rng = makeRng(1337);

  const shift = Math.round(params.vhsShift);

  // Occasional row tears: a handful of rows get a large random horizontal jump.
  const tearRows = new Map<number, number>();
  const tearCount = Math.round(height * 0.03);
  for (let t = 0; t < tearCount; t++) {
    const row = Math.floor(rng() * height);
    tearRows.set(row, Math.round((rng() - 0.5) * width * 0.1));
  }

  for (let y = 0; y < height; y++) {
    const tear = tearRows.get(y) ?? 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const rx = Math.min(width - 1, Math.max(0, x - shift + tear));
      const bx = Math.min(width - 1, Math.max(0, x + shift + tear));
      const gx = Math.min(width - 1, Math.max(0, x + tear));

      const rIdx = (y * width + rx) * 4;
      const gIdx = (y * width + gx) * 4;
      const bIdx = (y * width + bx) * 4;

      out.data[idx] = src.data[rIdx];
      out.data[idx + 1] = src.data[gIdx + 1];
      out.data[idx + 2] = src.data[bIdx + 2];
      out.data[idx + 3] = 255;
    }
  }

  // Scanlines: darken every other row proportional to strength.
  const scanStrength = params.vhsScanline / 100;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      out.data[idx] *= 1 - scanStrength;
      out.data[idx + 1] *= 1 - scanStrength;
      out.data[idx + 2] *= 1 - scanStrength;
    }
  }

  // Random monochrome noise.
  const noiseAmt = params.vhsNoise;
  for (let i = 0; i < out.data.length; i += 4) {
    if (noiseAmt <= 0) break;
    const n = (rng() - 0.5) * noiseAmt * 2;
    out.data[i] = clampByte(out.data[i] + n);
    out.data[i + 1] = clampByte(out.data[i + 1] + n);
    out.data[i + 2] = clampByte(out.data[i + 2] + n);
  }

  getCtx(target).putImageData(out, 0, 0);
}

// ---------------------------------------------------------------------------
// 6. Low-Poly
// ---------------------------------------------------------------------------
export function lowPoly(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const src = srcCtx.getImageData(0, 0, width, height).data;
  const rng = makeRng(42);

  const cols = Math.max(2, params.lowPolyGrid);
  const cellW = width / cols;
  const rows = Math.max(2, Math.round(height / cellW));
  const cellH = height / rows;
  const jitter = Math.min(cellW, cellH) * 0.35;

  // Build a jittered grid of points (rows+1 by cols+1).
  const points: [number, number][][] = [];
  for (let ry = 0; ry <= rows; ry++) {
    const row: [number, number][] = [];
    for (let cx = 0; cx <= cols; cx++) {
      const edge = ry === 0 || ry === rows || cx === 0 || cx === cols;
      const jx = edge ? 0 : (rng() - 0.5) * jitter;
      const jy = edge ? 0 : (rng() - 0.5) * jitter;
      row.push([
        Math.min(width, Math.max(0, cx * cellW + jx)),
        Math.min(height, Math.max(0, ry * cellH + jy)),
      ]);
    }
    points.push(row);
  }

  function sampleColor(cx: number, cy: number): [number, number, number] {
    const px = Math.min(width - 1, Math.max(0, Math.round(cx)));
    const py = Math.min(height - 1, Math.max(0, Math.round(cy)));
    const idx = (py * width + px) * 4;
    return [src[idx], src[idx + 1], src[idx + 2]];
  }

  const ctx = getCtx(target);
  ctx.clearRect(0, 0, width, height);

  function drawTri(a: [number, number], b: [number, number], c: [number, number]) {
    const cx = (a[0] + b[0] + c[0]) / 3;
    const cy = (a[1] + b[1] + c[1]) / 3;
    const [r, g, bch] = sampleColor(cx, cy);
    ctx.fillStyle = `rgb(${r}, ${g}, ${bch})`;
    ctx.strokeStyle = `rgb(${r}, ${g}, ${bch})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  for (let ry = 0; ry < rows; ry++) {
    for (let cx = 0; cx < cols; cx++) {
      const p00 = points[ry][cx];
      const p10 = points[ry][cx + 1];
      const p01 = points[ry + 1][cx];
      const p11 = points[ry + 1][cx + 1];
      // Two triangles per cell, alternating the diagonal for variety.
      if ((ry + cx) % 2 === 0) {
        drawTri(p00, p10, p11);
        drawTri(p00, p11, p01);
      } else {
        drawTri(p00, p10, p01);
        drawTri(p10, p11, p01);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Char Mosaic
// ---------------------------------------------------------------------------
const CHAR_RAMP = " .:-=+*#%@";

export function charMosaic(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const src = srcCtx.getImageData(0, 0, width, height).data;

  const ctx = getCtx(target);
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, width, height);

  const cell = Math.max(4, params.charCellSize);
  ctx.font = `${cell}px var(--mono, monospace)`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;
      for (let dy = 0; dy < cell && y + dy < height; dy++) {
        for (let dx = 0; dx < cell && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          sumR += src[idx];
          sumG += src[idx + 1];
          sumB += src[idx + 2];
          count++;
        }
      }
      if (count === 0) continue;
      const r = sumR / count;
      const g = sumG / count;
      const b = sumB / count;
      const lum = luminance(r, g, b) / 255;
      const charIdx = Math.min(
        CHAR_RAMP.length - 1,
        Math.floor((1 - lum) * CHAR_RAMP.length)
      );
      const ch = CHAR_RAMP[charIdx];
      if (ch === " ") continue;

      ctx.fillStyle = params.charColored ? `rgb(${r}, ${g}, ${b})` : "#e4e4e7";
      ctx.fillText(ch, x, y);
    }
  }
}

// ---------------------------------------------------------------------------
// 8. Blueprint / Cyanotype
// ---------------------------------------------------------------------------
export function blueprint(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const imageData = srcCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const dark: [number, number, number] = [7, 28, 66];
  const light: [number, number, number] = [173, 226, 255];

  for (let i = 0; i < data.length; i += 4) {
    const lum = luminance(data[i], data[i + 1], data[i + 2]) / 255;
    data[i] = dark[0] + (light[0] - dark[0]) * lum;
    data[i + 1] = dark[1] + (light[1] - dark[1]) * lum;
    data[i + 2] = dark[2] + (light[2] - dark[2]) * lum;
  }

  const ctx = getCtx(target);
  ctx.putImageData(imageData, 0, 0);

  if (params.blueprintGrid) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    const step = Math.max(20, Math.round(Math.min(width, height) / 20));
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// 9. Anaglyph 3D
// ---------------------------------------------------------------------------
export function anaglyph(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const src = srcCtx.getImageData(0, 0, width, height);
  const out = getCtx(target).createImageData(width, height);
  const offset = Math.round(params.anaglyphOffset);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const rx = Math.min(width - 1, Math.max(0, x - offset));
      const cx = Math.min(width - 1, Math.max(0, x + offset));

      const rIdx = (y * width + rx) * 4;
      const cIdx = (y * width + cx) * 4;

      out.data[idx] = src.data[rIdx]; // red from shifted-left sample
      out.data[idx + 1] = src.data[cIdx + 1]; // green from shifted-right sample
      out.data[idx + 2] = src.data[cIdx + 2]; // blue from shifted-right sample
      out.data[idx + 3] = 255;
    }
  }

  getCtx(target).putImageData(out, 0, 0);
}

// ---------------------------------------------------------------------------
// 10. Cross-stitch
// ---------------------------------------------------------------------------
export function crossStitch(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const src = srcCtx.getImageData(0, 0, width, height).data;

  const ctx = getCtx(target);
  ctx.fillStyle = "#f4f0e6";
  ctx.fillRect(0, 0, width, height);

  const cell = Math.max(4, params.stitchCellSize);
  ctx.lineCap = "round";

  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;
      for (let dy = 0; dy < cell && y + dy < height; dy++) {
        for (let dx = 0; dx < cell && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          sumR += src[idx];
          sumG += src[idx + 1];
          sumB += src[idx + 2];
          count++;
        }
      }
      if (count === 0) continue;
      const r = sumR / count;
      const g = sumG / count;
      const b = sumB / count;

      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = Math.max(1.5, cell * 0.18);
      const pad = cell * 0.12;
      ctx.beginPath();
      ctx.moveTo(x + pad, y + pad);
      ctx.lineTo(x + cell - pad, y + cell - pad);
      ctx.moveTo(x + cell - pad, y + pad);
      ctx.lineTo(x + pad, y + cell - pad);
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// 11. Vignette + Film Grain
// ---------------------------------------------------------------------------
export function vignetteGrain(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const imageData = srcCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const rng = makeRng(7);

  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const strength = params.vignetteStrength / 100;
  const grain = params.grainAmount;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const vignette = 1 - strength * Math.pow(dist, 2);

      const noise = grain > 0 ? (rng() - 0.5) * grain : 0;

      data[idx] = clampByte(data[idx] * vignette + noise);
      data[idx + 1] = clampByte(data[idx + 1] * vignette + noise);
      data[idx + 2] = clampByte(data[idx + 2] * vignette + noise);
    }
  }

  const ctx = getCtx(target);
  ctx.putImageData(imageData, 0, 0);
}

// ---------------------------------------------------------------------------
// 12. Kaleidoscope / Mirror
// ---------------------------------------------------------------------------
export function kaleidoscope(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const ctx = getCtx(target);
  ctx.clearRect(0, 0, width, height);

  const halfW = width / 2;
  const halfH = height / 2;

  // Top-left quadrant of the source is the "seed" that gets mirrored out.
  // Draw seed into all four quadrants with appropriate flips.
  ctx.save();
  ctx.drawImage(source, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
  ctx.restore();

  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
  ctx.restore();

  ctx.save();
  ctx.translate(0, height);
  ctx.scale(1, -1);
  ctx.drawImage(source, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
  ctx.restore();

  ctx.save();
  ctx.translate(width, height);
  ctx.scale(-1, -1);
  ctx.drawImage(source, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
  ctx.restore();

  if (params.kaleidoSegments === 2) {
    // Additional pass: mirror left half over right half for a simpler 2-way symmetry.
    ctx.save();
    ctx.drawImage(target, 0, 0, halfW, height, 0, 0, halfW, height);
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(target, 0, 0, halfW, height, 0, 0, halfW, height);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 13. Palette Poster
// ---------------------------------------------------------------------------
function quantizeColors(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  k: number
): [number, number, number][] {
  // Simple k-means-ish clustering seeded from evenly spaced pixel samples.
  const samples: [number, number, number][] = [];
  const step = Math.max(1, Math.floor((width * height) / 2000));
  for (let p = 0; p < width * height; p += step) {
    const idx = p * 4;
    samples.push([data[idx], data[idx + 1], data[idx + 2]]);
  }
  if (samples.length === 0) return [[0, 0, 0]];

  const rng = makeRng(99);
  const centers: [number, number, number][] = [];
  for (let i = 0; i < k; i++) {
    centers.push(samples[Math.floor(rng() * samples.length)]);
  }

  for (let iter = 0; iter < 6; iter++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const s of samples) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const dr = s[0] - centers[c][0];
        const dg = s[1] - centers[c][1];
        const db = s[2] - centers[c][2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      sums[best][0] += s[0];
      sums[best][1] += s[1];
      sums[best][2] += s[2];
      sums[best][3] += 1;
    }
    for (let c = 0; c < centers.length; c++) {
      if (sums[c][3] > 0) {
        centers[c] = [
          sums[c][0] / sums[c][3],
          sums[c][1] / sums[c][3],
          sums[c][2] / sums[c][3],
        ];
      }
    }
  }

  // Sort darkest to lightest for a pleasant swatch order.
  return centers.sort((a, b) => luminance(a[0], a[1], a[2]) - luminance(b[0], b[1], b[2]));
}

export function palettePoster(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  copyDims(source, target);
  const { width, height } = target;
  const srcCtx = getCtx(source);
  const imageData = srcCtx.getImageData(0, 0, width, height);

  const k = Math.max(2, Math.min(8, params.paletteColors));
  const colors = quantizeColors(imageData.data, width, height, k);

  const ctx = getCtx(target);
  ctx.drawImage(source, 0, 0);

  const barHeight = Math.max(28, Math.round(height * 0.1));
  const barY = height - barHeight;
  const swatchW = width / colors.length;

  ctx.font = `${Math.max(9, Math.round(barHeight * 0.22))}px var(--mono, monospace)`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  colors.forEach((c, i) => {
    const x = i * swatchW;
    ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    ctx.fillRect(x, barY, swatchW, barHeight);

    const lum = luminance(c[0], c[1], c[2]);
    ctx.fillStyle = lum > 140 ? "#09090b" : "#fafafa";
    ctx.fillText(rgbToHex(c[0], c[1], c[2]), x + swatchW / 2, barY + barHeight / 2);
  });
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------
export function applyEffect(
  effect: EffectId,
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  params: EffectParams
) {
  switch (effect) {
    case "halftone":
      return halftone(source, target, params);
    case "pixelate":
      return pixelate(source, target, params);
    case "posterize":
      return posterize(source, target, params);
    case "edge":
      return edgeSketch(source, target, params);
    case "vhs":
      return vhsGlitch(source, target, params);
    case "lowpoly":
      return lowPoly(source, target, params);
    case "charmosaic":
      return charMosaic(source, target, params);
    case "blueprint":
      return blueprint(source, target, params);
    case "anaglyph":
      return anaglyph(source, target, params);
    case "crossstitch":
      return crossStitch(source, target, params);
    case "vignette":
      return vignetteGrain(source, target, params);
    case "kaleidoscope":
      return kaleidoscope(source, target, params);
    case "palette":
      return palettePoster(source, target, params);
  }
}

export function isPixelated(effect: EffectId): boolean {
  return effect === "pixelate" || effect === "crossstitch";
}
