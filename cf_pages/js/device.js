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

  lanIp: (() => {
    const s = (localStorage.getItem('epd_lan_ip') || '').trim();
    return s === '192.168.10.203' ? '' : s;
  })(),
  isLanConnected: false,
  activeMode: 'auto', // 'ble' | 'lan' | 'auto'

  onStatusChange: null,
  onProgress: null,
  _onBleDisconnectedBound: null,

  /* ================= Initialization & URL Query Auto-Binding ================= */
  init() {
    if (localStorage.getItem('epd_lan_ip') === '192.168.10.203') {
      localStorage.removeItem('epd_lan_ip');
      this.lanIp = '';
    }

    const params = new URLSearchParams(window.location.search);
    const rawQueryIp = (params.get('ip') || params.get('host') || '').trim();
    const queryIp = rawQueryIp === '192.168.10.203' ? '' : rawQueryIp;

    if (queryIp) {
      this.lanIp = queryIp;
      this.isLanConnected = false; // Strictly do not assume connected before verification!
      localStorage.setItem('epd_lan_ip', queryIp);
    } else if (!this.lanIp) {
      const stored = (localStorage.getItem('epd_lan_ip') || '').trim();
      this.lanIp = (stored === '192.168.10.203') ? '' : stored;
    }

    const updateLanBar = () => {
      const curIp = this.lanIp;
      const lanInput = document.getElementById('lanIpInput') || document.getElementById('lanModalIpInput');
      if (lanInput && curIp) {
        lanInput.value = curIp;
      }
      const netLanStatus = document.getElementById('netLanStatus') || document.getElementById('lanStatusText');
      if (netLanStatus) {
        netLanStatus.textContent = this.isLanConnected ? `局域网: ${curIp}` : (curIp ? `局域网: ${curIp} (待连接)` : '未连接局域网');
      }
      const lanConsoleLink = document.getElementById('lanConsoleLink');
      if (lanConsoleLink) {
        if (curIp && this.isLanConnected) {
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
            UI.showToast(`已自动配置局域网设备: ${queryIp}。若浏览器提示混合内容拦截，可使用蓝牙直连或在地址栏允许不安全内容`, 'info', 4500);
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

      // Crucial: 450ms settling delay for Windows / Android Bluetooth PHY & MTU negotiation!
      await new Promise(r => setTimeout(r, 450));

      console.log('[BLE] Discovering 0x00FF Service (with auto-reconnect fallback)...');
      let service = null;
      for (let sAttempt = 1; sAttempt <= 4; sAttempt++) {
        try {
          if (!server || !server.connected) {
            console.warn(`[BLE] GATT Server disconnected before service discovery, reconnecting (${sAttempt})...`);
            await new Promise(r => setTimeout(r, 400));
            server = await device.gatt.connect();
            await new Promise(r => setTimeout(r, 450));
          }

          try {
            service = await server.getPrimaryService(BLE_SERVICE_UUID_128);
          } catch {
            service = await server.getPrimaryService(BLE_SERVICE_UUID_16);
          }
          if (service) break;
        } catch (sErr) {
          console.warn(`[BLE] Service discovery attempt ${sAttempt} failed:`, sErr.message);
          if (sAttempt === 4) {
            throw new Error(`无法获取 GATT 服务: ${sErr.message} (若在 Windows 上，建议在系统「设置 -> 蓝牙和其他设备」中删除本设备后重新配对)`);
          }
          try {
            if (device.gatt) {
              await device.gatt.disconnect();
              await new Promise(r => setTimeout(r, 300));
              server = await device.gatt.connect();
              await new Promise(r => setTimeout(r, 450));
            }
          } catch (rErr) {
            console.warn('[BLE] Reconnect retry error:', rErr);
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }

      if (!service) {
        throw new Error('未能发现 0x00FF 自定义 GATT 服务');
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
            } else if (text.startsWith('STATUS:')) {
              try {
                const s = JSON.parse(text.slice(7));
                if (s.ip && s.ip !== '0.0.0.0') {
                  this.lanIp = s.ip;
                  localStorage.setItem('epd_lan_ip', s.ip);
                  const netLanStatus = document.getElementById('netLanStatus') || document.getElementById('lanStatusText');
                  if (netLanStatus) netLanStatus.textContent = `局域网: ${s.ip}`;
                }
              } catch (e) {}
            } else if (text.startsWith('PRESET_SAVED:OK:')) {
              if (this._onPresetSavedResolver) {
                const parts = text.slice(16).split(':');
                this._onPresetSavedResolver(parts[0], parts[1], parts[2]);
                this._onPresetSavedResolver = null;
                this._onPresetSavedRejecter = null;
              }
            } else if (text.startsWith('ERROR:PRESET_SAVE_FAILED:')) {
              if (this._onPresetSavedRejecter) {
                this._onPresetSavedRejecter(new Error(text.slice(25)));
                this._onPresetSavedResolver = null;
                this._onPresetSavedRejecter = null;
              }
            } else if (text.startsWith('PRESET_PUSHED:OK:')) {
              if (this._onPresetPushedResolver) {
                this._onPresetPushedResolver(text.slice(17));
                this._onPresetPushedResolver = null;
              }
            } else if (text.startsWith('PRESETS_START:')) {
              const parts = text.slice(14).split(':');
              this._blePresetBuffer = {
                count: parseInt(parts[0] || '0', 10),
                used_bytes: parseInt(parts[1] || '0', 10),
                free_bytes: parseInt(parts[2] || '0', 10),
                total_bytes: parseInt(parts[3] || '1528841', 10),
                presets: []
              };
            } else if (text.startsWith('PRESET_ITEM:')) {
              const parts = text.slice(12).split('|');
              if (this._blePresetBuffer) {
                const size = parseInt(parts[2] || '105984', 10);
                const ts = parseInt(parts[3] || '0', 10) * 1000;
                this._blePresetBuffer.presets.push({
                  id: parts[0],
                  preset_type: parts[1],
                  type_label: parts[1] === 'badge' ? '个性工牌' : (parts[1] === 'itabag' ? '兽聚痛卡' : (parts[1] === 'memo' ? '待办便签' : '墨水屏作品')),
                  size_bytes: size,
                  size_str: (size / 1024).toFixed(1) + ' KB',
                  created_at: ts || Date.now(),
                  created_str: ts ? new Date(ts).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
                  name: parts[4] || parts[0]
                });
              }
            } else if (text === 'PRESETS_END') {
              if (this._onPresetsListResolver && this._blePresetBuffer) {
                this._onPresetsListResolver({
                  status: 'ok',
                  storage: {
                    used_bytes: this._blePresetBuffer.used_bytes,
                    free_bytes: this._blePresetBuffer.free_bytes,
                    total_bytes: this._blePresetBuffer.total_bytes
                  },
                  presets: this._blePresetBuffer.presets
                });
                this._onPresetsListResolver = null;
                this._blePresetBuffer = null;
              }
            }
          });

          // Query hardware status (IP, mode, etc.) after brief stabilization
          setTimeout(async () => {
            try {
              if (this.rxChar) {
                await this.rxChar.writeValueWithoutResponse(new TextEncoder().encode('status'));
              }
            } catch (e) {}
          }, 250);
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
      const fetchOpts = {
        signal: AbortSignal.timeout(3500),
        headers: { 'Accept': 'application/json' }
      };
      try { fetchOpts.targetAddressSpace = 'local'; } catch(e) {}
      const res = await fetch(url, fetchOpts);
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
    } else if (this.lanIp) {
      // User has an IP configured but not currently verified: test on demand
      const connected = await this.testLanConnection().catch(() => false);
      if (connected) {
        return await this._pushLanBitmap(packed2bpp, progressCb);
      }
      throw new Error(`硬件未连通！\n局域网 (${this.lanIp}) 无法访问。请点击顶部「🔍 扫描连接」使用蓝牙直推，或在「🌐 填入 IP」中更新设备 IP。`);
    } else {
      throw new Error('未连接硬件设备！请点击顶部「🔍 扫描连接」使用 WebBLE 蓝牙无线直推，或在「🌐 填入 IP」中输入设备 IP。');
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

  async _pushLanBitmap(packed2bpp, progressCb, triggerRefresh = true) {
    if (!this.lanIp) {
      throw new Error('未设置局域网设备 IP');
    }
    console.log(`[LAN] Pushing ${packed2bpp.length} bytes to http://${this.lanIp}/api/display/raw (refresh=${triggerRefresh}) ...`);
    if (progressCb) progressCb(15);

    const url = triggerRefresh
      ? `http://${this.lanIp}/api/display/raw`
      : `http://${this.lanIp}/api/display/raw?refresh=false`;
    let res;
    try {
      const fetchOpts = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: packed2bpp,
        signal: AbortSignal.timeout(25000)
      };
      try { fetchOpts.targetAddressSpace = 'local'; } catch(e) {}
      res = await fetch(url, fetchOpts);
    } catch (netErr) {
      this.isLanConnected = false;
      if (this.onStatusChange) this.onStatusChange(this.getConnectionStatus());
      const isHttps = window.location.protocol === 'https:';
      const helpMsg = isHttps
        ? `局域网推送连接失败: ${netErr.message}。\n⚠️ 提示：当前页面通过 HTTPS 域名访问，浏览器默认禁止向内网 HTTP 设备发送数据 (Mixed Content / 私有网络拦截)。\n💡 建议解决方案：\n1. 点击顶部「🔍 扫描连接」使用蓝牙无线直推 (零配置、稳定不被拦截)\n2. 或在浏览器设置中放行当前网站的「不安全内容 (Insecure content)」\n3. 或直接在浏览器打开 http://${this.lanIp}/ 访问单片机内置网页进行推送`
        : `局域网推送连接失败: ${netErr.message}。请检查设备 IP 是否正确且处于同一局域网。`;
      throw new Error(helpMsg);
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
   * 5. Clear screen to 100% pure yellow (0b10 = 0xAA)
   */
  async sendClearYellow() {
    if (this.isBleConnected && this.rxChar) {
      try {
        const cmd = new TextEncoder().encode('clear:yellow');
        await this.rxChar.writeValueWithoutResponse(cmd);
        return { status: 'ok', message: '全黄清屏指令已发送' };
      } catch (e) {}
    } else if (this.isLanConnected && this.lanIp) {
      try {
        const res = await fetch(`http://${this.lanIp}/api/display/clear_yellow`, { method: 'POST', signal: AbortSignal.timeout(6000) });
        if (res.ok) return await res.json().catch(() => ({ status: 'ok' }));
      } catch (e) {}
    }
    // High-precision physical fallback: push all-yellow 2bpp bitmap (0xAA)
    const buf = new Uint8Array(FRAMEBUFFER_SIZE);
    buf.fill(0xAA); // 0b10101010 = 4 yellow pixels per byte
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
      statusEl.innerHTML = `<span style="color:#4caf50;">蓝牙已连接: <strong>${this.bleDevice?.name || 'EPD-Display'}</strong></span>`;
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

  async pushPreset(id) {
    if (this.isLanConnected && this.lanIp) {
      const res = await fetch(`http://${this.lanIp}/api/presets/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        signal: AbortSignal.timeout(6000)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '单片机内部加载预设失败');
      return data;
    } else if (this.isBleConnected && this.rxChar) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this._onPresetPushedResolver = null;
          resolve({ status: 'ok', message: '已通过蓝牙通知单片机读取预设' });
        }, 4000);
        this._onPresetPushedResolver = (pushedId) => {
          clearTimeout(timeout);
          resolve({ status: 'ok', id: pushedId, message: '单片机已内部加载预设并启动刷新' });
        };
        const cmd = new TextEncoder().encode(`preset:push:${id}`);
        this.rxChar.writeValueWithoutResponse(cmd).catch(err => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }
    throw new Error('未连接任何单片机设备（请先连接蓝牙或局域网）');
  },

  async fetchPresets() {
    if (this.isLanConnected && this.lanIp) {
      try {
        const res = await fetch(`http://${this.lanIp}/api/presets`, {
          signal: AbortSignal.timeout(8000)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('[LAN] fetchPresets failed:', e);
      }
    }
    if (this.isBleConnected && this.rxChar) {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this._onPresetsListResolver = null;
          resolve(null);
        }, 6000);
        this._onPresetsListResolver = (data) => {
          clearTimeout(timeout);
          resolve(data);
        };
        const cmd = new TextEncoder().encode('preset:list');
        this.rxChar.writeValueWithoutResponse(cmd).catch(() => {
          clearTimeout(timeout);
          resolve(null);
        });
      });
    }
    return null;
  },

  async savePresetToDevice(meta, rawBitmap, progressCb) {
    if (this.isLanConnected && this.lanIp) {
      if (rawBitmap) {
        // Stream raw bitmap to display buffer first (80% progress) without physical refresh
        await this._pushLanBitmap(rawBitmap, (p) => progressCb?.(Math.round(p * 0.8)), false);
      }
      progressCb?.(85);
      const res = await fetch(`http://${this.lanIp}/api/presets/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: meta.name,
          preset_type: meta.preset_type || meta.type,
          type_label: meta.type_label || meta.typeLabel,
          save_current_screen: true
        }),
        signal: AbortSignal.timeout(20000)
      });
      progressCb?.(100);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '保存失败');
      return data;
    } else if (this.isBleConnected && this.rxChar) {
      if (rawBitmap) {
        // First inform firmware not to auto-refresh upon stream complete
        try {
          const cfgCmd = new TextEncoder().encode('stream:auto_refresh:0');
          await this.rxChar.writeValueWithoutResponse(cfgCmd);
          await new Promise(r => setTimeout(r, 40));
        } catch (e) {}
        // Stream 2bpp chunks to MCU SRAM
        await this._pushBleBitmap(rawBitmap, (p) => progressCb?.(Math.round(p * 0.85)));
      }
      progressCb?.(90);
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this._onPresetSavedResolver = null;
          this._onPresetSavedRejecter = null;
          reject(new Error('单片机保存预设响应超时'));
        }, 10000);
        this._onPresetSavedResolver = (savedId, usedBytes, freeBytes) => {
          clearTimeout(timeout);
          progressCb?.(100);
          resolve({
            status: 'ok',
            preset: { id: savedId, name: meta.name },
            storage: usedBytes && freeBytes ? {
              total_bytes: 1528841,
              used_bytes: parseInt(usedBytes, 10),
              free_bytes: parseInt(freeBytes, 10)
            } : null
          });
        };
        this._onPresetSavedRejecter = (err) => {
          clearTimeout(timeout);
          reject(err);
        };
        const cmd = new TextEncoder().encode(`preset:save:${meta.name}:${meta.preset_type || meta.type || 'bitmap'}`);
        this.rxChar.writeValueWithoutResponse(cmd).catch(err => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }
    throw new Error('未连接任何单片机设备（请先连接蓝牙或局域网）');
  },

  async deletePresetsFromDevice(ids) {
    if (this.isLanConnected && this.lanIp) {
      const res = await fetch(`http://${this.lanIp}/api/presets/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids }),
        signal: AbortSignal.timeout(10000)
      });
      return await res.json();
    } else if (this.isBleConnected && this.rxChar) {
      for (const id of ids) {
        const cmd = new TextEncoder().encode(`preset:delete:${id}`);
        await this.rxChar.writeValueWithoutResponse(cmd);
        await new Promise(r => setTimeout(r, 60));
      }
      return { status: 'ok' };
    }
    return null;
  },

  /**
   * Completely format & clear all Flash/SPIFFS storage on the microcontroller,
   * removing all presets, orphan .2bpp bitmaps, temporary files, and corrupted data.
   */
  async clearDeviceStorage() {
    let handled = false;
    let result = null;

    if (this.isLanConnected && this.lanIp) {
      try {
        const res = await fetch(`http://${this.lanIp}/api/storage/clear`, {
          method: 'POST',
          signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
          result = await res.json().catch(() => ({ status: 'ok' }));
          handled = true;
        }
      } catch (e) {
        // Fallback to /api/presets/clear
        try {
          const res2 = await fetch(`http://${this.lanIp}/api/presets/clear`, {
            method: 'POST',
            signal: AbortSignal.timeout(8000)
          });
          if (res2.ok) {
            result = await res2.json().catch(() => ({ status: 'ok' }));
            handled = true;
          }
        } catch (e2) {}
      }
    }

    if (this.isBleConnected && this.rxChar) {
      // 1. Send dedicated storage:clear command
      const cmd = new TextEncoder().encode('storage:clear');
      await this.rxChar.writeValueWithoutResponse(cmd);
      await new Promise(r => setTimeout(r, 80));

      // 2. Also send preset:clear_all for maximum compatibility
      const cmd2 = new TextEncoder().encode('preset:clear_all');
      await this.rxChar.writeValueWithoutResponse(cmd2);
      handled = true;
      result = { status: 'ok', message: '已向单片机发送清空 Flash 指令' };
    }

    if (!handled) {
      throw new Error('未连接任何单片机设备（请先在顶部连接蓝牙或配置局域网 IP）');
    }
    return result || { status: 'ok' };
  },

  /**
   * Cleans invalid, incomplete, and orphan files from the microcontroller,
   * preserving all valid presets intact.
   */
  async cleanInvalidData(fallbackOrphanIds = []) {
    let handled = false;
    let result = null;

    if (this.isLanConnected && this.lanIp) {
      try {
        const res = await fetch(`http://${this.lanIp}/api/storage/clean_orphans`, {
          method: 'POST',
          signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
          result = await res.json().catch(() => ({ status: 'ok' }));
          handled = true;
        }
      } catch (e) {
        try {
          const res2 = await fetch(`http://${this.lanIp}/api/presets/clean_orphans`, {
            method: 'POST',
            signal: AbortSignal.timeout(8000)
          });
          if (res2.ok) {
            result = await res2.json().catch(() => ({ status: 'ok' }));
            handled = true;
          }
        } catch (e2) {}
      }
    }

    if (this.isBleConnected && this.rxChar) {
      const cmd = new TextEncoder().encode('preset:clean_orphans');
      await this.rxChar.writeValueWithoutResponse(cmd);
      handled = true;
      result = { status: 'ok', message: '已向单片机发送清理孤儿文件指令' };
    }

    // Fallback for older firmware: delete identified orphan IDs individually
    if ((!handled || !result) && fallbackOrphanIds && fallbackOrphanIds.length > 0) {
      result = await this.deletePresetsFromDevice(fallbackOrphanIds);
      handled = true;
    }

    if (!handled) {
      throw new Error('未连接任何单片机设备（请先在顶部连接蓝牙或配置局域网 IP）');
    }
    return result || { status: 'ok' };
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
