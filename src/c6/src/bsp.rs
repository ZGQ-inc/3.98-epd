// src/bsp.rs — Project SlimBadge C6 Board Support Package (BSP)
// Target MCU: ESP32-C6 (ESP32-C6-MINI-1-N4)
// Standardized hardware definitions, I2C bus management, and GPIO control.

use esp_idf_hal::gpio::{Input, Output, PinDriver, Pull};
use esp_idf_hal::i2c::{I2cConfig, I2cDriver};
use esp_idf_hal::peripherals::Peripherals;
use esp_idf_hal::units::Hertz;
use log::info;

pub use crate::pins;

/// Status report of discovered I2C devices on the shared bus
#[derive(Debug, Clone, Default)]
pub struct I2cScanReport {
    pub sy6970_found: bool,
    pub qmi8658_found: bool,
    pub sht40_found: bool,
    pub opt3001_found: bool,
    pub pcf8563_found: bool,
    pub st25dv_found: bool,
    pub total_devices_found: usize,
}

/// Hardware interrupt line states
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct InterruptStatus {
    pub rtc_alarm: bool,
    pub imu_motion: bool,
    pub nfc_field: bool,
    pub charger_event: bool,
}

/// Board Support Package for SlimBadge C6
pub struct Bsp<'d> {
    pub i2c: I2cDriver<'d>,
    pub act_led: PinDriver<'d, Output>,
    pub epd_cs: PinDriver<'d, Output>,
    pub epd_dc: PinDriver<'d, Output>,
    pub epd_rst: PinDriver<'d, Output>,
    pub epd_busy: PinDriver<'d, Input>,
    pub sd_cs: PinDriver<'d, Output>,
    pub touch_0: PinDriver<'d, Input>,
    pub touch_1: PinDriver<'d, Input>,
    pub rtc_int: PinDriver<'d, Input>,
    pub imu_int: PinDriver<'d, Input>,
    pub nfc_gpo: PinDriver<'d, Input>,
    pub chg_int: PinDriver<'d, Input>,
}

impl<'d> Bsp<'d> {
    /// Initialize all hardware peripherals, GPIOs, and the shared I2C bus.
    pub fn init(peripherals: Peripherals) -> anyhow::Result<Self> {
        info!("[BSP] Initializing Project SlimBadge C6 Board Support Package...");

        // 1. Initialize Shared Fast I2C Bus (SDA: GPIO 8, SCL: GPIO 9 @ 400kHz)
        let i2c_config = I2cConfig::new().baudrate(Hertz(400_000)).scl_enable_pullup(true).sda_enable_pullup(true);
        let i2c = I2cDriver::new(
            peripherals.i2c0,
            peripherals.pins.gpio8,
            peripherals.pins.gpio9,
            &i2c_config,
        )?;
        info!("[BSP] I2C0 Bus online (SDA=IO8, SCL=IO9, 400kHz Fast-mode).");

        // 2. Initialize Activity LED (GPIO 16)
        let mut act_led = PinDriver::output(peripherals.pins.gpio16)?;
        act_led.set_low()?;

        // 3. Initialize E-Paper Display Control GPIOs
        let mut epd_cs = PinDriver::output(peripherals.pins.gpio7)?;
        epd_cs.set_high()?; // Deselected

        let mut epd_dc = PinDriver::output(peripherals.pins.gpio1)?;
        epd_dc.set_low()?;

        let mut epd_rst = PinDriver::output(peripherals.pins.gpio2)?;
        epd_rst.set_high()?; // Not in reset

        let epd_busy = PinDriver::input(peripherals.pins.gpio22, Pull::Up)?;

        // 4. Initialize MicroSD SPI Chip Select (GPIO 15)
        let mut sd_cs = PinDriver::output(peripherals.pins.gpio15)?;
        sd_cs.set_high()?; // Deselected

        // 5. Initialize Capacitive Touch Inputs (GPIO 3, GPIO 5)
        let touch_0 = PinDriver::input(peripherals.pins.gpio3, Pull::Down)?;
        let touch_1 = PinDriver::input(peripherals.pins.gpio5, Pull::Down)?;

        // 6. Initialize Hardware Interrupt Lines
        let rtc_int = PinDriver::input(peripherals.pins.gpio0, Pull::Up)?;
        let imu_int = PinDriver::input(peripherals.pins.gpio23, Pull::Down)?;
        let nfc_gpo = PinDriver::input(peripherals.pins.gpio17, Pull::Down)?;
        let chg_int = PinDriver::input(peripherals.pins.gpio21, Pull::Up)?;

        info!("[BSP] All GPIO pin directions and pull-ups configured successfully.");

        Ok(Self {
            i2c,
            act_led,
            epd_cs,
            epd_dc,
            epd_rst,
            epd_busy,
            sd_cs,
            touch_0,
            touch_1,
            rtc_int,
            imu_int,
            nfc_gpo,
            chg_int,
        })
    }

    /// Turn the activity LED on or off
    pub fn set_act_led(&mut self, state: bool) -> anyhow::Result<()> {
        if state {
            self.act_led.set_high()?;
        } else {
            self.act_led.set_low()?;
        }
        Ok(())
    }

    /// Check if the E-Paper Display is currently busy refreshing
    /// In SSD1680 / UC8179 panels, BUSY is Active Low (0=Busy, 1=Idle)
    pub fn is_epd_busy(&self) -> bool {
        self.epd_busy.is_low()
    }

    /// Read touch button inputs: (TOUCH_0 / Left, TOUCH_1 / Right)
    pub fn read_touch_keys(&self) -> (bool, bool) {
        (self.touch_0.is_high(), self.touch_1.is_high())
    }

    /// Read status of all external interrupt lines
    pub fn read_interrupts(&self) -> InterruptStatus {
        InterruptStatus {
            rtc_alarm: self.rtc_int.is_low(),     // Active Low open-drain
            imu_motion: self.imu_int.is_high(),   // Active High push-pull
            nfc_field: self.nfc_gpo.is_high(),    // Active High RF detected
            charger_event: self.chg_int.is_low(), // Active Low open-drain
        }
    }

    /// Scans the I2C bus for all known sensors and peripheral ICs, printing a diagnostic table.
    pub fn scan_and_report_i2c(&mut self) -> I2cScanReport {
        println!("\n+-------------------------------------------------------------+");
        println!("|       SlimBadge C6 - Hardware I2C Device Probe Diagnostic  |");
        println!("+-------------------------------------------------------------+");
        println!("| Address | Device Identity                | Status           |");
        println!("+---------+--------------------------------+------------------+");

        let mut report = I2cScanReport::default();
        let timeout = 100; // 100 ticks

        // Check SY6970
        let res_sy = self.i2c.write(pins::i2c_bus::ADDR_SY6970, &[], timeout).is_ok();
        report.sy6970_found = res_sy;
        if res_sy { report.total_devices_found += 1; }
        println!(
            "|  0x{:02X}   | SY6970 15W Fast Charger / ADC  | {} |",
            pins::i2c_bus::ADDR_SY6970,
            if res_sy { "  DETECTED [✓]   " } else { "  NOT DETECTED   " }
        );

        // Check QMI8658
        let res_imu = self.i2c.write(pins::i2c_bus::ADDR_QMI8658, &[], timeout).is_ok();
        report.qmi8658_found = res_imu;
        if res_imu { report.total_devices_found += 1; }
        println!(
            "|  0x{:02X}   | QMI8658C 6-Axis Motion IMU     | {} |",
            pins::i2c_bus::ADDR_QMI8658,
            if res_imu { "  DETECTED [✓]   " } else { "  NOT DETECTED   " }
        );

        // Check SHT40
        let res_sht = self.i2c.write(pins::i2c_bus::ADDR_SHT40, &[], timeout).is_ok();
        report.sht40_found = res_sht;
        if res_sht { report.total_devices_found += 1; }
        println!(
            "|  0x{:02X}   | SHT40 Temp & Humidity Sensor   | {} |",
            pins::i2c_bus::ADDR_SHT40,
            if res_sht { "  DETECTED [✓]   " } else { "  NOT DETECTED   " }
        );

        // Check OPT3001
        let res_opt = self.i2c.write(pins::i2c_bus::ADDR_OPT3001, &[], timeout).is_ok();
        report.opt3001_found = res_opt;
        if res_opt { report.total_devices_found += 1; }
        println!(
            "|  0x{:02X}   | OPT3001 Ambient Light Sensor   | {} |",
            pins::i2c_bus::ADDR_OPT3001,
            if res_opt { "  DETECTED [✓]   " } else { "  NOT DETECTED   " }
        );

        // Check PCF8563
        let res_rtc = self.i2c.write(pins::i2c_bus::ADDR_PCF8563, &[], timeout).is_ok();
        report.pcf8563_found = res_rtc;
        if res_rtc { report.total_devices_found += 1; }
        println!(
            "|  0x{:02X}   | PCF8563 Ultra-Low Power RTC    | {} |",
            pins::i2c_bus::ADDR_PCF8563,
            if res_rtc { "  DETECTED [✓]   " } else { "  NOT DETECTED   " }
        );

        // Check ST25DV
        let res_nfc = self.i2c.write(pins::i2c_bus::ADDR_ST25DV, &[], timeout).is_ok();
        report.st25dv_found = res_nfc;
        if res_nfc { report.total_devices_found += 1; }
        println!(
            "|  0x{:02X}   | ST25DV04K Dynamic NFC Tag      | {} |",
            pins::i2c_bus::ADDR_ST25DV,
            if res_nfc { "  DETECTED [✓]   " } else { "  NOT DETECTED   " }
        );

        println!("+---------+--------------------------------+------------------+");
        println!("| Probed {} / 6 expected on-board I2C peripherals.            |\n", report.total_devices_found);

        report
    }
}
