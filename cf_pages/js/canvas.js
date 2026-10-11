/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * 4-Color (BWRY) Paint Canvas Engine
 * Canvas Size: 768 × 552
 * Tools: Pen, Circle Pen, Line, Rect, Rect Fill, Circle, Circle Fill, Text, Eraser
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

const PaintCanvas = {
  canvas: null,
  ctx: null,
  width: 768,
  height: 552,

  // Tool & Palette state
  currentColor: '#000000',
  currentTool: 'pen', // 'pen' | 'line' | 'rect' | 'rect_fill' | 'circle' | 'circle_fill' | 'text' | 'eraser'
  lineWidth: 4,

  // Palette definitions
  PURE_COLORS: [
    { name: '纯黑 (Black)',   hex: '#000000' },
    { name: '纯红 (Red)',     hex: '#d32f2f' },
    { name: '纯黄 (Yellow)',  hex: '#f4c430' },
    { name: '纯白 (White)',   hex: '#ffffff' }
  ],

  PHYSICAL_PRESETS: [
    { name: '活力橙 (Orange)',    hex: '#ff8c00' },
    { name: '樱花粉 (Pink)',      hex: '#ff9999' },
    { name: '勃艮第红 (Maroon)',  hex: '#800000' },
    { name: '米白米黄 (Beige)',   hex: '#fff3cc' },
    { name: '橄榄绿 (Olive)',     hex: '#666600' },
    { name: '焦糖棕 (Brown)',     hex: '#8b4513' },
    { name: '10% 浅灰',          hex: '#e6e6e6' },
    { name: '25% 银灰',          hex: '#cccccc' },
    { name: '50% 中灰',          hex: '#808080' },
    { name: '75% 深灰',          hex: '#404040' }
  ],

  // Drawing state
  isDrawing: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  snapshot: null,

  // Undo / Redo history
  undoStack: [],
  redoStack: [],
  MAX_HISTORY: 25,

  init(canvasEl) {
    this.canvas = canvasEl;
    const isPortrait = typeof UI !== 'undefined' && (UI.orientation === 90 || UI.orientation === 270);
    this.width = isPortrait ? 552 : 768;
    this.height = isPortrait ? 768 : 552;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Initialize with white background
    this.clear(false);
    this.saveState();
    this.bindEvents();
  },

  setOrientation(angle) {
    const isPortrait = (angle === 90 || angle === 270);
    const targetW = isPortrait ? 552 : 768;
    const targetH = isPortrait ? 768 : 552;
    if (this.width === targetW && this.height === targetH) return;

    const oldW = this.width;
    const oldH = this.height;
    this.width = targetW;
    this.height = targetH;

    if (!this.canvas) return;

    // Snapshot existing drawing
    const temp = document.createElement('canvas');
    temp.width = oldW;
    temp.height = oldH;
    const tCtx = temp.getContext('2d');
    tCtx.drawImage(this.canvas, 0, 0);

    this.canvas.width = targetW;
    this.canvas.height = targetH;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Fill white
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, targetW, targetH);

    // Scale and center existing drawing into new orientation
    const scale = Math.min(targetW / oldW, targetH / oldH);
    const dw = oldW * scale;
    const dh = oldH * scale;
    const dx = (targetW - dw) / 2;
    const dy = (targetH - dh) / 2;
    this.ctx.drawImage(temp, dx, dy, dw, dh);

    this.undoStack = [];
    this.redoStack = [];
    this.saveState();
  },

  clear(save = true) {
    if (!this.ctx) return;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);
    if (save) this.saveState();
  },

  saveState() {
    if (!this.ctx) return;
    this.undoStack.push(this.ctx.getImageData(0, 0, this.width, this.height));
    if (this.undoStack.length > this.MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  },

  undo() {
    if (this.undoStack.length > 1) {
      this.redoStack.push(this.undoStack.pop());
      const state = this.undoStack[this.undoStack.length - 1];
      this.ctx.putImageData(state, 0, 0);
    }
  },

  redo() {
    if (this.redoStack.length > 0) {
      const state = this.redoStack.pop();
      this.undoStack.push(state);
      this.ctx.putImageData(state, 0, 0);
    }
  },

  setTool(tool) {
    this.currentTool = tool;
    if (typeof document !== 'undefined') {
      const select = document.getElementById('paintToolSelect');
      if (select && select.value !== tool) select.value = tool;
      document.querySelectorAll('.tool-btn').forEach(btn => {
        if (btn.getAttribute('data-tool') === tool) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  },

  setColor(color) {
    this.currentColor = color;
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.swatch-item, .color-swatch, .palette-btn').forEach(swatch => {
        const swatchColor = swatch.getAttribute('data-color') || swatch.style.backgroundColor;
        if (swatchColor && swatchColor.toLowerCase() === color.toLowerCase()) {
          swatch.classList.add('active');
        } else {
          swatch.classList.remove('active');
        }
      });
      const picker = document.getElementById('nativeColorPicker') || document.getElementById('paintCustomColor');
      if (picker && picker.value.toLowerCase() !== color.toLowerCase() && color.startsWith('#')) {
        picker.value = color;
      }
    }
  },

  setLineWidth(width) {
    const parsed = parseInt(width);
    const val = Math.max(1, Math.min(40, isNaN(parsed) ? 4 : parsed));
    this.lineWidth = val;
    if (typeof document !== 'undefined') {
      const slider = document.getElementById('paintLineWidth');
      if (slider && parseInt(slider.value) !== val) {
        slider.value = val;
      }
      const valBadge = document.getElementById('paintLineWidthVal');
      if (valBadge) {
        valBadge.textContent = `${val}px`;
      }
    }
  },

  addText(text, x = 40, y = 100, fontSize = null, fontFamily = 'sans-serif') {
    if (!text || !this.ctx) return;
    const size = fontSize || Math.max(20, Math.round(this.lineWidth * 5));
    this.ctx.font = `bold ${size}px ${fontFamily}`;
    this.ctx.fillStyle = this.currentColor;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, x, y);
    this.saveState();
  },

  bindEvents() {
    if (!this.canvas) return;

    // UI Synchronizations
    const toolSelect = document.getElementById('paintToolSelect');
    if (toolSelect && !toolSelect._bound) {
      toolSelect._bound = true;
      toolSelect.addEventListener('change', (e) => this.setTool(e.target.value));
    }

    const slider = document.getElementById('paintLineWidth');
    if (slider && !slider._bound) {
      slider._bound = true;
      slider.addEventListener('input', (e) => this.setLineWidth(e.target.value));
    }

    const picker = document.getElementById('nativeColorPicker') || document.getElementById('paintCustomColor');
    if (picker && !picker._bound) {
      picker._bound = true;
      picker.addEventListener('input', (e) => this.setColor(e.target.value));
    }

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: Math.round((clientX - rect.left) * scaleX),
        y: Math.round((clientY - rect.top) * scaleY)
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      const pos = getPos(e);
      this.startX = pos.x;
      this.startY = pos.y;
      this.lastX = pos.x;
      this.lastY = pos.y;

      // Handle Text tool click directly
      if (this.currentTool === 'text') {
        const text = prompt('请输入题字内容 (将在点击位置排版):', '3.98" BWRY');
        if (text) {
          this.addText(text, pos.x, pos.y);
        }
        return;
      }

      this.isDrawing = true;
      this.snapshot = this.ctx.getImageData(0, 0, this.width, this.height);

      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      if (this.currentTool === 'pen') {
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      } else if (this.currentTool === 'eraser') {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      }
    };

    const moveDraw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);

      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      if (this.currentTool === 'eraser') {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      } else if (this.currentTool === 'pen') {
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      } else {
        // Shape rubber-band preview: restore snapshot
        this.ctx.putImageData(this.snapshot, 0, 0);
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.fillStyle = this.currentColor;

        if (this.currentTool === 'line') {
          this.ctx.beginPath();
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
        } else if (this.currentTool === 'rect') {
          const w = pos.x - this.startX;
          const h = pos.y - this.startY;
          this.ctx.strokeRect(this.startX, this.startY, w, h);
        } else if (this.currentTool === 'rect_fill') {
          const w = pos.x - this.startX;
          const h = pos.y - this.startY;
          this.ctx.fillRect(this.startX, this.startY, w, h);
        } else if (this.currentTool === 'circle') {
          const rx = Math.abs(pos.x - this.startX) / 2;
          const ry = Math.abs(pos.y - this.startY) / 2;
          const cx = this.startX + (pos.x - this.startX) / 2;
          const cy = this.startY + (pos.y - this.startY) / 2;
          this.ctx.beginPath();
          this.ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
          this.ctx.stroke();
        } else if (this.currentTool === 'circle_fill') {
          const rx = Math.abs(pos.x - this.startX) / 2;
          const ry = Math.abs(pos.y - this.startY) / 2;
          const cx = this.startX + (pos.x - this.startX) / 2;
          const cy = this.startY + (pos.y - this.startY) / 2;
          this.ctx.beginPath();
          this.ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      this.lastX = pos.x;
      this.lastY = pos.y;
    };

    const endDraw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      this.isDrawing = false;
      this.saveState();
    };

    this.canvas.addEventListener('mousedown', startDraw);
    this.canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);

    this.canvas.addEventListener('touchstart', startDraw, { passive: false });
    this.canvas.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', endDraw, { passive: false });
  },

  getPacked2bpp(algo = 'floyd', options = {}) {
    if (!window.BWRY) throw new Error('BWRY dither engine not loaded');
    return window.BWRY.ditherCanvasTo2bpp(this.canvas, algo, options);
  },

  previewDither(algo = 'floyd', options = {}) {
    const modalCanvas = document.getElementById('ditherModalCanvas') || document.getElementById('modalPreviewCanvas');
    if (!modalCanvas) {
      console.warn('[PaintCanvas] Modal canvas not found');
      return;
    }
    const packed = this.getPacked2bpp(algo, options);
    window.BWRY.render2bppToCanvas(modalCanvas, packed);
    if (window.UI) {
      if (typeof window.UI.openDitherPreviewModal === 'function') {
        window.UI.openDitherPreviewModal(this.canvas, algo, options);
      } else if (typeof window.UI.openModal === 'function') {
        window.UI.openModal(document.getElementById('ditherPreviewModal') ? 'ditherPreviewModal' : 'presetPreviewModal');
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.PaintCanvas = PaintCanvas;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaintCanvas;
}
