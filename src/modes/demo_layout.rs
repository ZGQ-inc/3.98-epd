// src/modes/demo_layout.rs — MicroPython-Style Standby & Default Demo Layout
//
// 768 x 552 BWRY 4-Color High-Contrast Card Layout
// Faithful modern recreation of the MicroPython demo aesthetic:
// - Top status banner (H: 54) with Black fill, Red and Yellow accent underlines
// - Left Card 1: Workspace Overview with 4-Color Swatches ([BLA], [WHI], [YEL], [RED])
// - Left Card 2: Network & Access Information (SSID, IP, Port, mDNS)
// - Right Top Card: Web Dashboard status badge
// - Right Main Card: High-visibility WebUI Access Portal with prominent URL & features
// - Right Bottom Tag: System status banner

use crate::display::{
    color::BwryColor,
    font::draw_chinese_text,
    framebuffer::{Framebuffer, EPD_WIDTH},
};
use crate::modes::ModeContext;

pub fn render_demo_layout(fb: &mut Framebuffer, ctx: &ModeContext) {
    // 1. Pure white background
    fb.clear_color(BwryColor::White);

    // 2. Top Main Status Bar (Y: 0 ~ 54)
    fb.fill_rect(0, 0, EPD_WIDTH, 54, BwryColor::Black);
    fb.hline(0, 54, EPD_WIDTH, BwryColor::Red);
    fb.hline(0, 55, EPD_WIDTH, BwryColor::Red);
    fb.hline(0, 56, EPD_WIDTH, BwryColor::Yellow);

    draw_chinese_text(fb, 32, 12, "3.98\" SMART EPD", BwryColor::White, 2);
    draw_chinese_text(fb, EPD_WIDTH - 250, 12, "ONLINE / READY", BwryColor::Yellow, 2);

    // 3. Left Card 1: Workspace Overview (X: 24, Y: 75, W: 410, H: 230)
    fb.fill_rect(24, 75, 410, 230, BwryColor::White);
    fb.rect(24, 75, 410, 230, BwryColor::Black);
    fb.rect(26, 77, 406, 226, BwryColor::Yellow);
    fb.fill_rect(28, 79, 402, 40, BwryColor::Black);
    draw_chinese_text(fb, 42, 90, "WORKSPACE OVERVIEW", BwryColor::White, 1);

    draw_chinese_text(fb, 45, 134, "PANEL : SE0398NZ07 4-COLOR", BwryColor::Black, 1);
    draw_chinese_text(fb, 45, 168, "RES   : 768 x 552 BWRY E-INK", BwryColor::Black, 1);
    draw_chinese_text(fb, 45, 202, "STATUS: ONLINE & ACTIVE", BwryColor::Red, 1);

    // 4 Color Swatches (Y: 242)
    let swatches = [
        ("BLA", BwryColor::Black, BwryColor::White),
        ("WHI", BwryColor::White, BwryColor::Black),
        ("YEL", BwryColor::Yellow, BwryColor::Black),
        ("RED", BwryColor::Red, BwryColor::White),
    ];
    for (i, (name, bg_c, fg_c)) in swatches.iter().enumerate() {
        let sx = 42 + i * 93;
        let sy = 242;
        fb.fill_rect(sx, sy, 85, 44, *bg_c);
        fb.rect(sx, sy, 85, 44, BwryColor::Black);
        draw_chinese_text(fb, sx + 26, sy + 14, name, *fg_c, 1);
    }

    // 4. Left Card 2: Network & WebUI Access (X: 24, Y: 322, W: 410, H: 208)
    fb.rect(24, 322, 410, 208, BwryColor::Black);
    fb.rect(26, 324, 406, 204, BwryColor::Red);
    fb.fill_rect(28, 326, 402, 38, BwryColor::Red);
    draw_chinese_text(fb, 42, 336, "NETWORK & ACCESS INFO", BwryColor::White, 1);

    let ssid_line = format!("WIFI  : {}", ctx.wifi_ssid);
    let ip_line = format!("IP    : {}", ctx.ip_str);
    let url_line = format!("WEBUI : http://{}/", ctx.ip_str);
    let mdns_line = "MDNS  : http://epd-display.local/";
    let port_line = "PORT  : 80 (HTTP WEB & REST API)";

    draw_chinese_text(fb, 45, 376, &ssid_line, BwryColor::Black, 1);
    draw_chinese_text(fb, 45, 406, &ip_line, BwryColor::Black, 1);
    draw_chinese_text(fb, 45, 436, &url_line, BwryColor::Red, 1);
    draw_chinese_text(fb, 45, 466, mdns_line, BwryColor::Black, 1);
    draw_chinese_text(fb, 45, 496, port_line, BwryColor::Black, 1);

    // 5. Right Top Widget: Dashboard Status (X: 456, Y: 75, W: 288, H: 85)
    fb.fill_rect(456, 75, 288, 85, BwryColor::Black);
    fb.rect(454, 73, 292, 89, BwryColor::Red);
    draw_chinese_text(fb, 480, 84, "CONTROL", BwryColor::Yellow, 2);
    draw_chinese_text(fb, 480, 124, "WEB DASHBOARD", BwryColor::White, 1);

    // 6. Right Middle Widget: WebUI Access Portal Card (X: 456, Y: 175, W: 288, H: 290)
    // Triple outer border (Black, Red, Yellow) matching the demo aesthetic
    fb.rect(456, 175, 288, 290, BwryColor::Black);
    fb.rect(458, 177, 284, 286, BwryColor::Red);
    fb.rect(460, 179, 280, 282, BwryColor::Yellow);

    // Card Header Bar
    fb.fill_rect(462, 181, 276, 36, BwryColor::Black);
    draw_chinese_text(fb, 480, 192, "WEBUI ACCESS PORTAL", BwryColor::Yellow, 1);

    // Card Body Content: Prominent URL Display
    draw_chinese_text(fb, 474, 230, "浏览器直接访问网址:", BwryColor::Black, 1);
    draw_chinese_text(fb, 474, 252, "http://", BwryColor::Black, 1);
    draw_chinese_text(fb, 474, 272, &ctx.ip_str, BwryColor::Red, 2);
    draw_chinese_text(fb, 474, 308, "或 epd-display.local", BwryColor::Black, 1);

    fb.hline(470, 330, 260, BwryColor::Black);

    // Features Checklist
    draw_chinese_text(fb, 474, 342, "• Material Web 3.0 控制台", BwryColor::Black, 1);
    draw_chinese_text(fb, 474, 368, "• 17 种场景模式与参数定制", BwryColor::Black, 1);
    draw_chinese_text(fb, 474, 394, "• 4 色全阶画板与自由排版", BwryColor::Black, 1);
    draw_chinese_text(fb, 474, 420, "• 双稳态断电记忆 零耗电", BwryColor::Red, 1);

    // 7. Right Bottom Tag: Ready Bar (X: 456, Y: 480, W: 288, H: 50)
    fb.fill_rect(456, 480, 288, 50, BwryColor::Black);
    fb.rect(454, 478, 292, 54, BwryColor::Yellow);
    draw_chinese_text(fb, 496, 495, "SMART EPD · READY", BwryColor::Yellow, 1);
}
