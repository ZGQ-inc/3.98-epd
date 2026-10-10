/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Unified Device Manager (Dual-Mode: WebBLE 5.0 + Local LAN HTTP REST API)
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

const BLE_SERVICE_UUID = 0x00FF;
const BLE_CHAR_RX_UUID = 0xFF01; // Write to ESP32
const BLE_CHAR_TX_UUID = 0xFF02; // Notifications from ESP32

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

  init() {
    const params = new URLSearchParams(window.location.search);
    const queryIp = (params.get('ip') || params.get('host') || '').trim();
    if (queryIp) {
      this.lanIp = queryIp;
      localStorage.setItem('epd_lan_ip', queryIp);
      const lanInput = document.getElementById('lanIpInput');
      if (lanInput) {
        lanInput.value = queryIp;
      }
      const showBindToast = () => {
        if (typeof UI !== 'undefined' && UI.showToast) {
          UI.showToast(`已通过链接自动绑定设备: ${queryIp}`, 'success');
        } else {
          setTimeout(() => {
            if (typeof UI !== 'undefined' && UI.showToast) {
              UI.showToast(`已通过链接自动绑定设备: ${queryIp}`, 'success');
            }
          }, 150);
        }
      };
      showBindToast();

      this.testConnection().then((connected) => {
        if (connected && typeof PresetHub !== 'undefined' && PresetHub.syncWithDevice) {
          PresetHub.syncWithDevice();
        }
      });
    } else if (this.lanIp) {
      const lanInput = document.getElementById('lanIpInput');
      if (lanInput && !lanInput.value) {
        lanInput.value = this.lanIp;
      }
      this.testConnection();
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
    if (this.isBleConnected) return { type: 'ble', label: '蓝牙已连接 · WebBLE', name: this.bleDevice?.name || 'EPD-Display' };
    if (this.isLanConnected) return { type: 'lan', label: '局域网已连接 · REST API', name: this.lanIp };
    return { type: 'none', label: '未连接任何硬件设备', name: '' };
  },

  /* ================= Web Bluetooth (WebBLE) ================= */
  async connectBle() {
    if (!navigator.bluetooth) {
      throw new Error('当前浏览器不支持 Web Bluetooth API，请使用 Chrome / Edge 并在 HTTPS 协议下打开！');
    }

    try {
      console.log('[BLE] Requesting Bluetooth Device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BLE_SERVICE_UUID] },
          { namePrefix: 'EPD' }
        ],
        optionalServices: [BLE_SERVICE_UUID]
      });

      device.addEventListener('gattserverdisconnected', () => {
        console.warn('[BLE] Device disconnected');
        this.isBleConnected = false;
        this.bleDevice = null;
        this.rxChar = null;
        this.txChar = null;
        if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
      });

      console.log('[BLE] Connecting to GATT Server...');
      const server = await device.gatt.connect();

      console.log('[BLE] Getting Service 0x00FF...');
      const service = await server.getPrimaryService(BLE_SERVICE_UUID);

      console.log('[BLE] Getting Characteristics RX/TX...');
      this.rxChar = await service.getCharacteristic(BLE_CHAR_RX_UUID);
      this.txChar = await service.getCharacteristic(BLE_CHAR_TX_UUID);

      await this.txChar.startNotifications();
      this.txChar.addEventListener('characteristicvaluechanged', (e) => {
        const text = new TextDecoder().decode(e.target.value);
        console.log('[BLE TX Notification]:', text);
      });

      this.bleDevice = device;
      this.isBleConnected = true;
      if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
      return device.name || 'EPD-Smart-Display';
    } catch (err) {
      this.isBleConnected = false;
      throw err;
    }
  },

  async disconnectBle() {
    if (this.bleDevice && this.bleDevice.gatt.connected) {
      this.bleDevice.gatt.disconnect();
    }
    this.isBleConnected = false;
    this.bleDevice = null;
    this.rxChar = null;
    this.txChar = null;
    if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
  },

  /* ================= Local LAN HTTP REST API ================= */
  setLanIp(ip) {
    this.lanIp = ip.trim();
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

  /* ================= Unified Push & Control Actions ================= */
  async pushBitmap2bpp(packed2bpp, progressCb) {
    if (this.isBleConnected && this.rxChar) {
      return this._pushBleBitmap(packed2bpp, progressCb);
    } else if (this.isLanConnected && this.lanIp) {
      return this._pushLanBitmap(packed2bpp, progressCb);
    } else {
      throw new Error('未连接设备！请先点击顶部“连接蓝牙”或填入设备局域网 IP。');
    }
  },

  async _pushBleBitmap(packed2bpp, progressCb) {
    console.log(`[BLE] Pushing ${packed2bpp.length} bytes over BLE...`);
    // Send START command
    const startCmd = new TextEncoder().encode(`RAW:START:${packed2bpp.length}`);
    await this.rxChar.writeValueWithoutResponse(startCmd);
    await new Promise(r => setTimeout(r, 50));

    // Send chunks (240 bytes MTU payload)
    const chunkSize = 240;
    const totalChunks = Math.ceil(packed2bpp.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, packed2bpp.length);
      const chunk = packed2bpp.slice(start, end);

      await this.rxChar.writeValueWithoutResponse(chunk);
      if (progressCb) {
        progressCb(Math.round(((i + 1) / totalChunks) * 100));
      }
      // Small pace delay to prevent BLE buffer congestion
      if (i % 5 === 0) {
        await new Promise(r => setTimeout(r, 15));
      }
    }

    // Send COMMIT command
    const commitCmd = new TextEncoder().encode(`RAW:COMMIT`);
    await this.rxChar.writeValueWithoutResponse(commitCmd);
    console.log('[BLE] Push completed!');
  },

  async _pushLanBitmap(packed2bpp, progressCb) {
    console.log(`[LAN] Pushing ${packed2bpp.length} bytes to http://${this.lanIp}/api/display/raw ...`);
    if (progressCb) progressCb(20);

    const url = `http://${this.lanIp}/api/display/raw`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: packed2bpp
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    if (progressCb) progressCb(100);
    console.log('[LAN] Push completed!');
  },

  async switchMode(mode) {
    if (this.isBleConnected && this.rxChar) {
      const cmd = new TextEncoder().encode(`MODE:${mode}`);
      await this.rxChar.writeValueWithoutResponse(cmd);
    } else if (this.isLanConnected && this.lanIp) {
      await fetch(`http://${this.lanIp}/api/display/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
    } else {
      throw new Error('未连接设备');
    }
  },

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

  /* ================= Remote Hardware Control Commands ================= */
  async sendRefresh() {
    if (!this.lanIp) throw new Error('未连接局域网设备');
    try {
      const res = await fetch(`http://${this.lanIp}/api/refresh`, { method: 'POST' });
      if (res.ok) return await res.json().catch(() => ({ status: 'ok' }));
      const fallback = await fetch(`http://${this.lanIp}/api/display/refresh`, { method: 'POST' });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    } catch (e) {
      const fallback = await fetch(`http://${this.lanIp}/api/display/refresh`, { method: 'POST' });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    }
  },

  async sendClearWhite() {
    if (!this.lanIp) throw new Error('未连接局域网设备');
    try {
      const res = await fetch(`http://${this.lanIp}/api/clear`, { method: 'POST' });
      if (res.ok) return await res.json().catch(() => ({ status: 'ok' }));
      const fallback = await fetch(`http://${this.lanIp}/api/display/clear`, { method: 'POST' });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    } catch (e) {
      const fallback = await fetch(`http://${this.lanIp}/api/display/clear`, { method: 'POST' });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    }
  },

  async sendRestart() {
    if (!this.lanIp) throw new Error('未连接局域网设备');
    try {
      const res = await fetch(`http://${this.lanIp}/api/restart`, { method: 'POST' });
      if (res.ok) return await res.json().catch(() => ({ status: 'ok' }));
      const fallback = await fetch(`http://${this.lanIp}/api/system/reboot`, { method: 'POST' });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    } catch (e) {
      const fallback = await fetch(`http://${this.lanIp}/api/system/reboot`, { method: 'POST' });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    }
  },

  sendReboot() {
    return this.sendRestart();
  },

  async setWirelessMode(mode) {
    if (!this.lanIp) throw new Error('未连接局域网设备');
    try {
      const res = await fetch(`http://${this.lanIp}/api/wireless_mode?mode=${encodeURIComponent(mode)}`, { method: 'POST' });
      if (res.ok) return await res.json().catch(() => ({ status: 'ok' }));
      const fallback = await fetch(`http://${this.lanIp}/api/wireless/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    } catch (e) {
      const fallback = await fetch(`http://${this.lanIp}/api/wireless/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    }
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
      const fallback = await fetch(`http://${this.lanIp}/api/wifi/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, pass })
      });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    } catch (e) {
      const fallback = await fetch(`http://${this.lanIp}/api/wifi/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, pass })
      });
      return await fallback.json().catch(() => ({ status: 'ok' }));
    }
  }
};

window.DeviceManager = DeviceManager;

