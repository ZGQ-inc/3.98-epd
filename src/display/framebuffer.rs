// src/display/framebuffer.rs — 768×552 Static Framebuffer & embedded-graphics DrawTarget

use crate::display::color::BwryColor;
use embedded_graphics_core::{
    draw_target::DrawTarget,
    geometry::{OriginDimensions, Size},
    Pixel,
};

pub const EPD_WIDTH: usize = 768;
pub const EPD_HEIGHT: usize = 552;
pub const BYTES_PER_ROW: usize = EPD_WIDTH / 4; // 192 bytes
pub const TOTAL_BUFFER_SIZE: usize = BYTES_PER_ROW * EPD_HEIGHT; // 105,984 bytes

/// Static Framebuffer array allocated in .bss (105,984 bytes / 103.5 KB)
/// Placed in .bss section at link time — 0 bytes of dynamic heap consumed!
static mut EPD_STATIC_BUFFER: [u8; TOTAL_BUFFER_SIZE] = [0x55; TOTAL_BUFFER_SIZE];

pub struct Framebuffer {
    data: &'static mut [u8; TOTAL_BUFFER_SIZE],
}

impl Framebuffer {
    /// Creates a new Framebuffer reference initialized to White (0x55).
    pub fn new() -> Self {
        let mut fb = unsafe {
            Self {
                data: &mut EPD_STATIC_BUFFER,
            }
        };
        fb.clear_color(BwryColor::White);
        fb
    }


    /// Direct access to raw byte buffer for SPI DMA / scanline transmission.
    #[inline(always)]
    pub fn as_slice(&self) -> &[u8] {
        &self.data[..]
    }

    /// Mutable access to raw byte buffer.
    #[inline(always)]
    pub fn as_mut_slice(&mut self) -> &mut [u8] {
        &mut self.data[..]
    }

    /// Fast clear with designated color.
    pub fn clear_color(&mut self, color: BwryColor) {
        let pattern = match color {
            BwryColor::Black => 0x00,  // 0b00000000
            BwryColor::White => 0x55,  // 0b01010101
            BwryColor::Yellow => 0xAA, // 0b10101010
            BwryColor::Red => 0xFF,    // 0b11111111
        };
        self.data.fill(pattern);
    }

    /// Set a single pixel color with bounds checking.
    #[inline]
    pub fn set_pixel(&mut self, x: usize, y: usize, color: BwryColor) {
        if x >= EPD_WIDTH || y >= EPD_HEIGHT {
            return;
        }
        let byte_idx = y * BYTES_PER_ROW + (x >> 2);
        let shift = (3 - (x & 0x03)) * 2;
        let mask = !(0x03 << shift);
        let val = (color.raw_value() & 0x03) << shift;
        self.data[byte_idx] = (self.data[byte_idx] & mask) | val;
    }

    /// Read a single pixel color.
    #[inline]
    pub fn get_pixel(&self, x: usize, y: usize) -> BwryColor {
        if x >= EPD_WIDTH || y >= EPD_HEIGHT {
            return BwryColor::White;
        }
        let byte_idx = y * BYTES_PER_ROW + (x >> 2);
        let shift = (3 - (x & 0x03)) * 2;
        let raw = (self.data[byte_idx] >> shift) & 0x03;
        BwryColor::from_raw(raw)
    }

    /// Fast blit of pre-quantized 2-bit raw bitmap data.
    /// `x` and `w` must be multiples of 4 for direct byte alignment.
    pub fn blit_raw_2bpp(&mut self, x: usize, y: usize, w: usize, h: usize, raw_data: &[u8]) {
        let x_byte = x / 4;
        let row_bytes = w / 4;
        for r in 0..h {
            let target_y = y + r;
            if target_y >= EPD_HEIGHT {
                break;
            }
            let target_start = target_y * BYTES_PER_ROW + x_byte;
            let src_start = r * row_bytes;
            let copy_len = row_bytes.min(BYTES_PER_ROW.saturating_sub(x_byte));
            if src_start + copy_len <= raw_data.len() {
                self.data[target_start..target_start + copy_len]
                    .copy_from_slice(&raw_data[src_start..src_start + copy_len]);
            }
        }
    }

    /// Fill a rectangle with a solid color.
    pub fn fill_rect(&mut self, x: usize, y: usize, w: usize, h: usize, color: BwryColor) {
        let x_end = (x + w).min(EPD_WIDTH);
        let y_end = (y + h).min(EPD_HEIGHT);
        for cy in y..y_end {
            for cx in x..x_end {
                self.set_pixel(cx, cy, color);
            }
        }
    }

    /// Draw a 1-pixel hollow rectangle outline.
    pub fn rect(&mut self, x: usize, y: usize, w: usize, h: usize, color: BwryColor) {
        if w == 0 || h == 0 {
            return;
        }
        let x_end = (x + w).min(EPD_WIDTH);
        let y_end = (y + h).min(EPD_HEIGHT);
        for cx in x..x_end {
            self.set_pixel(cx, y, color);
            if y_end > y {
                self.set_pixel(cx, y_end - 1, color);
            }
        }
        for cy in y..y_end {
            self.set_pixel(x, cy, color);
            if x_end > x {
                self.set_pixel(x_end - 1, cy, color);
            }
        }
    }

    /// Draw a horizontal line.
    pub fn hline(&mut self, x: usize, y: usize, w: usize, color: BwryColor) {
        let x_end = (x + w).min(EPD_WIDTH);
        if y < EPD_HEIGHT {
            for cx in x..x_end {
                self.set_pixel(cx, y, color);
            }
        }
    }

    /// Draw a vertical line.
    pub fn vline(&mut self, x: usize, y: usize, h: usize, color: BwryColor) {
        let y_end = (y + h).min(EPD_HEIGHT);
        if x < EPD_WIDTH {
            for cy in y..y_end {
                self.set_pixel(x, cy, color);
            }
        }
    }
}

impl OriginDimensions for Framebuffer {
    fn size(&self) -> Size {
        Size::new(EPD_WIDTH as u32, EPD_HEIGHT as u32)
    }
}

impl DrawTarget for Framebuffer {
    type Color = BwryColor;
    type Error = core::convert::Infallible;

    fn draw_iter<I>(&mut self, pixels: I) -> Result<(), Self::Error>
    where
        I: IntoIterator<Item = Pixel<Self::Color>>,
    {
        for Pixel(point, color) in pixels.into_iter() {
            if point.x >= 0 && point.y >= 0 {
                let x = point.x as usize;
                let y = point.y as usize;
                if x < EPD_WIDTH && y < EPD_HEIGHT {
                    self.set_pixel(x, y, color);
                }
            }
        }
        Ok(())
    }

    fn clear(&mut self, color: Self::Color) -> Result<(), Self::Error> {
        self.clear_color(color);
        Ok(())
    }
}

/// Write a slice of raw 2bpp bytes into the static buffer at a given offset.
pub fn write_raw_chunk(offset: usize, chunk: &[u8]) -> usize {
    unsafe {
        let max_len = TOTAL_BUFFER_SIZE.saturating_sub(offset);
        let len = chunk.len().min(max_len);
        if len > 0 {
            std::ptr::copy_nonoverlapping(chunk.as_ptr(), EPD_STATIC_BUFFER.as_mut_ptr().add(offset), len);
        }
        len
    }
}

/// Read a slice of raw bytes from the static buffer.
pub fn read_raw_chunk(offset: usize, dest: &mut [u8]) -> usize {
    unsafe {
        let max_len = TOTAL_BUFFER_SIZE.saturating_sub(offset);
        let len = dest.len().min(max_len);
        if len > 0 {
            std::ptr::copy_nonoverlapping(EPD_STATIC_BUFFER.as_ptr().add(offset), dest.as_mut_ptr(), len);
        }
        len
    }
}

