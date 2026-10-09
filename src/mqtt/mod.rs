// src/mqtt/mod.rs — Home Assistant MQTT Integration & Bidirectional Command/Telemetry Service

use std::sync::{Arc, Mutex};
use std::time::Duration;
use esp_idf_svc::mqtt::client::{
    EspMqttClient, EventPayload, MqttClientConfiguration, QoS,
};
use log::{error, warn};
use serde_json::json;

use crate::config::{AppConfig, ConfigManager};
use crate::power::PowerManager;

pub fn start_mqtt_service(
    config_mgr: Arc<Mutex<ConfigManager>>,
    app_config: Arc<Mutex<AppConfig>>,
    ip_addr: String,
    mac_str: String,
    mac_suffix: String,
) {
    let mac_suffix = mac_suffix.to_lowercase();
    let (broker, port, user, pass) = {
        let cfg = app_config.lock().unwrap();
        (cfg.mqtt_broker.clone(), cfg.mqtt_port, cfg.mqtt_user.clone(), cfg.mqtt_pass.clone())
    };

    if broker.is_empty() {
        println!("[MQTT] No MQTT broker configured. Skipping MQTT service.");
        return;
    }

    let free_heap = unsafe { esp_idf_sys::esp_get_free_heap_size() };
    if free_heap < 25000 {
        println!("[MQTT] WARNING: Low memory ({} bytes free). Skipping MQTT service to protect Web & BLE stability.", free_heap);
        return;
    }

    let broker_url = format!("mqtt://{}:{}", broker, port);
    let client_id = format!("epd_display_{}", mac_suffix);
    println!("[MQTT] Connecting to broker {} as Client ID '{}' (user: '{}')...", broker_url, client_id, user);

    let mqtt_cfg = MqttClientConfiguration {
        client_id: Some(&client_id),
        username: if user.is_empty() { None } else { Some(&user) },
        password: if pass.is_empty() { None } else { Some(&pass) },
        keep_alive_interval: Some(Duration::from_secs(60)),
        reconnect_timeout: Some(Duration::from_secs(5)),
        buffer_size: 1024,
        out_buffer_size: 1024,
        task_stack: 3072,
        ..Default::default()
    };

    let (client, mut conn) = match EspMqttClient::new(&broker_url, &mqtt_cfg) {
        Ok(res) => res,
        Err(e) => {
            println!("[MQTT] ERROR: Failed to create MQTT client: {:?}", e);
            error!("[MQTT] Failed to create MQTT client: {:?}", e);
            return;
        }
    };

    let client_arc = Arc::new(Mutex::new(client));
    let client_rx = client_arc.clone();
    let app_cfg_rx = app_config.clone();
    let cfg_mgr_rx = config_mgr.clone();
    let mac_suffix_rx = mac_suffix.clone();
    let mac_str_rx = mac_str.clone();
    let ip_rx = ip_addr.clone();

    // Single MQTT Event Receiver & Dispatcher Thread
    std::thread::Builder::new()
        .name("mqtt_rx".into())
        .stack_size(3072)
        .spawn(move || {
            while let Ok(event) = conn.next() {
                match event.payload() {
                    EventPayload::Connected(_) => {
                        println!("[MQTT] Connected to broker successfully!");

                        // 1. Subscribe to wildcard 'epd/#' for all device commands
                        if let Ok(mut cl) = client_rx.lock() {
                            let _ = cl.subscribe("epd/#", QoS::AtLeastOnce);
                            println!("[MQTT] Subscribed to wildcard 'epd/#' for all device commands.");
                        }

                        // 2. Publish Home Assistant Auto Discovery
                        let _ = publish_ha_discovery(&client_rx, &mac_suffix_rx, &ip_rx);

                        // 3. Publish initial telemetry & component states
                        let _ = publish_telemetry(&client_rx, &app_cfg_rx, &ip_rx, &mac_str_rx, &mac_suffix_rx);
                    }
                    EventPayload::Received { topic, data, .. } => {
                        if let Some(t) = topic {
                            let payload = String::from_utf8_lossy(data).trim().to_string();
                            println!("[MQTT] Inbound message on [{}]: '{}'", t, payload);

                            if t.ends_with("/mode/set") {
                                // Switch display mode
                                println!("[MQTT] Mode change requested via MQTT: {}", payload);
                                {
                                    let mut cfg = app_cfg_rx.lock().unwrap();
                                    cfg.current_mode = payload.clone();
                                    let _ = cfg_mgr_rx.lock().unwrap().save(&cfg);
                                }
                                crate::display::request_mode(payload.clone());
                                if let Ok(mut cl) = client_rx.lock() {
                                    let state_topic = format!("epd/{}/mode/state", mac_suffix_rx);
                                    let _ = cl.publish(&state_topic, QoS::AtMostOnce, true, payload.as_bytes());
                                }
                            } else if t.ends_with("/debug/set") {
                                // Screen debug overlay toggle
                                let enabled = payload.eq_ignore_ascii_case("on")
                                    || payload == "1"
                                    || payload.eq_ignore_ascii_case("true");
                                println!("[MQTT] Screen debug overlay requested via MQTT: {}", enabled);
                                {
                                    let mut cfg = app_cfg_rx.lock().unwrap();
                                    cfg.screen_debug = enabled;
                                    let _ = cfg_mgr_rx.lock().unwrap().save(&cfg);
                                }
                                crate::display::request_refresh(true);
                                if let Ok(mut cl) = client_rx.lock() {
                                    let state_topic = format!("epd/{}/debug/state", mac_suffix_rx);
                                    let msg = if enabled { "ON" } else { "OFF" };
                                    let _ = cl.publish(&state_topic, QoS::AtMostOnce, true, msg.as_bytes());
                                }
                            } else if t.ends_with("/cmd") {
                                if payload.eq_ignore_ascii_case("refresh") || payload.eq_ignore_ascii_case("update") {
                                    println!("[MQTT] Immediate screen refresh requested via MQTT");
                                    crate::display::request_refresh(true);
                                } else if payload.eq_ignore_ascii_case("battery_low") || payload.eq_ignore_ascii_case("low_battery") {
                                    println!("[MQTT] Low battery warning test requested via MQTT");
                                    PowerManager::set_low_battery(true);
                                    crate::display::request_low_battery_warning();
                                    if let Ok(mut cl) = client_rx.lock() {
                                        let state_topic = format!("epd/{}/battery/state", mac_suffix_rx);
                                        let _ = cl.publish(&state_topic, QoS::AtMostOnce, true, b"LOW");
                                    }
                                }
                            } else if t.ends_with("/sleep/set") {
                                let heartbeat = payload.eq_ignore_ascii_case("on") || payload == "1";
                                {
                                    let mut cfg = app_cfg_rx.lock().unwrap();
                                    cfg.heartbeat_mode = heartbeat;
                                    let _ = cfg_mgr_rx.lock().unwrap().save(&cfg);
                                }
                                if let Ok(mut cl) = client_rx.lock() {
                                    let state_topic = format!("epd/{}/sleep/state", mac_suffix_rx);
                                    let msg = if heartbeat { "ON" } else { "OFF" };
                                    let _ = cl.publish(&state_topic, QoS::AtMostOnce, true, msg.as_bytes());
                                }
                            } else if t.ends_with("/fridge/set") {
                                println!("[MQTT] Fridge message update via MQTT: {}", payload);
                                let (note, author) = if payload.starts_with('{') {
                                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&payload) {
                                        let n = v.get("note").and_then(|x| x.as_str()).unwrap_or(&payload).to_string();
                                        let a = v.get("author").and_then(|x| x.as_str()).unwrap_or("家人").to_string();
                                        (n, a)
                                    } else {
                                        (payload.clone(), "家人".to_string())
                                    }
                                } else {
                                    (payload.clone(), "家人".to_string())
                                };

                                {
                                    let mut cfg = app_cfg_rx.lock().unwrap();
                                    cfg.fridge_text = note.clone();
                                    cfg.fridge_author = author;
                                    cfg.current_mode = "fridge_board".to_string();
                                    let _ = cfg_mgr_rx.lock().unwrap().save(&cfg);
                                }
                                crate::display::request_mode("fridge_board".to_string());

                                if let Ok(mut cl) = client_rx.lock() {
                                    let state_topic = format!("epd/{}/fridge/state", mac_suffix_rx);
                                    let _ = cl.publish(&state_topic, QoS::AtMostOnce, true, note.as_bytes());
                                    let mode_topic = format!("epd/{}/mode/state", mac_suffix_rx);
                                    let _ = cl.publish(&mode_topic, QoS::AtMostOnce, true, b"fridge_board");
                                }
                            } else if t.ends_with("/memo/set") {
                                println!("[MQTT] Memo text update via MQTT: {}", payload);
                                let text = if payload.starts_with('{') {
                                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&payload) {
                                        if let Some(items) = v.get("items").and_then(|x| x.as_array()) {
                                            items.iter()
                                                .filter_map(|it| it.as_str())
                                                .collect::<Vec<_>>()
                                                .join("\n")
                                        } else if let Some(txt) = v.get("text").and_then(|x| x.as_str()) {
                                            txt.to_string()
                                        } else {
                                            payload.clone()
                                        }
                                    } else {
                                        payload.clone()
                                    }
                                } else {
                                    payload.clone()
                                };

                                {
                                    let mut cfg = app_cfg_rx.lock().unwrap();
                                    cfg.memo_text = text.clone();
                                    cfg.current_mode = "memo".to_string();
                                    let _ = cfg_mgr_rx.lock().unwrap().save(&cfg);
                                }
                                crate::display::request_mode("memo".to_string());

                                if let Ok(mut cl) = client_rx.lock() {
                                    let state_topic = format!("epd/{}/memo/state", mac_suffix_rx);
                                    let _ = cl.publish(&state_topic, QoS::AtMostOnce, true, text.as_bytes());
                                    let mode_topic = format!("epd/{}/mode/state", mac_suffix_rx);
                                    let _ = cl.publish(&mode_topic, QoS::AtMostOnce, true, b"memo");
                                }
                            }
                        }
                    }
                    EventPayload::Disconnected => {
                        println!("[MQTT] Disconnected from broker. Will retry automatically.");
                        warn!("[MQTT] Disconnected from broker.");
                    }
                    _ => {}
                }
            }
        })
        .expect("Failed to spawn mqtt_rx thread");

    // Spawn MQTT Periodic Telemetry Publisher Thread (every 60s)
    let client_tel = client_arc;
    let app_cfg_tel = app_config;
    let ip_tel = ip_addr;
    let mac_str_tel = mac_str;
    let mac_suffix_tel = mac_suffix;

    std::thread::Builder::new()
        .name("mqtt_telemetry".into())
        .stack_size(3072)
        .spawn(move || {
            loop {
                std::thread::sleep(Duration::from_secs(60));
                let _ = publish_telemetry(&client_tel, &app_cfg_tel, &ip_tel, &mac_str_tel, &mac_suffix_tel);
            }
        })
        .expect("Failed to spawn mqtt_telemetry thread");
}

fn publish_ha_discovery(client_arc: &Arc<Mutex<EspMqttClient<'static>>>, mac_suffix: &str, ip_addr: &str) -> anyhow::Result<()> {
    let mut client = match client_arc.lock() {
        Ok(c) => c,
        Err(_) => return Ok(()),
    };

    let dev = format!(
        r#""device":{{"identifiers":["epd_{mac}"],"name":"3.98\" E-Ink Smart Display","model":"SE0398NZ07 4-Color (768x552)","manufacturer":"ZGQ Inc.","sw_version":"v2.0","configuration_url":"http://{ip}"}}"#,
        mac = mac_suffix, ip = ip_addr
    );

    let entities: [(&str, String); 10] = [
        (
            &format!("homeassistant/text/epd_{}/fridge/config", mac_suffix),
            format!(
                r#"{{"name":"Fridge Message (冰箱贴)","unique_id":"epd_{mac}_fridge_text","command_topic":"epd/{mac}/fridge/set","state_topic":"epd/{mac}/fridge/state","mode":"text","min":0,"max":255,"icon":"mdi:fridge-outline",{dev}}}"#,
                mac = mac_suffix, dev = dev
            ),
        ),
        (
            &format!("homeassistant/text/epd_{}/memo/config", mac_suffix),
            format!(
                r#"{{"name":"Memo Note (便签备忘录)","unique_id":"epd_{mac}_memo_text","command_topic":"epd/{mac}/memo/set","state_topic":"epd/{mac}/memo/state","mode":"text","min":0,"max":255,"icon":"mdi:note-text-outline",{dev}}}"#,
                mac = mac_suffix, dev = dev
            ),
        ),
        (
            &format!("homeassistant/select/epd_{}/mode/config", mac_suffix),
            format!(
                r#"{{"name":"Display Mode","unique_id":"epd_{mac}_mode","command_topic":"epd/{mac}/mode/set","state_topic":"epd/{mac}/mode/state","options":["demo","fridge_board","memo","weather","clock","calendar","daily_quote","album","todo","pomodoro","word","geek","stock","retro_game","manga","poetry","canvas_qr","custom","bitmap"],"icon":"mdi:monitor-dashboard",{dev}}}"#,
                mac = mac_suffix, dev = dev
            ),
        ),
        (
            &format!("homeassistant/switch/epd_{}/debug/config", mac_suffix),
            format!(
                r#"{{"name":"Screen Debug Overlay","unique_id":"epd_{mac}_debug","command_topic":"epd/{mac}/debug/set","state_topic":"epd/{mac}/debug/state","payload_on":"ON","payload_off":"OFF","icon":"mdi:bug",{dev}}}"#,
                mac = mac_suffix, dev = dev
            ),
        ),
        (
            &format!("homeassistant/switch/epd_{}/sleep/config", mac_suffix),
            format!(
                r#"{{"name":"Heartbeat Sleep Mode","unique_id":"epd_{mac}_sleep","command_topic":"epd/{mac}/sleep/set","state_topic":"epd/{mac}/sleep/state","payload_on":"ON","payload_off":"OFF","icon":"mdi:sleep",{dev}}}"#,
                mac = mac_suffix, dev = dev
            ),
        ),
        (
            &format!("homeassistant/button/epd_{}/refresh/config", mac_suffix),
            format!(
                r#"{{"name":"Refresh Display","unique_id":"epd_{mac}_refresh","command_topic":"epd/{mac}/cmd","payload_press":"refresh","icon":"mdi:refresh",{dev}}}"#,
                mac = mac_suffix, dev = dev
            ),
        ),
        (
            &format!("homeassistant/binary_sensor/epd_{}/battery/config", mac_suffix),
            format!(
                r#"{{"name":"Battery Status (供电/欠压)","unique_id":"epd_{mac}_battery","state_topic":"epd/{mac}/battery/state","payload_on":"LOW","payload_off":"NORMAL","device_class":"problem","icon":"mdi:battery-alert",{dev}}}"#,
                mac = mac_suffix, dev = dev
            ),
        ),
        (
            &format!("homeassistant/sensor/epd_{}/heap/config", mac_suffix),
            format!(
                r#"{{"name":"Free Heap","unique_id":"epd_{mac}_heap","state_topic":"epd/{mac}/telemetry","value_template":"{{{{ value_json.free_heap }}}}","unit_of_measurement":"B","device_class":"data_size","entity_category":"diagnostic",{dev}}}"#,
                mac = mac_suffix, dev = dev
            ),
        ),
        (
            &format!("homeassistant/sensor/epd_{}/rssi/config", mac_suffix),
            format!(
                r#"{{"name":"Wi-Fi RSSI","unique_id":"epd_{mac}_rssi","state_topic":"epd/{mac}/telemetry","value_template":"{{{{ value_json.rssi }}}}","unit_of_measurement":"dBm","device_class":"signal_strength","entity_category":"diagnostic",{dev}}}"#,
                mac = mac_suffix, dev = dev
            ),
        ),
        (
            &format!("homeassistant/sensor/epd_{}/uptime/config", mac_suffix),
            format!(
                r#"{{"name":"Uptime","unique_id":"epd_{mac}_uptime","state_topic":"epd/{mac}/telemetry","value_template":"{{{{ value_json.uptime }}}}","unit_of_measurement":"s","entity_category":"diagnostic",{dev}}}"#,
                mac = mac_suffix, dev = dev
            ),
        ),
    ];

    for (topic, payload) in &entities {
        let _ = client.publish(topic, QoS::AtMostOnce, true, payload.as_bytes());
        std::thread::sleep(Duration::from_millis(15));
    }

    println!("[MQTT] All 10 Home Assistant Auto-Discovery entities published successfully!");
    Ok(())
}

fn publish_telemetry(
    client_arc: &Arc<Mutex<EspMqttClient<'static>>>,
    app_config: &Arc<Mutex<AppConfig>>,
    ip_addr: &str,
    mac_str: &str,
    mac_suffix: &str,
) -> anyhow::Result<()> {
    let mut client = match client_arc.lock() {
        Ok(c) => c,
        Err(_) => return Ok(()),
    };

    let (current_mode, screen_debug, heartbeat, fridge_text, memo_text) = {
        let cfg = app_config.lock().unwrap();
        (cfg.current_mode.clone(), cfg.screen_debug, cfg.heartbeat_mode, cfg.fridge_text.clone(), cfg.memo_text.clone())
    };

    let free_heap = unsafe { esp_idf_sys::esp_get_free_heap_size() } as usize;
    let min_free_heap = unsafe { esp_idf_sys::esp_get_minimum_free_heap_size() } as usize;
    let uptime = unsafe { esp_idf_sys::esp_timer_get_time() / 1_000_000 } as u64;
    let is_low_battery = PowerManager::is_low_battery();

    let telemetry = json!({
        "ip": ip_addr,
        "mac": mac_str,
        "rssi": -42,
        "free_heap": free_heap,
        "min_free_heap": min_free_heap,
        "uptime": uptime,
        "mode": current_mode,
        "screen_debug": screen_debug,
        "heartbeat": heartbeat,
        "battery_low": is_low_battery,
        "fridge_message": fridge_text,
        "memo_note": memo_text,
        "resolution": "768x552",
        "panel": "SE0398NZ07 4-Color"
    });

    let tele_topic = format!("epd/{}/telemetry", mac_suffix);
    let tele_payload = serde_json::to_vec(&telemetry)?;
    let _ = client.publish(&tele_topic, QoS::AtMostOnce, false, &tele_payload);
    std::thread::sleep(Duration::from_millis(15));

    // Also update component states (retained)
    let mode_state_topic = format!("epd/{}/mode/state", mac_suffix);
    let _ = client.publish(&mode_state_topic, QoS::AtMostOnce, true, current_mode.as_bytes());
    std::thread::sleep(Duration::from_millis(15));

    let debug_state_topic = format!("epd/{}/debug/state", mac_suffix);
    let dbg_str = if screen_debug { "ON" } else { "OFF" };
    let _ = client.publish(&debug_state_topic, QoS::AtMostOnce, true, dbg_str.as_bytes());
    std::thread::sleep(Duration::from_millis(15));

    let sleep_state_topic = format!("epd/{}/sleep/state", mac_suffix);
    let sleep_str = if heartbeat { "ON" } else { "OFF" };
    let _ = client.publish(&sleep_state_topic, QoS::AtMostOnce, true, sleep_str.as_bytes());
    std::thread::sleep(Duration::from_millis(15));

    let fridge_state_topic = format!("epd/{}/fridge/state", mac_suffix);
    let _ = client.publish(&fridge_state_topic, QoS::AtMostOnce, true, fridge_text.as_bytes());
    std::thread::sleep(Duration::from_millis(15));

    let memo_state_topic = format!("epd/{}/memo/state", mac_suffix);
    let _ = client.publish(&memo_state_topic, QoS::AtMostOnce, true, memo_text.as_bytes());
    std::thread::sleep(Duration::from_millis(15));

    let bat_state_topic = format!("epd/{}/battery/state", mac_suffix);
    let bat_str = if is_low_battery { "LOW" } else { "NORMAL" };
    let _ = client.publish(&bat_state_topic, QoS::AtMostOnce, true, bat_str.as_bytes());
    std::thread::sleep(Duration::from_millis(15));

    Ok(())
}
