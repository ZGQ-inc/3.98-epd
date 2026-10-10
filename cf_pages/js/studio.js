/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Studios Rendering Engine (Badge, Ita-Bag Charm, Memo, Image Lab)
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

const Studios = {
  /* ================= 1. Smart E-Badge Studio ================= */
  renderBadge(canvas, config) {
    canvas.width = 768;
    canvas.height = 552;
    const ctx = canvas.getContext('2d');
    const { template = 'hacker', name = 'ZGQ', handle = '@zgq_inc', title = 'Chief Architect', bio = 'Building intelligent hardware.', qrText = 'https://domain.zgqinc.gq/' } = config;

    // White base
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 768, 552);

    if (template === 'hacker') {
      // Tech banner (Black top bar + Yellow highlight)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 768, 120);

      ctx.fillStyle = '#f4c430';
      ctx.fillRect(0, 120, 768, 12);

      // Name & Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px monospace';
      ctx.fillText(name.toUpperCase(), 36, 75);

      ctx.fillStyle = '#f4c430';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(handle, 36, 108);

      // Main content
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(title, 36, 190);

      ctx.fillStyle = '#333333';
      ctx.font = '26px sans-serif';
      this._wrapText(ctx, bio, 36, 245, 420, 36);

      // QR Code on right
      QRCodeLib.drawQRCode(ctx, qrText, 510, 170, 210);

      // Bottom bar with Red accent
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(0, 520, 768, 32);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('3.98" BWRY E-INK SMART BADGE | OPEN HARDWARE', 36, 542);
    } else if (template === 'business') {
      // Clean Minimalist Business Badge
      ctx.fillStyle = '#000000';
      ctx.fillRect(36, 40, 6, 472);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText(name, 60, 110);

      ctx.fillStyle = '#d32f2f';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(title, 60, 160);

      ctx.fillStyle = '#666666';
      ctx.font = '24px sans-serif';
      ctx.fillText(handle, 60, 200);

      ctx.fillStyle = '#222222';
      ctx.font = '24px sans-serif';
      this._wrapText(ctx, bio, 60, 260, 420, 34);

      QRCodeLib.drawQRCode(ctx, qrText, 520, 160, 200);

      ctx.fillStyle = '#f4c430';
      ctx.fillRect(60, 490, 648, 4);
    } else if (template === 'anime') {
      // Ita-Bag / Furry Convention Badge
      ctx.fillStyle = '#f4c430';
      ctx.fillRect(0, 0, 768, 80);

      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(0, 80, 768, 10);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('★ ' + name + ' ★', 36, 58);

      ctx.fillStyle = '#d32f2f';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(title, 36, 140);

      ctx.fillStyle = '#000000';
      ctx.font = '28px sans-serif';
      this._wrapText(ctx, bio, 36, 200, 440, 38);

      QRCodeLib.drawQRCode(ctx, qrText, 510, 140, 210);

      ctx.fillStyle = '#f4c430';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('🐾 兽聚漫展随身同人伴侣 🐾', 36, 500);
    }
  },

  /* ================= 2. Memo & Checklist Studio ================= */
  renderMemo(canvas, config) {
    canvas.width = 768;
    canvas.height = 552;
    const ctx = canvas.getContext('2d');
    const { title = '待办清单 & 备忘留言', items = ['出门记得带钥匙和工牌', '晚上 8 点智能门禁固件升级', '给痛包充好电备战周末漫展'], date = new Date().toLocaleDateString('zh-CN') } = config;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 768, 552);

    // Header bar
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(0, 0, 768, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('📝 ' + title, 30, 48);

    ctx.font = '20px sans-serif';
    ctx.fillText(date, 620, 46);

    // Checklist items
    ctx.fillStyle = '#000000';
    let startY = 125;
    for (let i = 0; i < items.length; i++) {
      if (!items[i].trim()) continue;
      // Draw checkbox square
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(36, startY - 26, 28, 28);

      // Alternate color accent for checkmarks/bullets
      if (i % 2 === 1) {
        ctx.fillStyle = '#f4c430';
        ctx.fillRect(40, startY - 22, 20, 20);
      }

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(items[i], 80, startY);
      startY += 58;
      if (startY > 480) break;
    }

    // Bottom note bar
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(0, 520, 768, 32);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('3.98" EPD MEMO BOARD · ZGQ Inc.', 30, 542);
  },

  /* Helper text wrap */
  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }
};
