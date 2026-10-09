// src/web/assets.rs — Embedded WebUI assets (gzip-compressed for rapid transfer)

pub static INDEX_HTML_GZ: &[u8] = include_bytes!("../../web_assets/index.html.gz");
pub static CAPTIVE_HTML: &[u8] = include_bytes!("../../web_assets/captive.html");
pub static PWA_HTML_GZ: &[u8] = include_bytes!("../../web_assets/pwa.html.gz");
pub static MANIFEST_JSON: &[u8] = include_bytes!("../../web_assets/manifest.json");
pub static SW_JS: &[u8] = include_bytes!("../../web_assets/sw.js");
