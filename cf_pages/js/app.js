/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Main Application Orchestrator & Event Controller
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Core Subsystems
  UI.init();
  DeviceManager.init();
  PresetHub.init();

  // 2. Setup Canvases
  const badgeCanvas = document.getElementById('badgePreviewCanvas');
  const memoCanvas = document.getElementById('memoPreviewCanvas');
  const paintCanvas = document.getElementById('paintDrawingCanvas');
  const imageLabCanvas = document.getElementById('imageLabCanvas');
  const modalCanvas = document.getElementById('modalPreviewCanvas');

  if (paintCanvas) {
    PaintCanvas.init(paintCanvas);
  }

  // Helper to re-render active studio
  function renderBadge() {
    if (!badgeCanvas) return;
    Studios.renderBadge(badgeCanvas, {
      template: document.getElementById('badgeTemplate')?.value || 'hacker',
      name: document.getElementById('badgeName')?.value || 'ZGQ',
      handle: document.getElementById('badgeHandle')?.value || '@zgq_inc',
      title: document.getElementById('badgeTitle')?.value || 'Hardware Hacker',
      bio: document.getElementById('badgeBio')?.value || 'Building open-source smart hardware.',
      qrText: document.getElementById('badgeQrText')?.value || 'https://domain.zgqinc.gq/'
    });
  }

  function renderMemo() {
    if (!memoCanvas) return;
    const itemsRaw = document.getElementById('memoItems')?.value || '';
    Studios.renderMemo(memoCanvas, {
      title: document.getElementById('memoTitle')?.value || '待办清单',
      items: itemsRaw.split('\n'),
      date: new Date().toLocaleDateString('zh-CN')
    });
  }

  // Initial renders
  renderBadge();
  renderMemo();

  // 3. Bind Studio Form Change Events
  document.querySelectorAll('.badge-input').forEach(el => {
    el.addEventListener('input', renderBadge);
    el.addEventListener('change', renderBadge);
  });

  document.querySelectorAll('.memo-input').forEach(el => {
    el.addEventListener('input', renderMemo);
    el.addEventListener('change', renderMemo);
  });

  // 4. Paint Canvas Controls
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

  // 5. Image Lab Controls
  let uploadedImg = null;
  const imageUploadInput = document.getElementById('imageUploadInput');
  if (imageUploadInput && imageLabCanvas) {
    imageUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          uploadedImg = img;
          renderImageLab();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderImageLab() {
    if (!uploadedImg || !imageLabCanvas) return;
    imageLabCanvas.width = 768;
    imageLabCanvas.height = 552;
    const ctx = imageLabCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 768, 552);

    // Draw scaled & centered
    const scale = Math.min(768 / uploadedImg.width, 552 / uploadedImg.height);
    const w = uploadedImg.width * scale;
    const h = uploadedImg.height * scale;
    const x = (768 - w) / 2;
    const y = (552 - h) / 2;
    ctx.drawImage(uploadedImg, x, y, w, h);

    // Apply Dithering preview in-place
    const algo = document.getElementById('imageAlgoSelect')?.value || 'floyd';
    const packed = BWRY.ditherCanvasTo2bpp(imageLabCanvas, algo);
    BWRY.render2bppToCanvas(imageLabCanvas, packed);
  }

  document.getElementById('imageAlgoSelect')?.addEventListener('change', renderImageLab);

  // 6. Connectivity Controls (WebBLE + LAN IP)
  const bleConnectBtn = document.getElementById('bleConnectBtn');
  const bleStatusDot = document.getElementById('bleStatusDot');
  const bleStatusText = document.getElementById('bleStatusText');
  const lanIpInput = document.getElementById('lanIpInput');
  const lanConnectBtn = document.getElementById('lanConnectBtn');

  function updateConnUI(status) {
    if (status.type === 'ble') {
      bleStatusDot.className = 'conn-status-dot connected';
      bleStatusText.textContent = `蓝牙已连接: ${status.name}`;
      if (bleConnectBtn) bleConnectBtn.textContent = '断开蓝牙';
    } else if (status.type === 'lan') {
      bleStatusDot.className = 'conn-status-dot connected';
      bleStatusText.textContent = `局域网已连接: ${status.name}`;
    } else {
      bleStatusDot.className = 'conn-status-dot';
      bleStatusText.textContent = '未连接设备';
      if (bleConnectBtn) bleConnectBtn.textContent = '连接蓝牙';
    }
  }

  DeviceManager.onStatusChange = updateConnUI;
  updateConnUI(DeviceManager.getConnectionStatus());

  if (bleConnectBtn) {
    bleConnectBtn.addEventListener('click', async () => {
      if (DeviceManager.isBleConnected) {
        await DeviceManager.disconnectBle();
        UI.showToast('已断开蓝牙连接');
      } else {
        try {
          bleStatusDot.className = 'conn-status-dot connecting';
          bleStatusText.textContent = '正在搜索蓝牙外设...';
          const name = await DeviceManager.connectBle();
          UI.showToast(`成功连接到蓝牙设备: ${name}`, 'success');
        } catch (e) {
          bleStatusDot.className = 'conn-status-dot';
          bleStatusText.textContent = '连接取消或失败';
          UI.showToast(`蓝牙连接失败: ${e.message}`, 'error');
        }
      }
    });
  }

  if (lanConnectBtn && lanIpInput) {
    lanIpInput.value = DeviceManager.lanIp;
    lanConnectBtn.addEventListener('click', async () => {
      const ip = lanIpInput.value.trim();
      if (!ip) {
        UI.showToast('请输入有效的局域网 IP 地址', 'warning');
        return;
      }
      lanConnectBtn.disabled = true;
      lanConnectBtn.textContent = '连接中...';
      const ok = await DeviceManager.setLanIp(ip);
      lanConnectBtn.disabled = false;
      lanConnectBtn.textContent = '测试连接';
      if (ok) {
        UI.showToast(`成功连接到局域网设备 http://${ip}/`, 'success');
        PresetHub.syncWithDevice().then(renderPresetsUI);
      } else {
        UI.showToast(`无法连通 http://${ip}/，请确认设备在同一 WiFi 局域网且处于开机状态`, 'error');
      }
    });
  }

  // 7. Unified Push Action (Works from any active studio!)
  async function pushCurrentCanvas(canvas, name) {
    if (!canvas) return;
    try {
      UI.showToast(`正在量化并推送至墨水屏...`, 'info', 4000);
      const packed = BWRY.ditherCanvasTo2bpp(canvas, 'floyd');
      await DeviceManager.pushBitmap2bpp(packed, (pct) => {
        console.log(`[Push Progress]: ${pct}%`);
      });
      UI.showToast(`🎉 成功推送到 3.98" 墨水屏！刷新中...`, 'success', 4000);
    } catch (e) {
      UI.showToast(`推送失败: ${e.message}`, 'error', 4000);
    }
  }

  document.getElementById('badgePushBtn')?.addEventListener('click', () => pushCurrentCanvas(badgeCanvas, '工牌'));
  document.getElementById('memoPushBtn')?.addEventListener('click', () => pushCurrentCanvas(memoCanvas, '便签'));
  document.getElementById('paintPushBtn')?.addEventListener('click', () => pushCurrentCanvas(paintCanvas, '画板'));
  document.getElementById('imagePushBtn')?.addEventListener('click', () => pushCurrentCanvas(imageLabCanvas, '图片'));

  // 8. Save Preset Action (from any active studio!)
  async function promptSavePreset(canvas, type, defaultTitle) {
    if (!canvas) return;
    const name = prompt('请输入预设名称（留空使用默认名称）:', defaultTitle);
    if (name === null) return; // user cancelled

    try {
      const packed = BWRY.ditherCanvasTo2bpp(canvas, 'floyd');
      await PresetHub.savePreset({
        name,
        type,
        typeLabel: type === 'badge' ? '工牌名片' : (type === 'memo' ? '待办清单' : (type === 'paint' ? '像素手绘' : '图像工坊')),
        rawBitmap: packed
      });
      renderPresetsUI();
      UI.showToast(`已成功保存预设「${name || defaultTitle}」！`, 'success');
    } catch (e) {
      UI.showToast(`保存失败: ${e.message}`, 'error', 4000);
    }
  }

  document.getElementById('badgeSavePresetBtn')?.addEventListener('click', () => promptSavePreset(badgeCanvas, 'badge', '个性工牌预设'));
  document.getElementById('memoSavePresetBtn')?.addEventListener('click', () => promptSavePreset(memoCanvas, 'memo', '待办便签预设'));
  document.getElementById('paintSavePresetBtn')?.addEventListener('click', () => promptSavePreset(paintCanvas, 'paint', '像素手绘预设'));
  document.getElementById('imageSavePresetBtn')?.addEventListener('click', () => promptSavePreset(imageLabCanvas, 'image', '图像作品预设'));

  // 9. Presets Hub UI Rendering & Multi-Select Delete
  function renderPresetsUI() {
    const listEl = document.getElementById('presetList');
    const usedText = document.getElementById('storageUsedText');
    const freeText = document.getElementById('storageFreeText');
    const progressFill = document.getElementById('storageProgressFill');
    const deleteBtn = document.getElementById('presetDeleteSelectedBtn');

    if (!listEl) return;

    // Capacity Bar
    const total = PresetHub.storageStats.total_bytes || 1528841;
    const used = PresetHub.storageStats.used_bytes || 0;
    const free = PresetHub.storageStats.free_bytes || 0;
    const pct = Math.min(100, Math.round((used / total) * 100));

    if (usedText) usedText.textContent = PresetHub.formatBytes(used);
    if (freeText) freeText.textContent = PresetHub.formatBytes(free);
    if (progressFill) progressFill.style.width = `${pct}%`;

    // Presets List
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

    // Checkbox toggle
    listEl.querySelectorAll('.preset-check').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.getAttribute('data-id');
        PresetHub.toggleSelect(id);
        renderPresetsUI();
      });
    });

    // Preview button
    listEl.querySelectorAll('.preset-preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const preset = PresetHub.presets.find(p => p.id === id);
        if (preset && preset.raw_bitmap && modalCanvas) {
          BWRY.render2bppToCanvas(modalCanvas, new Uint8Array(preset.raw_bitmap));
          UI.openModal('presetPreviewModal');
        } else {
          UI.showToast('该预设未包含点阵位图数据', 'warning');
        }
      });
    });

    // Preset push button
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
  }

  document.getElementById('presetSelectAllBtn')?.addEventListener('click', () => {
    PresetHub.selectAll();
    renderPresetsUI();
  });

  document.getElementById('presetDeleteSelectedBtn')?.addEventListener('click', async () => {
    if (confirm(`确定删除选中的 ${PresetHub.selectedIds.size} 项预设吗？`)) {
      const count = await PresetHub.deleteSelected();
      renderPresetsUI();
      UI.showToast(`已删除 ${count} 项预设`, 'success');
    }
  });

  document.getElementById('presetSyncBtn')?.addEventListener('click', async () => {
    UI.showToast('正在从硬件 SPIFFS 同步预设...', 'info');
    const ok = await PresetHub.syncWithDevice();
    renderPresetsUI();
    if (ok) UI.showToast('预设列表已与单片机存储同步', 'success');
    else UI.showToast('未连通局域网单片机，已加载本地离线预设', 'warning');
  });

  renderPresetsUI();

  // 10. System Diag Panel
  window.addEventListener('tabchange', async (e) => {
    if (e.detail.tabId === 'presets') {
      PresetHub.syncWithDevice().then(renderPresetsUI);
    } else if (e.detail.tabId === 'system' && DeviceManager.isLanConnected) {
      const status = await DeviceManager.fetchStatus();
      if (status) {
        document.getElementById('diagFreeHeap').textContent = `${status.free_heap} bytes (最低 ${status.min_free_heap} bytes)`;
        document.getElementById('diagIp').textContent = status.ip_address;
        document.getElementById('diagRssi').textContent = `${status.wifi_rssi} dBm`;
        document.getElementById('diagStorage').textContent = `${status.storage_free_bytes / 1024} KB free / ${status.storage_partition_size / 1024} KB total`;
      }
    }
  });

  // 11. PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('[PWA] Service Worker registered successfully:', reg.scope);
    }).catch((err) => {
      console.warn('[PWA] Service Worker registration failed:', err);
    });
  }
});
