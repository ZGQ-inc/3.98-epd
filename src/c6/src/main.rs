// firmware/c6/src/main.rs — Project SlimBadge C6 Firmware Entry Point
// Target MCU: ESP32-C6 (ESP32-C6-MINI-1-N4)

pub mod bsp;
pub mod pins;
pub mod power;

use bsp::Bsp;
use esp_idf_hal::peripherals::Peripherals;
use esp_idf_svc::eventloop::EspSystemEventLoop;
use esp_idf_svc::log::EspLogger;
use esp_idf_svc::nvs::EspDefaultNvsPartition;
use log::info;
use std::thread;
use std::time::Duration;

fn main() -> anyhow::Result<()> {
    // 1. Initialize system logger & event loop
    esp_idf_svc::sys::link_patches();
    EspLogger::initialize_default();
    log::set_max_level(log::LevelFilter::Info);

    println!("");
    println!("  ========================================================");
    println!("   Project SlimBadge C6: 5.4mm Ultra-Thin Smart Badge     ");
    println!("   Target: ESP32-C6-MINI-1 | 3.98\" BWRY 4-Color (768x552) ");
    println!("   Firmware Version: 2.0.0 (Standardized BSP Architecture)");
    println!("  ========================================================");
    println!("");
    info!("[SYSTEM] Booting SlimBadge C6 firmware v2.0.0...");

    let peripherals = Peripherals::take()?;
    let _sys_loop = EspSystemEventLoop::take()?;
    let _nvs_default = EspDefaultNvsPartition::take()?;

    // 2. Check Brownout / Battery Status
    power::PowerManager::check_undervoltage_on_boot();

    // 3. Initialize Board Support Package (BSP)
    //    Configures all GPIOs, I2C bus, EPD pins, TF card CS, touch inputs, and interrupt lines.
    let mut bsp = Bsp::init(peripherals)?;

    // 4. Blink Activity LED to indicate successful BSP hardware initialization
    bsp.set_act_led(true)?;
    thread::sleep(Duration::from_millis(100));
    bsp.set_act_led(false)?;

    // 5. Probe and report all on-board I2C peripherals:
    //    SY6970 (0x6B), QMI8658C (0x6A), SHT40 (0x44), OPT3001 (0x45), PCF8563 (0x51), ST25DV04K (0x53)
    let scan_report = bsp.scan_and_report_i2c();
    info!("[SYSTEM] I2C Bus Scan completed. {} devices acknowledged.", scan_report.total_devices_found);

    // 6. Test Input Lines (Touch keys & Interrupts)
    let (touch_0, touch_1) = bsp.read_touch_keys();
    let irq_status = bsp.read_interrupts();
    info!("[SYSTEM] Touch Key State: T0={}, T1={}", touch_0, touch_1);
    info!("[SYSTEM] IRQ State: RTC={:?}, IMU={:?}, NFC={:?}, CHG={:?}", 
        irq_status.rtc_alarm, irq_status.imu_motion, irq_status.nfc_field, irq_status.charger_event);

    println!("[SYSTEM] SlimBadge C6 Core BSP Initialization Complete.");
    println!("[SYSTEM] System ready for EPD display engine and network tasks.\n");

    // Maintain activity heartbeat
    bsp.set_act_led(true)?;

    loop {
        thread::sleep(Duration::from_secs(10));
    }
}
