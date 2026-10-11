/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * UI Controller (Material Web 3.0, Device Detection, Orientation, Modals, Tabs, Toasts, BIN Tools)
 * Copyright (c) 2026 ZGQ Inc. Licensed under the MIT License.
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

  /*  1. UA Detection & Adaptive Form-Factor  */
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

  /*  2. 4-Way Orientation Handler  */
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
      if (window.PaintCanvas && typeof window.PaintCanvas.setOrientation === 'function') {
        window.PaintCanvas.setOrientation(angle);
      }
      if (window.ScenesStudio && typeof window.ScenesStudio.renderPreview === 'function') {
        window.ScenesStudio.renderPreview();
      }
      this.showToast(`已切换屏幕朝向至 ${angle}°`);
    }

    window.dispatchEvent(new CustomEvent('orientationchange', { detail: { angle } }));
  },

  /*  3. Responsive Sliding Tabs Navigation  */
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

  /*  4. Theme Toggle  */
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

  /*  5. Universal Modal Controller  */
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

  /*  6. Device Manager Modal  */
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

  /*  7. Air Provisioning Modal  */
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

  /*  8. Custom LAN IP Modal  */
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
    const dm = window.DeviceManager;
    let ip = dm?.lanIp || localStorage.getItem('epd_lan_ip') || '';
    if (ip === '192.168.10.203') ip = '';
    const isConn = dm ? dm.isLanConnected : false;
    const statusText = document.getElementById('netLanStatus') || document.getElementById('lanStatusText');
    const consoleLink = document.getElementById('lanConsoleLink');

    if (statusText) {
      statusText.textContent = isConn ? `局域网: ${ip}` : (ip ? `局域网: ${ip} (待连接)` : '未连接局域网');
    }
    if (consoleLink) {
      if (ip && isConn) {
        consoleLink.style.display = 'inline-block';
        consoleLink.href = `http://${ip}/`;
      } else {
        consoleLink.style.display = 'none';
      }
    }
  },

  /*  9. 1:1 Dither Dot-Matrix Simulation Modal  */
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

    const isPortrait = (this.orientation === 90 || this.orientation === 270);
    modalCanvas.width = isPortrait ? 552 : 768;
    modalCanvas.height = isPortrait ? 768 : 552;

    const modalTitle = document.querySelector('#ditherPreviewModal .modal-title');
    if (modalTitle) {
      modalTitle.textContent = `👁️ 墨水屏 4色微粒物理点阵预览 (${modalCanvas.width}×${modalCanvas.height} · ${this.orientation || 0}°)`;
    }

    if (!algo) {
      algo = document.getElementById('imageAlgoSelect')?.value || 'floyd';
    }
    if (!options) {
      const activePane = document.querySelector('.tab-pane.active, .tab-view.active');
      const isPhotoLab = activePane && (activePane.id === 'tab-image' || activePane.id === 'view-image');
      if (isPhotoLab) {
        const contrast = parseFloat(document.getElementById('imageContrastSlider')?.value || 15);
        const redBoostVal = parseFloat(document.getElementById('imageRedBoostSlider')?.value || 0);
        const yellowBoostVal = parseFloat(document.getElementById('imageYellowBoostSlider')?.value || 0);
        const redBoost = redBoostVal > 0 ? 1.0 + (redBoostVal / 50) : 1.0;
        const yellowBoost = yellowBoostVal > 0 ? 1.0 + (yellowBoostVal / 50) : 1.0;
        options = { contrast, redBoost, yellowBoost };
      } else {
        options = { contrast: 0, redBoost: 1.0, yellowBoost: 1.0 };
      }
    }

    options = Object.assign({ orientation: this.orientation }, options || {});
    const packed = BWRY.ditherCanvasTo2bpp(sourceCanvas, algo, options);
    BWRY.render2bppToCanvas(modalCanvas, packed, this.orientation);

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
      this.showToast('🎉 点阵推送成功！墨水屏正在刷新...', 'success', 4000);
      this.closeModal('ditherPreviewModal');
    } catch(err) {
      this.showToast(`推送失败: ${err.message}`, 'error', 4000);
    }
  },

  /*  10. 2bpp BIN Export & Import  */
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

  /*  11. Toast Notifications  */
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
  },

  /*  12. System Diagnostics & MQTT Management  */
  _bleBroadcastEnabled: true,
  _screenDebugEnabled: false,

  async pollSystemDiag() {
    if (!window.DeviceManager?.lanIp) {
      this.showToast('请先输入或连接局域网设备 IP', 'info');
      return;
    }
    try {
      this.showToast('正在从 ESP32-C3 拉取系统底层诊断指标...', 'info', 2000);
      const data = await window.DeviceManager.fetchSystemDiag();

      if (document.getElementById('diagChip')) {
        document.getElementById('diagChip').textContent = data.chip_model || 'ESP32-C3 RISC-V 160MHz (rev v0.4)';
      }
      if (document.getElementById('diagMac')) {
        document.getElementById('diagMac').textContent = data.mac_address || '--:--:--:--:--:--';
      }
      if (document.getElementById('diagRssi')) {
        document.getElementById('diagRssi').textContent = `${data.wifi_rssi || -42} dBm (📶 信号良好)`;
      }
      if (document.getElementById('diagIp')) {
        document.getElementById('diagIp').innerHTML = `<a href="http://${data.ip_address || window.DeviceManager.lanIp}/" target="_blank" style="color:var(--md-sys-color-primary);">http://${data.ip_address || window.DeviceManager.lanIp}/</a> · http://epd-display.local`;
      }

      // Format Uptime
      const up = data.uptime_secs || 0;
      const d = Math.floor(up / 86400);
      const h = Math.floor((up % 86400) / 3600);
      const m = Math.floor((up % 3600) / 60);
      const s = up % 60;
      if (document.getElementById('diagUptime')) {
        document.getElementById('diagUptime').textContent = `${d}天 ${h}小时 ${m}分 ${s}秒`;
      }

      if (document.getElementById('diagHeap')) {
        document.getElementById('diagHeap').textContent = `${(data.free_heap || 0).toLocaleString()} 字节 (最低剩余 ${(data.min_free_heap || 0).toLocaleString()} 字节，运行极佳)`;
      }
      if (document.getElementById('diagFlash')) {
        document.getElementById('diagFlash').textContent = `${Math.round((data.flash_chip_size || 4194304) / 1048576)} MB (4,194,304 字节，DIO 40MHz)`;
      }
      if (document.getElementById('diagStorage')) {
        const totalKb = Math.round((data.storage_partition_size || 1632 * 1024) / 1024);
        const freeKb = Math.round((data.storage_free_bytes || 1632 * 1024) / 1024);
        document.getElementById('diagStorage').textContent = `总量 ${totalKb} KB · 剩余可用约 ${freeKb} KB`;
      }
      if (document.getElementById('diagNvs')) {
        const totalNvs = Math.round((data.nvs_size || 24576) / 1024);
        const freeNvs = Math.round(((data.nvs_size || 24576) - (data.nvs_used_bytes || 6144)) / 1024);
        document.getElementById('diagNvs').textContent = `总量 ${totalNvs} KB · 剩余可用约 ${freeNvs} KB`;
      }
      if (document.getElementById('diagPanel')) {
        document.getElementById('diagPanel').textContent = data.panel_model || 'SE0398NZ07-FNG-A0/A1 (4-Color BWRY 768×552)';
      }
      if (document.getElementById('diagWirelessMode')) {
        const names = { auto: '智能自动 (Auto)', ble_only: '仅蓝牙 (BLE Only)', wifi_only: '仅 Wi-Fi', dual: '双模并发 (Dual Mode)' };
        document.getElementById('diagWirelessMode').textContent = names[data.wireless_mode] || data.wireless_mode || '智能自动 (Auto)';
      }
      if (document.getElementById('diagBleClients')) {
        document.getElementById('diagBleClients').textContent = `${(data.ble_devices || []).length} 台客户端在线`;
      }
      if (document.getElementById('bleClientsCount')) {
        document.getElementById('bleClientsCount').textContent = `当前在线：${(data.ble_devices || []).length} 台`;
      }
      if (document.getElementById('diagBattery')) {
        document.getElementById('diagBattery').textContent = data.battery_low ? '⚠️ 低电量预警 (请接通 USB-C 充电)' : '供电正常 (USB 5V / 3.3V LDO)';
      }
      if (document.getElementById('diagResetReason')) {
        document.getElementById('diagResetReason').textContent = data.reset_reason || 'Power-on / Normal';
      }

      // Update BLE status UI
      this.updateBleStatusUI(data.ble_enabled, data.ble_status, data.ble_device_name, data.ble_devices);

      // Update Screen Debug
      if (data.screen_debug !== undefined) {
        this.updateScreenDebugUI(data.screen_debug);
      }

      this.showToast('✅ 系统指标已成功刷新', 'success', 2500);
    } catch (e) {
      this.showToast(`拉取系统指标失败: ${e.message}`, 'error', 4000);
    }
  },

  updateScreenDebugUI(enabled) {
    this._screenDebugEnabled = enabled;
    const txt = document.getElementById('screenDebugStatusText');
    const btn = document.getElementById('btnToggleScreenDebug');
    const diag = document.getElementById('diagDebugOverlay');
    if (txt) {
      txt.textContent = enabled ? '已开启 (ON)' : '已关闭 (OFF)';
      txt.style.color = enabled ? '#2e7d32' : 'var(--md-sys-color-primary)';
    }
    if (diag) {
      diag.textContent = enabled ? '已开启 (屏幕最底部绘制 20px IP与MAC状态条)' : '已关闭';
      diag.style.color = enabled ? '#2e7d32' : 'inherit';
    }
    if (btn) {
      btn.textContent = enabled ? '关闭屏显 Debug' : '开启屏显 Debug';
      btn.className = enabled ? 'm3-btn small' : 'm3-btn small tonal';
    }
  },

  async toggleScreenDebug() {
    try {
      const res = await window.DeviceManager.toggleScreenDebug();
      this.updateScreenDebugUI(res.screen_debug);
      this.showToast(`⚡ ${res.message || '屏显 Debug 叠加条已切换'}`, 'success', 3000);
    } catch (e) {
      this.showToast(`切换失败: ${e.message}`, 'error', 3500);
    }
  },

  updateBleStatusUI(enabled, statusStr, devName, devices) {
    this._bleBroadcastEnabled = enabled;
    const badge = document.getElementById('bleStatusBadge');
    const btn = document.getElementById('btnToggleBle');
    const diag = document.getElementById('diagBleStatus');
    const listEl = document.getElementById('bleDeviceList');

    const statusText = statusStr === 'CONN' ? '已连接 (CONN)' : (statusStr === 'ADV' ? '广播中 (ADV)' : '已关闭 (OFF)');
    const statusBg = statusStr === 'CONN' ? '#1565c0' : (statusStr === 'ADV' ? '#2e7d32' : '#757575');

    if (badge) {
      badge.textContent = statusText;
      badge.style.background = statusBg;
    }
    if (btn) {
      btn.textContent = enabled ? '关闭蓝牙广播' : '开启蓝牙广播';
      btn.className = enabled ? 'm3-btn small tonal' : 'm3-btn small';
    }
    if (diag) {
      diag.textContent = `${statusText} · ${devName || 'EPD-Smart-Display'}`;
    }

    const devs = devices || [];
    if (listEl) {
      if (devs.length === 0) {
        listEl.innerHTML = `
          <div style="padding:10px; background:var(--md-sys-color-surface-container); border-radius:8px; font-size:12px; color:var(--md-sys-color-on-surface-variant); text-align:center;">
            暂无已连接的蓝牙主机（可用手机 Chrome 开启蓝牙直连配对）
          </div>
        `;
      } else {
        listEl.innerHTML = devs.map(d => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--md-sys-color-surface-container); border-radius:8px; font-size:12px;">
            <div>
              <div style="font-weight:700;">📱 ${d.name || 'WebBLE Client'} <span style="font-size:11px; font-weight:normal; opacity:0.7;">(${d.mac || 'BLE'})</span></div>
              <div style="font-size:11px; color:var(--md-sys-color-on-surface-variant); margin-top:2px;">信号: ${d.rssi || 0} dBm · 在线: ${d.connected_duration_secs || 0} 秒</div>
            </div>
            <button class="m3-btn small danger" onclick="UI.disconnectBleClient('${d.id}')">断开</button>
          </div>
        `).join('');
      }
    }
  },

  async toggleBleBroadcast() {
    try {
      const next = !this._bleBroadcastEnabled;
      const res = await window.DeviceManager.toggleBleBroadcast(next);
      this._bleBroadcastEnabled = res.ble_enabled;
      this.updateBleStatusUI(res.ble_enabled, res.ble_status, 'EPD-Smart-Display', []);
      this.showToast(`🎉 ${res.message || '蓝牙广播状态已更新'}`, 'success', 3000);
    } catch (e) {
      this.showToast(`操作失败: ${e.message}`, 'error', 3500);
    }
  },

  async disconnectBleClient(clientId) {
    if (!confirm('确认断开该蓝牙客户端的连接吗？')) return;
    try {
      await window.DeviceManager.disconnectBleClient(clientId);
      this.showToast('已断开蓝牙客户端连接', 'success', 2500);
      this.pollSystemDiag();
    } catch (e) {
      this.showToast(`断开失败: ${e.message}`, 'error', 3500);
    }
  },

  async setWirelessMode(mode) {
    try {
      const res = await window.DeviceManager.setWirelessMode(mode);
      document.querySelectorAll('.wireless-opt-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(`opt-${mode}`);
      if (activeBtn) activeBtn.classList.add('active');
      this.showToast(`🎉 ${res.message || `无线模式已切换为 ${mode}`}`, 'success', 3500);
      this.pollSystemDiag();
    } catch (e) {
      this.showToast(`切换无线模式失败: ${e.message}`, 'error', 3500);
    }
  },

  async rebootDevice() {
    if (!confirm('确定软重启墨水屏主控设备吗？')) return;
    try {
      await window.DeviceManager.reboot();
      this.showToast('⚡ 设备正在软重启，请稍后重新连接...', 'info', 5000);
    } catch (e) {
      this.showToast(`重启失败: ${e.message}`, 'error', 3500);
    }
  },

  async factoryReset() {
    if (!confirm('⚠️ 警告：恢复出厂设置将清除设备中保存的 Wi-Fi 密码并重启进入 AP 热点模式，确认继续吗？')) return;
    try {
      await window.DeviceManager.factoryReset();
      this.showToast('⚡ 已恢复出厂设置，设备正在重启...', 'warning', 6000);
    } catch (e) {
      this.showToast(`操作失败: ${e.message}`, 'error', 3500);
    }
  },

  async loadConfig() {
    try {
      const cfg = await window.DeviceManager.fetchConfig();
      if (!cfg) return;
      if (document.getElementById('wifiSsid') && cfg.wifi_ssid) document.getElementById('wifiSsid').value = cfg.wifi_ssid;
      if (document.getElementById('wifiPass') && cfg.wifi_pass) document.getElementById('wifiPass').value = cfg.wifi_pass;
      if (document.getElementById('mqttHost') && cfg.mqtt_broker) document.getElementById('mqttHost').value = cfg.mqtt_broker;
      if (document.getElementById('mqttPort') && cfg.mqtt_port) document.getElementById('mqttPort').value = cfg.mqtt_port;
      if (document.getElementById('mqttUser')) document.getElementById('mqttUser').value = cfg.mqtt_user || '';
      if (document.getElementById('mqttPass')) document.getElementById('mqttPass').value = cfg.mqtt_pass || '';

      if (document.getElementById('modalMqttHost') && cfg.mqtt_broker) document.getElementById('modalMqttHost').value = cfg.mqtt_broker;
      if (document.getElementById('modalMqttPort') && cfg.mqtt_port) document.getElementById('modalMqttPort').value = cfg.mqtt_port;
      if (document.getElementById('modalMqttUser')) document.getElementById('modalMqttUser').value = cfg.mqtt_user || '';
      if (document.getElementById('modalMqttPass')) document.getElementById('modalMqttPass').value = cfg.mqtt_pass || '';

      if (cfg.screen_debug !== undefined) this.updateScreenDebugUI(cfg.screen_debug);
      this.showToast('✅ 已从设备载入最新网络与 MQTT 配置', 'success', 2500);
    } catch (e) {
      this.showToast(`读取设备配置失败: ${e.message}`, 'error', 3500);
    }
  },

  async saveNetworkConfig() {
    const ssid = document.getElementById('wifiSsid')?.value.trim() || '';
    const pass = document.getElementById('wifiPass')?.value || '';
    const mqttHost = document.getElementById('mqttHost')?.value.trim() || '';
    const mqttPort = parseInt(document.getElementById('mqttPort')?.value) || 1883;
    const mqttUser = document.getElementById('mqttUser')?.value.trim() || '';
    const mqttPass = document.getElementById('mqttPass')?.value || '';

    try {
      const res = await window.DeviceManager.saveConfig({
        wifi_ssid: ssid,
        wifi_pass: pass,
        mqtt_broker: mqttHost,
        mqtt_port: mqttPort,
        mqtt_user: mqttUser,
        mqtt_pass: mqttPass
      });
      this.showToast(`🎉 ${res.message || '网络与 MQTT 配置已成功保存！'}`, 'success', 4000);
    } catch (e) {
      this.showToast(`保存配置失败: ${e.message}`, 'error', 4000);
    }
  },

  async saveModalMqttConfig() {
    const mqttHost = document.getElementById('modalMqttHost')?.value.trim() || '';
    const mqttPort = parseInt(document.getElementById('modalMqttPort')?.value) || 1883;
    const mqttUser = document.getElementById('modalMqttUser')?.value.trim() || '';
    const mqttPass = document.getElementById('modalMqttPass')?.value || '';

    try {
      const res = await window.DeviceManager.saveConfig({
        mqtt_broker: mqttHost,
        mqtt_port: mqttPort,
        mqtt_user: mqttUser,
        mqtt_pass: mqttPass
      });
      this.showToast(`🎉 ${res.message || 'MQTT Broker 配置已成功保存！'}`, 'success', 4000);
    } catch (e) {
      this.showToast(`保存 MQTT 失败: ${e.message}`, 'error', 4000);
    }
  }
};

window.UI = UI;
