/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Studios Rendering Engine (Badge, Ita-Bag Charm, Memo, Image Lab)
 * Supports 4 Badge Styles:
 * 1. geek: 🧑‍💻 极客黑客
 * 2. business: 💼 商务极简
 * 3. anime: 🐾 兽聚名片
 * 4. staff: 🎫 展会工作证
 * Full input fields: Name, Title/Role, Org/Company, Contact/Telegram, Email, Motto/Bio, QR URL
 * Supports Landscape (768×552) and Portrait (552×768)
 * Copyright (c) 2026 ZGQ Inc. Licensed under the MIT License.
 */

const Studios = {
  /* ================= 1. Smart E-Badge Studio ================= */
  renderBadge(canvas, config) {
    const isPortrait = (config.orientation === 90 || config.orientation === 270);
    const w = isPortrait ? 552 : 768;
    const h = isPortrait ? 768 : 552;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const template = config.template || 'geek';
    const name    = (config.name || '').trim() || 'ZGQ';
    const role    = (config.role || config.title || '').trim() || '全栈工程师 / 嵌入式架构';
    const org     = (config.org || '').trim() || 'ZGQ Inc.';
    const contact = (config.contact || config.handle || '').trim() || 't.me/ZGQinc';
    const email   = (config.email || '').trim() || 'zgqinc@gmail.com';
    const motto   = (config.motto || config.bio || '').trim() || '用代码连接物理世界，专注低功耗嵌入式！';
    const qrText  = (config.qrText || config.qr || '').trim() || 'https://domain.zgqinc.gq';

    // White base
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (isPortrait) {
      /* ================= 竖屏自适应模式 (552 × 768) ================= */
      if (template === 'geek') {
        // 🧑‍💻 极客黑客 (Portrait)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, 72);
        ctx.fillStyle = '#f4c430';
        ctx.fillRect(0, 72, w, 6);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(`$ cat /dev/badge · ${org}`, 24, 46);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(16, 16, w - 32, h - 32);

        ctx.fillStyle = '#d32f2f';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`ROLE: ${role}`, 26, 116);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 44px "PingFang SC", sans-serif';
        ctx.fillText(name, 26, 168);

        // Monospace bio card
        ctx.fillStyle = '#f1f4f9';
        ctx.fillRect(26, 192, w - 52, 112);
        ctx.strokeStyle = '#c4c6d0';
        ctx.strokeRect(26, 192, w - 52, 112);

        ctx.fillStyle = '#000000';
        ctx.font = '16px monospace';
        this._wrapText(ctx, `> ${motto}`, 36, 222, w - 72, 24, 3);

        ctx.fillStyle = '#000000';
        ctx.font = '18px monospace';
        ctx.fillText(`COMM: ${contact}`, 26, 335);
        ctx.fillText(`MAIL: ${email}`, 26, 365);

        // QR Code centered at bottom
        const qrSize = 190;
        QRCodeLib.drawQRCode(ctx, qrText, (w - qrSize) / 2, 410, qrSize);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('3.98" BWRY E-INK BADGE', w / 2, 630);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, h - 34, w, 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('ROOT ACCESS GRANTED // SECURE', 24, h - 12);

      } else if (template === 'business') {
        // 💼 商务极简 (Portrait)
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, 0, w, 76);
        ctx.fillStyle = '#f4c430';
        ctx.fillRect(0, 76, w, 8);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px "PingFang SC", sans-serif';
        ctx.fillText(org, 26, 50);

        ctx.strokeStyle = '#202124';
        ctx.lineWidth = 2;
        ctx.strokeRect(16, 16, w - 32, h - 32);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 46px "PingFang SC", sans-serif';
        ctx.fillText(name, 26, 146);

        ctx.fillStyle = '#f4c430';
        ctx.fillRect(26, 166, w - 52, 36);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(role, 36, 191);

        ctx.fillStyle = '#444444';
        ctx.font = '18px "PingFang SC", sans-serif';
        ctx.fillText(`📱 ${contact}`, 26, 240);
        ctx.fillText(`✉️ ${email}`, 26, 275);

        ctx.fillStyle = '#000000';
        ctx.font = '17px "PingFang SC", sans-serif';
        this._wrapText(ctx, motto, 26, 320, w - 52, 26, 3);

        const qrSize = 190;
        QRCodeLib.drawQRCode(ctx, qrText, (w - qrSize) / 2, 420, qrSize);

        ctx.fillStyle = '#666666';
        ctx.font = '14px "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('扫码直接保存电子通讯录 / 访问主页', w / 2, 640);
        ctx.textAlign = 'left';

      } else if (template === 'anime') {
        // 🐾 兽聚名片 (Portrait)
        ctx.fillStyle = '#f4c430';
        ctx.fillRect(0, 0, w, 70);
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, 70, w, 6);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px "PingFang SC", sans-serif';
        ctx.fillText(`✨ 兽聚同行证 · ${org}`, 24, 46);

        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 3;
        ctx.strokeRect(16, 16, w - 32, h - 32);

        ctx.fillStyle = '#d32f2f';
        ctx.font = 'bold 44px "PingFang SC", sans-serif';
        ctx.fillText(name, 26, 146);

        ctx.fillStyle = '#000000';
        ctx.fillRect(26, 166, w - 52, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(`🐾 ${role}`, 36, 191);

        ctx.fillStyle = '#000000';
        ctx.font = '18px "PingFang SC", sans-serif';
        ctx.fillText(`💬 社交联系: ${contact}`, 26, 240);
        ctx.fillText(`🌟 专属频道: ${email}`, 26, 275);

        ctx.fillStyle = '#d32f2f';
        ctx.font = '18px "PingFang SC", sans-serif';
        this._wrapText(ctx, `「 ${motto} 」`, 26, 320, w - 52, 26, 3);

        const qrSize = 190;
        QRCodeLib.drawQRCode(ctx, qrText, (w - qrSize) / 2, 410, qrSize);

        ctx.fillStyle = '#f4c430';
        ctx.fillRect(0, h - 34, w, 34);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px "PingFang SC", sans-serif';
        ctx.fillText('FURRY BADGE · OPEN SOURCE EPD', 26, h - 12);

      } else if (template === 'staff') {
        // 🎫 展会工作证 (Portrait)
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, 0, w, 110);
        ctx.fillStyle = '#f4c430';
        ctx.fillRect(0, 110, w, 10);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 48px "PingFang SC", sans-serif';
        ctx.fillText('STAFF 工作证', 26, 70);
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`EVENT: ${org.toUpperCase()}`, 26, 98);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(16, 16, w - 32, h - 32);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 48px "PingFang SC", sans-serif';
        ctx.fillText(name, 26, 185);

        ctx.fillStyle = '#f4c430';
        ctx.fillRect(26, 205, w - 52, 42);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 22px "PingFang SC", sans-serif';
        ctx.fillText(`职责: ${role}`, 36, 235);

        ctx.fillStyle = '#000000';
        ctx.font = '20px "PingFang SC", sans-serif';
        ctx.fillText(`📞 紧急联络: ${contact}`, 26, 280);
        ctx.fillText(`🆔 编号证号: ${email}`, 26, 315);
        ctx.fillText(`⚠️ 权限说明: 展区全域通行`, 26, 350);

        const qrSize = 190;
        QRCodeLib.drawQRCode(ctx, qrText, (w - qrSize) / 2, 400, qrSize);

        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, h - 36, w, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "PingFang SC", sans-serif';
        ctx.fillText('EXHIBITOR / ALL ACCESS PASS', 26, h - 12);
      }

    } else {
      /* ================= 横屏自适应模式 (768 × 552) ================= */
      if (template === 'geek') {
        // 🧑‍💻 极客黑客 (Landscape)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, 70);
        ctx.fillStyle = '#f4c430';
        ctx.fillRect(0, 70, w, 6);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px monospace';
        ctx.fillText(`$ cat /dev/badge · ${org}`, 28, 45);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(18, 18, w - 36, h - 36);

        ctx.fillStyle = '#d32f2f';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(`ROLE: ${role}`, 32, 115);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 44px "PingFang SC", sans-serif';
        ctx.fillText(name, 32, 170);

        // Monospace bio card
        ctx.fillStyle = '#f1f4f9';
        ctx.fillRect(32, 195, 430, 95);
        ctx.strokeStyle = '#c4c6d0';
        ctx.strokeRect(32, 195, 430, 95);

        ctx.fillStyle = '#000000';
        ctx.font = '16px monospace';
        this._wrapText(ctx, `> ${motto}`, 42, 225, 410, 26, 3);

        ctx.fillStyle = '#000000';
        ctx.font = '19px monospace';
        ctx.fillText(`COMM: ${contact}`, 32, 335);
        ctx.fillText(`MAIL: ${email}`, 32, 375);

        // QR Code on right
        QRCodeLib.drawQRCode(ctx, qrText, 495, 120, 230);

        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, h - 36, w, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('3.98" BWRY E-INK SMART BADGE | OPEN HARDWARE', 32, h - 12);

      } else if (template === 'business') {
        // 💼 商务极简 (Landscape)
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, 0, w, 76);
        ctx.fillStyle = '#f4c430';
        ctx.fillRect(0, 76, w, 8);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "PingFang SC", sans-serif';
        ctx.fillText(org, 32, 50);

        ctx.strokeStyle = '#202124';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, w - 40, h - 40);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 46px "PingFang SC", sans-serif';
        ctx.fillText(name, 36, 155);

        ctx.fillStyle = '#f4c430';
        ctx.fillRect(36, 175, 400, 36);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(role, 46, 200);

        ctx.fillStyle = '#444444';
        ctx.font = '20px "PingFang SC", sans-serif';
        ctx.fillText(`📱 ${contact}`, 36, 250);
        ctx.fillText(`✉️ ${email}`, 36, 285);

        ctx.fillStyle = '#000000';
        ctx.font = '18px "PingFang SC", sans-serif';
        this._wrapText(ctx, motto, 36, 335, 420, 28, 3);

        QRCodeLib.drawQRCode(ctx, qrText, 500, 140, 220);

        ctx.fillStyle = '#666666';
        ctx.font = '14px "PingFang SC", sans-serif';
        ctx.fillText('扫码直接保存电子通讯录 / 个人名片', 490, 400);

      } else if (template === 'anime') {
        // 🐾 兽聚名片 (Landscape)
        ctx.fillStyle = '#f4c430';
        ctx.fillRect(0, 0, w, 70);
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, 70, w, 6);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 28px "PingFang SC", sans-serif';
        ctx.fillText(`✨ 兽聚同行证 · ${org}`, 32, 46);

        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 20, w - 40, h - 40);

        ctx.fillStyle = '#d32f2f';
        ctx.font = 'bold 44px "PingFang SC", sans-serif';
        ctx.fillText(name, 36, 155);

        ctx.fillStyle = '#000000';
        ctx.fillRect(36, 175, 380, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(`🐾 ${role}`, 46, 200);

        ctx.fillStyle = '#000000';
        ctx.font = '20px "PingFang SC", sans-serif';
        ctx.fillText(`💬 社交联系: ${contact}`, 36, 250);
        ctx.fillText(`🌟 专属频道: ${email}`, 36, 290);

        ctx.fillStyle = '#d32f2f';
        ctx.font = '20px "PingFang SC", sans-serif';
        this._wrapText(ctx, `「 ${motto} 」`, 36, 345, 420, 28, 3);

        QRCodeLib.drawQRCode(ctx, qrText, 500, 140, 220);

        ctx.fillStyle = '#f4c430';
        ctx.fillRect(0, h - 34, w, 34);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 17px "PingFang SC", sans-serif';
        ctx.fillText('🐾 兽聚漫展随身同人伴侣 · OPEN SOURCE EPD 🐾', 36, h - 11);

      } else if (template === 'staff') {
        // 🎫 展会工作证 (Landscape)
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, 0, w, 110);
        ctx.fillStyle = '#f4c430';
        ctx.fillRect(0, 110, w, 10);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 52px "PingFang SC", sans-serif';
        ctx.fillText('STAFF 工作证', 36, 75);
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`EVENT: ${org.toUpperCase()}`, 36, 102);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 50px "PingFang SC", sans-serif';
        ctx.fillText(name, 36, 205);

        ctx.fillStyle = '#f4c430';
        ctx.fillRect(36, 230, 420, 44);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px "PingFang SC", sans-serif';
        ctx.fillText(`职责: ${role}`, 46, 260);

        ctx.fillStyle = '#000000';
        ctx.font = '22px "PingFang SC", sans-serif';
        ctx.fillText(`📞 紧急联络: ${contact}`, 36, 325);
        ctx.fillText(`🆔 编号证号: ${email}`,   36, 365);
        ctx.fillText(`⚠️ 权限说明: 展区全域通行`, 36, 405);

        const qrSize = 200;
        QRCodeLib.drawQRCode(ctx, qrText, 510, 180, qrSize);

        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, h - 38, w, 38);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText('EXHIBITOR / ALL ACCESS PASS · 展会组委会', 36, h - 13);
      }
    }
  },

  /* ================= 2. Memo & Checklist Studio ================= */
  renderMemo(canvas, config) {
    const isPortrait = (config.orientation === 90 || config.orientation === 270);
    const w = isPortrait ? 552 : 768;
    const h = isPortrait ? 768 : 552;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const title = (config.title || '').trim() || 'TODAY TO-DO LIST';
    const items = Array.isArray(config.items) ? config.items : (config.items || '').split('\n');
    const footer = (config.footer || '').trim() || '保持专注，逐项击破！ | 墨水屏双稳态零功耗保持';
    const date = config.date || new Date().toLocaleDateString('zh-CN');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Header bar
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(0, 0, w, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('📝 ' + title, 30, 48);

    ctx.font = '20px sans-serif';
    const dateW = ctx.measureText(date).width;
    ctx.fillText(date, w - dateW - 24, 46);

    // Checklist items
    ctx.fillStyle = '#000000';
    let startY = 125;
    const step = isPortrait ? 50 : 58;
    for (let i = 0; i < items.length; i++) {
      const line = items[i].trim();
      if (!line) continue;
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
      ctx.font = isPortrait ? 'bold 24px sans-serif' : 'bold 28px sans-serif';
      ctx.fillText(line, 80, startY);
      startY += step;
      if (startY > (h - 55)) break;
    }

    // Bottom note bar
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(0, h - 32, w, 32);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(footer, 30, h - 10);
  },

  /* Helper text wrap */
  _wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
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
  }
};

window.Studios = Studios;
