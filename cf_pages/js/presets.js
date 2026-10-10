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
  storageStats: {
    total_bytes: 1528841, // 1.5MB partition
    used_bytes: 0,
    free_bytes: 1528841
  },

  db: null,

  async init() {
    await this.loadLocalPresets();
    this.updateStorageUI();
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
    let used = 0;
    for (const p of this.presets) {
      used += p.size_bytes || 1024;
    }
    this.storageStats.used_bytes = used;
    this.storageStats.free_bytes = Math.max(0, this.storageStats.total_bytes - used);
  },

  updateStorageUI() {
    const total = this.storageStats.total_bytes || 1528841;
    const used = this.storageStats.used_bytes || 0;
    const free = this.storageStats.free_bytes !== undefined ? this.storageStats.free_bytes : Math.max(0, total - used);
    const pct = Math.min(100, Math.round((used / total) * 100));

    const usedText = document.getElementById('storageUsedText');
    const freeText = document.getElementById('storageFreeText');
    const progressFill = document.getElementById('storageProgressFill');

    if (usedText) usedText.textContent = this.formatBytes(used);
    if (freeText) freeText.textContent = this.formatBytes(free);
    if (progressFill) progressFill.style.width = `${pct}%`;
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
          const resp = await fetch(`http://${DeviceManager.lanIp}/api/presets`);
          res = await resp.json();
        }

        if (res && (res.status === 'ok' || Array.isArray(res.presets))) {
          if (res.storage) {
            this.storageStats = res.storage;
          }
          if (res.presets && Array.isArray(res.presets)) {
            // Merge device presets with local IndexedDB/localStorage presets
            const localMap = new Map(this.presets.map(p => [p.id, p]));
            const merged = [];
            for (const devPreset of res.presets) {
              const local = localMap.get(devPreset.id);
              if (local) {
                // Keep local high-resolution raw_bitmap if device returned light summary
                merged.push({ ...local, ...devPreset, raw_bitmap: local.raw_bitmap || devPreset.raw_bitmap });
                localMap.delete(devPreset.id);
              } else {
                merged.push(devPreset);
              }
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

  async savePreset({ name, type, typeLabel, data, rawBitmap }, progressCb) {
    // Check available space
    const estimatedSize = (rawBitmap ? rawBitmap.length : JSON.stringify(data || {}).length) + 512;
    if (this.storageStats.free_bytes && this.storageStats.free_bytes < estimatedSize) {
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
      raw_bitmap: rawBitmap ? Array.from(rawBitmap) : null
    };

    const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
      || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);

    if (isHardwareConnected) {
      progressCb?.(10, '正在写入单片机 Flash (SPIFFS)...');
      await DeviceManager.savePresetToDevice({
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
      newPreset.is_offline = false;
    } else {
      newPreset.is_offline = true;
    }

    // Save to local cache & IndexedDB
    this.presets.unshift(newPreset);
    await this.saveLocalPresets();
    await this.syncWithDevice();

    this.updateStorageUI();
    return newPreset;
  },

  async deleteSelected() {
    if (this.selectedIds.size === 0) return 0;
    const idsToDelete = Array.from(this.selectedIds);

    this.presets = this.presets.filter(p => !this.selectedIds.has(p.id));
    this.selectedIds.clear();
    await this.saveLocalPresets();

    const isHardwareConnected = (DeviceManager.isBleConnected && DeviceManager.bleDevice?.gatt?.connected)
      || (DeviceManager.isLanConnected && !!DeviceManager.lanIp);

    if (isHardwareConnected) {
      try {
        await DeviceManager.deletePresetsFromDevice(idsToDelete);
        await this.syncWithDevice();
      } catch (e) {
        console.warn('[Presets] Device delete sync failed:', e);
      }
    }

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
  }
};

window.PresetHub = PresetHub;
