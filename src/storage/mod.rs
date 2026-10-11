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

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetMeta {
    pub id: String,
    pub name: String,
    pub preset_type: String, // "canvas" | "mode" | "bitmap" | "text" | "orphan"
    pub type_label: String,  // "画板设计" | "功能模式" | "位图图像" | "纯文本" | "孤儿残留文件"
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
    #[serde(default = "default_true")]
    pub is_complete: bool,
    #[serde(default)]
    pub is_orphan: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetSummary {
    pub id: String,
    pub name: String,
    pub preset_type: String, // "canvas" | "mode" | "bitmap" | "text" | "orphan"
    pub type_label: String,  // "画板设计" | "功能模式" | "位图图像" | "纯文本" | "孤儿残留文件"
    pub size_bytes: usize,
    pub size_str: String,
    pub created_at: u64,
    pub created_str: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bitmap_file: Option<String>,
    #[serde(default = "default_true")]
    pub is_complete: bool,
    #[serde(default)]
    pub is_orphan: bool,
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
        max_files: 2,
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

    // Pre-populate CACHED_PRESETS on the main task during boot (7KB stack)
    let initial_presets = scan_presets_dir();
    println!("  [spiffs] Loaded {} saved presets into cache", initial_presets.len());
    if let Ok(mut lock) = CACHED_PRESETS.lock() {
        *lock = Some(initial_presets);
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

static CACHED_PRESETS: Mutex<Option<Vec<PresetSummary>>> = Mutex::new(None);

fn scan_presets_dir() -> Vec<PresetSummary> {
    let mut presets = Vec::new();
    let mut referenced_bitmaps = std::collections::HashSet::new();

    // 1. Scan JSON metadata files in /spiffs/presets
    if let Ok(entries) = fs::read_dir(PRESETS_DIR) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
                if let Ok(mut file) = File::open(&path) {
                    let mut bytes = Vec::new();
                    if file.read_to_end(&mut bytes).is_ok() {
                        match serde_json::from_slice::<PresetSummary>(&bytes) {
                            Ok(mut summary) => {
                                if let Some(ref bf) = summary.bitmap_file {
                                    referenced_bitmaps.insert(bf.clone());
                                    let bpath = format!("{}/{}", PRESETS_DIR, bf);
                                    if !Path::new(&bpath).exists() {
                                        summary.is_complete = false;
                                        summary.type_label = "⚠️ 点阵丢失".to_string();
                                    }
                                }
                                if !summary.is_complete {
                                    summary.type_label = "⚠️ 未完成写入".to_string();
                                }
                                presets.push(summary);
                            }
                            Err(_) => {
                                // Broken JSON: expose as corrupted item
                                let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("corrupted").to_string();
                                let size = file.metadata().map(|m| m.len() as usize).unwrap_or(0);
                                presets.push(PresetSummary {
                                    id: stem,
                                    name: format!("⚠️ 损坏索引 ({})", file_name),
                                    preset_type: "corrupted".to_string(),
                                    type_label: "⚠️ 损坏元数据".to_string(),
                                    size_bytes: size,
                                    size_str: format!("{:.1} KB", size as f64 / 1024.0),
                                    created_at: 0,
                                    created_str: "未知时间".to_string(),
                                    bitmap_file: None,
                                    is_complete: false,
                                    is_orphan: true,
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Scan all non-json files in /spiffs/presets to expose orphan .2bpp / .tmp files
    if let Ok(entries) = fs::read_dir(PRESETS_DIR) {
        for entry in entries.flatten() {
            let path = entry.path();
            let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
            let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
            if ext != "json" && !referenced_bitmaps.contains(&file_name) {
                let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or(&file_name).to_string();
                let size = entry.metadata().map(|m| m.len() as usize).unwrap_or(0);
                presets.push(PresetSummary {
                    id: format!("orphan_{}", stem),
                    name: format!("⚠️ 孤儿点阵文件 ({})", file_name),
                    preset_type: "orphan".to_string(),
                    type_label: "⚠️ 孤儿残留数据".to_string(),
                    size_bytes: size,
                    size_str: format!("{:.1} KB", size as f64 / 1024.0),
                    created_at: 0,
                    created_str: "缺少元数据索引".to_string(),
                    bitmap_file: Some(file_name.clone()),
                    is_complete: false,
                    is_orphan: true,
                });
            }
        }
    }

    // 3. Scan root /spiffs for stray .2bpp or temporary swap files
    if let Ok(entries) = fs::read_dir("/spiffs") {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
                if file_name.ends_with(".2bpp") || file_name == "swap_fb.bin" || file_name.ends_with(".tmp") {
                    let size = entry.metadata().map(|m| m.len() as usize).unwrap_or(0);
                    presets.push(PresetSummary {
                        id: format!("orphan_{}", file_name),
                        name: format!("⚠️ 临时缓存残留 ({})", file_name),
                        preset_type: "orphan".to_string(),
                        type_label: "⚠️ 根目录残留".to_string(),
                        size_bytes: size,
                        size_str: format!("{:.1} KB", size as f64 / 1024.0),
                        created_at: 0,
                        created_str: "临时交换文件".to_string(),
                        bitmap_file: Some(file_name.clone()),
                        is_complete: false,
                        is_orphan: true,
                    });
                }
            }
        }
    }

    presets.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    presets
}

/// Lists all saved presets from the SPIFFS storage partition (O(1) memory cached).
pub fn list_presets() -> PresetListResponse {
    let _guard = STORAGE_LOCK.lock().unwrap();
    let stats = get_storage_stats().unwrap_or(StorageStats {
        total_bytes: 1528 * 1024,
        used_bytes: 0,
        free_bytes: 1528 * 1024,
    });

    let presets = if let Ok(lock) = CACHED_PRESETS.lock() {
        if let Some(ref list) = *lock {
            list.clone()
        } else {
            let list = scan_presets_dir();
            drop(lock);
            if let Ok(mut l) = CACHED_PRESETS.lock() {
                *l = Some(list.clone());
            }
            list
        }
    } else {
        scan_presets_dir()
    };

    PresetListResponse {
        status: "ok".to_string(),
        storage: stats,
        presets,
    }
}

/// Saves a new preset with two-phase commit:
/// 1. Write metadata JSON with is_complete: false
/// 2. Stream and write raw bitmap (.2bpp)
/// 3. Update metadata JSON with is_complete: true on success
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

    let json_path = format!("{}/{}.json", PRESETS_DIR, meta.id);

    // Phase 1: Write initial index metadata with is_complete: false
    meta.is_complete = false;
    meta.is_orphan = false;
    let json_init_str = serde_json::to_string(&meta).map_err(|e| e.to_string())?;
    let mut f_init = File::create(&json_path).map_err(|e| format!("Failed to create preset json: {:?}", e))?;
    f_init.write_all(json_init_str.as_bytes()).map_err(|e| format!("Failed to write initial preset json: {:?}", e))?;

    // Phase 2: If raw bitmap is provided, write to .2bpp file
    if let Some(bitmap) = raw_bitmap {
        let bitmap_filename = format!("{}.2bpp", meta.id);
        let bitmap_path = format!("{}/{}", PRESETS_DIR, bitmap_filename);
        let mut f_bmp = File::create(&bitmap_path).map_err(|e| format!("Failed to create bitmap file: {:?}", e))?;
        f_bmp.write_all(bitmap).map_err(|e| format!("Failed to write bitmap file: {:?}", e))?;
        meta.bitmap_file = Some(bitmap_filename);
        meta.size_bytes = json_bytes + bitmap.len();
        meta.size_str = format!("{:.1} KB", meta.size_bytes as f64 / 1024.0);
    } else {
        meta.size_bytes = json_bytes;
        meta.size_str = format!("{:.1} KB", meta.size_bytes as f64 / 1024.0);
    }

    // Phase 3: Update metadata JSON with is_complete: true
    meta.is_complete = true;
    let json_final_str = serde_json::to_string(&meta).map_err(|e| e.to_string())?;
    let mut f_final = File::create(&json_path).map_err(|e| format!("Failed to update finalized preset json: {:?}", e))?;
    f_final.write_all(json_final_str.as_bytes()).map_err(|e| format!("Failed to write finalized preset json: {:?}", e))?;

    let summary = PresetSummary {
        id: meta.id.clone(),
        name: meta.name.clone(),
        preset_type: meta.preset_type.clone(),
        type_label: meta.type_label.clone(),
        size_bytes: meta.size_bytes,
        size_str: meta.size_str.clone(),
        created_at: meta.created_at,
        created_str: meta.created_str.clone(),
        bitmap_file: meta.bitmap_file.clone(),
        is_complete: true,
        is_orphan: false,
    };
    if let Ok(mut lock) = CACHED_PRESETS.lock() {
        if let Some(ref mut list) = *lock {
            list.retain(|p| p.id != summary.id);
            list.insert(0, summary);
        } else {
            *lock = Some(vec![summary]);
        }
    }

    info!("[PRESET] Preset '{}' saved successfully (id: {})", meta.name, meta.id);
    let _ = refresh_storage_stats();
    Ok(meta)
}

/// Deletes one or multiple presets, single orphan files, or corrupted entries.
pub fn delete_presets(ids: &[String]) -> Result<StorageStats, String> {
    let _guard = STORAGE_LOCK.lock().unwrap();
    for id in ids {
        let raw_id = id.strip_prefix("orphan_").unwrap_or(id);

        let json_path = format!("{}/{}.json", PRESETS_DIR, raw_id);
        let bitmap_path = format!("{}/{}.2bpp", PRESETS_DIR, raw_id);
        let direct_preset_path = format!("{}/{}", PRESETS_DIR, raw_id);
        let direct_spiffs_path = format!("/spiffs/{}", raw_id);

        let _ = fs::remove_file(&json_path);
        let _ = fs::remove_file(&bitmap_path);
        let _ = fs::remove_file(&direct_preset_path);
        let _ = fs::remove_file(&direct_spiffs_path);
        info!("[PRESET] Deleted preset or orphan file: {}", id);
    }
    if let Ok(mut lock) = CACHED_PRESETS.lock() {
        if let Some(ref mut list) = *lock {
            list.retain(|p| !ids.contains(&p.id) && !ids.contains(&format!("orphan_{}", p.id)));
        }
    }
    refresh_storage_stats()
}

/// Deletes all invalid, incomplete, and orphan files from SPIFFS storage,
/// preserving all valid presets intact.
pub fn clean_invalid_data() -> Result<(usize, StorageStats), String> {
    let _guard = STORAGE_LOCK.lock().unwrap();
    let mut cleaned_count = 0;
    let mut referenced_bitmaps = std::collections::HashSet::new();
    let mut invalid_json_stems = Vec::new();

    // 1. Check all JSON metadata files
    if let Ok(entries) = fs::read_dir(PRESETS_DIR) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("").to_string();
                let mut is_valid = false;
                if let Ok(mut file) = File::open(&path) {
                    let mut bytes = Vec::new();
                    if file.read_to_end(&mut bytes).is_ok() {
                        if let Ok(summary) = serde_json::from_slice::<PresetSummary>(&bytes) {
                            if summary.is_complete && !summary.is_orphan {
                                if let Some(ref bf) = summary.bitmap_file {
                                    let bpath = format!("{}/{}", PRESETS_DIR, bf);
                                    if Path::new(&bpath).exists() {
                                        referenced_bitmaps.insert(bf.clone());
                                        is_valid = true;
                                    }
                                } else {
                                    is_valid = true;
                                }
                            }
                        }
                    }
                }
                if !is_valid {
                    invalid_json_stems.push(stem);
                }
            }
        }
    }

    // Delete invalid JSONs and their associated bitmap files
    for stem in invalid_json_stems {
        let json_path = format!("{}/{}.json", PRESETS_DIR, stem);
        let bitmap_path = format!("{}/{}.2bpp", PRESETS_DIR, stem);
        let _ = fs::remove_file(&json_path);
        let _ = fs::remove_file(&bitmap_path);
        cleaned_count += 1;
        println!("  [spiffs] Cleaned invalid preset: {}", stem);
    }

    // 2. Delete orphan files in /spiffs/presets
    if let Ok(entries) = fs::read_dir(PRESETS_DIR) {
        for entry in entries.flatten() {
            let path = entry.path();
            let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
            let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
            if ext != "json" && !referenced_bitmaps.contains(&file_name) {
                let _ = fs::remove_file(&path);
                cleaned_count += 1;
                println!("  [spiffs] Cleaned orphan file in presets: {}", file_name);
            }
        }
    }

    // 3. Delete orphan files in /spiffs root (e.g. swap_fb.bin, .tmp)
    if let Ok(entries) = fs::read_dir("/spiffs") {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
                if file_name.ends_with(".2bpp") || file_name == "swap_fb.bin" || file_name.ends_with(".tmp") {
                    let _ = fs::remove_file(&path);
                    cleaned_count += 1;
                    println!("  [spiffs] Cleaned root orphan file: {}", file_name);
                }
            }
        }
    }

    // Reset cached presets and rescan
    if let Ok(mut lock) = CACHED_PRESETS.lock() {
        *lock = None;
    }
    let stats = refresh_storage_stats()?;
    info!("[SPIFFS] Cleaned {} invalid/orphan files", cleaned_count);
    Ok((cleaned_count, stats))
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

/// Completely formats and cleans all files in the SPIFFS storage partition,
/// removing all presets, orphan .2bpp bitmaps, temporary swap files, and invalid data.
pub fn clear_all_storage() -> Result<StorageStats, String> {
    let _guard = STORAGE_LOCK.lock().unwrap();

    // 1. Delete all files inside /spiffs/presets
    if let Ok(entries) = fs::read_dir(PRESETS_DIR) {
        for entry in entries.flatten() {
            let path = entry.path();
            let _ = fs::remove_file(&path);
            println!("  [spiffs] Removed file: {:?}", path);
        }
    }
    let _ = fs::remove_dir_all(PRESETS_DIR);
    let _ = fs::create_dir_all(PRESETS_DIR);

    // 2. Remove swap file if present
    let _ = fs::remove_file(SWAP_FB_PATH);

    // 3. Delete any other orphan files directly under /spiffs
    if let Ok(entries) = fs::read_dir("/spiffs") {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let _ = fs::remove_file(&path);
                println!("  [spiffs] Removed root file: {:?}", path);
            }
        }
    }

    // 4. Reset cached presets in memory
    if let Ok(mut lock) = CACHED_PRESETS.lock() {
        *lock = Some(Vec::new());
    }

    info!("[SPIFFS] Storage partition completely cleared and reset!");
    refresh_storage_stats()
}
