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

    if (tabId === 'system') {
      this.pollSystemDiag();
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
      el.querySelectorAll('button[disabled]').forEach(b => {
        b.disabled = false;
        b.removeAttribute('disabled');
      });
    }
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active', 'open');
      el.setAttribute('aria-hidden', 'true');
      el.querySelectorAll('button[disabled]').forEach(b => {
        b.disabled = false;
        b.removeAttribute('disabled');
      });
    }
  },

  /*  6. Two-Way Device Manager & Security Pairing  */
  getSmartDeviceName() {
    const ua = navigator.userAgent || '';
    const isMobile = /Android|Mobile/i.test(ua);
    const isWindows = /Windows/i.test(ua);
    const isLinux = /Linux/i.test(ua) && !isMobile;

    if (isMobile) {
      if (/Samsung|SM-|Galaxy/i.test(ua)) {
        return '主力机三星 Fold7';
      } else if (/Redmi|Xiaomi|MI\s/i.test(ua)) {
        return '备用机红米';
      } else {
        return '主力机 Android 终端';
      }
    } else if (isWindows) {
      if (window.screen && (window.screen.width <= 1280 && window.screen.height <= 800)) {
        return '我的 GPD 掌机';
      }
      return '我的台式机';
    } else if (isLinux) {
      return '我的 Linux 工作站';
    }
    return '我的智能设备';
  },

  openUnauthConfirmModal(status) {
    this.openModal('unauthConfirmModal');
  },

  cancelUnauthConnect() {
    this.closeModal('unauthConfirmModal');
    if (DeviceManager && DeviceManager.disconnectBle) {
      DeviceManager.disconnectBle().catch(() => {});
    }
    this.showToast('已取消连接，墨水屏屏幕保持原样不刷新。', 'info', 4000);
  },

  async startPinPairingFromConfirm() {
    this.closeModal('unauthConfirmModal');
    if (!DeviceManager.pinPairingEnabled) {
      this.showToast('🛡️ 墨水屏主人已关闭屏幕 PIN 配对（防骚扰模式）！请使用碰一碰 NFC 钥匙绑定。', 'danger', 6000);
      return;
    }
    this.showToast('📡 正在请求墨水屏生成动态 PIN 码并刷新屏幕...', 'info', 4000);
    try {
      await DeviceManager.requestPinPairing();
    } catch (e) {
      this.showToast('请求配对失败: ' + e.message, 'danger');
    }
  },

  openPinPairModal() {
    const codeInput = document.getElementById('pinCodeInput');
    const nameInput = document.getElementById('pinDevNameInput');
    if (codeInput) {
      codeInput.value = '';
      setTimeout(() => codeInput.focus(), 300);
    }
    if (nameInput) {
      nameInput.value = this.getSmartDeviceName();
    }
    this.openModal('pinPairModal');
  },

  async submitPinPairing() {
    const codeInput = document.getElementById('pinCodeInput');
    const nameInput = document.getElementById('pinDevNameInput');
    const pin = codeInput ? codeInput.value.trim() : '';
    const devName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : this.getSmartDeviceName();

    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      this.showToast('请输入墨水屏物理屏幕上显示的 6 位完整数字 PIN 码！', 'danger', 4000);
      if (codeInput) codeInput.focus();
      return;
    }

    this.showToast('正在向墨水屏验证 PIN 码并授权注册...', 'info', 4000);
    try {
      await DeviceManager.verifyPinPairing(pin, devName);
    } catch (e) {
      this.showToast('配对请求发送失败: ' + e.message, 'danger');
    }
  },

  showPairingSuccessGuide(authRecord) {
    this.showToast(`💡 配对成功！墨水屏屏幕已切换至【配对成功与 NFC 钥匙指引】。\n建议在【设备管理】中将电子钥匙写入贴纸 NFC 标签。`, 'success', 8000);
  },

  openDeviceManagerModal() {
    this.openModal('devManageModal');
    if (DeviceManager && DeviceManager.isBleConnected) {
      this.switchDevManageTab('badge');
    } else {
      this.switchDevManageTab('local');
    }
  },

  switchDevManageTab(tab) {
    const badgeContent = document.getElementById('tabDevBadgeContent');
    const localContent = document.getElementById('tabDevLocalContent');
    const badgeBtn = document.getElementById('tabDevBadgeBtn');
    const localBtn = document.getElementById('tabDevLocalBtn');

    if (tab === 'badge') {
      if (badgeContent) badgeContent.style.display = 'block';
      if (localContent) localContent.style.display = 'none';
      if (badgeBtn) { badgeBtn.className = 'm3-btn small tonal active'; }
      if (localBtn) { localBtn.className = 'm3-btn small outlined'; }

      const notConnectedAlert = document.getElementById('devBadgeNotConnectedAlert');
      const connectedArea = document.getElementById('devBadgeConnectedArea');

      if (!DeviceManager || !DeviceManager.isBleConnected) {
        if (notConnectedAlert) notConnectedAlert.style.display = 'block';
        if (connectedArea) connectedArea.style.display = 'none';
      } else {
        if (notConnectedAlert) notConnectedAlert.style.display = 'none';
        if (connectedArea) connectedArea.style.display = 'block';

        DeviceManager.getTrustedDevices().then(list => {
          this.renderTrustedDevList(list);
        }).catch(err => {
          console.warn('[UI] Fetch trusted devices error:', err);
        });

        DeviceManager.fetchMasterKey().then(key => {
          this.updateNfcKeyUI(key);
        }).catch(err => {
          console.warn('[UI] Fetch master key error:', err);
        });

        this.updatePinPairingUI(DeviceManager.pinPairingEnabled);
      }
    } else {
      if (badgeContent) badgeContent.style.display = 'none';
      if (localContent) localContent.style.display = 'block';
      if (badgeBtn) { badgeBtn.className = 'm3-btn small outlined'; }
      if (localBtn) { localBtn.className = 'm3-btn small tonal active'; }
      this.renderLocalBadgeList();
    }
  },

  renderTrustedDevList(devices) {
    const container = document.getElementById('trustedDevListContainer');
    if (!container) return;

    if (!devices || devices.length === 0) {
      container.innerHTML = `
        <div style="font-size:12px; color:var(--md-sys-color-outline); padding:14px; text-align:center; background:var(--md-sys-color-surface-container); border-radius:10px;">
          暂无已授权设备。出厂或重置后，请通过 6 位动态 PIN 码或 NFC 电子钥匙完成首次配对。
        </div>
      `;
      return;
    }

    const currentDevKey = DeviceManager.bleDevice ? (DeviceManager.bleDevice.id || DeviceManager.bleDevice.name || 'default') : 'default';
    let myAuth = null;
    try {
      myAuth = JSON.parse(localStorage.getItem('epd_auth_' + currentDevKey) || localStorage.getItem('epd_auth_default') || 'null');
    } catch(e) {}

    container.innerHTML = devices.map(dev => {
      const isCurrent = myAuth && myAuth.device_id === dev.device_id;
      const isMobile = /手机|Fold|红米|Android|Phone/i.test(dev.device_name);
      const icon = isMobile ? '📱' : '💻';
      const pairedDateStr = dev.paired_at ? new Date(dev.paired_at * 1000).toLocaleDateString('zh-CN') : '近期';
      return `
        <div class="dev-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--md-sys-color-surface-container); border-radius:12px; border:1px solid ${isCurrent ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant, #e0e0e0)'};">
          <div class="dev-item-left" style="display:flex; flex-direction:column; gap:3px;">
            <div class="dev-item-title" style="display:flex; align-items:center; gap:6px;">
              <span>${icon}</span>
              <strong>${dev.device_name || '未命名控制端'}</strong>
              ${isCurrent ? '<span style="font-size:10px; background:var(--md-sys-color-primary); color:#fff; border-radius:6px; padding:2px 6px;">当前设备</span>' : ''}
            </div>
            <div class="dev-item-meta" style="font-size:11px; opacity:0.75; font-family:monospace;">
              ID: ${dev.device_id || 'unknown'} · 授权于: ${pairedDateStr}
            </div>
          </div>
          <div class="dev-item-actions" style="display:flex; gap:6px;">
            <button class="m3-btn small tonal" onclick="UI.renameTrustedDevice('${dev.device_id}', '${(dev.device_name || '').replace(/'/g, "\\'")}')">重命名</button>
            <button class="m3-btn small danger" onclick="UI.deleteTrustedDevice('${dev.device_id}', '${(dev.device_name || '').replace(/'/g, "\\'")}')">解除</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async renameTrustedDevice(id, currentName) {
    const next = prompt('输入控制端在墨水屏 NVS 中的新名称 (例如: 主力机三星 Fold7 / 我的台式机):', currentName);
    if (next && next.trim() && next.trim() !== currentName) {
      try {
        await DeviceManager.renameTrustedDevice(id, next.trim());
        this.showToast(`✅ 已更新控制端名称为「${next.trim()}」`, 'success');
        const list = await DeviceManager.getTrustedDevices();
        this.renderTrustedDevList(list);
      } catch (e) {
        this.showToast('重命名失败: ' + e.message, 'danger');
      }
    }
  },

  async deleteTrustedDevice(id, currentName) {
    if (!confirm(`确定要从墨水屏硬件 NVS 白名单中解除「${currentName}」的控制权限吗？\n\n解除后，该设备将无法向墨水屏推送或刷新，下次连接必须重新配对！`)) {
      return;
    }
    try {
      await DeviceManager.deleteTrustedDevice(id);
      this.showToast(`🗑️ 已解除「${currentName}」的授权`, 'info');
      const badgeKey = DeviceManager.bleDevice ? (DeviceManager.bleDevice.id || DeviceManager.bleDevice.name || 'default') : 'default';
      let myAuth = null;
      try {
        myAuth = JSON.parse(localStorage.getItem('epd_auth_' + badgeKey) || localStorage.getItem('epd_auth_default') || 'null');
      } catch(e) {}
      if (myAuth && myAuth.device_id === id) {
        DeviceManager.isBleAuthenticated = false;
        localStorage.removeItem('epd_auth_' + badgeKey);
        this.showToast('⚠️ 本设备已被解除授权，当前会话已降级为未认证状态', 'warning', 6000);
      }
      const list = await DeviceManager.getTrustedDevices();
      this.renderTrustedDevList(list);
    } catch (e) {
      this.showToast('解除授权失败: ' + e.message, 'danger');
    }
  },

  async togglePinPairing() {
    try {
      const next = !DeviceManager.pinPairingEnabled;
      await DeviceManager.setPinPairing(next);
      this.updatePinPairingUI(next);
      this.showToast(next ? '🔓 屏幕 PIN 配对已开启' : '🛡️ 屏幕 PIN 配对已关闭（防骚扰模式生效中）', 'success', 4000);
    } catch (e) {
      this.showToast('切换 PIN 配对状态失败: ' + e.message, 'danger');
    }
  },

  updatePinPairingUI(enabled) {
    const btn = document.getElementById('btnTogglePinPairing');
    const desc = document.getElementById('pinPairingDesc');
    if (btn) {
      btn.textContent = enabled ? '关闭防骚扰 (开启PIN)' : '开启防骚扰 (关闭PIN)';
      btn.className = enabled ? 'm3-btn small outlined' : 'm3-btn small tonal';
    }
    if (desc) {
      desc.innerHTML = enabled
        ? '状态: <strong style="color:var(--md-sys-color-primary);">开启</strong> · 陌生设备可通过屏幕 6 位动态 PIN 码申请配对。漫展或外出时建议关闭以杜绝恶意蹭连刷屏。'
        : '状态: <strong style="color:#d93025;">已关闭（防骚扰生效中）</strong> · 陌生设备无法发起屏幕 PIN 码配对，杜绝频繁刷屏骚扰！仅允许已有白名单设备或碰一碰物理 NFC 钥匙绑定。';
    }
  },

  updateNfcKeyUI(key) {
    const input = document.getElementById('nfcKeyDisplay');
    if (input) {
      input.value = key ? `https://398epd.zgqinc.gq/#key=${key}` : '未生成主密钥';
    }
  },

  async triggerWriteNfcTag() {
    let key = DeviceManager.currentBadgeMasterKey || localStorage.getItem('epd_master_key') || '';
    if (!key) {
      try {
        key = await DeviceManager.fetchMasterKey();
      } catch (e) {}
    }
    if (!key) {
      this.showToast('未能获取到墨水屏专属主密钥，请确认蓝牙连接', 'danger');
      return;
    }

    const nfcUrl = `https://398epd.zgqinc.gq/#key=${key}`;
    if ('NDEFReader' in window) {
      try {
        const ndef = new window.NDEFReader();
        this.showToast('📱 请将 NFC 标签（如贴纸/挂绳）贴近手机背部感应区...', 'info', 10000);
        await ndef.write({
          records: [{
            recordType: 'url',
            data: nfcUrl
          }]
        });
        this.showToast('🎉 NFC 电子钥匙写入成功！任意手机碰一碰即可秒连。', 'success', 6000);
      } catch (err) {
        console.warn('[NFC] Write failed:', err);
        this.showToast('NFC 写入失败: ' + err.message + '，可直接复制链接手动写入', 'danger', 5000);
      }
    } else {
      prompt('当前环境不支持直接调用 Web NFC API（Web NFC 支持 Android 版 Chrome/Edge）。\n\n请复制以下电子钥匙网址，使用任意 NFC 工具（如 NFC Tools App）写入 NTAG213/215 标签：', nfcUrl);
    }
  },

  copyNfcUrl() {
    const key = DeviceManager.currentBadgeMasterKey || localStorage.getItem('epd_master_key') || '';
    if (!key) {
      this.showToast('未能获取墨水屏密钥', 'danger');
      return;
    }
    const nfcUrl = `https://398epd.zgqinc.gq/#key=${key}`;
    navigator.clipboard.writeText(nfcUrl).then(() => {
      this.showToast('📋 已复制 NFC 电子钥匙链接到剪贴板！', 'success', 4000);
    }).catch(() => {
      prompt('请手动复制 NFC 电子钥匙链接：', nfcUrl);
    });
  },

  renderLocalBadgeList() {
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
          暂无已记忆墨水屏徽章。请点击下方「扫描配对新设备」通过 Web Bluetooth 快速连接！
        </div>
      `;
    } else {
      container.innerHTML = list.map(dev => `
        <div class="dev-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--md-sys-color-surface-container); border-radius:12px; border:1px solid var(--md-sys-color-outline-variant, #e0e0e0);">
          <div class="dev-item-left">
            <div class="dev-item-title" style="display:flex; align-items:center; gap:6px;">
              <span>📇</span>
              <strong>${dev.alias || dev.name || 'EPD-Display'}</strong>
              <span style="font-size:11px; opacity:0.7;">(${dev.name || 'BLE'})</span>
            </div>
            <div class="dev-item-meta" style="font-size:11px; opacity:0.75; font-family:monospace;">
              ID: ${dev.id ? dev.id.slice(0, 16) + '...' : 'WebBLE'} · 上次连接: ${new Date(dev.lastSeen || Date.now()).toLocaleDateString('zh-CN')}
            </div>
          </div>
          <div class="dev-item-actions" style="display:flex; gap:6px;">
            <button class="m3-btn small tonal" onclick="UI.renameDevice('${dev.id}')">重命名</button>
            <button class="m3-btn small danger" onclick="UI.deleteDevice('${dev.id}')">删除</button>
          </div>
        </div>
      `).join('');
    }
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

    const next = prompt('输入墨水屏徽章自定义别名:', dev.alias || dev.name);
    if (next && next.trim()) {
      dev.alias = next.trim();
      localStorage.setItem('epd_devices', JSON.stringify(list));
      this.renderLocalBadgeList();
      this.showToast(`已重命名徽章为「${dev.alias}」`, 'success');
    }
  },

  deleteDevice(id) {
    let list = JSON.parse(localStorage.getItem('epd_devices') || '[]');
    list = list.filter(d => d.id !== id);
    localStorage.setItem('epd_devices', JSON.stringify(list));
    this.renderLocalBadgeList();
    this.showToast('已从本地移除该墨水屏徽章记忆', 'info');
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
    const notice = document.getElementById('lanHttpsNotice');
    const directLink = document.getElementById('lanDirectConsoleLink');
    if (notice) {
      if (window.location.protocol === 'https:' && currentIp) {
        notice.style.display = 'block';
        if (directLink) {
          directLink.href = `http://${currentIp}/`;
          directLink.textContent = `http://${currentIp}/`;
        }
      } else {
        notice.style.display = 'none';
      }
    }
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
        if (window.location.protocol === 'https:') {
          this.showToast(`已保存 IP: ${ip} (提示：HTTPS 下浏览器拦截私有局域网 HTTP，可直接点击顶部「打开控制台」跳转 http://${ip}/，或使用蓝牙直连)`, 'info', 6000);
        } else {
          this.showToast(`已保存 IP: ${ip} (未检测到响应)`, 'warning', 4000);
        }
      }
    }
  },

  initLanStatus() {
    const dm = window.DeviceManager;
    let ip = dm?.lanIp || localStorage.getItem('epd_lan_ip') || '';
    const isConn = dm ? dm.isLanConnected : false;
    const statusText = document.getElementById('netLanStatus') || document.getElementById('lanStatusText');
    const consoleLink = document.getElementById('lanConsoleLink');

    if (statusText) {
      if (isConn) {
        statusText.textContent = `局域网: ${ip}`;
      } else if (ip) {
        statusText.textContent = window.location.protocol === 'https:' ? `局域网: ${ip} (板载控制台)` : `局域网: ${ip} (待连接)`;
      } else {
        statusText.textContent = '未连接局域网';
      }
    }
    if (consoleLink) {
      if (ip) {
        consoleLink.style.display = 'inline-block';
        consoleLink.href = `http://${ip}/`;
        consoleLink.title = `在新标签页打开墨水屏板载控制台 (http://${ip}/)`;
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
    this._activePreset = null;

    if (modalTitle) {
      modalTitle.textContent = '👁️ 抖动点阵物理仿真预览 (768×552)';
    }
    const pushBtn = document.getElementById('modalPushDitherBtn');
    if (pushBtn) {
      pushBtn.textContent = '🚀 推送此点阵至墨水屏';
    }

    this.openModal(document.getElementById('ditherPreviewModal') ? 'ditherPreviewModal' : 'presetPreviewModal');
  },

  async pushModalDither() {
    if (this._activePreset) {
      const preset = this._activePreset;
      const isHardwareConnected = (window.DeviceManager.isBleConnected && window.DeviceManager.bleDevice?.gatt?.connected)
        || (window.DeviceManager.isLanConnected && !!window.DeviceManager.lanIp);

      if (!isHardwareConnected) {
        this.showToast('⚠️ 未连通单片机硬件，无法执行内部直推！请先在顶部连接蓝牙或局域网', 'warning', 4000);
        return;
      }

      try {
        if (!preset.is_offline) {
          this.showToast(`正在通知单片机内部读取预设「${preset.name}」...`, 'info', 3000);
          await window.DeviceManager.pushPreset(preset.id);
          this.showToast(`🎉 单片机已内部加载 Flash 预设「${preset.name}」并启动墨水屏全屏物理刷新！`, 'success', 5000);
        } else if (preset.raw_bitmap) {
          this.showToast(`正在点对点推送本地离线草稿「${preset.name}」至墨水屏...`, 'info', 4000);
          await window.DeviceManager.pushBitmap2bpp(new Uint8Array(preset.raw_bitmap));
          this.showToast(`🎉 离线预设「${preset.name}」推送成功！`, 'success', 4000);
        }
        this.closeModal('ditherPreviewModal');
      } catch (err) {
        this.showToast(`推送失败: ${err.message}`, 'error', 4000);
      }
      return;
    }

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
  async exportCanvasAsBin() {
    const activePane = document.querySelector('.tab-pane.active, .tab-view.active');
    const isSystemTab = activePane && activePane.id === 'tab-system';

    if (isSystemTab && window.DeviceManager.isLanConnected && window.DeviceManager.lanIp) {
      try {
        this.showToast('正在从单片机读取当前物理显存 105,984 字节...', 'info', 3000);
        const res = await fetch(`http://${window.DeviceManager.lanIp}/api/display/raw`, {
          signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
          const isCompressed = res.headers.get('x-compression') === 'packbits';
          const buf = await res.arrayBuffer();
          const raw = new Uint8Array(buf);
          const packed = (isCompressed || raw.length < 105984)
            ? window.DeviceManager.unpackBits(raw, 105984)
            : raw;

          const blob = new Blob([packed], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `epd_device_framebuffer_${Date.now()}.bin`;
          a.click();
          URL.revokeObjectURL(url);
          this.showToast('✅ 成功导出单片机当前物理显存 105,984 字节 (.bin)！', 'success', 3500);
          return;
        }
      } catch (e) {
        console.warn('Pull raw fb failed, falling back to canvas:', e);
      }
    }

    const canvas = (activePane && !isSystemTab) ? activePane.querySelector('canvas') : (
      document.getElementById('imageLabCanvas') ||
      document.getElementById('scenesPreviewCanvas') ||
      document.getElementById('badgePreviewCanvas') ||
      document.querySelector('canvas')
    );
    if (!canvas) {
      this.showToast('未找到可导出的画布', 'warning');
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
    this.showToast(`✅ 已下载 105,984 字节 2bpp 显存文件 (朝向: ${this.orientation}°)！`, 'success', 3500);
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
    const isConn = (window.DeviceManager?.isBleConnected && window.DeviceManager?.bleDevice?.gatt?.connected)
      || (window.DeviceManager?.isLanConnected && !!window.DeviceManager?.lanIp)
      || !!window.DeviceManager?.lanIp;
    if (!isConn) {
      this.showToast('请先连接蓝牙或配置局域网设备 IP', 'info');
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
        document.getElementById('diagRssi').textContent = data.wifi_rssi ? `${data.wifi_rssi} dBm` : 'BLE 无线模式';
      }
      if (document.getElementById('diagIp')) {
        const ip = data.ip_address || window.DeviceManager.lanIp || '0.0.0.0';
        if (ip && ip !== '0.0.0.0') {
          document.getElementById('diagIp').innerHTML = `<a href="http://${ip}/" target="_blank" style="color:var(--md-sys-color-primary);">http://${ip}/</a> · http://epd-display.local`;
        } else {
          document.getElementById('diagIp').textContent = '未分配 (纯 BLE 模式离线运行中)';
        }
      }

      const up = data.uptime_secs || 0;
      const d = Math.floor(up / 86400);
      const h = Math.floor((up % 86400) / 3600);
      const m = Math.floor((up % 3600) / 60);
      const s = up % 60;
      if (document.getElementById('diagUptime')) {
        document.getElementById('diagUptime').textContent = `${d}天 ${h}小时 ${m}分 ${s}秒`;
      }
      if (document.getElementById('diagNtpTime')) {
        const ntpStatus = data.ntp_synced ? '✅ NTP 已授时' : (data.current_time?.includes('BLE') ? '⚡ 蓝牙直连 (免NTP)' : '⏳ 同步 NTP 中...');
        document.getElementById('diagNtpTime').textContent = data.current_time ? `${data.current_time} (${ntpStatus})` : ntpStatus;
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
        const freeNvs = data.nvs_free_bytes !== undefined
          ? (data.nvs_free_bytes / 1024).toFixed(1)
          : Math.round(((data.nvs_size || 24576) - (data.nvs_used_bytes || 6144)) / 1024);
        document.getElementById('diagNvs').textContent = `总量 ${totalNvs} KB · 剩余可用约 ${freeNvs} KB (实测)`;
      }
      if (document.getElementById('diagPanel')) {
        document.getElementById('diagPanel').textContent = data.panel_model || 'SE0398NZ07-FNG-A0/A1 (4-Color BWRY 768×552)';
      }
      if (data.wireless_mode) {
        const names = { auto: '智能自动 (Auto)', ble_only: '仅蓝牙 (BLE Only)', wifi_only: '仅 Wi-Fi', dual: '双模并发 (Dual Mode)' };
        if (document.getElementById('diagWirelessMode')) {
          document.getElementById('diagWirelessMode').textContent = names[data.wireless_mode] || data.wireless_mode || '智能自动 (Auto)';
        }
        document.querySelectorAll('.wireless-opt-btn').forEach(b => {
          b.classList.remove('active');
          b.classList.add('tonal');
        });
        const activeBtn = document.getElementById(`opt-${data.wireless_mode}`);
        if (activeBtn) {
          activeBtn.classList.add('active');
          activeBtn.classList.remove('tonal');
        }
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

      if (document.getElementById('diagBleMtu')) {
        document.getElementById('diagBleMtu').textContent = `${data.ble_mtu || 247} 字节 (GATT Data Payload: 240B, 极速直推)`;
      }
      if (document.getElementById('diagBleService')) {
        document.getElementById('diagBleService').textContent = data.ble_service || '0x00FF (RX: 0xFF01 Write / TX: 0xFF02 Notify)';
      }
      if (document.getElementById('diagBleConnLink')) {
        const isBle = window.DeviceManager?.isBleConnected;
        document.getElementById('diagBleConnLink').textContent = isBle
          ? '已建立高可靠双工无线链路 (WebBLE Dual-Mode 5.0)'
          : '待机就绪 (等待 WebBLE 主机连接)';
        document.getElementById('diagBleConnLink').style.color = isBle ? '#4caf50' : 'inherit';
      }
      if (document.getElementById('diagBlePower')) {
        document.getElementById('diagBlePower').textContent = data.ble_phy || '+9 dBm · BLE 5.0 PHY 1Mbps / 2Mbps';
      }

      this.updateBleStatusUI(data.ble_enabled, data.ble_status, data.ble_device_name, data.ble_devices);

      if (data.screen_debug !== undefined) {
        this.updateScreenDebugUI(data.screen_debug);
      }

      const panelVer = data.panel_version || data.panel_ver || 'A0';
      this.updatePanelVersionUI(panelVer);

      this.showToast('✅ 系统指标已成功刷新', 'success', 2500);
    } catch (e) {
      this.showToast(`拉取系统指标失败: ${e.message}`, 'error', 4000);
    }
  },

  updatePanelVersionUI(ver) {
    this._panelVersion = ver || 'A0';
    const badge = document.getElementById('panelVersionBadge');
    const diag = document.getElementById('diagPanelVersion');
    const bA0 = document.getElementById('opt-panel-a0');
    const bA1 = document.getElementById('opt-panel-a1');
    if (badge) {
      badge.textContent = this._panelVersion === 'A1' ? 'A1 走线' : 'A0 走线';
      badge.style.background = this._panelVersion === 'A1' ? 'var(--md-sys-color-tertiary-container, #ffd8e4)' : 'var(--md-sys-color-primary-container)';
      badge.style.color = this._panelVersion === 'A1' ? 'var(--md-sys-color-on-tertiary-container, #31111d)' : 'var(--md-sys-color-on-primary-container)';
    }
    if (diag) {
      diag.textContent = this._panelVersion === 'A1' ? 'A1 (双向对称扫描 Gate 映射)' : 'A0 (倒序互换扫描 Gate 映射)';
      diag.style.color = this._panelVersion === 'A1' ? 'var(--md-sys-color-tertiary, #7d5260)' : 'inherit';
    }
    if (bA0) {
      bA0.className = (this._panelVersion === 'A0') ? 'm3-btn small panel-opt-btn' : 'm3-btn small tonal panel-opt-btn';
    }
    if (bA1) {
      bA1.className = (this._panelVersion === 'A1') ? 'm3-btn small panel-opt-btn' : 'm3-btn small tonal panel-opt-btn';
    }
  },

  async setPanelVersion(version) {
    try {
      const res = await window.DeviceManager.setPanelVersion(version);
      this.updatePanelVersionUI(res.panel_version || version);
      this.showToast(`🖥️ ${res.message || `屏幕版本已切换为 ${version}`}`, 'success', 3000);
      this.pollSystemDiag();
    } catch (e) {
      this.showToast(`切换失败: ${e.message}`, 'error', 3500);
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
    const warnings = {
      ble_only: '⚠️ 警告：切换为【仅蓝牙 (BLE Only)】将彻底关闭 Wi-Fi 芯片以极致省电。\n\n若您当前正在通过局域网/Wi-Fi 进行控制，当前连接将立即中断！\n后续需使用手机蓝牙直推连接（或通过 USB 串口恢复）。\n\n是否确认切换为仅蓝牙模式？',
      wifi_only: '⚠️ 警告：切换为【仅 Wi-Fi】将关闭蓝牙 BLE 广播与直推通道。\n\n若您当前正在通过蓝牙进行控制，当前连接将立即中断！\n\n是否确认切换为仅 Wi-Fi 模式？',
      dual: 'ℹ️ 切换为【双模并发 (Dual Mode)】将同时开启 Wi-Fi 与蓝牙 BLE 5.0，支持两端并发控制，待机功耗会略微上升。\n\n是否确认切换？',
      auto: 'ℹ️ 切换为【智能自动 (Auto)】将根据连网状态智能休眠蓝牙广播以降低待机功耗。\n\n是否确认切换？'
    };
    const confirmMsg = warnings[mode] || `确认切换无线通信工作模式为【${mode}】吗？`;
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await window.DeviceManager.setWirelessMode(mode);
      document.querySelectorAll('.wireless-opt-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.add('tonal');
      });
      const activeBtn = document.getElementById(`opt-${mode}`);
      if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.classList.remove('tonal');
      }
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
    if (!confirm('⚠️ 警告：恢复出厂设置将同时彻底清空设备的 NVS 参数配置与 Storage 效果库预设分区，并重启进入出厂初始态，确认继续吗？')) return;
    try {
      await window.DeviceManager.factoryReset();
      this.showToast('⚡ 已恢复出厂设置 (已清空 NVS 与 Storage 分区)，设备正在重启...', 'warning', 6000);
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
