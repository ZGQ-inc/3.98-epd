/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Ita-Bag Charm Studio (痛卡随身挂饰工坊)
 * High-precision 768×552 BWRY Canvas Rendering Engine
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

(function (window) {
  'use strict';

  const ItaBagStudio = {
    canvas: null,
    ctx: null,
    userImage: null,

    // Config parameters
    config: {
      scale: 1.0,           // 0.5 ~ 2.5
      rotate: 0,            // 0, 90, 180, 270 deg
      offsetX: 0,           // -300 ~ +300 px
      offsetY: 0,           // -300 ~ +300 px
      title: '初音未来 / Hatsune Miku',
      source: 'VOCALOID',
      quote: '用歌声连接整个世界的奇迹！',
      style: 'bubble',      // 'bubble' (漫画对话气泡) | 'banner' (铭牌台词卡)
      borderStyle: 'charm', // 'charm' (挂饰金属铆钉) | 'stars' (星芒护角)
      showLanyard: true     // Top lanyard hanging hole
    },

    // BWRY 4-Color Palette
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

      // Target canvas: #itaPreviewCanvas (or fallback creation)
      this.canvas = document.getElementById('itaPreviewCanvas');
      if (!this.canvas) {
        console.warn('[ItaBagStudio] #itaPreviewCanvas not found in DOM yet; creating fallback canvas.');
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'itaPreviewCanvas';
      }
      this.canvas.width = 768;
      this.canvas.height = 552;
      this.ctx = this.canvas.getContext('2d');

      // 1. File input listeners (supports multiple selector aliases)
      const fileInputs = [
        document.getElementById('itaUploadInput'),
        document.getElementById('itaImageInput'),
        document.getElementById('itaFileInput'),
        document.querySelector('.itabag-file-input')
      ].filter(Boolean);

      fileInputs.forEach(input => {
        input.addEventListener('change', (e) => this.handleImageUpload(e));
      });

      // 2. Drag & Drop on drop zones
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

      // 3. Scale slider (0.5 ~ 2.5x)
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

      // 4. Rotate dropdown / buttons (0, 90, 180, 270 deg)
      const rotateSelects = [
        document.getElementById('itaRotateSelect'),
        document.getElementById('itaRotateInput'),
        document.getElementById('itaRotate')
      ].filter(Boolean);

      rotateSelects.forEach(sel => {
        sel.addEventListener('change', (e) => {
          this.config.rotate = parseInt(e.target.value, 10) || 0;
          this.renderPreview();
        });
      });

      document.querySelectorAll('[data-ita-rotate]').forEach(btn => {
        btn.addEventListener('click', () => {
          const delta = parseInt(btn.getAttribute('data-ita-rotate'), 10) || 90;
          this.config.rotate = (this.config.rotate + delta + 360) % 360;
          rotateSelects.forEach(sel => { sel.value = String(this.config.rotate); });
          this.renderPreview();
        });
      });

      // 5. Title / Character Name input
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

      // 6. Source / Work title input
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

      // 7. Quote / Dialogue input
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

      // 8. Style selection (bubble vs banner)
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

      // 9. Border style selection
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

      // 10. Sync initial DOM values if preset in HTML
      if (document.getElementById('itaTitle')?.value) this.config.title = document.getElementById('itaTitle').value;
      if (document.getElementById('itaSource')?.value) this.config.source = document.getElementById('itaSource').value;
      if (document.getElementById('itaQuote')?.value) this.config.quote = document.getElementById('itaQuote').value;
      if (document.getElementById('itaScaleInput')?.value) this.config.scale = parseFloat(document.getElementById('itaScaleInput').value) || 1.0;
      if (document.getElementById('itaRotateSelect')?.value) this.config.rotate = parseInt(document.getElementById('itaRotateSelect').value, 10) || 0;
      if (document.getElementById('itaStyleSelect')?.value) this.config.style = document.getElementById('itaStyleSelect').value;
      if (document.getElementById('itaBorderSelect')?.value) this.config.borderStyle = document.getElementById('itaBorderSelect').value;

      // 11. Reset button
      document.getElementById('itaResetBtn')?.addEventListener('click', () => {
        this.reset();
      });

      // 12. Listen to tabchange
      window.addEventListener('tabchange', (e) => {
        if (e.detail && e.detail.tabId === 'itabag') {
          this.renderPreview();
        }
      });

      // Trigger initial render
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
          if (window.UI?.showToast) {
            window.UI.showToast(`图片「${file.name}」已载入 (${img.width}×${img.height})`, 'success', 2500);
          }
          this.renderPreview();
        };
        img.onerror = () => {
          if (window.UI?.showToast) {
            window.UI.showToast('图片加载失败，请检查文件格式', 'error');
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
      canvas.width = 768;
      canvas.height = 552;

      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      const { scale, rotate, offsetX, offsetY, title, source, quote, style } = this.config;

      // 1. Fill clean White base
      ctx.fillStyle = WHITE;
      ctx.fillRect(0, 0, 768, 552);

      // 2. Character Image or Cute Placeholder
      if (this.userImage) {
        ctx.save();
        // Inner clipping boundary (below top banner, above bottom dialogue)
        ctx.beginPath();
        this._roundRect(ctx, 16, 58, 736, 456, 12);
        ctx.clip();

        const cx = 384 + (offsetX || 0);
        const cy = 275 + (offsetY || 0);
        ctx.translate(cx, cy);
        ctx.rotate(((rotate || 0) * Math.PI) / 180);
        ctx.scale(scale || 1.0, scale || 1.0);
        ctx.drawImage(this.userImage, -this.userImage.width / 2, -this.userImage.height / 2);
        ctx.restore();
      } else {
        this._drawPlaceholder(ctx);
      }

      // 3. Bottom Subtitle Banner or Speech Bubble (character name + dialogue)
      this._drawBottomBanner(ctx);

      // 4. Top Banner with Red/Yellow BWRY accents and Lanyard hole
      this._drawTopBanner(ctx);

      // 5. Four Corner Decorative Badge Marks & Protective Border
      this._drawBadgeDecorations(ctx);

      // 6. Bottom spec footer
      this._drawFooterSpec(ctx);
    },

    /**
     * Draw cute anime chibi avatar placeholder when no user image uploaded
     */
    _drawPlaceholder(ctx) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;

      // Decorative lattice background pattern
      ctx.fillStyle = '#f7f7f9';
      for (let y = 70; y < 400; y += 24) {
        for (let x = 30; x < 738; x += 24) {
          if ((x + y) % 48 === 0) {
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = YELLOW;
            ctx.fill();
          }
        }
      }

      // Outer Avatar Circle Frame (Center x: 384, y: 220, r: 100)
      const cx = 384;
      const cy = 220;
      const r = 95;

      // Red outer ring
      ctx.strokeStyle = RED;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Yellow middle ring
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // White face fill
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.fill();

      // --- Vector Anime Cat-Eared Mascot ---
      // Left Ear
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy - 60);
      ctx.lineTo(cx - 75, cy - 105);
      ctx.lineTo(cx - 20, cy - 75);
      ctx.closePath();
      ctx.fill();

      // Left Inner Ear (Red)
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.moveTo(cx - 48, cy - 65);
      ctx.lineTo(cx - 68, cy - 98);
      ctx.lineTo(cx - 26, cy - 75);
      ctx.closePath();
      ctx.fill();

      // Right Ear
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.moveTo(cx + 50, cy - 60);
      ctx.lineTo(cx + 75, cy - 105);
      ctx.lineTo(cx + 20, cy - 75);
      ctx.closePath();
      ctx.fill();

      // Right Inner Ear (Red)
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.moveTo(cx + 48, cy - 65);
      ctx.lineTo(cx + 68, cy - 98);
      ctx.lineTo(cx + 26, cy - 75);
      ctx.closePath();
      ctx.fill();

      // Hair bangs (Black curved tufts)
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.arc(cx, cy - 45, 55, Math.PI * 0.9, Math.PI * 2.1);
      ctx.lineTo(cx, cy - 25);
      ctx.closePath();
      ctx.fill();

      // Anime Eyes (Large expressive eyes with highlight sparkles)
      const drawEye = (ex, ey) => {
        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 14, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // White specular highlights
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(ex - 4, ey - 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + 4, ey + 6, 3, 0, Math.PI * 2);
        ctx.fill();

        // Top eyelash stroke
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(ex, ey - 10, 18, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      };
      drawEye(cx - 32, cy - 5);
      drawEye(cx + 32, cy - 5);

      // Blushing Cheeks (Red mini dashes)
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.ellipse(cx - 46, cy + 18, 12, 6, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 46, cy + 18, 12, 6, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Kawaii Cat Mouth (ω)
      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx - 8, cy + 16, 8, 0, Math.PI * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 8, cy + 16, 8, Math.PI * 0.15, Math.PI);
      ctx.stroke();

      // Neck Ribbon Bow (Red + Yellow bell)
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 54);
      ctx.lineTo(cx - 24, cy + 42);
      ctx.lineTo(cx - 24, cy + 66);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy + 54);
      ctx.lineTo(cx + 24, cy + 42);
      ctx.lineTo(cx + 24, cy + 66);
      ctx.closePath();
      ctx.fill();

      // Center Star Bell (Yellow)
      ctx.fillStyle = YELLOW;
      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + 54, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sparkle stars around avatar
      const drawStar = (sx, sy, size, color) => {
        ctx.fillStyle = color;
        ctx.font = `bold ${size}px sans-serif`;
        ctx.fillText('★', sx, sy);
      };
      drawStar(cx - 165, cy - 50, 24, YELLOW);
      drawStar(cx + 145, cy - 55, 26, RED);
      drawStar(cx - 150, cy + 65, 20, RED);
      drawStar(cx + 135, cy + 70, 22, YELLOW);

      // Upload prompt button pill
      ctx.fillStyle = YELLOW;
      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 2.5;
      this._roundRect(ctx, cx - 160, cy + 120, 320, 36, 18, true, true);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📷 点击上传角色立绘 / 谷子照片', cx, cy + 144);

      ctx.fillStyle = '#444444';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.fillText('支持 PNG / JPG / WEBP · 0.5x~2.5x 缩放与四向旋转', cx, cy + 172);
      ctx.textAlign = 'left';
    },

    /**
     * Draw Top Banner: "🎒 痛卡挂饰 · [出处]" with yellow/red BWRY accents
     */
    _drawTopBanner(ctx) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      const sourceText = this.config.source ? this.config.source.trim() : '谷美痛包 / ITA-BAG';

      // 1. Top banner header bar (H: 52)
      ctx.fillStyle = RED;
      this._roundRect(ctx, 16, 12, 736, 46, { tl: 10, tr: 10, bl: 0, br: 0 }, true, false);

      // 2. Yellow accent divider line
      ctx.fillStyle = YELLOW;
      ctx.fillRect(16, 56, 736, 4);

      // 3. Banner title text
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText('🎒 痛卡挂饰 · ', 32, 42);

      const titleWidth = ctx.measureText('🎒 痛卡挂饰 · ').width;
      ctx.fillStyle = YELLOW;
      ctx.fillText(sourceText, 32 + titleWidth, 42);

      // 4. Right side tag
      ctx.fillStyle = BLACK;
      this._roundRect(ctx, 620, 20, 118, 28, 14, true, false);
      ctx.fillStyle = YELLOW;
      ctx.font = 'bold 13px monospace';
      ctx.fillText('3.98" BWRY', 636, 39);

      // 5. Lanyard Hole Indicator (Top center strap mount)
      if (this.config.showLanyard) {
        const lx = 384;
        const ly = 24;

        // Metallic eyelet / grommet ring
        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.arc(lx, ly, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lx, ly, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Inner cutout hole
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(lx, ly, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Micro hanging loop cord line
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
    _drawBottomBanner(ctx) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      const charName = this.config.title ? this.config.title.trim() : '角色名';
      const quoteText = this.config.quote ? this.config.quote.trim() : '专属台词 / 签名题字';
      const isBubble = this.config.style === 'bubble';

      if (isBubble) {
        // Comic Dialogue Speech Bubble
        const bx = 36;
        const by = 398;
        const bw = 696;
        const bh = 112;

        // Bubble body
        ctx.fillStyle = WHITE;
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 3.5;
        this._roundRect(ctx, bx, by, bw, bh, 16, true, true);

        // Speech bubble pointer tail (pointing upwards toward character)
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.moveTo(384 - 16, by);
        ctx.lineTo(384, by - 16);
        ctx.lineTo(384 + 16, by);
        ctx.closePath();
        ctx.fill();

        // Pointer border strokes
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(384 - 16, by);
        ctx.lineTo(384, by - 16);
        ctx.lineTo(384 + 16, by);
        ctx.stroke();

        // Re-cover base line of pointer
        ctx.fillStyle = WHITE;
        ctx.fillRect(384 - 14, by - 1, 28, 4);

        // Character Name Inset Pill (Top-left of bubble)
        ctx.fillStyle = RED;
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 2.5;
        this._roundRect(ctx, bx + 16, by - 14, 210, 30, 15, true, true);

        ctx.fillStyle = WHITE;
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText('★ ' + charName, bx + 28, by + 6);

        // Dialogue / Quote inside bubble
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        this._wrapText(ctx, `「${quoteText}」`, bx + 28, by + 46, bw - 56, 28, 2);

      } else {
        // Sleek Anime Character Subtitle Plate
        const px = 28;
        const py = 400;
        const pw = 712;
        const ph = 112;

        ctx.fillStyle = WHITE;
        ctx.strokeStyle = RED;
        ctx.lineWidth = 3.5;
        this._roundRect(ctx, px, py, pw, ph, 12, true, true);

        // Yellow corner brackets on the plate
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

        // Character Name in bold red
        ctx.fillStyle = RED;
        ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText('★ ' + charName, px + 24, py + 38);

        // Source badge in yellow/black
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 15px -apple-system, sans-serif';
        ctx.fillText('【' + (this.config.source || 'VOCALOID') + '】', px + 24 + ctx.measureText('★ ' + charName).width + 12, py + 36);

        // Quote text in bold black
        ctx.fillStyle = BLACK;
        ctx.font = '19px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        this._wrapText(ctx, `“ ${quoteText} ”`, px + 24, py + 76, pw - 48, 26, 2);
      }
    },

    /**
     * Draw four corner decorative badge marks & protective acrylic border
     */
    _drawBadgeDecorations(ctx) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;

      // Outer protective border frame (acrylic double-line)
      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 3;
      this._roundRect(ctx, 8, 8, 752, 536, 14, false, true);

      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 1.5;
      this._roundRect(ctx, 12, 12, 744, 528, 12, false, true);

      // Four corner metallic badge rivets / star clips
      const corners = [
        { x: 26, y: 26 },
        { x: 742, y: 26 },
        { x: 26, y: 526 },
        { x: 742, y: 526 }
      ];

      if (this.config.borderStyle === 'stars') {
        corners.forEach(c => {
          // Red star corner medal
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
          // Outer rivet bezel
          ctx.fillStyle = YELLOW;
          ctx.strokeStyle = BLACK;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Star or cross center rivet
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
    _drawFooterSpec(ctx) {
      const { BLACK } = this.COLORS;
      ctx.fillStyle = BLACK;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('3.98" BWRY EPD ITA-BAG CHARM · ZGQ Inc. · 零功耗双稳态随身谷美挂饰', 384, 542);
      ctx.textAlign = 'left';
    },

    /**
     * Update scale slider text badge if element exists
     */
    _updateScaleDisplay() {
      const val = `${this.config.scale.toFixed(1)}x`;
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
      this.config.rotate = 0;
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

  // Expose ItaBagStudio to global window
  window.ItaBagStudio = ItaBagStudio;

  // Auto-init on DOMContentLoaded if DOM is already ready or loading
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
