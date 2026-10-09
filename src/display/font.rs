// src/display/font.rs — Chinese & ASCII Vector/Dot-Matrix Typography Engine
//
// Uses the C3 mini Chinese font binary (HZK16 + ASC16 + Sorted Unicode Index)
// flashed at the 'storage' partition (0x320000).
// Zero heap RAM consumed via ESP32-C3 hardware MMU partition memory-mapping!

use crate::display::{color::BwryColor, framebuffer::Framebuffer, EPD_WIDTH};
use log::{info, warn};

static mut FONT_DATA_PTR: *const u8 = std::ptr::null();
static mut FONT_DATA_LEN: usize = 0;
static mut FONT_INITIALIZED: bool = false;

pub struct Glyph<'a> {
    pub width: usize,
    pub height: usize,
    pub bitmap: &'a [u8],
}

/// Initializes and memory-maps the Chinese font partition into CPU address space.
pub fn init_chinese_font() -> bool {
    unsafe {
        if FONT_INITIALIZED && !FONT_DATA_PTR.is_null() {
            return true;
        }

        let part_name = std::ffi::CString::new("storage").unwrap();
        let part = esp_idf_svc::sys::esp_partition_find_first(
            esp_idf_svc::sys::esp_partition_type_t_ESP_PARTITION_TYPE_DATA,
            esp_idf_svc::sys::esp_partition_subtype_t_ESP_PARTITION_SUBTYPE_ANY,
            part_name.as_ptr(),
        );

        if part.is_null() {
            warn!("[FONT] 'storage' partition not found in partition table");
            return false;
        }

        let part_size = (*part).size as usize;
        let mut map_handle: esp_idf_svc::sys::esp_partition_mmap_handle_t = 0;
        let mut mapped_ptr: *const std::ffi::c_void = std::ptr::null();

        let err = esp_idf_svc::sys::esp_partition_mmap(
            part,
            0,
            part_size.min(512 * 1024),
            esp_idf_svc::sys::esp_partition_mmap_memory_t_ESP_PARTITION_MMAP_DATA,
            &mut mapped_ptr,
            &mut map_handle,
        );

        if err != esp_idf_svc::sys::ESP_OK || mapped_ptr.is_null() {
            warn!("[FONT] esp_partition_mmap failed with error code: {}", err);
            return false;
        }

        let header = std::slice::from_raw_parts(mapped_ptr as *const u8, 32);
        if &header[0..8] != b"EPDFONT1" {
            warn!("[FONT] Invalid font magic in storage partition: {:?}", &header[0..8]);
            return false;
        }

        let total_chars = u32::from_le_bytes(header[8..12].try_into().unwrap());
        FONT_DATA_PTR = mapped_ptr as *const u8;
        FONT_DATA_LEN = part_size;
        FONT_INITIALIZED = true;

        info!("[FONT] C3 Chinese font (HZK16 + ASC16) mapped successfully! Total glyphs: {}", total_chars);
        println!("  [font] Chinese dot-matrix font mapped via MMU: {} chars ready.", total_chars);
        true
    }
}

static EMBEDDED_ASC16: &[u8] = include_bytes!("../../asc16.bin");

/// Retrieves the bitmap glyph for an ASCII or Chinese character.
pub fn get_glyph(c: char) -> Option<Glyph<'static>> {
    let u = c as u32;
    // Guaranteed instant zero-dependency ASCII lookup
    if u < 128 {
        let start = (u as usize) * 16;
        if start + 16 <= EMBEDDED_ASC16.len() {
            return Some(Glyph {
                width: 8,
                height: 16,
                bitmap: &EMBEDDED_ASC16[start..start + 16],
            });
        }
    }

    unsafe {
        if FONT_DATA_PTR.is_null() {
            // Lazy auto-init if not already called
            if !init_chinese_font() {
                return None;
            }
        }

        let data = std::slice::from_raw_parts(FONT_DATA_PTR, FONT_DATA_LEN);
        let total_chars = u32::from_le_bytes(data[8..12].try_into().unwrap()) as usize;
        let idx_off = u32::from_le_bytes(data[20..24].try_into().unwrap()) as usize;
        let bmp_off = u32::from_le_bytes(data[24..28].try_into().unwrap()) as usize;

        if u <= 0xFFFF {
            let target_code = u as u16;
            // Binary search in sorted unicode index table
            let mut low = 0usize;
            let mut high = total_chars.saturating_sub(1);
            while low <= high {
                let mid = (low + high) / 2;
                let entry_offset = idx_off + mid * 4;
                if entry_offset + 4 > data.len() {
                    break;
                }
                let code = u16::from_le_bytes(data[entry_offset..entry_offset + 2].try_into().unwrap());
                let idx = u16::from_le_bytes(data[entry_offset + 2..entry_offset + 4].try_into().unwrap());

                if code == target_code {
                    let start = bmp_off + (idx as usize) * 32;
                    if start + 32 <= data.len() {
                        return Some(Glyph {
                            width: 16,
                            height: 16,
                            bitmap: &data[start..start + 32],
                        });
                    }
                    break;
                } else if code < target_code {
                    low = mid + 1;
                } else {
                    if mid == 0 {
                        break;
                    }
                    high = mid - 1;
                }
            }
        }
        None
    }
}

/// Renders a single glyph at (x, y) with optional integer scaling (1x, 2x, 3x...).
pub fn draw_glyph(fb: &mut Framebuffer, x: usize, y: usize, glyph: &Glyph, color: BwryColor, scale: usize) {
    let scale = scale.max(1);
    for row in 0..glyph.height {
        let bytes_per_row = (glyph.width + 7) / 8;
        for col in 0..glyph.width {
            let byte_idx = row * bytes_per_row + (col / 8);
            let bit_idx = 7 - (col % 8);
            if (glyph.bitmap[byte_idx] & (1 << bit_idx)) != 0 {
                for sy in 0..scale {
                    for sx in 0..scale {
                        fb.set_pixel(x + col * scale + sx, y + row * scale + sy, color);
                    }
                }
            }
        }
    }
}

/// Measures text pixel width and height.
pub fn measure_text(text: &str, scale: usize) -> (usize, usize) {
    let scale = scale.max(1);
    let mut total_w = 0;
    for c in text.chars() {
        if let Some(glyph) = get_glyph(c) {
            total_w += glyph.width * scale;
        } else {
            total_w += if (c as u32) < 128 { 8 * scale } else { 16 * scale };
        }
    }
    (total_w, 16 * scale)
}

/// Draws UTF-8 Chinese and ASCII mixed text at (x, y) with scaling and newline support.
pub fn draw_chinese_text(
    fb: &mut Framebuffer,
    mut x: usize,
    mut y: usize,
    text: &str,
    color: BwryColor,
    scale: usize,
) -> (usize, usize) {
    let scale = scale.max(1);
    let start_x = x;
    let line_height = 20 * scale;
    let mut max_x = x;

    for c in text.chars() {
        if c == '\n' {
            x = start_x;
            y += line_height;
            continue;
        }
        if let Some(glyph) = get_glyph(c) {
            if x + glyph.width * scale > EPD_WIDTH {
                x = start_x;
                y += line_height;
            }
            draw_glyph(fb, x, y, &glyph, color, scale);
            x += glyph.width * scale;
            if x > max_x {
                max_x = x;
            }
        } else {
            // Space or unmapped character
            let w = if (c as u32) < 128 { 8 * scale } else { 16 * scale };
            x += w;
            if x > max_x {
                max_x = x;
            }
        }
    }
    (max_x.saturating_sub(start_x), y + line_height)
}

/// Draws horizontally centered text on the screen at coordinate y.
pub fn draw_chinese_text_centered(
    fb: &mut Framebuffer,
    y: usize,
    text: &str,
    color: BwryColor,
    scale: usize,
) {
    let (w, _) = measure_text(text, scale);
    let x = (EPD_WIDTH.saturating_sub(w)) / 2;
    draw_chinese_text(fb, x, y, text, color, scale);
}

// ---------------------------------------------------------------------
// Compatibility Adapter for FontHelper & FontSize callers
// ---------------------------------------------------------------------
#[derive(Clone, Copy, Debug)]
pub enum FontSize {
    Small,      // 1x scale (8x16 ASCII, 16x16 Chinese)
    Medium,     // 1x scale with spacing
    Large,      // 2x scale (16x32 ASCII, 32x32 Chinese)
    BoldHeader, // 3x scale (24x48 ASCII, 48x48 Chinese)
}

pub struct FontHelper;

impl FontHelper {
    pub fn draw_text(
        fb: &mut Framebuffer,
        text: &str,
        x: i32,
        y: i32,
        color: BwryColor,
        size: FontSize,
    ) {
        let scale = match size {
            FontSize::Small => 1,
            FontSize::Medium => 1,
            FontSize::Large => 2,
            FontSize::BoldHeader => 3,
        };
        draw_chinese_text(fb, x.max(0) as usize, y.max(0) as usize, text, color, scale);
    }

    pub fn draw_centered_text(
        fb: &mut Framebuffer,
        text: &str,
        _center_x: i32,
        y: i32,
        color: BwryColor,
        size: FontSize,
    ) {
        let scale = match size {
            FontSize::Small => 1,
            FontSize::Medium => 1,
            FontSize::Large => 2,
            FontSize::BoldHeader => 3,
        };
        draw_chinese_text_centered(fb, y.max(0) as usize, text, color, scale);
    }
}
