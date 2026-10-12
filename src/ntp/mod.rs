// src/ntp/mod.rs — NTP Time Synchronization Module (Alibaba Cloud NTP & UTC+8)

use esp_idf_svc::sntp::{EspSntp, OperatingMode, SntpConf, SyncMode, SyncStatus};
use log::info;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

static SNTP_INSTANCE: Mutex<Option<EspSntp<'static>>> = Mutex::new(None);

pub const NTP_SERVER_PRIMARY: &str = "ntp.aliyun.com";
pub const NTP_SERVER_BACKUP1: &str = "ntp1.aliyun.com";
pub const NTP_SERVER_BACKUP2: &str = "ntp2.aliyun.com";
pub const NTP_SERVER_FALLBACK: &str = "pool.ntp.org";

/// Initialize SNTP with Alibaba Cloud NTP servers and set China Standard Time (CST-8, UTC+8).
pub fn init_sntp() {
    let mut guard = SNTP_INSTANCE.lock().unwrap();
    if guard.is_some() {
        println!("  [ntp] SNTP service already initialized and running.");
        return;
    }

    // Set POSIX timezone to China Standard Time (UTC+8, no daylight saving time)
    // POSIX format "CST-8": CST name, offset is -8 hours from UTC (i.e. UTC + 8)
    unsafe {
        let tz = std::ffi::CString::new("CST-8").unwrap();
        esp_idf_sys::setenv(b"TZ\0".as_ptr() as *const _, tz.as_ptr(), 1);
        esp_idf_sys::tzset();
    }
    println!("  [ntp] Set system timezone to China Standard Time (CST-8, UTC+8)");

    let mut conf = SntpConf::default();
    let ntp_servers = [
        NTP_SERVER_PRIMARY,
        NTP_SERVER_BACKUP1,
        NTP_SERVER_BACKUP2,
        NTP_SERVER_FALLBACK,
    ];
    for (i, server_slot) in conf.servers.iter_mut().enumerate() {
        if let Some(&srv) = ntp_servers.get(i) {
            *server_slot = srv;
        }
    }
    conf.operating_mode = OperatingMode::Poll;
    conf.sync_mode = SyncMode::Immediate;

    println!("  [ntp] Initializing SNTP client with Alibaba Cloud NTP (Primary: {})", NTP_SERVER_PRIMARY);

    match EspSntp::new_with_callback(&conf, |duration| {
        let secs = duration.as_secs();
        let (date, time) = format_epoch_to_cst(secs);
        println!("  [ntp] 🎉 Time synchronized via Alibaba Cloud NTP! Beijing Time: {} {}", date, time);
        info!("[NTP] Time synchronized via Alibaba Cloud NTP: {} {}", date, time);
    }) {
        Ok(sntp) => {
            println!("  [ntp] SNTP client successfully running.");
            *guard = Some(sntp);
        }
        Err(e) => {
            println!("  [ntp] WARNING: Failed to start SNTP client: {:?}", e);
        }
    }
}

/// Check if system time has been synchronized via NTP
pub fn is_time_synced() -> bool {
    if let Ok(guard) = SNTP_INSTANCE.lock() {
        if let Some(ref sntp) = *guard {
            if sntp.get_sync_status() == SyncStatus::Completed {
                return true;
            }
        }
    }
    // Fallback: check if epoch is after 2025-01-01 (1735689600)
    let secs = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    secs > 1735689600
}

/// Get sync status string
pub fn get_sync_status_str() -> &'static str {
    if let Ok(guard) = SNTP_INSTANCE.lock() {
        if let Some(ref sntp) = *guard {
            return match sntp.get_sync_status() {
                SyncStatus::Completed => "Synced",
                SyncStatus::InProgress => "Syncing",
                SyncStatus::Reset => "Reset",
            };
        }
    }
    "Uninitialized"
}

/// Format seconds since UNIX epoch to CST (UTC+8) Date and Time strings
pub fn format_epoch_to_cst(secs: u64) -> (String, String) {
    let time_val: esp_idf_sys::time_t = secs as esp_idf_sys::time_t;
    let mut tm: esp_idf_sys::tm = unsafe { std::mem::zeroed() };
    unsafe {
        esp_idf_sys::localtime_r(&time_val, &mut tm);
    }
    let date_str = format!("{:04}-{:02}-{:02}", tm.tm_year + 1900, tm.tm_mon + 1, tm.tm_mday);
    let time_str = format!("{:02}:{:02}", tm.tm_hour, tm.tm_min);
    (date_str, time_str)
}

/// Information struct for current local time
#[derive(Debug, Clone)]
pub struct NowInfo {
    pub date_str: String,       // "2026-10-12"
    pub time_str: String,       // "14:20"
    pub time_sec_str: String,   // "14:20:35"
    pub weekday_cn: String,     // "星期一"
    pub weekday_en: String,     // "Monday"
    pub timestamp: u64,
}

/// Get current CST Date, Time, and Weekday (Chinese & English)
pub fn get_now_info() -> NowInfo {
    let mut time_val: esp_idf_sys::time_t = 0;
    unsafe {
        esp_idf_sys::time(&mut time_val);
    }
    let mut tm: esp_idf_sys::tm = unsafe { std::mem::zeroed() };
    unsafe {
        esp_idf_sys::localtime_r(&time_val, &mut tm);
    }

    let date_str = format!("{:04}-{:02}-{:02}", tm.tm_year + 1900, tm.tm_mon + 1, tm.tm_mday);
    let time_str = format!("{:02}:{:02}", tm.tm_hour, tm.tm_min);
    let time_sec_str = format!("{:02}:{:02}:{:02}", tm.tm_hour, tm.tm_min, tm.tm_sec);

    let (weekday_cn, weekday_en) = match tm.tm_wday {
        0 => ("星期日", "Sunday"),
        1 => ("星期一", "Monday"),
        2 => ("星期二", "Tuesday"),
        3 => ("星期三", "Wednesday"),
        4 => ("星期四", "Thursday"),
        5 => ("星期五", "Friday"),
        _ => ("星期六", "Saturday"),
    };

    NowInfo {
        date_str,
        time_str,
        time_sec_str,
        weekday_cn: weekday_cn.to_string(),
        weekday_en: weekday_en.to_string(),
        timestamp: time_val as u64,
    }
}
