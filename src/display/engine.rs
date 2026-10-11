// src/display/engine.rs — Asynchronous Display Worker & State Pipeline
//
// Manages the 15~16s EPD full waveform refresh asynchronously:
// - Deserializes display commands from WebUI, MQTT, and Task Scheduler.
// - Compares current Framebuffer CRC against NVS persistent CRC to avoid
//   unnecessary physical flashing on boot or duplicate requests.
// - Safely executes SPI transmission in a dedicated worker thread.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{sync_channel, SyncSender};
use std::sync::{Arc, Mutex};


use crate::config::{AppConfig, ConfigManager};
use crate::display::{
    color::BwryColor,
    crc::compute_fb_crc,
    driver::EpdDriver,
    framebuffer::Framebuffer,
};
use crate::modes::{render_mode, ModeContext};
use crate::modes::custom_layout::CustomLayoutRenderer;

/// Overlays a ~20px high-contrast status bar at the bottom of the screen displaying IP and MAC address.
pub fn overlay_debug_bar(fb: &mut Framebuffer, ip_addr: &str) {
    let mut mac = [0u8; 6];
    unsafe { esp_idf_svc::sys::esp_efuse_mac_get_default(mac.as_mut_ptr()) };
    let mac_str = format!("{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    // Bottom 24px bar: Y = 528..552
    fb.fill_rect(0, 528, 768, 24, BwryColor::Black);
    fb.hline(0, 528, 768, BwryColor::Yellow);

    let ble_str = crate::ble::BleManager::global().get_status_str();
    let debug_text = format!("IP: {}  |  BLE: {}  |  MAC: {}  |  DEBUG", ip_addr, ble_str, mac_str);
    crate::display::font::draw_chinese_text_centered(fb, 532, &debug_text, BwryColor::White, 1);
}

/// Overlays a modal dialog card in the center of the screen warning of severe undervoltage / low battery.
pub fn overlay_low_battery_warning(fb: &mut Framebuffer) {
    let card_w = 620;
    let card_h = 280;
    let card_x = (768 - card_w) / 2; // 74
    let card_y = (552 - card_h) / 2; // 136

    // Drop shadow (8px black offset)
    fb.fill_rect(card_x + 8, card_y + 8, card_w, card_h, BwryColor::Black);

    // Card body background (White)
    fb.fill_rect(card_x, card_y, card_w, card_h, BwryColor::White);

    // Red outer border (4px)
    fb.rect(card_x, card_y, card_w, card_h, BwryColor::Red);
    fb.rect(card_x + 1, card_y + 1, card_w - 2, card_h - 2, BwryColor::Red);
    fb.rect(card_x + 2, card_y + 2, card_w - 4, card_h - 4, BwryColor::Red);
    fb.rect(card_x + 3, card_y + 3, card_w - 6, card_h - 6, BwryColor::Red);

    // Yellow inner accent border (2px)
    fb.rect(card_x + 4, card_y + 4, card_w - 8, card_h - 8, BwryColor::Yellow);
    fb.rect(card_x + 5, card_y + 5, card_w - 10, card_h - 10, BwryColor::Yellow);

    // Header banner (Yellow)
    let header_h = 42;
    fb.fill_rect(card_x + 6, card_y + 6, card_w - 12, header_h, BwryColor::Yellow);
    crate::display::font::draw_chinese_text(
        fb,
        card_x + 18,
        card_y + 14,
        "[!] 电池电量极低告警 (LOW BATTERY WARNING)",
        BwryColor::Red,
        1,
    );

    // Battery outline icon on the left
    let bx = card_x + 32;
    let by = card_y + 66;
    // Terminal cap
    fb.fill_rect(bx + 16, by - 8, 24, 8, BwryColor::Red);
    // Outer shell
    fb.rect(bx, by, 56, 104, BwryColor::Red);
    fb.rect(bx + 1, by + 1, 54, 102, BwryColor::Red);
    // Bottom red slice indicating low charge
    fb.fill_rect(bx + 6, by + 78, 44, 20, BwryColor::Red);
    // '!' inside
    crate::display::font::draw_chinese_text(fb, bx + 22, by + 28, "!", BwryColor::Red, 2);

    // Main alert texts
    let tx = card_x + 112;
    crate::display::font::draw_chinese_text(
        fb,
        tx,
        card_y + 62,
        "系统检测到电源严重欠压 / 电池濒临耗尽",
        BwryColor::Red,
        1,
    );
    crate::display::font::draw_chinese_text(
        fb,
        tx,
        card_y + 96,
        "为保护锂电池防止过放损坏，已暂停高功耗联网操作",
        BwryColor::Black,
        1,
    );
    crate::display::font::draw_chinese_text(
        fb,
        tx,
        card_y + 128,
        "请及时连接 Type-C 充电器为设备充饱电！",
        BwryColor::Red,
        1,
    );

    // Yellow separator line
    fb.hline(card_x + 20, card_y + 182, card_w - 40, BwryColor::Yellow);

    // Footnotes
    crate::display::font::draw_chinese_text(
        fb,
        card_x + 24,
        card_y + 196,
        "• 检测机制: ESP32-C3 内部硬件欠压探测器 (BOD Reset / Level 7 临界监控)",
        BwryColor::Black,
        1,
    );
    crate::display::font::draw_chinese_text(
        fb,
        card_x + 24,
        card_y + 222,
        "• 墨水屏双稳态特性: 当前提示已物理保持在屏幕上，断电永不消失",
        BwryColor::Black,
        1,
    );
    crate::display::font::draw_chinese_text(
        fb,
        card_x + 24,
        card_y + 248,
        "• 充饱电后请按复位键 (RST) 或重新插拔电源即可恢复正常工作",
        BwryColor::Black,
        1,
    );
}

pub enum DisplayCommand {
    /// Refresh current active mode or saved layout (optionally forcing full physical refresh)
    RefreshCurrent { force: bool },
    /// Switch to a new scene mode and refresh
    SwitchMode(String),
    /// Render a Fabric.js custom layout JSON
    RenderLayout(String),
    /// Transmit direct 1:1 pixel bitmap written to static buffer
    DirectBitmap,
    /// Overlay low battery warning card and trigger full refresh
    LowBatteryWarning,
    /// Clear the entire screen to 100% pure white
    ClearWhite,
    /// Clear the entire screen to designated BWRY color
    ClearColor(BwryColor),
    /// Render first boot welcome screen with project URL & dual guides
    ShowWelcome { ap_ssid: String, ap_ip: String, ble_name: String },
    /// Render Wi-Fi connected guide demo layout
    ShowWifiDemo { ip: String, ssid: String },
    /// Render PWA studio guidance screen after BLE connection
    ShowPwaGuide { client_name: String, client_mac: String },
}

static DISPLAY_SENDER: Mutex<Option<SyncSender<DisplayCommand>>> = Mutex::new(None);
static IS_UNCONFIGURED: AtomicBool = AtomicBool::new(false);

/// Returns true if the device is currently in the unconfigured / first boot state.
pub fn is_unconfigured() -> bool {
    IS_UNCONFIGURED.load(Ordering::SeqCst)
}

/// Sets whether the device is in the unconfigured / first boot state.
pub fn set_unconfigured(v: bool) {
    IS_UNCONFIGURED.store(v, Ordering::SeqCst);
}

/// Submits a request to refresh the current display mode (non-blocking).
pub fn request_refresh(force: bool) -> bool {
    if let Ok(guard) = DISPLAY_SENDER.lock() {
        if let Some(ref tx) = *guard {
            return tx.try_send(DisplayCommand::RefreshCurrent { force }).is_ok();
        }
    }
    false
}

/// Submits a request to clear the entire screen to 100% pure white (non-blocking).
pub fn request_clear_white() -> bool {
    if let Ok(guard) = DISPLAY_SENDER.lock() {
        if let Some(ref tx) = *guard {
            return tx.try_send(DisplayCommand::ClearWhite).is_ok();
        }
    }
    false
}

/// Submits a request to clear the entire screen to designated BWRY color (non-blocking).
pub fn request_clear_color(color: BwryColor) -> bool {
    if let Ok(guard) = DISPLAY_SENDER.lock() {
        if let Some(ref tx) = *guard {
            return tx.try_send(DisplayCommand::ClearColor(color)).is_ok();
        }
    }
    false
}

/// Submits a request to clear the entire screen to 100% pure yellow (non-blocking).
pub fn request_clear_yellow() -> bool {
    request_clear_color(BwryColor::Yellow)
}

/// Submits a request to render the first boot welcome screen (non-blocking).
pub fn request_welcome(ap_ssid: String, ap_ip: String, ble_name: String) -> bool {
    if let Ok(guard) = DISPLAY_SENDER.lock() {
        if let Some(ref tx) = *guard {
            return tx.try_send(DisplayCommand::ShowWelcome { ap_ssid, ap_ip, ble_name }).is_ok();
        }
    }
    false
}

/// Submits a request to render the Wi-Fi connected guide demo screen (non-blocking).
pub fn request_wifi_demo(ip: String, ssid: String) -> bool {
    if let Ok(guard) = DISPLAY_SENDER.lock() {
        if let Some(ref tx) = *guard {
            return tx.try_send(DisplayCommand::ShowWifiDemo { ip, ssid }).is_ok();
        }
    }
    false
}

/// Submits a request to render the PWA studio guidance screen after BLE connection (non-blocking).
pub fn request_pwa_guide(client_name: String, client_mac: String) -> bool {
    if let Ok(guard) = DISPLAY_SENDER.lock() {
        if let Some(ref tx) = *guard {
            return tx.try_send(DisplayCommand::ShowPwaGuide { client_name, client_mac }).is_ok();
        }
    }
    false
}

/// Submits a request to switch the display mode (non-blocking).
pub fn request_mode(mode: String) -> bool {
    if let Ok(guard) = DISPLAY_SENDER.lock() {
        if let Some(ref tx) = *guard {
            return tx.try_send(DisplayCommand::SwitchMode(mode)).is_ok();
        }
    }
    false
}

/// Submits a request to render and display a Fabric.js custom layout (non-blocking).
pub fn request_layout(json: String) -> bool {
    if let Ok(guard) = DISPLAY_SENDER.lock() {
        if let Some(ref tx) = *guard {
            return tx.try_send(DisplayCommand::RenderLayout(json)).is_ok();
        }
    }
    false
}

/// Submits a request to refresh screen from direct 1:1 bitmap already in static buffer (non-blocking).
pub fn request_direct_bitmap() -> bool {
    if let Ok(guard) = DISPLAY_SENDER.lock() {
        if let Some(ref tx) = *guard {
            return tx.try_send(DisplayCommand::DirectBitmap).is_ok();
        }
    }
    false
}

/// Submits a request to overlay low battery warning card and trigger full refresh (non-blocking).
pub fn request_low_battery_warning() -> bool {
    if let Ok(guard) = DISPLAY_SENDER.lock() {
        if let Some(ref tx) = *guard {
            return tx.try_send(DisplayCommand::LowBatteryWarning).is_ok();
        }
    }
    false
}

/// Starts the dedicated display worker thread that owns the SPI driver.
pub fn run_display_loop(
    mut epd: EpdDriver<'static>,
    mut fb: Framebuffer,
    config_mgr: Arc<Mutex<ConfigManager>>,
    app_config: Arc<Mutex<AppConfig>>,
    ip_addr: String,
    initial_check_crc: bool,
) -> ! {
    let (tx, rx) = sync_channel::<DisplayCommand>(4);
    if let Ok(mut guard) = DISPLAY_SENDER.lock() {
        *guard = Some(tx);
    }

    println!("  [epd-worker] Display event loop active on main task (0 bytes heap allocated).");

            // 1. Initial boot check:
            // If the initial framebuffer was already populated (e.g. provisioning screen or initial mode),
            // check if physical refresh is needed based on CRC.
            if initial_check_crc {
                if app_config.lock().unwrap().screen_debug {
                    overlay_debug_bar(&mut fb, &ip_addr);
                }
                let cur_crc = compute_fb_crc(&fb);
                let saved_crc = app_config.lock().unwrap().last_screen_crc;
                if cur_crc == saved_crc {
                    println!("  [epd-worker] Screen CRC matches last state (0x{:08X}). Skipping initial refresh on boot!", cur_crc);
                } else {
                    println!("  [epd-worker] Screen changed (0x{:08X} -> 0x{:08X}). Performing initial 16s transmission...", saved_crc, cur_crc);
                    if let Err(e) = epd.display(&fb) {
                        println!("  [epd-worker] Initial EPD transmission notice: {:?}", e);
                    } else {
                        println!("  [epd-worker] Initial EPD refresh complete.");
                        app_config.lock().unwrap().last_screen_crc = cur_crc;
                        let _ = config_mgr.lock().unwrap().save_crc(cur_crc);
                    }
                }
            }

            // 2. Command processing loop
            while let Ok(cmd) = rx.recv() {
                let mut ctx = ModeContext::default();
                ctx.ip_str = ip_addr.clone();

                let (mode, custom_json) = {
                    let cfg = app_config.lock().unwrap();
                    if !cfg.fridge_title.is_empty() {
                        ctx.fridge_title = cfg.fridge_title.clone();
                    }
                    if !cfg.fridge_text.is_empty() {
                        ctx.fridge_note = cfg.fridge_text.clone();
                    }
                    if !cfg.fridge_author.is_empty() {
                        ctx.fridge_author = cfg.fridge_author.clone();
                    }
                    if !cfg.memo_text.is_empty() {
                        ctx.memo_text = cfg.memo_text.clone();
                        ctx.memo_items = cfg.memo_text.lines().map(|s| s.to_string()).collect();
                    }
                    (cfg.current_mode.clone(), cfg.custom_layout_json.clone())
                };

                let force_refresh = match cmd {
                    DisplayCommand::RefreshCurrent { force } => {
                        println!("  [epd-worker] Command: RefreshCurrent (force: {})", force);
                        if mode == "custom" && !custom_json.is_empty() {
                            let _ = CustomLayoutRenderer::render_json(&custom_json, &mut fb, &ctx);
                        } else {
                            let _ = render_mode(&mode, &mut fb, &ctx);
                        }
                        force
                    }
                    DisplayCommand::SwitchMode(new_mode) => {
                        println!("  [epd-worker] Command: SwitchMode('{}')", new_mode);
                        {
                            let mut cfg = app_config.lock().unwrap();
                            cfg.current_mode = new_mode.clone();
                            let _ = config_mgr.lock().unwrap().save(&cfg);
                        }
                        let _ = render_mode(&new_mode, &mut fb, &ctx);
                        true
                    }
                    DisplayCommand::RenderLayout(json) => {
                        println!("  [epd-worker] Command: RenderLayout ({} bytes)", json.len());
                        {
                            let mut cfg = app_config.lock().unwrap();
                            cfg.current_mode = "custom".to_string();
                            cfg.custom_layout_json = json.clone();
                            let _ = config_mgr.lock().unwrap().save(&cfg);
                        }
                        let _ = CustomLayoutRenderer::render_json(&json, &mut fb, &ctx);
                        true
                    }
                    DisplayCommand::DirectBitmap => {
                        println!("  [epd-worker] Command: DirectBitmap (1:1 RAW pixel buffer)");
                        true
                    }
                    DisplayCommand::LowBatteryWarning => {
                        println!("  [epd-worker] Command: LowBatteryWarning (Overlaying alert card in screen center)");
                        overlay_low_battery_warning(&mut fb);
                        true
                    }
                    DisplayCommand::ClearWhite => {
                        println!("  [epd-worker] Command: ClearWhite (100% pure white full refresh)");
                        fb.clear_color(BwryColor::White);
                        true
                    }
                    DisplayCommand::ClearColor(color) => {
                        println!("  [epd-worker] Command: ClearColor ({:?} full refresh)", color);
                        fb.clear_color(color);
                        true
                    }
                    DisplayCommand::ShowWelcome { ap_ssid, ap_ip, ble_name } => {
                        println!("  [epd-worker] Command: ShowWelcome (First boot welcome screen: AP={}, BLE={})", ap_ssid, ble_name);
                        crate::modes::provisioning::render_welcome_screen(&mut fb, &ap_ssid, &ap_ip, &ble_name);
                        true
                    }
                    DisplayCommand::ShowWifiDemo { ip, ssid } => {
                        println!("  [epd-worker] Command: ShowWifiDemo (Wi-Fi connected demo screen: IP={}, SSID={})", ip, ssid);
                        let mut c = ModeContext::default();
                        c.ip_str = ip;
                        c.wifi_ssid = ssid;
                        crate::modes::demo_layout::render_demo_layout(&mut fb, &c);
                        true
                    }
                    DisplayCommand::ShowPwaGuide { client_name, client_mac } => {
                        println!("  [epd-worker] Command: ShowPwaGuide (BLE client connected: {} [{}])", client_name, client_mac);
                        crate::modes::provisioning::render_pwa_connected_screen(&mut fb, &client_name, &client_mac);
                        true
                    }
                };

                if app_config.lock().unwrap().screen_debug {
                    overlay_debug_bar(&mut fb, &ip_addr);
                }

                let cur_crc = compute_fb_crc(&fb);
                let saved_crc = app_config.lock().unwrap().last_screen_crc;

                if !force_refresh && cur_crc == saved_crc {
                    println!("  [epd-worker] Content unchanged (CRC: 0x{:08X}). Skipping physical refresh.", cur_crc);
                    continue;
                }

                println!("  [epd-worker] Starting 15~16s full waveform transmission (CRC: 0x{:08X} -> 0x{:08X})...", saved_crc, cur_crc);
                if let Err(e) = epd.display(&fb) {
                    println!("  [epd-worker] EPD transmission notice: {:?}", e);
                } else {
                    println!("  [epd-worker] EPD transmission finished successfully.");
                    app_config.lock().unwrap().last_screen_crc = cur_crc;
                    let _ = config_mgr.lock().unwrap().save_crc(cur_crc);
                }
            }

            loop {
                std::thread::sleep(std::time::Duration::from_secs(60));
            }
}
