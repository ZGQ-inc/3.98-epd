// src/power/sy6970.rs — SY6970 / SGM41511 / BQ25895 I2C Driver
// Manages 15W Buck Fast Charging, Power Path, and Real-time Battery/VBUS Telemetry.

use embedded_hal::blocking::i2c::{Write, WriteRead};

pub const SY6970_I2C_ADDR: u8 = 0x6B;

// Key Registers
pub const REG_INPUT_CURRENT_LIMIT: u8 = 0x00;
pub const REG_CHARGE_CURRENT_LIMIT: u8 = 0x02;
pub const REG_CHARGE_VOLTAGE_LIMIT: u8 = 0x04;
pub const REG_SYS_STATUS: u8 = 0x0B;
pub const REG_FAULT_STATUS: u8 = 0x0C;
pub const REG_VBAT_ADC: u8 = 0x0E;
pub const REG_SYS_VOLTAGE_ADC: u8 = 0x0F;
pub const REG_VBUS_ADC: u8 = 0x11;
pub const REG_ICHG_ADC: u8 = 0x12;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ChargeStatus {
    NotCharging,
    PreCharge,
    FastCharging,
    ChargeTerminationDone,
    Unknown,
}

#[derive(Debug, Clone)]
pub struct PowerTelemetry {
    pub vbus_mv: u32,
    pub vbat_mv: u32,
    pub charge_current_ma: u32,
    pub status: ChargeStatus,
    pub is_power_good: bool,
    pub battery_percentage: u8,
}

pub struct Sy6970Driver<I2C> {
    i2c: I2C,
    addr: u8,
}

impl<I2C, E> Sy6970Driver<I2C>
where
    I2C: Write<Error = E> + WriteRead<Error = E>,
{
    pub fn new(i2c: I2C) -> Self {
        Self {
            i2c,
            addr: SY6970_I2C_ADDR,
        }
    }

    /// Configures charging limits for 304570 (1200mAh 3.0mm thin pouch cell)
    /// Sets input current limit to 2.0A, charge current to 1.5A (~1.25C max)
    pub fn configure_safe_fast_charge(&mut self) -> Result<(), E> {
        // Reg 0x00: Enable HIZ=0, Input current limit 2.0A
        self.write_reg(REG_INPUT_CURRENT_LIMIT, 0b0010_1000)?;
        // Reg 0x02: Fast charge current limit: 1.5A (0b0001_1000)
        self.write_reg(REG_CHARGE_CURRENT_LIMIT, 0x18)?;
        // Reg 0x04: Fast charge voltage limit: 4.208V
        self.write_reg(REG_CHARGE_VOLTAGE_LIMIT, 0b1011_0010)?;
        Ok(())
    }

    /// Reads real-time voltage, current and charging state via ADC
    pub fn read_telemetry(&mut self) -> Result<PowerTelemetry, E> {
        let status_byte = self.read_reg(REG_SYS_STATUS)?;
        let vbat_raw = self.read_reg(REG_VBAT_ADC)?;
        let vbus_raw = self.read_reg(REG_VBUS_ADC)?;
        let ichg_raw = self.read_reg(REG_ICHG_ADC)?;

        // VBAT: 2.304V base + 20mV per LSB (bits 0..6)
        let vbat_mv = 2304 + (vbat_raw as u32 & 0x7F) * 20;

        // VBUS: 2.6V base + 100mV per LSB (bits 0..6)
        let is_vbus_attached = (vbus_raw & 0x80) != 0;
        let vbus_mv = if is_vbus_attached {
            2600 + (vbus_raw as u32 & 0x7F) * 100
        } else {
            0
        };

        // ICHG: 50mA per LSB (bits 0..6)
        let charge_current_ma = (ichg_raw as u32 & 0x7F) * 50;

        // Charge status bits [4:3]
        let chrg_stat = (status_byte >> 3) & 0x03;
        let status = match chrg_stat {
            0b00 => ChargeStatus::NotCharging,
            0b01 => ChargeStatus::PreCharge,
            0b10 => ChargeStatus::FastCharging,
            0b11 => ChargeStatus::ChargeTerminationDone,
            _ => ChargeStatus::Unknown,
        };

        let is_power_good = (status_byte & 0x04) != 0;

        // Approximate SoC battery percentage (LiPo curve approximation)
        let battery_percentage = match vbat_mv {
            mv if mv >= 4180 => 100,
            mv if mv <= 3400 => 0,
            mv => (((mv - 3400) * 100) / (4180 - 3400)).min(100) as u8,
        };

        Ok(PowerTelemetry {
            vbus_mv,
            vbat_mv,
            charge_current_ma,
            status,
            is_power_good,
            battery_percentage,
        })
    }

    fn write_reg(&mut self, reg: u8, val: u8) -> Result<(), E> {
        self.i2c.write(self.addr, &[reg, val])
    }

    fn read_reg(&mut self, reg: u8) -> Result<u8, E> {
        let mut buf = [0u8; 1];
        self.i2c.write_read(self.addr, &[reg], &mut buf)?;
        Ok(buf[0])
    }
}
