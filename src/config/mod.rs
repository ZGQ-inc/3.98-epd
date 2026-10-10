// src/config/mod.rs — NVS Persistent Configuration

use esp_idf_svc::nvs::{EspDefaultNvsPartition, EspNvs, NvsDefault};
use log::{info, warn};
use serde::{Deserialize, Serialize};

const NVS_NAMESPACE: &str = "epd_cfg";
const CONFIG_KEY: &str = "sys_config";

fn default_true() -> bool {
    true
}

fn default_wireless_mode() -> String {
    "auto".to_string()
}

fn default_ble_device_name() -> String {
    "EPD-Smart-Display".to_string()
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub wifi_ssid: String,
    pub wifi_pass: String,
    pub device_name: String,
    pub mqtt_broker: String,
    pub mqtt_port: u16,
    pub openweather_key: String,
    pub openweather_city: String,
    pub current_mode: String,
    pub heartbeat_mode: bool,
    pub auto_refresh: bool,
    pub refresh_interval_mins: u32,
    #[serde(default)]
    pub last_screen_crc: u32,
    #[serde(default, skip_serializing)]
    pub custom_layout_json: String,
    #[serde(default, skip_serializing)]
    pub mode_params_json: String,
    #[serde(default)]
    pub mqtt_user: String,
    #[serde(default)]
    pub mqtt_pass: String,
    #[serde(default)]
    pub screen_debug: bool,
    #[serde(default = "default_wireless_mode")]
    pub wireless_mode: String,
    #[serde(default = "default_true")]
    pub ble_enabled: bool,
    #[serde(default = "default_ble_device_name")]
    pub ble_device_name: String,
    #[serde(default)]
    pub fridge_title: String,
    #[serde(default)]
    pub fridge_text: String,
    #[serde(default)]
    pub fridge_author: String,
    #[serde(default)]
    pub memo_text: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            wifi_ssid: String::new(),
            wifi_pass: String::new(),
            device_name: "EPD-Smart-Display".to_string(),
            mqtt_broker: String::new(),
            mqtt_port: 1883,
            mqtt_user: String::new(),
            mqtt_pass: String::new(),
            screen_debug: false,
            wireless_mode: "auto".to_string(),
            ble_enabled: true,
            ble_device_name: "EPD-Smart-Display".to_string(),
            fridge_title: "家庭核心留言板".to_string(),
            fridge_text: "冰箱冷藏室温度良好，记得晚上回家买鲜奶和全麦面包！".to_string(),
            fridge_author: "爸爸".to_string(),
            memo_text: "出门记得关阳台窗户\n晚饭煮番茄牛腩面\n晚上 9 点检查作业".to_string(),
            openweather_key: String::new(),
            openweather_city: "Shenzhen".to_string(),
            current_mode: "demo".to_string(),
            heartbeat_mode: false,
            auto_refresh: true,
            refresh_interval_mins: 60,
            last_screen_crc: 0,
            custom_layout_json: String::new(),
            mode_params_json: String::new(),
        }
    }
}

pub struct ConfigManager {
    nvs: EspNvs<NvsDefault>,
}

impl ConfigManager {
    pub fn new(nvs_partition: EspDefaultNvsPartition) -> anyhow::Result<Self> {
        let nvs = EspNvs::new(nvs_partition, NVS_NAMESPACE, true)?;
        Ok(Self { nvs })
    }

    /// Check whether a persistent configuration exists in NVS (e.g. Wi-Fi configured or BLE-only set).
    pub fn is_configured(&self) -> bool {
        let mut buf = vec![0u8; 4096];
        match self.nvs.get_blob(CONFIG_KEY, &mut buf) {
            Ok(Some(slice)) => {
                if let Ok(cfg) = serde_json::from_slice::<AppConfig>(slice) {
                    !cfg.wifi_ssid.is_empty() || cfg.wireless_mode == "ble_only"
                } else {
                    false
                }
            }
            _ => false,
        }
    }

    /// Load config from NVS, or fallback to default if not yet provisioned.
    pub fn load(&self) -> AppConfig {
        let mut buf = vec![0u8; 4096];
        let mut cfg = match self.nvs.get_blob(CONFIG_KEY, &mut buf) {
            Ok(Some(slice)) => match serde_json::from_slice::<AppConfig>(slice) {
                Ok(mut c) => {
                    info!("[CONFIG] Configuration loaded successfully from NVS.");
                    if c.wireless_mode.is_empty() {
                        c.wireless_mode = "auto".to_string();
                    }
                    if c.ble_device_name.is_empty() {
                        c.ble_device_name = "EPD-Smart-Display".to_string();
                    }
                    if c.wireless_mode == "wifi_only" {
                        c.ble_enabled = false;
                    } else if c.wireless_mode == "auto" || c.wireless_mode == "dual" || c.wireless_mode == "ble_only" {
                        c.ble_enabled = true;
                    }
                    c
                }
                Err(e) => {
                    warn!("[CONFIG] JSON parse failed: {:?}. Using default config.", e);
                    AppConfig::default()
                }
            },
            _ => AppConfig::default(),
        };

        // Load screen CRC from dedicated hardware u32 entry (0 heap allocations)
        if let Ok(Some(crc)) = self.nvs.get_u32("last_crc") {
            cfg.last_screen_crc = crc;
        }
        cfg
    }

    /// Save CRC directly to dedicated u32 key in NVS (0 bytes heap allocated)
    pub fn save_crc(&mut self, crc: u32) -> anyhow::Result<()> {
        let _ = self.nvs.set_u32("last_crc", crc);
        Ok(())
    }

    /// Save config to NVS with pre-allocated buffer (no heap re-allocations)
    pub fn save(&mut self, config: &AppConfig) -> anyhow::Result<()> {
        let data = serde_json::to_vec(config)?;
        self.nvs.set_blob(CONFIG_KEY, &data)?;
        let _ = self.nvs.set_u32("last_crc", config.last_screen_crc);
        info!("[CONFIG] Configuration saved to NVS ({} bytes).", data.len());
        Ok(())
    }
}
