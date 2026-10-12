/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Main Application Orchestrator & Event Controller
 * Copyright (c) 2026 ZGQ Inc. Licensed under the MIT License.
 */

const App = {
  badgeCanvas: null,
  memoCanvas: null,
  paintCanvas: null,
  imageLabCanvas: null,
  modalCanvas: null,
  uploadedImg: null,
  badgeTemplate: 'geek',
  imagePanX: 0,
  imagePanY: 0,
  imageScale: 1.0,
  isDraggingImage: false,
  imageDragStart: { clientX: 0, clientY: 0, panX: 0, panY: 0 },
  isDraggingHandle: false,
  activeHandleType: null,
  handleDragStart: null,
  _ditherDebounceTimer: null,
  _activeImageLabPacked: null,

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

  /*  1. Smart Badge Studio  */
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

  /*  2. Memo & Checklist  */
  renderMemo() {
    if (!this.memoCanvas) return;
    const title = document.getElementById('memoTitle')?.value || 'TODAY TO-DO LIST';
    const itemsRaw = document.getElementById('memoItems')?.value || '';
    const footer = document.getElementById('memoFooter')?.value || '保持专注，逐项击破！';

    Studios.renderMemo(this.memoCanvas, {
      title,
      items: itemsRaw.split('\n'),
      footer,
      date: new Date().toLocaleDateString('zh-CN'),
      orientation: UI.orientation
    });
  },

  /*  3. Image Lab (9 Algorithms & Sliders)  */
  loadImageFile(file) {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      UI.showToast('请拖入有效的图片文件 (PNG / JPG / WEBP / BMP)', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        this.uploadedImg = img;
        this.imagePanX = 0;
        this.imagePanY = 0;
        this.imageScale = 1.0;
        this.updateImageZoomBadge();
        this.renderImageLab();
        UI.showToast(`🎉 已成功载入图片「${file.name || '相册图片'}」(${img.width}×${img.height})`, 'success');
      };
      img.onerror = () => {
        UI.showToast('图片解析失败，请检查文件格式', 'error');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  },

  updateImageZoomBadge() {
    const badge = document.getElementById('imageZoomBadge');
    if (badge) {
      badge.textContent = `${Math.round((this.imageScale || 1.0) * 100)}%`;
    }
  },

  updateImageSelectBox() {
    const box = document.getElementById('imageSelectBox');
    const canvas = this.imageLabCanvas;
    if (!box || !canvas || !this.uploadedImg) {
      if (box) box.style.display = 'none';
      return;
    }

    const isPortrait = (UI.orientation === 90 || UI.orientation === 270);
    const w = isPortrait ? 552 : 768;
    const h = isPortrait ? 768 : 552;

    const baseScale = Math.min(w / this.uploadedImg.width, h / this.uploadedImg.height);
    const totalScale = baseScale * (this.imageScale || 1.0);
    const dw = this.uploadedImg.width * totalScale;
    const dh = this.uploadedImg.height * totalScale;
    const dx = (w - dw) / 2 + (this.imagePanX || 0);
    const dy = (h - dh) / 2 + (this.imagePanY || 0);

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / w;
    const scaleY = rect.height / h;

    box.style.display = 'block';
    box.style.left = `${dx * scaleX}px`;
    box.style.top = `${dy * scaleY}px`;
    box.style.width = `${dw * scaleX}px`;
    box.style.height = `${dh * scaleY}px`;
  },

  renderImageLab(fastPreview = false) {
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
      ctx.font = '20px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📷 点击此处上传或拖入图片 (PNG / JPG / WEBP)', w / 2, h / 2 - 12);
      ctx.font = '15px "PingFang SC", sans-serif';
      ctx.fillStyle = '#a0a2ab';
      ctx.fillText('支持四周小圆点缩放 · 画布任意拖动平移', w / 2, h / 2 + 18);
      ctx.textAlign = 'left';
      this.updateImageSelectBox();
      return;
    }

    // 默认不遮挡自适应长宽 (Adaptive Contain Fit)
    const baseScale = Math.min(w / this.uploadedImg.width, h / this.uploadedImg.height);
    const totalScale = baseScale * (this.imageScale || 1.0);
    const dw = this.uploadedImg.width * totalScale;
    const dh = this.uploadedImg.height * totalScale;
    const dx = (w - dw) / 2 + (this.imagePanX || 0);
    const dy = (h - dh) / 2 + (this.imagePanY || 0);

    ctx.drawImage(this.uploadedImg, dx, dy, dw, dh);
    this.updateImageSelectBox();

    if (fastPreview) {
      // 快速拖拽平移与滚轮缩放时仅实时绘制几何变换，保持 60fps 流畅手感
      return;
    }

    const algo = document.getElementById('imageAlgoSelect')?.value || 'floyd';
    const contrast = parseFloat(document.getElementById('imageContrastSlider')?.value ?? 15);
    const brightness = parseFloat(document.getElementById('imageBrightnessSlider')?.value ?? 0);
    const redBoostVal = parseFloat(document.getElementById('imageRedBoostSlider')?.value || 0);
    const yellowBoostVal = parseFloat(document.getElementById('imageYellowBoostSlider')?.value || 0);
    const redBoost = redBoostVal > 0 ? 1.0 + (redBoostVal / 50) : 1.0;
    const yellowBoost = yellowBoostVal > 0 ? 1.0 + (yellowBoostVal / 50) : 1.0;

    const packed = BWRY.ditherCanvasTo2bpp(canvas, algo, {
      contrast,
      brightness,
      redBoost,
      yellowBoost
    });
    this._activeImageLabPacked = packed;
    BWRY.render2bppToCanvas(canvas, packed);
    this.updateImageSelectBox();
  },

  /*  4. Push & Presets Engine  */
  async pushCanvas(canvas, name) {
    if (!canvas) return;
    try {
      UI.showToast(`正在量化并推送【${name}】至墨水屏...`, 'info', 4000);
      let packed;
      if (canvas === this.imageLabCanvas && this._activeImageLabPacked) {
        packed = this._activeImageLabPacked;
      } else {
        const algo = document.getElementById('imageAlgoSelect')?.value || 'floyd';
        packed = BWRY.ditherCanvasTo2bpp(canvas, algo, { orientation: UI.orientation });
      }
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

    // Ensure confirm button is completely unlocked and old disabled state is cleared
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.removeAttribute('disabled');
    }

    const updateDestUI = () => {
      const activeConfirmBtn = document.getElementById('btnConfirmWritePreset');
      if (selectedDest === 'hardware') {
        if (destHwBtn) destHwBtn.className = 'm3-btn small tonal save-dest-tab active';
        if (destLocalBtn) destLocalBtn.className = 'm3-btn small outlined save-dest-tab';
        if (targetLabel) targetLabel.textContent = '单片机 Flash (SPIFFS)';
        if (checkTitle) checkTitle.textContent = '单片机 Flash 余量';
        if (storageCheck) {
          if (!isHardwareConnected) {
            storageCheck.innerHTML = `<span style="color:#ff9800;">⚠️ 硬件未连接 (写入可能失败)</span>`;
          } else if (PresetHub._hasRemoteStorageStats && PresetHub.storageStats.free_bytes < 110 * 1024) {
            storageCheck.innerHTML = `<span style="color:#f44336;">⚠️ 空间告急：剩余 ${PresetHub.formatBytes(PresetHub.storageStats.free_bytes)}</span>`;
          } else if (PresetHub._hasRemoteStorageStats) {
            storageCheck.innerHTML = `<span style="color:#4caf50;">✓ 空间充裕：剩余 ${PresetHub.formatBytes(PresetHub.storageStats.free_bytes)}</span>`;
          } else {
            storageCheck.innerHTML = `<span style="color:#2196f3;">ℹ️ 单片机在线 (就绪写入)</span>`;
          }
        }
        if (activeConfirmBtn) activeConfirmBtn.textContent = '🚀 写入单片机 Flash 存储';
      } else {
        if (destHwBtn) destHwBtn.className = 'm3-btn small outlined save-dest-tab';
        if (destLocalBtn) destLocalBtn.className = 'm3-btn small tonal save-dest-tab active';
        if (targetLabel) targetLabel.textContent = '📱 浏览器本地草稿库 (IndexedDB)';
        if (checkTitle) checkTitle.textContent = '单片机 Flash 影响';
        if (storageCheck) storageCheck.innerHTML = `<span style="color:#2196f3; font-weight:700;">✓ 0 字节 (完全不占用单片机 Flash)</span>`;
        if (activeConfirmBtn) activeConfirmBtn.textContent = '💾 暂存至本地离线草稿库';
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

    // Reset progress indicator states before opening modal
    if (progressBox) progressBox.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    if (progressPct) progressPct.textContent = '0%';
    if (progressStatus) progressStatus.textContent = '';

    UI.openModal('savePresetModal');

    // Remove old listeners and re-bind confirm button, ensuring fresh enabled state
    if (confirmBtn) {
      const newConfirmBtn = confirmBtn.cloneNode(true);
      newConfirmBtn.disabled = false;
      newConfirmBtn.removeAttribute('disabled');
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

          const packed = BWRY.ditherCanvasTo2bpp(canvas, 'floyd', { orientation: UI.orientation });

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
          UI.showToast(`写入失败: ${e.message}`, 'error', 4500);
        } finally {
          newConfirmBtn.disabled = false;
          newConfirmBtn.removeAttribute('disabled');
          if (progressBox) progressBox.style.display = 'none';
        }
      });
    }

    updateDestUI();
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
      const isInvalid = p.is_orphan || p.is_complete === false;
      const badgeStyle = isInvalid
        ? 'background:rgba(244, 67, 54, 0.15); color:#f44336;'
        : (p.is_offline ? 'background:rgba(33, 150, 243, 0.15); color:#2196f3;' : 'background:rgba(76, 175, 80, 0.15); color:#4caf50;');
      const badgeText = isInvalid
        ? `⚠️ ${p.type_label || '孤儿残留'}`
        : `${p.is_offline ? '📱 本地草稿' : '📟 Flash 存储'} · ${p.type_label}`;

      return `
        <div class="preset-card ${isSelected ? 'selected' : ''}" data-id="${p.id}" style="${isInvalid ? 'border:1px dashed #f44336;' : ''}">
          <div class="preset-card-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" class="preset-check" data-id="${p.id}" ${isSelected ? 'checked' : ''}>
              <strong style="font-size:14px; ${isInvalid ? 'color:#f44336;' : ''}">${p.name}</strong>
            </div>
            <span class="preset-type-badge" style="${badgeStyle}">
              ${badgeText}
            </span>
          </div>
          <div style="font-size:12px; color:var(--md-sys-color-outline); display:flex; justify-content:space-between;">
            <span>大小: ${p.size_str || '104 KB'}</span>
            <span>${p.created_str || ''}</span>
          </div>
          <div class="preset-actions" style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
            ${isInvalid
              ? `<button class="m3-btn small outlined preset-delete-single-btn" data-id="${p.id}" style="color:var(--md-sys-color-error); border-color:var(--md-sys-color-error);">🗑️ 单独删除此残留</button>`
              : `<button class="m3-btn small outlined preset-preview-btn" data-id="${p.id}">👁️ 预览</button>
                 ${p.is_offline
                   ? `<button class="m3-btn small tonal preset-push-btn" data-id="${p.id}">🚀 屏幕推送</button>
                      <button class="m3-btn small preset-upload-hw-btn" data-id="${p.id}" style="background:var(--primary); color:var(--on-primary);">⬆️ 写入硬件</button>`
                   : `<button class="m3-btn small preset-push-btn" data-id="${p.id}">🚀 内部直推</button>`
                 }`
            }
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.preset-delete-single-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`确定要单独删除此项残留数据吗？`)) {
          PresetHub.selectedIds.clear();
          PresetHub.selectedIds.add(id);
          const count = await PresetHub.deleteSelected();
          this.renderPresetsUI();
          UI.showToast(`已成功删除该项残留数据！`, 'success');
        }
      });
    });

    listEl.querySelectorAll('.preset-check').forEach(cb => {
      cb.addEventListener('change', () => {
        PresetHub.toggleSelect(cb.getAttribute('data-id'));
        this.renderPresetsUI();
      });
    });

    listEl.querySelectorAll('.preset-preview-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const preset = PresetHub.presets.find(p => p.id === id);
        if (!preset) return;

        // If local preset draft or already has raw_bitmap in memory, render instantly!
        if (preset.raw_bitmap && preset.raw_bitmap.length === 105984 && this.modalCanvas) {
          BWRY.render2bppToCanvas(this.modalCanvas, new Uint8Array(preset.raw_bitmap));
          UI._activeDitherPacked = new Uint8Array(preset.raw_bitmap);
          UI._activePreset = preset;

          const modalTitle = document.querySelector('#ditherPreviewModal .modal-title');
          if (modalTitle) {
            modalTitle.textContent = `👁️ 预设点阵物理预览 - ${preset.name}`;
          }
          const pushBtn = document.getElementById('modalPushDitherBtn');
          if (pushBtn) {
            pushBtn.textContent = preset.is_offline ? '🚀 屏幕推送' : '🚀 内部直推至墨水屏';
            pushBtn.disabled = false;
          }

          UI.openModal('ditherPreviewModal');
          return;
        }

        // Hardware preset from MCU Flash: open preview modal and pull data with progress bar!
        UI._activePreset = preset;
        UI._activeDitherPacked = null;

        const modalTitle = document.querySelector('#ditherPreviewModal .modal-title');
        if (modalTitle) {
          modalTitle.textContent = `⏳ 正在读取单片机点阵 - ${preset.name}`;
        }
        const pushBtn = document.getElementById('modalPushDitherBtn');
        if (pushBtn) {
          pushBtn.textContent = '🚀 内部直推至墨水屏';
          pushBtn.disabled = false;
        }

        UI.openModal('ditherPreviewModal');

        const canvas = this.modalCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const drawProgress = (pct, loadedBytes, totalBytes) => {
          ctx.fillStyle = '#111318';
          ctx.fillRect(0, 0, 768, 552);

          // Title
          ctx.fillStyle = '#e2e2e6';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`📟 正在从单片机 Flash 读取显存点阵`, 384, 200);

          ctx.fillStyle = '#a8c7fa';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(`「${preset.name}」`, 384, 238);

          // Progress bar track
          const barX = 184;
          const barY = 275;
          const barW = 400;
          const barH = 14;
          const radius = 7;

          ctx.fillStyle = '#282a2f';
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, radius);
          ctx.fill();

          // Progress bar fill
          const fillW = Math.max(radius * 2, Math.round(barW * (pct / 100)));
          ctx.fillStyle = '#4caf50';
          ctx.beginPath();
          ctx.roundRect(barX, barY, fillW, barH, radius);
          ctx.fill();

          // Percentage text
          ctx.fillStyle = '#c4c6d0';
          ctx.font = '14px sans-serif';
          ctx.fillText(`${pct}% (${(loadedBytes / 1024).toFixed(1)} KB / 103.5 KB)`, 384, 320);

          ctx.fillStyle = '#8e9099';
          ctx.font = '12px sans-serif';
          ctx.fillText(`流式网络分块调步传输 · SPIFFS 硬件直读`, 384, 355);
        };

        drawProgress(0, 0, 105984);

        try {
          let bytes;
          if (typeof DeviceManager.fetchPresetBitmapStream === 'function') {
            bytes = await DeviceManager.fetchPresetBitmapStream(preset.id, (pct, loaded, total) => {
              drawProgress(pct, loaded, total);
            });
          } else {
            // Direct streaming fallback in case DeviceManager was cached by browser
            const ip = DeviceManager.lanIp || (typeof localStorage !== 'undefined' ? (localStorage.getItem('epd_lan_ip') || '').trim() : '');
            if (!ip) throw new Error('未设置局域网设备 IP，请先在顶部设置设备 IP');
            const res = await fetch(`http://${ip}/api/presets/bitmap?id=${encodeURIComponent(preset.id)}`, {
              signal: AbortSignal.timeout(15000)
            });
            if (!res.ok) throw new Error(`单片机返回错误 (HTTP ${res.status})，未找到指定点阵`);
            const isPackBits = res.headers.get('x-compression') === 'packbits';
            let receivedData;
            if (res.body && res.body.getReader) {
              const reader = res.body.getReader();
              const chunks = [];
              let received = 0;
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                  chunks.push(value);
                  received += value.length;
                  if (!isPackBits) {
                    const pct = Math.min(100, Math.round((received / 105984) * 100));
                    drawProgress(pct, received, 105984);
                  } else {
                    drawProgress(50, received, received);
                  }
                }
              }
              receivedData = new Uint8Array(received);
              let offset = 0;
              for (const c of chunks) {
                receivedData.set(c, offset);
                offset += c.length;
              }
            } else {
              const buf = await res.arrayBuffer();
              receivedData = new Uint8Array(buf);
            }

            if (isPackBits || receivedData.length < 105984) {
              if (typeof DeviceManager.unpackBits === 'function') {
                bytes = DeviceManager.unpackBits(receivedData, 105984);
              } else {
                // Inline unpackBits fallback
                const out = new Uint8Array(105984);
                let outIdx = 0, inIdx = 0;
                while (inIdx < receivedData.length) {
                  const b = receivedData[inIdx++];
                  if (b <= 127) {
                    const cnt = b + 1;
                    for (let k = 0; k < cnt; k++) if (outIdx < 105984) out[outIdx++] = receivedData[inIdx++]; else inIdx++;
                  } else if (b > 128) {
                    const cnt = 257 - b;
                    const val = receivedData[inIdx++];
                    for (let k = 0; k < cnt; k++) if (outIdx < 105984) out[outIdx++] = val;
                  }
                }
                bytes = out;
              }
            } else {
              bytes = receivedData;
            }
          }

          // Successfully pulled 105,984 bytes from MCU Flash!
          BWRY.render2bppToCanvas(canvas, bytes);
          UI._activeDitherPacked = bytes;
          preset.raw_bitmap = Array.from(bytes);

          if (modalTitle) {
            modalTitle.textContent = `👁️ 单片机点阵预览 - ${preset.name}`;
          }
        } catch (err) {
          console.log('[PresetPreview] Notice / Pull result:', err.message);
          ctx.fillStyle = '#121316';
          ctx.fillRect(0, 0, 768, 552);

          // Card Background Frame
          ctx.fillStyle = '#1c1e22';
          ctx.beginPath();
          ctx.roundRect(48, 40, 672, 472, 16);
          ctx.fill();

          ctx.strokeStyle = '#2b2d33';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Header badge
          ctx.fillStyle = '#1e88e5';
          ctx.beginPath();
          ctx.roundRect(284, 64, 200, 32, 16);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚡ ESP32 SPIFFS Flash 固化预设', 384, 85);

          // Preset Name
          ctx.fillStyle = '#e2e2e6';
          ctx.font = 'bold 28px "PingFang SC", sans-serif';
          ctx.fillText(`「${preset.name}」`, 384, 150);

          // Subtitle
          ctx.fillStyle = '#90caf9';
          ctx.font = '16px "PingFang SC", sans-serif';
          ctx.fillText(`${preset.type_label || preset.preset_type || '智能作品'} · 固化点阵文件: ${preset.id}.2bpp`, 384, 190);

          // Specs Box
          const boxY = 220;
          ctx.fillStyle = '#26282e';
          ctx.beginPath();
          ctx.roundRect(96, boxY, 576, 120, 12);
          ctx.fill();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#c4c6d0';
          ctx.font = '14px monospace';
          ctx.fillText(`• 预设类型标识: ${preset.preset_type || 'badge'}`, 128, boxY + 32);
          ctx.fillText(`• 物理存储大小: ${preset.size_str || '106.0 KB'} (105,984 字节 2bpp 显存)`, 128, boxY + 62);
          ctx.fillText(`• 烧录建立时间: ${preset.created_str || '已永久固化存储'}`, 128, boxY + 92);

          ctx.textAlign = 'center';
          ctx.fillStyle = '#4caf50';
          ctx.font = 'bold 15px "PingFang SC", sans-serif';
          ctx.fillText('✓ 硬件显存完整度 100% · 单片机可瞬间秒级加载物理全刷', 384, 380);

          ctx.fillStyle = '#8e9099';
          ctx.font = '13px "PingFang SC", sans-serif';
          ctx.fillText('💡 处于 WebBLE 蓝牙极速通道模式：无需耗时将 105KB 数据回传至浏览器，', 384, 420);
          ctx.fillText('直接点击下方「🚀 内部直推至墨水屏」按钮，单片机将由内部高速总线直读并全刷物理屏！', 384, 442);

          if (modalTitle) {
            modalTitle.textContent = `👁️ 单片机硬件预设 - ${preset.name}`;
          }
          if (pushBtn) {
            pushBtn.textContent = '🚀 内部直推至墨水屏';
            pushBtn.disabled = false;
          }
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

  /*  5. Universal Event Bindings  */
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

    // 4. Image Lab Controls & Drag and Drop Support
    const imageUploadInput = document.getElementById('imageUploadInput') || document.getElementById('labImgInput');
    const imageDropZone = document.getElementById('imageDropZone');
    const imagePreviewContainer = document.getElementById('imageLabPreviewContainer');
    const imageTabPane = document.getElementById('tab-image');

    if (imageUploadInput) {
      imageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) this.loadImageFile(file);
      });
    }

    const dropTargets = [imageDropZone, imagePreviewContainer, this.imageLabCanvas, imageTabPane].filter(Boolean);
    dropTargets.forEach(target => {
      ['dragenter', 'dragover'].forEach(name => {
        target.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          imageDropZone?.classList.add('dragover');
          imagePreviewContainer?.classList.add('drag-active');
        });
      });

      ['dragleave', 'dragend'].forEach(name => {
        target.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          imageDropZone?.classList.remove('dragover');
          imagePreviewContainer?.classList.remove('drag-active');
        });
      });

      target.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        imageDropZone?.classList.remove('dragover');
        imagePreviewContainer?.classList.remove('drag-active');

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          this.loadImageFile(files[0]);
        }
      });
    });

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

    // Image Lab Interactive Drag, Pan, and Wheel Zoom
    if (this.imageLabCanvas) {
      const imgCanvas = this.imageLabCanvas;

      // Click to upload when empty (Mobile & Desktop friendly)
      imgCanvas.addEventListener('click', () => {
        if (!this.uploadedImg) {
          imageUploadInput?.click();
        }
      });

      imgCanvas.addEventListener('pointerdown', (e) => {
        if (!this.uploadedImg) return;
        this.isDraggingImage = true;
        this.imageDragStart = {
          clientX: e.clientX,
          clientY: e.clientY,
          panX: this.imagePanX || 0,
          panY: this.imagePanY || 0
        };
        try { imgCanvas.setPointerCapture(e.pointerId); } catch (_) {}
        imgCanvas.style.cursor = 'grabbing';
      });

      imgCanvas.addEventListener('pointermove', (e) => {
        if (!this.isDraggingImage || !this.uploadedImg) return;
        const rect = imgCanvas.getBoundingClientRect();
        const scaleX = imgCanvas.width / (rect.width || imgCanvas.width);
        const scaleY = imgCanvas.height / (rect.height || imgCanvas.height);
        const dx = (e.clientX - this.imageDragStart.clientX) * scaleX;
        const dy = (e.clientY - this.imageDragStart.clientY) * scaleY;
        this.imagePanX = this.imageDragStart.panX + dx;
        this.imagePanY = this.imageDragStart.panY + dy;

        this.updateImageSelectBox();
        this.renderImageLab(true);
        clearTimeout(this._ditherDebounceTimer);
        this._ditherDebounceTimer = setTimeout(() => {
          this.renderImageLab(false);
          this.updateImageSelectBox();
        }, 80);
      });

      const handlePointerEnd = (e) => {
        if (this.isDraggingImage) {
          this.isDraggingImage = false;
          try { imgCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
          imgCanvas.style.cursor = 'grab';
          clearTimeout(this._ditherDebounceTimer);
          this.renderImageLab(false);
          this.updateImageSelectBox();
        }
      };
      imgCanvas.addEventListener('pointerup', handlePointerEnd);
      imgCanvas.addEventListener('pointercancel', handlePointerEnd);

      imgCanvas.addEventListener('wheel', (e) => {
        if (!this.uploadedImg) return;
        e.preventDefault();
        const rect = imgCanvas.getBoundingClientRect();
        const cursorX = (e.clientX - rect.left) * (imgCanvas.width / (rect.width || imgCanvas.width));
        const cursorY = (e.clientY - rect.top) * (imgCanvas.height / (rect.height || imgCanvas.height));

        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
        const oldScale = this.imageScale || 1.0;
        const newScale = Math.min(8.0, Math.max(0.15, oldScale * zoomFactor));

        const w = imgCanvas.width;
        const h = imgCanvas.height;
        const curCenterX = w / 2 + (this.imagePanX || 0);
        const curCenterY = h / 2 + (this.imagePanY || 0);

        this.imagePanX = cursorX - (cursorX - curCenterX) * (newScale / oldScale) - w / 2;
        this.imagePanY = cursorY - (cursorY - curCenterY) * (newScale / oldScale) - h / 2;
        this.imageScale = newScale;

        this.updateImageZoomBadge();
        this.updateImageSelectBox();
        this.renderImageLab(true);
        clearTimeout(this._ditherDebounceTimer);
        this._ditherDebounceTimer = setTimeout(() => {
          this.renderImageLab(false);
          this.updateImageSelectBox();
        }, 80);
      }, { passive: false });

      // Keep selection box synced on window/orientation resize
      window.addEventListener('resize', () => {
        this.updateImageSelectBox();
      });
    }

    // Interactive 4 Corner & 4 Edge Handle Dots Dragging (四周小圆点交互缩放)
    document.querySelectorAll('.select-handle').forEach(handle => {
      handle.addEventListener('pointerdown', (e) => {
        if (!this.uploadedImg) return;
        e.stopPropagation();
        const handleType = handle.getAttribute('data-handle');
        this.isDraggingHandle = true;
        this.activeHandleType = handleType;
        try { handle.setPointerCapture(e.pointerId); } catch (_) {}
        handle.classList.add('active');

        const canvas = this.imageLabCanvas;
        const isPortrait = (UI.orientation === 90 || UI.orientation === 270);
        const cw = isPortrait ? 552 : 768;
        const ch = isPortrait ? 768 : 552;

        const baseScale = Math.min(cw / this.uploadedImg.width, ch / this.uploadedImg.height);
        const totalScale = baseScale * (this.imageScale || 1.0);
        const dw = this.uploadedImg.width * totalScale;
        const dh = this.uploadedImg.height * totalScale;
        const dx = (cw - dw) / 2 + (this.imagePanX || 0);
        const dy = (ch - dh) / 2 + (this.imagePanY || 0);

        this.handleDragStart = {
          handle,
          pointerId: e.pointerId,
          cw, ch, baseScale,
          w_img: this.uploadedImg.width,
          h_img: this.uploadedImg.height,
          dx, dy, dw, dh,
          panX: this.imagePanX || 0,
          panY: this.imagePanY || 0,
          scale: this.imageScale || 1.0
        };
      });

      handle.addEventListener('pointermove', (e) => {
        if (!this.isDraggingHandle || !this.handleDragStart) return;
        e.stopPropagation();
        const s = this.handleDragStart;
        const canvas = this.imageLabCanvas;
        const rect = canvas.getBoundingClientRect();
        const cursorCanvasX = (e.clientX - rect.left) * (s.cw / rect.width);
        const cursorCanvasY = (e.clientY - rect.top) * (s.ch / rect.height);

        let newScale = s.scale;
        let newPanX = s.panX;
        let newPanY = s.panY;
        let dw_new = s.dw;
        let dh_new = s.dh;

        switch (this.activeHandleType) {
          case 'br': {
            dw_new = Math.max(20, cursorCanvasX - s.dx);
            newScale = Math.min(8.0, Math.max(0.1, dw_new / (s.w_img * s.baseScale)));
            dh_new = s.h_img * s.baseScale * newScale;
            dw_new = s.w_img * s.baseScale * newScale;
            newPanX = s.dx - (s.cw - dw_new) / 2;
            newPanY = s.dy - (s.ch - dh_new) / 2;
            break;
          }
          case 'tl': {
            const anchorR = s.dx + s.dw;
            const anchorB = s.dy + s.dh;
            dw_new = Math.max(20, anchorR - cursorCanvasX);
            newScale = Math.min(8.0, Math.max(0.1, dw_new / (s.w_img * s.baseScale)));
            dh_new = s.h_img * s.baseScale * newScale;
            dw_new = s.w_img * s.baseScale * newScale;
            newPanX = anchorR - dw_new - (s.cw - dw_new) / 2;
            newPanY = anchorB - dh_new - (s.ch - dh_new) / 2;
            break;
          }
          case 'tr': {
            const anchorB = s.dy + s.dh;
            dw_new = Math.max(20, cursorCanvasX - s.dx);
            newScale = Math.min(8.0, Math.max(0.1, dw_new / (s.w_img * s.baseScale)));
            dh_new = s.h_img * s.baseScale * newScale;
            dw_new = s.w_img * s.baseScale * newScale;
            newPanX = s.dx - (s.cw - dw_new) / 2;
            newPanY = anchorB - dh_new - (s.ch - dh_new) / 2;
            break;
          }
          case 'bl': {
            const anchorR = s.dx + s.dw;
            dw_new = Math.max(20, anchorR - cursorCanvasX);
            newScale = Math.min(8.0, Math.max(0.1, dw_new / (s.w_img * s.baseScale)));
            dh_new = s.h_img * s.baseScale * newScale;
            dw_new = s.w_img * s.baseScale * newScale;
            newPanX = anchorR - dw_new - (s.cw - dw_new) / 2;
            newPanY = s.dy - (s.ch - dh_new) / 2;
            break;
          }
          case 'bc': {
            dh_new = Math.max(20, cursorCanvasY - s.dy);
            newScale = Math.min(8.0, Math.max(0.1, dh_new / (s.h_img * s.baseScale)));
            dw_new = s.w_img * s.baseScale * newScale;
            dh_new = s.h_img * s.baseScale * newScale;
            newPanX = s.panX;
            newPanY = s.dy - (s.ch - dh_new) / 2;
            break;
          }
          case 'tc': {
            const anchorB = s.dy + s.dh;
            dh_new = Math.max(20, anchorB - cursorCanvasY);
            newScale = Math.min(8.0, Math.max(0.1, dh_new / (s.h_img * s.baseScale)));
            dw_new = s.w_img * s.baseScale * newScale;
            dh_new = s.h_img * s.baseScale * newScale;
            newPanX = s.panX;
            newPanY = anchorB - dh_new - (s.ch - dh_new) / 2;
            break;
          }
          case 'mr': {
            dw_new = Math.max(20, cursorCanvasX - s.dx);
            newScale = Math.min(8.0, Math.max(0.1, dw_new / (s.w_img * s.baseScale)));
            dh_new = s.h_img * s.baseScale * newScale;
            dw_new = s.w_img * s.baseScale * newScale;
            newPanX = s.dx - (s.cw - dw_new) / 2;
            newPanY = s.panY;
            break;
          }
          case 'ml': {
            const anchorR = s.dx + s.dw;
            dw_new = Math.max(20, anchorR - cursorCanvasX);
            newScale = Math.min(8.0, Math.max(0.1, dw_new / (s.w_img * s.baseScale)));
            dh_new = s.h_img * s.baseScale * newScale;
            dw_new = s.w_img * s.baseScale * newScale;
            newPanX = anchorR - dw_new - (s.cw - dw_new) / 2;
            newPanY = s.panY;
            break;
          }
        }

        this.imageScale = newScale;
        this.imagePanX = newPanX;
        this.imagePanY = newPanY;

        this.updateImageZoomBadge();
        this.updateImageSelectBox();
        this.renderImageLab(true);

        clearTimeout(this._ditherDebounceTimer);
        this._ditherDebounceTimer = setTimeout(() => {
          this.renderImageLab(false);
          this.updateImageSelectBox();
        }, 80);
      });

      const handlePointerUp = (e) => {
        if (this.isDraggingHandle) {
          this.isDraggingHandle = false;
          if (this.handleDragStart?.handle) {
            try { this.handleDragStart.handle.releasePointerCapture(this.handleDragStart.pointerId); } catch (_) {}
            this.handleDragStart.handle.classList.remove('active');
          }
          this.handleDragStart = null;
          this.activeHandleType = null;
          clearTimeout(this._ditherDebounceTimer);
          this.renderImageLab(false);
          this.updateImageSelectBox();
        }
      };
      handle.addEventListener('pointerup', handlePointerUp);
      handle.addEventListener('pointercancel', handlePointerUp);
    });

    document.getElementById('imageZoomInBtn')?.addEventListener('click', () => {
      this.imageScale = Math.min(8.0, (this.imageScale || 1.0) * 1.25);
      this.updateImageZoomBadge();
      this.updateImageSelectBox();
      this.renderImageLab(false);
    });

    document.getElementById('imageZoomOutBtn')?.addEventListener('click', () => {
      this.imageScale = Math.max(0.15, (this.imageScale || 1.0) * 0.8);
      this.updateImageZoomBadge();
      this.updateImageSelectBox();
      this.renderImageLab(false);
    });

    document.getElementById('imageResetTransformBtn')?.addEventListener('click', () => {
      this.imagePanX = 0;
      this.imagePanY = 0;
      this.imageScale = 1.0;
      this.updateImageZoomBadge();
      this.updateImageSelectBox();
      this.renderImageLab(false);
      UI.showToast('已重置为自适应居中');
    });

    document.getElementById('imageActualSizeBtn')?.addEventListener('click', () => {
      if (!this.uploadedImg || !this.imageLabCanvas) return;
      const baseScale = Math.min(this.imageLabCanvas.width / this.uploadedImg.width, this.imageLabCanvas.height / this.uploadedImg.height);
      this.imageScale = 1.0 / (baseScale || 1.0);
      this.imagePanX = 0;
      this.imagePanY = 0;
      this.updateImageZoomBadge();
      this.updateImageSelectBox();
      this.renderImageLab(false);
      UI.showToast('已切换为 1:1 物理像素原图大小');
    });

    // 5. Connectivity Bar Bindings
    const bleConnectBtn = document.getElementById('bleConnectBtn') || document.getElementById('btnBleConnect');
    const bleStatusDot = document.getElementById('bleStatusDot');
    const bleStatusText = document.getElementById('bleStatusText');
    const bleSubText = document.getElementById('bleSubText');
    const netLanStatus = document.getElementById('netLanStatus') || document.getElementById('lanStatusText');
    const lanConsoleLink = document.getElementById('lanConsoleLink');

    const updateConnUI = (status) => {
      // 1. BLE Status Bar strictly reflects BLE
      if (status.bleConnected) {
        if (bleStatusDot) bleStatusDot.className = 'conn-status-dot connected';
        if (bleStatusText) bleStatusText.textContent = `已连接: ${status.bleDeviceName || 'EPD-Display'}`;
        if (bleSubText) bleSubText.textContent = 'Web Bluetooth 5.0 · 物理低延迟点阵直推中';
        if (bleConnectBtn) bleConnectBtn.textContent = '断开蓝牙';
        UI.rememberDevice(DeviceManager.bleDevice?.id, status.bleDeviceName || 'EPD-Display');
      } else {
        if (bleStatusDot) bleStatusDot.className = 'conn-status-dot';
        if (bleStatusText) bleStatusText.textContent = '已断开连接';
        if (bleSubText) bleSubText.textContent = '无需 Wi-Fi · 支持 Chrome/Edge 100% 离线直推';
        if (bleConnectBtn) bleConnectBtn.textContent = '🔍 扫描连接';
      }

      // 2. LAN Status Bar strictly reflects LAN
      if (status.lanConnected && status.lanIp) {
        if (netLanStatus) {
          if (status.activeTransport === 'ble') {
            netLanStatus.textContent = `局域网: ${status.lanIp} (蓝牙优先直连中)`;
          } else {
            netLanStatus.textContent = `局域网已连接: ${status.lanIp}`;
          }
          netLanStatus.style.color = '#4caf50';
        }
        if (lanConsoleLink) {
          lanConsoleLink.style.display = 'inline';
          lanConsoleLink.href = `http://${status.lanIp}/`;
        }
      } else if (status.lanIp) {
        if (netLanStatus) {
          netLanStatus.textContent = `局域网未连通 (${status.lanIp})`;
          netLanStatus.style.color = '#ff9800';
        }
        if (lanConsoleLink) lanConsoleLink.style.display = 'none';
      } else {
        if (netLanStatus) {
          netLanStatus.textContent = '未连接局域网';
          netLanStatus.style.color = '';
        }
        if (lanConsoleLink) lanConsoleLink.style.display = 'none';
      }

      // 3. Preset sync on any valid hardware connection
      if (status.activeTransport !== 'none') {
        PresetHub.syncWithDevice().then(() => this.renderPresetsUI()).catch(() => {});
      } else {
        PresetHub._hasRemoteStorageStats = false;
        PresetHub.updateStorageUI();
      }
    };
    DeviceManager.onStatusChange = updateConnUI;
    updateConnUI(DeviceManager.getConnectionStatus());

    if (bleConnectBtn) {
      bleConnectBtn.addEventListener('click', async () => {
        if (DeviceManager.isBleConnected) {
          await DeviceManager.disconnectBle();
          UI.showToast('已断开蓝牙连接，已自动切回局域网信道');
        } else {
          try {
            if (bleStatusDot) bleStatusDot.className = 'conn-status-dot connecting';
            if (bleStatusText) bleStatusText.textContent = '正在搜索蓝牙外设...';
            const name = await DeviceManager.connectBle();
            UI.showToast(`成功连接到蓝牙设备: ${name} (已切换至蓝牙优先)`, 'success');
          } catch (e) {
            updateConnUI(DeviceManager.getConnectionStatus());
            if (e.name !== 'NotFoundError') {
              UI.showToast(`蓝牙连接失败: ${e.message}`, 'error');
            }
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

    document.getElementById('hwCleanOrphansBtn')?.addEventListener('click', () => {
      PresetHub.cleanInvalidData();
    });

    document.getElementById('hwClearFlashBtn')?.addEventListener('click', () => {
      PresetHub.clearHardwareFlash();
    });

    document.getElementById('localClearDraftsBtn')?.addEventListener('click', () => {
      PresetHub.clearLocalPresets();
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
      } else if (tabId === 'system') {
        if (typeof UI !== 'undefined' && UI.refreshSystemDiagnostics) {
          UI.refreshSystemDiagnostics();
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
