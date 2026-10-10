/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * 4-Color (BWRY) Multi-Algorithm Dithering & 2bpp Bit-Packing Engine
 * Screen Specs: 768 × 552, 2bpp, 105,984 Bytes Framebuffer
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
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

  findNearestColor(r, g, b) {
    let bestDist = Infinity;
    let bestIdx = 1; // default to white

    for (let i = 0; i < 4; i++) {
      const p = BWRY.PALETTE[i].rgb;
      // Weighted Euclidean Distance matching human perception
      const dr = r - p[0];
      const dg = g - p[1];
      const db = b - p[2];
      const dist = (dr * dr * 0.299) + (dg * dg * 0.587) + (db * db * 0.114);

      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  },

  ditherCanvasTo2bpp(sourceCanvas, algo = 'floyd') {
    const w = BWRY.WIDTH;
    const h = BWRY.HEIGHT;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(sourceCanvas, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Buffer for error diffusion: 3 floats (r, g, b) per pixel
    const pixels = new Float32Array(w * h * 3);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      pixels[j]     = data[i];
      pixels[j + 1] = data[i + 1];
      pixels[j + 2] = data[i + 2];
    }

    const bayer4x4 = [
      [ 0/16,  8/16,  2/16, 10/16],
      [12/16,  4/16, 14/16,  6/16],
      [ 3/16, 11/16,  1/16,  9/16],
      [15/16,  7/16, 13/16,  5/16]
    ];

    const outIndices = new Uint8Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 3;
        let r = pixels[idx];
        let g = pixels[idx + 1];
        let b = pixels[idx + 2];

        if (algo === 'bayer') {
          const threshold = (bayer4x4[y % 4][x % 4] - 0.5) * 64;
          r = Math.min(255, Math.max(0, r + threshold));
          g = Math.min(255, Math.max(0, g + threshold));
          b = Math.min(255, Math.max(0, b + threshold));
        }

        const colorIdx = BWRY.findNearestColor(r, g, b);
        outIndices[y * w + x] = colorIdx;

        if (algo === 'floyd' || algo === 'atkinson') {
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
            diffuse(1, 0, 7 / 16);
            diffuse(-1, 1, 3 / 16);
            diffuse(0, 1, 5 / 16);
            diffuse(1, 1, 1 / 16);
          } else if (algo === 'atkinson') {
            diffuse(1, 0, 1 / 8);
            diffuse(2, 0, 1 / 8);
            diffuse(-1, 1, 1 / 8);
            diffuse(0, 1, 1 / 8);
            diffuse(1, 1, 1 / 8);
            diffuse(0, 2, 1 / 8);
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

  render2bppToCanvas(targetCanvas, packed2bpp) {
    const w = BWRY.WIDTH;
    const h = BWRY.HEIGHT;
    targetCanvas.width = w;
    targetCanvas.height = h;
    const ctx = targetCanvas.getContext('2d');
    const imgData = ctx.createImageData(w, h);
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
    ctx.putImageData(imgData, 0, 0);
  }
};

window.BWRY = BWRY;

