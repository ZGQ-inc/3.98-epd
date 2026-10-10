// src/storage/mod.rs — SPIFFS Filesystem & Presets Storage Manager

use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use std::sync::Mutex;
use log::{info, warn};
use serde::{Deserialize, Serialize};

pub const PRESETS_DIR: &str = "/spiffs/presets";
pub const SWAP_FB_PATH: &str = "/spiffs/swap_fb.bin";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub total_bytes: usize,
    pub used_bytes: usize,
    pub free_bytes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetMeta {
    pub id: String,
    pub name: String,
    pub preset_type: String, // "canvas" | "mode" | "bitmap" | "text"
    pub type_label: String,  // "画板设计" | "功能模式" | "位图图像" | "纯文本"
    pub size_bytes: usize,
    pub size_str: String,
    pub created_at: u64,
    pub created_str: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode_params: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub svg_data: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fabric_json: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text_content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview_thumb: Option<String>, // Base64 thumbnail or SVG preview
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bitmap_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetSummary {
    pub id: String,
    pub name: String,
    pub preset_type: String, // "canvas" | "mode" | "bitmap" | "text"
    pub type_label: String,  // "画板设计" | "功能模式" | "位图图像" | "纯文本"
    pub size_bytes: usize,
    pub size_str: String,
    pub created_at: u64,
    pub created_str: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bitmap_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetListResponse {
    pub status: String,
    pub storage: StorageStats,
    pub presets: Vec<PresetSummary>,
}

static STORAGE_LOCK: Mutex<()> = Mutex::new(());
static CACHED_STATS: Mutex<Option<StorageStats>> = Mutex::new(None);

/// Initializes and mounts the SPIFFS filesystem on the 'storage' partition to '/spiffs'.
pub fn init_spiffs() -> bool {
    let conf = esp_idf_svc::sys::esp_vfs_spiffs_conf_t {
        base_path: b"/spiffs\0".as_ptr() as *const _,
        partition_label: b"storage\0".as_ptr() as *const _,
        max_files: 5,
        format_if_mount_failed: true,
    };

    let ret = unsafe { esp_idf_svc::sys::esp_vfs_spiffs_register(&conf) };
    if ret != esp_idf_svc::sys::ESP_OK {
        warn!("[SPIFFS] Failed to mount storage partition! Return code: {}", ret);
        return false;
    }

    info!("[SPIFFS] SPIFFS mounted successfully at /spiffs");
    
    // Ensure presets directory exists
    if let Err(e) = fs::create_dir_all(PRESETS_DIR) {
        warn!("[SPIFFS] create_dir_all failed: {:?}", e);
    }

    if let Ok(stats) = refresh_storage_stats() {
        println!("  [spiffs] Storage partition ready: {} KB used / {} KB total ({} KB free)",
            stats.used_bytes / 1024, stats.total_bytes / 1024, stats.free_bytes / 1024);
    }
    true
}

/// Refreshes and caches the current total, used, and free bytes of the SPIFFS storage partition.
pub fn refresh_storage_stats() -> Result<StorageStats, String> {
    let mut total: usize = 0;
    let mut used: usize = 0;
    let ret = unsafe {
        esp_idf_svc::sys::esp_spiffs_info(
            b"storage\0".as_ptr() as *const _,
            &mut total,
            &mut used,
        )
    };
    if ret != esp_idf_svc::sys::ESP_OK {
        return Err(format!("esp_spiffs_info failed: {}", ret));
    }
    let free = total.saturating_sub(used);
    let stats = StorageStats {
        total_bytes: total,
        used_bytes: used,
        free_bytes: free,
    };
    if let Ok(mut lock) = CACHED_STATS.lock() {
        *lock = Some(stats.clone());
    }
    Ok(stats)
}

/// Returns the cached total, used, and free bytes of the SPIFFS storage partition (fast O(1) path).
pub fn get_storage_stats() -> Result<StorageStats, String> {
    if let Ok(lock) = CACHED_STATS.lock() {
        if let Some(ref s) = *lock {
            return Ok(s.clone());
        }
    }
    refresh_storage_stats()
}

/// Lists all saved presets from the SPIFFS storage partition.
pub fn list_presets() -> PresetListResponse {
    println!("  [storage] list_presets() started");
    let _guard = STORAGE_LOCK.lock().unwrap();
    println!("  [storage] list_presets() lock acquired");
    let stats = get_storage_stats().unwrap_or(StorageStats {
        total_bytes: 1632 * 1024,
        used_bytes: 0,
        free_bytes: 1632 * 1024,
    });
    println!("  [storage] list_presets() stats done: used={}", stats.used_bytes);

    let mut presets = Vec::new();
    if let Ok(entries) = fs::read_dir(PRESETS_DIR) {
        println!("  [storage] list_presets() reading directory {}", PRESETS_DIR);
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(bytes) = fs::read(&path) {
                    if let Ok(summary) = serde_json::from_slice::<PresetSummary>(&bytes) {
                        presets.push(summary);
                    }
                }
            }
        }
    }

    // Sort by created_at descending (newest first)
    presets.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    PresetListResponse {
        status: "ok".to_string(),
        storage: stats,
        presets,
    }
}

/// Saves a new preset with storage quota verification.
pub fn save_preset(mut meta: PresetMeta, raw_bitmap: Option<&[u8]>) -> Result<PresetMeta, String> {
    let _guard = STORAGE_LOCK.lock().unwrap();
    let stats = get_storage_stats()?;

    // Calculate approximate space needed
    let json_bytes = serde_json::to_vec(&meta).map_err(|e| e.to_string())?.len();
    let bitmap_bytes = raw_bitmap.map(|b| b.len()).unwrap_or(0);
    let needed = json_bytes + bitmap_bytes + 4096; // 4KB safety margin for SPIFFS metadata

    if stats.free_bytes < needed {
        return Err(format!(
            "存储空间不足！当前剩余 {} KB，该预设需要约 {} KB。请先在预设管理中删除不需要的预设后再保存。",
            stats.free_bytes / 1024,
            needed / 1024
        ));
    }

    // Generate unique ID if not provided
    if meta.id.trim().is_empty() {
        meta.id = format!("preset_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs());
    }

    // If raw bitmap is provided, write to .2bpp file
    if let Some(bitmap) = raw_bitmap {
        let bitmap_filename = format!("{}.2bpp", meta.id);
        let bitmap_path = format!("{}/{}", PRESETS_DIR, bitmap_filename);
        let mut f = File::create(&bitmap_path).map_err(|e| format!("Failed to create bitmap file: {:?}", e))?;
        f.write_all(bitmap).map_err(|e| format!("Failed to write bitmap file: {:?}", e))?;
        meta.bitmap_file = Some(bitmap_filename);
        meta.size_bytes = json_bytes + bitmap.len();
        meta.size_str = format!("{:.1} KB", meta.size_bytes as f64 / 1024.0);
    } else {
        meta.size_bytes = json_bytes;
        meta.size_str = format!("{:.1} KB", meta.size_bytes as f64 / 1024.0);
    }

    // Save metadata JSON
    let json_path = format!("{}/{}.json", PRESETS_DIR, meta.id);
    let json_str = serde_json::to_string(&meta).map_err(|e| e.to_string())?;
    let mut f = File::create(&json_path).map_err(|e| format!("Failed to create preset json: {:?}", e))?;
    f.write_all(json_str.as_bytes()).map_err(|e| format!("Failed to write preset json: {:?}", e))?;

    info!("[PRESET] Preset '{}' saved successfully (id: {})", meta.name, meta.id);
    let _ = refresh_storage_stats();
    Ok(meta)
}

/// Deletes one or multiple presets and their associated bitmap files.
pub fn delete_presets(ids: &[String]) -> Result<StorageStats, String> {
    let _guard = STORAGE_LOCK.lock().unwrap();
    for id in ids {
        let json_path = format!("{}/{}.json", PRESETS_DIR, id);
        let bitmap_path = format!("{}/{}.2bpp", PRESETS_DIR, id);

        let _ = fs::remove_file(&json_path);
        let _ = fs::remove_file(&bitmap_path);
        info!("[PRESET] Deleted preset: {}", id);
    }
    refresh_storage_stats()
}

/// Retrieves a preset's raw bitmap bytes for preview or push.
pub fn get_preset_bitmap(id: &str) -> Result<Vec<u8>, String> {
    let _guard = STORAGE_LOCK.lock().unwrap();
    let bitmap_path = format!("{}/{}.2bpp", PRESETS_DIR, id);
    if !Path::new(&bitmap_path).exists() {
        return Err(format!("Bitmap file for preset {} not found", id));
    }
    let mut f = File::open(&bitmap_path).map_err(|e| format!("Open error: {:?}", e))?;
    let mut buf = Vec::new();
    f.read_to_end(&mut buf).map_err(|e| format!("Read error: {:?}", e))?;
    Ok(buf)
}
