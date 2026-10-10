/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Unified Device Manager (Dual-Mode: WebBLE 5.0 + Local LAN HTTP REST API)
 * Remote Hardware Controller, 2bpp BIN Raw Import/Export & Air Provisioning
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

const BLE_SERVICE_UUID_128 = '000000ff-0000-1000-8000-00805f9b34fb';
const BLE_SERVICE_UUID_16  = 0x00FF;
const BLE_CHAR_RX_128      = '0000ff01-0000-1000-8000-00805f9b34fb';
const BLE_CHAR_RX_16       = 0xFF01; // Write to ESP32
const BLE_CHAR_TX_128      = '0000ff02-0000-1000-8000-00805f9b34fb';
const BLE_CHAR_TX_16       = 0xFF02; // Notifications from ESP32
const FRAMEBUFFER_SIZE     = 105984; // 768 * 552 * 2 / 8 = 105,984 Bytes

const DeviceManager = {
  // State
  bleDevice: null,
  rxChar: null,
  txChar: null,
  isBleConnected: false,

  lanIp: localStorage.getItem('epd_lan_ip') || '',
  isLanConnected: false,
  activeMode: 'auto', // 'ble' | 'lan' | 'auto'

  onStatusChange: null,
  onProgress: null,
  _onBleDisconnectedBound: null,

  /* ================= Initialization & URL Query Auto-Binding ================= */
  init() {
    const params = new URLSearchParams(window.location.search);
    const queryIp = (params.get('ip') || params.get('host') || '').trim();

    if (queryIp) {
      this.lanIp = queryIp;
      this.isLanConnected = false; // Strictly do not assume connected before verification!
      localStorage.setItem('epd_lan_ip', queryIp);
    } else if (!this.lanIp) {
      this.lanIp = localStorage.getItem('epd_lan_ip') || '';
    }

    const updateLanBar = () => {
      const curIp = this.lanIp;
      const lanInput = document.getElementById('lanIpInput') || document.getElementById('lanModalIpInput');
      if (lanInput && curIp) {
        lanInput.value = curIp;
      }
      const netLanStatus = document.getElementById('netLanStatus') || document.getElementById('lanStatusText');
      if (netLanStatus) {
        netLanStatus.textContent = this.isLanConnected ? `局域网: ${curIp}` : (curIp ? `局域网: ${curIp} (待验证)` : '未连接局域网');
      }
      const lanConsoleLink = document.getElementById('lanConsoleLink');
      if (lanConsoleLink) {
        if (curIp) {
          lanConsoleLink.style.display = 'inline-block';
          lanConsoleLink.href = `http://${curIp}/`;
        } else {
          lanConsoleLink.style.display = 'none';
        }
      }
      if (typeof UI !== 'undefined' && UI.initLanStatus) {
        UI.initLanStatus();
      }
    };

    updateLanBar();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateLanBar);
    }

    if (queryIp) {
      // Test physical connection immediately
      this.testConnection().then((connected) => {
        updateLanBar();
        if (connected) {
          if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast(`🎉 成功连通局域网设备: ${queryIp}`, 'success', 3500);
          }
          if (typeof PresetHub !== 'undefined' && PresetHub.syncWithDevice) {
            PresetHub.syncWithDevice().then(() => {
              if (typeof App !== 'undefined' && App.renderPresetsUI) {
                App.renderPresetsUI();
              }
            });
          }
        } else {
          if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast(`⚠️ 局域网设备 ${queryIp} 未响应，若在 HTTPS 环境请使用蓝牙直连`, 'warning', 4000);
          }
        }
      });
    } else if (this.lanIp) {
      const lanInput = document.getElementById('lanIpInput');
      if (lanInput && !lanInput.value) {
        lanInput.value = this.lanIp;
      }
      this.testConnection().then(() => updateLanBar());
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const lanInput = document.getElementById('lanIpInput');
        if (lanInput && this.lanIp) {
          lanInput.value = this.lanIp;
        }
      });
    }
  },

  getConnectionStatus() {
    if (this.isBleConnected && this.bleDevice?.gatt?.connected) {
      return { type: 'ble', label: '蓝牙已连接 · WebBLE', name: this.bleDevice?.name || 'EPD-Display' };
    }
    if (this.isLanConnected && this.lanIp) {
      return { type: 'lan', label: `局域网: ${this.lanIp} [打开控制台]`, name: this.lanIp };
    }
    return { type: 'none', label: '未连接任何硬件设备', name: '' };
  },

  /* ================= Web Bluetooth (WebBLE Dual-Mode 5.0) ================= */
  async connectBle() {
    if (!navigator.bluetooth) {
      if (!window.isSecureContext) {
        throw new Error('⚠️ Web Bluetooth API 仅允许在 HTTPS 安全环境下运行！请使用 Cloudflare Pages 或在本地添加安全源例外。');
      }
      throw new Error('当前浏览器不支持 Web Bluetooth API，推荐使用支持 WebBLE 的 Chrome 或 Edge 浏览器！');
    }

    try {
      console.log('[BLE] Requesting Bluetooth Device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BLE_SERVICE_UUID_16] },
          { services: [BLE_SERVICE_UUID_128] },
          { namePrefix: 'EPD' },
          { namePrefix: 'SmartEPD' },
          { namePrefix: 'InkBadge' },
          { namePrefix: '3.98' }
        ],
        optionalServices: [BLE_SERVICE_UUID_16, BLE_SERVICE_UUID_128, 0x180A]
      });

      if (!device) {
        throw new Error('未选择任何蓝牙设备');
      }

      device.removeEventListener('gattserverdisconnected', this._onBleDisconnectedBound || (() => {}));
      this._onBleDisconnectedBound = () => {
        console.warn('[BLE] Device disconnected');
        this.isBleConnected = false;
        this.bleDevice = null;
        this.rxChar = null;
        this.txChar = null;
        if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
        this.updateAirProvBleStatus();
      };
      device.addEventListener('gattserverdisconnected', this._onBleDisconnectedBound);

      console.log('[BLE] Connecting to GATT Server with retry...');
      let server = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          server = await device.gatt.connect();
          if (server && server.connected) break;
        } catch (connErr) {
          console.warn(`[BLE] Connect attempt ${attempt} failed:`, connErr);
          if (attempt === 3) throw connErr;
          await new Promise(r => setTimeout(r, 250));
        }
      }

      if (!server || !server.connected) {
        throw new Error('GATT 服务连接未建立或已断开');
      }

      // Crucial: 200ms settling delay for Windows / Android Bluetooth PHY & MTU negotiation!
      await new Promise(r => setTimeout(r, 200));

      console.log('[BLE] Discovering 0x00FF Service...');
      let service = null;
      try {
        service = await server.getPrimaryService(BLE_SERVICE_UUID_128);
      } catch (e1) {
        try {
          service = await server.getPrimaryService(BLE_SERVICE_UUID_16);
        } catch (e2) {
          throw new Error('无法获取 0x00FF GATT 服务: ' + (e1.message || e2.message));
        }
      }

      console.log('[BLE] Discovering Characteristics RX/TX...');
      try {
        this.rxChar = await service.getCharacteristic(BLE_CHAR_RX_128);
      } catch {
        this.rxChar = await service.getCharacteristic(BLE_CHAR_RX_16);
      }

      try {
        this.txChar = await service.getCharacteristic(BLE_CHAR_TX_128);
      } catch {
        try {
          this.txChar = await service.getCharacteristic(BLE_CHAR_TX_16);
        } catch (txErr) {
          console.warn('[BLE] TX characteristic not found:', txErr);
        }
      }

      if (this.txChar) {
        try {
          await this.txChar.startNotifications();
          this.txChar.addEventListener('characteristicvaluechanged', (e) => {
            const text = new TextDecoder().decode(e.target.value);
            console.log('[BLE TX Notification]:', text);
            if (text === 'REFRESH_TRIGGERED') {
              if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('🎉 墨水屏硬件已收到全部点阵，正在执行物理全刷！', 'success', 5000);
              }
            }
          });
        } catch (notifErr) {
          console.warn('[BLE] startNotifications skipped:', notifErr);
        }
      }

      this.bleDevice = device;
      this.isBleConnected = true;
      if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
      this.updateAirProvBleStatus();
      return device.name || 'EPD-Smart-Display';
    } catch (err) {
      this.isBleConnected = false;
      this.bleDevice = null;
      this.rxChar = null;
      this.txChar = null;
      this.updateAirProvBleStatus();
      throw err;
    }
  },

  async disconnectBle() {
    if (this.bleDevice && this.bleDevice.gatt && this.bleDevice.gatt.connected) {
      this.bleDevice.gatt.disconnect();
    }
    this.isBleConnected = false;
    this.bleDevice = null;
    this.rxChar = null;
    this.txChar = null;
    if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
    this.updateAirProvBleStatus();
  },

  /* ================= Local LAN HTTP REST API ================= */
  setLanIp(ip) {
    this.lanIp = (ip || '').trim();
    localStorage.setItem('epd_lan_ip', this.lanIp);
    return this.testLanConnection();
  },

  connectLan(ip) {
    if (ip) return this.setLanIp(ip);
    return this.testLanConnection();
  },

  testConnection() {
    return this.testLanConnection();
  },

  async testLanConnection() {
    if (!this.lanIp) {
      this.isLanConnected = false;
      if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
      return false;
    }

    try {
      const url = `http://${this.lanIp}/api/system/status`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        this.isLanConnected = true;
        if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
        return true;
      }
    } catch (e) {
      console.warn('[LAN] Connection test failed:', e.message);
    }
    this.isLanConnected = false;
    if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
    return false;
  },

  /* ================= Unified 2bpp Push & Stream ================= */
  async pushBitmap2bpp(packed2bpp, progressCb) {
    if (!packed2bpp || packed2bpp.length !== FRAMEBUFFER_SIZE) {
      throw new Error(`点阵数据大小不合法：预期 ${FRAMEBUFFER_SIZE} 字节，实际 ${packed2bpp?.length || 0} 字节`);
    }

    if (this.isBleConnected && this.bleDevice?.gatt?.connected && this.rxChar) {
      return await this._pushBleBitmap(packed2bpp, progressCb);
    } else if (this.isLanConnected && this.lanIp) {
      return await this._pushLanBitmap(packed2bpp, progressCb);
    } else {
      throw new Error('未连接任何硬件设备！请点击顶部“连接蓝牙”直接无线推送，或在“局域网”中输入设备 IP 并测试连通。');
    }
  },

  async _pushBleBitmap(packed2bpp, progressCb) {
    if (!this.isBleConnected || !this.bleDevice?.gatt?.connected || !this.rxChar) {
      throw new Error('蓝牙已断开！请点击顶部“连接蓝牙”重新连接。');
    }
    console.log(`[BLE] Pushing ${packed2bpp.length} bytes over BLE...`);
    // Send status ping to ensure firmware stream offset resets to 0
    try {
      const resetCmd = new TextEncoder().encode('status');
      await this.rxChar.writeValueWithoutResponse(resetCmd);
      await new Promise(r => setTimeout(r, 60));
    } catch (e) {
      console.warn('[BLE] Stream offset reset ping warning:', e);
    }

    // Send chunks (240 bytes MTU payload)
    const chunkSize = 240;
    const totalChunks = Math.ceil(packed2bpp.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      if (!this.bleDevice?.gatt?.connected) {
        throw new Error('蓝牙在推送过程中意外断开！');
      }
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, packed2bpp.length);
      const chunk = packed2bpp.slice(start, end);

      try {
        await this.rxChar.writeValueWithoutResponse(chunk);
      } catch (wrErr) {
        await this.rxChar.writeValue(chunk);
      }
      if (progressCb) {
        progressCb(Math.round(((i + 1) / totalChunks) * 100));
      }
      // Pacing delay to prevent BLE controller FIFO overflow
      if (i % 4 === 0) {
        await new Promise(r => setTimeout(r, 10));
      }
    }

    console.log('[BLE] Push completed! Firmware will refresh display upon reaching buffer size.');
    if (progressCb) progressCb(100);
    return { status: 'ok', mode: 'ble', message: '已成功向墨水屏推送 105KB 点阵，硬件正在刷新！' };
  },

  async _pushLanBitmap(packed2bpp, progressCb) {
    if (!this.lanIp) {
      throw new Error('未设置局域网设备 IP');
    }
    console.log(`[LAN] Pushing ${packed2bpp.length} bytes to http://${this.lanIp}/api/display/raw ...`);
    if (progressCb) progressCb(15);

    const url = `http://${this.lanIp}/api/display/raw`;
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: packed2bpp
      });
    } catch (netErr) {
      this.isLanConnected = false;
      if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
      throw new Error(`局域网推送连接失败: ${netErr.message} (若在 HTTPS 页面请使用蓝牙，或在浏览器设置中放行 HTTP 混合内容)`);
    }

    if (!res.ok) {
      throw new Error(`设备返回 HTTP 错误 (${res.status}): ${res.statusText}`);
    }
    const data = await res.json().catch(() => ({ status: 'ok' }));
    if (data.status === 'error') {
      throw new Error(`设备处理点阵失败: ${data.message || '未知错误'}`);
    }
    if (progressCb) progressCb(100);
    console.log('[LAN] Push completed successfully!');
    return data;
  },

  /* ================= 2bpp BIN Raw File Export & Import ================= */
  /**
   * Export canvas to 2bpp raw binary file (exactly 105,984 bytes)
   * Triggers download: epd_398_bwry_<timestamp>.bin
   * @param {HTMLCanvasElement} [canvas]
   * @returns {Uint8Array}
   */
  exportCanvasToBin(canvas) {
    const targetCanvas = canvas || (typeof ScenesStudio !== 'undefined' && ScenesStudio.getCanvas ? ScenesStudio.getCanvas() : null) || document.querySelector('canvas.preview-canvas');
    if (!targetCanvas) {
      throw new Error('未找到可导出的画布对象');
    }

    let packed;
    if (typeof BWRY !== 'undefined' && typeof BWRY.ditherCanvasTo2bpp === 'function') {
      packed = BWRY.ditherCanvasTo2bpp(targetCanvas, 'floyd');
    } else {
      throw new Error('BWRY 量化引擎未加载');
    }

    if (packed.length !== FRAMEBUFFER_SIZE) {
      throw new Error(`导出的点阵大小异常: 预期 ${FRAMEBUFFER_SIZE} 字节，实际为 ${packed.length} 字节`);
    }

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `epd_398_bwry_${ts}.bin`;

    const blob = new Blob([packed], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`已成功导出 105,984 字节原始点阵文件: ${filename}`, 'success');
    }

    return packed;
  },

  /**
   * Import and stream 2bpp raw binary file to hardware (must be exactly 105,984 bytes)
   * @param {File|Blob} file
   * @param {Function} [progressCb]
   */
  async pushBinFile(file, progressCb) {
    if (!file) throw new Error('未选择任何文件');

    if (file.size !== FRAMEBUFFER_SIZE) {
      const err = `BIN 文件大小不合法：必须严格等于 105,984 字节 (当前文件为 ${file.size} 字节)`;
      if (typeof UI !== 'undefined' && UI.showToast) UI.showToast(err, 'error', 5000);
      throw new Error(err);
    }

    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`正在读取并推送 ${file.name || 'RAW BIN'} (105,984 字节)...`, 'info');
    }

    const buffer = await file.arrayBuffer();
    const packed = new Uint8Array(buffer);

    // If an active preview canvas exists, render dot matrix preview
    try {
      const previewCanvas = document.getElementById('scenesPreviewCanvas') || document.querySelector('canvas.preview-canvas');
      if (previewCanvas && typeof BWRY !== 'undefined' && typeof BWRY.render2bppToCanvas === 'function') {
        BWRY.render2bppToCanvas(previewCanvas, packed);
      }
    } catch (e) {
      console.warn('[BIN Import] Canvas preview failed:', e);
    }

    const result = await this.pushBitmap2bpp(packed, progressCb);
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`🎉 成功导入并推送原始 .BIN 固件点阵至墨水屏！`, 'success', 4000);
    }
    return result;
  },

  /* ================= Remote Hardware Control Commands ================= */
  /**
   * 1. 16s physical waveform full refresh
   */
  async sendRefresh() {
    if (this.isBleConnected && this.rxChar) {
      const cmd = new TextEncoder().encode('refresh');
      await this.rxChar.writeValueWithoutResponse(cmd);
      return { status: 'ok', message: '已触发 16s 物理全刷' };
    } else if (this.isLanConnected && this.lanIp) {
      try {
        const res = await fetch(`http://${this.lanIp}/api/display/refresh`, { method: 'POST' });
        if (res.ok) return await res.json().catch(() => ({ status: 'ok' }));
      } catch (e) {}
      const fallback = await fetch(`http://${this.lanIp}/api/refresh`, { method: 'POST' });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    } else {
      throw new Error('未连接硬件设备 (请先在顶部连接蓝牙或配置局域网 IP)');
    }
  },

  /**
   * 2. Clear screen to 100% pure white
   */
  async sendClearWhite() {
    if (this.isBleConnected && this.rxChar) {
      const cmd = new TextEncoder().encode('clear:white');
      await this.rxChar.writeValueWithoutResponse(cmd);
      return { status: 'ok', message: '全白清屏指令已发送' };
    } else if (this.isLanConnected && this.lanIp) {
      try {
        const res = await fetch(`http://${this.lanIp}/api/display/clear`, { method: 'POST' });
        if (res.ok) return await res.json().catch(() => ({ status: 'ok' }));
      } catch (e) {}
      const fallback = await fetch(`http://${this.lanIp}/api/clear`, { method: 'POST' });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    } else {
      throw new Error('未连接硬件设备 (请先在顶部连接蓝牙或配置局域网 IP)');
    }
  },

  /**
   * 3. Clear screen to 100% pure black (0b00 = 0x00)
   */
  async sendClearBlack() {
    const buf = new Uint8Array(FRAMEBUFFER_SIZE); // filled with 0x00
    return await this.pushBitmap2bpp(buf);
  },

  /**
   * 4. Clear screen to 100% pure red (0b11 = 0xFF)
   */
  async sendClearRed() {
    const buf = new Uint8Array(FRAMEBUFFER_SIZE);
    buf.fill(0xFF); // 0b11111111 = 4 red pixels per byte
    return await this.pushBitmap2bpp(buf);
  },

  /**
   * Quick scene switcher (12+ built-in MCU scenes)
   * @param {string} modeName
   */
  async sendMode(modeName) {
    if (!modeName) throw new Error('未指定模式名称');
    const mode = modeName.trim();

    if (this.isBleConnected && this.rxChar) {
      const cmd = new TextEncoder().encode(`mode:${mode}`);
      await this.rxChar.writeValueWithoutResponse(cmd);
      return { status: 'ok', mode };
    } else if (this.isLanConnected && this.lanIp) {
      if (mode === 'battery_low' || mode === 'low_battery') {
        const res = await fetch(`http://${this.lanIp}/api/display/test_battery_low`, { method: 'POST' });
        return await res.json().catch(() => ({ status: 'ok', mode }));
      }
      const res = await fetch(`http://${this.lanIp}/api/display/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      return await res.json().catch(() => ({ status: 'ok', mode }));
    } else {
      throw new Error('未连接硬件设备 (请先在顶部连接蓝牙或配置局域网 IP)');
    }
  },

  switchMode(mode) {
    return this.sendMode(mode);
  },

  /**
   * 4 RF Mode Switchers: 'auto', 'ble_only', 'wifi_only', 'dual'
   * @param {string} mode
   */
  async setWirelessMode(mode) {
    if (!mode) throw new Error('未指定射频模式');
    let m = mode.trim();
    if (m === 'ble') m = 'ble_only';
    if (m === 'wifi') m = 'wifi_only';

    if (this.isBleConnected && this.rxChar) {
      const cmd = new TextEncoder().encode(`wireless:${m}`);
      await this.rxChar.writeValueWithoutResponse(cmd);
      return { status: 'ok', mode: m };
    } else if (this.isLanConnected && this.lanIp) {
      try {
        const res = await fetch(`http://${this.lanIp}/api/wireless/mode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: m })
        });
        if (res.ok) return await res.json().catch(() => ({ status: 'ok', mode: m }));
      } catch (e) {}
      const fallback = await fetch(`http://${this.lanIp}/api/wireless_mode?mode=${encodeURIComponent(m)}`, { method: 'POST' });
      return await fallback.json().catch(() => ({ status: 'ok', mode: m }));
    } else {
      throw new Error('未连接硬件设备 (请先在顶部连接蓝牙或配置局域网 IP)');
    }
  },

  async sendRestart() {
    if (this.isBleConnected && this.rxChar) {
      const cmd = new TextEncoder().encode('reboot');
      await this.rxChar.writeValueWithoutResponse(cmd);
      return { status: 'ok' };
    } else if (this.isLanConnected && this.lanIp) {
      try {
        const res = await fetch(`http://${this.lanIp}/api/system/reboot`, { method: 'POST' });
        if (res.ok) return await res.json().catch(() => ({ status: 'ok' }));
      } catch (e) {}
      const fallback = await fetch(`http://${this.lanIp}/api/restart`, { method: 'POST' });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    } else {
      throw new Error('未连接设备');
    }
  },

  sendReboot() {
    return this.sendRestart();
  },

  /* ================= Bluetooth Air Provisioning ================= */
  openAirProvision() {
    this.updateAirProvBleStatus();
    if (typeof UI !== 'undefined' && UI.openModal) {
      UI.openModal('airProvModal');
    }
  },

  updateAirProvBleStatus() {
    const statusEl = document.getElementById('airProvBleStatus');
    const connectBtn = document.getElementById('airProvConnectBleBtn');
    if (!statusEl) return;

    if (this.isBleConnected) {
      statusEl.innerHTML = `<span style="color:#4caf50;">● 蓝牙已连接: <strong>${this.bleDevice?.name || 'EPD-Display'}</strong></span>`;
      if (connectBtn) connectBtn.style.display = 'none';
    } else {
      statusEl.innerHTML = `<span style="color:#e57373;">○ 未连接蓝牙设备</span>`;
      if (connectBtn) connectBtn.style.display = 'inline-flex';
    }
  },

  async scanSurroundingWifi() {
    const listEl = document.getElementById('airProvScanList');
    if (listEl) {
      listEl.style.display = 'block';
      listEl.innerHTML = '<div style="font-size:12px; color:var(--md-sys-color-outline); padding:6px;">正在扫描周边 2.4GHz Wi-Fi...</div>';
    }

    try {
      let apList = [];
      if (this.isLanConnected && this.lanIp) {
        apList = await this.scanWifi();
      }

      if (listEl) {
        if (Array.isArray(apList) && apList.length > 0) {
          listEl.innerHTML = apList.map(ap => {
            const ssid = ap.ssid || ap;
            const rssi = ap.rssi ? ` (${ap.rssi} dBm)` : '';
            return `<div style="padding:4px 8px; font-size:12px; cursor:pointer; border-radius:4px; margin-bottom:2px;" class="wifi-item" onclick="document.getElementById('airProvSsid').value='${ssid}'; this.parentElement.style.display='none';">📶 <strong>${ssid}</strong>${rssi}</div>`;
          }).join('');
        } else {
          listEl.innerHTML = '<div style="font-size:12px; color:var(--md-sys-color-outline); padding:6px;">未扫描到广播网络，请在下方直接输入 SSID。</div>';
        }
      }
    } catch (e) {
      if (listEl) {
        listEl.innerHTML = '<div style="font-size:12px; color:var(--md-sys-color-outline); padding:6px;">扫描不可用，请直接手动输入 Wi-Fi 名称。</div>';
      }
    }
  },

  async sendAirProvision(ssid, pass) {
    if (!ssid || !ssid.trim()) {
      throw new Error('请输入有效的 Wi-Fi 名称 (SSID)');
    }
    const cleanSsid = ssid.trim();
    const cleanPass = (pass || '').trim();

    if (this.isBleConnected && this.rxChar) {
      console.log(`[BLE AirProv] Sending credentials for '${cleanSsid}'...`);
      const payload = JSON.stringify({
        cmd: 'wifi_setup',
        ssid: cleanSsid,
        pass: cleanPass
      });
      const enc = new TextEncoder().encode(payload);
      await this.rxChar.writeValueWithoutResponse(enc);

      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(`已通过 WebBLE 向设备下发 Wi-Fi [${cleanSsid}]，设备正在重启连网...`, 'success', 5000);
      }
      if (typeof UI !== 'undefined' && UI.closeModal) {
        UI.closeModal('airProvModal');
      }
      return { status: 'ok', method: 'ble' };
    } else if (this.isLanConnected && this.lanIp) {
      console.log(`[LAN AirProv] Configuring credentials for '${cleanSsid}'...`);
      await this.configWifi(cleanSsid, cleanPass);

      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(`已向设备保存 Wi-Fi [${cleanSsid}]，设备正在重连...`, 'success', 5000);
      }
      if (typeof UI !== 'undefined' && UI.closeModal) {
        UI.closeModal('airProvModal');
      }
      return { status: 'ok', method: 'lan' };
    } else {
      throw new Error('未连接任何蓝牙或局域网设备，无法下发配网信息！请先连接设备。');
    }
  },

  submitAirProvision() {
    const ssid = document.getElementById('airProvSsid')?.value || '';
    const pass = document.getElementById('airProvPass')?.value || '';
    this.sendAirProvision(ssid, pass).catch(err => {
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(`配网失败: ${err.message}`, 'error', 4000);
      }
    });
  },

  /* ================= Hardware Text & Presets Actions ================= */
  async pushText(text, x = 20, y = 100, size = 32, color = 'black') {
    if (this.isLanConnected && this.lanIp) {
      await fetch(`http://${this.lanIp}/api/display/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, x, y, size, color })
      });
    } else if (this.isBleConnected && this.rxChar) {
      const cmd = new TextEncoder().encode(`TEXT:${x},${y},${size},${color}:${text}`);
      await this.rxChar.writeValueWithoutResponse(cmd);
    }
  },

  async fetchStatus() {
    if (this.isLanConnected && this.lanIp) {
      const res = await fetch(`http://${this.lanIp}/api/system/status`);
      return res.json();
    }
    return null;
  },

  async fetchPresets() {
    if (this.isLanConnected && this.lanIp) {
      const res = await fetch(`http://${this.lanIp}/api/presets`);
      return res.json();
    }
    return null;
  },

  async savePresetToDevice(meta, rawBitmap) {
    if (this.isLanConnected && this.lanIp) {
      const res = await fetch(`http://${this.lanIp}/api/presets/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta, raw_bitmap: rawBitmap ? Array.from(rawBitmap) : null })
      });
      return res.json();
    }
    return null;
  },

  async deletePresetsFromDevice(ids) {
    if (this.isLanConnected && this.lanIp) {
      const res = await fetch(`http://${this.lanIp}/api/presets/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      return res.json();
    }
    return null;
  },

  async scanWifi() {
    if (!this.lanIp) throw new Error('未连接局域网设备');
    const res = await fetch(`http://${this.lanIp}/api/wifi/scan`, { method: 'POST' });
    return await res.json();
  },

  async configWifi(ssid, pass) {
    if (!this.lanIp) throw new Error('未连接局域网设备');
    try {
      const res = await fetch(`http://${this.lanIp}/api/wifi/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, pass })
      });
      if (res.ok) return await res.json().catch(() => ({ status: 'ok' }));
    } catch (e) {}
    const fallback = await fetch(`http://${this.lanIp}/api/wifi/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssid, pass })
    });
    return await fallback.json().catch(() => ({ status: 'ok' }));
  },

  /* ================= Hardware Diagnostics & MQTT REST Methods ================= */
  async fetchSystemDiag() {
    if (!this.lanIp) throw new Error('未设置局域网设备 IP');
    const res = await fetch(`http://${this.lanIp}/api/system/status`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  },

  async fetchConfig() {
    if (!this.lanIp) throw new Error('未设置局域网设备 IP');
    const res = await fetch(`http://${this.lanIp}/api/config`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  },

  async saveConfig(configData) {
    if (!this.lanIp) throw new Error('未设置局域网设备 IP');
    const res = await fetch(`http://${this.lanIp}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  },

  async toggleScreenDebug() {
    if (!this.lanIp) throw new Error('未设置局域网设备 IP');
    const res = await fetch(`http://${this.lanIp}/api/system/debug`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  },

  async reboot() {
    if (!this.lanIp) throw new Error('未设置局域网设备 IP');
    const res = await fetch(`http://${this.lanIp}/api/system/reboot`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  },

  async factoryReset() {
    if (!this.lanIp) throw new Error('未设置局域网设备 IP');
    const res = await fetch(`http://${this.lanIp}/api/system/reset`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  },

  async toggleBleBroadcast(enabled) {
    if (!this.lanIp) throw new Error('未设置局域网设备 IP');
    const res = await fetch(`http://${this.lanIp}/api/ble/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  },

  async disconnectBleClient(clientId) {
    if (!this.lanIp) throw new Error('未设置局域网设备 IP');
    const res = await fetch(`http://${this.lanIp}/api/ble/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: clientId })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  },

  async setWirelessMode(mode) {
    if (this.isLanConnected && this.lanIp) {
      const res = await fetch(`http://${this.lanIp}/api/wireless/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    } else if (this.isBleConnected && this.rxChar) {
      const cmd = new TextEncoder().encode(`wireless:${mode}`);
      await this.rxChar.writeValueWithoutResponse(cmd);
      return { status: 'ok', message: `已通过蓝牙发送模式指令: ${mode}` };
    }
    throw new Error('未连接任何硬件设备');
  }
};

window.DeviceManager = DeviceManager;
