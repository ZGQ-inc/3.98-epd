// src/modes/mod.rs — 17 Comprehensive Display Modes Pipeline & Dispatcher

pub mod custom_layout;
pub mod demo_layout;
pub mod provisioning;

use embedded_graphics::{
    prelude::*,
    primitives::{Circle, Line, PrimitiveStyleBuilder, Rectangle},
};

use crate::display::{
    color::BwryColor,
    font::{FontHelper, FontSize},
    framebuffer::{Framebuffer, EPD_HEIGHT, EPD_WIDTH},
};

pub struct ModeContext {
    pub current_time_str: String,
    pub date_str: String,
    pub weekday_str: String,
    pub ip_str: String,
    pub wifi_ssid: String,
    pub temp_str: String,
    pub weather_desc: String,
    pub weather_alert: Option<String>,
    pub memo_items: Vec<String>,
    pub memo_text: String,
    pub fridge_title: String,
    pub fridge_note: String,
    pub fridge_author: String,
    pub custom_layout_json: Option<String>,
}

impl Default for ModeContext {
    fn default() -> Self {
        Self {
            current_time_str: "12:00".to_string(),
            date_str: "2026-10-07".to_string(),
            weekday_str: "Wednesday".to_string(),
            ip_str: "192.168.1.100".to_string(),
            wifi_ssid: "Home-WiFi".to_string(),
            temp_str: "24°C".to_string(),
            weather_desc: "Clear Sky".to_string(),
            weather_alert: None,
            memo_items: vec![
                "出门记得关阳台窗户".into(),
                "晚饭煮番茄牛腩面".into(),
                "晚上 9 点检查作业".into(),
            ],
            memo_text: "出门记得关阳台窗户\n晚饭煮番茄牛腩面\n晚上 9 点检查作业".into(),
            fridge_title: "家庭核心留言板".into(),
            fridge_note: "冰箱冷藏室温度良好，记得晚上回家买鲜奶和全麦面包！".into(),
            fridge_author: "爸爸".into(),
            custom_layout_json: None,
        }
    }
}

pub trait DisplayMode: Send + Sync {
    fn id(&self) -> &'static str;
    fn name(&self) -> &'static str;
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()>;
}

// ── Shared UI Drawing Helpers ────────────────────────────────────────────────
fn draw_top_banner(fb: &mut Framebuffer, title: &str, right_sub: &str) {
    let header = Rectangle::new(Point::new(0, 0), Size::new(EPD_WIDTH as u32, 50))
        .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Black).build());
    let _ = header.draw(fb);

    FontHelper::draw_text(fb, title, 30, 32, BwryColor::White, FontSize::BoldHeader);
    FontHelper::draw_text(fb, right_sub, (EPD_WIDTH - 240) as i32, 32, BwryColor::Yellow, FontSize::Medium);
}

fn draw_bottom_bar(fb: &mut Framebuffer, footer: &str) {
    let bar = Rectangle::new(Point::new(0, (EPD_HEIGHT - 35) as i32), Size::new(EPD_WIDTH as u32, 35))
        .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Black).build());
    let _ = bar.draw(fb);

    FontHelper::draw_centered_text(fb, footer, (EPD_WIDTH / 2) as i32, (EPD_HEIGHT - 12) as i32, BwryColor::White, FontSize::Small);
}

// ── Mode 1: Memo / Bulletin ───────────────────────────────────────────────────
pub struct MemoMode;
impl DisplayMode for MemoMode {
    fn id(&self) -> &'static str { "memo" }
    fn name(&self) -> &'static str { "便签与备忘录 (Memo)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);

        // Top Banner (Black with Yellow accent)
        fb.fill_rect(0, 0, 768, 48, BwryColor::Black);
        fb.fill_rect(0, 48, 768, 2, BwryColor::Yellow);
        crate::display::font::draw_chinese_text(fb, 24, 12, "MEMO & TO-DO LIST", BwryColor::White, 2);
        crate::display::font::draw_chinese_text(fb, 520, 12, "TODAY PRIORITY", BwryColor::Yellow, 2);

        // Checklist rows
        let items: Vec<&str> = if !ctx.memo_text.is_empty() {
            ctx.memo_text.lines().collect()
        } else {
            ctx.memo_items.iter().map(|s| s.as_str()).collect()
        };

        let mut y = 68;
        for (i, item) in items.iter().take(6).enumerate() {
            // Row card border
            fb.rect(28, y, 712, 58, BwryColor::Black);
            // Checkbox outline
            let chk_color = if i == 0 { BwryColor::Red } else { BwryColor::Black };
            fb.rect(45, y + 16, 26, 26, chk_color);
            if i == 0 {
                fb.fill_rect(49, y + 20, 18, 18, BwryColor::Red);
            }
            // Text
            let text_color = if i == 0 { BwryColor::Red } else { BwryColor::Black };
            crate::display::font::draw_chinese_text(fb, 85, y + 20, item, text_color, 1);
            y += 70;
        }

        // Bottom status bar
        fb.fill_rect(0, 488, 768, 36, BwryColor::Black);
        let footer = format!("Items: {} | IP: {} | 墨水屏双稳态零功耗保持", items.len(), ctx.ip_str);
        crate::display::font::draw_chinese_text_centered(fb, 498, &footer, BwryColor::White, 1);
        Ok(())
    }
}

// ── Mode 2: Calendar & Almanac ────────────────────────────────────────────────
pub struct CalendarMode;
impl DisplayMode for CalendarMode {
    fn id(&self) -> &'static str { "calendar" }
    fn name(&self) -> &'static str { "大字日历与老黄历 (Calendar)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "MONTHLY CALENDAR", &ctx.date_str);

        // Big Today Card
        let card = Rectangle::new(Point::new(40, 80), Size::new(280, 400))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Black).stroke_width(2).build());
        let _ = card.draw(fb);

        FontHelper::draw_centered_text(fb, &ctx.weekday_str, 180, 130, BwryColor::Black, FontSize::BoldHeader);
        FontHelper::draw_centered_text(fb, "07", 180, 260, BwryColor::Red, FontSize::BoldHeader);
        FontHelper::draw_centered_text(fb, "丙午年 农历八月廿七", 180, 360, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_centered_text(fb, "【宜】祈福 祭祀 编码", 180, 410, BwryColor::Black, FontSize::Small);

        // Right-side 7-day schedule
        let schedule_x = 360;
        FontHelper::draw_text(fb, "UPCOMING EVENTS & TASKS", schedule_x, 100, BwryColor::Black, FontSize::Large);
        let divider = Line::new(Point::new(schedule_x, 115), Point::new(720, 115))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Yellow).stroke_width(3).build());
        let _ = divider.draw(fb);

        for (idx, task) in ctx.memo_items.iter().enumerate() {
            let ty = 150 + (idx as i32 * 45);
            if ty > 450 { break; }
            FontHelper::draw_text(fb, task, schedule_x, ty, BwryColor::Black, FontSize::Medium);
        }

        draw_bottom_bar(fb, &format!("Synced via RTC & SNTP | {}", ctx.ip_str));
        Ok(())
    }
}

// ── Mode 3: Photo Frame ───────────────────────────────────────────────────────
pub struct PhotoFrameMode;
impl DisplayMode for PhotoFrameMode {
    fn id(&self) -> &'static str { "photo" }
    fn name(&self) -> &'static str { "电子相框 (Photo Frame)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "EPD PHOTO GALLERY", &ctx.date_str);

        // Decorative Art Frame
        let outer = Rectangle::new(Point::new(30, 70), Size::new(708, 420))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Black).stroke_width(3).build());
        let _ = outer.draw(fb);

        let inner = Rectangle::new(Point::new(45, 85), Size::new(678, 390))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Yellow).stroke_width(2).build());
        let _ = inner.draw(fb);

        // Photo Center Card
        FontHelper::draw_centered_text(fb, "3.98\" ART GALLERY FRAME", (EPD_WIDTH / 2) as i32, 230, BwryColor::Red, FontSize::BoldHeader);
        FontHelper::draw_centered_text(fb, "Upload 768x552 photos in Web Console Studio", (EPD_WIDTH / 2) as i32, 290, BwryColor::Black, FontSize::Large);
        FontHelper::draw_centered_text(fb, "Hardware 4-Color Dither Engine Ready", (EPD_WIDTH / 2) as i32, 340, BwryColor::Black, FontSize::Medium);

        draw_bottom_bar(fb, &format!("Photo Slideshow Active | {}", ctx.ip_str));
        Ok(())
    }
}

// ── Mode 4: OpenWeather Comprehensive Weather ────────────────────────────────
pub struct WeatherMode;
impl DisplayMode for WeatherMode {
    fn id(&self) -> &'static str { "weather" }
    fn name(&self) -> &'static str { "全维气象看板 (Weather)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "WEATHER DASHBOARD", &format!("{} | {}", ctx.date_str, ctx.temp_str));

        // Alert box if present
        if let Some(ref alert) = ctx.weather_alert {
            let alert_box = Rectangle::new(Point::new(30, 70), Size::new(708, 40))
                .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Red).build());
            let _ = alert_box.draw(fb);
            FontHelper::draw_centered_text(fb, alert, (EPD_WIDTH / 2) as i32, 95, BwryColor::White, FontSize::Medium);
        }

        // Current weather main block
        let main_y = if ctx.weather_alert.is_some() { 130 } else { 85 };
        FontHelper::draw_text(fb, &ctx.temp_str, 50, main_y + 60, BwryColor::Red, FontSize::BoldHeader);
        FontHelper::draw_text(fb, &ctx.weather_desc, 50, main_y + 110, BwryColor::Black, FontSize::Large);
        FontHelper::draw_text(fb, "Humidity: 65% | Wind: NE 3级 (12km/h)", 50, main_y + 150, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_text(fb, "AQI: 35 (Excellent) | UV Index: 4 (Moderate)", 50, main_y + 185, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_text(fb, "Sunrise: 06:18 | Sunset: 18:05", 50, main_y + 220, BwryColor::Black, FontSize::Medium);

        // 5-day forecast columns
        let fore_y = main_y + 250;
        let divider = Line::new(Point::new(40, fore_y), Point::new(728, fore_y))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Black).stroke_width(2).build());
        let _ = divider.draw(fb);

        let days = ["Thu", "Fri", "Sat", "Sun", "Mon"];
        let temps = ["25°/18°", "26°/19°", "23°/17°", "22°/16°", "24°/17°"];
        for i in 0..5 {
            let col_x = (60 + i * 135) as i32;
            FontHelper::draw_text(fb, days[i], col_x, fore_y + 35, BwryColor::Black, FontSize::Large);
            FontHelper::draw_text(fb, temps[i], col_x, fore_y + 65, BwryColor::Red, FontSize::Medium);
        }

        draw_bottom_bar(fb, &format!("OpenWeather OneCall API Synced | {}", ctx.ip_str));
        Ok(())
    }
}

// ── Mode 5: RSS Digest ────────────────────────────────────────────────────────
pub struct RssMode;
impl DisplayMode for RssMode {
    fn id(&self) -> &'static str { "rss" }
    fn name(&self) -> &'static str { "RSS 资讯早报 (RSS Digest)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "DAILY NEWS & TECH RSS", &ctx.date_str);

        let headlines = [
            ("[TECH]", "Rust 2024 Edition Officially Announced with New Features"),
            ("[AI]", "Next-Gen LLM Accelerates Embedded MCU IoT Intelligence"),
            ("[HARDWARE]", "Low Power 4-Color BWRY E-Paper Drives Future Smart Home"),
            ("[COMMUNITY]", "Open Source Smart Display Project Hits Milestone Release"),
            ("[SCIENCE]", "Global Clean Energy Generation Reaches Historic High"),
        ];

        let mut y = 90;
        for (tag, title) in headlines.iter() {
            let tag_box = Rectangle::new(Point::new(40, y - 22), Size::new(110, 30))
                .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Red).build());
            let _ = tag_box.draw(fb);
            FontHelper::draw_centered_text(fb, tag, 95, y, BwryColor::White, FontSize::Medium);

            FontHelper::draw_text(fb, title, 165, y, BwryColor::Black, FontSize::Large);

            let line = Line::new(Point::new(40, y + 25), Point::new(728, y + 25))
                .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Yellow).stroke_width(1).build());
            let _ = line.draw(fb);

            y += 70;
        }

        draw_bottom_bar(fb, &format!("RSS Feed Subscriptions (5 Active) | {}", ctx.ip_str));
        Ok(())
    }
}

// ── Mode 6: Fridge & Workshop Board ───────────────────────────────────────────
pub struct FridgeBoardMode;
impl DisplayMode for FridgeBoardMode {
    fn id(&self) -> &'static str { "fridge_board" }
    fn name(&self) -> &'static str { "冰箱贴专属看板 (Fridge Board)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);

        // 1. Top Red Banner
        fb.fill_rect(0, 0, 768, 54, BwryColor::Red);
        crate::display::font::draw_chinese_text(fb, 24, 12, "冰箱贴 · 极简家庭布告板", BwryColor::White, 2);
        let date_right = if ctx.weekday_str.is_empty() {
            ctx.date_str.clone()
        } else {
            format!("{} {}", ctx.date_str, ctx.weekday_str)
        };
        let (dw, _) = crate::display::font::measure_text(&date_right, 2);
        let dx = if 768 > dw + 24 { 768 - dw - 24 } else { 500 };
        crate::display::font::draw_chinese_text(fb, dx, 12, &date_right, BwryColor::Yellow, 2);

        // 2. Yellow Outlined Card (家庭核心留言板)
        fb.rect(36, 76, 696, 160, BwryColor::Yellow);
        fb.rect(37, 77, 694, 158, BwryColor::Yellow);
        fb.rect(38, 78, 692, 156, BwryColor::Yellow);

        // Title inside card in Red (Scale 2 = 32px)
        let title_text = if !ctx.fridge_title.is_empty() {
            &ctx.fridge_title
        } else {
            "家庭核心留言板"
        };
        crate::display::font::draw_chinese_text(fb, 56, 92, title_text, BwryColor::Red, 2);

        // Message text in Black (Scale 2 = 32px) with clean card-width wrapping
        let note_text = if ctx.fridge_note.is_empty() {
            "冰箱冷藏室温度良好，记得晚上回家买鲜奶和全麦面包！"
        } else {
            &ctx.fridge_note
        };
        let mut wrapped_note = String::new();
        let mut line_w = 0;
        for c in note_text.chars() {
            if c == '\n' {
                wrapped_note.push(c);
                line_w = 0;
                continue;
            }
            let w = if (c as u32) < 128 { 1 } else { 2 };
            if line_w + w > 38 {
                wrapped_note.push('\n');
                line_w = 0;
            }
            wrapped_note.push(c);
            line_w += w;
        }
        crate::display::font::draw_chinese_text(fb, 56, 136, &wrapped_note, BwryColor::Black, 2);

        // Author in Yellow (bottom right inside card)
        let author_name = if ctx.fridge_author.is_empty() { "爸爸" } else { &ctx.fridge_author };
        let author_str = format!("—— 留言人：{}", author_name);
        let (aw, _) = crate::display::font::measure_text(&author_str, 2);
        let ax = if 700 > aw { 700 - aw } else { 500 };
        crate::display::font::draw_chinese_text(fb, ax, 192, &author_str, BwryColor::Yellow, 2);

        // 3. Clean Bullet Items (Solid filled circle bullets, Scale 2 large text)
        let items: Vec<&str> = if !ctx.memo_text.is_empty() {
            ctx.memo_text.lines().collect()
        } else {
            ctx.memo_items.iter().map(|s| s.as_str()).collect()
        };

        let mut ty = 275;
        let bullet_colors = [BwryColor::Red, BwryColor::Yellow, BwryColor::Black, BwryColor::Black];
        for (idx, item) in items.iter().take(4).enumerate() {
            let col = bullet_colors[idx % bullet_colors.len()];
            // Draw filled circle bullet (radius 9)
            let cx: i32 = 66;
            let cy: i32 = (ty + 15) as i32;
            for dy in -9..=9 {
                for dx in -9..=9 {
                    if dx * dx + dy * dy <= 81 {
                        fb.set_pixel((cx + dx) as usize, (cy + dy) as usize, col);
                    }
                }
            }
            // Item text in Black (Scale 2 = 32px)
            crate::display::font::draw_chinese_text(fb, 96, ty, item, BwryColor::Black, 2);
            ty += 66;
        }

        Ok(())
    }
}

// ── Mode 7: QR Information ───────────────────────────────────────────────────
pub struct QrCodeMode;
impl DisplayMode for QrCodeMode {
    fn id(&self) -> &'static str { "qrcode" }
    fn name(&self) -> &'static str { "动态二维码与分享 (QR Code)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "SMART QR CODE & SHARE", &ctx.date_str);

        // QR frame
        let qrx = 100;
        let qry = 110;
        let qr_box = Rectangle::new(Point::new(qrx, qry), Size::new(260, 260))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Black).stroke_width(3).build());
        let _ = qr_box.draw(fb);

        // Simulated QR pattern (corners + center dots)
        let c1 = Rectangle::new(Point::new(qrx + 20, qry + 20), Size::new(60, 60))
            .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Black).build());
        let _ = c1.draw(fb);
        let c2 = Rectangle::new(Point::new(qrx + 180, qry + 20), Size::new(60, 60))
            .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Black).build());
        let _ = c2.draw(fb);
        let c3 = Rectangle::new(Point::new(qrx + 20, qry + 180), Size::new(60, 60))
            .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Black).build());
        let _ = c3.draw(fb);

        // Right side info
        FontHelper::draw_text(fb, "SCAN TO CONNECT WIFI", 410, 150, BwryColor::Black, FontSize::BoldHeader);
        FontHelper::draw_text(fb, &format!("SSID: {}", ctx.wifi_ssid), 410, 210, BwryColor::Red, FontSize::Large);
        FontHelper::draw_text(fb, "Security: WPA2/WPA3", 410, 260, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_text(fb, &format!("Console: http://{}", ctx.ip_str), 410, 310, BwryColor::Yellow, FontSize::Large);

        draw_bottom_bar(fb, &format!("Scan with phone camera to join | {}", ctx.ip_str));
        Ok(())
    }
}

// ── Mode 8: Countdown ────────────────────────────────────────────────────────
pub struct CountdownMode;
impl DisplayMode for CountdownMode {
    fn id(&self) -> &'static str { "countdown" }
    fn name(&self) -> &'static str { "重要倒计时 (Countdown)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "EVENT COUNTDOWN", &ctx.date_str);

        FontHelper::draw_centered_text(fb, "PROJECT RELEASE MILESTONE", (EPD_WIDTH / 2) as i32, 160, BwryColor::Black, FontSize::Large);
        FontHelper::draw_centered_text(fb, "12", (EPD_WIDTH / 2) as i32, 290, BwryColor::Red, FontSize::BoldHeader);
        FontHelper::draw_centered_text(fb, "DAYS REMAINING", (EPD_WIDTH / 2) as i32, 360, BwryColor::Black, FontSize::Large);

        draw_bottom_bar(fb, &format!("Target: 2026-10-19 | {}", ctx.ip_str));
        Ok(())
    }
}

// ── Mode 9: Habit Heatmap ────────────────────────────────────────────────────
pub struct HabitMode;
impl DisplayMode for HabitMode {
    fn id(&self) -> &'static str { "habit" }
    fn name(&self) -> &'static str { "习惯打卡热力图 (Habit Heatmap)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "HABIT & ACTIVITY HEATMAP (16 WEEKS)", &ctx.date_str);

        let grid_x = 60;
        let grid_y = 120;
        let box_size = 18;
        let spacing = 4;

        for week in 0..16 {
            for day in 0..7 {
                let px = grid_x + (week * (box_size + spacing));
                let py = grid_y + (day * (box_size + spacing));
                let color = if (week * 7 + day) % 3 == 0 {
                    BwryColor::Yellow
                } else if (week * 7 + day) % 5 == 0 {
                    BwryColor::Red
                } else if (week * 7 + day) % 2 == 0 {
                    BwryColor::Black
                } else {
                    BwryColor::White
                };

                let rect = Rectangle::new(Point::new(px, py), Size::new(box_size as u32, box_size as u32))
                    .into_styled(
                        PrimitiveStyleBuilder::new()
                            .fill_color(color)
                            .stroke_color(BwryColor::Black)
                            .stroke_width(1)
                            .build(),
                    );
                let _ = rect.draw(fb);
            }
        }

        FontHelper::draw_text(fb, "Current Streak: 42 Days | 87% Completion Rate", 60, 340, BwryColor::Black, FontSize::Large);
        draw_bottom_bar(fb, "Tap in WebUI or Home Assistant MQTT to Check-In");
        Ok(())
    }
}

// ── Mode 10: Poetry & Quotes ─────────────────────────────────────────────────
pub struct PoetryMode;
impl DisplayMode for PoetryMode {
    fn id(&self) -> &'static str { "poetry" }
    fn name(&self) -> &'static str { "诗词与名言金句 (Poetry & Quotes)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "POETRY & INSPIRATION", &ctx.date_str);

        // Xuan-paper decorative border
        let border = Rectangle::new(Point::new(60, 90), Size::new(648, 380))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Red).stroke_width(2).build());
        let _ = border.draw(fb);

        FontHelper::draw_centered_text(fb, "长风破浪会有时，直挂云帆济沧海。", (EPD_WIDTH / 2) as i32, 210, BwryColor::Black, FontSize::BoldHeader);
        FontHelper::draw_centered_text(fb, "—— 唐 · 李白《行路难》", (EPD_WIDTH / 2) as i32, 280, BwryColor::Red, FontSize::Large);
        FontHelper::draw_centered_text(fb, "无论面对怎样的逆境，心怀希望，终将抵达彼岸。", (EPD_WIDTH / 2) as i32, 360, BwryColor::Black, FontSize::Medium);

        draw_bottom_bar(fb, "Daily Classical Chinese Poetry Collection");
        Ok(())
    }
}

// ── Mode 11: This Day in History ─────────────────────────────────────────────
pub struct HistoryMode;
impl DisplayMode for HistoryMode {
    fn id(&self) -> &'static str { "history" }
    fn name(&self) -> &'static str { "历史上的今天 (This Day in History)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "THIS DAY IN HISTORY", &ctx.date_str);

        let events = [
            ("1959", "Soviet space probe Luna 3 transmits first-ever photos of Moon's far side"),
            ("1985", "First ocean expedition discovers RMS Titanic wreckage in North Atlantic"),
            ("2008", "Asteroid 2008 TC3 observed and tracked prior to entering Earth's atmosphere"),
            ("2020", "Nobel Prize in Chemistry awarded for CRISPR-Cas9 genome editing discovery"),
        ];

        let mut y = 110;
        for (year, desc) in events.iter() {
            let y_tag = Rectangle::new(Point::new(50, y - 20), Size::new(80, 28))
                .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Red).build());
            let _ = y_tag.draw(fb);
            FontHelper::draw_centered_text(fb, year, 90, y, BwryColor::White, FontSize::Medium);

            FontHelper::draw_text(fb, desc, 145, y, BwryColor::Black, FontSize::Large);

            y += 85;
        }

        draw_bottom_bar(fb, &format!("Historical Milestones | {}", ctx.ip_str));
        Ok(())
    }
}

// ── Mode 12: Life Progress Bar ───────────────────────────────────────────────
pub struct LifeProgressBarMode;
impl DisplayMode for LifeProgressBarMode {
    fn id(&self) -> &'static str { "life_progress" }
    fn name(&self) -> &'static str { "人生/年度进度条 (Life Bar)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "TIME & PROGRESS VISUALIZER", &ctx.date_str);

        // Year progress
        FontHelper::draw_text(fb, "YEAR 2026 PROGRESS: 76.4%", 60, 130, BwryColor::Black, FontSize::Large);
        let y_bar_bg = Rectangle::new(Point::new(60, 150), Size::new(640, 24))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Black).stroke_width(2).build());
        let _ = y_bar_bg.draw(fb);
        let y_bar_fill = Rectangle::new(Point::new(62, 152), Size::new((636.0 * 0.764) as u32, 20))
            .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Red).build());
        let _ = y_bar_fill.draw(fb);

        // Month progress
        FontHelper::draw_text(fb, "OCTOBER PROGRESS: 22.5%", 60, 230, BwryColor::Black, FontSize::Large);
        let m_bar_bg = Rectangle::new(Point::new(60, 250), Size::new(640, 24))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Black).stroke_width(2).build());
        let _ = m_bar_bg.draw(fb);
        let m_bar_fill = Rectangle::new(Point::new(62, 252), Size::new((636.0 * 0.225) as u32, 20))
            .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Yellow).build());
        let _ = m_bar_fill.draw(fb);

        // Day progress
        FontHelper::draw_text(fb, "TODAY PROGRESS: 50.0%", 60, 330, BwryColor::Black, FontSize::Large);
        let d_bar_bg = Rectangle::new(Point::new(60, 350), Size::new(640, 24))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Black).stroke_width(2).build());
        let _ = d_bar_bg.draw(fb);
        let d_bar_fill = Rectangle::new(Point::new(62, 352), Size::new((636.0 * 0.50) as u32, 20))
            .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Black).build());
        let _ = d_bar_fill.draw(fb);

        draw_bottom_bar(fb, "Stay calm and focused on what matters most.");
        Ok(())
    }
}

// ── Mode 13: Moon Phase ──────────────────────────────────────────────────────
pub struct MoonPhaseMode;
impl DisplayMode for MoonPhaseMode {
    fn id(&self) -> &'static str { "moon_phase" }
    fn name(&self) -> &'static str { "天文月相精准测算 (Moon Phase)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "ASTRONOMICAL MOON PHASE", &ctx.date_str);

        // Center Moon Disc
        let cx = 200;
        let cy = 270;
        let r = 110;
        let moon_bg = Circle::new(Point::new(cx - r, cy - r), (r * 2) as u32)
            .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::Yellow).stroke_color(BwryColor::Black).stroke_width(3).build());
        let _ = moon_bg.draw(fb);

        // Waning crescent shadow (simulated)
        let shadow = Circle::new(Point::new(cx - r - 40, cy - r), (r * 2) as u32)
            .into_styled(PrimitiveStyleBuilder::new().fill_color(BwryColor::White).build());
        let _ = shadow.draw(fb);

        // Right details
        FontHelper::draw_text(fb, "WAXING GIBBOUS (盈凸月)", 380, 160, BwryColor::Black, FontSize::BoldHeader);
        FontHelper::draw_text(fb, "Moon Age: 26.8 Days (农历廿七)", 380, 220, BwryColor::Red, FontSize::Large);
        FontHelper::draw_text(fb, "Illumination: 11.4% Visible", 380, 270, BwryColor::Black, FontSize::Large);
        FontHelper::draw_text(fb, "Next Full Moon: in 18 Days", 380, 320, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_text(fb, "Calculated via Conway's Lunar Ephemeris", 380, 370, BwryColor::Black, FontSize::Small);

        draw_bottom_bar(fb, &format!("Conway Algorithm Lunar Calculator | {}", ctx.ip_str));
        Ok(())
    }
}

// ── Mode 14: Daily Routine Timeline ──────────────────────────────────────────
pub struct DailyRoutineMode;
impl DisplayMode for DailyRoutineMode {
    fn id(&self) -> &'static str { "daily_routine" }
    fn name(&self) -> &'static str { "早中晚家庭作息 (Daily Routine)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "DAILY ROUTINE & TIMELINE", &ctx.date_str);

        let routines = [
            ("07:00 - 08:30", "Morning Routine, Breakfast & News", BwryColor::Yellow),
            ("09:00 - 12:00", "Deep Focus Work & Engineering Sprint", BwryColor::Red),
            ("14:00 - 18:00", "Team Collaboration, Review & Planning", BwryColor::Black),
            ("19:00 - 22:30", "Family Dinner, Leisure & Reading", BwryColor::Yellow),
        ];

        let mut y = 110;
        for (time, title, color) in routines.iter() {
            let card = Rectangle::new(Point::new(50, y - 25), Size::new(668, 65))
                .into_styled(PrimitiveStyleBuilder::new().stroke_color(*color).stroke_width(2).build());
            let _ = card.draw(fb);

            FontHelper::draw_text(fb, time, 70, y + 10, *color, FontSize::Large);
            FontHelper::draw_text(fb, title, 250, y + 10, BwryColor::Black, FontSize::Large);

            y += 85;
        }

        draw_bottom_bar(fb, "Automated Time-Segmented Daily Schedule");
        Ok(())
    }
}

// ── Mode 15: Shopping List ───────────────────────────────────────────────────
pub struct ShoppingListMode;
impl DisplayMode for ShoppingListMode {
    fn id(&self) -> &'static str { "shopping" }
    fn name(&self) -> &'static str { "家庭共享购物清单 (Shopping List)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "FAMILY GROCERY & SHOPPING LIST", &ctx.date_str);

        let left_items = ["• 牛奶 (Fresh Milk) x 2", "• 鸡蛋 (Free-range Eggs)", "• 西红柿与青菜 (Vegetables)", "• 全麦面包 (Whole Wheat Toast)"];
        let right_items = ["• 3D 打印耗材 PLA (Black)", "• 7号碱性电池 (AAA Batteries)", "• 咖啡豆 (Arabica Medium)", "• 厨房纸巾 (Paper Towels)"];

        FontHelper::draw_text(fb, "🥬 生鲜食品 (Fresh & Food)", 50, 110, BwryColor::Red, FontSize::Large);
        let mut y = 160;
        for item in left_items.iter() {
            FontHelper::draw_text(fb, item, 60, y, BwryColor::Black, FontSize::Medium);
            y += 50;
        }

        let divider = Line::new(Point::new(384, 80), Point::new(384, 460))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Yellow).stroke_width(2).build());
        let _ = divider.draw(fb);

        FontHelper::draw_text(fb, "📦 日用百货 (Household & Tech)", 420, 110, BwryColor::Black, FontSize::Large);
        let mut y = 160;
        for item in right_items.iter() {
            FontHelper::draw_text(fb, item, 430, y, BwryColor::Black, FontSize::Medium);
            y += 50;
        }

        draw_bottom_bar(fb, "Sync via Mobile Browser or Home Assistant");
        Ok(())
    }
}

// ── Mode 16: Care Reminders ──────────────────────────────────────────────────
pub struct CareRemindersMode;
impl DisplayMode for CareRemindersMode {
    fn id(&self) -> &'static str { "care_reminders" }
    fn name(&self) -> &'static str { "植物养护与服药提醒 (Care Reminders)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "CARE & HEALTH REMINDERS", &ctx.date_str);

        // Plant watering card
        let p_card = Rectangle::new(Point::new(40, 80), Size::new(330, 380))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Black).stroke_width(2).build());
        let _ = p_card.draw(fb);
        FontHelper::draw_centered_text(fb, "PLANT CARE (植物浇水)", 205, 120, BwryColor::Red, FontSize::Large);
        FontHelper::draw_text(fb, "• 绿萝 (Pothos): 今日已浇水", 60, 180, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_text(fb, "• 琴叶榕 (Fiddle Leaf): 2天后", 60, 240, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_text(fb, "• 多肉 (Succulents): 8天后", 60, 300, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_text(fb, "【状态】土壤适度湿润", 60, 380, BwryColor::Yellow, FontSize::Large);

        // Medicine card
        let m_card = Rectangle::new(Point::new(398, 80), Size::new(330, 380))
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Black).stroke_width(2).build());
        let _ = m_card.draw(fb);
        FontHelper::draw_centered_text(fb, "HEALTH CARE (健康服药)", 563, 120, BwryColor::Black, FontSize::Large);
        FontHelper::draw_text(fb, "• 维生素C + B族: 晨间随餐", 420, 180, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_text(fb, "• 鱼油 (Omega-3): 午间随餐", 420, 240, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_text(fb, "• 褪黑素 / 钙片: 睡前半小时", 420, 300, BwryColor::Black, FontSize::Medium);
        FontHelper::draw_text(fb, "【提醒】规律作息 多喝水", 420, 380, BwryColor::Red, FontSize::Large);

        draw_bottom_bar(fb, &format!("Daily Care Schedule | {}", ctx.ip_str));
        Ok(())
    }
}

// ── Mode 17: Pomodoro Board ──────────────────────────────────────────────────
pub struct PomodoroMode;
impl DisplayMode for PomodoroMode {
    fn id(&self) -> &'static str { "pomodoro" }
    fn name(&self) -> &'static str { "番茄钟专注看板 (Pomodoro Board)" }
    fn render(&self, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        fb.clear_color(BwryColor::White);
        draw_top_banner(fb, "POMODORO FOCUS BOARD", &ctx.date_str);

        // Big countdown circle
        let cx = (EPD_WIDTH / 2) as i32;
        let cy = 250;
        let r = 110;
        let ring = Circle::new(Point::new(cx - r, cy - r), (r * 2) as u32)
            .into_styled(PrimitiveStyleBuilder::new().stroke_color(BwryColor::Red).stroke_width(8).build());
        let _ = ring.draw(fb);

        FontHelper::draw_centered_text(fb, "25:00", cx, cy + 18, BwryColor::Red, FontSize::BoldHeader);
        FontHelper::draw_centered_text(fb, "DEEP FOCUS SPRINT", cx, cy + 85, BwryColor::Black, FontSize::Large);

        FontHelper::draw_centered_text(fb, "Target: Rust Firmware EPD Driver Integration", cx, 420, BwryColor::Black, FontSize::Medium);

        draw_bottom_bar(fb, "Stay focused, eliminate distractions.");
        Ok(())
    }
}

/// Master Mode Dispatcher
pub fn render_mode(mode_id: &str, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
    match mode_id {
        "memo" => MemoMode.render(fb, ctx),
        "calendar" => CalendarMode.render(fb, ctx),
        "photo" => PhotoFrameMode.render(fb, ctx),
        "weather" => WeatherMode.render(fb, ctx),
        "rss" => RssMode.render(fb, ctx),
        "fridge_board" => FridgeBoardMode.render(fb, ctx),
        "qrcode" => QrCodeMode.render(fb, ctx),
        "countdown" => CountdownMode.render(fb, ctx),
        "habit" => HabitMode.render(fb, ctx),
        "poetry" => PoetryMode.render(fb, ctx),
        "history" => HistoryMode.render(fb, ctx),
        "life_progress" => LifeProgressBarMode.render(fb, ctx),
        "moon_phase" => MoonPhaseMode.render(fb, ctx),
        "daily_routine" => DailyRoutineMode.render(fb, ctx),
        "shopping" => ShoppingListMode.render(fb, ctx),
        "care_reminders" => CareRemindersMode.render(fb, ctx),
        "pomodoro" => PomodoroMode.render(fb, ctx),
        "demo" | "workspace" => {
            demo_layout::render_demo_layout(fb, ctx);
            Ok(())
        }
        "custom" => {
            if let Some(ref json) = ctx.custom_layout_json {
                custom_layout::CustomLayoutRenderer::render_json(json, fb, ctx)
            } else {
                demo_layout::render_demo_layout(fb, ctx);
                Ok(())
            }
        }
        _ => {
            demo_layout::render_demo_layout(fb, ctx);
            Ok(())
        }
    }
}
