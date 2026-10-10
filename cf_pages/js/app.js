/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Main Application Orchestrator & Event Controller
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

const App = {
  badgeCanvas: null,
  memoCanvas: null,
  paintCanvas: null,
  imageLabCanvas: null,
  modalCanvas: null,
  uploadedImg: null,
  badgeTemplate: 'geek',

  init() {
    console.log('[App] Initializing application orchestrator...');
    UI.init();
    DeviceManager.init();
    PresetHub.init();

    this.badgeCanvas = document.getElementById('badgePreviewCanvas');
    this.memoCanvas = document.getElementById('memoPreviewCanvas');
    this.paintCanvas = document.getElementById('paintDrawingCanvas');
    this.imageLabCanvas = document.getElementById('imageLabCanvas');
    this.modalCanvas = document.getElementById('ditherModalCanvas') || document.getElementById('modalPreviewCanvas');

    if (this.paintCanvas) {
      PaintCanvas.init(this.paintCanvas);
    }

    if (window.ItaBagStudio && typeof window.ItaBagStudio.init === 'function') {
      window.ItaBagStudio.init();
    }
    if (window.ScenesStudio && typeof window.ScenesStudio.init === 'function') {
      window.ScenesStudio.init();
    }

    this.renderBadge();
    this.renderMemo();
    this.bindEvents();
    this.renderPresetsUI();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('[PWA] Service Worker registered:', reg.scope);
      }).catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
    }
    console.log('[App] Ready!');
  },

  /* ================= 1. Smart Badge Studio ================= */
  selectBadgeTpl(tpl) {
    this.badgeTemplate = tpl;
    ['geek', 'business', 'anime', 'staff'].forEach(t => {
      const el = document.getElementById(`chip-${t}`);
      if (el) el.classList.toggle('active', t === tpl);
    });
    this.renderBadge();
  },

  renderBadge() {
    if (!this.badgeCanvas) return;
    const name    = document.getElementById('badgeName')?.value || 'ZGQ';
    const role    = document.getElementById('badgeRole')?.value || document.getElementById('badgeTitle')?.value || '全栈工程师 / 嵌入式架构';
    const org     = document.getElementById('badgeOrg')?.value || 'ZGQ Inc.';
    const contact = document.getElementById('badgeContact')?.value || document.getElementById('badgeHandle')?.value || 't.me/ZGQinc';
    const email   = document.getElementById('badgeEmail')?.value || 'zgqinc@gmail.com';
    const motto   = document.getElementById('badgeMotto')?.value || document.getElementById('badgeBio')?.value || '用代码连接物理世界，专注低功耗嵌入式！';
    const qrText  = document.getElementById('badgeQr')?.value || document.getElementById('badgeQrText')?.value || 'https://domain.zgqinc.gq';

    Studios.renderBadge(this.badgeCanvas, {
      template: this.badgeTemplate,
      name,
      role,
      org,
      contact,
      email,
      motto,
      qrText,
      orientation: UI.orientation
    });
  },

  /* ================= 2. Memo & Checklist ================= */
  renderMemo() {
    if (!this.memoCanvas) return;
    const title = document.getElementById('memoTitle')?.value || 'TODAY TO-DO LIST';
    const itemsRaw = document.getElementById('memoItems')?.value || '';
    const footer = document.getElementById('memoFooter')?.value || '保持专注，逐项击破！ | 墨水屏双稳态零功耗保持';

    Studios.renderMemo(this.memoCanvas, {
      title,
      items: itemsRaw.split('\n'),
      footer,
      date: new Date().toLocaleDateString('zh-CN')
    });
  },

  /* ================= 3. Image Lab (9 Algorithms & Sliders) ================= */
  renderImageLab() {
    if (!this.imageLabCanvas) return;
    const canvas = this.imageLabCanvas;
    const isPortrait = (UI.orientation === 90 || UI.orientation === 270);
    const w = isPortrait ? 552 : 768;
    const h = isPortrait ? 768 : 552;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (!this.uploadedImg) {
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#8e9099';
      ctx.font = '22px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📷 请先上传相册照片 (PNG / JPG / WEBP)', w / 2, h / 2);
      ctx.textAlign = 'left';
      return;
    }

    const scale = Math.max(w / this.uploadedImg.width, h / this.uploadedImg.height);
    const dw = this.uploadedImg.width * scale;
    const dh = this.uploadedImg.height * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(this.uploadedImg, dx, dy, dw, dh);

    const algo = document.getElementById('imageAlgoSelect')?.value || 'floyd';
    const contrast = parseFloat(document.getElementById('imageContrastSlider')?.value ?? 15);
    const redBoostVal = parseFloat(document.getElementById('imageRedBoostSlider')?.value || 0);
    const yellowBoostVal = parseFloat(document.getElementById('imageYellowBoostSlider')?.value || 0);
    const redBoost = redBoostVal > 0 ? 1.0 + (redBoostVal / 50) : 1.0;
    const yellowBoost = yellowBoostVal > 0 ? 1.0 + (yellowBoostVal / 50) : 1.0;

    const packed = BWRY.ditherCanvasTo2bpp(canvas, algo, {
      contrast,
      redBoost,
      yellowBoost
    });
    BWRY.render2bppToCanvas(canvas, packed);
  },

  /* ================= 4. Push & Presets Engine ================= */
  async pushCanvas(canvas, name) {
    if (!canvas) return;
    try {
      UI.showToast(`正在量化并推送【${name}】至墨水屏...`, 'info', 4000);
      const algo = document.getElementById('imageAlgoSelect')?.value || 'floyd';
      const packed = BWRY.ditherCanvasTo2bpp(canvas, algo);
      await DeviceManager.pushBitmap2bpp(packed, (pct) => {
        console.log(`[Push Progress]: ${pct}%`);
      });
      UI.showToast(`🎉 成功推送到 3.98" 墨水屏！`, 'success', 4000);
    } catch (e) {
      UI.showToast(`推送失败: ${e.message}`, 'error', 4000);
    }
  },

  async promptSavePreset(canvas, type, defaultTitle) {
    if (!canvas) return;
    const typeLabelMap = {
      badge: '智能工牌',
      itabag: '兽聚痛卡',
      memo: '随身便签',
      paint: '像素手绘',
      image: '图片调色',
      scenes: '场景遥控'
    };

    const typeLabel = typeLabelMap[type] || '墨水屏作品';
    const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
      || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);

    // Elements
    const nameInput = document.getElementById('savePresetNameInput');
    const typeLabelEl = document.getElementById('savePresetTypeLabel');
    const hwBadge = document.getElementById('savePresetHwBadge');
    const estSizeEl = document.getElementById('savePresetEstSize');
    const storageCheck = document.getElementById('savePresetStorageCheck');
    const progressBox = document.getElementById('savePresetProgressBox');
    const progressStatus = document.getElementById('savePresetProgressStatus');
    const progressPct = document.getElementById('savePresetProgressPct');
    const progressBar = document.getElementById('savePresetProgressBar');
    const confirmBtn = document.getElementById('btnConfirmWritePreset');

    const defaultName = (defaultTitle || typeLabel) + '_' + new Date().toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '');
    if (nameInput) nameInput.value = defaultName;
    if (typeLabelEl) typeLabelEl.textContent = `${typeLabel} · 768×552 BWRY 2bpp`;
    if (estSizeEl) estSizeEl.textContent = '106.0 KB (显存点阵 + 索引描述)';

    if (hwBadge) {
      if (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected) {
        hwBadge.textContent = '🟢 蓝牙 5.0 在线 (WebBLE)';
        hwBadge.style.background = 'rgba(76, 175, 80, 0.15)';
        hwBadge.style.color = '#4caf50';
      } else if (DeviceManager.isLanConnected && DeviceManager.lanIp) {
        hwBadge.textContent = `🟢 局域网在线 (${DeviceManager.lanIp})`;
        hwBadge.style.background = 'rgba(76, 175, 80, 0.15)';
        hwBadge.style.color = '#4caf50';
      } else {
        hwBadge.textContent = '🟡 离线模式 (未连通单片机)';
        hwBadge.style.background = 'rgba(255, 152, 0, 0.15)';
        hwBadge.style.color = '#ff9800';
      }
    }

    let selectedDest = isHardwareConnected ? 'hardware' : 'local';
    const destHwBtn = document.getElementById('saveDestHwBtn');
    const destLocalBtn = document.getElementById('saveDestLocalBtn');
    const targetLabel = document.getElementById('savePresetTargetLabel');
    const checkTitle = document.getElementById('savePresetStorageCheckTitle');

    const updateDestUI = () => {
      if (selectedDest === 'hardware') {
        if (destHwBtn) destHwBtn.className = 'm3-btn small tonal save-dest-tab active';
        if (destLocalBtn) destLocalBtn.className = 'm3-btn small outlined save-dest-tab';
        if (targetLabel) targetLabel.textContent = '单片机 Flash (SPIFFS)';
        if (checkTitle) checkTitle.textContent = '单片机 Flash 余量';
        const freeBytes = PresetHub.storageStats.free_bytes || 1528841;
        if (storageCheck) {
          if (!isHardwareConnected) {
            storageCheck.innerHTML = `<span style="color:#ff9800;">⚠️ 硬件未连接 (写入可能失败)</span>`;
          } else if (freeBytes < 110 * 1024) {
            storageCheck.innerHTML = `<span style="color:#f44336;">⚠️ 空间告急：剩余 ${PresetHub.formatBytes(freeBytes)}</span>`;
          } else {
            storageCheck.innerHTML = `<span style="color:#4caf50;">✓ 空间充裕：剩余 ${PresetHub.formatBytes(freeBytes)}</span>`;
          }
        }
        if (confirmBtn) confirmBtn.textContent = '🚀 写入单片机 Flash 存储';
      } else {
        if (destHwBtn) destHwBtn.className = 'm3-btn small outlined save-dest-tab';
        if (destLocalBtn) destLocalBtn.className = 'm3-btn small tonal save-dest-tab active';
        if (targetLabel) targetLabel.textContent = '📱 浏览器本地草稿库 (IndexedDB)';
        if (checkTitle) checkTitle.textContent = '单片机 Flash 影响';
        if (storageCheck) storageCheck.innerHTML = `<span style="color:#2196f3; font-weight:700;">✓ 0 字节 (完全不占用单片机 Flash)</span>`;
        if (confirmBtn) confirmBtn.textContent = '💾 暂存至本地离线草稿库';
      }
    };

    if (destHwBtn) {
      destHwBtn.onclick = () => {
        selectedDest = 'hardware';
        updateDestUI();
      };
    }
    if (destLocalBtn) {
      destLocalBtn.onclick = () => {
        selectedDest = 'local';
        updateDestUI();
      };
    }
    updateDestUI();

    if (progressBox) progressBox.style.display = 'none';
    UI.openModal('savePresetModal');

    // Remove old listeners and re-bind confirm button
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
      const name = (nameInput && nameInput.value) ? nameInput.value.trim() : defaultName;
      if (!name) {
        UI.showToast('请输入预设名称', 'warning');
        return;
      }

      newConfirmBtn.disabled = true;
      if (progressBox) progressBox.style.display = 'block';

      try {
        if (progressStatus) progressStatus.textContent = '正在生成 2bpp 硬件显存点阵...';
        if (progressPct) progressPct.textContent = '10%';
        if (progressBar) progressBar.style.width = '10%';
        await new Promise(r => setTimeout(r, 60));

        const packed = BWRY.ditherCanvasTo2bpp(canvas, 'floyd');

        await PresetHub.savePreset({
          name,
          type,
          typeLabel,
          rawBitmap: packed,
          targetLocation: selectedDest
        }, (pct, text) => {
          if (progressStatus && text) progressStatus.textContent = text;
          if (progressPct) progressPct.textContent = `${pct}%`;
          if (progressBar) progressBar.style.width = `${pct}%`;
        });

        this.renderPresetsUI();
        UI.closeModal('savePresetModal');
        UI.showToast(selectedDest === 'hardware'
          ? `🎉 预设「${name}」已成功写入单片机 Flash (SPIFFS) 存储！`
          : `已成功保存预设「${name}」至本地草稿库（完全不占用单片机空间）！`, 'success', 4500);
      } catch (e) {
        if (progressBox) progressBox.style.display = 'none';
        newConfirmBtn.disabled = false;
        UI.showToast(`写入失败: ${e.message}`, 'error', 4500);
      }
    });
  },

  renderPresetsUI() {
    const listEl = document.getElementById('presetList');
    const deleteBtn = document.getElementById('presetDeleteSelectedBtn');
    if (!listEl) return;

    PresetHub.updateStorageUI();

    const isHwTab = PresetHub.currentTab === 'hardware';
    const displayedPresets = PresetHub.presets.filter(p => isHwTab ? !p.is_offline : p.is_offline);

    if (displayedPresets.length === 0) {
      if (isHwTab) {
        listEl.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:32px; color:var(--md-sys-color-outline);">
          📂 单片机 Flash 暂无预设。<br>可在工牌、痛卡、便签等设计中点击「保存为预设」写入硬件，或在「本地离线预设库」一键同步写入！
        </div>`;
      } else {
        listEl.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:32px; color:var(--md-sys-color-outline);">
          📂 本地离线预设草稿库为空。<br>离线状态保存的草稿将保存在此，完全不占用单片机 Flash 空间，连上硬件后可一键烧录写入！
        </div>`;
      }
      if (deleteBtn) deleteBtn.disabled = true;
      return;
    }

    if (deleteBtn) {
      deleteBtn.disabled = PresetHub.selectedIds.size === 0;
      deleteBtn.textContent = `删除选中 (${PresetHub.selectedIds.size})`;
    }

    listEl.innerHTML = displayedPresets.map(p => {
      const isSelected = PresetHub.selectedIds.has(p.id);
      return `
        <div class="preset-card ${isSelected ? 'selected' : ''}" data-id="${p.id}">
          <div class="preset-card-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" class="preset-check" data-id="${p.id}" ${isSelected ? 'checked' : ''}>
              <strong style="font-size:14px;">${p.name}</strong>
            </div>
            <span class="preset-type-badge" style="${p.is_offline ? 'background:rgba(33, 150, 243, 0.15); color:#2196f3;' : 'background:rgba(76, 175, 80, 0.15); color:#4caf50;'}">
              ${p.is_offline ? '📱 本地草稿' : '📟 Flash 存储'} · ${p.type_label}
            </span>
          </div>
          <div style="font-size:12px; color:var(--md-sys-color-outline); display:flex; justify-content:space-between;">
            <span>大小: ${p.size_str || '104 KB'}</span>
            <span>${p.created_str || ''}</span>
          </div>
          <div class="preset-actions" style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
            <button class="m3-btn small outlined preset-preview-btn" data-id="${p.id}">👁️ 预览</button>
            ${p.is_offline
              ? `<button class="m3-btn small tonal preset-push-btn" data-id="${p.id}">🚀 屏幕推送</button>
                 <button class="m3-btn small preset-upload-hw-btn" data-id="${p.id}" style="background:var(--primary); color:var(--on-primary);">⬆️ 写入硬件</button>`
              : `<button class="m3-btn small preset-push-btn" data-id="${p.id}">🚀 内部直推</button>`
            }
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.preset-check').forEach(cb => {
      cb.addEventListener('change', () => {
        PresetHub.toggleSelect(cb.getAttribute('data-id'));
        this.renderPresetsUI();
      });
    });

    listEl.querySelectorAll('.preset-preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const preset = PresetHub.presets.find(p => p.id === id);
        if (preset && preset.raw_bitmap && this.modalCanvas) {
          BWRY.render2bppToCanvas(this.modalCanvas, new Uint8Array(preset.raw_bitmap));
          UI.openModal('ditherPreviewModal');
        } else {
          UI.showToast('该预设未包含点阵位图数据', 'warning');
        }
      });
    });

    listEl.querySelectorAll('.preset-upload-hw-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const isConn = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
          || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);
        if (!isConn) {
          UI.showToast('⚠️ 未连通单片机硬件，请先在顶部连接蓝牙或局域网！', 'warning', 4000);
          return;
        }
        try {
          UI.showToast('正在写入单片机 Flash 存储...', 'info', 3000);
          await PresetHub.uploadLocalPresetToHardware(id);
          this.renderPresetsUI();
          UI.showToast('🎉 该预设已成功烧录写入单片机 Flash！已转入硬件存储库', 'success', 4500);
        } catch (e) {
          UI.showToast(`写入硬件失败: ${e.message}`, 'error', 4000);
        }
      });
    });

    listEl.querySelectorAll('.preset-push-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const preset = PresetHub.presets.find(p => p.id === id);
        if (!preset) return;

        const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
          || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);

        if (!isHardwareConnected) {
          UI.showToast('⚠️ 未连通单片机硬件，无法执行内部直推！请先在顶部连接蓝牙或局域网', 'warning', 4000);
          return;
        }

        try {
          if (!preset.is_offline) {
            UI.showToast(`正在通知单片机内部读取预设「${preset.name}」...`, 'info', 3000);
            await DeviceManager.pushPreset(preset.id);
            UI.showToast(`🎉 单片机已内部加载 Flash 预设「${preset.name}」并启动墨水屏全屏物理刷新！`, 'success', 5000);
          } else {
            // Local preset streaming
            if (preset.raw_bitmap) {
              UI.showToast(`正在点对点推送本地离线草稿「${preset.name}」至墨水屏...`, 'info', 4000);
              await DeviceManager.pushBitmap2bpp(new Uint8Array(preset.raw_bitmap));
              UI.showToast(`🎉 离线预设「${preset.name}」推送成功！`, 'success', 4000);
            }
          }
        } catch (e) {
          UI.showToast(`推送失败: ${e.message}`, 'error', 4000);
        }
      });
    });
  },

  /* ================= 5. Universal Event Bindings ================= */
  bindEvents() {
    // 1. Badge inputs
    document.querySelectorAll('.badge-input').forEach(el => {
      el.addEventListener('input', () => this.renderBadge());
      el.addEventListener('change', () => this.renderBadge());
    });

    // Badge template chips
    ['geek', 'business', 'anime', 'staff'].forEach(tpl => {
      document.getElementById(`chip-${tpl}`)?.addEventListener('click', () => this.selectBadgeTpl(tpl));
    });

    // 2. Memo inputs
    document.querySelectorAll('.memo-input').forEach(el => {
      el.addEventListener('input', () => this.renderMemo());
      el.addEventListener('change', () => this.renderMemo());
    });

    // 3. Paint Canvas Tools & Palette
    const paintToolSelect = document.getElementById('paintToolSelect');
    if (paintToolSelect) {
      paintToolSelect.addEventListener('change', (e) => {
        PaintCanvas.currentTool = e.target.value;
      });
    }

    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        PaintCanvas.currentTool = btn.getAttribute('data-tool');
        if (paintToolSelect) paintToolSelect.value = PaintCanvas.currentTool;
      });
    });

    // Swatches (pure inks + mixed colors)
    document.querySelectorAll('.swatch-item, .palette-btn, .color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.swatch-item, .palette-btn, .color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const color = swatch.getAttribute('data-color') || swatch.style.backgroundColor;
        PaintCanvas.currentColor = color;
        const picker = document.getElementById('nativeColorPicker');
        if (picker && color.startsWith('#')) picker.value = color;
      });
    });

    // Native Color Picker
    const nativeColorPicker = document.getElementById('nativeColorPicker');
    if (nativeColorPicker) {
      nativeColorPicker.addEventListener('input', (e) => {
        PaintCanvas.currentColor = e.target.value;
        document.querySelectorAll('.swatch-item, .palette-btn, .color-swatch').forEach(s => s.classList.remove('active'));
      });
    }

    document.getElementById('paintClearBtn')?.addEventListener('click', () => PaintCanvas.clear());
    document.getElementById('paintUndoBtn')?.addEventListener('click', () => PaintCanvas.undo());
    document.getElementById('paintRedoBtn')?.addEventListener('click', () => PaintCanvas.redo());
    document.getElementById('paintLineWidth')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value) || 4;
      PaintCanvas.lineWidth = val;
      const valBadge = document.getElementById('paintLineWidthVal');
      if (valBadge) valBadge.textContent = `${val}px`;
    });

    // 4. Image Lab Controls
    const imageUploadInput = document.getElementById('imageUploadInput') || document.getElementById('labImgInput');
    if (imageUploadInput) {
      imageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            this.uploadedImg = img;
            this.renderImageLab();
            UI.showToast(`已载入图片 (${img.width}×${img.height})`, 'success');
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    document.getElementById('imageAlgoSelect')?.addEventListener('change', () => this.renderImageLab());
    ['imageContrastSlider', 'imageBrightnessSlider', 'imageRedBoostSlider', 'imageYellowBoostSlider'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          const badge = document.getElementById(`${id}Val`);
          if (badge) badge.textContent = el.value;
          this.renderImageLab();
        });
      }
    });

    // 5. Connectivity Bar Bindings
    const bleConnectBtn = document.getElementById('bleConnectBtn') || document.getElementById('btnBleConnect');
    const bleStatusDot = document.getElementById('bleStatusDot');
    const bleStatusText = document.getElementById('bleStatusText');
    const bleSubText = document.getElementById('bleSubText');

    const updateConnUI = (status) => {
      if (status.type === 'ble') {
        if (bleStatusDot) bleStatusDot.className = 'conn-status-dot connected';
        if (bleStatusText) bleStatusText.textContent = `● 已连接: ${status.name}`;
        if (bleSubText) bleSubText.textContent = 'Web Bluetooth 5.0 · 物理低延迟点阵直推中';
        if (bleConnectBtn) bleConnectBtn.textContent = '断开蓝牙';
        UI.rememberDevice(DeviceManager.bleDevice?.id, status.name);
      } else if (status.type === 'lan') {
        if (bleStatusDot) bleStatusDot.className = 'conn-status-dot connected';
        if (bleStatusText) bleStatusText.textContent = `● 局域网已连接: ${status.name}`;
        if (bleSubText) bleSubText.textContent = 'REST API 高速全双工信道已连通';
      } else {
        if (bleStatusDot) bleStatusDot.className = 'conn-status-dot';
        if (bleStatusText) bleStatusText.textContent = '● 已断开连接';
        if (bleSubText) bleSubText.textContent = '无需 Wi-Fi · 支持 Chrome/Edge 100% 离线直推';
        if (bleConnectBtn) bleConnectBtn.textContent = '🔍 扫描连接';
      }
    };
    DeviceManager.onStatusChange = updateConnUI;
    updateConnUI(DeviceManager.getConnectionStatus());

    if (bleConnectBtn) {
      bleConnectBtn.addEventListener('click', async () => {
        if (DeviceManager.isBleConnected) {
          await DeviceManager.disconnectBle();
          UI.showToast('已断开蓝牙连接');
        } else {
          try {
            if (bleStatusDot) bleStatusDot.className = 'conn-status-dot connecting';
            if (bleStatusText) bleStatusText.textContent = '正在搜索蓝牙外设...';
            const name = await DeviceManager.connectBle();
            UI.showToast(`成功连接到蓝牙设备: ${name}`, 'success');
          } catch (e) {
            if (bleStatusDot) bleStatusDot.className = 'conn-status-dot';
            if (bleStatusText) bleStatusText.textContent = '● 已断开连接';
            UI.showToast(`蓝牙连接失败: ${e.message}`, 'error');
          }
        }
      });
    }

    // Top status modals
    document.getElementById('btnDevManage')?.addEventListener('click', () => UI.openDeviceManagerModal());
    document.getElementById('btnAirProv')?.addEventListener('click', () => UI.openAirProvisionModal());
    document.getElementById('btnLanIp')?.addEventListener('click', () => UI.openLanIpModal());
    document.getElementById('btnSendAirProv')?.addEventListener('click', () => UI.executeBleAirProvision());
    document.getElementById('btnSaveLanIp')?.addEventListener('click', () => UI.saveCustomLanIp());

    // 6. Push Buttons
    document.getElementById('badgePushBtn')?.addEventListener('click', () => this.pushCanvas(this.badgeCanvas, '工牌'));
    document.getElementById('itabagPushBtn')?.addEventListener('click', () => {
      const c = window.ItaBagStudio?.getCanvas ? window.ItaBagStudio.getCanvas() : document.getElementById('itaPreviewCanvas');
      this.pushCanvas(c, '痛卡挂件');
    });
    document.getElementById('memoPushBtn')?.addEventListener('click', () => this.pushCanvas(this.memoCanvas, '便签'));
    document.getElementById('paintPushBtn')?.addEventListener('click', () => this.pushCanvas(this.paintCanvas, '手绘画作'));
    document.getElementById('imagePushBtn')?.addEventListener('click', () => this.pushCanvas(this.imageLabCanvas, '精修相册'));

    // 7. Save Preset Buttons
    document.getElementById('badgeSavePresetBtn')?.addEventListener('click', () => this.promptSavePreset(this.badgeCanvas, 'badge', '个性工牌预设'));
    document.getElementById('itabagSavePresetBtn')?.addEventListener('click', () => {
      const c = window.ItaBagStudio?.getCanvas ? window.ItaBagStudio.getCanvas() : document.getElementById('itaPreviewCanvas');
      this.promptSavePreset(c, 'itabag', '兽聚痛卡预设');
    });
    document.getElementById('memoSavePresetBtn')?.addEventListener('click', () => this.promptSavePreset(this.memoCanvas, 'memo', '待办便签预设'));
    document.getElementById('paintSavePresetBtn')?.addEventListener('click', () => this.promptSavePreset(this.paintCanvas, 'paint', '像素手绘预设'));
    document.getElementById('imageSavePresetBtn')?.addEventListener('click', () => this.promptSavePreset(this.imageLabCanvas, 'image', '图像作品预设'));

    // 8. 1:1 Dither Physical Preview Buttons on Each Tab
    document.querySelectorAll('[data-dither-preview]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-dither-preview');
        const targetCanvas = document.getElementById(targetId) || this.badgeCanvas;
        UI.openDitherPreviewModal(targetCanvas);
      });
    });

    // 9. Tab 6 Scenes Remote & Controls
    // 4 Clear buttons
    document.querySelectorAll('[data-clear-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-clear-cmd');
        if (window.ScenesStudio) window.ScenesStudio.sendRemoteCmd(cmd);
      });
    });

    // 12 Mode switchers
    document.querySelectorAll('[data-mode-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode-cmd');
        if (window.ScenesStudio) window.ScenesStudio.sendRemoteCmd(`mode:${mode}`);
      });
    });

    // 4 RF mode switchers
    document.querySelectorAll('[data-rf-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rf = btn.getAttribute('data-rf-cmd');
        if (window.ScenesStudio) window.ScenesStudio.sendRemoteCmd(`rf:${rf}`);
      });
    });

    // 2bpp BIN export & import
    document.getElementById('btnExportBin')?.addEventListener('click', () => UI.exportCanvasAsBin());
    document.getElementById('btnImportBin')?.addEventListener('click', () => document.getElementById('importBinInput')?.click());
    document.getElementById('importBinInput')?.addEventListener('change', (e) => UI.handleImportBinFile(e));

    // 10. Presets Toolbar
    document.getElementById('presetSelectAllBtn')?.addEventListener('click', () => {
      PresetHub.selectAll();
      this.renderPresetsUI();
    });

    document.getElementById('presetDeleteSelectedBtn')?.addEventListener('click', async () => {
      if (confirm(`确定删除选中的 ${PresetHub.selectedIds.size} 项预设吗？`)) {
        const count = await PresetHub.deleteSelected();
        this.renderPresetsUI();
        UI.showToast(`已删除 ${count} 项预设`, 'success');
      }
    });

    document.getElementById('presetBatchUploadBtn')?.addEventListener('click', async () => {
      const isConn = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
        || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);
      if (!isConn) {
        UI.showToast('⚠️ 未连通单片机硬件，请先在顶部连接蓝牙或局域网！', 'warning', 4000);
        return;
      }
      UI.showToast('正在批量向单片机写入所有本地离线预设...', 'info', 4000);
      const count = await PresetHub.uploadAllLocalPresetsToHardware((pct, msg) => {
        UI.showToast(msg, 'info', 2000);
      });
      this.renderPresetsUI();
      UI.showToast(`🎉 已成功将 ${count} 项离线预设全部烧录写入单片机 Flash 存储！`, 'success', 4500);
    });

    document.getElementById('presetSyncBtn')?.addEventListener('click', async () => {
      const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
        || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);

      if (!isHardwareConnected) {
        UI.showToast('⚠️ 未连通单片机硬件，请先在顶部连接蓝牙或局域网', 'warning', 4000);
        return;
      }

      UI.showToast('正在从单片机 Flash 存储同步预设列表与空间配额...', 'info', 2500);
      const ok = await PresetHub.syncWithDevice();
      this.renderPresetsUI();
      if (ok) {
        UI.showToast('🎉 预设列表已与单片机 Flash 内部存储同步完成！', 'success', 3500);
      } else {
        UI.showToast('⚠️ 单片机同步响应超时，已保留本地预设缓存', 'warning', 4000);
      }
    });

    // 11. Modal Push Dither
    document.getElementById('modalPushDitherBtn')?.addEventListener('click', () => UI.pushModalDither());

    // 12. Tab Change Hook
    window.addEventListener('tabchange', async (e) => {
      const tabId = e.detail.tabId;
      if (tabId === 'badge') {
        this.renderBadge();
      } else if (tabId === 'itabag' && window.ItaBagStudio) {
        window.ItaBagStudio.renderPreview();
      } else if (tabId === 'memo') {
        this.renderMemo();
      } else if (tabId === 'image') {
        this.renderImageLab();
      } else if (tabId === 'scenes' && window.ScenesStudio) {
        window.ScenesStudio.renderPreview();
      } else if (tabId === 'presets') {
        PresetHub.syncWithDevice().then(() => this.renderPresetsUI());
      } else if (tabId === 'system' && DeviceManager.isLanConnected) {
        const status = await DeviceManager.fetchStatus();
        if (status) {
          const heapEl = document.getElementById('diagFreeHeap');
          const ipEl = document.getElementById('diagIp');
          const rssiEl = document.getElementById('diagRssi');
          const storEl = document.getElementById('diagStorage');
          if (heapEl) heapEl.textContent = `${status.free_heap} bytes (最低 ${status.min_free_heap} bytes)`;
          if (ipEl) ipEl.textContent = status.ip_address;
          if (rssiEl) rssiEl.textContent = `${status.wifi_rssi} dBm`;
          if (storEl) storEl.textContent = `${Math.round(status.storage_free_bytes / 1024)} KB free / ${Math.round(status.storage_partition_size / 1024)} KB total`;
        }
      }
    });
  }
};

window.App = App;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
