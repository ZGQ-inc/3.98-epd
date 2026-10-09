// src/modes/custom_layout.rs — Custom Layout JSON Interpreter & Vector Renderer

use embedded_graphics::{
    prelude::*,
    primitives::{Circle, Line, PrimitiveStyleBuilder, Rectangle},
};
use log::info;
use serde::{Deserialize, Serialize};

use crate::display::{
    color::BwryColor,
    font::{FontHelper, FontSize},
    framebuffer::Framebuffer,
};
use crate::modes::ModeContext;

#[derive(Serialize, Deserialize, Debug)]
pub struct LayoutDocument {
    pub version: Option<serde_json::Value>,
    pub components: Option<Vec<LayoutComponent>>,
    // Fabric.js native format compatibility
    pub objects: Option<Vec<FabricObject>>,
    pub background: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LayoutComponent {
    pub id: String,
    pub r#type: String,
    pub x: i32,
    pub y: i32,
    pub w: Option<u32>,
    pub h: Option<u32>,
    pub color: Option<String>,
    pub text: Option<String>,
    pub font_size: Option<u32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FabricObject {
    pub r#type: String,
    pub left: Option<f64>,
    pub top: Option<f64>,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub scale_x: Option<f64>,
    pub scale_y: Option<f64>,
    pub text: Option<String>,
    pub fill: Option<serde_json::Value>,
    pub stroke: Option<serde_json::Value>,
    pub stroke_width: Option<f64>,
    pub font_size: Option<f64>,
    pub x1: Option<f64>,
    pub y1: Option<f64>,
    pub x2: Option<f64>,
    pub y2: Option<f64>,
    pub objects: Option<Vec<FabricObject>>,
}

pub struct CustomLayoutRenderer;

impl CustomLayoutRenderer {
    /// Renders custom layout JSON onto the 768x552 framebuffer
    pub fn render_json(json_str: &str, fb: &mut Framebuffer, ctx: &ModeContext) -> anyhow::Result<()> {
        // ALWAYS clear canvas to White background before rendering layout!
        fb.clear_color(BwryColor::White);

        let doc: LayoutDocument = match serde_json::from_str(json_str) {
            Ok(d) => d,
            Err(e) => {
                log::warn!("[LAYOUT] JSON parse error: {:?}. Showing fallback.", e);
                FontHelper::draw_text(fb, "Layout JSON Parse Error", 40, 50, BwryColor::Red, FontSize::Large);
                return Err(e.into());
            }
        };

        // If background color is specified in doc, apply it
        if let Some(ref bg) = doc.background {
            if let Some(bg_color) = Self::parse_color_from_value(Some(bg)) {
                fb.clear_color(bg_color);
            }
        }

        // 1. Handle Fabric.js objects
        if let Some(ref objs) = doc.objects {
            info!("[LAYOUT] Rendering {} Fabric.js objects...", objs.len());
            for obj in objs {
                Self::render_fabric_object(obj, 0, 0, fb, ctx);
            }
            return Ok(());
        }

        // 2. Handle structured components
        if let Some(ref comps) = doc.components {
            info!("[LAYOUT] Rendering {} custom components...", comps.len());
            for comp in comps {
                Self::render_component(comp, fb, ctx);
            }
        }

        Ok(())
    }

    fn render_fabric_object(obj: &FabricObject, offset_x: i32, offset_y: i32, fb: &mut Framebuffer, ctx: &ModeContext) {
        let left = obj.left.unwrap_or(0.0) as i32 + offset_x;
        let top = obj.top.unwrap_or(0.0) as i32 + offset_y;
        let scale_x = obj.scale_x.unwrap_or(1.0);
        let scale_y = obj.scale_y.unwrap_or(1.0);

        match obj.r#type.as_str() {
            "group" => {
                if let Some(ref sub_objs) = obj.objects {
                    for sub in sub_objs {
                        Self::render_fabric_object(sub, left, top, fb, ctx);
                    }
                }
            }
            "text" | "i-text" | "textbox" => {
                if let Some(ref t) = obj.text {
                    let color = Self::parse_color_from_value(obj.fill.as_ref())
                        .or_else(|| Self::parse_color_from_value(obj.stroke.as_ref()))
                        .unwrap_or(BwryColor::Black);
                    let font_size = obj.font_size.unwrap_or(18.0) * scale_y;
                    let size = if font_size > 28.0 {
                        FontSize::BoldHeader
                    } else if font_size > 22.0 {
                        FontSize::Large
                    } else if font_size > 14.0 {
                        FontSize::Medium
                    } else {
                        FontSize::Small
                    };
                    FontHelper::draw_text(fb, t, left, top + 20, color, size);
                }
            }
            "line" => {
                let stroke_color = Self::parse_color_from_value(obj.stroke.as_ref())
                    .or_else(|| Self::parse_color_from_value(obj.fill.as_ref()))
                    .unwrap_or(BwryColor::Black);
                let sw = (obj.stroke_width.unwrap_or(1.0) * scale_y).round().max(1.0) as u32;

                // Fabric.js lines store x1,y1,x2,y2 relative to the line's center
                let w = obj.width.unwrap_or(0.0);
                let h = obj.height.unwrap_or(0.0);
                let cx = left as f64 + (w * scale_x) / 2.0;
                let cy = top as f64 + (h * scale_y) / 2.0;

                let (x1, y1, x2, y2) = if let (Some(ox1), Some(oy1), Some(ox2), Some(oy2)) = (obj.x1, obj.y1, obj.x2, obj.y2) {
                    let x1 = (cx + ox1 * scale_x).round() as i32;
                    let y1 = (cy + oy1 * scale_y).round() as i32;
                    let x2 = (cx + ox2 * scale_x).round() as i32;
                    let y2 = (cy + oy2 * scale_y).round() as i32;
                    (x1, y1, x2, y2)
                } else {
                    (left, top, left + (w * scale_x).round() as i32, top + (h * scale_y).round() as i32)
                };

                let line = Line::new(Point::new(x1, y1), Point::new(x2, y2))
                    .into_styled(PrimitiveStyleBuilder::new().stroke_color(stroke_color).stroke_width(sw).build());
                let _ = line.draw(fb);
            }
            "rect" => {
                let w = (obj.width.unwrap_or(50.0) * scale_x).round().max(1.0) as u32;
                let h = (obj.height.unwrap_or(50.0) * scale_y).round().max(1.0) as u32;

                let fill_color = Self::parse_color_from_value(obj.fill.as_ref());
                let stroke_color = Self::parse_color_from_value(obj.stroke.as_ref());
                let stroke_width = (obj.stroke_width.unwrap_or(0.0) * scale_y).round() as u32;

                let mut builder = PrimitiveStyleBuilder::new();
                if let Some(fc) = fill_color {
                    builder = builder.fill_color(fc);
                }
                if let Some(sc) = stroke_color {
                    if stroke_width > 0 {
                        builder = builder.stroke_color(sc).stroke_width(stroke_width);
                    }
                }
                let rect = Rectangle::new(Point::new(left, top), Size::new(w, h))
                    .into_styled(builder.build());
                let _ = rect.draw(fb);
            }
            "circle" => {
                let r = (obj.width.unwrap_or(40.0) * scale_x / 2.0).round().max(1.0) as u32;
                let fill_color = Self::parse_color_from_value(obj.fill.as_ref());
                let stroke_color = Self::parse_color_from_value(obj.stroke.as_ref());
                let stroke_width = (obj.stroke_width.unwrap_or(0.0) * scale_y).round() as u32;

                let mut builder = PrimitiveStyleBuilder::new();
                if let Some(fc) = fill_color {
                    builder = builder.fill_color(fc);
                }
                if let Some(sc) = stroke_color {
                    if stroke_width > 0 {
                        builder = builder.stroke_color(sc).stroke_width(stroke_width);
                    }
                }
                let circle = Circle::new(Point::new(left, top), r * 2)
                    .into_styled(builder.build());
                let _ = circle.draw(fb);
            }
            _ => {}
        }
    }

    fn render_component(comp: &LayoutComponent, fb: &mut Framebuffer, ctx: &ModeContext) {
        let color = Self::parse_color(comp.color.as_deref());
        match comp.r#type.as_str() {
            "text" => {
                if let Some(ref t) = comp.text {
                    let size = if comp.font_size.unwrap_or(18) > 24 { FontSize::Large } else { FontSize::Medium };
                    FontHelper::draw_text(fb, t, comp.x, comp.y, color, size);
                }
            }
            "divider" => {
                let w = comp.w.unwrap_or(700);
                let line = Line::new(Point::new(comp.x, comp.y), Point::new(comp.x + w as i32, comp.y))
                    .into_styled(PrimitiveStyleBuilder::new().stroke_color(color).stroke_width(2).build());
                let _ = line.draw(fb);
            }
            "weather_current" => {
                FontHelper::draw_text(fb, &ctx.temp_str, comp.x, comp.y, BwryColor::Red, FontSize::BoldHeader);
                FontHelper::draw_text(fb, &ctx.weather_desc, comp.x, comp.y + 35, color, FontSize::Medium);
            }
            "datetime" => {
                FontHelper::draw_text(fb, &format!("{} {}", ctx.date_str, ctx.weekday_str), comp.x, comp.y, color, FontSize::Large);
            }
            _ => {}
        }
    }

    fn parse_color(hex: Option<&str>) -> BwryColor {
        hex.and_then(Self::parse_color_str).unwrap_or(BwryColor::Black)
    }

    fn parse_color_from_value(val: Option<&serde_json::Value>) -> Option<BwryColor> {
        let v = val?;
        if let Some(s) = v.as_str() {
            Self::parse_color_str(s)
        } else {
            None
        }
    }

    fn parse_color_str(hex: &str) -> Option<BwryColor> {
        let s = hex.trim();
        if s.is_empty() || s.eq_ignore_ascii_case("transparent") || s.eq_ignore_ascii_case("none") {
            return None;
        }

        // Handle rgb(...) or rgba(...)
        if s.starts_with("rgb") {
            let inner = s.trim_start_matches("rgba(").trim_start_matches("rgb(").trim_end_matches(')');
            let parts: Vec<&str> = inner.split(',').map(|p| p.trim()).collect();
            if parts.len() >= 3 {
                let r: u8 = parts[0].parse().unwrap_or(0);
                let g: u8 = parts[1].parse().unwrap_or(0);
                let b: u8 = parts[2].parse().unwrap_or(0);
                return Some(Self::quantize_rgb(r, g, b));
            }
        }

        let hex_part = s.strip_prefix('#').unwrap_or(s);
        if hex_part.len() == 6 {
            let r = u8::from_str_radix(&hex_part[0..2], 16).ok()?;
            let g = u8::from_str_radix(&hex_part[2..4], 16).ok()?;
            let b = u8::from_str_radix(&hex_part[4..6], 16).ok()?;
            Some(Self::quantize_rgb(r, g, b))
        } else if hex_part.len() == 3 {
            let r = u8::from_str_radix(&hex_part[0..1], 16).ok()? * 17;
            let g = u8::from_str_radix(&hex_part[1..2], 16).ok()? * 17;
            let b = u8::from_str_radix(&hex_part[2..3], 16).ok()? * 17;
            Some(Self::quantize_rgb(r, g, b))
        } else if s.eq_ignore_ascii_case("red") {
            Some(BwryColor::Red)
        } else if s.eq_ignore_ascii_case("yellow") {
            Some(BwryColor::Yellow)
        } else if s.eq_ignore_ascii_case("white") {
            Some(BwryColor::White)
        } else if s.eq_ignore_ascii_case("black") {
            Some(BwryColor::Black)
        } else {
            None
        }
    }

    fn quantize_rgb(r: u8, g: u8, b: u8) -> BwryColor {
        if r > 200 && g > 200 && b > 200 {
            BwryColor::White
        } else if r > 160 && g > 140 && b < 120 {
            BwryColor::Yellow
        } else if r > 150 && g < 100 && b < 100 {
            BwryColor::Red
        } else {
            BwryColor::Black
        }
    }
}
