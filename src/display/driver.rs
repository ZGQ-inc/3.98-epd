// src/display/driver.rs — SE0398NZ07-FNG-A0/A1 4-Color E-Ink Hardware Driver

use std::thread::sleep;
use std::time::{Duration, Instant};

use esp_idf_hal::delay::FreeRtos;
use esp_idf_hal::gpio::{Input, Output, PinDriver};
use esp_idf_hal::spi::{SpiDeviceDriver, SpiDriver};
use log::{info, warn};

use crate::display::framebuffer::{BYTES_PER_ROW, EPD_HEIGHT, Framebuffer};

pub enum PanelVersion {
    A0,
    A1,
}

pub struct EpdDriver<'d> {
    spi: SpiDeviceDriver<'d, SpiDriver<'d>>,
    cs: PinDriver<'d, Output>,
    dc: PinDriver<'d, Output>,
    rst: PinDriver<'d, Output>,
    busy: PinDriver<'d, Input>,
    panel_version: PanelVersion,
    pub flip_180: bool,
}

impl<'d> EpdDriver<'d> {
    pub fn new(
        spi: SpiDeviceDriver<'d, SpiDriver<'d>>,
        cs: PinDriver<'d, Output>,
        dc: PinDriver<'d, Output>,
        rst: PinDriver<'d, Output>,
        busy: PinDriver<'d, Input>,
        panel_version: PanelVersion,
    ) -> Self {
        Self {
            spi,
            cs,
            dc,
            rst,
            busy,
            panel_version,
            flip_180: false,
        }
    }

    #[inline(always)]
    fn send_cmd(&mut self, cmd: u8) -> anyhow::Result<()> {
        self.dc.set_low()?;
        self.cs.set_low()?;
        self.spi.write(&[cmd])?;
        self.cs.set_high()?;
        Ok(())
    }

    #[inline(always)]
    fn send_data(&mut self, data: &[u8]) -> anyhow::Result<()> {
        self.dc.set_high()?;
        self.cs.set_low()?;
        self.spi.write(data)?;
        self.cs.set_high()?;
        Ok(())
    }

    /// Wait for BUSY pin to go HIGH (ready state).
    /// Low = busy refreshing or powering on/off.
    pub fn wait_busy(&self, timeout_ms: u64) -> anyhow::Result<()> {
        let start = Instant::now();
        FreeRtos::delay_ms(20);
        while self.busy.is_low() {
            if start.elapsed().as_millis() > timeout_ms as u128 {
                warn!("[EPD] BUSY timeout after {} ms!", timeout_ms);
                break;
            }
            sleep(Duration::from_millis(50));
        }
        Ok(())
    }

    /// Initializes hardware: Reset pulse, panel configuration, power on.
    pub fn init_hw(&mut self) -> anyhow::Result<()> {
        // 1. Hardware reset pulse
        self.rst.set_low()?;
        FreeRtos::delay_ms(40);
        self.rst.set_high()?;
        FreeRtos::delay_ms(50);
        self.wait_busy(2000)?;
        FreeRtos::delay_ms(30);

        // 2. Panel Setting (PSR 0x00 -> 0x0B)
        self.send_cmd(0x00)?;
        self.send_data(&[0x0B])?;

        // 3. Resolution Setting (TRES 0x61 -> 768 x 600 scan range)
        self.send_cmd(0x61)?;
        self.send_data(&[0x03, 0x00, 0x02, 0x58])?;

        // 4. Power On Boost Circuit (0x04)
        self.send_cmd(0x04)?;
        self.wait_busy(2000)?;

        info!("[EPD] Hardware initialization complete.");
        Ok(())
    }

    /// Flushes the 105,984-byte framebuffer to EPD using interlaced gate scanline mapping,
    /// triggers full physical waveform refresh (15~16s), and powers off boost.
    pub fn display(&mut self, fb: &Framebuffer) -> anyhow::Result<()> {
        info!("[EPD] Starting display transmission and 16s full refresh...");
        self.init_hw()?;

        let mut area_buf = [0x00u8, 0x00, 0x02, 0xFF, 0, 0, 0, 0, 0x01];
        let raw_buf = fb.as_slice();
        let is_a1 = matches!(self.panel_version, PanelVersion::A1);
        let flip_180 = self.flip_180;

        // Transmit 552 scanlines with physical interlacing address conversion
        for s2 in 0..EPD_HEIGHT {
            let row = if flip_180 { 551 - s2 } else { s2 };

            let y: u16 = if is_a1 {
                if s2 <= 299 {
                    (s2 * 2).saturating_sub(599) as u16
                } else {
                    (s2 * 2) as u16
                }
            } else {
                if s2 <= 275 {
                    (s2 * 2) as u16
                } else {
                    (1103 - 2 * s2) as u16
                }
            };

            area_buf[4] = (y >> 8) as u8;
            area_buf[5] = (y & 0xFF) as u8;
            area_buf[6] = (y >> 8) as u8;
            area_buf[7] = (y & 0xFF) as u8;

            // 0x83: Set Partial RAM Area
            self.send_cmd(0x83)?;
            self.send_data(&area_buf)?;

            // 0x10: Write RAM Data (192 bytes / scanline)
            self.send_cmd(0x10)?;
            let start = row * BYTES_PER_ROW;
            self.send_data(&raw_buf[start..start + BYTES_PER_ROW])?;
        }

        // Restore RAM scanning area to default (0..767, 0..599)
        self.send_cmd(0x83)?;
        self.send_data(&[0x00, 0x00, 0x02, 0xFF, 0x00, 0x00, 0x02, 0x57, 0x01])?;

        // Trigger 4-color physical waveform full refresh (0x12, 0x01)
        info!("[EPD] Triggering physical waveform refresh (~15s)...");
        self.send_cmd(0x12)?;
        self.send_data(&[0x01])?;
        self.wait_busy(35000)?;

        // Power off high voltage circuit to protect display from overcharging
        self.send_cmd(0x02)?;
        self.send_data(&[0x00])?;
        self.wait_busy(5000)?;

        info!("[EPD] Refresh successfully completed!");
        Ok(())
    }

    /// Puts the EPD controller into ultra-low-power sleep mode (< 5 uA).
    pub fn sleep(&mut self) -> anyhow::Result<()> {
        self.send_cmd(0x02)?;
        self.send_data(&[0x00])?;
        self.wait_busy(3000)?;

        // Deep sleep entry command (0x07 -> 0xA5)
        self.send_cmd(0x07)?;
        self.send_data(&[0xA5])?;
        FreeRtos::delay_ms(200);

        info!("[EPD] Controller entered deep sleep.");
        Ok(())
    }
}
