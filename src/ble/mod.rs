// src/ble/mod.rs — Native Bluetooth Low Energy (BLE 5.0 NimBLE) & Wireless Coexistence Manager

use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use serde::{Deserialize, Serialize};
use log::info;
use esp32_nimble::{
    BLEDevice, BLECharacteristic, BLEAdvertisementData, NimbleProperties,
    utilities::{BleUuid, mutex::Mutex as NimbleMutex},
    enums::{PowerType, PowerLevel, AuthReq, SecurityIOCap},
};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum BleStatus {
    Off,
    Advertising,
    Connected,
}

impl BleStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            BleStatus::Off => "OFF",
            BleStatus::Advertising => "ADV",
            BleStatus::Connected => "CONN",
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BleDeviceInfo {
    pub id: String,
    pub name: String,
    pub mac: String,
    pub rssi: i8,
    pub connected: bool,
    pub connected_duration_secs: u32,
}

pub struct BleManager {
    status: Mutex<BleStatus>,
    devices: Mutex<Vec<BleDeviceInfo>>,
    device_name: Mutex<String>,
    wireless_mode: Mutex<String>,
    current_ip: Mutex<String>,
    is_ap: Mutex<bool>,
    initialized: AtomicBool,
    pub is_authorized: AtomicBool,
    pub active_pin: Mutex<Option<(u32, u64)>>,
    tx_char: Mutex<Option<Arc<NimbleMutex<BLECharacteristic>>>>,
    config_mgr: Mutex<Option<Arc<Mutex<crate::config::ConfigManager>>>>,
    app_config: Mutex<Option<Arc<Mutex<crate::config::AppConfig>>>>,
}

static GLOBAL_BLE: Mutex<Option<Arc<BleManager>>> = Mutex::new(None);
static STREAM_OFFSET: AtomicUsize = AtomicUsize::new(0);
static STREAM_AUTO_REFRESH: AtomicBool = AtomicBool::new(true);

impl BleManager {
    pub fn global() -> Arc<Self> {
        let mut guard = GLOBAL_BLE.lock().unwrap();
        if let Some(ref mgr) = *guard {
            mgr.clone()
        } else {
            let mgr = Arc::new(BleManager {
                status: Mutex::new(BleStatus::Off),
                devices: Mutex::new(Vec::new()),
                device_name: Mutex::new("EPD-Smart-Display".to_string()),
                wireless_mode: Mutex::new("dual".to_string()),
                current_ip: Mutex::new(String::new()),
                is_ap: Mutex::new(false),
                initialized: AtomicBool::new(false),
                is_authorized: AtomicBool::new(false),
                active_pin: Mutex::new(None),
                tx_char: Mutex::new(None),
                config_mgr: Mutex::new(None),
                app_config: Mutex::new(None),
            });
            *guard = Some(mgr.clone());
            mgr
        }
    }

    /// Initialize native ESP32-C3 NimBLE 5.0 hardware controller, GATT server and advertising
    pub fn init(
        &self,
        mode: &str,
        device_name: &str,
        _ble_enabled: bool,
        config_mgr: Option<Arc<Mutex<crate::config::ConfigManager>>>,
        app_config: Option<Arc<Mutex<crate::config::AppConfig>>>,
    ) {
        if let Some(cm) = config_mgr {
            *self.config_mgr.lock().unwrap() = Some(cm);
        }
        if let Some(ac) = app_config {
            *self.app_config.lock().unwrap() = Some(ac);
        }
        let mode_str = if mode.is_empty() { "auto" } else { mode };
        *self.wireless_mode.lock().unwrap() = mode_str.to_string();
        *self.device_name.lock().unwrap() = device_name.to_string();

        let should_start = if mode_str == "wifi_only" {
            false
        } else {
            true
        };

        if !should_start {
            *self.status.lock().unwrap() = BleStatus::Off;
            println!("  [ble-hardware] Wireless mode is '{}', BLE hardware standing by (OFF).", mode_str);
            info!("[BLE] Wireless mode is '{}', BLE hardware not started.", mode_str);
            return;
        }

        self.setup_hardware_ble(device_name);
    }

    fn setup_hardware_ble(&self, name: &str) {
        if self.initialized.swap(true, Ordering::SeqCst) {
            // Already initialized GATT server; simply start advertising
            self.start_advertising();
            return;
        }

        println!("  [ble-hardware] Initializing ESP32-C3 NimBLE 5.0 Peripheral Stack...");
        let free_heap = unsafe { esp_idf_sys::esp_get_free_heap_size() };
        println!("  [ble-hardware] Free Heap before BLE: {} bytes", free_heap);

        let device = BLEDevice::take();
        device.set_power(PowerType::Default, PowerLevel::P9).ok();
        BLEDevice::set_device_name(name).ok();

        // Configure BLE Security: Use open JustWorks pairing without requiring Bond
        // Crucial for Web Bluetooth on Windows/Android/Chrome to avoid "GATT Server is disconnected" rejection!
        device.security()
            .set_auth(AuthReq::empty())
            .set_io_cap(SecurityIOCap::NoInputNoOutput);

        let server = device.get_server();
        server.on_connect(|server, desc| {
            let peer_mac = desc.address().to_string();
            println!("  [ble-hardware] WebBLE Host connected: {}", peer_mac);
            info!("[BLE] WebBLE Host connected: {}", peer_mac);
            // Crucial: Negotiate fast & stable connection parameters for Windows/WebBLE (interval: 30~60ms, timeout: 600ms)
            server.update_conn_params(desc.conn_handle(), 24, 48, 0, 60).ok();
            let ble = BleManager::global();
            ble.is_authorized.store(false, Ordering::SeqCst);
            *ble.active_pin.lock().unwrap() = None;
            ble.on_ble_client_connected("WebBLE Client", &peer_mac, 0);
            if ble.get_wireless_mode() == "auto" {
                crate::wifi::pause_wifi_for_ble();
            }
        }).on_disconnect(|_desc, reason| {
            println!("  [ble-hardware] WebBLE Host disconnected: {:?}", reason);
            info!("[BLE] WebBLE Host disconnected: {:?}", reason);
            let ble = BleManager::global();
            ble.is_authorized.store(false, Ordering::SeqCst);
            *ble.active_pin.lock().unwrap() = None;
            if ble.get_wireless_mode() == "auto" {
                crate::wifi::resume_wifi_after_ble();
            }
            ble.on_ble_client_disconnected_all();
        });

        // Custom GATT Service (0x00FF) ───────────────────────────────────────
        let service = server.create_service(BleUuid::from_uuid16(0x00FF));

        // RX Characteristic (0xFF01): WRITE | WRITE_NO_RSP
        let rx_char = service.lock().create_characteristic(
            BleUuid::from_uuid16(0xFF01),
            NimbleProperties::WRITE | NimbleProperties::WRITE_NO_RSP,
        );

        rx_char.lock().on_write(|args| {
            let data = args.recv_data();
            if data.is_empty() { return; }

            // Check if string command or JSON (< 240 bytes). Binary chunks (240 bytes) must NEVER reset offset!
            let is_text_cmd = data.len() < 240 && (
                data[0] == b'{'
                || data.starts_with(b"AUTH:")
                || data.starts_with(b"PAIR:")
                || data.starts_with(b"NFC:")
                || data.starts_with(b"dev:")
                || data.starts_with(b"nfc:")
                || data.starts_with(b"refresh")
                || data.starts_with(b"mode:")
                || data.starts_with(b"wireless:")
                || data.starts_with(b"clear:")
                || data.starts_with(b"status")
                || data.starts_with(b"get_")
                || data.starts_with(b"preset:")
                || data.starts_with(b"stream:")
                || data.starts_with(b"sys:")
                || data.starts_with(b"reboot")
                || data.starts_with(b"storage:")
            );

            if is_text_cmd {
                STREAM_OFFSET.store(0, Ordering::Relaxed);
                if let Ok(text) = std::str::from_utf8(data) {
                    let text = text.trim();
                    println!("  [ble-rx] Received text command: '{}'", text);
                    let ble_self = BleManager::global();

                    if text.starts_with("AUTH:") {
                        let sub = &text[5..];
                        let parts: Vec<&str> = sub.splitn(2, ':').collect();
                        let mut authed = false;
                        let mut dev_alias = String::new();
                        if parts.len() == 2 {
                            let dev_id = parts[0].trim();
                            let token = parts[1].trim();
                            if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                                let mut cfg = ac.lock().unwrap();
                                if let Some(name) = cfg.verify_trusted_device(dev_id, token) {
                                    authed = true;
                                    dev_alias = name;
                                    if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                        let _ = cm.lock().unwrap().save(&cfg);
                                    }
                                }
                            }
                        }
                        if authed {
                            ble_self.is_authorized.store(true, Ordering::SeqCst);
                            println!("  [ble-rx] Client authenticated successfully: '{}'", dev_alias);
                            ble_self.notify_str(&format!("AUTH:OK:{}", dev_alias));
                        } else {
                            ble_self.is_authorized.store(false, Ordering::SeqCst);
                            println!("  [ble-rx] Authentication rejected: device not in whitelist or token mismatch.");
                            ble_self.notify_str("ERROR:UNAUTHORIZED");
                        }
                    } else if text == "PAIR:REQUEST" {
                        let pin_enabled = ble_self.app_config.lock().unwrap().as_ref()
                            .map(|ac| ac.lock().unwrap().pin_pairing_enabled).unwrap_or(true);
                        if !pin_enabled {
                            println!("  [ble-rx] PAIR:REQUEST rejected: PIN pairing is disabled by owner.");
                            ble_self.notify_str("ERROR:PIN_DISABLED");
                        } else {
                            let pin = (unsafe { esp_idf_svc::sys::esp_random() } % 900_000) + 100_000;
                            let now_sec = unsafe { esp_idf_sys::esp_timer_get_time() / 1_000_000 } as u64;
                            *ble_self.active_pin.lock().unwrap() = Some((pin, now_sec + 120));
                            println!("  [ble-rx] Generated dynamic PIN: {:06} (expires in 120s)", pin);
                            crate::display::request_pin_screen(format!("{:06}", pin));
                            ble_self.notify_str("PAIR:PIN_READY");
                        }
                    } else if text.starts_with("PAIR:VERIFY:") {
                        let sub = &text[12..];
                        let parts: Vec<&str> = sub.splitn(2, ':').collect();
                        let pin_str = parts[0].trim();
                        let dev_name = if parts.len() > 1 && !parts[1].trim().is_empty() {
                            parts[1].trim().to_string()
                        } else {
                            "智能终端设备".to_string()
                        };
                        let now_sec = unsafe { esp_idf_sys::esp_timer_get_time() / 1_000_000 } as u64;
                        let mut verified = false;
                        if let Some((stored_pin, expire_ts)) = *ble_self.active_pin.lock().unwrap() {
                            if now_sec <= expire_ts && pin_str == format!("{:06}", stored_pin) {
                                verified = true;
                            }
                        }
                        if verified {
                            *ble_self.active_pin.lock().unwrap() = None;
                            let dev_id = format!("dev_{:08x}", unsafe { esp_idf_svc::sys::esp_random() });
                            let token = crate::config::generate_random_16b_hex();
                            let client = crate::config::PairedClient {
                                device_id: dev_id.clone(),
                                device_name: dev_name.clone(),
                                auth_token: token.clone(),
                                paired_at: now_sec,
                                last_seen: now_sec,
                            };
                            let master_key = if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                                let mut cfg = ac.lock().unwrap();
                                cfg.add_or_update_trusted_device(client);
                                let mk = cfg.master_key.clone();
                                if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                    let _ = cm.lock().unwrap().save(&cfg);
                                }
                                mk
                            } else {
                                String::new()
                            };
                            ble_self.is_authorized.store(true, Ordering::SeqCst);
                            crate::display::request_pairing_success(dev_name.clone());
                            println!("  [ble-rx] Pair verified! Registered new trusted device '{}' (ID: {})", dev_name, dev_id);
                            let resp = format!(
                                "PAIR:OK:{{\"device_id\":\"{}\",\"token\":\"{}\",\"device_name\":\"{}\",\"master_key\":\"{}\"}}",
                                dev_id, token, dev_name, master_key
                            );
                            ble_self.notify_str(&resp);
                        } else {
                            println!("  [ble-rx] PAIR:VERIFY failed for PIN '{}'", pin_str);
                            ble_self.notify_str("ERROR:PIN_INVALID");
                        }
                    } else if text.starts_with("NFC:CLAIM:") {
                        let sub = &text[10..];
                        let parts: Vec<&str> = sub.splitn(2, ':').collect();
                        let mut claimed = false;
                        let mut dev_id = String::new();
                        let mut token = String::new();
                        let mut dev_name = "NFC快捷绑定设备".to_string();
                        if parts.len() >= 1 {
                            let key = parts[0].trim();
                            if parts.len() > 1 && !parts[1].trim().is_empty() {
                                dev_name = parts[1].trim().to_string();
                            }
                            if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                                let mut cfg = ac.lock().unwrap();
                                if !cfg.master_key.is_empty() && cfg.master_key == key {
                                    claimed = true;
                                    dev_id = format!("dev_{:08x}", unsafe { esp_idf_svc::sys::esp_random() });
                                    token = crate::config::generate_random_16b_hex();
                                    let now_sec = unsafe { esp_idf_sys::esp_timer_get_time() / 1_000_000 } as u64;
                                    cfg.add_or_update_trusted_device(crate::config::PairedClient {
                                        device_id: dev_id.clone(),
                                        device_name: dev_name.clone(),
                                        auth_token: token.clone(),
                                        paired_at: now_sec,
                                        last_seen: now_sec,
                                    });
                                    if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                        let _ = cm.lock().unwrap().save(&cfg);
                                    }
                                }
                            }
                        }
                        if claimed {
                            ble_self.is_authorized.store(true, Ordering::SeqCst);
                            crate::display::request_pairing_success(dev_name.clone());
                            let resp = format!(
                                "PAIR:OK:{{\"device_id\":\"{}\",\"token\":\"{}\",\"device_name\":\"{}\"}}",
                                dev_id, token, dev_name
                            );
                            ble_self.notify_str(&resp);
                        } else {
                            ble_self.notify_str("ERROR:INVALID_MASTER_KEY");
                        }
                    } else if text == "status" || text == "get_ip" || text == "get_status" {
                        ble_self.notify_status();
                    } else if text == "sys:diag" || text == "get_diag" {
                        // Diagnostic status query allowed (continues to existing sys:diag handler)
                        let free_heap = unsafe { esp_idf_sys::esp_get_free_heap_size() } as usize;
                        let min_free_heap = unsafe { esp_idf_sys::esp_get_minimum_free_heap_size() } as usize;
                        let uptime_secs = unsafe { esp_idf_sys::esp_timer_get_time() / 1_000_000 } as u64;
                        let mut mac = [0u8; 6];
                        unsafe { esp_idf_svc::sys::esp_efuse_mac_get_default(mac.as_mut_ptr()) };
                        let mac_str = format!("{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
                        let ip = ble_self.get_ip_address();
                        let mode = ble_self.get_wireless_mode();
                        let ntp_synced = crate::ntp::is_time_synced();
                        let now = crate::ntp::get_now_info();
                        let time_str = format!("{} {}", now.date_str, now.time_sec_str);
                        let storage_stats = crate::storage::get_storage_stats().unwrap_or(crate::storage::StorageStats {
                            total_bytes: 1528841, used_bytes: 0, free_bytes: 1528841
                        });
                        let screen_debug = ble_self.app_config.lock().unwrap().as_ref()
                            .map(|ac| ac.lock().unwrap().screen_debug).unwrap_or(false);
                        let panel_ver = ble_self.app_config.lock().unwrap().as_ref()
                            .map(|ac| ac.lock().unwrap().panel_version.clone()).unwrap_or_else(|| "A0".to_string());
                        let diag_json = format!(
                            "SYS_DIAG:{{\"heap\":{},\"min_heap\":{},\"uptime\":{},\"mac\":\"{}\",\"ip\":\"{}\",\"mode\":\"{}\",\"ntp\":{},\"time\":\"{}\",\"st_tot\":{},\"st_free\":{},\"debug\":{},\"low_bat\":{},\"panel_ver\":\"{}\"}}",
                            free_heap, min_free_heap, uptime_secs, mac_str, ip, mode, ntp_synced, time_str,
                            storage_stats.total_bytes, storage_stats.free_bytes, screen_debug,
                            crate::power::PowerManager::is_low_battery(), panel_ver
                        );
                        ble_self.notify_str(&diag_json);
                    } else if !ble_self.is_authorized.load(Ordering::SeqCst) {
                        println!("  [ble-rx] Command '{}' rejected: session is unauthorized.", text);
                        ble_self.notify_str("ERROR:UNAUTHORIZED");
                    } else if text == "dev:list" || text == "get_devices" {
                        let json = if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                            let cfg = ac.lock().unwrap();
                            serde_json::to_string(&cfg.trusted_devices).unwrap_or_else(|_| "[]".to_string())
                        } else {
                            "[]".to_string()
                        };
                        ble_self.notify_str(&format!("DEV_LIST:{}", json));
                    } else if text.starts_with("dev:rename:") {
                        let sub = &text[11..];
                        let parts: Vec<&str> = sub.splitn(2, ':').collect();
                        if parts.len() == 2 {
                            let id = parts[0].trim();
                            let new_name = parts[1].trim();
                            let mut ok = false;
                            if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                                let mut cfg = ac.lock().unwrap();
                                ok = cfg.rename_trusted_device(id, new_name);
                                if ok {
                                    if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                        let _ = cm.lock().unwrap().save(&cfg);
                                    }
                                }
                            }
                            ble_self.notify_str(if ok { "DEV_RENAME:OK" } else { "ERROR:DEVICE_NOT_FOUND" });
                        }
                    } else if text.starts_with("dev:delete:") {
                        let id = text[11..].trim();
                        let mut ok = false;
                        if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                            let mut cfg = ac.lock().unwrap();
                            ok = cfg.remove_trusted_device(id);
                            if ok {
                                if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                    let _ = cm.lock().unwrap().save(&cfg);
                                }
                            }
                        }
                        ble_self.notify_str(if ok { "DEV_DELETE:OK" } else { "ERROR:DEVICE_NOT_FOUND" });
                    } else if text.starts_with("sys:pin_pairing:") {
                        let val = text[16..].trim();
                        let en = val == "1" || val == "true";
                        if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                            let mut cfg = ac.lock().unwrap();
                            cfg.pin_pairing_enabled = en;
                            if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                let _ = cm.lock().unwrap().save(&cfg);
                            }
                        }
                        ble_self.notify_str(&format!("SYS_PIN_PAIRING:OK:{}", if en { "1" } else { "0" }));
                    } else if text == "nfc:get_master_key" {
                        let mk = ble_self.app_config.lock().unwrap().as_ref()
                            .map(|ac| ac.lock().unwrap().master_key.clone()).unwrap_or_default();
                        ble_self.notify_str(&format!("NFC_KEY:{}", mk));
                    } else if text == "refresh" {
                        crate::display::request_refresh(true);
                    } else if text.starts_with("mode:") {
                        let m = &text[5..];
                        crate::display::request_mode(m.to_string());
                    } else if text.starts_with("wireless:") {
                        let m = &text[9..];
                        println!("  [ble-rx] Wireless mode switch requested: '{}'", m);
                        let ble_self = BleManager::global();
                        let mut saved = false;
                        let mut err_note: Option<&str> = None;
                        if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                            let mut cfg = ac.lock().unwrap();
                            if m == "wifi_only" && cfg.wifi_ssid.trim().is_empty() {
                                err_note = Some("ERROR:NO_WIFI_CONFIGURED");
                                println!("  [ble-rx] Reject switch to wifi_only: wifi_ssid is empty!");
                            } else {
                                cfg.wireless_mode = m.to_string();
                                if m == "wifi_only" {
                                    cfg.ble_enabled = false;
                                } else if m == "ble_only" {
                                    cfg.ble_enabled = true;
                                }
                                if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                    let mut mgr = cm.lock().unwrap();
                                    if let Err(e) = mgr.save(&cfg) {
                                        eprintln!("  [ble-rx] Failed to save wireless_mode: {:?}", e);
                                    } else {
                                        println!("  [ble-rx] Saved wireless_mode '{}' to NVS!", m);
                                        saved = true;
                                    }
                                }
                            }
                        }
                        if let Some(err) = err_note {
                            if let Some(ref tx) = *ble_self.tx_char.lock().unwrap() {
                                tx.lock().set_value(err.as_bytes());
                                tx.lock().notify();
                            }
                        } else if saved {
                            if let Some(ref tx) = *ble_self.tx_char.lock().unwrap() {
                                let note = format!("MODE_SWITCHED:{}", m);
                                tx.lock().set_value(note.as_bytes());
                                tx.lock().notify();
                            }
                            if m == "wifi_only" || m == "ble_only" {
                                let m_owned = m.to_string();
                                std::thread::spawn(move || {
                                    std::thread::sleep(std::time::Duration::from_millis(1200));
                                    println!("  [ble-rx] Restarting device to apply '{}' mode...", m_owned);
                                    unsafe { esp_idf_sys::esp_restart() };
                                });
                            } else {
                                ble_self.set_wireless_mode(m);
                            }
                        }
                    } else if text == "clear:white" {
                        crate::display::request_clear_white();
                    } else if text == "clear:black" {
                        crate::display::request_clear_color(crate::display::BwryColor::Black);
                    } else if text == "clear:yellow" {
                        crate::display::request_clear_color(crate::display::BwryColor::Yellow);
                    } else if text == "clear:red" {
                        crate::display::request_clear_color(crate::display::BwryColor::Red);
                    } else if text.starts_with("preset:push:") {
                        let id = text[12..].trim();
                        println!("  [ble-rx] Pushing preset '{}' directly from SPIFFS...", id);
                        let mut ok = false;
                        if crate::storage::load_preset_to_framebuffer(id).is_ok() {
                            ok = crate::display::request_direct_bitmap();
                        }
                        if let Some(ref tx) = *BleManager::global().tx_char.lock().unwrap() {
                            let resp = if ok {
                                format!("PRESET_PUSHED:OK:{}", id)
                            } else {
                                format!("ERROR:PRESET_PUSH_FAILED:{}", id)
                            };
                            tx.lock().set_value(resp.as_bytes());
                            tx.lock().notify();
                        }
                    } else if text.starts_with("preset:save:") {
                        let sub = &text[12..];
                        let parts: Vec<&str> = sub.split(':').collect();
                        let (preset_id, preset_name, p_type) = if parts.len() >= 3 {
                            (parts[0].trim().to_string(), parts[1].trim().to_string(), parts[2].trim())
                        } else {
                            let now_ts = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
                            let name = if parts.is_empty() || parts[0].trim().is_empty() {
                                format!("预设效果_{}", now_ts)
                            } else {
                                parts[0].trim().to_string()
                            };
                            let t = if parts.len() > 1 { parts[1].trim() } else { "bitmap" };
                            (format!("p_{}", now_ts), name, t)
                        };
                        let now_ts = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
                        let meta = crate::storage::PresetMeta {
                            id: preset_id.clone(),
                            name: preset_name,
                            preset_type: p_type.to_string(),
                            type_label: match p_type {
                                "badge" => "个性工牌".to_string(),
                                "itabag" => "兽聚痛卡".to_string(),
                                "memo" => "待办便签".to_string(),
                                "paint" => "像素手绘".to_string(),
                                "image" => "图像作品".to_string(),
                                "scenes" => "场景模式".to_string(),
                                _ => "位图图像".to_string(),
                            },
                            size_bytes: 105984,
                            size_str: "106.0 KB".to_string(),
                            created_at: if now_ts > 1000000 { now_ts } else { 1770000000 },
                            created_str: format!("{}", now_ts),
                            mode_id: None,
                            mode_params: None,
                            svg_data: None,
                            fabric_json: None,
                            text_content: None,
                            preview_thumb: None,
                            bitmap_file: None,
                            is_complete: true,
                            is_orphan: false,
                        };
                        let raw_fb = Some(crate::display::framebuffer::get_raw_slice());
                        let res = crate::storage::save_preset(meta, raw_fb);
                        if let Some(ref tx) = *BleManager::global().tx_char.lock().unwrap() {
                            let stats = crate::storage::get_storage_stats().unwrap_or(crate::storage::StorageStats {
                                total_bytes: 1528841, used_bytes: 0, free_bytes: 1528841
                            });
                            let resp = match res {
                                Ok(saved) => format!("PRESET_SAVED:OK:{}:{}:{}", saved.id, stats.used_bytes, stats.free_bytes),
                                Err(e) => format!("ERROR:PRESET_SAVE_FAILED:{}", e),
                            };
                            tx.lock().set_value(resp.as_bytes());
                            tx.lock().notify();
                        }
                    } else if text == "stream:auto_refresh:0" {
                        STREAM_AUTO_REFRESH.store(false, Ordering::Relaxed);
                        STREAM_OFFSET.store(0, Ordering::Relaxed);
                        println!("  [ble-rx] Stream auto-refresh disabled (buffered only), offset reset to 0");
                        if let Some(ref tx) = *BleManager::global().tx_char.lock().unwrap() {
                            tx.lock().set_value(b"STREAM_CFG:OK:0");
                            tx.lock().notify();
                        }
                    } else if text == "stream:auto_refresh:1" {
                        STREAM_AUTO_REFRESH.store(true, Ordering::Relaxed);
                        STREAM_OFFSET.store(0, Ordering::Relaxed);
                        println!("  [ble-rx] Stream auto-refresh enabled, offset reset to 0");
                        if let Some(ref tx) = *BleManager::global().tx_char.lock().unwrap() {
                            tx.lock().set_value(b"STREAM_CFG:OK:1");
                            tx.lock().notify();
                        }
                    } else if text == "reboot" || text == "sys:reboot" {
                        println!("  [ble-rx] Reboot requested via BLE...");
                        BleManager::global().notify_bytes(b"SYS_REBOOT:OK");
                        std::thread::spawn(|| {
                            std::thread::sleep(std::time::Duration::from_millis(600));
                            unsafe { esp_idf_sys::esp_restart() };
                        });
                    } else if text == "sys:reset" || text == "factory_reset" {
                        println!("  [ble-rx] Factory reset requested via BLE (clearing NVS & storage)...");
                        let ble_self = BleManager::global();
                        if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                            let mut cfg = ac.lock().unwrap();
                            *cfg = crate::config::AppConfig::default();
                            if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                let mut mgr = cm.lock().unwrap();
                                let _ = mgr.save(&cfg);
                            }
                        }
                        let _ = crate::storage::clear_all_storage();
                        ble_self.notify_bytes(b"SYS_RESET:OK");
                        std::thread::spawn(|| {
                            std::thread::sleep(std::time::Duration::from_millis(800));
                            unsafe { esp_idf_sys::esp_restart() };
                        });
                    } else if text.starts_with("sys:debug:") {
                        let en = text.ends_with(":1") || text.ends_with(":true");
                        let ble_self = BleManager::global();
                        if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                            let mut cfg = ac.lock().unwrap();
                            cfg.screen_debug = en;
                            if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                let mut mgr = cm.lock().unwrap();
                                let _ = mgr.save(&cfg);
                            }
                        }
                        let resp = format!("SYS_DEBUG:OK:{}", if en { "1" } else { "0" });
                        ble_self.notify_str(&resp);
                    } else if text.starts_with("sys:panel:") || text.starts_with("panel:") {
                        let sub = if text.starts_with("sys:panel:") { &text[10..] } else { &text[6..] }.trim();
                        let new_ver = if sub.eq_ignore_ascii_case("A1") { "A1" } else { "A0" };
                        println!("  [ble-rx] Panel version switch requested: '{}'", new_ver);
                        let ble_self = BleManager::global();
                        if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                            let mut cfg = ac.lock().unwrap();
                            cfg.panel_version = new_ver.to_string();
                            if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                let mut mgr = cm.lock().unwrap();
                                let _ = mgr.save(&cfg);
                            }
                        }
                        crate::display::request_refresh(true);
                        let resp = format!("SYS_PANEL:OK:{}", new_ver);
                        ble_self.notify_str(&resp);
                    } else if text == "sys:get_config" {
                        let ble_self = BleManager::global();
                        let json = if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                            let cfg = ac.lock().unwrap();
                            Some(format!(
                                "SYS_CONFIG:{{\"ssid\":\"{}\",\"mqtt_host\":\"{}\",\"mqtt_port\":{},\"mqtt_user\":\"{}\",\"debug\":{},\"panel_version\":\"{}\"}}",
                                cfg.wifi_ssid, cfg.mqtt_broker, cfg.mqtt_port, cfg.mqtt_user, cfg.screen_debug, cfg.panel_version
                            ))
                        } else {
                            None
                        };
                        if let Some(j) = json {
                            ble_self.notify_str(&j);
                        }
                    } else if text.starts_with("sys:config:") {
                        let cfg_json = &text[11..];
                        let ble_self = BleManager::global();
                        let mut ok = false;
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(cfg_json) {
                            if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                                let mut cfg = ac.lock().unwrap();
                                if let Some(s) = val.get("wifi_ssid").and_then(|v| v.as_str()) {
                                    cfg.wifi_ssid = s.to_string();
                                }
                                if let Some(p) = val.get("wifi_pass").and_then(|v| v.as_str()) {
                                    cfg.wifi_pass = p.to_string();
                                }
                                if let Some(m) = val.get("mqtt_broker").and_then(|v| v.as_str()) {
                                    cfg.mqtt_broker = m.to_string();
                                }
                                if let Some(port) = val.get("mqtt_port").and_then(|v| v.as_u64()) {
                                    cfg.mqtt_port = port as u16;
                                }
                                if let Some(u) = val.get("mqtt_user").and_then(|v| v.as_str()) {
                                    cfg.mqtt_user = u.to_string();
                                }
                                if let Some(pw) = val.get("mqtt_pass").and_then(|v| v.as_str()) {
                                    cfg.mqtt_pass = pw.to_string();
                                }
                                if let Some(pv) = val.get("panel_version").and_then(|v| v.as_str()) {
                                    cfg.panel_version = if pv.eq_ignore_ascii_case("A1") { "A1".to_string() } else { "A0".to_string() };
                                }
                                if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                    let mut mgr = cm.lock().unwrap();
                                    if mgr.save(&cfg).is_ok() {
                                        ok = true;
                                    }
                                }
                            }
                        }
                        let resp = if ok { "SYS_CONFIG:SAVED" } else { "ERROR:CONFIG_SAVE_FAILED" };
                        ble_self.notify_str(resp);
                    } else if text == "preset:list" || text == "get_presets" {
                        let list = crate::storage::list_presets();
                        let stats = crate::storage::get_storage_stats().unwrap_or(crate::storage::StorageStats {
                            total_bytes: 1528841, used_bytes: 0, free_bytes: 1528841
                        });
                        if let Some(ref tx) = *BleManager::global().tx_char.lock().unwrap() {
                            let header = format!("PRESETS_START:{}:{}:{}:{}", list.presets.len(), stats.used_bytes, stats.free_bytes, stats.total_bytes);
                            tx.lock().set_value(header.as_bytes());
                            tx.lock().notify();
                            for p in &list.presets {
                                std::thread::sleep(std::time::Duration::from_millis(15));
                                let item = format!("PRESET_ITEM:{}|{}|{}|{}|{}", p.id, p.preset_type, p.size_bytes, p.created_at, p.name);
                                tx.lock().set_value(item.as_bytes());
                                tx.lock().notify();
                            }
                            std::thread::sleep(std::time::Duration::from_millis(15));
                            tx.lock().set_value(b"PRESETS_END");
                            tx.lock().notify();
                        }
                    } else if text.starts_with("preset:delete:") {
                        let id = text[14..].trim();
                        let _ = crate::storage::delete_presets(&[id.to_string()]);
                        if let Some(ref tx) = *BleManager::global().tx_char.lock().unwrap() {
                            let resp = format!("PRESET_DELETED:{}", id);
                            tx.lock().set_value(resp.as_bytes());
                            tx.lock().notify();
                        }
                    } else if text == "storage:clear" || text == "preset:clear_all" || text == "spiffs:format" {
                        println!("  [ble-rx] Wiping and clearing all SPIFFS storage partition...");
                        let _ = crate::storage::clear_all_storage();
                        if let Some(ref tx) = *BleManager::global().tx_char.lock().unwrap() {
                            tx.lock().set_value(b"STORAGE_CLEARED");
                            tx.lock().notify();
                        }
                    } else if text == "preset:clean_orphans" || text == "storage:clean_orphans" {
                        println!("  [ble-rx] Cleaning invalid and orphan files from SPIFFS...");
                        let count = crate::storage::clean_invalid_data().map(|(c, _)| c).unwrap_or(0);
                        if let Some(ref tx) = *BleManager::global().tx_char.lock().unwrap() {
                            let resp = format!("CLEANED_ORPHANS:{}", count);
                            tx.lock().set_value(resp.as_bytes());
                            tx.lock().notify();
                        }
                    } else if text.starts_with('{') {
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(text) {
                            if val.get("cmd").and_then(|v| v.as_str()) == Some("wifi_setup") {
                                if let Some(ssid) = val.get("ssid").and_then(|v| v.as_str()) {
                                    let pass = val.get("pass").and_then(|v| v.as_str()).unwrap_or("");
                                    println!("  [ble-rx] Air Provisioning Wi-Fi SSID: '{}'", ssid);
                                    let ble_self = BleManager::global();
                                    let mut saved = false;
                                    if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                                        let mut cfg = ac.lock().unwrap();
                                        cfg.wifi_ssid = ssid.to_string();
                                        cfg.wifi_pass = pass.to_string();
                                        cfg.last_screen_crc = 0; // Reset CRC so next boot displays Wi-Fi demo layout!
                                        if let Some(ref cm) = *ble_self.config_mgr.lock().unwrap() {
                                            let mut mgr = cm.lock().unwrap();
                                            if let Err(e) = mgr.save(&cfg) {
                                                eprintln!("  [ble-rx] Failed to save Wi-Fi config: {:?}", e);
                                            } else {
                                                println!("  [ble-rx] Wi-Fi config saved to NVS!");
                                                saved = true;
                                            }
                                        }
                                    }
                                    if saved {
                                        if let Some(ref tx) = *ble_self.tx_char.lock().unwrap() {
                                            tx.lock().set_value(b"WIFI_CONFIGURED");
                                            tx.lock().notify();
                                        }
                                        std::thread::spawn(|| {
                                            std::thread::sleep(std::time::Duration::from_millis(1200));
                                            println!("  [ble-rx] Restarting device to apply new Wi-Fi credentials...");
                                            unsafe { esp_idf_sys::esp_restart() };
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                return;
            }

            // Binary 2bpp pixel chunk streaming
            if !BleManager::global().is_authorized.load(Ordering::SeqCst) {
                STREAM_OFFSET.store(0, Ordering::Relaxed);
                BleManager::global().notify_str("ERROR:UNAUTHORIZED");
                return;
            }
            let curr = STREAM_OFFSET.load(Ordering::Relaxed);
            let written = crate::display::framebuffer::write_raw_chunk(curr, data);
            let next = curr + written;
            STREAM_OFFSET.store(next, Ordering::Relaxed);
            if next >= crate::display::TOTAL_BUFFER_SIZE {
                STREAM_OFFSET.store(0, Ordering::Relaxed);
                let auto = STREAM_AUTO_REFRESH.swap(true, Ordering::Relaxed);
                if auto {
                    println!("  [ble-rx] 2bpp Framebuffer complete ({} bytes)! Triggering physical refresh...", next);
                    crate::display::request_direct_bitmap();
                    if let Some(ref tx) = *BleManager::global().tx_char.lock().unwrap() {
                        tx.lock().set_value(b"REFRESH_TRIGGERED");
                        tx.lock().notify();
                    }
                } else {
                    println!("  [ble-rx] 2bpp Framebuffer complete ({} bytes) buffered without refresh.", next);
                    if let Some(ref tx) = *BleManager::global().tx_char.lock().unwrap() {
                        tx.lock().set_value(b"BUFFER_COMPLETE");
                        tx.lock().notify();
                    }
                }
            }
        });

        // TX Characteristic (0xFF02): READ | NOTIFY
        let tx_char = service.lock().create_characteristic(
            BleUuid::from_uuid16(0xFF02),
            NimbleProperties::READ | NimbleProperties::NOTIFY,
        );
        tx_char.lock().set_value(b"EPD_ONLINE");
        *self.tx_char.lock().unwrap() = Some(tx_char);

        // Device Information Service (0x180A) ─────────────────────────────────
        let dis_svc = server.create_service(BleUuid::from_uuid16(0x180A));
        let model_char = dis_svc.lock().create_characteristic(
            BleUuid::from_uuid16(0x2A24),
            NimbleProperties::READ,
        );
        model_char.lock().set_value(name.as_bytes());

        let _ = server.start();
        println!("  [ble-hardware] GATT Server active on Service 0x00FF (RX: 0xFF01, TX: 0xFF02)");

        self.start_advertising();
    }

    pub fn start_advertising(&self) {
        let device = BLEDevice::take();
        let advertising = device.get_advertising();
        let mut adv = advertising.lock();
        if adv.is_advertising() {
            let _ = adv.stop();
            std::thread::sleep(std::time::Duration::from_millis(30));
        }

        let name = self.device_name.lock().unwrap().clone();
        let mut adv_data = BLEAdvertisementData::new();
        adv_data.name(&name);
        adv_data.add_service_uuid(BleUuid::from_uuid16(0x00FF));
        // Balanced coexistence interval: 100ms~150ms (160*0.625ms = 100ms, 240*0.625ms = 150ms)
        // High discovery rate while guaranteeing Wi-Fi packet transmission without radio preemption
        adv.min_interval(160);
        adv.max_interval(240);
        adv.scan_response(true);
        let _ = adv.set_data(&mut adv_data);

        // Also set explicit Complete Local Name in Scan Response so modern active scanners always match
        let mut scan_rsp = vec![0u8; 2 + name.len()];
        scan_rsp[0] = (1 + name.len()) as u8;
        scan_rsp[1] = 0x09; // AD type 0x09: Complete Local Name
        scan_rsp[2..].copy_from_slice(name.as_bytes());
        let _ = adv.set_raw_scan_response_data(&scan_rsp);

        match adv.start() {
            Ok(_) => {
                *self.status.lock().unwrap() = BleStatus::Advertising;
                println!("  [ble-hardware] Started RF advertising as '{}' (Service 0x00FF, interval: 100~150ms)", name);
                info!("[BLE] Started RF advertising as '{}'", name);
            }
            Err(e) => {
                println!("  [ble-hardware] adv.start() error: {:?}, retrying after 100ms...", e);
                std::thread::sleep(std::time::Duration::from_millis(100));
                let _ = adv.stop();
                std::thread::sleep(std::time::Duration::from_millis(30));
                if let Err(e2) = adv.start() {
                    println!("  [ble-hardware] ERROR: adv.start() retry failed: {:?}", e2);
                } else {
                    *self.status.lock().unwrap() = BleStatus::Advertising;
                    println!("  [ble-hardware] Started RF advertising on retry as '{}'", name);
                }
            }
        }
    }

    pub fn stop_advertising(&self) {
        let device = BLEDevice::take();
        let advertising = device.get_advertising();
        let adv = advertising.lock();
        if adv.is_advertising() {
            let _ = adv.stop();
            println!("  [ble-hardware] Stopped RF advertising");
            info!("[BLE] Stopped RF advertising");
        }
        *self.status.lock().unwrap() = BleStatus::Off;
    }

    pub fn get_status(&self) -> BleStatus {
        *self.status.lock().unwrap()
    }

    pub fn get_status_str(&self) -> &'static str {
        self.get_status().as_str()
    }

    pub fn get_device_name(&self) -> String {
        self.device_name.lock().unwrap().clone()
    }

    pub fn get_wireless_mode(&self) -> String {
        self.wireless_mode.lock().unwrap().clone()
    }

    pub fn set_wireless_mode(&self, mode: &str) {
        let mut m = self.wireless_mode.lock().unwrap();
        *m = mode.to_string();
        match mode {
            "wifi_only" => {
                self.set_enabled(false);
            }
            "ble_only" => {
                crate::wifi::stop_softap();
                self.set_enabled(true);
            }
            "dual" => {
                self.set_enabled(true);
            }
            "auto" => {
                if crate::wifi::is_station_connected() {
                    self.stop_advertising();
                } else {
                    self.set_enabled(true);
                }
            }
            _ => {}
        }
    }

    pub fn set_enabled(&self, enabled: bool) {
        if enabled {
            let name = self.device_name.lock().unwrap().clone();
            self.setup_hardware_ble(&name);
        } else {
            self.stop_advertising();
            self.devices.lock().unwrap().clear();
        }
    }

    /// Called when Wi-Fi is successfully configured/connected to router.
    /// In 'wifi_only', shuts down BLE advertising.
    pub fn on_wifi_configured(&self) {
        let mode = self.wireless_mode.lock().unwrap().clone();
        if mode == "wifi_only" {
            println!("  [ble-hardware] Wireless mode is 'wifi_only'. Stopping BLE advertising...");
            self.stop_advertising();
        }
    }

    pub fn set_ip_info(&self, ip: &str, is_ap: bool) {
        *self.current_ip.lock().unwrap() = ip.to_string();
        *self.is_ap.lock().unwrap() = is_ap;
        self.notify_status();
    }

    pub fn get_ip_address(&self) -> String {
        self.current_ip.lock().unwrap().clone()
    }

    pub fn is_ap_mode(&self) -> bool {
        *self.is_ap.lock().unwrap()
    }

    pub fn notify_status(&self) {
        if let Some(ref tx) = *self.tx_char.lock().unwrap() {
            let ip = self.get_ip_address();
            let is_ap = self.is_ap_mode();
            let mode = self.get_wireless_mode();
            let authed = self.is_authorized.load(Ordering::SeqCst);
            let (pin_en, paired_count) = if let Some(ref ac) = *self.app_config.lock().unwrap() {
                let cfg = ac.lock().unwrap();
                (cfg.pin_pairing_enabled, cfg.trusted_devices.len())
            } else {
                (true, 0)
            };
            let json = format!(
                "STATUS:{{\"ip\":\"{}\",\"is_ap\":{},\"mode\":\"{}\",\"authed\":{},\"pin_pairing\":{},\"paired_count\":{}}}",
                ip, is_ap, mode, authed, pin_en, paired_count
            );
            println!("  [ble-tx] Notifying client status: {}", json);
            tx.lock().set_value(json.as_bytes());
            tx.lock().notify();
        }
    }

    pub fn notify_str(&self, text: &str) {
        if let Some(ref tx) = *self.tx_char.lock().unwrap() {
            tx.lock().set_value(text.as_bytes());
            tx.lock().notify();
        }
    }

    pub fn notify_bytes(&self, data: &[u8]) {
        if let Some(ref tx) = *self.tx_char.lock().unwrap() {
            tx.lock().set_value(data);
            tx.lock().notify();
        }
    }

    pub fn on_ble_client_connected(&self, name: &str, mac: &str, rssi: i8) -> String {
        let mut devs = self.devices.lock().unwrap();
        let id = format!("client-{:02x}", devs.len() + 1);
        devs.push(BleDeviceInfo {
            id: id.clone(),
            name: name.to_string(),
            mac: mac.to_string(),
            rssi,
            connected: true,
            connected_duration_secs: 0,
        });
        *self.status.lock().unwrap() = BleStatus::Connected;
        drop(devs);

        // Note: Do NOT call self.notify_status() here! The client has not subscribed to CCCD yet.
        // Status will be notified when the client writes 'status' to rx_char or polls.
        id
    }

    pub fn on_ble_client_disconnected_all(&self) {
        self.devices.lock().unwrap().clear();
        let mode = self.wireless_mode.lock().unwrap().clone();
        if mode == "auto" {
            if !crate::wifi::is_station_connected() {
                println!("  [ble-hardware] Smart Coexistence: BLE disconnected and Wi-Fi station not connected. Resuming SoftAP & BLE broadcast...");
                crate::wifi::restart_softap_if_needed();
                self.start_advertising();
            } else {
                println!("  [ble-hardware] Smart Coexistence: Wi-Fi station active, BLE remaining quiet.");
            }
        } else if mode != "wifi_only" {
            println!("  [ble-hardware] WebBLE Host disconnected: restarting RF advertising...");
            self.start_advertising();
        } else {
            *self.status.lock().unwrap() = BleStatus::Off;
        }
    }

    pub fn on_ble_client_disconnected(&self, id: &str) {
        let mut devs = self.devices.lock().unwrap();
        devs.retain(|d| d.id != id);
        if devs.is_empty() {
            drop(devs);
            let mode = self.wireless_mode.lock().unwrap().clone();
            if mode == "auto" {
                if !crate::wifi::is_station_connected() {
                    println!("  [ble-hardware] Smart Coexistence: Client '{}' disconnected. Resuming SoftAP & BLE broadcast...", id);
                    crate::wifi::restart_softap_if_needed();
                    self.start_advertising();
                } else {
                    println!("  [ble-hardware] Smart Coexistence: Wi-Fi station active, BLE remaining quiet.");
                }
            } else if mode != "wifi_only" {
                println!("  [ble-hardware] WebBLE Client '{}' disconnected: restarting RF advertising...", id);
                self.start_advertising();
            } else {
                *self.status.lock().unwrap() = BleStatus::Off;
            }
        }
    }

    pub fn get_device_list(&self) -> Vec<BleDeviceInfo> {
        self.devices.lock().unwrap().clone()
    }
}
