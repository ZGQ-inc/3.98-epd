// src/power/mod.rs — Power Management, Heartbeat Mode & Deep Sleep

use std::sync::atomic::{AtomicBool, Ordering};
use esp_idf_sys::{esp_deep_sleep_start, esp_sleep_enable_timer_wakeup};
use log::info;

pub static IS_LOW_BATTERY: AtomicBool = AtomicBool::new(false);

pub struct PowerManager;

impl PowerManager {
    /// Checks if the chip rebooted due to a hardware brownout (undervoltage).
    pub fn check_undervoltage_on_boot() -> bool {
        let reason = unsafe { esp_idf_sys::esp_reset_reason() };
        let is_brownout = reason == esp_idf_sys::esp_reset_reason_t_ESP_RST_BROWNOUT;
        if is_brownout {
            println!("⚠️ [POWER] CRITICAL HARDWARE BROWNOUT DETECTED! (Reason: ESP_RST_BROWNOUT)");
            IS_LOW_BATTERY.store(true, Ordering::SeqCst);
        }
        is_brownout
    }

    /// Returns whether the system is currently flagged for low battery / undervoltage.
    pub fn is_low_battery() -> bool {
        IS_LOW_BATTERY.load(Ordering::SeqCst)
    }

    /// Sets the low battery flag manually (e.g. for testing).
    pub fn set_low_battery(flag: bool) {
        IS_LOW_BATTERY.store(flag, Ordering::SeqCst);
    }

    /// Enter deep sleep for a specified duration in microseconds.
    /// In deep sleep, RAM is unpowered, CPU is halted, consumption < 10 uA.
    pub fn enter_deep_sleep(duration_secs: u64) {
        info!("[POWER] Preparing to enter deep sleep for {} seconds...", duration_secs);
        unsafe {
            esp_sleep_enable_timer_wakeup(duration_secs * 1_000_000);
            esp_deep_sleep_start();
        }
    }
}
