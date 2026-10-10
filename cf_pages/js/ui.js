/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * UI Controller (Material Web 3.0, Device Detection, Orientation, Modals, Tabs, Toasts, BIN Tools)
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

const UI = {
  orientation: 0, // 0 | 90 | 180 | 270
  deviceInfo: {
    type: 'desktop', // 'mobile' | 'tablet' | 'desktop'
    isTouch: false,
    os: 'unknown'
  },

  init() {
    this.detectDevice();
    this.initTheme();
    this.initOrientation();
    this.initSlidingTabs();
    this.initModals();
    this.initLanStatus();
  },

  /* ================= 1. UA Detection & Adaptive Form-Factor ================= */
  detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.deviceInfo.isTouch = isTouch;

    const width = window.innerWidth;
    let type = 'desktop';

    if (/ipad|tablet|(android(?!.*mobile))/i.test(ua) || (isTouch && width >= 601 && width <= 1024)) {
      type = 'tablet';
    } else if (/iphone|ipod|android.*mobile|windows phone/i.test(ua) || width <= 600) {
      type = 'mobile';
    } else {
      type = 'desktop';
    }

    this.deviceInfo.type = type;
    document.documentElement.setAttribute('data-device', type);
    document.documentElement.setAttribute('data-touch', isTouch ? 'true' : 'false');

    console.log(`[UI] Form factor: ${type} (touch: ${isTouch}, width: ${width}px)`);

    window.addEventListener('resize', () => {
      const newWidth = window.innerWidth;
      let newType = 'desktop';
      if (newWidth <= 600) newType = 'mobile';
      else if (newWidth <= 1024) newType = 'tablet';
      if (newType !== this.deviceInfo.type) {
        this.deviceInfo.type = newType;
        document.documentElement.setAttribute('data-device', newType);
        if (this.updateTabScrollMasks) this.updateTabScrollMasks();
      }
    });
  },

  /* ================= 2. 4-Way Orientation Handler ================= */
  initOrientation() {
    const saved = parseInt(localStorage.getItem('epd_orientation'), 10) || 0;
    this.setOrientation(saved, false);
  },

  setOrientation(angle, triggerRender = true) {
    this.orientation = angle;
    localStorage.setItem('epd_orientation', String(angle));

    // Update orientation badge
    const badge = document.getElementById('orientationBadge');
    if (badge) {
      const isPortrait = (angle === 90 || angle === 270);
      const dims = isPortrait ? '552×768' : '768×552';
      const labelMap = {
        0: '0° 横屏',
        90: '90° 竖屏',
        180: '180° 倒横',
        270: '270° 倒竖'
      };
      badge.textContent = `${labelMap[angle] || angle + '°'} (${dims})`;
    }

    // Update chips
    [0, 90, 180, 270].forEach(deg => {
      const chip = document.getElementById(`rot-chip-${deg}`);
      if (chip) {
        chip.classList.toggle('active', deg === angle);
      }
    });

    if (triggerRender) {
      if (window.App) {
        window.App.renderBadge();
        window.App.renderMemo();
        if (window.App.renderImageLab) window.App.renderImageLab();
      }
      if (window.ItaBagStudio && typeof window.ItaBagStudio.renderPreview === 'function') {
        window.ItaBagStudio.renderPreview();
      }
      if (window.ScenesStudio && typeof window.ScenesStudio.renderPreview === 'function') {
        window.ScenesStudio.renderPreview();
      }
      this.showToast(`已切换屏幕朝向至 ${angle}°`);
    }

    window.dispatchEvent(new CustomEvent('orientationchange', { detail: { angle } }));
  },

  /* ================= 3. Responsive Sliding Tabs Navigation ================= */
  initSlidingTabs() {
    const wrapper = document.querySelector('.tab-scroll-wrapper');
    const container = document.querySelector('.tab-scroll-container');
    const hint = document.getElementById('tabScrollHint');
    const closeBtn = hint ? hint.querySelector('.hint-close') : null;

    if (!container || !wrapper) return;

    const updateMasks = () => {
      const scrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (scrollLeft > 4) {
        wrapper.classList.add('has-scroll-left');
      } else {
        wrapper.classList.remove('has-scroll-left');
      }

      if (maxScroll - scrollLeft > 4) {
        wrapper.classList.add('has-scroll-right');
      } else {
        wrapper.classList.remove('has-scroll-right');
      }
    };

    container.addEventListener('scroll', () => {
      updateMasks();
      if (hint && hint.style.display !== 'none') {
        hint.style.display = 'none';
        localStorage.setItem('epd_tab_hint_seen', '1');
      }
    }, { passive: true });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (hint) hint.style.display = 'none';
        localStorage.setItem('epd_tab_hint_seen', '1');
      });
    }

    if (localStorage.getItem('epd_tab_hint_seen') === '1' && hint) {
      hint.style.display = 'none';
    }

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab, btn);
      });
    });

    setTimeout(updateMasks, 100);
    this.updateTabScrollMasks = updateMasks;
  },

  switchTab(tabId, clickedBtn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (clickedBtn) {
      clickedBtn.classList.add('active');
      clickedBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } else {
      const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
      if (btn) {
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }

    document.querySelectorAll('.tab-pane, .tab-view').forEach(p => p.classList.remove('active'));
    const targetPane = document.getElementById(`tab-${tabId}`) || document.getElementById(`view-${tabId}`);
    if (targetPane) {
      targetPane.classList.add('active');
    }

    window.dispatchEvent(new CustomEvent('tabchange', { detail: { tabId } }));
  },

  /* ================= 4. Theme Toggle ================= */
  initTheme() {
    const saved = localStorage.getItem('epd_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme');
        const next = curr === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('epd_theme', next);
        toggleBtn.textContent = next === 'dark' ? '🌙' : '☀️';
        this.showToast(`已切换至${next === 'dark' ? '暗黑模式 🌙' : '亮色模式 ☀️'}`);
      });
      toggleBtn.textContent = saved === 'dark' ? '🌙' : '☀️';
    }
  },

  /* ================= 5. Universal Modal Controller ================= */
  initModals() {
    document.querySelectorAll('.modal-overlay, .modal-backdrop').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active', 'open');
        }
      });
      const closeBtns = overlay.querySelectorAll('.modal-close, [data-modal-close]');
      closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          overlay.classList.remove('active', 'open');
        });
      });
    });
  },

  openModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('active', 'open');
      el.setAttribute('aria-hidden', 'false');
    }
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active', 'open');
      el.setAttribute('aria-hidden', 'true');
    }
  },

  /* ================= 6. Device Manager Modal ================= */
  openDeviceManagerModal() {
    const container = document.getElementById('deviceListContainer');
    if (!container) return;

    let list = [];
    try {
      list = JSON.parse(localStorage.getItem('epd_devices') || '[]');
    } catch(e) {
      list = [];
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div style="font-size:12px; color:var(--md-sys-color-outline); padding:16px; text-align:center; background:var(--md-sys-color-surface-container); border-radius:12px;">
          暂无已记忆设备。请点击下方「扫描配对新设备」通过 Web Bluetooth 快速连接！
        </div>
      `;
    } else {
      container.innerHTML = list.map(dev => `
        <div class="dev-item">
          <div class="dev-item-left">
            <div class="dev-item-title">
              <span>📱</span>
              <strong>${dev.alias || dev.name || 'EPD-Display'}</strong>
              <span style="font-size:11px; opacity:0.7;">(${dev.name || 'BLE'})</span>
            </div>
            <div class="dev-item-meta">
              ID: ${dev.id ? dev.id.slice(0, 16) + '...' : 'WebBLE'} · 上次连接: ${new Date(dev.lastSeen || Date.now()).toLocaleDateString()}
            </div>
          </div>
          <div class="dev-item-actions">
            <button class="m3-btn small tonal" onclick="UI.renameDevice('${dev.id}')">重命名</button>
            <button class="m3-btn small danger" onclick="UI.deleteDevice('${dev.id}')">删除</button>
          </div>
        </div>
      `).join('');
    }

    this.openModal('devManageModal');
  },

  rememberDevice(id, name) {
    if (!id && !name) return;
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem('epd_devices') || '[]');
    } catch(e) { list = []; }

    const key = id || name;
    const existing = list.find(d => d.id === key);
    if (!existing) {
      list.push({ id: key, name: name || 'EPD-Display', alias: name || 'EPD-Display', lastSeen: Date.now() });
    } else {
      existing.lastSeen = Date.now();
      if (name) existing.name = name;
    }
    localStorage.setItem('epd_devices', JSON.stringify(list));
  },

  renameDevice(id) {
    let list = JSON.parse(localStorage.getItem('epd_devices') || '[]');
    const dev = list.find(d => d.id === id);
    if (!dev) return;

    const next = prompt('输入设备自定义别名:', dev.alias || dev.name);
    if (next && next.trim()) {
      dev.alias = next.trim();
      localStorage.setItem('epd_devices', JSON.stringify(list));
      this.openDeviceManagerModal();
      this.showToast(`已重命名设备为「${dev.alias}」`, 'success');
    }
  },

  deleteDevice(id) {
    let list = JSON.parse(localStorage.getItem('epd_devices') || '[]');
    list = list.filter(d => d.id !== id);
    localStorage.setItem('epd_devices', JSON.stringify(list));
    this.openDeviceManagerModal();
    this.showToast('已移除设备记忆', 'info');
  },

  /* ================= 7. Air Provisioning Modal ================= */
  openAirProvisionModal() {
    this.openModal('airProvModal');
  },

  async executeBleAirProvision() {
    const ssidInput = document.getElementById('provSsid');
    const passInput = document.getElementById('provPassword');
    const ssid = (ssidInput?.value || '').trim();
    const pass = (passInput?.value || '').trim();

    if (!ssid) {
      this.showToast('请输入 Wi-Fi SSID 名称！', 'warning');
      return;
    }

    this.showToast(`正在隔空配网「${ssid}」至墨水屏...`, 'info', 4000);

    try {
      const dm = window.DeviceManager;
      if (dm && dm.isBleConnected && dm.rxChar) {
        const payload = JSON.stringify({ cmd: 'wifi_setup', ssid, pass });
        const enc = new TextEncoder().encode(`WIFI:${ssid}:${pass}`);
        await dm.rxChar.writeValueWithoutResponse(enc);
        this.closeModal('airProvModal');
        this.showToast(`✅ Wi-Fi「${ssid}」配置已通过蓝牙发送！`, 'success', 4000);
      } else if (dm && dm.lanIp) {
        await dm.configWifi(ssid, pass);
        this.closeModal('airProvModal');
        this.showToast(`✅ Wi-Fi「${ssid}」配置已发送！墨水屏正在重连...`, 'success', 4000);
      } else {
        throw new Error('未连接设备！请先点击顶部「扫描连接」连接蓝牙');
      }
    } catch(err) {
      this.showToast(`配网失败: ${err.message}`, 'error', 4000);
    }
  },

  /* ================= 8. Custom LAN IP Modal ================= */
  openLanIpModal() {
    const input = document.getElementById('lanModalIpInput') || document.getElementById('customLanIp');
    const currentIp = window.DeviceManager?.lanIp || localStorage.getItem('epd_lan_ip') || '';
    if (input) input.value = currentIp;
    this.openModal('lanIpModal');
  },

  async saveCustomLanIp() {
    const input = document.getElementById('lanModalIpInput') || document.getElementById('customLanIp');
    const ip = (input?.value || '').trim();

    if (!ip) {
      this.showToast('请输入有效的局域网 IP 地址', 'warning');
      return;
    }

    if (window.DeviceManager) {
      this.showToast(`正在测试连通性 http://${ip}/ ...`, 'info', 3000);
      const ok = await window.DeviceManager.setLanIp(ip);
      this.closeModal('lanIpModal');
      this.initLanStatus();
      if (ok) {
        this.showToast(`🎉 成功连通局域网设备: http://${ip}/`, 'success', 4000);
        if (window.PresetHub && window.PresetHub.syncWithDevice) {
          window.PresetHub.syncWithDevice();
        }
      } else {
        this.showToast(`已保存 IP: ${ip} (未检测到响应)`, 'warning', 4000);
      }
    }
  },

  initLanStatus() {
    const ip = window.DeviceManager?.lanIp || localStorage.getItem('epd_lan_ip') || '';
    const statusText = document.getElementById('netLanStatus') || document.getElementById('lanStatusText');
    const consoleLink = document.getElementById('lanConsoleLink');

    if (statusText) {
      statusText.textContent = ip ? `局域网: ${ip}` : '未连接局域网';
    }
    if (consoleLink) {
      if (ip) {
        consoleLink.style.display = 'inline-block';
        consoleLink.href = `http://${ip}/`;
      } else {
        consoleLink.style.display = 'none';
      }
    }
  },

  /* ================= 9. 1:1 Dither Dot-Matrix Simulation Modal ================= */
  openDitherPreviewModal(sourceCanvas, algo = null, options = null) {
    const modalCanvas = document.getElementById('ditherModalCanvas') || document.getElementById('modalPreviewCanvas');
    if (!modalCanvas) return;

    if (!sourceCanvas) {
      const activePane = document.querySelector('.tab-pane.active, .tab-view.active');
      sourceCanvas = activePane ? activePane.querySelector('canvas') : document.getElementById('badgePreviewCanvas');
    }
    if (!sourceCanvas) {
      this.showToast('未找到可预览的画布', 'warning');
      return;
    }

    if (!algo) {
      algo = document.getElementById('imageAlgoSelect')?.value || 'floyd';
    }
    if (!options) {
      const contrast = parseFloat(document.getElementById('imageContrastSlider')?.value || 15);
      const redBoostVal = parseFloat(document.getElementById('imageRedBoostSlider')?.value || 0);
      const yellowBoostVal = parseFloat(document.getElementById('imageYellowBoostSlider')?.value || 0);
      const redBoost = redBoostVal > 0 ? 1.0 + (redBoostVal / 50) : 1.0;
      const yellowBoost = yellowBoostVal > 0 ? 1.0 + (yellowBoostVal / 50) : 1.0;
      options = { contrast, redBoost, yellowBoost };
    }

    const packed = BWRY.ditherCanvasTo2bpp(sourceCanvas, algo, options);
    BWRY.render2bppToCanvas(modalCanvas, packed);

    this._activeDitherPacked = packed;
    this.openModal(document.getElementById('ditherPreviewModal') ? 'ditherPreviewModal' : 'presetPreviewModal');
  },

  async pushModalDither() {
    if (!this._activeDitherPacked) {
      this.showToast('未生成点阵数据', 'warning');
      return;
    }
    try {
      this.showToast('正在推送 4色点阵至墨水屏...', 'info', 4000);
      await window.DeviceManager.pushBitmap2bpp(this._activeDitherPacked);
      this.showToast('🎉 点阵推送成功！', 'success', 4000);
      this.closeModal('ditherPreviewModal');
    } catch(err) {
      this.showToast(`推送失败: ${err.message}`, 'error', 4000);
    }
  },

  /* ================= 10. 2bpp BIN Export & Import ================= */
  exportCanvasAsBin() {
    const activePane = document.querySelector('.tab-pane.active, .tab-view.active');
    const canvas = activePane ? activePane.querySelector('canvas') : document.getElementById('badgePreviewCanvas');
    if (!canvas) {
      this.showToast('未找到当前画布', 'warning');
      return;
    }

    const algo = document.getElementById('imageAlgoSelect')?.value || 'floyd';
    const packed = BWRY.ditherCanvasTo2bpp(canvas, algo);
    const blob = new Blob([packed], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epd_framebuffer_rot${this.orientation}_${Date.now()}.bin`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`✅ 已下载 105,984 字节 2bpp 固件显存文件 (朝向: ${this.orientation}°)！`, 'success', 3500);
  },

  async handleImportBinFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const buffer = new Uint8Array(evt.target.result);
      if (buffer.byteLength !== 105984) {
        if (!confirm(`文件大小为 ${buffer.byteLength} 字节 (标准四色显存为 105,984 字节)，是否仍尝试推送？`)) {
          return;
        }
      }
      try {
        UI.showToast(`正在推送 BIN 文件「${file.name}」至墨水屏...`, 'info', 5000);
        await window.DeviceManager.pushBitmap2bpp(buffer);
        UI.showToast('🎉 BIN 点阵裸流推送完成！墨水屏刷新中...', 'success', 4000);
      } catch(err) {
        UI.showToast(`推送失败: ${err.message}`, 'error', 4000);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  },

  /* ================= 11. Toast Notifications ================= */
  showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : (type === 'error' ? '⚠' : (type === 'warning' ? '⚡' : 'ℹ'));
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
};

window.UI = UI;
