// src/display/color.rs — 4-Color (BWRY) Pixel Color Definition

use embedded_graphics_core::pixelcolor::PixelColor;

/// SE0398NZ07 4-Color (BWRY) Palette definition:
/// - 0b00: Black
/// - 0b01: White
/// - 0b10: Yellow
/// - 0b11: Red
#[derive(Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Hash, Debug, Default)]
#[repr(u8)]
pub enum BwryColor {
    Black = 0b00,
    #[default]
    White = 0b01,
    Yellow = 0b10,
    Red = 0b11,
}

impl BwryColor {
    pub const BLACK: Self = Self::Black;
    pub const WHITE: Self = Self::White;
    pub const YELLOW: Self = Self::Yellow;
    pub const RED: Self = Self::Red;

    /// Returns the 2-bit raw representation (0..=3).
    #[inline(always)]
    pub const fn raw_value(self) -> u8 {
        self as u8
    }

    /// Converts raw 2-bit integer to `BwryColor`.
    #[inline(always)]
    pub const fn from_raw(raw: u8) -> Self {
        match raw & 0x03 {
            0b00 => Self::Black,
            0b01 => Self::White,
            0b10 => Self::Yellow,
            0b11 => Self::Red,
            _ => unreachable!(),
        }
    }

    /// Returns standard RGB hex string for Web preview simulation.
    pub const fn to_rgb_hex(self) -> &'static str {
        match self {
            Self::Black => "#000000",
            Self::White => "#FFFFFF",
            Self::Yellow => "#F4C430",
            Self::Red => "#D32F2F",
        }
    }
}

impl PixelColor for BwryColor {
    type Raw = embedded_graphics_core::pixelcolor::raw::RawU2;
}

impl From<BwryColor> for embedded_graphics_core::pixelcolor::raw::RawU2 {
    #[inline(always)]
    fn from(color: BwryColor) -> Self {
        Self::new(color.raw_value())
    }
}
