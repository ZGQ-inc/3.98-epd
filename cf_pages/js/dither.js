/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * 4-Color (BWRY) Multi-Algorithm Dithering & 2bpp Bit-Packing Engine
 * Screen Specs: 768 × 552, 2bpp, 105,984 Bytes Framebuffer
 * Algorithms: Floyd-Steinberg, Atkinson, Microsoft 8x8 GDI, Stucki, Burkes, Sierra, Ostromoukhov, Bayer 4x4, Threshold
 * Copyright (c) 2026 ZGQ Inc. Licensed under the MIT License.
 */

const BWRY = {
  WIDTH: 768,
  HEIGHT: 552,
  BUFFER_SIZE: (768 * 552) / 4, // 105,984 bytes

  PALETTE: [
    { name: 'black',  rgb: [0, 0, 0],       val: 0, hex: '#000000' },
    { name: 'white',  rgb: [255, 255, 255], val: 1, hex: '#ffffff' },
    { name: 'yellow', rgb: [244, 196, 48],  val: 2, hex: '#f4c430' },
    { name: 'red',    rgb: [211, 47, 47],   val: 3, hex: '#d32f2f' }
  ],

  ALGORITHMS: [
    { id: 'floyd',        name: 'Floyd-Steinberg 误差扩散 (平滑过渡)',       type: 'error_diffusion' },
    { id: 'atkinson',     name: 'Atkinson (复古 Mac 高对比度)',             type: 'error_diffusion' },
    { id: 'microsoft',    name: 'Microsoft 8×8 GDI (经典 Win95 复古像素)',   type: 'ordered' },
    { id: 'stucki',       name: 'Stucki 误差扩散 (细节细腻锐利)',            type: 'error_diffusion' },
    { id: 'burkes',       name: 'Burkes 误差扩散 (快速高保真)',              type: 'error_diffusion' },
    { id: 'sierra',       name: 'Sierra 误差扩散 (三行平衡扩散)',            type: 'error_diffusion' },
    { id: 'ostromoukhov', name: 'Ostromoukhov (动态变系数抗蠕虫)',          type: 'error_diffusion' },
    { id: 'bayer',        name: 'Bayer 4×4 有序半色调',                     type: 'ordered' },
    { id: 'threshold',    name: 'Threshold (纯阈值硬边缘)',                 type: 'threshold' }
  ],

  findNearestColor(r, g, b, redBoost = 1.0, yellowBoost = 1.0) {
    let bestDist = Infinity;
    let bestIdx = 1; // default to white

    for (let i = 0; i < 4; i++) {
      const p = BWRY.PALETTE[i].rgb;
      // Weighted Euclidean Distance matching human perception (Luma coefficients)
      const dr = r - p[0];
      const dg = g - p[1];
      const db = b - p[2];
      let dist = (dr * dr * 0.299) + (dg * dg * 0.587) + (db * db * 0.114);

      // Color sensitivity / boost: dividing squared distance scales perceptual distance
      if (i === 3 && redBoost && redBoost !== 1.0) {
        dist /= (redBoost * redBoost);
      } else if (i === 2 && yellowBoost && yellowBoost !== 1.0) {
        dist /= (yellowBoost * yellowBoost);
      }

      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  },

  // Ostromoukhov dynamic diffusion coefficients calculator
  getOstromoukhovWeights(r, g, b) {
    // Relative perceptual luminance in [0, 1]
    const lum = Math.min(255, Math.max(0, r * 0.299 + g * 0.587 + b * 0.114));
    const v = lum / 255.0;
    // By symmetry of halftoning under tone inversion, weights mirror around 0.5
    const t = v > 0.5 ? 1.0 - v : v;

    let d1, d2, d3;
    if (t <= 0.10) {
      const f = t / 0.10;
      d1 = (13 / 18) * (1 - f) + 0.64 * f;
      d2 = 0.00      * (1 - f) + 0.08 * f;
      d3 = (5 / 18)  * (1 - f) + 0.28 * f;
    } else if (t <= 0.25) {
      const f = (t - 0.10) / 0.15;
      d1 = 0.64 * (1 - f) + 0.52 * f;
      d2 = 0.08 * (1 - f) + 0.18 * f;
      d3 = 0.28 * (1 - f) + 0.30 * f;
    } else {
      const f = (t - 0.25) / 0.25;
      d1 = 0.52 * (1 - f) + 0.44 * f;
      d2 = 0.18 * (1 - f) + 0.26 * f;
      d3 = 0.30 * (1 - f) + 0.30 * f;
    }
    return { d1, d2, d3 };
  },

  ditherCanvasTo2bpp(sourceCanvas, algo = 'floyd', options = {}) {
    if (typeof options === 'number') {
      options = { contrast: options };
    }
    const contrast = (typeof options.contrast === 'number') ? Math.max(-50, Math.min(50, options.contrast)) : 15;
    const redBoost = (typeof options.redBoost === 'number') ? Math.max(0.1, Math.min(3.0, options.redBoost)) : 1.0;
    const yellowBoost = (typeof options.yellowBoost === 'number') ? Math.max(0.1, Math.min(3.0, options.yellowBoost)) : 1.0;

    const w = BWRY.WIDTH;
    const h = BWRY.HEIGHT;

    const angle = options.orientation !== undefined
      ? options.orientation
      : (typeof UI !== 'undefined' ? UI.orientation : 0);

    let ctx;
    let data;

    if (typeof document !== 'undefined') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      if (angle === 90) {
        // Rotate 90 deg clockwise into physical 768x552 buffer
        ctx.translate(w, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(sourceCanvas, 0, 0);
      } else if (angle === 180) {
        // Rotate 180 deg into physical 768x552 buffer
        ctx.translate(w, h);
        ctx.rotate(Math.PI);
        ctx.drawImage(sourceCanvas, 0, 0);
      } else if (angle === 270) {
        // Rotate 270 deg (90 CCW) into physical 768x552 buffer
        ctx.translate(0, h);
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(sourceCanvas, 0, 0);
      } else {
        // 0 deg: 1:1 direct mapping
        ctx.drawImage(sourceCanvas, 0, 0, w, h);
      }
      ctx.restore();

      data = ctx.getImageData(0, 0, w, h).data;
    } else if (sourceCanvas && sourceCanvas.getContext) {
      ctx = sourceCanvas.getContext('2d');
      data = ctx.getImageData(0, 0, w, h).data;
    } else {
      throw new Error('Canvas or Context not available');
    }

    // Contrast adjustment factor:
    // factor = (259 * (contrast * 2.55 + 255)) / (255 * (259 - contrast * 2.55))
    const contrastScale = contrast * 2.55;
    const contrastFactor = (259 * (contrastScale + 255)) / (255 * (259 - contrastScale));

    // Buffer for error diffusion: 3 floats (r, g, b) per pixel
    const pixels = new Float32Array(w * h * 3);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      const a = data[i + 3];

      // Alpha blend against white background if translucent
      if (a < 255) {
        const alpha = a / 255;
        r = r * alpha + 255 * (1 - alpha);
        g = g * alpha + 255 * (1 - alpha);
        b = b * alpha + 255 * (1 - alpha);
      }

      if (contrast !== 0) {
        r = Math.min(255, Math.max(0, 128 + contrastFactor * (r - 128)));
        g = Math.min(255, Math.max(0, 128 + contrastFactor * (g - 128)));
        b = Math.min(255, Math.max(0, 128 + contrastFactor * (b - 128)));
      }

      pixels[j]     = r;
      pixels[j + 1] = g;
      pixels[j + 2] = b;
    }

    // Bayer 4x4 matrix
    const bayer4x4 = [
      [ 0/16,  8/16,  2/16, 10/16],
      [12/16,  4/16, 14/16,  6/16],
      [ 3/16, 11/16,  1/16,  9/16],
      [15/16,  7/16, 13/16,  5/16]
    ];

    // Microsoft GDI 8x8 ordered dither matrix
    const microsoft8x8 = [
      [ 0, 32,  8, 40,  2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44,  4, 36, 14, 46,  6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [ 3, 35, 11, 43,  1, 33,  9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47,  7, 39, 13, 45,  5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21]
    ];

    const outIndices = new Uint8Array(w * h);

    // Dither processing
    for (let y = 0; y < h; y++) {
      const isOstro = (algo === 'ostromoukhov');
      const isOddRow = isOstro && (y % 2 === 1);
      const xStart = isOddRow ? w - 1 : 0;
      const xEnd   = isOddRow ? -1 : w;
      const xStep  = isOddRow ? -1 : 1;

      for (let x = xStart; x !== xEnd; x += xStep) {
        const idx = (y * w + x) * 3;
        let r = pixels[idx];
        let g = pixels[idx + 1];
        let b = pixels[idx + 2];

        // 1. Threshold / Ordered Half-tone Modulation
        if (algo === 'bayer') {
          const threshold = (bayer4x4[y % 4][x % 4] - 0.5) * 64;
          r = Math.min(255, Math.max(0, r + threshold));
          g = Math.min(255, Math.max(0, g + threshold));
          b = Math.min(255, Math.max(0, b + threshold));
        } else if (algo === 'microsoft') {
          const threshold = ((microsoft8x8[y % 8][x % 8] + 0.5) / 64 - 0.5) * 64;
          r = Math.min(255, Math.max(0, r + threshold));
          g = Math.min(255, Math.max(0, g + threshold));
          b = Math.min(255, Math.max(0, b + threshold));
        }

        // 2. Quantization to nearest 4-color palette
        const colorIdx = BWRY.findNearestColor(r, g, b, redBoost, yellowBoost);
        outIndices[y * w + x] = colorIdx;

        // 3. Error Diffusion Propagation
        if (algo !== 'threshold' && algo !== 'bayer' && algo !== 'microsoft') {
          const targetRGB = BWRY.PALETTE[colorIdx].rgb;
          const er = r - targetRGB[0];
          const eg = g - targetRGB[1];
          const eb = b - targetRGB[2];

          const diffuse = (dx, dy, factor) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = (ny * w + nx) * 3;
              pixels[nIdx]     += er * factor;
              pixels[nIdx + 1] += eg * factor;
              pixels[nIdx + 2] += eb * factor;
            }
          };

          if (algo === 'floyd') {
            // Floyd-Steinberg (1976)
            diffuse( 1, 0, 7 / 16);
            diffuse(-1, 1, 3 / 16);
            diffuse( 0, 1, 5 / 16);
            diffuse( 1, 1, 1 / 16);
          } else if (algo === 'atkinson') {
            // Bill Atkinson (1984, Mac) - 3/4 error diffusion retains high contrast
            diffuse( 1, 0, 1 / 8);
            diffuse( 2, 0, 1 / 8);
            diffuse(-1, 1, 1 / 8);
            diffuse( 0, 1, 1 / 8);
            diffuse( 1, 1, 1 / 8);
            diffuse( 0, 2, 1 / 8);
          } else if (algo === 'stucki') {
            // Peter Stucki (1981) - 42 divisor, sharp & crisp
            diffuse( 1, 0, 8 / 42);
            diffuse( 2, 0, 4 / 42);
            diffuse(-2, 1, 2 / 42);
            diffuse(-1, 1, 4 / 42);
            diffuse( 0, 1, 8 / 42);
            diffuse( 1, 1, 4 / 42);
            diffuse( 2, 1, 2 / 42);
            diffuse(-2, 2, 1 / 42);
            diffuse(-1, 2, 2 / 42);
            diffuse( 0, 2, 4 / 42);
            diffuse( 1, 2, 2 / 42);
            diffuse( 2, 2, 1 / 42);
          } else if (algo === 'burkes') {
            // Daniel Burkes (1988) - 32 divisor, 2-line fast & high-fidelity
            diffuse( 1, 0, 8 / 32);
            diffuse( 2, 0, 4 / 32);
            diffuse(-2, 1, 2 / 32);
            diffuse(-1, 1, 4 / 32);
            diffuse( 0, 1, 8 / 32);
            diffuse( 1, 1, 4 / 32);
            diffuse( 2, 1, 2 / 32);
          } else if (algo === 'sierra') {
            // Frankie Sierra (1989, Sierra-3) - 32 divisor, 3-line balanced
            diffuse( 1, 0, 5 / 32);
            diffuse( 2, 0, 3 / 32);
            diffuse(-2, 1, 2 / 32);
            diffuse(-1, 1, 4 / 32);
            diffuse( 0, 1, 5 / 32);
            diffuse( 1, 1, 4 / 32);
            diffuse( 2, 1, 2 / 32);
            diffuse(-1, 2, 2 / 32);
            diffuse( 0, 2, 3 / 32);
            diffuse( 1, 2, 2 / 32);
          } else if (algo === 'ostromoukhov') {
            // Victor Ostromoukhov (SIGGRAPH 2001) - Variable coefficient serpentine blue noise
            const weights = BWRY.getOstromoukhovWeights(r, g, b);
            if (!isOddRow) {
              // Left to right
              diffuse( 1, 0, weights.d1);
              diffuse(-1, 1, weights.d2);
              diffuse( 0, 1, weights.d3);
            } else {
              // Right to left (serpentine)
              diffuse(-1, 0, weights.d1);
              diffuse( 1, 1, weights.d2);
              diffuse( 0, 1, weights.d3);
            }
          }
        }
      }
    }

    // Pack 4 pixels per byte into 2bpp binary format (105,984 bytes)
    const packed = new Uint8Array(BWRY.BUFFER_SIZE);
    for (let i = 0; i < outIndices.length; i += 4) {
      const b0 = outIndices[i];
      const b1 = outIndices[i + 1] !== undefined ? outIndices[i + 1] : 1;
      const b2 = outIndices[i + 2] !== undefined ? outIndices[i + 2] : 1;
      const b3 = outIndices[i + 3] !== undefined ? outIndices[i + 3] : 1;
      packed[i >> 2] = (b0 << 6) | (b1 << 4) | (b2 << 2) | b3;
    }

    return packed;
  },

  render2bppToCanvas(targetCanvas, packed2bpp, orientation = 0) {
    const w = BWRY.WIDTH; // 768
    const h = BWRY.HEIGHT; // 552

    // Offscreen 768x552 unrotated physical bitmap
    let offscreen;
    if (typeof document !== 'undefined') {
      offscreen = document.createElement('canvas');
    } else {
      offscreen = targetCanvas;
    }
    offscreen.width = w;
    offscreen.height = h;
    const oCtx = offscreen.getContext('2d');
    const imgData = oCtx.createImageData(w, h);
    const data = imgData.data;

    let pixelIdx = 0;
    for (let i = 0; i < packed2bpp.length; i++) {
      const byte = packed2bpp[i];
      const p0 = (byte >> 6) & 0x03;
      const p1 = (byte >> 4) & 0x03;
      const p2 = (byte >> 2) & 0x03;
      const p3 = byte & 0x03;

      const pixels = [p0, p1, p2, p3];
      for (let k = 0; k < 4; k++) {
        if (pixelIdx >= w * h) break;
        const c = BWRY.PALETTE[pixels[k]].rgb;
        const dIdx = pixelIdx * 4;
        data[dIdx]     = c[0];
        data[dIdx + 1] = c[1];
        data[dIdx + 2] = c[2];
        data[dIdx + 3] = 255;
        pixelIdx++;
      }
    }
    oCtx.putImageData(imgData, 0, 0);

    if (offscreen === targetCanvas) return;

    // View orientation: rotate back to user's desired display mode
    const isPortrait = (orientation === 90 || orientation === 270);
    const targetW = isPortrait ? 552 : 768;
    const targetH = isPortrait ? 768 : 552;

    targetCanvas.width = targetW;
    targetCanvas.height = targetH;
    const tCtx = targetCanvas.getContext('2d');
    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 0, targetW, targetH);

    tCtx.save();
    if (orientation === 90) {
      // 90 deg view: rotate physical 768x552 counter-clockwise into 552x768
      tCtx.translate(0, targetH);
      tCtx.rotate(-Math.PI / 2);
      tCtx.drawImage(offscreen, 0, 0);
    } else if (orientation === 180) {
      // 180 deg view
      tCtx.translate(targetW, targetH);
      tCtx.rotate(Math.PI);
      tCtx.drawImage(offscreen, 0, 0);
    } else if (orientation === 270) {
      // 270 deg view
      tCtx.translate(targetW, 0);
      tCtx.rotate(Math.PI / 2);
      tCtx.drawImage(offscreen, 0, 0);
    } else {
      // 0 deg view
      tCtx.drawImage(offscreen, 0, 0);
    }
    tCtx.restore();
  }
};

if (typeof window !== 'undefined') {
  window.BWRY = BWRY;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BWRY;
}
