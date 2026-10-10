/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * 4-Color (BWRY) Paint Canvas Engine
 * Canvas Size: 768 × 552
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

const PaintCanvas = {
  canvas: null,
  ctx: null,
  width: 768,
  height: 552,

  currentColor: '#000000',
  currentTool: 'pen', // 'pen' | 'line' | 'rect' | 'circle' | 'text' | 'eraser'
  lineWidth: 4,

  isDrawing: false,
  startX: 0,
  startY: 0,
  snapshot: null,

  undoStack: [],
  redoStack: [],
  MAX_HISTORY: 20,

  init(canvasEl) {
    this.canvas = canvasEl;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Initialize with white background
    this.clear(false);
    this.saveState();
    this.bindEvents();
  },

  clear(save = true) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.width, this.height);
    if (save) this.saveState();
  },

  saveState() {
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

  bindEvents() {
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
      this.isDrawing = true;
      const pos = getPos(e);
      this.startX = pos.x;
      this.startY = pos.y;
      this.snapshot = this.ctx.getImageData(0, 0, this.width, this.height);

      if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
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
        // Shapes preview with snapshot restoration
        this.ctx.putImageData(this.snapshot, 0, 0);
        this.ctx.strokeStyle = this.currentColor;

        if (this.currentTool === 'line') {
          this.ctx.beginPath();
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
        } else if (this.currentTool === 'rect') {
          const w = pos.x - this.startX;
          const h = pos.y - this.startY;
          this.ctx.strokeRect(this.startX, this.startY, w, h);
        } else if (this.currentTool === 'circle') {
          const rx = Math.abs(pos.x - this.startX) / 2;
          const ry = Math.abs(pos.y - this.startY) / 2;
          const cx = this.startX + (pos.x - this.startX) / 2;
          const cy = this.startY + (pos.y - this.startY) / 2;
          this.ctx.beginPath();
          this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          this.ctx.stroke();
        }
      }
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

  addText(text, x = 40, y = 100, fontSize = 36) {
    if (!text) return;
    this.ctx.font = `bold ${fontSize}px sans-serif`;
    this.ctx.fillStyle = this.currentColor;
    this.ctx.fillText(text, x, y);
    this.saveState();
  },

  getPacked2bpp() {
    return BWRY.ditherCanvasTo2bpp(this.canvas, 'floyd');
  }
};
