// src/pins.rs — Project SlimBadge C6 Unified Hardware Pin Mapping
// Target MCU: ESP32-C6 (ESP32-C6-MINI-1-N4)

pub mod epd {
    pub const SCK: u8 = 4;       // FSPI_CLK (8MHz Hardware SPI)
    pub const MOSI: u8 = 6;      // FSPI_MOSI (EPD_DIN)
    pub const CS: u8 = 7;        // Chip Select (Active Low)
    pub const DC: u8 = 1;        // Data/Command (0=CMD, 1=DATA)
    pub const RST: u8 = 2;       // Hardware Reset (Active Low)
    pub const BUSY: u8 = 22;     // Status Busy (Input, 0=Busy/Boosting, 1=Idle; ESP32-C6-MINI-1 Pin 28)
}

pub mod i2c_bus {
    pub const SDA: u8 = 8;       // Shared I2C Data (400kHz, 4.7kΩ pull-up)
    pub const SCL: u8 = 9;       // Shared I2C Clock
    
    // 7-Bit I2C Slave Addresses:
    pub const ADDR_SY6970: u8 = 0x6B;   // 15W Buck Fast Charger & Power Path
    pub const ADDR_QMI8658: u8 = 0x6A;  // 6-Axis IMU (AD0=GND)
    pub const ADDR_SHT40: u8 = 0x44;    // High-Precision Temp & Humidity Sensor
    pub const ADDR_OPT3001: u8 = 0x45;  // Ambient Light Sensor (ADDR=VDD)
    pub const ADDR_PCF8563: u8 = 0x51;  // Ultra-Low Power Real-Time Clock
    pub const ADDR_ST25DV: u8 = 0x53;   // Dynamic NFC Tag (System EEPROM)
}

pub mod sd_card {
    pub const CS: u8 = 15;       // TF Card SPI Chip Select
    pub const MOSI: u8 = 18;     // SPI2 MOSI / CMD
    pub const SCK: u8 = 19;      // SPI2 SCLK / CLK (20MHz)
    pub const MISO: u8 = 20;     // SPI2 MISO / DAT0
}

pub mod ui {
    pub const RGB_LED: u8 = 14;  // SK6805-EC15 / WS2812B Single-Wire Data
    pub const ACT_LED: u8 = 16;  // Activity LED (SD Read/Write & EPD Refreshing)
    pub const TOUCH_0: u8 = 3;   // Capacitive Touch Button 1 (Page Up / Menu)
    pub const TOUCH_1: u8 = 5;   // Capacitive Touch Button 2 (Page Down / Confirm)
}

pub mod interrupts {
    pub const RTC_INT: u8 = 0;   // PCF8563 Wakeup Alarm (LP_GPIO 0)
    pub const IMU_INT: u8 = 23;  // QMI8658 Motion / Shake / Tap Wakeup (ESP32-C6-MINI-1 Pin 29)
    pub const NFC_GPO: u8 = 17;  // ST25DV RF Field Detected Wakeup (LP_GPIO 17)
    pub const CHG_INT: u8 = 21;  // SY6970 Power Good / Fault / Done Status Interrupt
}

pub mod usb {
    pub const D_MINUS: u8 = 12;  // Native USB 2.0 Full-Speed D-
    pub const D_PLUS: u8 = 13;   // Native USB 2.0 Full-Speed D+
}
