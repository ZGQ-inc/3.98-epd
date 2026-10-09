// src/web/mod.rs — Embedded HTTP Server & REST API Subsystem

pub mod api;
pub mod assets;

use std::sync::{Arc, Mutex};
use embedded_svc::http::Method;
use esp_idf_svc::http::server::{Configuration, EspHttpServer};
use esp_idf_svc::io::Write;
use log::info;

use crate::config::{AppConfig, ConfigManager};
use crate::web::api::{ApiResponse, SystemStatusResponse};
use crate::web::assets::{CAPTIVE_HTML, INDEX_HTML_GZ, MANIFEST_JSON, SW_JS};

pub struct WebServer;

impl WebServer {
    pub fn start(
        config_mgr: Arc<Mutex<ConfigManager>>,
        config: Arc<Mutex<AppConfig>>,
        ip_addr: String,
        is_ap_mode: bool,
    ) -> anyhow::Result<Self> {
        println!("  [web] Creating EspHttpServer on port 80...");
        let server_cfg = Configuration {
            stack_size: 4096,
            max_open_sockets: 4,
            max_uri_handlers: 36,
            uri_match_wildcard: true,
            lru_purge_enable: true,
            ..Default::default()
        };

        let mut server = match EspHttpServer::new(&server_cfg) {
            Ok(s) => {
                println!("  [web] EspHttpServer instance created.");
                s
            }
            Err(e) => {
                println!("  [web] WARNING: EspHttpServer::new failed: {:?}. System will continue operating.", e);
                return Ok(Self);
            }
        };

        // 0. Global CORS preflight handler for all /api/* routes
        server.fn_handler("/api/*", Method::Options, |req| -> anyhow::Result<()> {
            let mut resp = req.into_response(204, None, &[
                ("Access-Control-Allow-Origin", "*"),
                ("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
                ("Access-Control-Allow-Headers", "Content-Type, Authorization"),
                ("Access-Control-Max-Age", "86400"),
            ])?;
            resp.write_all(b"")?;
            Ok(())
        })?;

        // 1. Root '/' handler:
        // In AP mode -> serves Captive Portal
        // In Station mode -> serves full Material Web Console & Layout Studio!
        println!("  [web] Registering root handler '/' (is_ap: {})...", is_ap_mode);
        server.fn_handler("/", Method::Get, move |req| -> anyhow::Result<()> {
            if is_ap_mode {
                let len_str = CAPTIVE_HTML.len().to_string();
                let mut resp = req.into_response(200, None, &[
                    ("Content-Type", "text/html; charset=utf-8"),
                    ("Content-Length", &len_str),
                    ("Cache-Control", "no-cache, no-store, must-revalidate"),
                ])?;
                resp.write_all(CAPTIVE_HTML)?;
                return Ok(());
            }

            let len_str = INDEX_HTML_GZ.len().to_string();
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "text/html; charset=utf-8"),
                ("Content-Encoding", "gzip"),
                ("Content-Length", &len_str),
                ("Connection", "close"),
                ("Cache-Control", "no-cache, no-store, must-revalidate"),
            ])?;
            for chunk in INDEX_HTML_GZ.chunks(1024) {
                resp.write_all(chunk).map_err(|e| anyhow::anyhow!("{e:?}"))?;
            }
            Ok(())
        })?;

        // 1b. Direct '/app' route to console
        server.fn_handler("/app", Method::Get, |_req| -> anyhow::Result<()> {
            let len_str = INDEX_HTML_GZ.len().to_string();
            let mut resp = _req.into_response(200, None, &[
                ("Content-Type", "text/html; charset=utf-8"),
                ("Content-Encoding", "gzip"),
                ("Content-Length", &len_str),
                ("Connection", "close"),
                ("Cache-Control", "no-cache, no-store, must-revalidate"),
            ])?;
            for chunk in INDEX_HTML_GZ.chunks(1024) {
                resp.write_all(chunk).map_err(|e| anyhow::anyhow!("{e:?}"))?;
            }
            Ok(())
        })?;

        // 1c. Dedicated PWA mobile app routes -> 302 HTTP Redirect to HTTPS PWA
        for path in &["/pwa", "/pwa.html"] {
            server.fn_handler(path, Method::Get, |_req| -> anyhow::Result<()> {
                let pwa_url = "https://398epd.zgqinc.gq";
                let body = format!(
                    r#"<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url={pwa_url}"><title>Redirecting to EPD PWA</title></head><body>正在跳转至独立 PWA 专页：<a href="{pwa_url}">{pwa_url}</a>...</body></html>"#
                );
                let len_str = body.len().to_string();
                let mut resp = _req.into_response(302, None, &[
                    ("Location", pwa_url),
                    ("Content-Type", "text/html; charset=utf-8"),
                    ("Content-Length", &len_str),
                    ("Connection", "close"),
                ])?;
                resp.write_all(body.as_bytes())?;
                Ok(())
            })?;
        }

        // 1d. PWA Web App Manifest
        server.fn_handler("/manifest.json", Method::Get, |_req| -> anyhow::Result<()> {
            let len_str = MANIFEST_JSON.len().to_string();
            let mut resp = _req.into_response(200, None, &[
                ("Content-Type", "application/manifest+json; charset=utf-8"),
                ("Content-Length", &len_str),
                ("Access-Control-Allow-Origin", "*"),
                ("Connection", "close"),
            ])?;
            resp.write_all(MANIFEST_JSON)?;
            Ok(())
        })?;

        // 1e. PWA Service Worker
        server.fn_handler("/sw.js", Method::Get, |_req| -> anyhow::Result<()> {
            let len_str = SW_JS.len().to_string();
            let mut resp = _req.into_response(200, None, &[
                ("Content-Type", "application/javascript; charset=utf-8"),
                ("Content-Length", &len_str),
                ("Service-Worker-Allowed", "/"),
                ("Connection", "close"),
            ])?;
            resp.write_all(SW_JS)?;
            Ok(())
        })?;

        // 2. Dedicated captive portal and OS connectivity detection routes
        // (Identical pattern to mi-remote-esp32)
        for path in &[
            "/captive",
            "/setup",
            "/hotspot-detect.html",
            "/generate_204",
            "/gen_204",
            "/ncsi.txt",
            "/connecttest.txt",
            "/canonical.html",
            "/library/test/success.html",
            "/success.txt",
            "/redirect",
        ] {
            server.fn_handler(path, Method::Get, |req| -> anyhow::Result<()> {
                println!("  [web] Captive probe on {}, serving captive page", req.uri());
                let mut resp = req.into_response(200, None, &[
                    ("Content-Type", "text/html; charset=utf-8"),
                    ("Connection", "close"),
                    ("Cache-Control", "no-cache, no-store, must-revalidate"),
                ])?;
                resp.write_all(CAPTIVE_HTML)?;
                Ok(())
            })?;
        }

        // 3. POST /api/wifi/save — Matches captive.html form submit
        let config_mgr_save = config_mgr.clone();
        let config_save = config.clone();
        server.fn_handler("/api/wifi/save", Method::Post, move |mut req| -> anyhow::Result<()> {
            let mut body = vec![0u8; 512];
            let len = req.read(&mut body)?;
            body.truncate(len);
            println!("  [wifi-api] POST /api/wifi/save received {} bytes", body.len());
            println!("  [wifi-api] Raw payload: {}", String::from_utf8_lossy(&body));

            #[derive(serde::Deserialize)]
            struct WifiSavePayload {
                ssid: String,
                password: Option<String>,
            }

            match serde_json::from_slice::<WifiSavePayload>(&body) {
                Ok(p) => {
                    println!("  [wifi-api] Parsed SSID: '{}', Password length: {}", p.ssid, p.password.as_deref().unwrap_or("").len());
                    let mut mgr = config_mgr_save.lock().unwrap();
                    let mut cfg = config_save.lock().unwrap();
                    cfg.wifi_ssid = p.ssid;
                    cfg.wifi_pass = p.password.unwrap_or_default();
                    if let Err(e) = mgr.save(&cfg) {
                        println!("  [wifi-api] ERROR saving config: {:?}", e);
                    } else {
                        println!("  [wifi-api] SUCCESS: Config saved to NVS! Scheduled restart in 1.2s...");
                        std::thread::spawn(|| {
                            std::thread::sleep(std::time::Duration::from_millis(1200));
                            println!("  [wifi-api] Rebooting into STA mode now!");
                            unsafe { esp_idf_sys::esp_restart() };
                        });
                    }
                }
                Err(e) => {
                    println!("  [wifi-api] JSON parse error: {:?}", e);
                }
            }

            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json"),
                ("Connection", "close"),
            ])?;
            resp.write_all(b"{\"status\":\"saved\"}")?;
            Ok(())
        })?;

        // 4. POST /api/wifi/scan
        server.fn_handler("/api/wifi/scan", Method::Post, |req| -> anyhow::Result<()> {
            let json = serde_json::json!([]).to_string();
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json"),
                ("Connection", "close"),
            ])?;
            resp.write_all(json.as_bytes())?;
            Ok(())
        })?;

        // 5. GET /api/system/status
        let config_status = config.clone();
        let ip_status = ip_addr.clone();
        server.fn_handler("/api/system/status", Method::Get, move |req| -> anyhow::Result<()> {
            let cfg = config_status.lock().unwrap();
            let free_heap = unsafe { esp_idf_sys::esp_get_free_heap_size() } as usize;
            let min_free_heap = unsafe { esp_idf_sys::esp_get_minimum_free_heap_size() } as usize;
            let uptime_secs = unsafe { esp_idf_sys::esp_timer_get_time() / 1_000_000 } as u64;

            let status = SystemStatusResponse {
                free_heap,
                min_free_heap,
                uptime_secs,
                wifi_mode: if is_ap_mode { "SoftAP".into() } else { "Station".into() },
                wifi_rssi: -42,
                ip_address: ip_status.clone(),
                current_mode: cfg.current_mode.clone(),
                heartbeat_mode: cfg.heartbeat_mode,
                screen_debug: cfg.screen_debug,
                panel_model: "SE0398NZ07-FNG-A0/A1 (4-Color BWRY)",
                resolution: "768x552",
                flash_chip_size: 4 * 1024 * 1024,
                storage_partition_size: 896 * 1024,
                storage_free_bytes: 848 * 1024,
                nvs_size: 24 * 1024,
                nvs_used_bytes: 6 * 1024,
                chip_model: "ESP32-C3 RISC-V 32-bit (rev v0.4)",
                cpu_freq_mhz: 160,
                mac_address: {
                    let mut mac = [0u8; 6];
                    unsafe { esp_idf_svc::sys::esp_efuse_mac_get_default(mac.as_mut_ptr()) };
                    format!("{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5])
                },
                battery_low: crate::power::PowerManager::is_low_battery(),
                reset_reason: format!("{:?}", unsafe { esp_idf_sys::esp_reset_reason() }),
                wireless_mode: cfg.wireless_mode.clone(),
                ble_enabled: cfg.ble_enabled,
                ble_status: crate::ble::BleManager::global().get_status_str(),
                ble_device_name: cfg.ble_device_name.clone(),
                ble_devices: crate::ble::BleManager::global().get_device_list(),
            };
            let json = serde_json::to_vec(&status)?;
            let len_str = json.len().to_string();
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json"),
                ("Content-Length", &len_str),
                ("Access-Control-Allow-Origin", "*"),
                ("Connection", "close"),
            ])?;
            resp.write_all(&json)?;
            Ok(())
        })?;

        // 6. GET /api/config
        let config_get = config.clone();
        server.fn_handler("/api/config", Method::Get, move |req| -> anyhow::Result<()> {
            let cfg = config_get.lock().unwrap();
            let json = serde_json::to_vec(&*cfg)?;
            let len_str = json.len().to_string();
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json"),
                ("Content-Length", &len_str),
                ("Access-Control-Allow-Origin", "*"),
                ("Connection", "close"),
            ])?;
            resp.write_all(&json)?;
            Ok(())
        })?;

        // 7. POST /api/display/mode
        let config_mode = config.clone();
        let config_mgr_mode = config_mgr.clone();
        server.fn_handler("/api/display/mode", Method::Post, move |mut req| -> anyhow::Result<()> {
            let mut buf = vec![0u8; 1024];
            let len = req.read(&mut buf)?;
            buf.truncate(len);
            if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&buf) {
                if let Some(m) = val.get("mode").and_then(|v| v.as_str()) {
                    {
                        let mut cfg = config_mode.lock().unwrap();
                        cfg.current_mode = m.to_string();
                        if let Some(key) = val.get("openweather_key").and_then(|v| v.as_str()) {
                            if !key.is_empty() {
                                cfg.openweather_key = key.to_string();
                            }
                        }
                        if let Some(city) = val.get("openweather_city").and_then(|v| v.as_str()) {
                            if !city.is_empty() {
                                cfg.openweather_city = city.to_string();
                            }
                        }
                        if let Some(params) = val.get("mode_params") {
                            cfg.mode_params_json = params.to_string();
                            if m == "fridge_board" {
                                if let Some(t) = params.get("title").and_then(|v| v.as_str()) {
                                    cfg.fridge_title = t.to_string();
                                }
                                if let Some(n) = params.get("note").and_then(|v| v.as_str()) {
                                    cfg.fridge_text = n.to_string();
                                }
                                if let Some(a) = params.get("author").and_then(|v| v.as_str()) {
                                    cfg.fridge_author = a.to_string();
                                }
                                let mut lines = Vec::new();
                                for key in &["item1", "item2", "item3", "item4"] {
                                    if let Some(it) = params.get(*key).and_then(|v| v.as_str()) {
                                        if !it.trim().is_empty() {
                                            lines.push(it.to_string());
                                        }
                                    }
                                }
                                if !lines.is_empty() {
                                    cfg.memo_text = lines.join("\n");
                                }
                            } else if m == "memo" {
                                let mut lines = Vec::new();
                                for key in &["item1", "item2", "item3", "item4"] {
                                    if let Some(it) = params.get(*key).and_then(|v| v.as_str()) {
                                        if !it.trim().is_empty() {
                                            lines.push(it.to_string());
                                        }
                                    }
                                }
                                if !lines.is_empty() {
                                    cfg.memo_text = lines.join("\n");
                                }
                            }
                        }
                        let _ = config_mgr_mode.lock().unwrap().save(&cfg);
                    }
                    let should_refresh = val.get("refresh").and_then(|v| v.as_bool()).unwrap_or(true);
                    if should_refresh {
                        let _ = crate::display::request_mode(m.to_string());
                    }
                    let json = serde_json::to_vec(&serde_json::json!({
                        "status": "ok",
                        "message": format!("显示模式已切换为【{}】，正在向墨水屏刷新...", m)
                    }))?;
                    let mut resp = req.into_response(200, None, &[
                        ("Content-Type", "application/json; charset=utf-8"),
                        ("Access-Control-Allow-Origin", "*"),
                        ("Connection", "close"),
                    ])?;
                    resp.write_all(&json)?;
                    return Ok(());
                }
            }
            let json = serde_json::to_vec(&ApiResponse::err("请指定合法的 mode 字符串"))?;
            let mut resp = req.into_response(400, None, &[
                ("Content-Type", "application/json"),
                ("Connection", "close"),
            ])?;
            resp.write_all(&json)?;
            Ok(())
        })?;

        // 8. POST /api/layout — Fabric.js Canvas Custom Drag & Drop JSON
        server.fn_handler("/api/layout", Method::Post, move |mut req| -> anyhow::Result<()> {
            let mut body = Vec::with_capacity(2048);
            let mut chunk = [0u8; 512];
            loop {
                let n = req.read(&mut chunk)?;
                if n == 0 {
                    break;
                }
                body.extend_from_slice(&chunk[..n]);
                if body.len() > 32768 {
                    break; // Safety limit
                }
            }
            println!("  [web-api] POST /api/layout received {} bytes", body.len());
            let json_str = String::from_utf8_lossy(&body).to_string();
            let ok = crate::display::request_layout(json_str);
            let resp_msg = if ok {
                "自定义画布已成功推送到墨水屏，正在刷新（约16秒）..."
            } else {
                "墨水屏当前正在刷新中，请稍候重试！"
            };
            let json = serde_json::to_vec(&serde_json::json!({
                "status": if ok { "ok" } else { "busy" },
                "message": resp_msg
            }))?;
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json; charset=utf-8"),
                ("Access-Control-Allow-Origin", "*"),
                ("Connection", "close"),
            ])?;
            resp.write_all(&json)?;
            Ok(())
        })?;

        // 9. POST /api/display/refresh — Immediate full physical waveform refresh
        server.fn_handler("/api/display/refresh", Method::Post, move |req| -> anyhow::Result<()> {
            println!("  [web-api] POST /api/display/refresh triggered");
            let ok = crate::display::request_refresh(true);
            let resp_msg = if ok {
                "全屏擦写指令已下发，正在执行16秒波形刷新..."
            } else {
                "屏幕正在刷新中，请勿重复触发"
            };
            let json = serde_json::to_vec(&serde_json::json!({
                "status": if ok { "ok" } else { "busy" },
                "message": resp_msg
            }))?;
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json; charset=utf-8"),
                ("Access-Control-Allow-Origin", "*"),
                ("Connection", "close"),
            ])?;
            resp.write_all(&json)?;
            Ok(())
        })?;

        // 10. POST /api/config — Save network and MQTT parameters
        let config_set = config.clone();
        let config_mgr_set = config_mgr.clone();
        server.fn_handler("/api/config", Method::Post, move |mut req| -> anyhow::Result<()> {
            let mut buf = vec![0u8; 1024];
            let len = req.read(&mut buf)?;
            buf.truncate(len);
            if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&buf) {
                let mut cfg = config_set.lock().unwrap();
                let mut dbg_changed = false;
                let mut mqtt_changed = false;
                if let Some(s) = val.get("wifi_ssid").and_then(|v| v.as_str()) {
                    cfg.wifi_ssid = s.to_string();
                }
                if let Some(p) = val.get("wifi_pass").and_then(|v| v.as_str()) {
                    cfg.wifi_pass = p.to_string();
                }
                if let Some(h) = val.get("mqtt_broker").and_then(|v| v.as_str()) {
                    if cfg.mqtt_broker != h {
                        cfg.mqtt_broker = h.to_string();
                        mqtt_changed = true;
                    }
                }
                if let Some(port) = val.get("mqtt_port").and_then(|v| v.as_u64()) {
                    if cfg.mqtt_port != port as u16 {
                        cfg.mqtt_port = port as u16;
                        mqtt_changed = true;
                    }
                }
                if let Some(u) = val.get("mqtt_user").and_then(|v| v.as_str()) {
                    if cfg.mqtt_user != u {
                        cfg.mqtt_user = u.to_string();
                        mqtt_changed = true;
                    }
                }
                if let Some(p) = val.get("mqtt_pass").and_then(|v| v.as_str()) {
                    if cfg.mqtt_pass != p {
                        cfg.mqtt_pass = p.to_string();
                        mqtt_changed = true;
                    }
                }
                if let Some(d) = val.get("screen_debug").and_then(|v| v.as_bool()) {
                    if cfg.screen_debug != d {
                        cfg.screen_debug = d;
                        dbg_changed = true;
                    }
                }
                let _ = config_mgr_set.lock().unwrap().save(&cfg);
                if dbg_changed {
                    crate::display::request_refresh(true);
                }

                let msg = if mqtt_changed {
                    println!("  [sys-api] MQTT config updated! Scheduled restart in 1s to connect to broker...");
                    std::thread::spawn(|| {
                        std::thread::sleep(std::time::Duration::from_millis(1000));
                        unsafe { esp_idf_sys::esp_restart() };
                    });
                    "系统与网络配置已保存到 NVS，正在重启以建立 MQTT 连接..."
                } else {
                    "系统与网络配置已保存到 NVS"
                };

                let json = serde_json::to_vec(&serde_json::json!({
                    "status": "ok",
                    "message": msg
                }))?;
                let mut resp = req.into_response(200, None, &[
                    ("Content-Type", "application/json; charset=utf-8"),
                    ("Connection", "close"),
                ])?;
                resp.write_all(&json)?;
                return Ok(());
            }
            let mut resp = req.into_response(400, None, &[
                ("Content-Type", "application/json"),
                ("Connection", "close"),
            ])?;
            resp.write_all(b"{\"status\":\"error\",\"message\":\"Invalid JSON\"}")?;
            Ok(())
        })?;

        // 10b. POST /api/system/debug — Toggle screen debug overlay
        let config_dbg = config.clone();
        let config_mgr_dbg = config_mgr.clone();
        server.fn_handler("/api/system/debug", Method::Post, move |mut req| -> anyhow::Result<()> {
            let mut buf = [0u8; 128];
            let len = req.read(&mut buf)?;
            let new_state = if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&buf[..len]) {
                if let Some(b) = val.get("enabled").and_then(|v| v.as_bool()) {
                    b
                } else {
                    let cur = config_dbg.lock().unwrap().screen_debug;
                    !cur
                }
            } else {
                let cur = config_dbg.lock().unwrap().screen_debug;
                !cur
            };
            {
                let mut cfg = config_dbg.lock().unwrap();
                cfg.screen_debug = new_state;
                let _ = config_mgr_dbg.lock().unwrap().save(&cfg);
            }
            crate::display::request_refresh(true);
            let json = serde_json::to_vec(&serde_json::json!({
                "status": "ok",
                "screen_debug": new_state,
                "message": if new_state { "屏显 Debug 叠加条已开启，正在刷新墨水屏..." } else { "屏显 Debug 叠加条已关闭，正在刷新墨水屏..." }
            }))?;
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json; charset=utf-8"),
                ("Access-Control-Allow-Origin", "*"),
                ("Connection", "close"),
            ])?;
            resp.write_all(&json)?;
            Ok(())
        })?;

        // 11. POST /api/system/reboot
        server.fn_handler("/api/system/reboot", Method::Post, |req| -> anyhow::Result<()> {
            println!("  [sys-api] POST /api/system/reboot received, restarting in 500ms...");
            std::thread::spawn(|| {
                std::thread::sleep(std::time::Duration::from_millis(500));
                unsafe { esp_idf_sys::esp_restart() };
            });
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json; charset=utf-8"),
                ("Connection", "close"),
            ])?;
            resp.write_all(b"{\"status\":\"ok\",\"message\":\"Device rebooting...\"}")?;
            Ok(())
        })?;

        // 11b. POST /api/display/test_battery_low — Trigger Low Battery Warning Overlay
        server.fn_handler("/api/display/test_battery_low", Method::Post, |req| -> anyhow::Result<()> {
            println!("  [sys-api] POST /api/display/test_battery_low triggered!");
            crate::power::PowerManager::set_low_battery(true);
            crate::display::request_low_battery_warning();
            let json = serde_json::to_vec(&serde_json::json!({
                "status": "ok",
                "message": "低电量欠压告警卡片已触发并在屏幕中心叠加刷新！"
            }))?;
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json; charset=utf-8"),
                ("Connection", "close"),
            ])?;
            resp.write_all(&json)?;
            Ok(())
        })?;

        // 11c. POST /api/wireless/mode — Wireless coexistence mode switch (auto, wifi_only, ble_only, dual)
        let config_wl = config.clone();
        let config_mgr_wl = config_mgr.clone();
        server.fn_handler("/api/wireless/mode", Method::Post, move |mut req| -> anyhow::Result<()> {
            let mut buf = [0u8; 512];
            let len = req.read(&mut buf)?;
            if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&buf[..len]) {
                if let Some(m) = val.get("mode").and_then(|v| v.as_str()) {
                    if m == "wifi_only" {
                        let cfg = config_wl.lock().unwrap();
                        if cfg.wifi_ssid.trim().is_empty() {
                            let json = serde_json::to_vec(&serde_json::json!({
                                "status": "error",
                                "message": "⚠️ 墨水屏当前尚未配置任何可用 Wi-Fi 路由器的 SSID！若此时切换为仅 Wi-Fi 并关闭蓝牙，设备将无法联网且无法蓝牙直连，导致彻底失联！请先在【Wi-Fi 配网】中保存可用 Wi-Fi 后再试。"
                            }))?;
                            let mut resp = req.into_response(400, None, &[
                                ("Content-Type", "application/json; charset=utf-8"),
                                ("Access-Control-Allow-Origin", "*"),
                                ("Connection", "close"),
                            ])?;
                            resp.write_all(&json)?;
                            return Ok(());
                        }
                    }
                    {
                        let mut cfg = config_wl.lock().unwrap();
                        cfg.wireless_mode = m.to_string();
                        if m == "wifi_only" {
                            cfg.ble_enabled = false;
                        } else if m == "ble_only" {
                            cfg.ble_enabled = true;
                        }
                        let _ = config_mgr_wl.lock().unwrap().save(&cfg);
                    }
                    crate::ble::BleManager::global().set_wireless_mode(m);
                    let mode_cn = match m {
                        "wifi_only" => "仅 Wi-Fi (设备即将重启生效并彻底关闭蓝牙)",
                        "ble_only" => "仅蓝牙 (设备即将重启生效并彻底关闭 Wi-Fi)",
                        "dual" => "双模并发 (Wi-Fi + BLE)",
                        _ => "智能自动 (Auto)",
                    };
                    let json = serde_json::to_vec(&serde_json::json!({
                        "status": "ok",
                        "mode": m,
                        "message": format!("无线通信模式已设置为【{}】", mode_cn)
                    }))?;
                    let mut resp = req.into_response(200, None, &[
                        ("Content-Type", "application/json; charset=utf-8"),
                        ("Access-Control-Allow-Origin", "*"),
                        ("Connection", "close"),
                    ])?;
                    resp.write_all(&json)?;

                    if m == "wifi_only" || m == "ble_only" {
                        let m_str = m.to_string();
                        std::thread::spawn(move || {
                            std::thread::sleep(std::time::Duration::from_millis(1200));
                            println!("  [sys-api] Restarting device to apply '{}' mode...", m_str);
                            unsafe { esp_idf_sys::esp_restart() };
                        });
                    }
                    return Ok(());
                }
            }
            let mut resp = req.into_response(400, None, &[
                ("Content-Type", "application/json"),
                ("Connection", "close"),
            ])?;
            resp.write_all(b"{\"status\":\"error\",\"message\":\"Missing mode string\"}")?;
            Ok(())
        })?;

        // 11d. POST /api/ble/toggle — Manual Bluetooth Enable/Disable
        let config_ble_toggle = config.clone();
        let config_mgr_ble_toggle = config_mgr.clone();
        server.fn_handler("/api/ble/toggle", Method::Post, move |mut req| -> anyhow::Result<()> {
            let mut buf = [0u8; 256];
            let len = req.read(&mut buf)?;
            let current_enabled = config_ble_toggle.lock().unwrap().ble_enabled;
            let enabled = if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&buf[..len]) {
                val.get("enabled").and_then(|v| v.as_bool()).unwrap_or(!current_enabled)
            } else {
                !current_enabled
            };
            {
                let mut cfg = config_ble_toggle.lock().unwrap();
                cfg.ble_enabled = enabled;
                if enabled && cfg.wireless_mode == "wifi_only" {
                    cfg.wireless_mode = "dual".to_string();
                    crate::ble::BleManager::global().set_wireless_mode("dual");
                }
                let _ = config_mgr_ble_toggle.lock().unwrap().save(&cfg);
            }
            crate::ble::BleManager::global().set_enabled(enabled);
            let json = serde_json::to_vec(&serde_json::json!({
                "status": "ok",
                "ble_enabled": enabled,
                "ble_status": crate::ble::BleManager::global().get_status_str(),
                "message": if enabled { "蓝牙广播已开启" } else { "蓝牙广播已关闭" }
            }))?;
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json; charset=utf-8"),
                ("Access-Control-Allow-Origin", "*"),
                ("Connection", "close"),
            ])?;
            resp.write_all(&json)?;
            Ok(())
        })?;

        // 11e. POST /api/ble/disconnect — Disconnect client device
        server.fn_handler("/api/ble/disconnect", Method::Post, |mut req| -> anyhow::Result<()> {
            let mut buf = [0u8; 256];
            let len = req.read(&mut buf)?;
            if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&buf[..len]) {
                if let Some(id) = val.get("id").and_then(|v| v.as_str()) {
                    crate::ble::BleManager::global().on_ble_client_disconnected(id);
                    let json = serde_json::to_vec(&serde_json::json!({
                        "status": "ok",
                        "message": format!("已断开与客户端【{}】的连接", id)
                    }))?;
                    let mut resp = req.into_response(200, None, &[
                        ("Content-Type", "application/json; charset=utf-8"),
                        ("Access-Control-Allow-Origin", "*"),
                        ("Connection", "close"),
                    ])?;
                    resp.write_all(&json)?;
                    return Ok(());
                }
            }
            let mut resp = req.into_response(400, None, &[
                ("Content-Type", "application/json"),
                ("Connection", "close"),
            ])?;
            resp.write_all(b"{\"status\":\"error\",\"message\":\"Missing client id\"}")?;
            Ok(())
        })?;
        let config_mgr_rst = config_mgr.clone();
        server.fn_handler("/api/system/reset", Method::Post, move |req| -> anyhow::Result<()> {
            println!("  [sys-api] POST /api/system/reset received! Clearing NVS...");
            let default_cfg = AppConfig::default();
            let _ = config_mgr_rst.lock().unwrap().save(&default_cfg);
            std::thread::spawn(|| {
                std::thread::sleep(std::time::Duration::from_millis(500));
                unsafe { esp_idf_sys::esp_restart() };
            });
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/json; charset=utf-8"),
                ("Connection", "close"),
            ])?;
            resp.write_all(b"{\"status\":\"ok\",\"message\":\"Factory reset complete. Rebooting into AP mode...\"}")?;
            Ok(())
        })?;

        // 13. POST /api/display/bitmap & /api/display/raw — Direct 1:1 Pixel Bitmap from Web Studio / PWA (105,984 bytes)
        for path in &["/api/display/bitmap", "/api/display/raw"] {
            server.fn_handler(path, Method::Post, move |mut req| -> anyhow::Result<()> {
                let raw_fb = crate::display::framebuffer::get_raw_slice_mut();
                let mut total_read = 0usize;

                while total_read < crate::display::TOTAL_BUFFER_SIZE {
                    let n = req.read(&mut raw_fb[total_read..])?;
                    if n == 0 {
                        break;
                    }
                    total_read += n;
                }

                if total_read == crate::display::TOTAL_BUFFER_SIZE {
                    let ok = crate::display::request_direct_bitmap();
                    let json = serde_json::to_vec(&serde_json::json!({
                        "status": if ok { "ok" } else { "busy" },
                        "message": "1:1 高保真画板点阵已推送成功，正在执行16秒硬件波形刷新..."
                    }))?;
                    let mut resp = req.into_response(200, None, &[
                        ("Content-Type", "application/json; charset=utf-8"),
                        ("Access-Control-Allow-Origin", "*"),
                        ("Connection", "close"),
                    ])?;
                    resp.write_all(&json)?;
                } else {
                    let json = serde_json::to_vec(&serde_json::json!({
                        "status": "error",
                        "message": format!("数据长度不匹配：预期 105984 字节，实际接收 {} 字节", total_read)
                    }))?;
                    let mut resp = req.into_response(400, None, &[
                        ("Content-Type", "application/json; charset=utf-8"),
                        ("Access-Control-Allow-Origin", "*"),
                        ("Connection", "close"),
                    ])?;
                    resp.write_all(&json)?;
                }
                Ok(())
            })?;
        }

        // 14. GET /api/display/raw — Read current 105,984 bytes framebuffer for 1:1 Web Preview (PackBits compressed)
        server.fn_handler("/api/display/raw", Method::Get, move |req| -> anyhow::Result<()> {
            let raw_fb = crate::display::framebuffer::get_raw_slice();
            let mut resp = req.into_response(200, None, &[
                ("Content-Type", "application/octet-stream"),
                ("X-Compression", "packbits"),
                ("Access-Control-Allow-Origin", "*"),
                ("Access-Control-Expose-Headers", "X-Compression"),
                ("Cache-Control", "no-cache, no-store, must-revalidate"),
                ("Connection", "close"),
            ])?;
            let sent = stream_packbits(raw_fb, &mut resp)?;
            println!("  [web] GET /api/display/raw sent {} bytes (PackBits RLE)", sent);
            Ok(())
        })?;

        // Leak server to guarantee it never drops
        Box::leak(Box::new(server));
        println!("  [web] HTTP server listening on port 80");
        info!("HTTP server started on port 80");

        Ok(Self)
    }
}

/// Safe stack-based chunk writer to prevent out-of-bounds indexing
struct ChunkWriter<'a, W: esp_idf_svc::io::Write> {
    writer: &'a mut W,
    buf: [u8; 512],
    pos: usize,
    total_sent: usize,
}

impl<'a, W: esp_idf_svc::io::Write> ChunkWriter<'a, W> {
    fn new(writer: &'a mut W) -> Self {
        Self {
            writer,
            buf: [0u8; 512],
            pos: 0,
            total_sent: 0,
        }
    }

    #[inline]
    fn put(&mut self, b: u8) -> anyhow::Result<()> {
        if self.pos >= self.buf.len() {
            self.flush()?;
        }
        self.buf[self.pos] = b;
        self.pos += 1;
        Ok(())
    }

    fn flush(&mut self) -> anyhow::Result<()> {
        if self.pos > 0 {
            self.writer.write_all(&self.buf[..self.pos]).map_err(|e| anyhow::anyhow!("{e:?}"))?;
            self.total_sent += self.pos;
            self.pos = 0;
        }
        Ok(())
    }
}

/// Zero-heap PackBits RLE stream compressor
fn stream_packbits<W: esp_idf_svc::io::Write>(data: &[u8], writer: &mut W) -> anyhow::Result<usize> {
    let mut cw = ChunkWriter::new(writer);
    let n = data.len();
    let mut i = 0;
    while i < n {
        // Count identical run
        let mut run_len = 1;
        while i + run_len < n && data[i + run_len] == data[i] && run_len < 128 {
            run_len += 1;
        }
        if run_len >= 2 {
            let header = (257 - run_len as u16) as u8;
            cw.put(header)?;
            cw.put(data[i])?;
            i += run_len;
        } else {
            // Count literal run
            let lit_start = i;
            let mut lit_len = 1;
            i += 1;
            while i < n && lit_len < 128 {
                if i + 1 < n && data[i] == data[i + 1] {
                    break;
                }
                lit_len += 1;
                i += 1;
            }
            cw.put((lit_len - 1) as u8)?;
            for j in 0..lit_len {
                cw.put(data[lit_start + j])?;
            }
        }
    }
    cw.flush()?;
    Ok(cw.total_sent)
}
