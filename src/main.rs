// src/main.rs — EPD Smart Display Firmware Main Entry Point

mod config;
mod ble;
mod display;
mod modes;
mod mqtt;
mod power;
mod scheduler;
pub mod storage;
mod web;
mod wifi;

use std::sync::{Arc, Mutex};
use std::thread::sleep;
use std::time::Duration;

use esp_idf_hal::gpio::{PinDriver, Pull};
use esp_idf_hal::peripherals::Peripherals;
use esp_idf_hal::spi::{config::Config as SpiConfig, SpiDeviceDriver, SpiDriver, SpiDriverConfig};
use esp_idf_svc::eventloop::EspSystemEventLoop;
use esp_idf_svc::log::EspLogger;
use esp_idf_svc::nvs::EspDefaultNvsPartition;
use log::info;

use crate::config::ConfigManager;
use crate::display::{EpdDriver, Framebuffer, PanelVersion};
use crate::modes::ModeContext;
use crate::scheduler::TaskScheduler;
use crate::web::WebServer;
use crate::wifi::{WifiManager, WifiModeStatus};

fn main() -> anyhow::Result<()> {
    // 1. Initialize system logger & event loop
    esp_idf_svc::sys::link_patches();
    EspLogger::initialize_default();
    log::set_max_level(log::LevelFilter::Info);
    println!("==================================================");
    println!("  3.98\" 4-Color E-Ink Smart Display (768x552)     ");
    println!("  Target: ESP32-C3 SuperMini | BWRY 4-Color Mode  ");
    println!("==================================================");
    info!("[SYSTEM] Booting EPD smart firmware...");

    let peripherals = Peripherals::take()?;

    let sys_loop = EspSystemEventLoop::take()?;
    let nvs_default = EspDefaultNvsPartition::take()?;

    // 2. Load persistent configuration from NVS
    let config_mgr = ConfigManager::new(nvs_default.clone())?;
    let app_config = config_mgr.load();
    let app_config = Arc::new(Mutex::new(app_config));
    let config_mgr = Arc::new(Mutex::new(config_mgr));

    // 3. Initialize hardware SPI and GPIO pins for EPD:
    //    SCK = GPIO 4, MOSI = GPIO 6, CS = GPIO 7, DC = GPIO 1, RST = GPIO 2, BUSY = GPIO 10
    info!("[INIT] Configuring SPI and EPD control GPIO pins...");
    let spi_driver = SpiDriver::new(
        peripherals.spi2,
        peripherals.pins.gpio4, // SCK
        peripherals.pins.gpio6, // MOSI
        None::<esp_idf_hal::gpio::AnyIOPin>,
        &SpiDriverConfig::default(),
    )?;

    let spi_config = SpiConfig::default().baudrate(esp_idf_hal::units::Hertz(8_000_000));
    let spi_device = SpiDeviceDriver::new(spi_driver, None::<esp_idf_hal::gpio::AnyOutputPin>, &spi_config)?;

    let cs = PinDriver::output(peripherals.pins.gpio7)?;
    let dc = PinDriver::output(peripherals.pins.gpio1)?;
    let rst = PinDriver::output(peripherals.pins.gpio2)?;
    let busy = PinDriver::input(peripherals.pins.gpio10, Pull::Up)?;

    let epd = EpdDriver::new(spi_device, cs, dc, rst, busy, PanelVersion::A0);
    let mut fb = Framebuffer::new();

    // Initialize Chinese font MMU mapping from 'font' / 'storage' partition
    crate::display::font::init_chinese_font();

    // Initialize SPIFFS filesystem on 'storage' partition (1.6MB for presets and user assets)
    crate::storage::init_spiffs();

    let (wireless_mode, _ble_enabled) = {
        let cfg = app_config.lock().unwrap();
        (cfg.wireless_mode.clone(), cfg.ble_enabled)
    };

    // 4 & 5. Initialize WiFi & Web Server (unless wireless_mode is 'ble_only')
    let (ip_addr, is_ap, ap_name, _web_server) = if wireless_mode == "ble_only" {
        println!("[WIFI] Wireless mode is 'ble_only': WiFi subsystem skipped to maximize BLE stability & battery.");
        ("0.0.0.0".to_string(), false, "EPD-Display-Setup".to_string(), None)
    } else {
        println!("[INIT] Initializing WiFi subsystem...");
        let (ip, ap, ap_ssid) = match WifiManager::new(peripherals.modem, sys_loop, Some(nvs_default)) {
            Ok(mut wifi_mgr) => {
                let wifi_status = wifi_mgr.start(&app_config.lock().unwrap());
                let res = match &wifi_status {
                    Ok(WifiModeStatus::StationConnected(ip)) => {
                        println!("[WIFI] Connected to Station. IP: {}", ip);
                        (ip.clone(), false, "".to_string())
                    }
                    Ok(WifiModeStatus::AccessPointActive(ap_ssid)) => {
                        println!("[WIFI] SoftAP Active: {} (IP: 192.168.4.1)", ap_ssid);
                        ("192.168.4.1".to_string(), true, ap_ssid.clone())
                    }
                    Err(e) => {
                        println!("[WIFI] Startup failed: {:?}. Fallback to AP mode.", e);
                        ("192.168.4.1".to_string(), true, "EPD-Display-Setup".to_string())
                    }
                };
                // Leak wifi_mgr to guarantee Wi-Fi driver & captive DNS never drop/stop!
                Box::leak(Box::new(wifi_mgr));
                res
            }
            Err(e) => {
                println!("[WIFI] WARNING: WifiManager::new failed: {:?}. Wi-Fi skipped, BLE active.", e);
                ("0.0.0.0".to_string(), false, "".to_string())
            }
        };

        // 4b. Initialize Bluetooth BLE 5.0 NimBLE subsystem & RF Coexistence (early to guarantee contiguous RAM)
        {
            let (w_mode, b_name, b_enabled) = {
                let cfg = app_config.lock().unwrap();
                (cfg.wireless_mode.clone(), cfg.ble_device_name.clone(), cfg.ble_enabled)
            };
            crate::ble::BleManager::global().init(
                &w_mode,
                &b_name,
                b_enabled,
                Some(config_mgr.clone()),
                Some(app_config.clone()),
            );
            crate::ble::BleManager::global().set_ip_info(&ip, ap);
            if !ap && !ip.is_empty() && ip != "0.0.0.0" {
                crate::ble::BleManager::global().on_wifi_configured();
            }
        }

        println!("[INIT] Starting Embedded Web Server & REST API on port 80 (IP: {})...", ip);
        let srv = match WebServer::start(config_mgr.clone(), app_config.clone(), ip.clone(), ap) {
            Ok(s) => {
                println!("[HTTP] Web Server successfully running on port 80!");
                Some(s)
            }
            Err(e) => {
                println!("[HTTP] WARNING: WebServer failed: {:?}. Continuing...", e);
                None
            }
        };
        // Start mDNS responder so http://epd-display.local resolves across local network
        if !ap && ip != "0.0.0.0" {
            if let Ok(ipv4) = ip.parse::<std::net::Ipv4Addr>() {
                crate::wifi::mdns::start_mdns("epd-display", ipv4);
            }
        }

        (ip, ap, ap_ssid, srv)
    };

    // 6. Start MQTT client (in Station mode only, and not in ble_only mode)
    if !is_ap && wireless_mode != "ble_only" {
        let mac_str = {
            let mut mac = [0u8; 6];
            unsafe { esp_idf_svc::sys::esp_efuse_mac_get_default(mac.as_mut_ptr()) };
            format!("{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5])
        };
        let mac_suffix = {
            let mut mac = [0u8; 6];
            unsafe { esp_idf_svc::sys::esp_efuse_mac_get_default(mac.as_mut_ptr()) };
            format!("{:02x}{:02x}", mac[4], mac[5])
        };
        crate::mqtt::start_mqtt_service(
            config_mgr.clone(),
            app_config.clone(),
            ip_addr.clone(),
            mac_str,
            mac_suffix,
        );
    }

    // 8. Render Initial Screen into Framebuffer
    // E-ink is bistable: screen physically retains the image indefinitely without power!
    // Never refresh on boot unless:
    // a) Chip booted from brownout (undervoltage detected: must overlay low battery warning!)
    // b) Unconfigured (first boot)
    // c) Unconfigured (first boot): show Welcome Screen with project repo & dual Wi-Fi/BLE guides
    // d) In SoftAP mode (configured previously, but fell back to AP)
    let is_brownout = crate::power::PowerManager::check_undervoltage_on_boot();
    let is_configured = config_mgr.lock().unwrap().is_configured();
    crate::display::set_unconfigured(!is_configured);
    println!("[CONFIG] Device is_configured: {}", is_configured);

    let saved_screen_crc = app_config.lock().unwrap().last_screen_crc;
    let ble_name = app_config.lock().unwrap().ble_device_name.clone();

    let initial_check_crc = if is_brownout {
        println!("⚠️ [DISPLAY] BROWNOUT DETECTED! Overlaying low battery warning card on current screen...");
        crate::display::overlay_low_battery_warning(&mut fb);
        true
    } else if !is_configured {
        println!("[DISPLAY] Unconfigured device detected: rendering Welcome Screen with dual Wi-Fi/BLE guidance...");
        crate::modes::provisioning::render_welcome_screen(&mut fb, &ap_name, "192.168.4.1", &ble_name);
        true
    } else if is_ap {
        println!("[DISPLAY] Rendering SoftAP Chinese guidance screen (SSID: {})...", ap_name);
        crate::modes::provisioning::render_waiting_setup(&mut fb, &ap_name, "192.168.4.1");
        true
    } else {
        let mut ctx = ModeContext::default();
        ctx.ip_str = ip_addr.clone();
        ctx.wifi_ssid = app_config.lock().unwrap().wifi_ssid.clone();

        if saved_screen_crc == 0 {
            // Wi-Fi provisioned / first boot: render clean modern MicroPython demo layout with WebUI URL
            println!("[DISPLAY] Wi-Fi provisioned / First boot: rendering initial demo layout...");
            crate::modes::demo_layout::render_demo_layout(&mut fb, &ctx);
            true
        } else {
            // Normal boot / power restored: preserve bistable e-ink image with ZERO flicker!
            println!("[DISPLAY] Normal boot: e-ink bistable image preserved (CRC: 0x{:08X}). ZERO flicker startup!", saved_screen_crc);
            false
        }
    };

    // 9. Run Display Event Loop on main task (0 extra threads, 0 bytes heap allocated)
    println!("[SYSTEM] Initialization complete. All background services operational.");
    println!("[DISPLAY] Entering display event loop on main task (initial_check_crc: {})...", initial_check_crc);
    crate::display::run_display_loop(epd, fb, config_mgr, app_config, ip_addr, initial_check_crc);
}
