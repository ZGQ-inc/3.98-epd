// src/web/api.rs — REST API Request/Response Data Structures

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct SystemStatusResponse {
    pub free_heap: usize,
    pub min_free_heap: usize,
    pub uptime_secs: u64,
    pub wifi_mode: String,
    pub wifi_rssi: i32,
    pub ip_address: String,
    pub current_mode: String,
    pub heartbeat_mode: bool,
    pub screen_debug: bool,
    pub panel_model: &'static str,
    pub resolution: &'static str,
    // Storage partition statistics
    pub flash_chip_size: usize,
    pub factory_partition_size: usize,
    pub factory_used_bytes: usize,
    pub storage_partition_size: usize,
    pub storage_free_bytes: usize,
    pub nvs_size: usize,
    pub nvs_used_bytes: usize,
    // Chip details
    pub chip_model: &'static str,
    pub cpu_freq_mhz: u32,
    pub mac_address: String,
    pub battery_low: bool,
    pub reset_reason: String,
    // Wireless & BLE Coexistence
    pub wireless_mode: String,
    pub ble_enabled: bool,
    pub ble_status: &'static str,
    pub ble_device_name: String,
    pub ble_devices: Vec<crate::ble::BleDeviceInfo>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WifiProvisionRequest {
    pub ssid: String,
    pub password: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse {
    pub success: bool,
    pub message: String,
}

impl ApiResponse {
    pub fn ok(msg: &str) -> Self {
        Self {
            success: true,
            message: msg.to_string(),
        }
    }

    pub fn err(msg: &str) -> Self {
        Self {
            success: false,
            message: msg.to_string(),
        }
    }
}
