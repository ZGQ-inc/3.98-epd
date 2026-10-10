/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Preset Hub Engine (Bidirectional PWA Local & ESP32-C3 1.5MB SPIFFS)
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

const PresetHub = {
  // Local storage cache key
  STORAGE_KEY: 'epd_presets_v2',

  // Current loaded presets
  presets: [],
  selectedIds: new Set(),
  storageStats: {
    total_bytes: 1528841, // 1.5MB partition
    used_bytes: 0,
    free_bytes: 1528841
  },

  init() {
    this.loadLocalPresets();
  },

  loadLocalPresets() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this.presets = raw ? JSON.parse(raw) : [];
      this.recalculateStorage();
    } catch (e) {
      this.presets = [];
    }
  },

  saveLocalPresets() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.presets));
      this.recalculateStorage();
    } catch (e) {
      console.error('[Presets] Local storage save failed:', e);
    }
  },

  recalculateStorage() {
    let used = 0;
    for (const p of this.presets) {
      used += p.size_bytes || 1024;
    }
    this.storageStats.used_bytes = used;
    this.storageStats.free_bytes = Math.max(0, this.storageStats.total_bytes - used);
  },

  async syncWithDevice() {
    if (DeviceManager.isLanConnected) {
      try {
        const res = await DeviceManager.fetchPresets();
        if (res && res.status === 'ok') {
          if (res.storage) {
            this.storageStats = res.storage;
          }
          if (res.presets && Array.isArray(res.presets)) {
            // Merge device presets with local presets
            const devIds = new Set(res.presets.map(p => p.id));
            const merged = [...res.presets];
            for (const local of this.presets) {
              if (!devIds.has(local.id)) {
                merged.push(local);
              }
            }
            this.presets = merged;
            this.saveLocalPresets();
          }
          return true;
        }
      } catch (e) {
        console.warn('[Presets] Sync with device failed:', e);
      }
    }
    return false;
  },

  formatBytes(bytes) {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  async savePreset({ name, type, typeLabel, data, rawBitmap }) {
    // Check available space
    const estimatedSize = (rawBitmap ? rawBitmap.length : JSON.stringify(data).length) + 200;
    if (this.storageStats.free_bytes < estimatedSize) {
      throw new Error(`存储空间不足！当前仅剩 ${this.formatBytes(this.storageStats.free_bytes)} 可用空间。`);
    }

    const id = 'preset_' + Date.now();
    const presetName = (name && name.trim()) ? name.trim() : `预设效果 #${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`;

    const newPreset = {
      id,
      name: presetName,
      preset_type: type, // 'badge' | 'charm' | 'memo' | 'paint' | 'image' | 'mode'
      type_label: typeLabel || '综合效果',
      size_bytes: estimatedSize,
      size_str: this.formatBytes(estimatedSize),
      created_at: Date.now(),
      created_str: new Date().toLocaleDateString('zh-CN') + ' ' + new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      data: data || {},
      raw_bitmap: rawBitmap ? Array.from(rawBitmap) : null
    };

    // Save to local cache
    this.presets.unshift(newPreset);
    this.saveLocalPresets();

    // If connected to hardware, sync to SPIFFS
    if (DeviceManager.isLanConnected) {
      try {
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
        }, rawBitmap);
      } catch (e) {
        console.warn('[Presets] Cloud/SPIFFS sync background notice:', e);
      }
    }

    return newPreset;
  },

  async deleteSelected() {
    if (this.selectedIds.size === 0) return 0;
    const idsToDelete = Array.from(this.selectedIds);

    this.presets = this.presets.filter(p => !this.selectedIds.has(p.id));
    this.selectedIds.clear();
    this.saveLocalPresets();

    if (DeviceManager.isLanConnected) {
      try {
        await DeviceManager.deletePresetsFromDevice(idsToDelete);
      } catch (e) {
        console.warn('[Presets] Device delete sync failed:', e);
      }
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
