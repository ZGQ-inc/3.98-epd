// src/display/mod.rs — Display subsystem

pub mod color;
pub mod crc;
pub mod driver;
pub mod engine;
pub mod font;
pub mod framebuffer;

#[allow(unused_imports)]
pub use color::BwryColor;
#[allow(unused_imports)]
pub use crc::compute_fb_crc;
pub use driver::{EpdDriver, PanelVersion};
#[allow(unused_imports)]
pub use engine::{
    is_unconfigured, overlay_low_battery_warning, request_clear_color, request_clear_white,
    request_clear_yellow, request_direct_bitmap, request_layout, request_low_battery_warning,
    request_mode, request_pwa_guide, request_refresh, request_welcome, request_wifi_demo,
    run_display_loop, set_unconfigured,
};
#[allow(unused_imports)]
pub use font::{FontHelper, FontSize};
#[allow(unused_imports)]
pub use framebuffer::{Framebuffer, BYTES_PER_ROW, EPD_HEIGHT, EPD_WIDTH, TOTAL_BUFFER_SIZE};
