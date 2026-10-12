/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Ita-Bag Charm Studio (痛卡随身挂饰工坊)
 * High-precision 768×552 BWRY Canvas Rendering Engine
 * Copyright (c) 2026 ZGQ Inc. Licensed under the MIT License.
 */

(function (window) {
  'use strict';

  const ItaBagStudio = {
    canvas: null,
    ctx: null,
    userImage: null,

    config: {
      scale: 1.0,           // 0.5 ~ 2.5
      offsetX: 0,           // -300 ~ +300 px
      offsetY: 0,           // -300 ~ +300 px
      title: '初音未来 / Hatsune Miku',
      source: 'VOCALOID',
      quote: '用歌声连接整个世界的奇迹！',
      style: 'bubble',      // 'bubble' | 'banner'
      borderStyle: 'charm', // 'charm' | 'stars'
      showLanyard: true     // Top lanyard hanging hole
    },

    COLORS: {
      RED: '#d32f2f',
      YELLOW: '#f4c430',
      BLACK: '#000000',
      WHITE: '#ffffff'
    },

    /**
     * Initialize Ita-Bag Studio: Bind canvas & input event listeners
     */
    init() {
      console.log('[ItaBagStudio] Initializing Ita-Bag Charm Studio...');

      this.canvas = document.getElementById('itaPreviewCanvas');
      if (!this.canvas) {
        console.warn('[ItaBagStudio] #itaPreviewCanvas not found in DOM yet; creating fallback canvas.');
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'itaPreviewCanvas';
      }
      this.canvas.width = 768;
      this.canvas.height = 552;
      this.ctx = this.canvas.getContext('2d');

      const fileInputs = [
        document.getElementById('itaUploadInput'),
        document.getElementById('itaImageInput'),
        document.getElementById('itaFileInput'),
        document.querySelector('.itabag-file-input')
      ].filter(Boolean);

      fileInputs.forEach(input => {
        input.addEventListener('change', (e) => this.handleImageUpload(e));
      });

      const dropZones = [
        document.querySelector('.itabag-upload-zone'),
        document.querySelector('.file-drop-area'),
        this.canvas.parentElement
      ].filter(Boolean);

      dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
          e.preventDefault();
          zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => {
          zone.classList.remove('dragover');
        });
        zone.addEventListener('drop', (e) => {
          e.preventDefault();
          zone.classList.remove('dragover');
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
            this.handleImageUpload(e.dataTransfer.files[0]);
          }
        });
      });

      const scaleInputs = [
        document.getElementById('itaScaleInput'),
        document.getElementById('itaScaleSlider'),
        document.getElementById('itaScale'),
        document.querySelector('.itabag-slider')
      ].filter(Boolean);

      scaleInputs.forEach(slider => {
        slider.addEventListener('input', (e) => {
          this.config.scale = parseFloat(e.target.value) || 1.0;
          this._updateScaleDisplay();
          this.renderPreview();
        });
      });

      const titleInputs = [
        document.getElementById('itaTitleInput'),
        document.getElementById('itaCharName'),
        document.getElementById('itaNameInput'),
        document.getElementById('itaTitle')
      ].filter(Boolean);

      titleInputs.forEach(input => {
        input.addEventListener('input', (e) => {
          this.config.title = e.target.value;
          this.renderPreview();
        });
      });

      const sourceInputs = [
        document.getElementById('itaSourceInput'),
        document.getElementById('itaWorkInput'),
        document.getElementById('itaSource')
      ].filter(Boolean);

      sourceInputs.forEach(input => {
        input.addEventListener('input', (e) => {
          this.config.source = e.target.value;
          this.renderPreview();
        });
      });

      const quoteInputs = [
        document.getElementById('itaQuoteInput'),
        document.getElementById('itaDialogueInput'),
        document.getElementById('itaQuote')
      ].filter(Boolean);

      quoteInputs.forEach(input => {
        input.addEventListener('input', (e) => {
          this.config.quote = e.target.value;
          this.renderPreview();
        });
      });

      const styleSelects = [
        document.getElementById('itaBubbleSelect'),
        document.getElementById('itaStyleSelect'),
        document.getElementById('itaBubbleStyle')
      ].filter(Boolean);

      styleSelects.forEach(sel => {
        sel.addEventListener('change', (e) => {
          this.config.style = e.target.value;
          this.renderPreview();
        });
      });

      const borderSelects = [
        document.getElementById('itaBorderSelect'),
        document.getElementById('itaBorderStyle')
      ].filter(Boolean);

      borderSelects.forEach(sel => {
        sel.addEventListener('change', (e) => {
          this.config.borderStyle = e.target.value;
          this.renderPreview();
        });
      });

      if (document.getElementById('itaTitle')?.value) this.config.title = document.getElementById('itaTitle').value;
      if (document.getElementById('itaSource')?.value) this.config.source = document.getElementById('itaSource').value;
      if (document.getElementById('itaQuote')?.value) this.config.quote = document.getElementById('itaQuote').value;
      if (document.getElementById('itaScaleInput')?.value) this.config.scale = parseFloat(document.getElementById('itaScaleInput').value) || 1.0;
      if (document.getElementById('itaStyleSelect')?.value) this.config.style = document.getElementById('itaStyleSelect').value;
      if (document.getElementById('itaBorderSelect')?.value) this.config.borderStyle = document.getElementById('itaBorderSelect').value;

      document.getElementById('itaZoomInBtn')?.addEventListener('click', () => {
        this.config.scale = Math.min(4.0, (this.config.scale || 1.0) * 1.15);
        this._updateScaleDisplay();
        this.renderPreview();
      });

      document.getElementById('itaZoomOutBtn')?.addEventListener('click', () => {
        this.config.scale = Math.max(0.2, (this.config.scale || 1.0) * 0.85);
        this._updateScaleDisplay();
        this.renderPreview();
      });

      document.getElementById('itaResetTransformBtn')?.addEventListener('click', () => {
        this.config.scale = 1.0;
        this.config.offsetX = 0;
        this.config.offsetY = 0;
        this._updateScaleDisplay();
        this.renderPreview();
        if (window.UI?.showToast) window.UI.showToast('立绘已重置为居中自适应');
      });

      const canvas = this.canvas;
      if (canvas) {
        let isDragging = false;
        let startX = 0, startY = 0;
        let startOffX = 0, startOffY = 0;
        let activePointerId = null;

        canvas.addEventListener('pointerdown', (e) => {
          if (!this.userImage) {
            const fileInput = document.getElementById('itaUploadInput');
            if (fileInput) fileInput.click();
            return;
          }
          e.preventDefault();
          isDragging = true;
          activePointerId = e.pointerId;
          startX = e.clientX;
          startY = e.clientY;
          startOffX = this.config.offsetX || 0;
          startOffY = this.config.offsetY || 0;
          try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
          canvas.style.cursor = 'grabbing';
        });

        canvas.addEventListener('pointermove', (e) => {
          if (!isDragging) return;
          e.preventDefault();
          const rect = canvas.getBoundingClientRect();
          const scaleRatioX = canvas.width / rect.width;
          const scaleRatioY = canvas.height / rect.height;
          this.config.offsetX = startOffX + (e.clientX - startX) * scaleRatioX;
          this.config.offsetY = startOffY + (e.clientY - startY) * scaleRatioY;
          this.renderPreview();
        });

        const stopDrag = (e) => {
          if (isDragging) {
            isDragging = false;
            canvas.style.cursor = 'grab';
            if (activePointerId !== null) {
              try { canvas.releasePointerCapture(activePointerId); } catch (_) {}
              activePointerId = null;
            }
          }
        };
        canvas.addEventListener('pointerup', stopDrag);
        canvas.addEventListener('pointercancel', stopDrag);

        canvas.addEventListener('wheel', (e) => {
          if (!this.userImage) return;
          e.preventDefault();
          const delta = e.deltaY < 0 ? 1.08 : 0.92;
          this.config.scale = Math.min(4.0, Math.max(0.2, (this.config.scale || 1.0) * delta));
          this._updateScaleDisplay();
          this.renderPreview();
        }, { passive: false });
      }

      document.getElementById('itaResetBtn')?.addEventListener('click', () => {
        this.reset();
      });

      window.addEventListener('tabchange', (e) => {
        if (e.detail && e.detail.tabId === 'itabag') {
          this.renderPreview();
        }
      });

      this._updateScaleDisplay();
      this.renderPreview();
      console.log('[ItaBagStudio] Ready!');
    },

    /**
     * Handle user image upload (PNG / JPG / WEBP)
     * @param {Event|File} event
     */
    handleImageUpload(event) {
      const file = event && event.target ? (event.target.files && event.target.files[0]) : event;
      if (!file) return;

      if (!file.type.match(/^image\//i)) {
        if (window.UI?.showToast) {
          window.UI.showToast('请上传有效的图片文件 (PNG / JPG / WEBP)', 'warning');
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const img = new Image();
        img.onload = () => {
          this.userImage = img;
          this.config.offsetX = 0;
          this.config.offsetY = 0;
          this.config.scale = 1.0;
          this._updateScaleDisplay();
          if (window.UI?.showToast) {
            window.UI.showToast(`角色立绘「${file.name}」已载入 (${img.width}×${img.height})`, 'success', 2500);
          }
          this.renderPreview();
        };
        img.onerror = () => {
          if (window.UI?.showToast) {
            window.UI.showToast('立绘加载失败，请检查文件格式', 'error');
          }
        };
        img.src = loadEvent.target.result;
      };
      reader.readAsDataURL(file);
    },

    /**
     * Render Ita-Bag Charm to 768×552 BWRY Canvas
     */
    renderPreview() {
      if (!this.canvas) {
        this.canvas = document.getElementById('itaPreviewCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
      }

      const canvas = this.canvas;
      const ctx = this.ctx || canvas.getContext('2d');
      const isPortrait = typeof UI !== 'undefined' && (UI.orientation === 90 || UI.orientation === 270);
      const w = isPortrait ? 552 : 768;
      const h = isPortrait ? 768 : 552;
      canvas.width = w;
      canvas.height = h;

      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      const { scale, offsetX, offsetY, title, source, quote, style } = this.config;

      ctx.fillStyle = WHITE;
      ctx.fillRect(0, 0, w, h);

      if (this.userImage) {
        ctx.save();
        const isClean = (style === 'clean' || style === 'none');
        const clipX = 16;
        const clipY = 58;
        const clipW = w - 32;
        const clipH = isClean 
          ? (h - 72)
          : (isPortrait ? (h - 210) : 456);

        ctx.beginPath();
        this._roundRect(ctx, clipX, clipY, clipW, clipH, 12);
        ctx.clip();

        const targetViewH = isClean 
          ? (h - 76) 
          : (isPortrait ? (h - 220) : 340);
        const baseScale = Math.min((clipW - 16) / this.userImage.width, targetViewH / this.userImage.height);
        const totalScale = baseScale * (scale || 1.0);

        const cx = (w / 2) + (offsetX || 0);
        const cy = isClean 
          ? ((clipY + clipH / 2) + (offsetY || 0))
          : ((isPortrait ? 330 : 230) + (offsetY || 0));

        ctx.translate(cx, cy);
        ctx.scale(totalScale, totalScale);
        ctx.drawImage(this.userImage, -this.userImage.width / 2, -this.userImage.height / 2);
        ctx.restore();
      } else {
        this._drawPlaceholder(ctx, w, h, isPortrait);
      }

      this._drawBottomBanner(ctx, w, h, isPortrait);

      this._drawTopBanner(ctx, w, h);

      this._drawBadgeDecorations(ctx, w, h);

      this._drawFooterSpec(ctx, w, h);
    },

    /**
     * Draw cute anime chibi avatar placeholder when no user image uploaded
     */
    _drawPlaceholder(ctx, w = 768, h = 552, isPortrait = false) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      const cardX = isPortrait ? 20 : 24;
      const cardY = 68;
      const cardW = w - (cardX * 2);
      const cardH = isPortrait ? (h - 225) : 345;
      const cx = w / 2;
      const cy = cardY + cardH / 2;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cardX, cardY, cardW, cardH);

      ctx.strokeStyle = '#f0f0f2';
      ctx.lineWidth = 1;
      for (let x = cardX; x <= cardX + cardW; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, cardY);
        ctx.lineTo(x, cardY + cardH);
        ctx.stroke();
      }
      for (let y = cardY; y <= cardY + cardH; y += 36) {
        ctx.beginPath();
        ctx.moveTo(cardX, y);
        ctx.lineTo(cardX + cardW, y);
        ctx.stroke();
      }

      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 3;
      ctx.strokeRect(cardX + 8, cardY + 8, cardW - 16, cardH - 16);

      const cornerLen = 28;
      const bx = cardX + 8;
      const by = cardY + 8;
      const bw = cardW - 16;
      const bh = cardH - 16;

      ctx.lineWidth = 5;
      ctx.strokeStyle = RED;
      ctx.beginPath();
      ctx.moveTo(bx + cornerLen, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + cornerLen);
      ctx.stroke();

      ctx.strokeStyle = YELLOW;
      ctx.beginPath();
      ctx.moveTo(bx + bw - cornerLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cornerLen);
      ctx.stroke();

      ctx.strokeStyle = YELLOW;
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - cornerLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerLen, by + bh);
      ctx.stroke();

      ctx.strokeStyle = RED;
      ctx.beginPath();
      ctx.moveTo(bx + bw - cornerLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerLen);
      ctx.stroke();

      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.arc(cx - 140, cy - 35, 6, 0, Math.PI * 2);
      ctx.arc(cx + 140, cy - 35, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = YELLOW;
      ctx.fillRect(cx - 130, cy - 78, 260, 8);

      ctx.fillStyle = BLACK;
      ctx.font = '900 68px "Arial Black", "Impact", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OC PIC', cx, cy - 36);

      ctx.fillStyle = RED;
      ctx.fillRect(cx - 130, cy + 4, 260, 8);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
      ctx.fillText('[ 角色立绘 · 谷美相片 · 随身痛卡 ]', cx, cy + 42);

      ctx.fillStyle = '#000000';
      this._roundRect(ctx, cx - 170, cy + 72, 340, 38, 19, true, false);

      ctx.fillStyle = YELLOW;
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
      ctx.fillText('📷 点击此处或拖拽上传角色立绘照片', cx, cy + 92);

      ctx.fillStyle = '#777777';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText('支持透明 PNG / JPG / WEBP · 画布手势直接拖拽平移与自由缩放', cx, cy + 128);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    },

    /**
     * Draw Top Banner
     */
    _drawTopBanner(ctx, w = 768, h = 552) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      const sourceText = this.config.source ? this.config.source.trim() : '谷美痛包 / ITA-BAG';

      ctx.fillStyle = RED;
      this._roundRect(ctx, 16, 12, w - 32, 46, { tl: 10, tr: 10, bl: 0, br: 0 }, true, false);

      ctx.fillStyle = YELLOW;
      ctx.fillRect(16, 56, w - 32, 4);

      ctx.fillStyle = WHITE;
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('🎒 痛卡挂饰 · ', 28, 42);

      const titleWidth = ctx.measureText('🎒 痛卡挂饰 · ').width;
      ctx.fillStyle = YELLOW;
      ctx.fillText(sourceText, 28 + titleWidth, 42);

      ctx.fillStyle = BLACK;
      this._roundRect(ctx, w - 146, 20, 118, 28, 14, true, false);
      ctx.fillStyle = YELLOW;
      ctx.font = 'bold 13px monospace';
      ctx.fillText('3.98" BWRY', w - 130, 39);

      if (this.config.showLanyard) {
        const lx = w / 2;
        const ly = 24;

        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.arc(lx, ly, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lx, ly, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(lx, ly, 6.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(lx, 10);
        ctx.lineTo(lx, 0);
        ctx.stroke();
      }
    },

    /**
     * Draw Bottom subtitle banner or comic speech bubble
     */
    _drawBottomBanner(ctx, w = 768, h = 552, isPortrait = false) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      const charName = this.config.title ? this.config.title.trim() : '角色立绘';
      const quoteText = this.config.quote ? this.config.quote.trim() : '专属台词 / 签名题字';
      const style = this.config.style;

      if (style === 'clean' || style === 'none') {
        const px = isPortrait ? 20 : 28;
        const py = h - 46;
        const sourceText = this.config.source ? this.config.source.trim() : '';
        const tagText = '★ ' + charName + (sourceText ? ` · ${sourceText}` : '');
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        const tw = ctx.measureText(tagText).width;
        ctx.fillStyle = BLACK;
        this._roundRect(ctx, px, py - 4, tw + 24, 26, 13, true, false);
        ctx.fillStyle = YELLOW;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, px + 12, py + 9);
        ctx.textBaseline = 'alphabetic';
        return;
      }

      const isBubble = style === 'bubble';

      if (isBubble) {
        const bx = isPortrait ? 20 : 36;
        const bw = isPortrait ? (w - 40) : 696;
        const by = isPortrait ? (h - 150) : 398;
        const bh = isPortrait ? 122 : 112;

        ctx.fillStyle = WHITE;
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 3.5;
        this._roundRect(ctx, bx, by, bw, bh, 16, true, true);

        const tailX = w / 2;
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.moveTo(tailX - 16, by);
        ctx.lineTo(tailX, by - 16);
        ctx.lineTo(tailX + 16, by);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(tailX - 16, by);
        ctx.lineTo(tailX, by - 16);
        ctx.lineTo(tailX + 16, by);
        ctx.stroke();

        ctx.fillStyle = WHITE;
        ctx.fillRect(tailX - 14, by - 1, 28, 4);

        ctx.fillStyle = RED;
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 2.5;
        this._roundRect(ctx, bx + 16, by - 14, 210, 30, 15, true, true);

        ctx.fillStyle = WHITE;
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText('★ ' + charName, bx + 28, by + 6);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        this._wrapText(ctx, `「${quoteText}」`, bx + 24, by + 46, bw - 48, 26, 2);

      } else {
        const px = isPortrait ? 16 : 28;
        const pw = isPortrait ? (w - 32) : 712;
        const py = isPortrait ? (h - 148) : 400;
        const ph = isPortrait ? 120 : 112;

        ctx.fillStyle = WHITE;
        ctx.strokeStyle = RED;
        ctx.lineWidth = 3.5;
        this._roundRect(ctx, px, py, pw, ph, 12, true, true);

        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 4;
        const cl = 16;
        // TL
        ctx.beginPath(); ctx.moveTo(px + 4, py + 4 + cl); ctx.lineTo(px + 4, py + 4); ctx.lineTo(px + 4 + cl, py + 4); ctx.stroke();
        // TR
        ctx.beginPath(); ctx.moveTo(px + pw - 4 - cl, py + 4); ctx.lineTo(px + pw - 4, py + 4); ctx.lineTo(px + pw - 4, py + 4 + cl); ctx.stroke();
        // BL
        ctx.beginPath(); ctx.moveTo(px + 4, py + ph - 4 - cl); ctx.lineTo(px + 4, py + ph - 4); ctx.lineTo(px + 4 + cl, py + ph - 4); ctx.stroke();
        // BR
        ctx.beginPath(); ctx.moveTo(px + pw - 4 - cl, py + ph - 4); ctx.lineTo(px + pw - 4, py + ph - 4); ctx.lineTo(px + pw - 4, py + ph - 4 - cl); ctx.stroke();

        ctx.fillStyle = RED;
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText('★ ' + charName, px + 20, py + 36);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 14px -apple-system, sans-serif';
        ctx.fillText('【' + (this.config.source || 'VOCALOID') + '】', px + 20 + ctx.measureText('★ ' + charName).width + 10, py + 34);

        ctx.fillStyle = BLACK;
        ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        this._wrapText(ctx, `“ ${quoteText} ”`, px + 20, py + 72, pw - 40, 24, 2);
      }
    },

    /**
     * Draw four corner decorative badge marks & protective acrylic border
     */
    _drawBadgeDecorations(ctx, w = 768, h = 552) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;

      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 3;
      this._roundRect(ctx, 8, 8, w - 16, h - 16, 14, false, true);

      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 1.5;
      this._roundRect(ctx, 12, 12, w - 24, h - 24, 12, false, true);

      const corners = [
        { x: 26, y: 26 },
        { x: w - 26, y: 26 },
        { x: 26, y: h - 26 },
        { x: w - 26, y: h - 26 }
      ];

      if (this.config.borderStyle === 'stars') {
        corners.forEach(c => {
          ctx.fillStyle = RED;
          ctx.strokeStyle = YELLOW;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = YELLOW;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', c.x, c.y);
        });
      } else {
        corners.forEach(c => {
          ctx.fillStyle = YELLOW;
          ctx.strokeStyle = BLACK;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = BLACK;
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', c.x, c.y);
        });
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    },

    /**
     * Draw bottom spec footer bar
     */
    _drawFooterSpec(ctx, w = 768, h = 552) {
      const { BLACK } = this.COLORS;
      ctx.fillStyle = BLACK;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('3.98" BWRY EPD ITA-BAG CHARM · ZGQ Inc. · 零功耗双稳态随身谷美挂饰', w / 2, h - 10);
      ctx.textAlign = 'left';
    },

    /**
     * Update scale slider text badge if element exists
     */
    _updateScaleDisplay() {
      const pct = Math.round((this.config.scale || 1.0) * 100);
      const val = `${pct}%`;
      const slider = document.getElementById('itaScaleInput');
      if (slider) slider.value = (this.config.scale || 1.0);
      const badge = document.getElementById('itaZoomBadge');
      if (badge) badge.textContent = val;
      document.querySelectorAll('#itaScaleVal, #itaScaleValue, .ita-scale-val').forEach(el => {
        el.textContent = val;
      });
    },

    /**
     * Word wrapping helper for Canvas 2D
     */
    _wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
      const words = String(text || '').split('');
      let line = '';
      let currentY = y;
      let lineCount = 1;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          if (lineCount >= maxLines) {
            ctx.fillText(line + '...', x, currentY);
            return;
          }
          ctx.fillText(line, x, currentY);
          line = words[n];
          currentY += lineHeight;
          lineCount++;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
    },

    /**
     * Rounded rectangle drawing helper
     */
    _roundRect(ctx, x, y, w, h, r, fill = false, stroke = false) {
      if (typeof r === 'number') {
        r = { tl: r, tr: r, br: r, bl: r };
      } else {
        r = Object.assign({ tl: 0, tr: 0, br: 0, bl: 0 }, r);
      }
      ctx.beginPath();
      ctx.moveTo(x + r.tl, y);
      ctx.lineTo(x + w - r.tr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
      ctx.lineTo(x + w, y + h - r.br);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
      ctx.lineTo(x + r.bl, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
      ctx.lineTo(x, y + r.tl);
      ctx.quadraticCurveTo(x, y, x + r.tl, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    },

    /**
     * Returns the target canvas (#itaPreviewCanvas)
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
      if (!this.canvas) {
        this.canvas = document.getElementById('itaPreviewCanvas');
      }
      return this.canvas;
    },

    /**
     * Set parameter values programmatically
     */
    setParams(params = {}) {
      Object.assign(this.config, params);
      this.renderPreview();
    },

    /**
     * Reset config & user image
     */
    reset() {
      this.userImage = null;
      this.config.scale = 1.0;
      this.config.offsetX = 0;
      this.config.offsetY = 0;
      this.config.title = '初音未来 / Hatsune Miku';
      this.config.source = 'VOCALOID';
      this.config.quote = '用歌声连接整个世界的奇迹！';
      this.config.style = 'bubble';
      this._updateScaleDisplay();
      this.renderPreview();
    }
  };

  window.ItaBagStudio = ItaBagStudio;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('itaPreviewCanvas')) {
        ItaBagStudio.init();
      }
    });
  } else {
    if (document.getElementById('itaPreviewCanvas')) {
      ItaBagStudio.init();
    }
  }

})(window);
