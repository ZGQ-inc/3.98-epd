/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Preset Hub Engine (Bidirectional PWA IndexedDB/Local & ESP32-C3 1.5MB SPIFFS)
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

const PresetHub = {
  // Local storage & IndexedDB keys
  STORAGE_KEY: 'epd_presets_v2',
  DB_NAME: 'epd_presets_db',
  STORE_NAME: 'presets',

  // Current loaded presets
  presets: [],
  selectedIds: new Set(),
  currentTab: 'hardware', // 'hardware' | 'local'
  _hasRemoteStorageStats: false,
  storageStats: {
    total_bytes: 1528841, // 1.5MB partition
    used_bytes: 0,
    free_bytes: 1528841
  },
  localStats: {
    count: 0,
    used_bytes: 0
  },

  db: null,

  async init() {
    await this.loadLocalPresets();
    this.updateStorageUI();
  },

  switchTab(tab) {
    this.currentTab = tab || 'hardware';
    const hwBtn = document.getElementById('tabHwStorageBtn');
    const localBtn = document.getElementById('tabLocalStorageBtn');
    if (hwBtn && localBtn) {
      if (this.currentTab === 'hardware') {
        hwBtn.className = 'm3-btn small tonal preset-location-tab active';
        localBtn.className = 'm3-btn small outlined preset-location-tab';
      } else {
        hwBtn.className = 'm3-btn small outlined preset-location-tab';
        localBtn.className = 'm3-btn small tonal preset-location-tab active';
      }
    }
    this.selectedIds.clear();
    this.recalculateStorage();
    this.updateStorageUI();
    if (typeof App !== 'undefined' && App.renderPresetsUI) {
      App.renderPresetsUI();
    }
  },

  /* ================= IndexedDB Storage Engine ================= */
  async _openDb() {
    if (this.db) return this.db;
    if (!window.indexedDB) return null;
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.DB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(this.db);
        };
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  },

  async _loadFromIndexedDb() {
    const db = await this._openDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },

  async _saveToIndexedDb(presets) {
    const db = await this._openDb();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        store.clear();
        for (const item of presets) {
          store.put(item);
        }
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  },

  /* ================= Local Storage & IndexedDB Hybrid Cache ================= */
  async loadLocalPresets() {
    let localPresets = [];
    // 1. Synchronous localStorage fallback
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) localPresets = JSON.parse(raw);
    } catch (e) {
      localPresets = [];
    }

    // 2. Load from IndexedDB (preserves raw binary arrays without 5MB quota limit)
    try {
      const idbPresets = await this._loadFromIndexedDb();
      if (idbPresets && idbPresets.length > 0) {
        const map = new Map();
        for (const p of localPresets) map.set(p.id, p);
        for (const p of idbPresets) map.set(p.id, p);
        localPresets = Array.from(map.values());
      }
    } catch (e) {
      console.warn('[Presets] IndexedDB load notice:', e);
    }

    this.presets = localPresets;
    this.recalculateStorage();
    this.updateStorageUI();
  },

  async saveLocalPresets() {
    this.recalculateStorage();

    // 1. Save to IndexedDB
    try {
      await this._saveToIndexedDb(this.presets);
    } catch (e) {
      console.warn('[Presets] IndexedDB save notice:', e);
    }

    // 2. Save to localStorage with quota protection
    try {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.presets));
      } catch (quotaErr) {
        const lightPresets = this.presets.map(p => {
          const { raw_bitmap, ...rest } = p;
          return rest;
        });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lightPresets));
      }
    } catch (e) {
      console.error('[Presets] Local storage save failed:', e);
    }

    this.updateStorageUI();
  },

  recalculateStorage() {
    // Local offline draft presets (browser-only draft quota estimation)
    const localPresets = this.presets.filter(p => p.is_offline);
    let localUsed = 0;
    for (const p of localPresets) {
      localUsed += p.size_bytes || 105984;
    }
    this.localStats = {
      count: localPresets.length,
      used_bytes: localUsed
    };
    // Microcontroller Flash space is strictly read from physical SPIFFS (esp_spiffs_info),
    // NEVER artificially synthesized or calculated in JavaScript!
  },

  updateStorageUI() {
    const hwPresets = this.presets.filter(p => !p.is_offline);
    const localPresets = this.presets.filter(p => p.is_offline);

    const hwCountEl = document.getElementById('hwPresetCount');
    const localCountEl = document.getElementById('localPresetCount');
    if (hwCountEl) hwCountEl.textContent = hwPresets.length;
    if (localCountEl) localCountEl.textContent = localPresets.length;

    const hwContainer = document.getElementById('hwStorageBarContainer');
    const localContainer = document.getElementById('localStorageBarContainer');
    const batchUploadBtn = document.getElementById('presetBatchUploadBtn');

    if (this.currentTab === 'hardware') {
      if (hwContainer) hwContainer.style.display = 'block';
      if (localContainer) localContainer.style.display = 'none';
      if (batchUploadBtn) batchUploadBtn.style.display = 'none';

      const usedText = document.getElementById('storageUsedText');
      const freeText = document.getElementById('storageFreeText');
      const progressFill = document.getElementById('storageProgressFill');

      if (!this._hasRemoteStorageStats) {
        if (usedText) usedText.textContent = '未连通单片机';
        if (freeText) freeText.textContent = '--';
        if (progressFill) progressFill.style.width = '0%';
      } else {
        const total = this.storageStats.total_bytes || 1528841;
        const used = this.storageStats.used_bytes || 0;
        const free = this.storageStats.free_bytes !== undefined ? this.storageStats.free_bytes : Math.max(0, total - used);
        const pct = Math.min(100, Math.round((used / total) * 100));

        if (usedText) usedText.textContent = this.formatBytes(used);
        if (freeText) freeText.textContent = this.formatBytes(free);
        if (progressFill) progressFill.style.width = `${pct}%`;

        const orphanCount = hwPresets.filter(p => p.is_orphan || p.is_complete === false).length;
        const cleanOrphansBtn = document.getElementById('hwCleanOrphansBtn');
        if (cleanOrphansBtn) {
          if (orphanCount > 0) {
            cleanOrphansBtn.innerHTML = `🧹 一键清理无效数据 (${orphanCount})`;
            cleanOrphansBtn.style.color = 'var(--md-sys-color-primary)';
            cleanOrphansBtn.style.borderColor = 'var(--md-sys-color-primary)';
            cleanOrphansBtn.style.fontWeight = '700';
          } else {
            cleanOrphansBtn.innerHTML = '🧹 一键清理无效数据';
            cleanOrphansBtn.style.color = '';
            cleanOrphansBtn.style.borderColor = '';
            cleanOrphansBtn.style.fontWeight = '';
          }
        }
      }
    } else {
      if (hwContainer) hwContainer.style.display = 'none';
      if (localContainer) localContainer.style.display = 'flex';
      if (batchUploadBtn) batchUploadBtn.style.display = localPresets.length > 0 ? 'inline-block' : 'none';

      const localCountText = document.getElementById('localCountText');
      const localSizeText = document.getElementById('localSizeText');
      if (localCountText) localCountText.textContent = localPresets.length;
      if (localSizeText) localSizeText.textContent = this.formatBytes(this.localStats.used_bytes);
    }
  },

  /* ================= Bidirectional Sync with Hardware SPIFFS ================= */
  async syncWithDevice() {
    let synced = false;
    const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
      || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);

    if (isHardwareConnected || DeviceManager.lanIp) {
      try {
        let res = null;
        if (DeviceManager.fetchPresets) {
          res = await DeviceManager.fetchPresets();
        } else if (DeviceManager.lanIp) {
          const resp = await fetch(`http://${DeviceManager.lanIp}/api/presets`, {
            signal: AbortSignal.timeout(8000)
          });
          res = await resp.json();
        }

        if (res && (res.status === 'ok' || Array.isArray(res.presets))) {
          if (res.storage) {
            this.storageStats = res.storage;
            this._hasRemoteStorageStats = true;
          }
          if (res.presets && Array.isArray(res.presets)) {
            // Merge device presets with local IndexedDB/localStorage presets
            const localMap = new Map(this.presets.map(p => [p.id, p]));
            const merged = [];
            for (const devPreset of res.presets) {
              const local = localMap.get(devPreset.id);
              merged.push({
                ...local,
                ...devPreset,
                is_offline: false, // Confirmed on hardware!
                raw_bitmap: local?.raw_bitmap || devPreset.raw_bitmap
              });
              localMap.delete(devPreset.id);
            }
            // Keep local offline-only presets
            for (const [, localOnly] of localMap) {
              if (localOnly.is_offline) {
                merged.push(localOnly);
              }
            }
            this.presets = merged;
            await this.saveLocalPresets();
          }
          synced = true;
        }
      } catch (e) {
        console.warn('[Presets] Sync with device failed:', e);
      }
    }

    if (!synced) {
      this._hasRemoteStorageStats = false;
      await this.loadLocalPresets();
    }

    this.recalculateStorage();
    this.updateStorageUI();
    if (typeof App !== 'undefined' && App.renderPresetsUI) {
      App.renderPresetsUI();
    }
    return synced;
  },

  formatBytes(bytes) {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  async savePreset({ name, type, typeLabel, data, rawBitmap, targetLocation }, progressCb) {
    const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
      || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);

    const isTargetHardware = (targetLocation !== 'local') && isHardwareConnected;
    const estimatedSize = (rawBitmap ? rawBitmap.length : JSON.stringify(data || {}).length) + 512;

    if (isTargetHardware && this._hasRemoteStorageStats && this.storageStats.free_bytes < estimatedSize) {
      throw new Error(`单片机 Flash 存储空间不足！当前仅剩 ${this.formatBytes(this.storageStats.free_bytes)} 可用空间。`);
    }

    const id = 'preset_' + Date.now();
    const presetName = (name && name.trim()) ? name.trim() : `预设效果 #${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`;

    const newPreset = {
      id,
      name: presetName,
      preset_type: type, // 'badge' | 'itabag' | 'memo' | 'paint' | 'image' | 'scenes'
      type_label: typeLabel || '综合效果',
      size_bytes: estimatedSize,
      size_str: this.formatBytes(estimatedSize),
      created_at: Date.now(),
      created_str: new Date().toLocaleDateString('zh-CN') + ' ' + new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      data: data || {},
      raw_bitmap: rawBitmap ? Array.from(rawBitmap) : null,
      is_offline: !isTargetHardware
    };

    if (isTargetHardware) {
      progressCb?.(10, '正在写入单片机 Flash (SPIFFS)...');
      let saveRes;
      try {
        saveRes = await DeviceManager.savePresetToDevice({
          id: newPreset.id,
          name: newPreset.name,
          preset_type: newPreset.preset_type,
          type_label: newPreset.type_label,
          size_bytes: newPreset.size_bytes,
          size_str: newPreset.size_str,
          created_at: newPreset.created_at,
          created_str: newPreset.created_str,
          data_json: JSON.stringify(newPreset.data)
        }, rawBitmap, (pct) => progressCb?.(pct, `正在向单片机 Flash 写入显存点阵 (${pct}%)...`));
      } catch (err) {
        console.error('[Presets] Save to hardware failed:', err);
        throw err;
      }

      if (saveRes && saveRes.storage) {
        this.storageStats = saveRes.storage;
        this._hasRemoteStorageStats = true;
      }
      newPreset.is_offline = false;
      this.currentTab = 'hardware';
    } else {
      newPreset.is_offline = true;
      this.currentTab = 'local';
    }

    // Only add to presets list if saved successfully!
    this.presets.unshift(newPreset);
    await this.saveLocalPresets();
    if (isTargetHardware) {
      await this.syncWithDevice();
    } else {
      this.recalculateStorage();
      this.updateStorageUI();
    }

    return newPreset;
  },

  async uploadLocalPresetToHardware(id, progressCb) {
    const preset = this.presets.find(p => p.id === id);
    if (!preset) throw new Error('未找到预设');
    if (!preset.raw_bitmap) throw new Error('该预设未包含 2bpp 点阵数据');

    const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
      || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);
    if (!isHardwareConnected) throw new Error('未连通单片机硬件，请先在顶部连接蓝牙或局域网！');

    progressCb?.(15, `正在向单片机写入「${preset.name}」...`);
    const saveRes = await DeviceManager.savePresetToDevice({
      id: preset.id,
      name: preset.name,
      preset_type: preset.preset_type,
      type_label: preset.type_label
    }, new Uint8Array(preset.raw_bitmap), (pct) => progressCb?.(pct, `正在写入单片机 Flash (${pct}%)...`));

    if (saveRes && saveRes.storage) {
      this.storageStats = saveRes.storage;
      this._hasRemoteStorageStats = true;
    }
    preset.is_offline = false;
    await this.saveLocalPresets();
    await this.syncWithDevice();
    return preset;
  },

  async uploadAllLocalPresetsToHardware(progressCb) {
    const localPresets = this.presets.filter(p => p.is_offline);
    if (localPresets.length === 0) return 0;
    let successCount = 0;
    for (let i = 0; i < localPresets.length; i++) {
      const p = localPresets[i];
      const basePct = Math.round((i / localPresets.length) * 100);
      try {
        await this.uploadLocalPresetToHardware(p.id, (stepPct, msg) => {
          const overallPct = Math.round(basePct + (stepPct / localPresets.length));
          progressCb?.(overallPct, msg);
        });
        successCount++;
      } catch (e) {
        console.warn('Batch upload item error:', e);
      }
    }
    this.currentTab = 'hardware';
    await this.syncWithDevice();
    return successCount;
  },

  async deleteSelected() {
    if (this.selectedIds.size === 0) return 0;
    const idsToDelete = Array.from(this.selectedIds);

    const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
      || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);

    if (isHardwareConnected) {
      try {
        const delRes = await DeviceManager.deletePresetsFromDevice(idsToDelete);
        if (delRes && delRes.storage) {
          this.storageStats = delRes.storage;
          this._hasRemoteStorageStats = true;
        }
        await this.syncWithDevice();
      } catch (e) {
        console.warn('[Presets] Device delete sync failed:', e);
      }
    }

    this.presets = this.presets.filter(p => !this.selectedIds.has(p.id));
    this.selectedIds.clear();
    await this.saveLocalPresets();

    this.recalculateStorage();
    this.updateStorageUI();
    if (typeof App !== 'undefined' && App.renderPresetsUI) {
      App.renderPresetsUI();
    }

    return idsToDelete.length;
  },

  toggleSelect(id) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  },

  selectAll() {
    this.selectedIds = new Set(this.presets.map(p => p.id));
  },

  clearSelection() {
    this.selectedIds.clear();
  },

  /**
   * Completely clear and format microcontroller Flash/SPIFFS storage,
   * wiping out all saved presets, orphan .2bpp files, temporary swap data, and releasing all space.
   */
  async clearHardwareFlash() {
    const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
      || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);

    if (!isHardwareConnected && !DeviceManager.lanIp) {
      if (window.UI?.showToast) {
        window.UI.showToast('⚠️ 未连通单片机硬件，请先在顶部连接蓝牙或局域网！', 'warning', 4000);
      }
      return;
    }

    const confirmed = confirm(
      '⚠️ 警告：确定要彻底清空单片机内部 Flash 存储吗？\n\n' +
      '• 将清空单片机 SPIFFS 分区中的所有预设、残留点阵与无效缓存文件\n' +
      '• 释放全部物理 Flash 空间 (约 1.5 MB)\n' +
      '• 此操作不可撤销！'
    );
    if (!confirmed) return;

    if (window.UI?.showToast) {
      window.UI.showToast('正在发送清空 Flash 指令至单片机...', 'info', 3000);
    }

    try {
      const res = await DeviceManager.clearDeviceStorage();

      // Clear hardware presets from local memory
      this.presets = this.presets.filter(p => p.is_offline);
      this.selectedIds.clear();
      await this.saveLocalPresets();

      if (res && res.storage) {
        this.storageStats = res.storage;
        this._hasRemoteStorageStats = true;
      } else {
        // Reset local stats display
        this.storageStats = {
          total_bytes: 1528841,
          used_bytes: 0,
          free_bytes: 1528841
        };
        this._hasRemoteStorageStats = true;
      }

      this.updateStorageUI();
      if (typeof App !== 'undefined' && App.renderPresetsUI) {
        App.renderPresetsUI();
      }

      if (window.UI?.showToast) {
        window.UI.showToast('🎉 单片机 Flash 存储清空指令已执行，正在刷新存储状态...', 'success', 4000);
      }

      // Wait a moment for SPIFFS unlink to settle
      await new Promise(r => setTimeout(r, 800));

      // Re-sync with device to verify updated physical Flash bytes
      await this.syncWithDevice();
      this.updateStorageUI();
      if (typeof App !== 'undefined' && App.renderPresetsUI) {
        App.renderPresetsUI();
      }
    } catch (e) {
      console.error('[PresetHub] 清空 Flash 失败:', e);
      if (window.UI?.showToast) {
        window.UI.showToast(`清空 Flash 失败: ${e.message}`, 'error', 4500);
      }
    }
  },

  /**
   * One-click cleanup of all orphan, incomplete, and corrupted data files on MCU,
   * preserving all valid presets intact.
   */
  async cleanInvalidData() {
    const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
      || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);

    if (!isHardwareConnected && !DeviceManager.lanIp) {
      if (window.UI?.showToast) {
        window.UI.showToast('⚠️ 未连通单片机硬件，请先在顶部连接蓝牙或局域网！', 'warning', 4000);
      }
      return;
    }

    const orphanPresets = this.presets.filter(p => !p.is_offline && (p.is_orphan || p.is_complete === false));
    const orphanIds = orphanPresets.map(p => p.id);

    const msg = orphanPresets.length > 0
      ? `检测到单片机内有 ${orphanPresets.length} 项未完成或孤儿残留文件。\n\n确定执行一键清理吗？（将仅删除这些残留数据，保留全部正常预设）`
      : '确定扫描并清理单片机 Flash 内所有无索引的孤儿点阵文件与未完成数据吗？（不会影响正常预设）';

    if (!confirm(msg)) return;

    if (window.UI?.showToast) {
      window.UI.showToast('正在清理单片机内的孤儿与无效残留数据...', 'info', 3000);
    }

    try {
      const res = await DeviceManager.cleanInvalidData(orphanIds);

      // Remove local memory copies of orphan presets
      if (orphanIds.length > 0) {
        this.presets = this.presets.filter(p => !orphanIds.includes(p.id));
        orphanIds.forEach(id => this.selectedIds.delete(id));
        await this.saveLocalPresets();
      }

      if (res && res.storage) {
        this.storageStats = res.storage;
        this._hasRemoteStorageStats = true;
      }

      this.updateStorageUI();
      if (typeof App !== 'undefined' && App.renderPresetsUI) {
        App.renderPresetsUI();
      }

      const count = res?.cleaned_count || orphanPresets.length || 0;
      if (window.UI?.showToast) {
        window.UI.showToast(`🎉 已成功清理 ${count} 项无效/孤儿残留文件！`, 'success', 4000);
      }

      // Wait a moment and re-sync
      await new Promise(r => setTimeout(r, 600));
      await this.syncWithDevice();
      this.updateStorageUI();
      if (typeof App !== 'undefined' && App.renderPresetsUI) {
        App.renderPresetsUI();
      }
    } catch (e) {
      console.error('[PresetHub] 清理孤儿文件失败:', e);
      if (window.UI?.showToast) {
        window.UI.showToast(`清理无效数据失败: ${e.message}`, 'error', 4500);
      }
    }
  },

  /**
   * Clear all offline drafts in browser IndexedDB/localStorage.
   */
  async clearLocalPresets() {
    const localCount = this.presets.filter(p => p.is_offline).length;
    if (localCount === 0) {
      if (window.UI?.showToast) window.UI.showToast('本地离线预设草稿库已经为空！', 'info', 2500);
      return;
    }
    if (!confirm(`确定要清空全部 ${localCount} 个本地离线预设草稿吗？`)) return;

    this.presets = this.presets.filter(p => !p.is_offline);
    this.selectedIds.clear();
    await this.saveLocalPresets();
    this.recalculateStorage();
    this.updateStorageUI();
    if (typeof App !== 'undefined' && App.renderPresetsUI) {
      App.renderPresetsUI();
    }
    if (window.UI?.showToast) window.UI.showToast('已清空本地离线预设草稿！', 'success', 2500);
  }
};

window.PresetHub = PresetHub;
