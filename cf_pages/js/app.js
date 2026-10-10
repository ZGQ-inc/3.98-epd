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

  init() {
    console.log('[App] Initializing subsystems...');
    UI.init();
    DeviceManager.init();
    PresetHub.init();

    this.badgeCanvas = document.getElementById('badgePreviewCanvas');
    this.memoCanvas = document.getElementById('memoPreviewCanvas');
    this.paintCanvas = document.getElementById('paintDrawingCanvas');
    this.imageLabCanvas = document.getElementById('imageLabCanvas');
    this.modalCanvas = document.getElementById('modalPreviewCanvas');

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

    // Setup Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('[PWA] Service Worker registered:', reg.scope);
      }).catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
    }
    console.log('[App] Ready!');
  },

  renderBadge() {
    if (!this.badgeCanvas) return;
    Studios.renderBadge(this.badgeCanvas, {
      template: document.getElementById('badgeTemplate')?.value || 'hacker',
      name: document.getElementById('badgeName')?.value || 'ZGQ',
      handle: document.getElementById('badgeHandle')?.value || '@zgq_inc',
      title: document.getElementById('badgeTitle')?.value || 'Hardware Hacker',
      bio: document.getElementById('badgeBio')?.value || 'Building open-source smart hardware.',
      qrText: document.getElementById('badgeQrText')?.value || 'https://domain.zgqinc.gq/'
    });
  },

  renderMemo() {
    if (!this.memoCanvas) return;
    const itemsRaw = document.getElementById('memoItems')?.value || '';
    Studios.renderMemo(this.memoCanvas, {
      title: document.getElementById('memoTitle')?.value || '今日核心待办',
      items: itemsRaw.split('\n'),
      date: new Date().toLocaleDateString('zh-CN')
    });
  },

  renderImageLab() {
    if (!this.uploadedImg || !this.imageLabCanvas) return;
    this.imageLabCanvas.width = 768;
    this.imageLabCanvas.height = 552;
    const ctx = this.imageLabCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 768, 552);

    const scale = Math.min(768 / this.uploadedImg.width, 552 / this.uploadedImg.height);
    const w = this.uploadedImg.width * scale;
    const h = this.uploadedImg.height * scale;
    const x = (768 - w) / 2;
    const y = (552 - h) / 2;
    ctx.drawImage(this.uploadedImg, x, y, w, h);

    const algo = document.getElementById('imageAlgoSelect')?.value || 'floyd';
    const packed = BWRY.ditherCanvasTo2bpp(this.imageLabCanvas, algo);
    BWRY.render2bppToCanvas(this.imageLabCanvas, packed);
  },

  async pushCanvas(canvas, name) {
    if (!canvas) return;
    try {
      UI.showToast(`正在量化并推送【${name}】至墨水屏...`, 'info', 4000);
      const packed = BWRY.ditherCanvasTo2bpp(canvas, 'floyd');
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
    const name = prompt('请输入预设名称（留空使用默认名称）:', defaultTitle);
    if (name === null) return;

    try {
      const packed = BWRY.ditherCanvasTo2bpp(canvas, 'floyd');
      const typeLabelMap = {
        badge: '工牌名片',
        itabag: '兽聚痛卡',
        memo: '待办清单',
        paint: '像素手绘',
        image: '图像工坊',
        scenes: '场景模式'
      };
      await PresetHub.savePreset({
        name,
        type,
        typeLabel: typeLabelMap[type] || '墨水屏作品',
        rawBitmap: packed
      });
      this.renderPresetsUI();
      UI.showToast(`已成功保存预设「${name || defaultTitle}」！`, 'success');
    } catch (e) {
      UI.showToast(`保存失败: ${e.message}`, 'error', 4000);
    }
  },

  renderPresetsUI() {
    const listEl = document.getElementById('presetList');
    const usedText = document.getElementById('storageUsedText');
    const freeText = document.getElementById('storageFreeText');
    const progressFill = document.getElementById('storageProgressFill');
    const deleteBtn = document.getElementById('presetDeleteSelectedBtn');

    if (!listEl) return;

    const total = PresetHub.storageStats.total_bytes || 1528841;
    const used = PresetHub.storageStats.used_bytes || 0;
    const free = PresetHub.storageStats.free_bytes || 0;
    const pct = Math.min(100, Math.round((used / total) * 100));

    if (usedText) usedText.textContent = PresetHub.formatBytes(used);
    if (freeText) freeText.textContent = PresetHub.formatBytes(free);
    if (progressFill) progressFill.style.width = `${pct}%`;

    if (PresetHub.presets.length === 0) {
      listEl.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:32px; color:var(--md-sys-color-outline);">
        📂 暂无已保存预设。您可以在工牌、便签、画板或图片工坊中点击「保存为预设」，一键记录所有效果！
      </div>`;
      if (deleteBtn) deleteBtn.disabled = true;
      return;
    }

    if (deleteBtn) {
      deleteBtn.disabled = PresetHub.selectedIds.size === 0;
      deleteBtn.textContent = `删除选中 (${PresetHub.selectedIds.size})`;
    }

    listEl.innerHTML = PresetHub.presets.map(p => {
      const isSelected = PresetHub.selectedIds.has(p.id);
      return `
        <div class="preset-card ${isSelected ? 'selected' : ''}" data-id="${p.id}">
          <div class="preset-card-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" class="preset-check" data-id="${p.id}" ${isSelected ? 'checked' : ''}>
              <strong style="font-size:14px;">${p.name}</strong>
            </div>
            <span class="preset-type-badge">${p.type_label}</span>
          </div>
          <div style="font-size:12px; color:var(--md-sys-color-outline); display:flex; justify-content:space-between;">
            <span>大小: ${p.size_str || '104 KB'}</span>
            <span>${p.created_str || ''}</span>
          </div>
          <div class="preset-actions">
            <button class="m3-btn small outlined preset-preview-btn" data-id="${p.id}">👁️ 预览</button>
            <button class="m3-btn small preset-push-btn" data-id="${p.id}">🚀 推送</button>
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
          UI.openModal('presetPreviewModal');
        } else {
          UI.showToast('该预设未包含点阵位图数据', 'warning');
        }
      });
    });

    listEl.querySelectorAll('.preset-push-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const preset = PresetHub.presets.find(p => p.id === id);
        if (preset && preset.raw_bitmap) {
          try {
            UI.showToast(`正在推送预设「${preset.name}」至墨水屏...`, 'info', 4000);
            await DeviceManager.pushBitmap2bpp(new Uint8Array(preset.raw_bitmap));
            UI.showToast(`🎉 预设「${preset.name}」推送成功！`, 'success', 4000);
          } catch (e) {
            UI.showToast(`推送失败: ${e.message}`, 'error', 4000);
          }
        }
      });
    });
  },

  bindEvents() {
    // Badge inputs
    document.querySelectorAll('.badge-input').forEach(el => {
      el.addEventListener('input', () => this.renderBadge());
      el.addEventListener('change', () => this.renderBadge());
    });

    // Memo inputs
    document.querySelectorAll('.memo-input').forEach(el => {
      el.addEventListener('input', () => this.renderMemo());
      el.addEventListener('change', () => this.renderMemo());
    });

    // Paint Canvas Controls
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        PaintCanvas.currentTool = btn.getAttribute('data-tool');
      });
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        PaintCanvas.currentColor = swatch.getAttribute('data-color');
      });
    });

    document.getElementById('paintClearBtn')?.addEventListener('click', () => PaintCanvas.clear());
    document.getElementById('paintUndoBtn')?.addEventListener('click', () => PaintCanvas.undo());
    document.getElementById('paintRedoBtn')?.addEventListener('click', () => PaintCanvas.redo());
    document.getElementById('paintLineWidth')?.addEventListener('input', (e) => {
      PaintCanvas.lineWidth = parseInt(e.target.value) || 4;
    });

    // Image Lab
    const imageUploadInput = document.getElementById('imageUploadInput');
    if (imageUploadInput) {
      imageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            this.uploadedImg = img;
            this.renderImageLab();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    }
    document.getElementById('imageAlgoSelect')?.addEventListener('change', () => this.renderImageLab());

    // Connect Bluetooth
    const bleConnectBtn = document.getElementById('bleConnectBtn');
    const bleStatusDot = document.getElementById('bleStatusDot');
    const bleStatusText = document.getElementById('bleStatusText');
    const lanIpInput = document.getElementById('lanIpInput');
    const lanConnectBtn = document.getElementById('lanConnectBtn');

    const updateConnUI = (status) => {
      if (status.type === 'ble') {
        if (bleStatusDot) bleStatusDot.className = 'conn-status-dot connected';
        if (bleStatusText) bleStatusText.textContent = `蓝牙已连接: ${status.name}`;
        if (bleConnectBtn) bleConnectBtn.textContent = '断开蓝牙';
      } else if (status.type === 'lan') {
        if (bleStatusDot) bleStatusDot.className = 'conn-status-dot connected';
        if (bleStatusText) bleStatusText.textContent = `局域网已连接: ${status.name}`;
      } else {
        if (bleStatusDot) bleStatusDot.className = 'conn-status-dot';
        if (bleStatusText) bleStatusText.textContent = '未连接设备';
        if (bleConnectBtn) bleConnectBtn.textContent = '连接蓝牙';
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
            if (bleStatusText) bleStatusText.textContent = '连接取消或失败';
            UI.showToast(`蓝牙连接失败: ${e.message}`, 'error');
          }
        }
      });
    }

    if (lanConnectBtn && lanIpInput) {
      lanIpInput.value = DeviceManager.lanIp;
      lanConnectBtn.addEventListener('click', async () => {
        const ip = lanIpInput.value.trim();
        if (!ip) return UI.showToast('请输入有效的局域网 IP', 'warning');
        lanConnectBtn.disabled = true;
        lanConnectBtn.textContent = '连接中...';
        const ok = await DeviceManager.setLanIp(ip);
        lanConnectBtn.disabled = false;
        lanConnectBtn.textContent = '连接 IP';
        if (ok) {
          UI.showToast(`成功连接到设备 http://${ip}/`, 'success');
          PresetHub.syncWithDevice().then(() => this.renderPresetsUI());
        } else {
          UI.showToast(`无法连通 http://${ip}/`, 'error');
        }
      });
    }

    // Push Buttons
    document.getElementById('badgePushBtn')?.addEventListener('click', () => this.pushCanvas(this.badgeCanvas, '工牌'));
    document.getElementById('memoPushBtn')?.addEventListener('click', () => this.pushCanvas(this.memoCanvas, '便签'));
    document.getElementById('paintPushBtn')?.addEventListener('click', () => this.pushCanvas(this.paintCanvas, '画板'));
    document.getElementById('imagePushBtn')?.addEventListener('click', () => this.pushCanvas(this.imageLabCanvas, '图片'));

    // Save Preset Buttons
    document.getElementById('badgeSavePresetBtn')?.addEventListener('click', () => this.promptSavePreset(this.badgeCanvas, 'badge', '个性工牌预设'));
    document.getElementById('memoSavePresetBtn')?.addEventListener('click', () => this.promptSavePreset(this.memoCanvas, 'memo', '待办便签预设'));
    document.getElementById('paintSavePresetBtn')?.addEventListener('click', () => this.promptSavePreset(this.paintCanvas, 'paint', '像素手绘预设'));
    document.getElementById('imageSavePresetBtn')?.addEventListener('click', () => this.promptSavePreset(this.imageLabCanvas, 'image', '图像作品预设'));

    // Preset Toolbar
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

    document.getElementById('presetSyncBtn')?.addEventListener('click', async () => {
      UI.showToast('正在同步预设...', 'info');
      const ok = await PresetHub.syncWithDevice();
      this.renderPresetsUI();
      if (ok) UI.showToast('预设列表已与单片机同步', 'success');
      else UI.showToast('未连通单片机，已加载本地预设', 'warning');
    });

    // Tab Change Hook
    window.addEventListener('tabchange', async (e) => {
      const tabId = e.detail.tabId;
      if (tabId === 'itabag' && window.ItaBagStudio) {
        window.ItaBagStudio.renderPreview();
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

// Bulletproof execution ensuring we run even if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
