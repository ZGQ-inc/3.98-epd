// src/wifi/mod.rs — WiFi Network Manager (AP & STA Modes)

pub mod captive;
pub mod mdns;

use embedded_svc::wifi::{AccessPointConfiguration, AuthMethod, ClientConfiguration, Configuration};
use esp_idf_hal::modem::Modem;
use esp_idf_svc::eventloop::EspSystemEventLoop;
use esp_idf_svc::handle::RawHandle;
use esp_idf_svc::nvs::EspDefaultNvsPartition;

use esp_idf_svc::wifi::{BlockingWifi, EspWifi, WifiDeviceId};
use log::{error, info, warn};

use std::sync::atomic::{AtomicBool, Ordering};
use crate::config::AppConfig;
use crate::wifi::captive::CaptivePortalDns;

static IS_SOFTAP_RUNNING: AtomicBool = AtomicBool::new(false);
static IS_STATION_CONNECTED: AtomicBool = AtomicBool::new(false);

pub fn is_softap_active() -> bool {
    IS_SOFTAP_RUNNING.load(Ordering::SeqCst)
}

pub fn is_station_connected() -> bool {
    IS_STATION_CONNECTED.load(Ordering::SeqCst)
}

pub fn stop_softap() {
    if IS_SOFTAP_RUNNING.swap(false, Ordering::SeqCst) {
        println!("[WIFI] Smart Coexistence: Shutting down SoftAP hotspot beacon...");
        unsafe {
            let _ = esp_idf_svc::sys::esp_wifi_stop();
            let _ = esp_idf_svc::sys::esp_wifi_set_mode(esp_idf_svc::sys::wifi_mode_t_WIFI_MODE_NULL);
        }
        println!("[WIFI] SoftAP hotspot terminated. Wi-Fi radio quiet.");
    }
}

pub fn restart_softap_if_needed() {
    if !IS_STATION_CONNECTED.load(Ordering::SeqCst) && !IS_SOFTAP_RUNNING.load(Ordering::SeqCst) {
        println!("[WIFI] Smart Coexistence: Resuming SoftAP hotspot broadcast...");
        unsafe {
            let _ = esp_idf_svc::sys::esp_wifi_set_mode(esp_idf_svc::sys::wifi_mode_t_WIFI_MODE_AP);
            let _ = esp_idf_svc::sys::esp_wifi_start();
        }
        IS_SOFTAP_RUNNING.store(true, Ordering::SeqCst);
        println!("[WIFI] SoftAP hotspot broadcast resumed.");
    }
}

pub enum WifiModeStatus {
    StationConnected(String), // IP Address
    AccessPointActive(String), // AP SSID
}

pub struct WifiManager<'a> {
    wifi: BlockingWifi<EspWifi<'a>>,
    captive_dns: Option<CaptivePortalDns>,
}

impl<'a> WifiManager<'a> {
    pub fn new(
        modem: Modem<'a>,
        sys_loop: EspSystemEventLoop,
        nvs: Option<EspDefaultNvsPartition>,
    ) -> anyhow::Result<Self> {
        let esp_wifi = EspWifi::new(modem, sys_loop.clone(), nvs)?;
        let wifi = BlockingWifi::wrap(esp_wifi, sys_loop.clone())?;

        // Register automatic Wi-Fi reconnection on disconnect
        if let Ok(sub) = sys_loop.subscribe::<esp_idf_svc::wifi::WifiEvent, _>(|event| {
            if let esp_idf_svc::wifi::WifiEvent::StaDisconnected(_) = event {
                println!("[WIFI] Disconnected from AP. Auto-reconnecting...");
                unsafe { esp_idf_svc::sys::esp_wifi_connect() };
            }
        }) {
            Box::leak(Box::new(sub));
        }

        Ok(Self {
            wifi,
            captive_dns: None,
        })
    }

    /// Initializes WiFi according to configuration:
    /// - If SSID is empty: Starts SoftAP mode and Captive Portal.
    /// - If SSID is present: Connects to STA. Falls back to SoftAP on failure.
    pub fn start(&mut self, config: &AppConfig) -> anyhow::Result<WifiModeStatus> {
        if config.wifi_ssid.is_empty() {
            info!("[WIFI] No WiFi credentials configured. Starting SoftAP mode...");
            self.start_softap()
        } else {
            info!("[WIFI] Attempting connection to SSID: '{}'...", config.wifi_ssid);
            match self.start_sta(&config.wifi_ssid, &config.wifi_pass) {
                Ok(ip) => Ok(WifiModeStatus::StationConnected(ip)),
                Err(e) => {
                    warn!("[WIFI] Failed to connect to '{}' ({:?}). Falling back to SoftAP mode.", config.wifi_ssid, e);
                    self.start_softap()
                }
            }
        }
    }

    fn start_softap(&mut self) -> anyhow::Result<WifiModeStatus> {
        let mac = self.wifi.wifi().get_mac(WifiDeviceId::Ap)?;
        let ap_ssid = format!("EPD-Display-{:02X}{:02X}", mac[4], mac[5]);

        let ap_config = Configuration::AccessPoint(AccessPointConfiguration {
            ssid: heapless::String::try_from(ap_ssid.as_str()).unwrap_or_default(),
            channel: 6,
            auth_method: AuthMethod::None,
            max_connections: 4,
            ..Default::default()
        });

        self.wifi.set_configuration(&ap_config)?;
        self.wifi.start()?;
        println!("[WIFI] Waiting for SoftAP netif up...");
        self.wifi.wait_netif_up()?;

        // Explicitly enforce 192.168.4.1 IP and DHCP server settings on the AP netif
        let ap_handle = self.wifi.wifi().ap_netif().handle();
        unsafe {
            let _ = esp_idf_svc::sys::esp_netif_dhcps_stop(ap_handle);
            let mut ip_info: esp_idf_svc::sys::esp_netif_ip_info_t = std::mem::zeroed();
            ip_info.ip.addr = u32::from_ne_bytes([192, 168, 4, 1]);
            ip_info.gw.addr = u32::from_ne_bytes([192, 168, 4, 1]);
            ip_info.netmask.addr = u32::from_ne_bytes([255, 255, 255, 0]);
            let _ = esp_idf_svc::sys::esp_netif_set_ip_info(ap_handle, &ip_info);
            let _ = esp_idf_svc::sys::esp_netif_dhcps_start(ap_handle);
        }
        println!("[WIFI] SoftAP netif configured and DHCP server active: {}", ap_ssid);

        // Start Captive Portal DNS
        match CaptivePortalDns::start() {
            Ok(dns) => self.captive_dns = Some(dns),
            Err(e) => error!("[WIFI] Failed to start captive portal DNS: {:?}", e),
        }

        IS_SOFTAP_RUNNING.store(true, Ordering::SeqCst);
        IS_STATION_CONNECTED.store(false, Ordering::SeqCst);
        Ok(WifiModeStatus::AccessPointActive(ap_ssid))
    }


    fn start_sta(&mut self, ssid: &str, pass: &str) -> anyhow::Result<String> {
        let sta_config = Configuration::Client(ClientConfiguration {
            ssid: heapless::String::try_from(ssid).map_err(|_| anyhow::anyhow!("SSID too long"))?,
            password: heapless::String::try_from(pass).map_err(|_| anyhow::anyhow!("Password too long"))?,
            auth_method: if pass.is_empty() { AuthMethod::None } else { AuthMethod::WPA2Personal },
            ..Default::default()
        });

        self.wifi.set_configuration(&sta_config)?;
        self.wifi.start()?;
        self.wifi.connect()?;
        self.wifi.wait_netif_up()?;

        // Disable modem power save to ensure instant network responsiveness & explicitly force STA mode
        unsafe {
            let ap_handle = self.wifi.wifi().ap_netif().handle();
            let _ = esp_idf_svc::sys::esp_netif_dhcps_stop(ap_handle);
            let _ = esp_idf_svc::sys::esp_wifi_set_mode(esp_idf_svc::sys::wifi_mode_t_WIFI_MODE_STA);
            let _ = esp_idf_svc::sys::esp_wifi_set_ps(esp_idf_svc::sys::wifi_ps_type_t_WIFI_PS_NONE);
        };

        IS_SOFTAP_RUNNING.store(false, Ordering::SeqCst);
        IS_STATION_CONNECTED.store(true, Ordering::SeqCst);

        let ip_info = self.wifi.wifi().sta_netif().get_ip_info()?;
        let ip_str = ip_info.ip.to_string();
        info!("[WIFI] Connected! Assigned IP: {}", ip_str);

        Ok(ip_str)
    }
}
