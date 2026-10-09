// src/ble/mod.rs — Native Bluetooth Low Energy (BLE 5.0 NimBLE) & Wireless Coexistence Manager

use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use serde::{Deserialize, Serialize};
use log::info;
use esp32_nimble::{
    BLEDevice, BLECharacteristic, BLEAdvertisementData, NimbleProperties,
    utilities::{BleUuid, mutex::Mutex as NimbleMutex},
    enums::{PowerType, PowerLevel},
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
    tx_char: Mutex<Option<Arc<NimbleMutex<BLECharacteristic>>>>,
    config_mgr: Mutex<Option<Arc<Mutex<crate::config::ConfigManager>>>>,
    app_config: Mutex<Option<Arc<Mutex<crate::config::AppConfig>>>>,
}

static GLOBAL_BLE: Mutex<Option<Arc<BleManager>>> = Mutex::new(None);
static STREAM_OFFSET: AtomicUsize = AtomicUsize::new(0);

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
        ble_enabled: bool,
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
        } else if mode_str == "auto" || mode_str == "dual" || mode_str == "ble_only" {
            true
        } else {
            ble_enabled
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

        let ret = unsafe { esp_idf_sys::nimble_port_init() };
        if ret != 0 {
            println!("  [ble-hardware] ERROR: nimble_port_init failed (ret={}), skipping BLEDevice::take()", ret);
            return;
        }

        let device = BLEDevice::take();
        device.set_power(PowerType::Default, PowerLevel::P9).ok();
        BLEDevice::set_device_name(name).ok();

        // Configure BLE Security for seamless pairing (supporting both Legacy & Secure Connections)
        device.security()
            .set_auth(esp32_nimble::enums::AuthReq::Bond | esp32_nimble::enums::AuthReq::Sc)
            .set_io_cap(esp32_nimble::enums::SecurityIOCap::NoInputNoOutput)
            .resolve_rpa();

        let server = device.get_server();
        server.on_confirm_pin(|_pin| true);
        server.on_passkey_request(|| 0);
        server.on_connect(|_server, desc| {
            let peer_mac = desc.address().to_string();
            println!("  [ble-hardware] WebBLE Host connected: {}", peer_mac);
            info!("[BLE] WebBLE Host connected: {}", peer_mac);
            BleManager::global().on_ble_client_connected("WebBLE Client", &peer_mac, 0);
        }).on_disconnect(|_desc, reason| {
            println!("  [ble-hardware] WebBLE Host disconnected: {:?}", reason);
            info!("[BLE] WebBLE Host disconnected: {:?}", reason);
            BleManager::global().on_ble_client_disconnected_all();
        });

        // ── Custom GATT Service (0x00FF) ───────────────────────────────────────
        let service = server.create_service(BleUuid::from_uuid16(0x00FF));

        // RX Characteristic (0xFF01): WRITE | WRITE_NO_RSP
        let rx_char = service.lock().create_characteristic(
            BleUuid::from_uuid16(0xFF01),
            NimbleProperties::WRITE | NimbleProperties::WRITE_NO_RSP,
        );

        rx_char.lock().on_write(|args| {
            let data = args.recv_data();
            if data.is_empty() { return; }

            // Check if string command or JSON
            if data[0] == b'{' || data.starts_with(b"refresh") || data.starts_with(b"mode:") || data.starts_with(b"wireless:") || data.starts_with(b"clear:") || data.starts_with(b"status") || data.starts_with(b"get_") {
                STREAM_OFFSET.store(0, Ordering::Relaxed);
                if let Ok(text) = std::str::from_utf8(data) {
                    let text = text.trim();
                    println!("  [ble-rx] Received text command: '{}'", text);
                    if text == "refresh" {
                        crate::display::request_refresh(true);
                    } else if text.starts_with("mode:") {
                        let m = &text[5..];
                        crate::display::request_mode(m.to_string());
                    } else if text.starts_with("wireless:") {
                        let m = &text[9..];
                        println!("  [ble-rx] Wireless mode switch requested: '{}'", m);
                        let ble_self = BleManager::global();
                        let mut saved = false;
                        if let Some(ref ac) = *ble_self.app_config.lock().unwrap() {
                            let mut cfg = ac.lock().unwrap();
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
                        if saved {
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
                    } else if text == "status" || text == "get_ip" || text == "get_status" {
                        BleManager::global().notify_status();
                    } else if text == "clear:white" {
                        crate::display::request_refresh(true);
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
            let curr = STREAM_OFFSET.load(Ordering::Relaxed);
            let written = crate::display::framebuffer::write_raw_chunk(curr, data);
            let next = curr + written;
            STREAM_OFFSET.store(next, Ordering::Relaxed);
            if next >= crate::display::TOTAL_BUFFER_SIZE {
                println!("  [ble-rx] 2bpp Framebuffer complete ({} bytes)! Triggering physical refresh...", next);
                STREAM_OFFSET.store(0, Ordering::Relaxed);
                crate::display::request_direct_bitmap();
            }
        });

        // TX Characteristic (0xFF02): READ | NOTIFY
        let tx_char = service.lock().create_characteristic(
            BleUuid::from_uuid16(0xFF02),
            NimbleProperties::READ | NimbleProperties::NOTIFY,
        );
        tx_char.lock().set_value(b"EPD_ONLINE");
        *self.tx_char.lock().unwrap() = Some(tx_char);

        // ── Device Information Service (0x180A) ─────────────────────────────────
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
        }

        let name = self.device_name.lock().unwrap().clone();
        let mut adv_data = BLEAdvertisementData::new();
        adv_data.name(&name);
        adv_data.add_service_uuid(BleUuid::from_uuid16(0x00FF));
        let _ = adv.set_data(&mut adv_data);
        let _ = adv.start();

        *self.status.lock().unwrap() = BleStatus::Advertising;
        println!("  [ble-hardware] Started RF advertising as '{}' (Service 0x00FF)", name);
        info!("[BLE] Started RF advertising as '{}'", name);
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
            "ble_only" | "dual" | "auto" => {
                self.set_enabled(true);
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
    /// Only in 'wifi_only' does it shut down BLE.
    pub fn on_wifi_configured(&self) {
        let mode = self.wireless_mode.lock().unwrap().clone();
        if mode == "wifi_only" {
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
            let json = format!("STATUS:{{\"ip\":\"{}\",\"is_ap\":{},\"mode\":\"{}\"}}", ip, is_ap, mode);
            println!("  [ble-tx] Notifying client status: {}", json);
            tx.lock().set_value(json.as_bytes());
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
        self.notify_status();
        id
    }

    pub fn on_ble_client_disconnected_all(&self) {
        self.devices.lock().unwrap().clear();
        let mode = self.wireless_mode.lock().unwrap().clone();
        if mode != "wifi_only" {
            *self.status.lock().unwrap() = BleStatus::Advertising;
        } else {
            *self.status.lock().unwrap() = BleStatus::Off;
        }
    }

    pub fn on_ble_client_disconnected(&self, id: &str) {
        let mut devs = self.devices.lock().unwrap();
        devs.retain(|d| d.id != id);
        if devs.is_empty() {
            let mode = self.wireless_mode.lock().unwrap().clone();
            if mode != "wifi_only" {
                *self.status.lock().unwrap() = BleStatus::Advertising;
            } else {
                *self.status.lock().unwrap() = BleStatus::Off;
            }
        }
    }

    pub fn get_device_list(&self) -> Vec<BleDeviceInfo> {
        self.devices.lock().unwrap().clone()
    }
}
